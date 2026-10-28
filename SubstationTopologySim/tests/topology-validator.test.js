import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { 
  ComponentType, 
  OperationalState, 
  createComponent 
} from '../src/model/components.js';
import { NetworkModel } from '../src/model/network-model.js';
import { EventBus } from '../src/app/event-bus.js';
import { TopologyValidator } from '../src/model/topology-validator.js';

describe('Gestión de Conexiones Galvánicas (Ramas)', () => {
  test('debe permitir crear conexiones válidas entre terminales de componentes existentes', () => {
    const model = new NetworkModel(new EventBus());
    const bb = model.addComponent(createComponent(ComponentType.BUSBAR, { id: 'BB-A' }));
    const cb = model.addComponent(createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-A' }));

    const conn = model.addConnection({
      fromComponentId: 'BB-A',
      fromTerminalId: bb.terminals[0].id,
      toComponentId: 'CB-A',
      toTerminalId: cb.terminals[0].id
    });

    assert.ok(conn.id);
    assert.equal(model.getAllConnections().length, 1);
    assert.equal(model.getConnection(conn.id).fromTerminalId, bb.terminals[0].id);
  });

  test('debe rechazar la conexión de un terminal consigo mismo', () => {
    const model = new NetworkModel(new EventBus());
    const cb = model.addComponent(createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-SELF' }));

    assert.throws(() => {
      model.addConnection({
        fromComponentId: 'CB-SELF',
        fromTerminalId: cb.terminals[0].id,
        toComponentId: 'CB-SELF',
        toTerminalId: cb.terminals[0].id
      });
    }, /consigo mismo/);
  });

  test('debe impedir conexiones duplicadas directas entre los mismos terminales', () => {
    const model = new NetworkModel(new EventBus());
    const bb = model.addComponent(createComponent(ComponentType.BUSBAR, { id: 'BB-DUP' }));
    const ds = model.addComponent(createComponent(ComponentType.DISCONNECTOR, { id: 'DS-DUP' }));

    model.addConnection({
      fromComponentId: 'BB-DUP',
      fromTerminalId: bb.terminals[0].id,
      toComponentId: 'DS-DUP',
      toTerminalId: ds.terminals[0].id
    });

    assert.throws(() => {
      model.addConnection({
        fromComponentId: 'BB-DUP',
        fromTerminalId: bb.terminals[0].id,
        toComponentId: 'DS-DUP',
        toTerminalId: ds.terminals[0].id
      });
    }, /Ya existe una conexión/);
  });

  test('eliminar un componente debe purgar automáticamente todas sus conexiones asociadas', () => {
    const model = new NetworkModel(new EventBus());
    const bb = model.addComponent(createComponent(ComponentType.BUSBAR, { id: 'BB-DEL' }));
    const cb = model.addComponent(createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-DEL' }));

    model.addConnection({
      id: 'CONN-DEL',
      fromComponentId: 'BB-DEL',
      fromTerminalId: bb.terminals[0].id,
      toComponentId: 'CB-DEL',
      toTerminalId: cb.terminals[0].id
    });

    assert.equal(model.getAllConnections().length, 1);
    model.removeComponent('BB-DEL');
    assert.equal(model.getAllConnections().length, 0);
  });
});

describe('Validación Topológica y Flujo de Energización (BFS)', () => {
  test('debe propagar la energización completa desde una Fuente hasta una Carga a través de equipos cerrados', () => {
    const model = new NetworkModel(new EventBus());

    const src = model.addComponent(createComponent(ComponentType.SOURCE, { id: 'SRC-VAL', operationalState: OperationalState.CLOSED }));
    const bb = model.addComponent(createComponent(ComponentType.BUSBAR, { id: 'BB-VAL' }));
    const cb = model.addComponent(createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-VAL', operationalState: OperationalState.CLOSED }));
    const tr = model.addComponent(createComponent(ComponentType.TRANSFORMER, { id: 'TR-VAL' }));
    const ld = model.addComponent(createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-VAL' }));

    // Conectar en cadena: SRC -> BB -> CB -> TR -> LD
    model.addConnection({ fromComponentId: 'SRC-VAL', fromTerminalId: src.terminals[0].id, toComponentId: 'BB-VAL', toTerminalId: bb.terminals[0].id });
    model.addConnection({ fromComponentId: 'BB-VAL', fromTerminalId: bb.terminals[1].id, toComponentId: 'CB-VAL', toTerminalId: cb.terminals[0].id });
    model.addConnection({ fromComponentId: 'CB-VAL', fromTerminalId: cb.terminals[1].id, toComponentId: 'TR-VAL', toTerminalId: tr.terminals[0].id });
    model.addConnection({ fromComponentId: 'TR-VAL', fromTerminalId: tr.terminals[1].id, toComponentId: 'LD-VAL', toTerminalId: ld.terminals[0].id });

    const analysis = TopologyValidator.analyze(model);

    // Todos los componentes deben estar energizados
    assert.equal(analysis.energizedComponentIds.has('SRC-VAL'), true);
    assert.equal(analysis.energizedComponentIds.has('BB-VAL'), true);
    assert.equal(analysis.energizedComponentIds.has('CB-VAL'), true);
    assert.equal(analysis.energizedComponentIds.has('TR-VAL'), true);
    assert.equal(analysis.energizedComponentIds.has('LD-VAL'), true);

    // La carga debe ser reconocida como alimentada
    assert.equal(analysis.suppliedLoads.length, 1);
    assert.equal(analysis.suppliedLoads[0].id, 'LD-VAL');
    assert.equal(analysis.unsuppliedLoads.length, 0);
  });

  test('abrir un interruptor debe interrumpir la energización hacia aguas abajo (deslastre de carga)', () => {
    const model = new NetworkModel(new EventBus());

    const src = model.addComponent(createComponent(ComponentType.SOURCE, { id: 'SRC-TRIP', operationalState: OperationalState.CLOSED }));
    const cb = model.addComponent(createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-TRIP', operationalState: OperationalState.CLOSED }));
    const ld = model.addComponent(createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-TRIP' }));

    model.addConnection({ fromComponentId: 'SRC-TRIP', fromTerminalId: src.terminals[0].id, toComponentId: 'CB-TRIP', toTerminalId: cb.terminals[0].id });
    model.addConnection({ fromComponentId: 'CB-TRIP', fromTerminalId: cb.terminals[1].id, toComponentId: 'LD-TRIP', toTerminalId: ld.terminals[0].id });

    // Estado 1: Inicialmente cerrado
    let analysis = model.recalculateTopology();
    assert.equal(analysis.suppliedLoads.length, 1);

    // Estado 2: Abrimos el interruptor
    model.updateComponent('CB-TRIP', { operationalState: OperationalState.OPEN });
    analysis = model.recalculateTopology();

    // El interruptor sigue energizado del lado fuente pero aguas abajo la carga queda sin suministro
    assert.equal(model.getComponent('LD-TRIP').isEnergized, false);
    assert.equal(analysis.suppliedLoads.length, 0);
    assert.equal(analysis.unsuppliedLoads.length, 1);
    assert.equal(analysis.unsuppliedLoads[0].id, 'LD-TRIP');
  });

  test('debe emitir advertencia ante discrepancia directa de tensión sin transformador', () => {
    const model = new NetworkModel(new EventBus());
    const bb220 = model.addComponent(createComponent(ComponentType.BUSBAR, { id: 'BB-220', properties: { voltageLevel: 220 } }));
    const cb66 = model.addComponent(createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-66', properties: { voltageLevel: 66 } }));

    model.addConnection({
      fromComponentId: 'BB-220',
      fromTerminalId: bb220.terminals[0].id,
      toComponentId: 'CB-66',
      toTerminalId: cb66.terminals[0].id
    });

    const analysis = TopologyValidator.analyze(model);
    assert.ok(analysis.warnings.some(w => w.type === 'VOLTAGE_MISMATCH'));
  });

  test('debe detectar componentes aislados sin conexiones en la subestación', () => {
    const model = new NetworkModel(new EventBus());
    const src = model.addComponent(createComponent(ComponentType.SOURCE, { id: 'SRC-ISO' }));
    const ld = model.addComponent(createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-ISO' }));

    const analysis = TopologyValidator.analyze(model);
    assert.equal(analysis.isolatedComponentIds.has('SRC-ISO'), true);
    assert.equal(analysis.isolatedComponentIds.has('LD-ISO'), true);
  });
});
