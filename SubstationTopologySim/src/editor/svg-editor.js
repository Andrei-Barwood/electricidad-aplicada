/**
 * SvgEditor - SubstationTopologySim
 * Controlador del lienzo interactivo SVG: renderizado, pan/zoom, selección,
 * arrastre con ajuste a cuadrícula y soporte de cableado galvánico.
 */

import { ComponentRenderer } from './component-renderer.js';
import { ConnectionManager } from './connection-manager.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SvgEditor {
  /**
   * @param {HTMLElement} container
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/state-store.js').StateStore} stateStore
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('./selection-manager.js').SelectionManager} selectionManager
   */
  constructor(container, networkModel, stateStore, eventBus, selectionManager) {
    this.container = container;
    this.networkModel = networkModel;
    this.stateStore = stateStore;
    this.eventBus = eventBus;
    this.selectionManager = selectionManager;

    // Estado interno de interacción
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.isSpacePressed = false;

    this.draggedComponentId = null;
    this.dragStartMouse = { x: 0, y: 0 };
    this.dragStartPos = { x: 0, y: 0 };
    this.hasMovedDuringDrag = false;

    this.initSvg();
    this.connectionManager = new ConnectionManager(
      this.connectionsLayer,
      this.networkModel,
      this.stateStore,
      this.eventBus,
      this.selectionManager
    );

    this.bindEvents();
    this.subscribeToModel();
  }

  /**
   * Inicializa la estructura interna del SVG y la rejilla.
   */
  initSvg() {
    this.container.innerHTML = '';

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'canvas-viewport');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');

    // Definición de patrones de rejilla CAD
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <pattern id="grid-pattern-minor" width="20" height="20" patternUnits="userSpaceOnUse" class="grid-pattern-minor">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />
      </pattern>
      <pattern id="grid-pattern-major" width="100" height="100" patternUnits="userSpaceOnUse" class="grid-pattern-major">
        <rect width="100" height="100" fill="url(#grid-pattern-minor)" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255, 255, 255, 0.09)" stroke-width="1.25" />
      </pattern>
    `;
    this.svg.appendChild(defs);

    // Capa de transformación global (pan y zoom)
    this.viewportGroup = document.createElementNS(SVG_NS, 'g');
    this.viewportGroup.setAttribute('id', 'viewport-transform');

    // Fondo infinito de cuadrícula
    this.gridRect = document.createElementNS(SVG_NS, 'rect');
    this.gridRect.setAttribute('x', -50000);
    this.gridRect.setAttribute('y', -50000);
    this.gridRect.setAttribute('width', 100000);
    this.gridRect.setAttribute('height', 100000);
    this.gridRect.setAttribute('fill', 'url(#grid-pattern-major)');
    this.viewportGroup.appendChild(this.gridRect);

    // Capa de conexiones
    this.connectionsLayer = document.createElementNS(SVG_NS, 'g');
    this.connectionsLayer.setAttribute('id', 'connections-layer');
    this.viewportGroup.appendChild(this.connectionsLayer);

    // Capa de componentes
    this.componentsLayer = document.createElementNS(SVG_NS, 'g');
    this.componentsLayer.setAttribute('id', 'components-layer');
    this.viewportGroup.appendChild(this.componentsLayer);

    this.svg.appendChild(this.viewportGroup);
    this.container.appendChild(this.svg);

    this.applyViewportTransform();
  }

  /**
   * Aplica la matriz de transformación de Pan y Zoom al grupo raíz.
   */
  applyViewportTransform() {
    const { x, y, zoom } = this.stateStore.viewport;
    this.viewportGroup.setAttribute('transform', `translate(${x}, ${y}) scale(${zoom})`);
    this.gridRect.style.display = this.stateStore.grid.enabled ? 'block' : 'none';
  }

  /**
   * Convierte coordenadas de pantalla (clientX, clientY) a coordenadas del lienzo eléctrico.
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{x: number, y: number}}
   */
  screenToWorld(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    const { x: panX, y: panY, zoom } = this.stateStore.viewport;

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom
    };
  }

  /**
   * Ajusta una coordenada al paso de cuadrícula configurado.
   * @param {number} val
   * @returns {number}
   */
  snap(val) {
    if (!this.stateStore.grid.snap) return Math.round(val);
    const size = this.stateStore.grid.size || 20;
    return Math.round(val / size) * size;
  }

  /**
   * Enlaza eventos del DOM para navegación y manipulación.
   */
  bindEvents() {
    // Zoom con rueda de ratón con punto focal bajo el cursor
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const { x, y, zoom } = this.stateStore.viewport;
      const newZoom = Math.max(0.2, Math.min(3.0, zoom * zoomFactor));

      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - x) * (newZoom / zoom);
      const newY = mouseY - (mouseY - y) * (newZoom / zoom);

      this.stateStore.setViewport(newX, newY, newZoom);
      this.applyViewportTransform();
    }, { passive: false });

    // Presión de teclas (Space para Pan, Del para eliminar)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        this.isSpacePressed = true;
        this.svg.classList.add('mode-pan');
      }

      if (e.code === 'Delete' || e.code === 'Backspace') {
        // Eliminar conexión seleccionada si existe
        if (this.connectionManager.selectedConnectionId) {
          e.preventDefault();
          this.networkModel.removeConnection(this.connectionManager.selectedConnectionId);
          this.connectionManager.selectConnection(null);
          return;
        }

        // Eliminar componente seleccionado si existe
        const selectedId = this.selectionManager.getSelectedId();
        if (selectedId) {
          e.preventDefault();
          this.networkModel.removeComponent(selectedId);
          this.selectionManager.clearSelection();
        }
      }

      if (e.code === 'Escape') {
        if (this.connectionManager.isWiring) {
          this.connectionManager.cancelWiring();
        }
        this.connectionManager.selectConnection(null);
        this.selectionManager.clearSelection();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        const selectedId = this.selectionManager.getSelectedId();
        if (selectedId) {
          e.preventDefault();
          const dup = this.networkModel.duplicateComponent(selectedId);
          this.selectionManager.select(dup.id);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        if (this.stateStore.activeTool !== 'pan') {
          this.svg.classList.remove('mode-pan');
        }
      }
    });

    // Mousedown para Pan, Cableado o Selección/Arrastre
    this.svg.addEventListener('mousedown', (e) => {
      // Si se hizo clic sobre un terminal (Pin)
      const terminalEl = e.target.closest('.component-terminal');
      if (terminalEl && e.button === 0) {
        e.stopPropagation();
        const compId = terminalEl.dataset.componentId;
        const termId = terminalEl.dataset.terminalId;

        if (!this.connectionManager.isWiring) {
          this.connectionManager.startWiring(compId, termId);
        } else {
          this.connectionManager.completeWiring(compId, termId);
        }
        return;
      }

      // Si estábamos en proceso de cablear y se hace clic en otro lugar
      if (this.connectionManager.isWiring && e.button === 0) {
        this.connectionManager.cancelWiring();
        return;
      }

      // Clic central o modo Pan o Space pressed -> Panorámica
      if (e.button === 1 || this.isSpacePressed || this.stateStore.activeTool === 'pan') {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        return;
      }

      // Clic izquierdo en lienzo o componente
      if (e.button === 0) {
        const compElement = e.target.closest('.substation-component');

        if (compElement) {
          const compId = compElement.dataset.componentId;
          const comp = this.networkModel.getComponent(compId);

          if (comp) {
            this.connectionManager.selectConnection(null);
            this.selectionManager.select(compId);
            this.draggedComponentId = compId;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };
            this.dragStartPos = { x: comp.position.x, y: comp.position.y };
            this.hasMovedDuringDrag = false;
            compElement.classList.add('dragging');
          }
        } else {
          // Clic sobre el fondo: limpia la selección
          this.selectionManager.clearSelection();
          this.connectionManager.selectConnection(null);
        }
      }
    });

    // Mousemove para Pan, Vista previa de cableado y Arrastre de componente
    window.addEventListener('mousemove', (e) => {
      if (this.connectionManager.isWiring) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        this.connectionManager.updateWiringPreview(worldPos);
      }

      if (this.isPanning) {
        const dx = e.clientX - this.panStart.x;
        const dy = e.clientY - this.panStart.y;
        this.panStart = { x: e.clientX, y: e.clientY };

        const { x, y, zoom } = this.stateStore.viewport;
        this.stateStore.setViewport(x + dx, y + dy, zoom);
        this.applyViewportTransform();
        return;
      }

      if (this.draggedComponentId) {
        const dx = (e.clientX - this.dragStartMouse.x) / this.stateStore.viewport.zoom;
        const dy = (e.clientY - this.dragStartMouse.y) / this.stateStore.viewport.zoom;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.hasMovedDuringDrag = true;
        }

        const rawX = this.dragStartPos.x + dx;
        const rawY = this.dragStartPos.y + dy;

        const snappedX = this.snap(rawX);
        const snappedY = this.snap(rawY);

        // Actualizar visualmente durante el arrastre
        const compEl = this.componentsLayer.querySelector(`[data-component-id="${this.draggedComponentId}"]`);
        if (compEl) {
          compEl.setAttribute('transform', `translate(${snappedX}, ${snappedY})`);
        }

        // Actualizar ramas eléctricas conectadas en tiempo real durante el arrastre
        const comp = this.networkModel.getComponent(this.draggedComponentId);
        if (comp) {
          const originalPos = { ...comp.position };
          comp.position = { x: snappedX, y: snappedY };
          this.connectionManager.updateComponentConnections(this.draggedComponentId);
          comp.position = originalPos; // Restaurar hasta que mouseup confirme
        }
      }
    });

    // Mouseup para finalizar arrastre o pan
    window.addEventListener('mouseup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
      }

      if (this.draggedComponentId) {
        const compEl = this.componentsLayer.querySelector(`[data-component-id="${this.draggedComponentId}"]`);
        if (compEl) {
          compEl.classList.remove('dragging');
        }

        if (this.hasMovedDuringDrag) {
          const dx = (e.clientX - this.dragStartMouse.x) / this.stateStore.viewport.zoom;
          const dy = (e.clientY - this.dragStartMouse.y) / this.stateStore.viewport.zoom;

          const finalX = this.snap(this.dragStartPos.x + dx);
          const finalY = this.snap(this.dragStartPos.y + dy);

          this.networkModel.updateComponent(this.draggedComponentId, {
            position: { x: finalX, y: finalY }
          });
        }

        this.draggedComponentId = null;
        this.hasMovedDuringDrag = false;
      }
    });

    // Soporte para soltar (Drop) nuevos componentes desde la biblioteca
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/substation-component-type');
      if (!type) return;

      const worldPos = this.screenToWorld(e.clientX, e.clientY);
      const snappedPos = {
        x: this.snap(worldPos.x),
        y: this.snap(worldPos.y)
      };

      this.eventBus.emit('editor:drop-component', {
        type,
        position: snappedPos
      });
    });

    // Doble clic sobre interruptor o seccionador para conmutar directamente
    this.svg.addEventListener('dblclick', (e) => {
      const compElement = e.target.closest('.substation-component');
      if (compElement) {
        const compId = compElement.dataset.componentId;
        this.eventBus.emit('editor:component-toggle-requested', { componentId: compId });
      }
    });
  }

  /**
   * Suscribe a cambios del modelo y del almacén de estado para mantener el renderizado sincronizado.
   */
  subscribeToModel() {
    this.eventBus.on('model:component-added', ({ component }) => {
      this.renderComponent(component);
    });

    this.eventBus.on('model:component-updated', ({ component }) => {
      this.updateComponentRender(component);
    });

    this.eventBus.on('model:component-removed', ({ id }) => {
      const el = this.componentsLayer.querySelector(`[data-component-id="${id}"]`);
      if (el) el.remove();
    });

    this.eventBus.on('model:cleared', () => {
      this.componentsLayer.innerHTML = '';
      this.connectionsLayer.innerHTML = '';
    });

    this.eventBus.on('model:loaded', () => {
      this.renderAll();
      this.connectionManager.renderAllConnections();
    });

    this.eventBus.on('selection:changed', ({ selectedId, previousId }) => {
      if (previousId) {
        const prevEl = this.componentsLayer.querySelector(`[data-component-id="${previousId}"]`);
        if (prevEl) prevEl.classList.remove('selected');
      }
      if (selectedId) {
        const currEl = this.componentsLayer.querySelector(`[data-component-id="${selectedId}"]`);
        if (currEl) currEl.classList.add('selected');
      }
    });

    this.eventBus.on('topology:updated', ({ analysis }) => {
      // Actualizar clases de componentes según su energización
      for (const comp of this.networkModel.getAllComponents()) {
        const compEl = this.componentsLayer.querySelector(`[data-component-id="${comp.id}"]`);
        if (compEl) {
          const isLive = analysis.energizedComponentIds.has(comp.id);
          compEl.classList.toggle('energized', isLive);
          compEl.classList.toggle('deenergized', !isLive);

          // Actualizar terminales
          compEl.querySelectorAll('.component-terminal').forEach(termEl => {
            const isTermLive = analysis.energizedTerminalIds.has(termEl.dataset.terminalId);
            termEl.classList.toggle('energized', isTermLive);
          });
        }
      }
    });

    this.eventBus.on('grid:toggled', () => {
      this.gridRect.style.display = this.stateStore.grid.enabled ? 'block' : 'none';
    });

    this.eventBus.on('viewport:changed', () => {
      this.applyViewportTransform();
    });

    this.eventBus.on('interlocking:blocked', ({ component }) => {
      const compEl = this.componentsLayer.querySelector(`[data-component-id="${component.id}"]`);
      if (compEl) {
        compEl.classList.remove('interlock-flash-blocked');
        // Forzar reflow para reiniciar animación CSS
        void compEl.getBoundingClientRect();
        compEl.classList.add('interlock-flash-blocked');
        setTimeout(() => compEl.classList.remove('interlock-flash-blocked'), 1200);
      }
    });
  }

  /**
   * Renderiza un componente en la capa de componentes.
   * @param {Object} component
   */
  renderComponent(component) {
    const isSelected = this.selectionManager.isSelected(component.id);
    const node = ComponentRenderer.render(component, isSelected);
    this.componentsLayer.appendChild(node);
  }

  /**
   * Actualiza el render de un componente existente.
   * @param {Object} component
   */
  updateComponentRender(component) {
    const existingNode = this.componentsLayer.querySelector(`[data-component-id="${component.id}"]`);
    const isSelected = this.selectionManager.isSelected(component.id);
    const newNode = ComponentRenderer.render(component, isSelected);

    if (existingNode) {
      this.componentsLayer.replaceChild(newNode, existingNode);
    } else {
      this.componentsLayer.appendChild(newNode);
    }
  }

  /**
   * Re-renderiza todos los componentes del modelo.
   */
  renderAll() {
    this.componentsLayer.innerHTML = '';
    for (const comp of this.networkModel.getAllComponents()) {
      this.renderComponent(comp);
    }
  }

  /**
   * Ajusta el zoom para encuadrar todos los componentes en el viewport.
   */
  zoomToFit() {
    const comps = this.networkModel.getAllComponents();
    if (comps.length === 0) {
      this.stateStore.setViewport(0, 0, 1);
      this.applyViewportTransform();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of comps) {
      minX = Math.min(minX, c.position.x);
      minY = Math.min(minY, c.position.y);
      maxX = Math.max(maxX, c.position.x + c.dimensions.width);
      maxY = Math.max(maxY, c.position.y + c.dimensions.height);
    }

    const padding = 80;
    const boxW = (maxX - minX) + padding * 2;
    const boxH = (maxY - minY) + padding * 2;

    const rect = this.svg.getBoundingClientRect();
    const zoomX = rect.width / boxW;
    const zoomY = rect.height / boxH;
    const zoom = Math.max(0.3, Math.min(2.0, Math.min(zoomX, zoomY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newX = (rect.width / 2) - centerX * zoom;
    const newY = (rect.height / 2) - centerY * zoom;

    this.stateStore.setViewport(newX, newY, zoom);
    this.applyViewportTransform();
  }

  /**
   * Resetea el viewport a posición 0,0 y escala 100%.
   */
  resetZoom() {
    this.stateStore.setViewport(0, 0, 1.0);
    this.applyViewportTransform();
  }
}
