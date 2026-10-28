/**
 * ReliabilityEngine - SubstationTopologySim
 * Motor de análisis probabilístico de confiabilidad y contingencias estáticas N-1.
 * Estándares: IEEE Gold Book (Std 493) / CIGRE WG C4 / Billinton & Allan.
 * Calcula EENS (MWh/año), LOLE (horas/año), LOLP, disponibilidad A e indisponibilidad U.
 */

import { ComponentType, OperationalState } from './components.js';
import { TopologyValidator } from './topology-validator.js';
import { 
  TOPOLOGY_PRESET_KEYS, 
  TOPOLOGY_PRESETS_METADATA, 
  loadTopologyPreset 
} from './topology-presets.js';

export class ReliabilityEngine {
  /**
   * Ejecuta el análisis estático de contingencias N-1 sobre el modelo activo.
   * Evalúa la pérdida individual de cada activo y su impacto en el deslastre de carga.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @returns {{
   *   evaluatedAssetsCount: number,
   *   criticalContingenciesCount: number,
   *   satisfiesN1Criterion: boolean,
   *   totalEensMWhYear: number,
   *   totalLoleHoursYear: number,
   *   lolp: number,
   *   worstContingency: Object|null,
   *   contingencies: Array<Object>,
   *   baselineSuppliedPowerMW: number
   * }}
   */
  static analyzeN1Contingencies(networkModel) {
    const components = networkModel.getAllComponents();

    // 1. Condición base (N-0: estado actual sin falla contingente)
    const baseAnalysis = TopologyValidator.analyze(networkModel);
    const baseSuppliedLoads = baseAnalysis.suppliedLoads;
    const baseSuppliedPowerMW = baseSuppliedLoads.reduce((sum, ld) => sum + (ld.properties?.ratedPower || 0), 0);

    const contingencies = [];
    let totalEensMWhYear = 0;
    let totalLoleHoursYear = 0;
    let criticalContingenciesCount = 0;
    let worstContingency = null;

    // Componentes evaluables para falla N-1 (activos físicos de maniobra, transformación y barras)
    const candidates = components.filter(c => 
      c.type === ComponentType.CIRCUIT_BREAKER ||
      c.type === ComponentType.DISCONNECTOR ||
      c.type === ComponentType.BUSBAR ||
      c.type === ComponentType.TRANSFORMER ||
      c.type === ComponentType.SOURCE
    );

    for (const asset of candidates) {
      // Guardar estado original
      const originalState = asset.operationalState;

      // Simular falla / salida forzada del activo (N-1)
      asset.operationalState = OperationalState.OUT_OF_SERVICE;

      // Ejecutar recorrido topológico de energización en contingencia
      const contAnalysis = TopologyValidator.analyze(networkModel);

      // Restaurar estado de inmediato
      asset.operationalState = originalState;

      // Evaluar cargas perdidas en esta contingencia específica
      const unsuppliedLoads = contAnalysis.unsuppliedLoads;
      const suppliedLoads = contAnalysis.suppliedLoads;
      const suppliedPowerMW = suppliedLoads.reduce((sum, ld) => sum + (ld.properties?.ratedPower || 0), 0);
      const lostPowerMW = Math.max(0, baseSuppliedPowerMW - suppliedPowerMW);

      // Parámetros de confiabilidad del activo
      const lambda = asset.failureRate || 0.01; // fallas/año
      const mttr = asset.mttrHours || 12;       // horas
      const unavailability = asset.unavailability || ((lambda * mttr) / 8760);
      const availability = 1 - unavailability;

      // Cálculo de EENS (MWh/año) y LOLE (horas/año)
      // EENS = P_cortada (MW) * Horas_falla_año (h) = P_cortada * (lambda * MTTR)
      const outageHoursYear = lambda * mttr;
      const eensMWhYear = lostPowerMW * outageHoursYear;
      const loleContribution = lostPowerMW > 0 ? outageHoursYear : 0;

      const isCritical = lostPowerMW > 0;
      if (isCritical) {
        criticalContingenciesCount++;
      }

      totalEensMWhYear += eensMWhYear;
      totalLoleHoursYear += loleContribution;

      const record = {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        voltageLevel: asset.properties?.voltageLevel || 220,
        lostPowerMW,
        unsuppliedCount: unsuppliedLoads.length,
        unsuppliedLoadNames: unsuppliedLoads.map(l => l.name),
        failureRate: lambda,
        mttrHours: mttr,
        unavailability,
        availability,
        outageHoursYear,
        eensMWhYear,
        isCritical
      };

      contingencies.push(record);

      if (!worstContingency || eensMWhYear > worstContingency.eensMWhYear) {
        worstContingency = record;
      }
    }

    // Ordenar contingencias de mayor a menor severidad (EENS)
    contingencies.sort((a, b) => b.eensMWhYear - a.eensMWhYear);

    // Criterio N-1 estricto: Ninguna falla individual en aparato de maniobra/barra debe causar pérdida de carga
    // si el diseño cuenta con redundancia de barra o bahía
    const satisfiesN1Criterion = criticalContingenciesCount === 0;
    const lolp = Math.min(1.0, totalLoleHoursYear / 8760);

    return {
      evaluatedAssetsCount: candidates.length,
      criticalContingenciesCount,
      satisfiesN1Criterion,
      totalEensMWhYear: Number(totalEensMWhYear.toFixed(3)),
      totalLoleHoursYear: Number(totalLoleHoursYear.toFixed(2)),
      lolp: Number(lolp.toFixed(5)),
      worstContingency,
      contingencies,
      baselineSuppliedPowerMW: baseSuppliedPowerMW
    };
  }

  /**
   * Ejecuta una comparativa automatizada (Benchmark) de confiabilidad entre las 6 topologías normalizadas.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @returns {Array<Object>}
   */
  static benchmarkAllTopologies(networkModel) {
    const keys = Object.values(TOPOLOGY_PRESET_KEYS);
    const results = [];

    // Guardar copia del estado previo del modelo si tuviera componentes
    const backupJson = networkModel.toJSON();

    for (const key of keys) {
      const meta = TOPOLOGY_PRESETS_METADATA[key];
      loadTopologyPreset(networkModel, key);

      const n1Result = this.analyzeN1Contingencies(networkModel);

      results.push({
        key,
        name: meta.name,
        standard: meta.standard,
        reliabilityLevel: meta.reliabilityLevel,
        relativeCost: meta.relativeCost,
        evaluatedAssets: n1Result.evaluatedAssetsCount,
        criticalContingencies: n1Result.criticalContingenciesCount,
        satisfiesN1: n1Result.satisfiesN1Criterion,
        totalEensMWhYear: n1Result.totalEensMWhYear,
        totalLoleHoursYear: n1Result.totalLoleHoursYear,
        lolp: n1Result.lolp,
        worstAsset: n1Result.worstContingency?.assetName || 'Ninguno',
        worstLostMW: n1Result.worstContingency?.lostPowerMW || 0
      });
    }

    // Restaurar el modelo a su estado previo
    if (backupJson.components.length > 0) {
      networkModel.fromJSON(backupJson);
    } else {
      loadTopologyPreset(networkModel, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);
    }

    // Ordenar de menor a mayor EENS (más confiable primero)
    results.sort((a, b) => a.totalEensMWhYear - b.totalEensMWhYear);

    return results;
  }
}
