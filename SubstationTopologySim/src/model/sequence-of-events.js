/**
 * SequenceOfEvents - SubstationTopologySim
 * Registrador cronológico de eventos de alta resolución (SOE - Sequence of Events).
 * Registra maniobras, alarmas de enclavamiento, cambios de estado y contingencias.
 */

export const EventSeverity = Object.freeze({
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED',
  ALARM: 'ALARM'
});

let eventCounter = 1;

export class SequenceOfEvents {
  /**
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {number} maxCapacity
   */
  constructor(eventBus, maxCapacity = 500) {
    this.eventBus = eventBus;
    this.maxCapacity = maxCapacity;
    /** @type {Array<Object>} */
    this.events = [];
  }

  /**
   * Registra un nuevo evento en la bitácora cronológica.
   * @param {Object} data
   * @returns {Object}
   */
  log(data) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-CL', { hour12: false });
    const msStr = String(now.getMilliseconds()).padStart(3, '0');
    const fullTime = `${timeStr}.${msStr}`;

    const event = {
      id: `SOE-${eventCounter++}`,
      timestamp: now.toISOString(),
      displayTime: fullTime,
      componentId: data.componentId || null,
      componentName: data.componentName || (data.componentId ? data.componentId : 'Sistema'),
      componentType: data.componentType || null,
      previousState: data.previousState || null,
      newState: data.newState || null,
      severity: data.severity || EventSeverity.INFO,
      message: data.message || '',
      ruleCode: data.ruleCode || null,
      operator: data.operator || 'Operador SCADA',
      isInterlocked: data.isInterlocked ?? false
    };

    this.events.unshift(event);

    if (this.events.length > this.maxCapacity) {
      this.events.pop();
    }

    this.eventBus?.emit('soe:event-logged', { event });
    return event;
  }

  /**
   * Retorna los eventos registrados con filtros opcionales.
   * @param {Object} [filter]
   * @returns {Array<Object>}
   */
  getEvents(filter = {}) {
    return this.events.filter(ev => {
      if (filter.severity && ev.severity !== filter.severity) return false;
      if (filter.componentId && ev.componentId !== filter.componentId) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        return ev.message.toLowerCase().includes(q) || ev.componentName.toLowerCase().includes(q);
      }
      return true;
    });
  }

  /**
   * Limpia el registro de eventos.
   */
  clear() {
    this.events = [];
    this.eventBus?.emit('soe:cleared');
  }

  /**
   * Exporta la secuencia de eventos a formato CSV estándar.
   * @returns {string}
   */
  exportToCSV() {
    const headers = ['ID', 'Hora', 'ID Equipo', 'Nombre Equipo', 'Tipo', 'Estado Previo', 'Estado Nuevo', 'Severidad', 'Mensaje', 'Regla'];
    const rows = this.events.map(e => [
      e.id,
      e.displayTime,
      e.componentId || '',
      `"${e.componentName}"`,
      e.componentType || '',
      e.previousState || '',
      e.newState || '',
      e.severity,
      `"${e.message.replace(/"/g, '""')}"`,
      e.ruleCode || ''
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
