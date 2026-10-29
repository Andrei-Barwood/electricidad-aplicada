import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../src/app/event-bus.js';
import { NetworkModel } from '../src/model/network-model.js';
import { ReliabilityEngine } from '../src/model/reliability-engine.js';
import { 
  TOPOLOGY_PRESET_KEYS, 
  loadTopologyPreset 
} from '../src/model/topology-presets.js';

describe('Fase 5: Motor de Contingencias N-1 y Confiabilidad (Reliability Engine)', () => {
  test('debe calcular correctamente los índices de confiabilidad N-1 en Barra Simple', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    const result = ReliabilityEngine.analyzeN1Contingencies(model);

    assert.ok(result.evaluatedAssetsCount >= 10, 'Debe evaluar todos los activos principales');
    assert.ok(result.totalEensMWhYear > 0, 'Barra simple debe tener EENS mayor a 0');
    assert.ok(result.totalLoleHoursYear > 0);
    assert.equal(result.baselineSuppliedPowerMW, 145, 'Potencia base suministrada = 45 + 30 + 70 = 145 MW');

    // La peor contingencia en Barra Simple debe ser la falla en la barra colectora o acometida
    assert.ok(result.worstContingency);
    assert.equal(result.worstContingency.lostPowerMW, 145, 'Falla en barra o fuente bota el 100% de la carga');
    assert.ok(result.worstContingency.eensMWhYear > 0);
    assert.equal(result.satisfiesN1Criterion, false, 'Barra Simple no cumple N-1 (vulnerable)');
  });

  test('debe verificar que la apertura de interruptores en Barra en Anillo cumple N-1 (0 MW perdidos)', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.RING_BUS);

    const result = ReliabilityEngine.analyzeN1Contingencies(model);

    // Buscar las contingencias correspondientes a los interruptores del anillo
    const ringBreakerConts = result.contingencies.filter(c => c.assetId.startsWith('CB-RING-'));
    assert.equal(ringBreakerConts.length, 4);

    for (const cbCont of ringBreakerConts) {
      assert.equal(
        cbCont.lostPowerMW, 
        0, 
        `La falla en interruptor ${cbCont.assetId} no debe cortar carga debido al lazo cerrado N-1`
      );
      assert.equal(cbCont.eensMWhYear, 0);
    }
  });

  test('debe verificar redundancia de barra total en Doble Barra con Doble Interruptor', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER);

    const result = ReliabilityEngine.analyzeN1Contingencies(model);

    // Pérdida de Barra 1 o Barra 2
    const bb1Cont = result.contingencies.find(c => c.assetId === 'BB-1');
    const bb2Cont = result.contingencies.find(c => c.assetId === 'BB-2');

    assert.ok(bb1Cont);
    assert.ok(bb2Cont);

    // Ambas barras poseen redundancia completa a través del segundo interruptor de cada circuito
    assert.equal(bb1Cont.lostPowerMW, 0, 'Pérdida de BB-1 no debe deslastrar cargas en doble barra');
    assert.equal(bb2Cont.lostPowerMW, 0, 'Pérdida de BB-2 no debe deslastrar cargas en doble barra');
  });

  test('debe ejecutar el Benchmark comparativo de las 18 topologías ordenado por EENS', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    const benchmark = ReliabilityEngine.benchmarkAllTopologies(model);

    assert.equal(benchmark.length, 18, 'Debe evaluar las 18 topologías normalizadas');

    // Debe estar ordenado de menor a mayor EENS (más confiable primero)
    for (let i = 0; i < benchmark.length - 1; i++) {
      assert.ok(
        benchmark[i].totalEensMWhYear <= benchmark[i + 1].totalEensMWhYear,
        `Orden de EENS incorrecto en posición ${i}`
      );
    }

    // Doble Barra / 1 1/2 debe tener menor EENS que Barra Simple
    const simple = benchmark.find(b => b.key === TOPOLOGY_PRESET_KEYS.SINGLE_BUS);
    const double = benchmark.find(b => b.key === TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER);

    assert.ok(simple.totalEensMWhYear > double.totalEensMWhYear);
    assert.ok(simple.relativeCost < double.relativeCost, 'Mayor confiabilidad implica mayor costo CAPEX');
  });
});
