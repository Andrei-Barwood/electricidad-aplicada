import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { 
  ComponentType, 
  OperationalState, 
  createComponent, 
  resetComponentCounters 
} from '../src/model/components.js';
import { NetworkModel } from '../src/model/network-model.js';
import { EventBus } from '../src/app/event-bus.js';

describe('Modelo de Componentes Eléctricos', () => {
  test('debe crear un Interruptor de Potencia con parámetros físicos y de confiabilidad consistentes', () => {
    resetComponentCounters();
    const cb = createComponent(ComponentType.CIRCUIT_BREAKER, {
      x: 100,
      y: 200,
      operationalState: OperationalState.CLOSED
    });

    assert.equal(cb.id, 'CB-1');
    assert.equal(cb.type, ComponentType.CIRCUIT_BREAKER);
    assert.equal(cb.operationalState, OperationalState.CLOSED);
    assert.equal(cb.position.x, 100);
    assert.equal(cb.position.y, 200);
    assert.equal(cb.terminals.length, 2);

    // Verificación de disponibilidad A = mu / (lambda + mu)
    const expectedMu = 8760 / cb.mttrHours;
    const expectedAvailability = expectedMu / (cb.failureRate + expectedMu);
    assert.ok(Math.abs(cb.availability - expectedAvailability) < 1e-6);
    assert.ok(cb.availability > 0.999);
  });

  test('debe calcular correctamente la indisponibilidad U = 1 - A', () => {
    const tr = createComponent(ComponentType.TRANSFORMER, {
      failureRate: 0.02,
      mttrHours: 50
    });

    const mu = 8760 / 50;
    const expectedA = mu / (0.02 + mu);
    const expectedU = 1 - expectedA;

    assert.ok(Math.abs(tr.availability - expectedA) < 1e-9);
    assert.ok(Math.abs(tr.unavailability - expectedU) < 1e-9);
  });

  test('debe asignar terminales coherentes a una Barra Colectora', () => {
    const bb = createComponent(ComponentType.BUSBAR, { width: 300 });
    assert.equal(bb.terminals.length, 4);
    assert.equal(bb.dimensions.width, 300);
    assert.equal(bb.terminals[0].relY, 0.5);
  });
});

describe('NetworkModel (Grafo de Red)', () => {
  test('debe permitir agregar, consultar, actualizar y remover componentes', () => {
    const bus = new EventBus();
    const model = new NetworkModel(bus);

    let addedEventFired = false;
    bus.on('model:component-added', () => { addedEventFired = true; });

    const ds = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-TEST-1', x: 50, y: 50 });
    model.addComponent(ds);

    assert.equal(addedEventFired, true);
    assert.equal(model.hasComponent('DS-TEST-1'), true);
    assert.equal(model.getComponent('DS-TEST-1').id, 'DS-TEST-1');

    // Actualización de estado
    model.updateComponent('DS-TEST-1', { operationalState: OperationalState.OPEN });
    assert.equal(model.getComponent('DS-TEST-1').operationalState, OperationalState.OPEN);

    // Duplicación
    const dup = model.duplicateComponent('DS-TEST-1', 40, 40);
    assert.ok(dup.id !== 'DS-TEST-1');
    assert.equal(dup.position.x, 90);
    assert.equal(dup.position.y, 90);

    // Eliminación
    const removed = model.removeComponent('DS-TEST-1');
    assert.equal(removed, true);
    assert.equal(model.hasComponent('DS-TEST-1'), false);
    assert.equal(model.getAllComponents().length, 1);
  });

  test('debe rechazar la inserción de componentes con id duplicado', () => {
    const model = new NetworkModel(new EventBus());
    const c1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'DUP-1' });
    model.addComponent(c1);

    const c2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'DUP-1' });
    assert.throws(() => {
      model.addComponent(c2);
    }, /ya existe/);
  });

  test('debe serializar y deserializar a JSON sin perder atributos', () => {
    const model1 = new NetworkModel(new EventBus());
    model1.addComponent(createComponent(ComponentType.SOURCE, { id: 'SRC-JSON', x: 200, y: 300 }));
    model1.addComponent(createComponent(ComponentType.BUSBAR, { id: 'BB-JSON', x: 100, y: 100 }));

    const json = model1.toJSON();
    assert.equal(json.components.length, 2);

    const model2 = new NetworkModel(new EventBus());
    model2.fromJSON(json);
    assert.equal(model2.getAllComponents().length, 2);
    assert.equal(model2.getComponent('SRC-JSON').position.x, 200);
  });
});
