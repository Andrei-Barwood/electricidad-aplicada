/**
 * ConnectionManager - SubstationTopologySim
 * Administra el cableado interactivo entre terminales, enrutamiento ortogonal
 * y renderizado de ramas eléctricas con estado de energización en tiempo real.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export class ConnectionManager {
  /**
   * @param {SVGGElement} connectionsLayer
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/state-store.js').StateStore} stateStore
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('./selection-manager.js').SelectionManager} selectionManager
   */
  constructor(connectionsLayer, networkModel, stateStore, eventBus, selectionManager) {
    this.connectionsLayer = connectionsLayer;
    this.networkModel = networkModel;
    this.stateStore = stateStore;
    this.eventBus = eventBus;
    this.selectionManager = selectionManager;

    // Estado del cableado interactivo
    this.isWiring = false;
    this.wiringSource = null; // { componentId, terminalId, startPos }
    this.selectedConnectionId = null;

    this.initWiringPreview();
    this.subscribe();
  }

  initWiringPreview() {
    this.previewPath = document.createElementNS(SVG_NS, 'path');
    this.previewPath.setAttribute('class', 'wiring-preview');
    this.previewPath.setAttribute('fill', 'none');
    this.previewPath.setAttribute('stroke', '#38bdf8');
    this.previewPath.setAttribute('stroke-width', '2');
    this.previewPath.setAttribute('stroke-dasharray', '5 4');
    this.previewPath.style.display = 'none';
    this.connectionsLayer.appendChild(this.previewPath);
  }

  subscribe() {
    // Escuchar adición, remoción y carga
    this.eventBus.on('model:connection-added', ({ connection }) => {
      this.renderConnection(connection);
    });

    this.eventBus.on('model:connection-removed', ({ id }) => {
      const el = this.connectionsLayer.querySelector(`[data-connection-id="${id}"]`);
      if (el) el.remove();
      if (this.selectedConnectionId === id) {
        this.selectedConnectionId = null;
      }
    });

    this.eventBus.on('model:component-moved', ({ component }) => {
      this.updateComponentConnections(component.id);
    });

    this.eventBus.on('topology:updated', ({ analysis }) => {
      this.updateAllEnergization(analysis.energizedConnectionIds);
    });

    this.eventBus.on('model:loaded', () => {
      this.renderAllConnections();
    });

    this.eventBus.on('model:cleared', () => {
      this.connectionsLayer.querySelectorAll('.electrical-connection').forEach(el => el.remove());
    });
  }

  /**
   * Genera el trazo ortogonal (Manhattan) entre dos puntos.
   * @param {{x: number, y: number}} p1
   * @param {{x: number, y: number}} p2
   * @returns {string}
   */
  getOrthogonalPathData(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    if (Math.abs(dx) < 2) {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }
    if (Math.abs(dy) < 2) {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }

    const midY = p1.y + dy / 2;
    return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
  }

  /**
   * Renderiza una conexión eléctrica en SVG.
   * @param {Object} conn
   */
  renderConnection(conn) {
    const p1 = this.networkModel.getTerminalAbsolutePosition(conn.fromComponentId, conn.fromTerminalId);
    const p2 = this.networkModel.getTerminalAbsolutePosition(conn.toComponentId, conn.toTerminalId);
    if (!p1 || !p2) return;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', `electrical-connection ${conn.isEnergized ? 'energized' : 'deenergized'}`);
    group.setAttribute('id', `svg-conn-${conn.id}`);
    group.dataset.connectionId = conn.id;

    // Camino visual interactivo (área de captura más ancha)
    const hitPath = document.createElementNS(SVG_NS, 'path');
    hitPath.setAttribute('class', 'connection-hit-area');
    hitPath.setAttribute('d', this.getOrthogonalPathData(p1, p2));
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '14');
    hitPath.style.cursor = 'pointer';

    // Línea visible conductora
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'connection-line');
    path.setAttribute('d', this.getOrthogonalPathData(p1, p2));
    path.setAttribute('fill', 'none');

    // Punto central de unión / nodo para inspección
    const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const nodeCircle = document.createElementNS(SVG_NS, 'circle');
    nodeCircle.setAttribute('class', 'connection-junction-dot');
    nodeCircle.setAttribute('cx', midPoint.x);
    nodeCircle.setAttribute('cy', midPoint.y);
    nodeCircle.setAttribute('r', 3);

    group.appendChild(hitPath);
    group.appendChild(path);
    group.appendChild(nodeCircle);

    // Selección de rama
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectConnection(conn.id);
    });

    this.connectionsLayer.appendChild(group);
  }

  /**
   * Selecciona una rama eléctrica.
   * @param {string|null} connId
   */
  selectConnection(connId) {
    this.selectedConnectionId = connId;
    this.connectionsLayer.querySelectorAll('.electrical-connection').forEach(el => {
      el.classList.toggle('selected', el.dataset.connectionId === connId);
    });

    if (connId) {
      this.selectionManager.clearSelection();
      this.eventBus.emit('connection:selected', { connectionId: connId });
    }
  }

  /**
   * Actualiza las geometrías de las conexiones vinculadas a un componente que fue movido.
   * @param {string} componentId
   */
  updateComponentConnections(componentId) {
    const conns = this.networkModel.getConnectionsForComponent(componentId);
    for (const conn of conns) {
      const el = this.connectionsLayer.querySelector(`[data-connection-id="${conn.id}"]`);
      if (!el) continue;

      const p1 = this.networkModel.getTerminalAbsolutePosition(conn.fromComponentId, conn.fromTerminalId);
      const p2 = this.networkModel.getTerminalAbsolutePosition(conn.toComponentId, conn.toTerminalId);
      if (!p1 || !p2) continue;

      const d = this.getOrthogonalPathData(p1, p2);
      el.querySelectorAll('path').forEach(p => p.setAttribute('d', d));

      const dot = el.querySelector('.connection-junction-dot');
      if (dot) {
        dot.setAttribute('cx', (p1.x + p2.x) / 2);
        dot.setAttribute('cy', (p1.y + p2.y) / 2);
      }
    }
  }

  /**
   * Actualiza el estado visual de energización de todas las conexiones.
   * @param {Set<string>} energizedIds
   */
  updateAllEnergization(energizedIds) {
    for (const conn of this.networkModel.getAllConnections()) {
      const el = this.connectionsLayer.querySelector(`[data-connection-id="${conn.id}"]`);
      if (!el) continue;

      const isLive = energizedIds.has(conn.id);
      el.classList.toggle('energized', isLive);
      el.classList.toggle('deenergized', !isLive);
    }
  }

  /**
   * Re-renderiza todas las conexiones del modelo.
   */
  renderAllConnections() {
    this.connectionsLayer.querySelectorAll('.electrical-connection').forEach(el => el.remove());
    for (const conn of this.networkModel.getAllConnections()) {
      this.renderConnection(conn);
    }
  }

  /**
   * Inicia un proceso interactivo de cableado a partir de un terminal.
   * @param {string} componentId
   * @param {string} terminalId
   */
  startWiring(componentId, terminalId) {
    const startPos = this.networkModel.getTerminalAbsolutePosition(componentId, terminalId);
    if (!startPos) return;

    this.isWiring = true;
    this.wiringSource = { componentId, terminalId, startPos };
    this.previewPath.style.display = 'block';
    this.previewPath.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${startPos.x} ${startPos.y}`);
  }

  /**
   * Actualiza la línea de vista previa durante el movimiento del cursor.
   * @param {{x: number, y: number}} worldMouse
   */
  updateWiringPreview(worldMouse) {
    if (!this.isWiring || !this.wiringSource) return;
    const d = this.getOrthogonalPathData(this.wiringSource.startPos, worldMouse);
    this.previewPath.setAttribute('d', d);
  }

  /**
   * Completa la conexión si se hace clic sobre un terminal de destino válido.
   * @param {string} targetComponentId
   * @param {string} targetTerminalId
   * @returns {boolean}
   */
  completeWiring(targetComponentId, targetTerminalId) {
    if (!this.isWiring || !this.wiringSource) return false;

    try {
      this.networkModel.addConnection({
        fromComponentId: this.wiringSource.componentId,
        fromTerminalId: this.wiringSource.terminalId,
        toComponentId: targetComponentId,
        toTerminalId: targetTerminalId
      });
      this.cancelWiring();
      return true;
    } catch (err) {
      console.warn('[ConnectionManager] Conexión rechazada:', err.message);
      this.cancelWiring();
      return false;
    }
  }

  /**
   * Cancela la sesión de cableado en curso.
   */
  cancelWiring() {
    this.isWiring = false;
    this.wiringSource = null;
    this.previewPath.style.display = 'none';
  }
}
