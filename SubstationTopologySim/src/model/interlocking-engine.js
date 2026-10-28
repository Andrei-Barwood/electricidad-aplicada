/**
 * InterlockingEngine - SubstationTopologySim
 * Motor de enclavamientos mecánicos y eléctricos para seguridad operacional (IEC 62271-102 / IEEE C37.100).
 * Impide maniobras indebidas (como apertura de seccionadores bajo carga) y valida secuencias de maniobra.
 */

import { ComponentType, OperationalState } from './components.js';
import { EventSeverity } from './sequence-of-events.js';

export const InterlockRuleCodes = Object.freeze({
  DISCONNECTOR_UNDER_LOAD: 'R1_DISCONNECTOR_UNDER_LOAD',
  LOTO_LOCKOUT: 'R2_LOTO_LOCKOUT',
  CIRCUIT_BREAKER_SAFE_SEQUENCE: 'R3_SAFE_SEQUENCE',
  OVERRIDE_ACTIVE: 'R4_OVERRIDE_WARNING'
});

export class InterlockingEngine {
  /**
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('./sequence-of-events.js').SequenceOfEvents} soe
   */
  constructor(eventBus, soe) {
    this.eventBus = eventBus;
    this.soe = soe;
    this.enabled = true; // Por defecto los enclavamientos están 100% activos
  }

  /**
   * Habilita o deshabilita los enclavamientos (Modo Normal vs Modo Desbloqueo / Bypass de Emergencia).
   * @param {boolean} [state]
   * @returns {boolean}
   */
  setInterlockingEnabled(state) {
    this.enabled = typeof state === 'boolean' ? state : !this.enabled;

    this.soe?.log({
      severity: this.enabled ? EventSeverity.INFO : EventSeverity.ALARM,
      message: this.enabled
        ? 'Enclavamientos de seguridad ACTIVADOS en modo estándar.'
        : '¡ALERTA! Enclavamientos de seguridad DESACTIVADOS (Modo Bypass de Emergencia activo).'
    });

    this.eventBus?.emit('interlocking:toggled', { enabled: this.enabled });
    return this.enabled;
  }

  /**
   * Evalúa si una maniobra sobre un equipo está permitida por las reglas de seguridad.
   * @param {string} componentId
   * @param {string} targetState
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @returns {{
   *   allowed: boolean,
   *   ruleCode: string|null,
   *   reason: string,
   *   isOverride: boolean,
   *   warning: string|null
   * }}
   */
  canOperate(componentId, targetState, networkModel) {
    const comp = networkModel.getComponent(componentId);
    if (!comp) {
      return {
        allowed: false,
        ruleCode: null,
        reason: `Equipo '${componentId}' no encontrado en el modelo.`,
        isOverride: false,
        warning: null
      };
    }

    // Sin cambio de estado
    if (comp.operationalState === targetState) {
      return {
        allowed: true,
        ruleCode: null,
        reason: `El equipo ya se encuentra en estado ${targetState}.`,
        isOverride: false,
        warning: null
      };
    }

    // Regla LOTO: Si el equipo está bajo consignación (OUT_OF_SERVICE)
    if (comp.operationalState === OperationalState.OUT_OF_SERVICE && targetState === OperationalState.CLOSED) {
      if (this.enabled) {
        return {
          allowed: false,
          ruleCode: InterlockRuleCodes.LOTO_LOCKOUT,
          reason: `Maniobra bloqueada: '${comp.name}' se encuentra consignado en mantenimiento (LOTO). Retire primero el bloqueo de seguridad.`,
          isOverride: false,
          warning: null
        };
      }
    }

    // Regla de Seccionadores: No operar (abrir ni cerrar) bajo carga o con interruptor cerrado
    if (comp.type === ComponentType.DISCONNECTOR) {
      const seriesBreakers = this.findSeriesBreakers(comp, networkModel);
      const closedBreaker = seriesBreakers.find(cb => cb.operationalState === OperationalState.CLOSED);

      if (closedBreaker) {
        // Si el interruptor asociado en la bahía está cerrado y hay potencial/energía
        const isLiveOrConnected = comp.isEnergized || closedBreaker.isEnergized;

        if (isLiveOrConnected) {
          const actionText = targetState === OperationalState.OPEN ? 'la apertura' : 'el cierre';
          const ruleMsg = `Enclavamiento Eléctrico (IEC 62271-102): Se bloquea ${actionText} del seccionador '${comp.name}' porque el interruptor de potencia asociado '${closedBreaker.name}' está CERRADO [I] bajo carga. Abra primero el interruptor.`;

          if (this.enabled) {
            return {
              allowed: false,
              ruleCode: InterlockRuleCodes.DISCONNECTOR_UNDER_LOAD,
              reason: ruleMsg,
              isOverride: false,
              warning: null
            };
          } else {
            return {
              allowed: true,
              ruleCode: InterlockRuleCodes.OVERRIDE_ACTIVE,
              reason: 'Maniobra forzada con bypass de enclavamiento.',
              isOverride: true,
              warning: `¡PELIGRO DE ARCO ELÉCTRICO! Seccionador '${comp.name}' conmutado con interruptor '${closedBreaker.name}' cerrado.`
            };
          }
        }
      }
    }

    // Si es interruptor de potencia (CIRCUIT_BREAKER):
    // El interruptor siempre puede abrir bajo carga para despejar o aislar
    return {
      allowed: true,
      ruleCode: null,
      reason: 'Condiciones de enclavamiento satisfechas.',
      isOverride: false,
      warning: null
    };
  }

  /**
   * Ejecuta una maniobra validada y la registra en la secuencia de eventos (SOE).
   * @param {string} componentId
   * @param {string} targetState
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @param {Object} [options]
   * @returns {{
   *   success: boolean,
   *   blocked: boolean,
   *   reason: string,
   *   component: Object|null,
   *   isOverride: boolean
   * }}
   */
  executeSwitching(componentId, targetState, networkModel, options = {}) {
    const comp = networkModel.getComponent(componentId);
    if (!comp) {
      return { success: false, blocked: false, reason: 'Equipo no existe', component: null, isOverride: false };
    }

    const check = this.canOperate(componentId, targetState, networkModel);
    const prevState = comp.operationalState;

    if (!check.allowed) {
      // Registrar bloqueo en SOE
      this.soe?.log({
        componentId: comp.id,
        componentName: comp.name,
        componentType: comp.type,
        previousState: prevState,
        newState: targetState,
        severity: EventSeverity.BLOCKED,
        message: check.reason,
        ruleCode: check.ruleCode,
        isInterlocked: true
      });

      this.eventBus?.emit('interlocking:blocked', {
        component: comp,
        targetState,
        reason: check.reason,
        ruleCode: check.ruleCode
      });

      return {
        success: false,
        blocked: true,
        reason: check.reason,
        ruleCode: check.ruleCode,
        component: comp,
        isOverride: false
      };
    }

    // Ejecutar maniobra en el modelo
    networkModel.updateComponent(componentId, { operationalState: targetState });

    // Determinar severidad de registro
    const severity = check.isOverride 
      ? EventSeverity.ALARM 
      : (targetState === OperationalState.CLOSED ? EventSeverity.SUCCESS : EventSeverity.INFO);

    const logMsg = check.warning 
      ? `${check.warning}` 
      : `Maniobra exitosa: '${comp.name}' conmutó de ${prevState} a ${targetState}.`;

    this.soe?.log({
      componentId: comp.id,
      componentName: comp.name,
      componentType: comp.type,
      previousState: prevState,
      newState: targetState,
      severity,
      message: logMsg,
      ruleCode: check.ruleCode,
      isInterlocked: false
    });

    this.eventBus?.emit('interlocking:operated', {
      component: comp,
      previousState: prevState,
      newState: targetState,
      isOverride: check.isOverride
    });

    return {
      success: true,
      blocked: false,
      reason: logMsg,
      component: comp,
      isOverride: check.isOverride
    };
  }

  /**
   * Alterna el estado de un equipo (OPEN <-> CLOSED).
   * @param {string} componentId
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @returns {Object}
   */
  toggleComponent(componentId, networkModel) {
    const comp = networkModel.getComponent(componentId);
    if (!comp) return { success: false, reason: 'Equipo no existe' };

    const target = comp.operationalState === OperationalState.CLOSED 
      ? OperationalState.OPEN 
      : OperationalState.CLOSED;

    return this.executeSwitching(componentId, target, networkModel);
  }

  /**
   * Localiza interruptores de potencia asociados en serie dentro de la misma bahía (hasta 2 ramas de distancia).
   * @param {Object} disconnector
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @returns {Array<Object>}
   */
  findSeriesBreakers(disconnector, networkModel) {
    const results = new Set();
    const visitedCompIds = new Set([disconnector.id]);

    const queue = [{ compId: disconnector.id, depth: 0 }];

    while (queue.length > 0) {
      const { compId, depth } = queue.shift();
      if (depth >= 3) continue;

      const conns = networkModel.getConnectionsForComponent(compId);
      for (const conn of conns) {
        const neighborId = conn.fromComponentId === compId ? conn.toComponentId : conn.fromComponentId;
        if (visitedCompIds.has(neighborId)) continue;
        visitedCompIds.add(neighborId);

        const neighborComp = networkModel.getComponent(neighborId);
        if (!neighborComp) continue;

        if (neighborComp.type === ComponentType.CIRCUIT_BREAKER) {
          results.add(neighborComp);
        } else if (neighborComp.type === ComponentType.DISCONNECTOR) {
          // Si es otro seccionador contiguo, continuar explorando la bahía
          queue.push({ compId: neighborId, depth: depth + 1 });
        }
      }
    }

    return Array.from(results);
  }
}
