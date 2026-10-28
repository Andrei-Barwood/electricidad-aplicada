/**
 * PropertiesPanel - SubstationTopologySim
 * Panel de inspección y edición de parámetros físicos, conectividad galvánica,
 * estados operativos y confiabilidad.
 */

import { OperationalState } from '../model/components.js';

export class PropertiesPanel {
  /**
   * @param {HTMLElement} container
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('../editor/selection-manager.js').SelectionManager} selectionManager
   */
  constructor(container, networkModel, eventBus, selectionManager) {
    this.container = container;
    this.networkModel = networkModel;
    this.eventBus = eventBus;
    this.selectionManager = selectionManager;

    this.selectedConnectionId = null;

    this.subscribe();
    this.renderEmptyState();
  }

  subscribe() {
    this.eventBus.on('selection:changed', ({ selectedId }) => {
      this.selectedConnectionId = null;
      if (selectedId) {
        const comp = this.networkModel.getComponent(selectedId);
        if (comp) {
          this.renderComponentProperties(comp);
        } else {
          this.renderEmptyState();
        }
      } else if (!this.selectedConnectionId) {
        this.renderEmptyState();
      }
    });

    this.eventBus.on('connection:selected', ({ connectionId }) => {
      this.selectedConnectionId = connectionId;
      const conn = this.networkModel.getConnection(connectionId);
      if (conn) {
        this.renderConnectionProperties(conn);
      } else {
        this.renderEmptyState();
      }
    });

    this.eventBus.on('model:component-updated', ({ component }) => {
      if (this.selectionManager.getSelectedId() === component.id) {
        this.syncInputs(component);
      }
    });

    this.eventBus.on('topology:updated', () => {
      const selectedId = this.selectionManager.getSelectedId();
      if (selectedId) {
        const comp = this.networkModel.getComponent(selectedId);
        if (comp) this.renderComponentProperties(comp);
      } else if (this.selectedConnectionId) {
        const conn = this.networkModel.getConnection(this.selectedConnectionId);
        if (conn) this.renderConnectionProperties(conn);
      }
    });
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Inspector Eléctrico</span>
        </div>
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <div class="empty-state-text">
            Selecciona un equipo o rama eléctrica en el diagrama unifilar para inspeccionar su conectividad, estado de energización y parámetros de operación.
          </div>
        </div>
      </div>
    `;
  }

  renderConnectionProperties(conn) {
    const fromComp = this.networkModel.getComponent(conn.fromComponentId);
    const toComp = this.networkModel.getComponent(conn.toComponentId);

    const isLive = conn.isEnergized;
    const badgeClass = isLive ? 'badge-energized' : 'badge-deenergized';
    const badgeText = isLive ? 'RAMA ENERGIZADA' : 'RAMA AISLADA';

    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Rama Eléctrica</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>

        <div class="prop-group">
          <label class="prop-label">ID Conexión</label>
          <input type="text" class="prop-input prop-readonly" value="${conn.id}" readonly />
        </div>

        <div class="prop-group">
          <label class="prop-label">Extremo Origen</label>
          <input type="text" class="prop-input prop-readonly" value="${fromComp ? fromComp.name : conn.fromComponentId} [${conn.fromTerminalId}]" readonly />
        </div>

        <div class="prop-group">
          <label class="prop-label">Extremo Destino</label>
          <input type="text" class="prop-input prop-readonly" value="${toComp ? toComp.name : conn.toComponentId} [${conn.toTerminalId}]" readonly />
        </div>

        <button id="btn-delete-conn" class="btn btn-danger" style="width: 100%; margin-top: 10px;">
          Eliminar Conexión
        </button>
      </div>
    `;

    document.getElementById('btn-delete-conn')?.addEventListener('click', () => {
      this.networkModel.removeConnection(conn.id);
      this.renderEmptyState();
    });
  }

  renderComponentProperties(comp) {
    const isClosed = comp.operationalState === OperationalState.CLOSED;
    const isOOS = comp.operationalState === OperationalState.OUT_OF_SERVICE;

    const stateBadgeClass = isOOS ? 'badge-oos' : (isClosed ? 'badge-closed' : 'badge-open');
    const stateBadgeLabel = isOOS ? 'MTO (Fuera serv.)' : (isClosed ? 'I (Cerrado)' : 'O (Abierto)');

    const energBadgeClass = comp.isEnergized ? 'badge-energized' : 'badge-deenergized';
    const energBadgeLabel = comp.isEnergized ? 'VIVO (220/66 kV)' : 'DESENERGIZADO';

    const unavailMinutesYear = (comp.unavailability * 8760 * 60).toFixed(1);

    // Conexiones vinculadas a los terminales de este componente
    const connectedBranches = this.networkModel.getConnectionsForComponent(comp.id);
    const connectionItemsHtml = connectedBranches.length > 0
      ? connectedBranches.map(c => {
          const isOrigin = c.fromComponentId === comp.id;
          const otherCompId = isOrigin ? c.toComponentId : c.fromComponentId;
          const otherComp = this.networkModel.getComponent(otherCompId);
          const liveDot = c.isEnergized ? '🔴' : '⚪';
          return `<div style="font-size: 11px; font-family: var(--font-family-mono); padding: 4px 0; border-bottom: 1px dotted var(--color-border-subtle);">
            ${liveDot} Conectado a <strong>${otherComp ? otherComp.name : otherCompId}</strong>
          </div>`;
        }).join('')
      : '<div style="font-size: 11px; color: var(--color-text-muted);">Sin conexiones conectadas. Haz clic en sus terminales circulares para cablear.</div>';

    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Identificación y Estado</span>
          <div style="display: flex; gap: 4px;">
            <span class="badge ${energBadgeClass}">${energBadgeLabel}</span>
            <span class="badge ${stateBadgeClass}">${stateBadgeLabel}</span>
          </div>
        </div>

        <div class="prop-group">
          <label class="prop-label">ID Sistema</label>
          <input type="text" class="prop-input prop-readonly" value="${comp.id}" readonly />
        </div>

        <div class="prop-group">
          <label class="prop-label">Tipo de Equipo</label>
          <input type="text" class="prop-input prop-readonly" value="${comp.type}" readonly />
        </div>

        <div class="prop-group">
          <label class="prop-label">Designación / Nombre</label>
          <input type="text" id="prop-name-input" class="prop-input" value="${comp.name}" />
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Conmutación y Maniobra</span>
        </div>

        <div class="prop-group">
          <label class="prop-label">Condición Física</label>
          <select id="prop-state-select" class="prop-select">
            <option value="${OperationalState.CLOSED}" ${comp.operationalState === OperationalState.CLOSED ? 'selected' : ''}>
              Cerrado / Conectado [I]
            </option>
            <option value="${OperationalState.OPEN}" ${comp.operationalState === OperationalState.OPEN ? 'selected' : ''}>
              Abierto / Aislado [O]
            </option>
            <option value="${OperationalState.OUT_OF_SERVICE}" ${comp.operationalState === OperationalState.OUT_OF_SERVICE ? 'selected' : ''}>
              Fuera de Servicio / Mantenimiento
            </option>
          </select>
        </div>

        <div class="prop-grid-2">
          <div class="prop-group">
            <label class="prop-label">Posición X (px)</label>
            <input type="number" id="prop-pos-x" class="prop-input" value="${comp.position.x}" step="20" />
          </div>
          <div class="prop-group">
            <label class="prop-label">Posición Y (px)</label>
            <input type="number" id="prop-pos-y" class="prop-input" value="${comp.position.y}" step="20" />
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Conectividad Galvánica (${connectedBranches.length})</span>
        </div>
        <div style="margin-bottom: var(--space-xs);">
          ${connectionItemsHtml}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Parámetros Eléctricos</span>
        </div>

        <div class="prop-grid-2">
          <div class="prop-group">
            <label class="prop-label">Tensión (kV)</label>
            <input type="number" id="prop-voltage" class="prop-input" value="${comp.properties.voltageLevel || 220}" min="1" max="1000" />
          </div>
          <div class="prop-group">
            <label class="prop-label">Corriente Nom. (A)</label>
            <input type="number" id="prop-current" class="prop-input" value="${comp.properties.ratedCurrent || 1250}" min="10" />
          </div>
        </div>

        <div class="prop-group">
          <label class="prop-label">Potencia Nominal (MVA / MW)</label>
          <input type="number" id="prop-power" class="prop-input" value="${comp.properties.ratedPower || 50}" min="1" />
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Confiabilidad Preliminar</span>
        </div>

        <div class="prop-grid-2">
          <div class="prop-group">
            <label class="prop-label">Tasa Falla λ (1/año)</label>
            <input type="number" id="prop-lambda" class="prop-input" value="${comp.failureRate}" step="0.001" min="0" />
          </div>
          <div class="prop-group">
            <label class="prop-label">MTTR (horas)</label>
            <input type="number" id="prop-mttr" class="prop-input" value="${comp.mttrHours}" step="1" min="0.1" />
          </div>
        </div>

        <div class="prop-grid-2">
          <div class="prop-group">
            <label class="prop-label">Disponibilidad (A)</label>
            <input type="text" class="prop-input prop-readonly" value="${(comp.availability * 100).toFixed(4)} %" readonly />
          </div>
          <div class="prop-group">
            <label class="prop-label">Indisponibilidad</label>
            <input type="text" class="prop-input prop-readonly" value="${unavailMinutesYear} min/año" readonly />
          </div>
        </div>
      </div>
    `;

    this.bindPropertyInputs(comp.id);
  }

  bindPropertyInputs(compId) {
    const nameInput = document.getElementById('prop-name-input');
    nameInput?.addEventListener('input', (e) => {
      this.networkModel.updateComponent(compId, { name: e.target.value });
    });

    const stateSelect = document.getElementById('prop-state-select');
    stateSelect?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, { operationalState: e.target.value });
    });

    const posXInput = document.getElementById('prop-pos-x');
    posXInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        position: { x: Number(e.target.value) }
      });
    });

    const posYInput = document.getElementById('prop-pos-y');
    posYInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        position: { y: Number(e.target.value) }
      });
    });

    const voltInput = document.getElementById('prop-voltage');
    voltInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        properties: { voltageLevel: Number(e.target.value) }
      });
    });

    const currInput = document.getElementById('prop-current');
    currInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        properties: { ratedCurrent: Number(e.target.value) }
      });
    });

    const pwrInput = document.getElementById('prop-power');
    pwrInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        properties: { ratedPower: Number(e.target.value) }
      });
    });

    const lambdaInput = document.getElementById('prop-lambda');
    lambdaInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        failureRate: Number(e.target.value)
      });
    });

    const mttrInput = document.getElementById('prop-mttr');
    mttrInput?.addEventListener('change', (e) => {
      this.networkModel.updateComponent(compId, {
        mttrHours: Number(e.target.value)
      });
    });
  }

  syncInputs(comp) {
    const activeEl = document.activeElement;

    const posXInput = document.getElementById('prop-pos-x');
    if (posXInput && activeEl !== posXInput) {
      posXInput.value = comp.position.x;
    }

    const posYInput = document.getElementById('prop-pos-y');
    if (posYInput && activeEl !== posYInput) {
      posYInput.value = comp.position.y;
    }
  }
}
