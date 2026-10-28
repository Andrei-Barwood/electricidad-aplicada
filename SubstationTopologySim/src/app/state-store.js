/**
 * StateStore - SubstationTopologySim
 * Estado global reactivo para la sesión de edición y visualización.
 */

export class StateStore {
  /**
   * @param {import('./event-bus.js').EventBus} eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.state = {
      selectedComponentId: null,
      activeTool: 'select', // 'select' | 'pan'
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      grid: {
        enabled: true,
        snap: true,
        size: 20
      },
      projectName: 'Subestación Principal 220/66 kV',
      isDirty: false
    };
  }

  get selectedComponentId() {
    return this.state.selectedComponentId;
  }

  get activeTool() {
    return this.state.activeTool;
  }

  get viewport() {
    return this.state.viewport;
  }

  get grid() {
    return this.state.grid;
  }

  setSelectedComponent(id) {
    if (this.state.selectedComponentId === id) return;
    const previousId = this.state.selectedComponentId;
    this.state.selectedComponentId = id;
    this.eventBus.emit('selection:changed', {
      selectedId: id,
      previousId
    });
  }

  setActiveTool(tool) {
    if (this.state.activeTool === tool) return;
    this.state.activeTool = tool;
    this.eventBus.emit('tool:changed', { tool });
  }

  setViewport(x, y, zoom) {
    this.state.viewport.x = x;
    this.state.viewport.y = y;
    this.state.viewport.zoom = Math.max(0.2, Math.min(3.0, zoom));
    this.eventBus.emit('viewport:changed', { ...this.state.viewport });
  }

  toggleGrid() {
    this.state.grid.enabled = !this.state.grid.enabled;
    this.eventBus.emit('grid:toggled', { enabled: this.state.grid.enabled });
    return this.state.grid.enabled;
  }

  toggleSnap() {
    this.state.grid.snap = !this.state.grid.snap;
    this.eventBus.emit('snap:toggled', { snap: this.state.grid.snap });
    return this.state.grid.snap;
  }

  setProjectName(name) {
    this.state.projectName = name;
    this.eventBus.emit('project:renamed', { name });
  }
}
