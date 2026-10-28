/**
 * TopologyValidator - SubstationTopologySim
 * Motor de validación topológica y propagación de energización por recorrido en grafo.
 * Determina el estado eléctrico real (energizado vs desenergizado) a partir de fuentes activas.
 */

import { ComponentType, OperationalState } from './components.js';

export class TopologyValidator {
  /**
   * Ejecuta el análisis topológico completo de la red.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @returns {{
   *   energizedComponentIds: Set<string>,
   *   energizedConnectionIds: Set<string>,
   *   energizedTerminalIds: Set<string>,
   *   isolatedComponentIds: Set<string>,
   *   unsuppliedLoads: Array<Object>,
   *   suppliedLoads: Array<Object>,
   *   warnings: Array<Object>,
   *   errors: Array<Object>
   * }}
   */
  static analyze(networkModel) {
    const components = networkModel.getAllComponents();
    const connections = networkModel.getAllConnections();

    const warnings = [];
    const errors = [];

    // Mapa rápido de terminales a componente
    const terminalToComponent = new Map();
    for (const comp of components) {
      for (const term of comp.terminals) {
        terminalToComponent.set(term.id, {
          componentId: comp.id,
          component: comp,
          terminal: term
        });
      }
    }

    // 1. Validaciones estructurales básicas de conexiones
    const adjacency = new Map(); // terminalId -> Set<{ toTerminalId, connectionId }>
    const connectionMap = new Map(); // connectionId -> connection

    for (const termId of terminalToComponent.keys()) {
      adjacency.set(termId, new Set());
    }

    for (const conn of connections) {
      connectionMap.set(conn.id, conn);

      const fromData = terminalToComponent.get(conn.fromTerminalId);
      const toData = terminalToComponent.get(conn.toTerminalId);

      if (!fromData || !toData) {
        errors.push({
          type: 'ORPHAN_CONNECTION',
          connectionId: conn.id,
          message: `La conexión '${conn.id}' referencia un terminal inexistente.`
        });
        continue;
      }

      // Validación de niveles de tensión entre terminales conectados
      const vFrom = fromData.component.properties?.voltageLevel;
      const vTo = toData.component.properties?.voltageLevel;

      // Si ninguno es transformador y ambos tienen tensión definida, deben coincidir
      const isTransformerInvolved = fromData.component.type === ComponentType.TRANSFORMER || 
                                     toData.component.type === ComponentType.TRANSFORMER;

      if (!isTransformerInvolved && vFrom && vTo && vFrom !== vTo) {
        warnings.push({
          type: 'VOLTAGE_MISMATCH',
          connectionId: conn.id,
          message: `Divergencia de tensión en conexión '${conn.id}': ${fromData.component.name} (${vFrom} kV) conectado a ${toData.component.name} (${vTo} kV) sin transformador.`
        });
      }

      adjacency.get(conn.fromTerminalId)?.add({ toTerminalId: conn.toTerminalId, connectionId: conn.id });
      adjacency.get(conn.toTerminalId)?.add({ toTerminalId: conn.fromTerminalId, connectionId: conn.id });
    }

    // 2. Propagación de energización a partir de fuentes activas (BFS)
    const energizedTerminalIds = new Set();
    const energizedComponentIds = new Set();
    const energizedConnectionIds = new Set();

    const queue = [];

    // Localizar fuentes activas (conectadas y en servicio)
    for (const comp of components) {
      if (comp.type === ComponentType.SOURCE) {
        if (comp.operationalState === OperationalState.CLOSED) {
          energizedComponentIds.add(comp.id);
          for (const term of comp.terminals) {
            energizedTerminalIds.add(term.id);
            queue.push(term.id);
          }
        } else {
          warnings.push({
            type: 'SOURCE_INACTIVE',
            componentId: comp.id,
            message: `La fuente '${comp.name}' está abierta o fuera de servicio.`
          });
        }
      }
    }

    // Algoritmo BFS para recorrer el grafo galvánico
    while (queue.length > 0) {
      const currentTerminalId = queue.shift();
      const currentData = terminalToComponent.get(currentTerminalId);
      if (!currentData) continue;

      const currentComp = currentData.component;
      energizedComponentIds.add(currentComp.id);

      // A. Propagación interna dentro del mismo componente
      const internalNeighbors = this.getInternalConnectedTerminals(currentComp, currentTerminalId);
      for (const nextInternalTerm of internalNeighbors) {
        if (!energizedTerminalIds.has(nextInternalTerm.id)) {
          energizedTerminalIds.add(nextInternalTerm.id);
          queue.push(nextInternalTerm.id);
        }
      }

      // B. Propagación externa a través de las ramas/conexiones
      const externalNeighbors = adjacency.get(currentTerminalId) || [];
      for (const { toTerminalId, connectionId } of externalNeighbors) {
        energizedConnectionIds.add(connectionId);
        if (!energizedTerminalIds.has(toTerminalId)) {
          energizedTerminalIds.add(toTerminalId);
          queue.push(toTerminalId);
        }
      }
    }

    // 3. Identificación de cargas alimentadas y desconectadas
    const suppliedLoads = [];
    const unsuppliedLoads = [];

    for (const comp of components) {
      if (comp.type === ComponentType.FEEDER_LOAD) {
        const isSupplied = comp.terminals.some(t => energizedTerminalIds.has(t.id));
        if (isSupplied) {
          suppliedLoads.push(comp);
        } else {
          unsuppliedLoads.push(comp);
        }
      }
    }

    // 4. Detección de componentes aislados (sin conexiones externas)
    const isolatedComponentIds = new Set();
    for (const comp of components) {
      const hasAnyConnection = comp.terminals.some(t => (adjacency.get(t.id)?.size || 0) > 0);
      if (!hasAnyConnection && components.length > 1) {
        isolatedComponentIds.add(comp.id);
      }
    }

    return {
      energizedComponentIds,
      energizedConnectionIds,
      energizedTerminalIds,
      isolatedComponentIds,
      unsuppliedLoads,
      suppliedLoads,
      warnings,
      errors
    };
  }

  /**
   * Determina qué otros terminales de un mismo equipo se conectan galvánicamente
   * según su estado operativo y tipo de aparato.
   * @param {Object} comp
   * @param {string} fromTerminalId
   * @returns {Array<Object>}
   */
  static getInternalConnectedTerminals(comp, fromTerminalId) {
    // Si el equipo está abierto o fuera de servicio, no hay conducción interna
    if (comp.operationalState === OperationalState.OPEN || 
        comp.operationalState === OperationalState.OUT_OF_SERVICE) {
      return [];
    }

    switch (comp.type) {
      case ComponentType.BUSBAR:
        // Todos los terminales del riel de barra están unidos internamente
        return comp.terminals.filter(t => t.id !== fromTerminalId);

      case ComponentType.CIRCUIT_BREAKER:
      case ComponentType.DISCONNECTOR:
        // Conduce polo a polo únicamente si está cerrado
        return comp.terminals.filter(t => t.id !== fromTerminalId);

      case ComponentType.TRANSFORMER:
        // El transformador acopla primario y secundario si está en servicio
        return comp.terminals.filter(t => t.id !== fromTerminalId);

      case ComponentType.FEEDER_LOAD:
      case ComponentType.SOURCE:
      default:
        // Extremos finales de circuito
        return [];
    }
  }
}
