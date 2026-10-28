import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { 
  TOPOLOGY_PRESET_KEYS, 
  TOPOLOGY_PRESETS_METADATA, 
  loadTopologyPreset,
  buildSingleBusPreset,
  buildMainTransferPreset,
  buildSectionalizedBusPreset,
  buildRingBusPreset,
  buildBreakerAndAHalfPreset,
  buildDoubleBusDoubleBreakerPreset
} from '../src/model/topology-presets.js';
import { NetworkModel } from '../src/model/network-model.js';
import { EventBus } from '../src/app/event-bus.js';
import { OperationalState } from '../src/model/components.js';

describe('Fase 3: Módulo de Topologías Predefinidas (Presets)', () => {
  test('debe contener los 6 esquemas normalizados en los metadatos', () => {
    const keys = Object.values(TOPOLOGY_PRESET_KEYS);
    assert.equal(keys.length, 6);

    for (const key of keys) {
      const meta = TOPOLOGY_PRESETS_METADATA[key];
      assert.ok(meta, `Falta metadata para ${key}`);
      assert.ok(meta.name, `Falta nombre para ${key}`);
      assert.ok(meta.englishName, `Falta englishName para ${key}`);
      assert.ok(meta.standard, `Falta standard para ${key}`);
      assert.ok(meta.description, `Falta descripción para ${key}`);
      assert.ok(Array.isArray(meta.advantages), `Ventajas debe ser array en ${key}`);
      assert.ok(Array.isArray(meta.disadvantages), `Desventajas debe ser array en ${key}`);
      assert.ok(meta.reliabilityLevel, `Falta nivel de confiabilidad en ${key}`);
      assert.ok(typeof meta.relativeCost === 'number', `Falta costo relativo en ${key}`);
    }
  });

  test('debe cargar exitosamente la topología de Barra Simple y energizar todas sus cargas', () => {
    const model = new NetworkModel(new EventBus());
    const res = loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    assert.equal(res.metadata.key, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);
    assert.ok(model.getAllComponents().length >= 10);
    assert.ok(model.getAllConnections().length >= 10);

    const analysis = model.lastTopologyAnalysis;
    assert.ok(analysis);
    assert.equal(analysis.errors.length, 0, 'No debe haber errores de terminales huérfanos');
    assert.equal(analysis.suppliedLoads.length, 3, 'Las 3 cargas deben estar alimentadas');
    assert.equal(analysis.unsuppliedLoads.length, 0);
  });

  test('debe cargar exitosamente Barra Principal + Transferencia con bypasses operativos', () => {
    const model = new NetworkModel(new EventBus());
    const res = loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.MAIN_TRANSFER);

    assert.ok(model.hasComponent('BB-MAIN'));
    assert.ok(model.hasComponent('BB-TRANSF'));
    assert.ok(model.hasComponent('CB-TIE'));

    const analysis = model.lastTopologyAnalysis;
    assert.equal(analysis.errors.length, 0);
    assert.equal(analysis.suppliedLoads.length, 2, 'Las cargas deben alimentarse desde la barra principal');
  });

  test('debe cargar Barra Seccionada y demostrar aislamiento de fallas por partición', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SECTIONALIZED_BUS);

    assert.ok(model.hasComponent('BB-SEC-1'));
    assert.ok(model.hasComponent('BB-SEC-2'));
    assert.ok(model.hasComponent('CB-SEC'));

    let analysis = model.lastTopologyAnalysis;
    assert.equal(analysis.suppliedLoads.length, 2);

    // Si abrimos la entrada 2 y el interruptor de enlace de sección:
    model.updateComponent('CB-SRC2', { operationalState: OperationalState.OPEN });
    model.updateComponent('CB-SEC', { operationalState: OperationalState.OPEN });

    analysis = model.lastTopologyAnalysis;
    // La sección 1 sigue energizada con SRC-1; la sección 2 queda aislada sin tensión
    assert.equal(analysis.suppliedLoads.length, 1);
    assert.equal(analysis.unsuppliedLoads.length, 1);
    assert.equal(analysis.unsuppliedLoads[0].id, 'LD-2');
  });

  test('debe cargar Barra en Anillo y soportar contingencia N-1 (abrir 1 interruptor sin perder cargas)', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.RING_BUS);

    let analysis = model.lastTopologyAnalysis;
    assert.equal(analysis.errors.length, 0);
    assert.equal(analysis.suppliedLoads.length, 3, 'Las 3 posiciones de carga deben estar alimentadas');

    // Contingencia N-1: Abrir el interruptor CB-RING-1
    model.updateComponent('CB-RING-1', { operationalState: OperationalState.OPEN });
    analysis = model.lastTopologyAnalysis;

    // Todas las cargas deben seguir energizadas gracias al lazo cerrado
    assert.equal(analysis.suppliedLoads.length, 3, 'Criterio N-1 satisfecho en barra en anillo');
    assert.equal(analysis.unsuppliedLoads.length, 0);
  });

  test('debe cargar Interruptor y Medio y mantener servicio ante pérdida de una barra colectora', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF);

    assert.ok(model.hasComponent('BB-1'));
    assert.ok(model.hasComponent('BB-2'));
    assert.ok(model.hasComponent('CB-MID'));

    let analysis = model.lastTopologyAnalysis;
    assert.equal(analysis.errors.length, 0);
    assert.equal(analysis.suppliedLoads.length, 3);

    // Simular corte / apertura de seccionadores hacia Barra 1
    model.updateComponent('DS-1A', { operationalState: OperationalState.OPEN });
    model.updateComponent('DS-3A', { operationalState: OperationalState.OPEN });

    analysis = model.lastTopologyAnalysis;
    // Las cargas siguen alimentadas a través de Barra 2 y los interruptores centrales
    assert.equal(analysis.suppliedLoads.length, 3, 'Topología 1 1/2 mantiene servicio total sin Barra 1');
  });

  test('debe cargar Doble Barra con Doble Interruptor con máxima redundancia de bahía', () => {
    const model = new NetworkModel(new EventBus());
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER);

    assert.ok(model.hasComponent('CB-1A'));
    assert.ok(model.hasComponent('CB-1B'));
    assert.ok(model.hasComponent('CB-2A'));
    assert.ok(model.hasComponent('CB-2B'));

    let analysis = model.lastTopologyAnalysis;
    assert.equal(analysis.errors.length, 0);
    assert.equal(analysis.suppliedLoads.length, 2);

    // Mantenimiento de todos los interruptores asociados a Barra 1
    model.updateComponent('CB-1A', { operationalState: OperationalState.OPEN });
    model.updateComponent('CB-2A', { operationalState: OperationalState.OPEN });
    model.updateComponent('CB-3A', { operationalState: OperationalState.OPEN });

    analysis = model.lastTopologyAnalysis;
    // Todo sigue energizado a través de los interruptores de Barra 2
    assert.equal(analysis.suppliedLoads.length, 2, 'Doble barra doble interruptor soporta indisponibilidad de barra 1');
  });

  test('debe rechazar una clave de topología no registrada', () => {
    const model = new NetworkModel(new EventBus());
    assert.throws(() => {
      loadTopologyPreset(model, 'TOPOLOGIA_INEXISTENTE');
    }, /no reconocida/);
  });
});
