import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../src/app/event-bus.js';
import { NetworkModel } from '../src/model/network-model.js';
import { 
  InterlockingEngine, 
  InterlockRuleCodes 
} from '../src/model/interlocking-engine.js';
import { SequenceOfEvents, EventSeverity } from '../src/model/sequence-of-events.js';
import { 
  TOPOLOGY_PRESET_KEYS, 
  loadTopologyPreset 
} from '../src/model/topology-presets.js';
import { OperationalState } from '../src/model/components.js';

describe('Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine)', () => {
  test('debe bloquear la apertura de un seccionador si su interruptor asociado está cerrado bajo carga (R1)', () => {
    const eventBus = new EventBus();
    const soe = new SequenceOfEvents(eventBus);
    const engine = new InterlockingEngine(eventBus, soe);
    const model = new NetworkModel(eventBus);

    // Cargar Barra Simple con todas sus bahías energizadas
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    // DS-OUT1 está en serie con CB-OUT1 (ambos CLOSED y energizados)
    const check = engine.canOperate('DS-OUT1', OperationalState.OPEN, model);
    assert.equal(check.allowed, false, 'La apertura debe estar bloqueada por enclavamiento');
    assert.equal(check.ruleCode, InterlockRuleCodes.DISCONNECTOR_UNDER_LOAD);

    // Intentar ejecutar la maniobra
    const res = engine.executeSwitching('DS-OUT1', OperationalState.OPEN, model);
    assert.equal(res.success, false);
    assert.equal(res.blocked, true);

    // Verificar que el estado del seccionador no cambió en el modelo
    assert.equal(model.getComponent('DS-OUT1').operationalState, OperationalState.CLOSED);

    // Verificar que se registró el bloqueo en la SOE
    const blockedEvents = soe.getEvents({ severity: EventSeverity.BLOCKED });
    assert.ok(blockedEvents.length >= 1);
    assert.equal(blockedEvents[0].componentId, 'DS-OUT1');
    assert.equal(blockedEvents[0].isInterlocked, true);
  });

  test('debe permitir abrir el seccionador después de haber abierto primero el interruptor de potencia', () => {
    const eventBus = new EventBus();
    const soe = new SequenceOfEvents(eventBus);
    const engine = new InterlockingEngine(eventBus, soe);
    const model = new NetworkModel(eventBus);

    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    // 1. Abrir primero el interruptor CB-OUT1 (permitido siempre porque tiene cámara de extinción)
    const cbRes = engine.executeSwitching('CB-OUT1', OperationalState.OPEN, model);
    assert.equal(cbRes.success, true);
    assert.equal(model.getComponent('CB-OUT1').operationalState, OperationalState.OPEN);

    // 2. Ahora abrir el seccionador DS-OUT1 (ahora debe estar permitido sin carga)
    const dsCheck = engine.canOperate('DS-OUT1', OperationalState.OPEN, model);
    assert.equal(dsCheck.allowed, true, 'Seccionador sin corriente de carga debe poder abrirse');

    const dsRes = engine.executeSwitching('DS-OUT1', OperationalState.OPEN, model);
    assert.equal(dsRes.success, true);
    assert.equal(model.getComponent('DS-OUT1').operationalState, OperationalState.OPEN);

    // Verificar registro SOE de la maniobra exitosa
    const latestEvent = soe.events[0];
    assert.equal(latestEvent.componentId, 'DS-OUT1');
    assert.equal(latestEvent.severity, EventSeverity.INFO);
  });

  test('debe impedir el cierre de seccionador si el interruptor asociado está cerrado (secuencia segura R2)', () => {
    const eventBus = new EventBus();
    const soe = new SequenceOfEvents(eventBus);
    const engine = new InterlockingEngine(eventBus, soe);
    const model = new NetworkModel(eventBus);

    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    // Forzamos seccionador abierto para probar el intento de cierre bajo carga
    model.getComponent('DS-OUT1').operationalState = OperationalState.OPEN;

    const check = engine.canOperate('DS-OUT1', OperationalState.CLOSED, model);
    assert.equal(check.allowed, false, 'No se puede cerrar seccionador sobre interruptor ya cerrado');
    assert.equal(check.ruleCode, InterlockRuleCodes.DISCONNECTOR_UNDER_LOAD);
  });

  test('debe permitir forzar maniobras en Modo Bypass / Override emitiendo ALARM en SOE', () => {
    const eventBus = new EventBus();
    const soe = new SequenceOfEvents(eventBus);
    const engine = new InterlockingEngine(eventBus, soe);
    const model = new NetworkModel(eventBus);

    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    // Desactivar enclavamientos (Modo Override)
    engine.setInterlockingEnabled(false);
    assert.equal(engine.enabled, false);

    // Maniobra indebida forzada
    const res = engine.executeSwitching('DS-OUT1', OperationalState.OPEN, model);
    assert.equal(res.success, true, 'Debe ejecutarse bajo bypass');
    assert.equal(res.isOverride, true);
    assert.equal(model.getComponent('DS-OUT1').operationalState, OperationalState.OPEN);

    // Debe registrarse como ALARMA en SOE
    const alarmEvents = soe.getEvents({ severity: EventSeverity.ALARM });
    assert.ok(alarmEvents.length >= 1);
    assert.match(alarmEvents[0].message, /PELIGRO DE ARCO/);
  });

  test('debe bloquear el cierre de un equipo consignado bajo LOTO (OUT_OF_SERVICE)', () => {
    const eventBus = new EventBus();
    const soe = new SequenceOfEvents(eventBus);
    const engine = new InterlockingEngine(eventBus, soe);
    const model = new NetworkModel(eventBus);

    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    // Poner equipo en mantenimiento LOTO
    model.updateComponent('CB-OUT1', { operationalState: OperationalState.OUT_OF_SERVICE });

    const check = engine.canOperate('CB-OUT1', OperationalState.CLOSED, model);
    assert.equal(check.allowed, false);
    assert.equal(check.ruleCode, InterlockRuleCodes.LOTO_LOCKOUT);

    const res = engine.executeSwitching('CB-OUT1', OperationalState.CLOSED, model);
    assert.equal(res.blocked, true);
    assert.equal(model.getComponent('CB-OUT1').operationalState, OperationalState.OUT_OF_SERVICE);
  });

  test('debe registrar y exportar correctamente la secuencia cronológica SOE a CSV', () => {
    const eventBus = new EventBus();
    const soe = new SequenceOfEvents(eventBus);
    const engine = new InterlockingEngine(eventBus, soe);
    const model = new NetworkModel(eventBus);

    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    engine.executeSwitching('CB-OUT1', OperationalState.OPEN, model);
    engine.executeSwitching('DS-OUT1', OperationalState.OPEN, model);

    const csv = soe.exportToCSV();
    assert.ok(csv.includes('CB-OUT1'));
    assert.ok(csv.includes('DS-OUT1'));
    assert.ok(csv.includes('Hora,ID Equipo,Nombre Equipo'));
  });
});
