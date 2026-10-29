import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../src/app/event-bus.js';
import { NetworkModel } from '../src/model/network-model.js';
import { EconomicEngine } from '../src/model/economic-engine.js';
import { 
  TOPOLOGY_PRESET_KEYS, 
  loadTopologyPreset 
} from '../src/model/topology-presets.js';

describe('Fase 6: Motor de Análisis Tecnoeconómico (Economic Engine)', () => {
  test('debe calcular con exactitud el Factor de Recuperación de Capital (CRF)', () => {
    // r = 7% (0.07), N = 30 años -> CRF = 0.07 * 1.07^30 / (1.07^30 - 1) ≈ 0.080586
    const crf = EconomicEngine.calculateCRF(0.07, 30);
    assert.ok(Math.abs(crf - 0.080586) < 0.0001, `CRF calculado: ${crf}`);

    // Si r = 0, CRF debe ser 1 / N
    const crfZero = EconomicEngine.calculateCRF(0, 20);
    assert.equal(crfZero, 0.05);
  });

  test('debe estimar costos de transformadores con escalamiento no lineal por potencia y tensión', () => {
    const cost50Mva = EconomicEngine.estimateTransformerCost(50, 220);
    const cost100Mva = EconomicEngine.estimateTransformerCost(100, 220);

    assert.ok(cost50Mva > 400000);
    assert.ok(cost100Mva > cost50Mva);
    // Debido a economías de escala (potencia 0.75), duplicar la potencia no debe duplicar el costo
    assert.ok(cost100Mva < cost50Mva * 2);
  });

  test('debe evaluar el CAPEX, OPEX, CENS y TAC completo para Barra Simple', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    const econ = EconomicEngine.calculateEconomics(model);

    assert.ok(econ.totalCapexUsd > 1000000, 'CAPEX total debe superar 1M USD');
    assert.ok(econ.civilWorksCost > 0);
    assert.ok(econ.controlProtectionCost > 0);
    assert.ok(econ.annualOpexUsd > 0);
    assert.ok(econ.annualCensUsd > 0, 'Barra Simple debe registrar penalización CENS por cortes');
    assert.ok(econ.totalAnnualizedCostUsd > 0);
    assert.ok(econ.totalLccUsd > econ.totalCapexUsd, 'El LCC total debe incluir el valor presente de OPEX y CENS');

    // Desglose de equipos
    assert.equal(econ.counts.circuitBreakers, 4);
    assert.equal(econ.counts.disconnectors, 3);
    assert.equal(econ.counts.transformers, 2);
  });

  test('debe reflejar el impacto directo del costo de falla VoLL sobre la penalización CENS', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    const econStandard = EconomicEngine.calculateEconomics(model, null, { vollUsdPerMWh: 2000 });
    const econDoubleVoLL = EconomicEngine.calculateEconomics(model, null, { vollUsdPerMWh: 4000 });

    assert.equal(
      econDoubleVoLL.annualCensUsd, 
      econStandard.annualCensUsd * 2,
      'Duplicar el VoLL debe duplicar exactamente el costo de la energía no suministrada'
    );
  });

  test('debe ejecutar el Benchmark Tecnoeconómico de las 18 topologías comparando CAPEX vs CENS', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    const benchmark = EconomicEngine.benchmarkAllTopologiesEconomics(model);

    assert.equal(benchmark.length, 18, 'Debe evaluar las 18 topologías normalizadas');

    const singleBus = benchmark.find(b => b.key === TOPOLOGY_PRESET_KEYS.SINGLE_BUS);
    const doubleBus = benchmark.find(b => b.key === TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER);
    const ringBus = benchmark.find(b => b.key === TOPOLOGY_PRESET_KEYS.RING_BUS);

    // Barra simple tiene menor CAPEX que Doble Barra
    assert.ok(singleBus.totalCapexUsd < doubleBus.totalCapexUsd);

    // Barra Simple tiene mayor CENS que Anillo y Doble Barra
    assert.ok(singleBus.annualCensUsd > ringBus.annualCensUsd);
    assert.ok(singleBus.annualCensUsd > doubleBus.annualCensUsd);

    // Debe ordenar por Costo Total Anualizado TAC ascendente
    for (let i = 0; i < benchmark.length - 1; i++) {
      assert.ok(benchmark[i].totalAnnualizedCostUsd <= benchmark[i + 1].totalAnnualizedCostUsd);
    }
  });
});
