/**
 * ReliabilityPanel - SubstationTopologySim
 * Panel de análisis de contingencias N-1, cálculo probabilístico de EENS, LOLE y benchmark comparativo.
 */

import { ReliabilityEngine } from '../model/reliability-engine.js';
import { OperationalState } from '../model/components.js';

export class ReliabilityPanel {
  /**
   * @param {HTMLElement} container
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('../editor/svg-editor.js').SvgEditor} svgEditor
   */
  constructor(container, networkModel, eventBus, svgEditor) {
    this.container = container;
    this.networkModel = networkModel;
    this.eventBus = eventBus;
    this.svgEditor = svgEditor;

    this.lastAnalysis = null;
    this.simulatedAssetId = null;

    this.render();
    this.subscribe();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Análisis de Confiabilidad N-1</span>
          <span class="preset-tag-badge">Fase 5</span>
        </div>
        <div class="panel-subtitle">Evaluación estática de contingencias simples (IEEE Std 493 / CIGRE)</div>

        <div class="reliability-actions-bar">
          <button id="btn-calc-n1" class="btn btn-primary" style="flex: 1;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Calcular N-1
          </button>
          <button id="btn-show-benchmark" class="btn btn-subtle" title="Comparar las 6 topologías">
            Benchmark
          </button>
        </div>
      </div>

      <!-- Resultados / Dashboard de Confiabilidad -->
      <div class="panel-section" id="reliability-dashboard-section" style="display: none;">
        <div class="panel-header">
          <span class="panel-title">Índices del Sistema</span>
          <span id="n1-status-pill" class="badge">EVALUANDO</span>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">EENS Estimada</span>
            <span class="kpi-value" id="kpi-eens">0.00</span>
            <span class="kpi-unit">MWh / año</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">LOLE Esperada</span>
            <span class="kpi-value" id="kpi-lole">0.00</span>
            <span class="kpi-unit">Horas / año</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Probabilidad LOLP</span>
            <span class="kpi-value" id="kpi-lolp">0.00000</span>
            <span class="kpi-unit">Índice adimensional</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Cargas en Riesgo</span>
            <span class="kpi-value" id="kpi-critical-count">0</span>
            <span class="kpi-unit">de contingencias críticas</span>
          </div>
        </div>

        <div class="worst-contingency-box" id="worst-contingency-box">
          <span class="worst-title">Peor Contingencia (Worst-Case N-1):</span>
          <span class="worst-desc" id="worst-contingency-desc">Ninguna</span>
        </div>
      </div>

      <!-- Tabla de Contingencias -->
      <div class="panel-section" id="contingencies-table-section" style="display: none;">
        <div class="panel-header">
          <span class="panel-title">Lista de Contingencias N-1</span>
          <span class="contingencies-count-badge" id="contingencies-count">0</span>
        </div>

        <div class="contingencies-table-container">
          <div class="contingencies-list" id="contingencies-list"></div>
        </div>
      </div>

      <!-- Vista Modal / Panel de Benchmark Comparativo -->
      <div class="panel-section" id="benchmark-view-section" style="display: none;">
        <div class="panel-header">
          <span class="panel-title">Comparativa de las 6 Topologías</span>
          <button id="btn-close-benchmark" class="btn btn-sm btn-subtle">Cerrar</button>
        </div>
        <div class="panel-subtitle">Clasificación por Resiliencia N-1 y Confiabilidad Global:</div>
        <div id="benchmark-table-container"></div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#btn-calc-n1')?.addEventListener('click', () => {
      this.runAnalysis();
    });

    this.container.querySelector('#btn-show-benchmark')?.addEventListener('click', () => {
      this.showBenchmark();
    });

    this.container.querySelector('#btn-close-benchmark')?.addEventListener('click', () => {
      const bSec = this.container.querySelector('#benchmark-view-section');
      if (bSec) bSec.style.display = 'none';
      if (this.lastAnalysis) {
        this.container.querySelector('#reliability-dashboard-section').style.display = 'block';
        this.container.querySelector('#contingencies-table-section').style.display = 'block';
      }
    });
  }

  runAnalysis() {
    this.lastAnalysis = ReliabilityEngine.analyzeN1Contingencies(this.networkModel);
    this.displayAnalysis(this.lastAnalysis);
  }

  displayAnalysis(res) {
    const dashSec = this.container.querySelector('#reliability-dashboard-section');
    const tableSec = this.container.querySelector('#contingencies-table-section');
    const bSec = this.container.querySelector('#benchmark-view-section');

    if (dashSec) dashSec.style.display = 'block';
    if (tableSec) tableSec.style.display = 'block';
    if (bSec) bSec.style.display = 'none';

    // Status pill
    const pill = this.container.querySelector('#n1-status-pill');
    if (pill) {
      if (res.satisfiesN1Criterion) {
        pill.className = 'badge badge-open';
        pill.textContent = 'CUMPLE CRITERIO N-1';
      } else {
        pill.className = 'badge badge-closed';
        pill.textContent = 'VULNERABLE N-1';
      }
    }

    // KPIs
    this.container.querySelector('#kpi-eens').textContent = res.totalEensMWhYear.toFixed(2);
    this.container.querySelector('#kpi-lole').textContent = res.totalLoleHoursYear.toFixed(2);
    this.container.querySelector('#kpi-lolp').textContent = res.lolp.toFixed(5);
    this.container.querySelector('#kpi-critical-count').textContent = `${res.criticalContingenciesCount} / ${res.evaluatedAssetsCount}`;

    // Peor contingencia
    const worstDesc = this.container.querySelector('#worst-contingency-desc');
    if (worstDesc) {
      if (res.worstContingency && res.worstContingency.lostPowerMW > 0) {
        worstDesc.innerHTML = `<strong>${res.worstContingency.assetName}</strong> causa pérdida de <strong>${res.worstContingency.lostPowerMW} MW</strong> (${res.worstContingency.eensMWhYear.toFixed(2)} MWh/año EENS).`;
      } else {
        worstDesc.textContent = 'Ninguna falla simple causa pérdida de carga en esta configuración.';
      }
    }

    // Lista de contingencias
    const listEl = this.container.querySelector('#contingencies-list');
    const countEl = this.container.querySelector('#contingencies-count');
    if (countEl) countEl.textContent = `${res.contingencies.length} evaluadas`;

    if (listEl) {
      listEl.innerHTML = res.contingencies.map(cont => {
        const critClass = cont.isCritical ? 'cont-critical' : 'cont-safe';
        const isSimulating = this.simulatedAssetId === cont.assetId;
        return `
          <div class="contingency-item ${critClass}">
            <div class="cont-item-top">
              <span class="cont-asset-name">${cont.assetName}</span>
              <span class="cont-lost-mw ${cont.isCritical ? 'lost-red' : 'lost-green'}">
                ${cont.isCritical ? `-${cont.lostPowerMW} MW` : '0 MW (N-1 OK)'}
              </span>
            </div>
            <div class="cont-item-details">
              <span>Falla: ${(cont.failureRate * 1000).toFixed(1)}/k·año · MTTR: ${cont.mttrHours}h</span>
              <span>EENS: <strong>${cont.eensMWhYear.toFixed(2)} MWh/a</strong></span>
            </div>
            <div class="cont-item-action">
              <button class="btn btn-xs btn-sim-fault" data-asset-id="${cont.assetId}">
                ${isSimulating ? 'Restablecer' : 'Simular Disparo'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Eventos de botones de simulación de falla
      listEl.querySelectorAll('.btn-sim-fault').forEach(btn => {
        btn.addEventListener('click', () => {
          const assetId = btn.dataset.assetId;
          this.toggleFaultSimulation(assetId);
        });
      });
    }
  }

  toggleFaultSimulation(assetId) {
    const comp = this.networkModel.getComponent(assetId);
    if (!comp) return;

    if (this.simulatedAssetId === assetId) {
      // Restablecer
      this.networkModel.updateComponent(assetId, { operationalState: OperationalState.CLOSED });
      this.simulatedAssetId = null;
    } else {
      // Si había otro simulado, restablecerlo primero
      if (this.simulatedAssetId) {
        this.networkModel.updateComponent(this.simulatedAssetId, { operationalState: OperationalState.CLOSED });
      }
      // Poner en fuera de servicio
      this.networkModel.updateComponent(assetId, { operationalState: OperationalState.OUT_OF_SERVICE });
      this.simulatedAssetId = assetId;
    }

    if (this.lastAnalysis) {
      this.displayAnalysis(this.lastAnalysis);
    }
  }

  showBenchmark() {
    const dashSec = this.container.querySelector('#reliability-dashboard-section');
    const tableSec = this.container.querySelector('#contingencies-table-section');
    const bSec = this.container.querySelector('#benchmark-view-section');

    if (dashSec) dashSec.style.display = 'none';
    if (tableSec) tableSec.style.display = 'none';
    if (bSec) bSec.style.display = 'block';

    const benchmark = ReliabilityEngine.benchmarkAllTopologies(this.networkModel);
    const container = this.container.querySelector('#benchmark-table-container');

    const maxEens = Math.max(...benchmark.map(b => b.totalEensMWhYear), 1);

    container.innerHTML = `
      <div class="benchmark-list">
        ${benchmark.map((b, idx) => {
          const barPct = Math.min(100, Math.max(5, (b.totalEensMWhYear / maxEens) * 100));
          return `
            <div class="benchmark-item">
              <div class="bm-header">
                <span class="bm-rank">#${idx + 1}</span>
                <span class="bm-name">${b.name}</span>
                <span class="badge ${b.satisfiesN1 ? 'badge-open' : 'badge-closed'}">
                  ${b.satisfiesN1 ? 'CUMPLE N-1' : 'NO CUMPLE'}
                </span>
              </div>
              <div class="bm-metrics">
                <span>EENS: <strong>${b.totalEensMWhYear.toFixed(2)} MWh/a</strong></span>
                <span>LOLE: <strong>${b.totalLoleHoursYear.toFixed(1)} h/a</strong></span>
                <span>CAPEX: <strong>${b.relativeCost.toFixed(2)}x</strong></span>
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
      this.simulatedAssetId = null;
      // Auto-ejecutar análisis de la topología cargada
      this.runAnalysis();
    });

    this.eventBus.on('model:component-updated', () => {
      // Si se actualizan componentes y ya teníamos un análisis, refrescar
      if (this.lastAnalysis && !this.simulatedAssetId) {
        this.runAnalysis();
      }
    });
  }
}
