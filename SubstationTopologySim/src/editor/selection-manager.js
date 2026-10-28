/**
 * SelectionManager - SubstationTopologySim
 * Administra la selección activa de componentes y sus cambios.
 */

export class SelectionManager {
  /**
   * @param {import('../app/state-store.js').StateStore} stateStore
   * @param {import('../app/event-bus.js').EventBus} eventBus
   */
  constructor(stateStore, eventBus) {
    this.stateStore = stateStore;
    this.eventBus = eventBus;
  }

  /**
   * Selecciona un componente por su ID.
   * @param {string|null} componentId
   */
  select(componentId) {
    this.stateStore.setSelectedComponent(componentId);
  }

  /**
   * Deselecciona cualquier componente activo.
   */
  clearSelection() {
    this.stateStore.setSelectedComponent(null);
  }

  /**
   * Retorna el id del componente seleccionado.
   * @returns {string|null}
   */
  getSelectedId() {
    return this.stateStore.selectedComponentId;
  }

  /**
   * Comprueba si un componente está seleccionado.
   * @param {string} componentId
   * @returns {boolean}
   */
  isSelected(componentId) {
    return this.stateStore.selectedComponentId === componentId;
  }
}
