/**
 * NetworkModel - SubstationTopologySim
 * Representación del grafo eléctrico independiente de la capa gráfica.
 * Soporta nodos, terminales, ramas (conexiones) y análisis de energización topológica.
 */

import { createComponent } from './components.js';
import { TopologyValidator } from './topology-validator.js';

let connectionCounter = 1;

export class NetworkModel {
  /**
   * @param {import('../app/event-bus.js').EventBus} eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    /** @type {Map<string, Object>} */
    this.components = new Map();
    /** @type {Array<Object>} */
    this.connections = [];
    /** @type {Object|null} */
    this.lastTopologyAnalysis = null;
  }

  /**
   * Agrega un nuevo componente al modelo eléctrico.
   * @param {Object} component
   * @returns {Object}
   */
  addComponent(component) {
    if (!component || !component.id) {
      throw new Error('[NetworkModel] No se puede agregar un componente sin identificador válido');
    }
    if (this.components.has(component.id)) {
      throw new Error(`[NetworkModel] El componente con id '${component.id}' ya existe`);
    }

    this.components.set(component.id, component);
    this.eventBus?.emit('model:component-added', { component });
    this.recalculateTopology();
    return component;
  }

  /**
   * Retorna un componente por su id.
   * @param {string} id
   * @returns {Object|undefined}
   */
  getComponent(id) {
    return this.components.get(id);
  }

  /**
   * Retorna todos los componentes en un array.
   * @returns {Array<Object>}
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Comprueba la existencia de un componente.
   * @param {string} id
   * @returns {boolean}
   */
  hasComponent(id) {
    return this.components.has(id);
  }

  /**
   * Obtiene la posición absoluta en coordenadas mundiales de un terminal.
   * @param {string} componentId
   * @param {string} terminalId
   * @returns {{x: number, y: number}|null}
   */
  getTerminalAbsolutePosition(componentId, terminalId) {
    const comp = this.components.get(componentId);
    if (!comp) return null;
    const term = comp.terminals.find(t => t.id === terminalId);
    if (!term) return null;

    return {
      x: comp.position.x + comp.dimensions.width * term.relX,
      y: comp.position.y + comp.dimensions.height * term.relY
    };
  }

  /**
   * Actualiza propiedades o posición de un componente.
   * @param {string} id
   * @param {Object} partial
   * @returns {Object}
   */
  updateComponent(id, partial) {
    const comp = this.components.get(id);
    if (!comp) {
      throw new Error(`[NetworkModel] Componente '${id}' no encontrado para actualización`);
    }

    let shouldRecalculate = false;

    if (partial.position) {
      comp.position = { ...comp.position, ...partial.position };
      // Notificar que se movió para refrescar ramas conectadas
      this.eventBus?.emit('model:component-moved', { component: comp });
    }
    if (partial.name !== undefined) {
      comp.name = partial.name;
    }
    if (partial.operationalState !== undefined) {
      comp.operationalState = partial.operationalState;
      shouldRecalculate = true;
    }
    if (partial.isEnergized !== undefined) {
      comp.isEnergized = partial.isEnergized;
    }
    if (partial.properties) {
      comp.properties = { ...comp.properties, ...partial.properties };
      shouldRecalculate = true;
    }
    if (partial.failureRate !== undefined) {
      comp.failureRate = Number(partial.failureRate);
    }
    if (partial.mttrHours !== undefined) {
      comp.mttrHours = Number(partial.mttrHours);
      comp.repairRate = comp.mttrHours > 0 ? (8760 / comp.mttrHours) : 8760;
      comp.availability = comp.repairRate / (comp.failureRate + comp.repairRate);
      comp.unavailability = 1 - comp.availability;
    }

    this.eventBus?.emit('model:component-updated', { component: comp, changes: partial });

    if (shouldRecalculate) {
      this.recalculateTopology();
    }
    return comp;
  }

  /**
   * Elimina un componente y todas sus ramas/conexiones asociadas.
   * @param {string} id
   * @returns {boolean}
   */
  removeComponent(id) {
    if (!this.components.has(id)) return false;

    const removed = this.components.get(id);
    this.components.delete(id);

    // Limpiar conexiones asociadas a sus terminales
    const terminalIds = new Set(removed.terminals.map(t => t.id));
    const removedConns = this.connections.filter(conn => 
      terminalIds.has(conn.fromTerminalId) || terminalIds.has(conn.toTerminalId)
    );

    this.connections = this.connections.filter(conn => 
      !terminalIds.has(conn.fromTerminalId) && !terminalIds.has(conn.toTerminalId)
    );

    for (const rConn of removedConns) {
      this.eventBus?.emit('model:connection-removed', { id: rConn.id });
    }

    this.eventBus?.emit('model:component-removed', { id, component: removed });
    this.recalculateTopology();
    return true;
  }

  /**
   * Conecta dos terminales mediante una rama eléctrica.
   * @param {Object} connData
   * @returns {Object}
   */
  addConnection(connData) {
    const { fromComponentId, fromTerminalId, toComponentId, toTerminalId } = connData;

    if (!fromComponentId || !fromTerminalId || !toComponentId || !toTerminalId) {
      throw new Error('[NetworkModel] Conexión incompleta: requiere identificadores de componentes y terminales');
    }

    if (fromTerminalId === toTerminalId) {
      throw new Error('[NetworkModel] No se puede conectar un terminal consigo mismo');
    }

    // Verificar existencia de ambos componentes y terminales
    const comp1 = this.components.get(fromComponentId);
    const comp2 = this.components.get(toComponentId);
    if (!comp1 || !comp2) {
      throw new Error('[NetworkModel] Uno de los componentes a conectar no existe en la red');
    }

    const t1 = comp1.terminals.find(t => t.id === fromTerminalId);
    const t2 = comp2.terminals.find(t => t.id === toTerminalId);
    if (!t1 || !t2) {
      throw new Error('[NetworkModel] Uno de los terminales especificados no existe en el componente');
    }

    // Evitar conexión duplicada directa
    const duplicate = this.connections.some(c => 
      (c.fromTerminalId === fromTerminalId && c.toTerminalId === toTerminalId) ||
      (c.fromTerminalId === toTerminalId && c.toTerminalId === fromTerminalId)
    );

    if (duplicate) {
      throw new Error('[NetworkModel] Ya existe una conexión eléctrica entre estos terminales');
    }

    const id = connData.id || `BRANCH-${connectionCounter++}`;
    const newConn = {
      id,
      fromComponentId,
      fromTerminalId,
      toComponentId,
      toTerminalId,
      isEnergized: false
    };

    this.connections.push(newConn);
    this.eventBus?.emit('model:connection-added', { connection: newConn });
    this.recalculateTopology();
    return newConn;
  }

  /**
   * Elimina una rama eléctrica de la red.
   * @param {string} connectionId
   * @returns {boolean}
   */
  removeConnection(connectionId) {
    const idx = this.connections.findIndex(c => c.id === connectionId);
    if (idx === -1) return false;

    const removed = this.connections.splice(idx, 1)[0];
    this.eventBus?.emit('model:connection-removed', { id: connectionId, connection: removed });
    this.recalculateTopology();
    return true;
  }

  /**
   * Retorna una conexión por su id.
   * @param {string} id
   * @returns {Object|undefined}
   */
  getConnection(id) {
    return this.connections.find(c => c.id === id);
  }

  /**
   * Retorna todas las conexiones activas.
   * @returns {Array<Object>}
   */
  getAllConnections() {
    return [...this.connections];
  }

  /**
   * Retorna las conexiones vinculadas a un componente dado.
   * @param {string} componentId
   * @returns {Array<Object>}
   */
  getConnectionsForComponent(componentId) {
    const comp = this.components.get(componentId);
    if (!comp) return [];
    const termIds = new Set(comp.terminals.map(t => t.id));
    return this.connections.filter(c => termIds.has(c.fromTerminalId) || termIds.has(c.toTerminalId));
  }

  /**
   * Recalcula la energización galvánica y la topología global de la subestación.
   */
  recalculateTopology() {
    const analysis = TopologyValidator.analyze(this);
    this.lastTopologyAnalysis = analysis;

    // Actualizar banderas de energización en componentes
    let stateChanged = false;
    for (const comp of this.components.values()) {
      const isNowEnergized = analysis.energizedComponentIds.has(comp.id);
      if (comp.isEnergized !== isNowEnergized) {
        comp.isEnergized = isNowEnergized;
        stateChanged = true;
      }
    }

    // Actualizar banderas de energización en ramas/conexiones
    for (const conn of this.connections) {
      const isNowEnergized = analysis.energizedConnectionIds.has(conn.id);
      if (conn.isEnergized !== isNowEnergized) {
        conn.isEnergized = isNowEnergized;
        stateChanged = true;
      }
    }

    this.eventBus?.emit('topology:updated', { analysis, stateChanged });
    return analysis;
  }

  /**
   * Duplica un componente existente desplazándolo ligeramente.
   * @param {string} id
   * @param {number} offsetX
   * @param {number} offsetY
   * @returns {Object}
   */
  duplicateComponent(id, offsetX = 40, offsetY = 40) {
    const original = this.components.get(id);
    if (!original) {
      throw new Error(`[NetworkModel] Componente '${id}' no encontrado para duplicar`);
    }

    const duplicated = createComponent(original.type, {
      name: `${original.name} (Copia)`,
      x: original.position.x + offsetX,
      y: original.position.y + offsetY,
      operationalState: original.operationalState,
      failureRate: original.failureRate,
      mttrHours: original.mttrHours,
      properties: { ...original.properties }
    });

    return this.addComponent(duplicated);
  }

  /**
   * Limpia toda la red.
   */
  clear() {
    this.components.clear();
    this.connections = [];
    this.lastTopologyAnalysis = null;
    this.eventBus?.emit('model:cleared');
  }

  /**
   * Exporta a objeto JSON plano.
   * @returns {Object}
   */
  toJSON() {
    return {
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      components: Array.from(this.components.values()),
      connections: this.connections
    };
  }

  /**
   * Carga desde objeto JSON plano.
   * @param {Object} data
   */
  fromJSON(data) {
    this.clear();
    if (!data || !Array.isArray(data.components)) {
      throw new Error('[NetworkModel] Formato JSON no compatible');
    }

    for (const compData of data.components) {
      this.components.set(compData.id, compData);
    }
    this.connections = Array.isArray(data.connections) ? data.connections : [];
    this.eventBus?.emit('model:loaded', { componentsCount: this.components.size });
    this.recalculateTopology();
  }
}
