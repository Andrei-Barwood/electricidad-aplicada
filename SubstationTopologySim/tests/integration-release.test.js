/**
 * Pruebas unitarias y de integración - Fase 8: Validación Integral y Release Final
 * Verifica casos límite (redes vacías, bucles cerrados, tasas nulas),
 * robustez de serialización y flujo de trabajo integral extremo a extremo (E2E).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../src/app/event-bus.js';
import { NetworkModel } from '../src/model/network-model.js';
import { ComponentType, OperationalState, createComponent } from '../src/model/components.js';
import { TOPOLOGY_PRESET_KEYS, loadTopologyPreset } from '../src/model/topology-presets.js';
import { TopologyValidator } from '../src/model/topology-validator.js';
import { InterlockingEngine } from '../src/model/interlocking-engine.js';
import { SequenceOfEvents } from '../src/model/sequence-of-events.js';
import { ReliabilityEngine } from '../src/model/reliability-engine.js';
import { EconomicEngine } from '../src/model/economic-engine.js';
import { DxfExporter } from '../src/model/dxf-exporter.js';

describe('Fase 8: Casos Límite y Robustez Numérica (Corner Cases)', () => {
  it('debe manejar una red totalmente vacía sin excepciones ni divisiones por cero', () => {
    const eventBus = new EventBus();
    const model = new NetworkModel(eventBus);

    // BFS en red vacía
    const analysis = TopologyValidator.analyze(model);
    assert.equal(analysis.energizedComponentIds.size, 0);
    assert.equal(analysis.unsuppliedLoads.length, 0);

    // Confiabilidad N-1 en red vacía
    const rel = ReliabilityEngine.analyzeN1Contingencies(model);
    assert.equal(rel.totalEensMWhYear, 0);
    assert.equal(rel.totalLoleHoursYear, 0);
    assert.equal(rel.contingencies.length, 0);
    assert.equal(rel.satisfiesN1Criterion, true);

    // Economía en red vacía
    const econ = EconomicEngine.calculateEconomics(model);
    assert.equal(econ.totalCapexUsd, 0);
    assert.equal(econ.annualOpexUsd, 0);
    assert.equal(econ.annualCensUsd, 0);
    assert.equal(econ.totalAnnualizedCostUsd, 0);

    // Exportador DXF en red vacía
    const dxf = DxfExporter.exportToDXF(model);
    assert.ok(dxf.includes('HEADER'));
    assert.ok(dxf.endsWith('0\nEOF'));
  });

  it('debe operar de forma segura con componentes aislados sin conexiones', () => {
    const model = new NetworkModel();
    const bb = createComponent(ComponentType.BUSBAR, { id: 'BB-ISO', x: 100, y: 100 });
    const ld = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-ISO', x: 200, y: 200, properties: { ratedPower: 15 } });

    model.addComponent(bb);
    model.addComponent(ld);

    const analysis = TopologyValidator.analyze(model);
    assert.equal(analysis.energizedComponentIds.size, 0);
    assert.equal(analysis.unsuppliedLoads.length, 1);
    assert.equal(analysis.unsuppliedLoads[0].id, 'LD-ISO');
    assert.ok(analysis.isolatedComponentIds.has('LD-ISO'));
    assert.ok(analysis.isolatedComponentIds.has('BB-ISO'));
  });

  it('debe admitir tasa de falla nula (lambda = 0) resultando en disponibilidad A = 1.0 y EENS = 0', () => {
    const cb = createComponent(ComponentType.CIRCUIT_BREAKER, {
      id: 'CB-IDEAL',
      failureRate: 0,
      mttrHours: 24
    });

    assert.equal(cb.failureRate, 0);
    assert.equal(cb.availability, 1.0);
    assert.equal(cb.unavailability, 0.0);
  });

  it('debe resolver mallas cerradas y múltiples fuentes en paralelo sin ciclos infinitos', () => {
    const model = new NetworkModel();

    // 2 Fuentes inyectando a una barra en anillo
    const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', x: 100, y: 50, properties: { voltageLevel: 220 } });
    const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-2', x: 300, y: 50, properties: { voltageLevel: 220 } });
    const bb1 = createComponent(ComponentType.BUSBAR, { id: 'BB-RING1', x: 100, y: 150, width: 300, properties: { voltageLevel: 220 } });
    const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', x: 200, y: 260, properties: { voltageLevel: 220, ratedPower: 40 } });

    model.addComponent(src1);
    model.addComponent(src2);
    model.addComponent(bb1);
    model.addComponent(ld1);

    model.addConnection({
      fromComponentId: 'SRC-1',
      fromTerminalId: src1.terminals[0].id,
      toComponentId: 'BB-RING1',
      toTerminalId: bb1.terminals[0].id
    });

    model.addConnection({
      fromComponentId: 'SRC-2',
      fromTerminalId: src2.terminals[0].id,
      toComponentId: 'BB-RING1',
      toTerminalId: bb1.terminals[3].id
    });

    model.addConnection({
      fromComponentId: 'BB-RING1',
      fromTerminalId: bb1.terminals[1].id,
      toComponentId: 'LD-1',
      toTerminalId: ld1.terminals[0].id
    });

    const analysis = TopologyValidator.analyze(model);
    assert.equal(analysis.suppliedLoads.length, 1);
    assert.equal(analysis.unsuppliedLoads.length, 0);
    assert.ok(analysis.energizedComponentIds.has('LD-1'));

    // Desconectar SRC-1 -> Carga sigue energizada por SRC-2
    model.updateComponent('SRC-1', { operationalState: OperationalState.OPEN });
    const analysis2 = TopologyValidator.analyze(model);
    assert.ok(analysis2.energizedComponentIds.has('LD-1'), 'La carga debe permanecer energizada por SRC-2');

    // Desconectar ambas fuentes -> Carga se deslastra
    model.updateComponent('SRC-2', { operationalState: OperationalState.OPEN });
    const analysis3 = TopologyValidator.analyze(model);
    assert.equal(analysis3.suppliedLoads.length, 0);
    assert.equal(analysis3.unsuppliedLoads.length, 1);
  });

  it('debe persistir y restaurar con precisión de punto a punto toda la red mediante serialización JSON', () => {
    const model1 = new NetworkModel();
    loadTopologyPreset(model1, TOPOLOGY_PRESET_KEYS.RING_BUS);

    const jsonSnapshot = model1.toJSON();
    assert.ok(typeof jsonSnapshot === 'object');
    assert.ok(jsonSnapshot.components.length > 5);
    assert.ok(jsonSnapshot.connections.length > 5);

    const model2 = new NetworkModel();
    model2.fromJSON(jsonSnapshot);

    const a1 = TopologyValidator.analyze(model1);
    const a2 = TopologyValidator.analyze(model2);

    assert.equal(model2.getAllComponents().length, model1.getAllComponents().length);
    assert.equal(model2.getAllConnections().length, model1.getAllConnections().length);
    assert.deepEqual(
      Array.from(a2.energizedComponentIds).sort(),
      Array.from(a1.energizedComponentIds).sort()
    );
  });
});

describe('Fase 8: Flujo Integral Extremo a Extremo (E2E Integration Workflow)', () => {
  it('debe completar el flujo completo de ingeniería: Carga -> Maniobra Segura -> SOE -> N-1 -> LCC -> DXF', () => {
    const eventBus = new EventBus();
    const model = new NetworkModel(eventBus);
    const soe = new SequenceOfEvents(eventBus);
    const interlocking = new InterlockingEngine(eventBus, soe);

    // 1. Cargar topología normalizada de alta confiabilidad: Interruptor y Medio
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF);
    assert.ok(model.getAllComponents().length >= 10);

    const initAnalysis = TopologyValidator.analyze(model);
    assert.ok(initAnalysis.suppliedLoads.length >= 2);

    // 2. Intentar apertura indebida de seccionador bajo carga (debe ser bloqueado por IEC 62271-102)
    // Seccionador DS-1A asociado al interruptor CB-1 (que está cerrado)
    const blockResult = interlocking.toggleComponent('DS-1A', model);
    assert.equal(blockResult.success, false, 'No debe permitir abrir seccionador bajo carga');
    assert.equal(blockResult.blocked, true);
    assert.ok(blockResult.reason.includes('CERRADO'));

    // Verificar registro en SOE
    assert.ok(soe.events.some(e => e.severity === 'BLOCKED'));

    // 3. Maniobra operacional segura: abrir primero el interruptor CB-1 y luego el seccionador DS-1A
    const cbOpenResult = interlocking.toggleComponent('CB-1', model);
    assert.equal(cbOpenResult.success, true);
    assert.equal(model.getComponent('CB-1').operationalState, OperationalState.OPEN);

    const dsOpenResult = interlocking.toggleComponent('DS-1A', model);
    assert.equal(dsOpenResult.success, true, 'Una vez abierto el interruptor, el seccionador puede abrir');
    assert.equal(model.getComponent('DS-1A').operationalState, OperationalState.OPEN);

    // Verificar registro cronológico en SOE
    assert.ok(soe.events.length >= 3);
    const csvExport = soe.exportToCSV();
    assert.ok(csvExport.includes('CB-1'));
    assert.ok(csvExport.includes('DS-1A'));

    // 4. Evaluación de Confiabilidad N-1 con el motor de contingencias
    const relResult = ReliabilityEngine.analyzeN1Contingencies(model);
    assert.ok(relResult.contingencies.length > 5);
    assert.ok(relResult.totalEensMWhYear >= 0);
    assert.ok(relResult.totalLoleHoursYear >= 0);

    // 5. Evaluación Tecnoeconómica y Análisis de Ciclo de Vida (LCC / TAC)
    const econResult = EconomicEngine.calculateEconomics(model, relResult);
    assert.ok(econResult.totalCapexUsd > 1000000, 'CAPEX debe ser superior a 1M USD');
    assert.ok(econResult.annualOpexUsd > 10000);
    assert.ok(econResult.totalAnnualizedCostUsd > 0);
    assert.ok(econResult.totalLccUsd > econResult.totalCapexUsd);

    // 6. Exportación final de ingeniería a formato CAD DXF
    const dxfString = DxfExporter.exportToDXF(model, { invertY: true, padding: 50 });
    assert.ok(dxfString.includes('SECTION\n  2\nHEADER'));
    assert.ok(dxfString.includes('SECTION\n  2\nTABLES'));
    assert.ok(dxfString.includes('0_BARRAS'));
    assert.ok(dxfString.includes('0_EQUIPOS'));
    assert.ok(dxfString.includes('0_CONEXIONES'));
    assert.ok(dxfString.includes('0_TEXTOS'));
    assert.ok(dxfString.includes('Int. Superior Calle 1'));
    assert.ok(dxfString.endsWith('0\nEOF'));
  });
});
