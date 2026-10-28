/**
 * SoePanel - SubstationTopologySim
 * Controlador del panel de Maniobras Operacionales, Secuencia de Eventos (SOE) y Enclavamientos.
 */

import { EventSeverity } from '../model/sequence-of-events.js';

export class SoePanel {
  /**
   * @param {HTMLElement} container
   * @param {import('../model/interlocking-engine.js').InterlockingEngine} interlockingEngine
   * @param {import('../model/sequence-of-events.js').SequenceOfEvents} soe
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/event-bus.js').EventBus} eventBus
   */
  constructor(container, interlockingEngine, soe, networkModel, eventBus) {
    this.container = container;
    this.interlockingEngine = interlockingEngine;
    this.soe = soe;
    this.networkModel = networkModel;
    this.eventBus = eventBus;
    this.activeFilter = 'ALL';
    this.searchQuery = '';

    this.render();
    this.subscribe();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Seguridad y Enclavamientos</span>
          <span class="badge ${this.interlockingEngine.enabled ? 'badge-closed' : 'badge-oos'}" id="soe-interlock-status-badge">
            ${this.interlockingEngine.enabled ? 'ENCLAVAMIENTO ACTIVO' : 'BYPASS / OVERRIDE'}
          </span>
        </div>
        <div class="panel-subtitle">Normativa de Maniobras IEC 62271-102 / IEEE C37.100</div>

        <div class="interlock-switch-box">
          <label class="switch-container">
            <input type="checkbox" id="chk-interlock-enabled" ${this.interlockingEngine.enabled ? 'checked' : ''} />
            <span class="switch-slider"></span>
          </label>
          <div class="switch-text-group">
            <span class="switch-title">Interbloqueo de Seccionadores</span>
            <span class="switch-desc">Impide abrir/cerrar seccionadores bajo carga</span>
          </div>
        </div>
      </div>

      <!-- Secuencia Cronológica de Eventos (SOE) -->
      <div class="panel-section soe-section">
        <div class="panel-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="panel-title">Bitácora SOE (Sequence of Events)</span>
            <span class="soe-counter-badge" id="soe-total-count">0</span>
          </div>
          <div style="display: flex; gap: 4px;">
            <button id="btn-soe-export" class="btn btn-sm" title="Descargar registro en CSV">Exportar CSV</button>
            <button id="btn-soe-clear" class="btn btn-sm btn-subtle" title="Limpiar bitácora">Limpiar</button>
          </div>
        </div>

        <!-- Filtros y Búsqueda -->
        <div class="soe-filters-row">
          <div class="soe-filter-chips">
            <button class="soe-chip active" data-filter="ALL">Todos</button>
            <button class="soe-chip chip-blocked" data-filter="${EventSeverity.BLOCKED}">Bloqueos</button>
            <button class="soe-chip chip-alarm" data-filter="${EventSeverity.ALARM}">Alarmas</button>
            <button class="soe-chip chip-success" data-filter="${EventSeverity.SUCCESS}">Éxitos</button>
          </div>
          <input type="text" id="soe-search-input" class="prop-input soe-search-input" placeholder="Buscar equipo o regla..." />
        </div>

        <!-- Tabla / Lista de Eventos -->
        <div class="soe-table-container">
          <div class="soe-events-list" id="soe-events-list">
            <div class="soe-empty-msg">No se han registrado maniobras o eventos aún.</div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.refreshEventsList();
  }

  bindEvents() {
    // Toggle de Enclavamiento
    const chk = this.container.querySelector('#chk-interlock-enabled');
    chk?.addEventListener('change', (e) => {
      const nowActive = e.target.checked;
      if (!nowActive) {
        const confirmed = confirm(
          '¡ADVERTENCIA DE SEGURIDAD ELÉCTRICA!\n\n' +
          'Está a punto de desactivar los enclavamientos operacionales (Bypass de Emergencia).\n' +
          'La apertura de seccionadores bajo carga generará arco eléctrico según la física de corte.\n\n' +
          '¿Desea habilitar el modo Override bajo su responsabilidad?'
        );
        if (!confirmed) {
          e.target.checked = true;
          return;
        }
      }
      this.interlockingEngine.setInterlockingEnabled(nowActive);
    });

    // Filtros
    this.container.querySelectorAll('.soe-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.soe-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.refreshEventsList();
      });
    });

    // Búsqueda
    const searchInput = this.container.querySelector('#soe-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.refreshEventsList();
    });

    // Exportar CSV
    this.container.querySelector('#btn-soe-export')?.addEventListener('click', () => {
      const csv = this.soe.exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `substation_soe_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Limpiar
    this.container.querySelector('#btn-soe-clear')?.addEventListener('click', () => {
      this.soe.clear();
      this.refreshEventsList();
    });
  }

  refreshEventsList() {
    const listEl = this.container.querySelector('#soe-events-list');
    const counterEl = this.container.querySelector('#soe-total-count');
    if (!listEl) return;

    const filterObj = {};
    if (this.activeFilter !== 'ALL') {
      filterObj.severity = this.activeFilter;
    }
    if (this.searchQuery.trim()) {
      filterObj.search = this.searchQuery.trim();
    }

    const filtered = this.soe.getEvents(filterObj);
    if (counterEl) counterEl.textContent = this.soe.events.length;

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="soe-empty-msg">No hay eventos para el filtro seleccionado.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(ev => {
      const sevClass = `sev-${ev.severity.toLowerCase()}`;
      return `
        <div class="soe-item ${sevClass}">
          <div class="soe-item-header">
            <span class="soe-time">${ev.displayTime}</span>
            <span class="soe-comp">${ev.componentName}</span>
            <span class="soe-sev-badge ${sevClass}">${ev.severity}</span>
          </div>
          <div class="soe-msg">${ev.message}</div>
          ${ev.ruleCode ? `<div class="soe-rule-code">Regla: ${ev.ruleCode}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  subscribe() {
    this.eventBus.on('soe:event-logged', () => {
      this.refreshEventsList();
    });

    this.eventBus.on('soe:cleared', () => {
      this.refreshEventsList();
    });

    this.eventBus.on('interlocking:toggled', ({ enabled }) => {
      const badge = this.container.querySelector('#soe-interlock-status-badge');
      const chk = this.container.querySelector('#chk-interlock-enabled');
      if (badge) {
        badge.className = `badge ${enabled ? 'badge-closed' : 'badge-oos'}`;
        badge.textContent = enabled ? 'ENCLAVAMIENTO ACTIVO' : 'BYPASS / OVERRIDE';
      }
      if (chk) chk.checked = enabled;
    });
  }
}
