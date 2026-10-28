/**
 * Toolbar - SubstationTopologySim
 * Control de herramientas de lienzo, navegación, comandos rápidos, cuadrícula y estado topológico.
 */

export class Toolbar {
  /**
   * @param {import('../editor/svg-editor.js').SvgEditor} svgEditor
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/state-store.js').StateStore} stateStore
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('../editor/selection-manager.js').SelectionManager} selectionManager
   */
  constructor(svgEditor, networkModel, stateStore, eventBus, selectionManager) {
    this.svgEditor = svgEditor;
    this.networkModel = networkModel;
    this.stateStore = stateStore;
    this.eventBus = eventBus;
    this.selectionManager = selectionManager;

    this.bindDom();
    this.subscribe();
  }

  bindDom() {
    // Botones de navegación y zoom
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      const { x, y, zoom } = this.stateStore.viewport;
      this.stateStore.setViewport(x, y, zoom * 1.2);
    });

    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      const { x, y, zoom } = this.stateStore.viewport;
      this.stateStore.setViewport(x, y, zoom / 1.2);
    });

    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
      this.svgEditor.zoomToFit();
    });

    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
      this.svgEditor.resetZoom();
    });

    // Modos de herramienta
    const btnToolSelect = document.getElementById('btn-tool-select');
    const btnToolPan = document.getElementById('btn-tool-pan');

    btnToolSelect?.addEventListener('click', () => {
      this.stateStore.setActiveTool('select');
      btnToolSelect.classList.add('active');
      btnToolPan?.classList.remove('active');
      this.svgEditor.svg.classList.remove('mode-pan');
    });

    btnToolPan?.addEventListener('click', () => {
      this.stateStore.setActiveTool('pan');
      btnToolPan.classList.add('active');
      btnToolSelect?.classList.remove('active');
      this.svgEditor.svg.classList.add('mode-pan');
    });

    // Rejilla y Ajuste
    const btnToggleGrid = document.getElementById('btn-toggle-grid');
    btnToggleGrid?.addEventListener('click', () => {
      const active = this.stateStore.toggleGrid();
      btnToggleGrid.classList.toggle('active', active);
    });

    const btnToggleSnap = document.getElementById('btn-toggle-snap');
    btnToggleSnap?.addEventListener('click', () => {
      const active = this.stateStore.toggleSnap();
      btnToggleSnap.classList.toggle('active', active);
    });

    // Operaciones con componentes
    document.getElementById('btn-delete-selected')?.addEventListener('click', () => {
      const selectedConnId = this.svgEditor.connectionManager.selectedConnectionId;
      if (selectedConnId) {
        this.networkModel.removeConnection(selectedConnId);
        this.svgEditor.connectionManager.selectConnection(null);
        return;
      }

      const selectedId = this.selectionManager.getSelectedId();
      if (selectedId) {
        this.networkModel.removeComponent(selectedId);
        this.selectionManager.clearSelection();
      }
    });

    document.getElementById('btn-duplicate-selected')?.addEventListener('click', () => {
      const selectedId = this.selectionManager.getSelectedId();
      if (selectedId) {
        const dup = this.networkModel.duplicateComponent(selectedId);
        this.selectionManager.select(dup.id);
      }
    });
  }

  subscribe() {
    this.eventBus.on('viewport:changed', ({ zoom }) => {
      const zoomLabel = document.getElementById('status-zoom-level');
      if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      }
    });

    this.eventBus.on('selection:changed', ({ selectedId }) => {
      const btnDel = document.getElementById('btn-delete-selected');
      const btnDup = document.getElementById('btn-duplicate-selected');
      if (btnDel) btnDel.disabled = !selectedId && !this.svgEditor.connectionManager.selectedConnectionId;
      if (btnDup) btnDup.disabled = !selectedId;

      const selStatus = document.getElementById('status-selection-info');
      if (selStatus) {
        if (selectedId) {
          const comp = this.networkModel.getComponent(selectedId);
          selStatus.textContent = `Seleccionado: ${comp ? comp.name : selectedId}`;
        } else if (!this.svgEditor.connectionManager.selectedConnectionId) {
          selStatus.textContent = 'Ningún elemento seleccionado';
        }
      }
    });

    this.eventBus.on('connection:selected', ({ connectionId }) => {
      const btnDel = document.getElementById('btn-delete-selected');
      const btnDup = document.getElementById('btn-duplicate-selected');
      if (btnDel) btnDel.disabled = false;
      if (btnDup) btnDup.disabled = true;

      const selStatus = document.getElementById('status-selection-info');
      if (selStatus) {
        selStatus.textContent = `Rama seleccionada: ${connectionId}`;
      }
    });

    const updateCounts = () => {
      const countEl = document.getElementById('status-component-count');
      if (countEl) {
        const cCount = this.networkModel.getAllComponents().length;
        const bCount = this.networkModel.getAllConnections().length;
        countEl.textContent = `${cCount} componentes · ${bCount} ramas`;
      }
    };

    this.eventBus.on('model:component-added', updateCounts);
    this.eventBus.on('model:component-removed', updateCounts);
    this.eventBus.on('model:connection-added', updateCounts);
    this.eventBus.on('model:connection-removed', updateCounts);
    this.eventBus.on('model:loaded', updateCounts);
    this.eventBus.on('model:cleared', updateCounts);

    this.eventBus.on('topology:updated', ({ analysis }) => {
      updateCounts();
      const statusPill = document.getElementById('status-topology-summary');
      if (statusPill) {
        const liveComps = analysis.energizedComponentIds.size;
        const totalComps = this.networkModel.getAllComponents().length;
        const suppliedLoads = analysis.suppliedLoads.length;
        const totalLoads = this.networkModel.getAllComponents().filter(c => c.type === 'FEEDER_LOAD').length;

        statusPill.textContent = `Energizado: ${liveComps}/${totalComps} equipos · Cargas: ${suppliedLoads}/${totalLoads}`;
      }
    });
  }
}
