/**
 * EconomicsPanel - SubstationTopologySim
 * Panel de análisis tecnoeconómico, evaluación de ciclo de vida (LCC), CAPEX, OPEX y costo de falla CENS.
 */

import { EconomicEngine, DEFAULT_ECONOMIC_PARAMS } from '../model/economic-engine.js';

export class EconomicsPanel {
  /**
   * @param {HTMLElement} container
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/event-bus.js').EventBus} eventBus
   */
  constructor(container, networkModel, eventBus) {
    this.container = container;
    this.networkModel = networkModel;
    this.eventBus = eventBus;

    this.params = { ...DEFAULT_ECONOMIC_PARAMS };
    this.lastResult = null;

    this.render();
    this.subscribe();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Evaluación Tecnoeconómica</span>
          <span class="preset-tag-badge">Fase 6</span>
        </div>
        <div class="panel-subtitle">Análisis de Ciclo de Vida (LCC) y Costo Anualizado Comparable (TAC)</div>

        <div class="econ-params-grid">
          <div class="prop-group">
            <label class="prop-label">Tasa Descuento r (%)</label>
            <input type="number" id="input-econ-rate" class="prop-input" value="${this.params.discountRate * 100}" min="1" max="25" step="0.5" />
          </div>
          <div class="prop-group">
            <label class="prop-label">Vida Útil N (años)</label>
            <input type="number" id="input-econ-lifetime" class="prop-input" value="${this.params.projectLifetimeYears}" min="10" max="50" step="1" />
          </div>
          <div class="prop-group" style="grid-column: span 2;">
            <label class="prop-label">Costo de Falla VoLL (USD/MWh)</label>
            <input type="number" id="input-econ-voll" class="prop-input" value="${this.params.vollUsdPerMWh}" min="100" max="10000" step="100" />
          </div>
        </div>

        <div class="reliability-actions-bar" style="margin-top: 10px;">
          <button id="btn-calc-economics" class="btn btn-primary" style="flex: 1;">
            Recalcular TAC / LCC
          </button>
          <button id="btn-show-econ-benchmark" class="btn btn-subtle" title="Comparar las 6 topologías">
            Benchmark TAC
          </button>
        </div>
      </div>

      <!-- Métricas Principales (Dashboard) -->
      <div class="panel-section" id="econ-dashboard-section" style="display: none;">
        <div class="panel-header">
          <span class="panel-title">Costo Anualizado Comparable (TAC)</span>
          <span class="badge badge-energized" id="tac-total-badge">$0 USD/año</span>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">CAPEX Total</span>
            <span class="kpi-value" id="kpi-capex">$0.00 M</span>
            <span class="kpi-unit">Inversión inicial (USD)</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">OPEX Anual</span>
            <span class="kpi-value" id="kpi-opex">$0 k</span>
            <span class="kpi-unit">Mantenimiento y seguros/año</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Penalización CENS</span>
            <span class="kpi-value" id="kpi-cens">$0 k</span>
            <span class="kpi-unit">Costo de energía cortada/año</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Costo de Ciclo (LCC)</span>
            <span class="kpi-value" id="kpi-lcc">$0.00 M</span>
            <span class="kpi-unit">Valor Presente Neto (30 años)</span>
          </div>
        </div>

        <!-- Desglose de Inversión CAPEX -->
        <div class="econ-breakdown-box">
          <span class="prop-label" style="margin-bottom: 6px; display: block;">Desglose de Inversión Inicial (CAPEX):</span>
          <div class="breakdown-row">
            <span>Aparamenta Electromecánica:</span>
            <strong id="bk-electromechanical">$0</strong>
          </div>
          <div class="breakdown-row">
            <span>Obras Civiles y Terreno (30%):</span>
            <strong id="bk-civil">$0</strong>
          </div>
          <div class="breakdown-row">
            <span>Control, SCADA y Protecciones (15%):</span>
            <strong id="bk-control">$0</strong>
          </div>
          <div class="breakdown-row">
            <span>Ingeniería y Gerenciamiento (8%):</span>
            <strong id="bk-eng">$0</strong>
          </div>
        </div>
      </div>

      <!-- Vista de Benchmark Tecnoeconómico -->
      <div class="panel-section" id="econ-benchmark-view-section" style="display: none;">
        <div class="panel-header">
          <span class="panel-title">Comparativa Económica de las 6 Topologías</span>
          <button id="btn-close-econ-benchmark" class="btn btn-sm btn-subtle">Cerrar</button>
        </div>
        <div class="panel-subtitle">Compromiso óptimo entre Inversión (CAPEX) y Confiabilidad (CENS):</div>
        <div id="econ-benchmark-table-container"></div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#btn-calc-economics')?.addEventListener('click', () => {
      this.readInputs();
      this.runEconomics();
    });

    this.container.querySelector('#btn-show-econ-benchmark')?.addEventListener('click', () => {
      this.readInputs();
      this.showBenchmark();
    });

    this.container.querySelector('#btn-close-econ-benchmark')?.addEventListener('click', () => {
      const bSec = this.container.querySelector('#econ-benchmark-view-section');
      if (bSec) bSec.style.display = 'none';
      if (this.lastResult) {
        this.container.querySelector('#econ-dashboard-section').style.display = 'block';
      }
    });
  }

  readInputs() {
    const rateInput = this.container.querySelector('#input-econ-rate');
    const lifetimeInput = this.container.querySelector('#input-econ-lifetime');
    const vollInput = this.container.querySelector('#input-econ-voll');

    if (rateInput) this.params.discountRate = Math.max(0.01, Number(rateInput.value) / 100);
    if (lifetimeInput) this.params.projectLifetimeYears = Math.max(5, Number(lifetimeInput.value));
    if (vollInput) this.params.vollUsdPerMWh = Math.max(100, Number(vollInput.value));
  }

  runEconomics() {
    this.lastResult = EconomicEngine.calculateEconomics(this.networkModel, null, this.params);
    this.displayEconomics(this.lastResult);
  }

  displayEconomics(res) {
    const dashSec = this.container.querySelector('#econ-dashboard-section');
    const bSec = this.container.querySelector('#econ-benchmark-view-section');

    if (dashSec) dashSec.style.display = 'block';
    if (bSec) bSec.style.display = 'none';

    // Badge TAC
    const tacBadge = this.container.querySelector('#tac-total-badge');
    if (tacBadge) {
      tacBadge.textContent = `$${(res.totalAnnualizedCostUsd / 1000).toFixed(1)} k USD/año`;
    }

    // KPIs
    this.container.querySelector('#kpi-capex').textContent = `$${(res.totalCapexUsd / 1000000).toFixed(2)} M`;
    this.container.querySelector('#kpi-opex').textContent = `$${(res.annualOpexUsd / 1000).toFixed(1)} k`;
    this.container.querySelector('#kpi-cens').textContent = `$${(res.annualCensUsd / 1000).toFixed(1)} k`;
    this.container.querySelector('#kpi-lcc').textContent = `$${(res.totalLccUsd / 1000000).toFixed(2)} M`;

    // Desglose
    this.container.querySelector('#bk-electromechanical').textContent = `$${res.electromechanicalCost.toLocaleString()} USD`;
    this.container.querySelector('#bk-civil').textContent = `$${res.civilWorksCost.toLocaleString()} USD`;
    this.container.querySelector('#bk-control').textContent = `$${res.controlProtectionCost.toLocaleString()} USD`;
    this.container.querySelector('#bk-eng').textContent = `$${res.engineeringManagementCost.toLocaleString()} USD`;
  }

  showBenchmark() {
    const dashSec = this.container.querySelector('#econ-dashboard-section');
    const bSec = this.container.querySelector('#econ-benchmark-view-section');

    if (dashSec) dashSec.style.display = 'none';
    if (bSec) bSec.style.display = 'block';

    const benchmark = EconomicEngine.benchmarkAllTopologiesEconomics(this.networkModel, this.params);
    const container = this.container.querySelector('#econ-benchmark-table-container');

    const maxTac = Math.max(...benchmark.map(b => b.totalAnnualizedCostUsd), 1);

    container.innerHTML = `
      <div class="benchmark-list">
        ${benchmark.map((b, idx) => {
          const barPct = Math.min(100, Math.max(5, (b.totalAnnualizedCostUsd / maxTac) * 100));
          return `
            <div class="benchmark-item">
              <div class="bm-header">
                <span class="bm-rank">#${idx + 1}</span>
                <span class="bm-name">${b.name}</span>
                <span class="badge ${b.satisfiesN1 ? 'badge-open' : 'badge-closed'}">
                  ${b.satisfiesN1 ? 'N-1 OK' : 'VULNERABLE'}
                </span>
              </div>
              <div class="bm-metrics">
                <span>TAC: <strong>$${(b.totalAnnualizedCostUsd / 1000).toFixed(1)} k/año</strong></span>
                <span>CAPEX: <strong>$${(b.totalCapexUsd / 1000000).toFixed(2)} M</strong></span>
                <span>CENS: <strong>$${(b.annualCensUsd / 1000).toFixed(1)} k</strong></span>
              </div>
              <div class="bm-bar-track">
                <div class="bm-bar-fill" style="width: ${barPct}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  subscribe() {
    this.eventBus.on('preset:loaded', () => {
      this.runEconomics();
    });

    this.eventBus.on('model:component-added', () => {
      if (this.lastResult) this.runEconomics();
    });

    this.eventBus.on('model:component-removed', () => {
      if (this.lastResult) this.runEconomics();
    });
  }
}
