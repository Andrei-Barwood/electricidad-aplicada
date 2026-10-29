/**
 * EconomicEngine - SubstationTopologySim
 * Motor de análisis tecnoeconómico, evaluación de ciclo de vida (LCC) y costo anualizado comparable (TAC).
 * Estándares: EPRI / IEEE / CIGRE WG C4 / Regulación CNE-CEN (Chile).
 * Modela CAPEX, OPEX, Costo de Falla (CENS) y recuperación de capital (CRF).
 */

import { ComponentType } from './components.js';
import { ReliabilityEngine } from './reliability-engine.js';
import { 
  TOPOLOGY_PRESET_KEYS, 
  TOPOLOGY_PRESETS_METADATA, 
  loadTopologyPreset 
} from './topology-presets.js';

/**
 * Base de costos unitarios de referencia en USD (suministro, montaje electromecánico y puesta en marcha).
 */
export const UNIT_COST_DATABASE = Object.freeze({
  [ComponentType.CIRCUIT_BREAKER]: {
    500: 420000,
    220: 175000,
    110: 105000,
    66: 62000,
    23: 32000,
    default: 175000
  },
  [ComponentType.DISCONNECTOR]: {
    500: 70000,
    220: 32000,
    110: 20000,
    66: 13000,
    23: 7500,
    default: 32000
  },
  [ComponentType.BUSBAR]: {
    // Costo por tramo/posición de barra (incluye aisladores pedestal, conductores tubulares y estructuras)
    costPerUnitWidth: 60, // USD por pixel de ancho en escala del simulador
    baseCost: 20000
  },
  [ComponentType.SOURCE]: {
    // Acometida de red (pararrayos, TCs/TTs de facturación y pórtico de llegada)
    500: 180000,
    220: 85000,
    110: 55000,
    66: 35000,
    23: 20000,
    default: 85000
  },
  [ComponentType.FEEDER_LOAD]: {
    // Bahía de salida (trampa de onda, pararrayos de línea, transformadores de medida)
    500: 160000,
    220: 75000,
    110: 48000,
    66: 30000,
    23: 18000,
    default: 75000
  }
});

export const DEFAULT_ECONOMIC_PARAMS = Object.freeze({
  discountRate: 0.07,          // Tasa de descuento anual (7% estándar regulatorio)
  projectLifetimeYears: 30,    // Vida útil del proyecto (30 años)
  vollUsdPerMWh: 2000,         // Costo de la energía no suministrada (Value of Lost Load = 2.000 USD/MWh)
  civilWorksFactor: 0.30,      // Factor de obras civiles, terreno, malla de tierra y BOP (30% sobre equipos)
  controlProtectionFactor: 0.15,// Sistema de control SCADA y protecciones diferenciales (15% sobre equipos)
  opexRate: 0.025              // Costo anual de mantenimiento preventivo y seguros (2.5% del CAPEX total)
});

export class EconomicEngine {
  /**
   * Calcula el factor de recuperación de capital (CRF).
   * @param {number} rate - Tasa de descuento (ej. 0.07)
   * @param {number} years - Años de vida útil (ej. 30)
   * @returns {number}
   */
  static calculateCRF(rate, years) {
    if (rate <= 0) return 1 / years;
    const factor = Math.pow(1 + rate, years);
    return (rate * factor) / (factor - 1);
  }

  /**
   * Estima el costo de un transformador en función de su potencia nominal y nivel de tensión.
   * @param {number} mva
   * @param {number} primaryKv
   * @returns {number}
   */
  static estimateTransformerCost(mva = 50, primaryKv = 220) {
    // Fórmula empírica EPRI: Costo base = $22.000 * (MVA)^0.75 * KvFactor
    const kvFactor = primaryKv >= 500 ? 1.6 : (primaryKv >= 220 ? 1.25 : 1.0);
    const cost = 22000 * Math.pow(mva, 0.75) * kvFactor;
    return Math.round(cost);
  }

  /**
   * Realiza la evaluación económica completa de una subestación activa.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @param {Object} [reliabilityResults] - Resultado previo de ReliabilityEngine.analyzeN1Contingencies
   * @param {Object} [customParams] - Parámetros económicos personalizados
   * @returns {Object}
   */
  static calculateEconomics(networkModel, reliabilityResults = null, customParams = {}) {
    const params = { ...DEFAULT_ECONOMIC_PARAMS, ...customParams };
    const components = networkModel.getAllComponents();

    let electromechanicalCost = 0;
    const equipmentBreakdown = [];

    let countCB = 0;
    let countDS = 0;
    let countTR = 0;
    let countBB = 0;
    let countSRC = 0;
    let countLD = 0;

    for (const comp of components) {
      const kv = comp.properties?.voltageLevel || 220;
      let cost = 0;

      switch (comp.type) {
        case ComponentType.CIRCUIT_BREAKER:
          cost = UNIT_COST_DATABASE[ComponentType.CIRCUIT_BREAKER][kv] || UNIT_COST_DATABASE[ComponentType.CIRCUIT_BREAKER].default;
          countCB++;
          break;

        case ComponentType.DISCONNECTOR:
          cost = UNIT_COST_DATABASE[ComponentType.DISCONNECTOR][kv] || UNIT_COST_DATABASE[ComponentType.DISCONNECTOR].default;
          countDS++;
          break;

        case ComponentType.BUSBAR:
          const w = comp.dimensions?.width || 240;
          cost = UNIT_COST_DATABASE[ComponentType.BUSBAR].baseCost + (w * UNIT_COST_DATABASE[ComponentType.BUSBAR].costPerUnitWidth);
          countBB++;
          break;

        case ComponentType.TRANSFORMER:
          const mva = comp.properties?.ratedPower || 50;
          cost = this.estimateTransformerCost(mva, kv);
          countTR++;
          break;

        case ComponentType.SOURCE:
          cost = UNIT_COST_DATABASE[ComponentType.SOURCE][kv] || UNIT_COST_DATABASE[ComponentType.SOURCE].default;
          countSRC++;
          break;

        case ComponentType.FEEDER_LOAD:
          cost = UNIT_COST_DATABASE[ComponentType.FEEDER_LOAD][kv] || UNIT_COST_DATABASE[ComponentType.FEEDER_LOAD].default;
          countLD++;
          break;

        default:
          cost = 25000;
      }

      electromechanicalCost += cost;
      equipmentBreakdown.push({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        voltageLevel: kv,
        cost
      });
    }

    // Costos complementarios de ingeniería y balance de planta (BOP)
    const civilWorksCost = Math.round(electromechanicalCost * params.civilWorksFactor);
    const controlProtectionCost = Math.round(electromechanicalCost * params.controlProtectionFactor);
    const engineeringManagementCost = Math.round((electromechanicalCost + civilWorksCost) * 0.08);

    // CAPEX Total
    const totalCapexUsd = electromechanicalCost + civilWorksCost + controlProtectionCost + engineeringManagementCost;

    // OPEX Anual (Operación, Mantenimiento preventivo y correctivo, Seguros)
    const annualOpexUsd = Math.round(totalCapexUsd * params.opexRate);

    // Confiabilidad y Costo de Energía No Suministrada (CENS)
    const rel = reliabilityResults || ReliabilityEngine.analyzeN1Contingencies(networkModel);
    const eensMWhYear = rel.totalEensMWhYear;
    const annualCensUsd = Math.round(eensMWhYear * params.vollUsdPerMWh);

    // Factor de Recuperación de Capital y Costo Anualizado Comparable (TAC)
    const crf = this.calculateCRF(params.discountRate, params.projectLifetimeYears);
    const annualizedCapexUsd = Math.round(totalCapexUsd * crf);
    const totalAnnualizedCostUsd = annualizedCapexUsd + annualOpexUsd + annualCensUsd;

    // Costo del Ciclo de Vida (LCC / Valor Presente Neto Total a N años)
    const totalLccUsd = Math.round(totalCapexUsd + ((annualOpexUsd + annualCensUsd) / crf));

    return {
      totalCapexUsd,
      electromechanicalCost,
      civilWorksCost,
      controlProtectionCost,
      engineeringManagementCost,
      annualOpexUsd,
      annualCensUsd,
      eensMWhYear,
      vollUsdPerMWh: params.vollUsdPerMWh,
      discountRate: params.discountRate,
      projectLifetimeYears: params.projectLifetimeYears,
      crf: Number(crf.toFixed(4)),
      annualizedCapexUsd,
      totalAnnualizedCostUsd,
      totalLccUsd,
      counts: {
        circuitBreakers: countCB,
        disconnectors: countDS,
        transformers: countTR,
        busbars: countBB,
        sources: countSRC,
        feeders: countLD,
        totalAssets: components.length
      },
      equipmentBreakdown
    };
  }

  /**
   * Ejecuta un Benchmark Tecnoeconómico integral comparando las 6 topologías normalizadas.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @param {Object} [customParams]
   * @returns {Array<Object>}
   */
  static benchmarkAllTopologiesEconomics(networkModel, customParams = {}) {
    const keys = Object.values(TOPOLOGY_PRESET_KEYS);
    const results = [];

    const backupJson = networkModel.toJSON();

    for (const key of keys) {
      const meta = TOPOLOGY_PRESETS_METADATA[key];
      loadTopologyPreset(networkModel, key);

      const rel = ReliabilityEngine.analyzeN1Contingencies(networkModel);
      const econ = this.calculateEconomics(networkModel, rel, customParams);

      results.push({
        key,
        name: meta.name,
        standard: meta.standard,
        reliabilityLevel: meta.reliabilityLevel,
        satisfiesN1: rel.satisfiesN1Criterion,
        totalCapexUsd: econ.totalCapexUsd,
        annualOpexUsd: econ.annualOpexUsd,
        annualCensUsd: econ.annualCensUsd,
        eensMWhYear: rel.totalEensMWhYear,
        totalAnnualizedCostUsd: econ.totalAnnualizedCostUsd,
        totalLccUsd: econ.totalLccUsd,
        equipmentCounts: econ.counts
      });
    }

    // Restaurar estado previo
    if (backupJson.components.length > 0) {
      networkModel.fromJSON(backupJson);
    } else {
      loadTopologyPreset(networkModel, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);
    }

    // Ordenar por Costo Total Anualizado TAC (más eficiente primero)
    results.sort((a, b) => a.totalAnnualizedCostUsd - b.totalAnnualizedCostUsd);

    return results;
  }
}
