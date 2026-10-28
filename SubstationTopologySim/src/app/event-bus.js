/**
 * EventBus - SubstationTopologySim
 * Mecanismo de mensajería Publish/Subscribe desacoplado para el ciclo de vida de la aplicación.
 */

export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * Suscribe un callback a un evento específico.
   * @param {string} event - Nombre del evento (ej: 'component:selected')
   * @param {Function} callback - Función manejadora
   * @returns {Function} Función para cancelar la suscripción
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Elimina una suscripción.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this._listeners.has(event)) return;
    this._listeners.get(event).delete(callback);
    if (this._listeners.get(event).size === 0) {
      this._listeners.delete(event);
    }
  }

  /**
   * Emite un evento con datos asociados a todos los suscriptores.
   * @param {string} event
   * @param {any} data
   */
  emit(event, data) {
    if (!this._listeners.has(event)) return;
    for (const callback of this._listeners.get(event)) {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventBus] Error en manejador de '${event}':`, err);
      }
    }
  }

  /**
   * Limpia todos los eventos y oyentes registrados.
   */
  clear() {
    this._listeners.clear();
  }
}
