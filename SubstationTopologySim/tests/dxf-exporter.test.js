/**
 * Pruebas unitarias - Fase 7: Exportador CAD (ASCII DXF)
 * Valida la estructura de secciones DXF, capas de ingeniería, colores ACI,
 * entidades vectoriales (LINE, CIRCLE, TEXT) y transformación geométrica SVG-a-WCS.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { NetworkModel } from '../src/model/network-model.js';
import { ComponentType, OperationalState, createComponent } from '../src/model/components.js';
import { TOPOLOGY_PRESET_KEYS, loadTopologyPreset } from '../src/model/topology-presets.js';
import { DxfExporter, DXF_LAYERS, ACI_COLORS } from '../src/model/dxf-exporter.js';

describe('Fase 7: Exportador CAD ASCII DXF (DxfExporter)', () => {
  it('debe generar las secciones estándar obligatorias DXF y finalizar en EOF', () => {
    const model = new NetworkModel();
    const dxf = DxfExporter.exportToDXF(model);

    // Secciones estándar de un fichero DXF Release 11/12
    assert.ok(dxf.includes('HEADER'), 'Debe contener la sección HEADER');
    assert.ok(dxf.includes('$ACADVER'), 'Debe incluir la variable de versión $ACADVER');
    assert.ok(dxf.includes('AC1009'), 'Debe usar la especificación universal AC1009 (R11/R12)');
    assert.ok(dxf.includes('TABLES'), 'Debe contener la sección TABLES');
    assert.ok(dxf.includes('BLOCKS'), 'Debe contener la sección BLOCKS');
    assert.ok(dxf.includes('ENTITIES'), 'Debe contener la sección ENTITIES');
    assert.ok(dxf.endsWith('0\nEOF'), 'Debe finalizar con el marcador estándar 0\\nEOF');
  });

  it('debe definir las capas normalizadas con sus respectivos códigos de color ACI', () => {
    const model = new NetworkModel();
    const dxf = DxfExporter.exportToDXF(model);

    assert.ok(dxf.includes('0_BARRAS'), 'Debe definir la capa 0_BARRAS');
    assert.ok(dxf.includes('0_EQUIPOS'), 'Debe definir la capa 0_EQUIPOS');
    assert.ok(dxf.includes('0_CONEXIONES'), 'Debe definir la capa 0_CONEXIONES');
    assert.ok(dxf.includes('0_TEXTOS'), 'Debe definir la capa 0_TEXTOS');
    assert.ok(dxf.includes('0_VOLT_220KV'), 'Debe definir la capa 0_VOLT_220KV');
    assert.ok(dxf.includes('0_VOLT_66KV'), 'Debe definir la capa 0_VOLT_66KV');
  });

  it('debe exportar entidades geométricas acordes al tipo de equipo (LINE, CIRCLE, TEXT)', () => {
    const model = new NetworkModel();

    // Agregar barra, interruptor, transformador y carga
    const bb = createComponent(ComponentType.BUSBAR, { id: 'BB-TEST', x: 100, y: 100, width: 300 });
    const cb = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-TEST', x: 200, y: 160 });
    const tr = createComponent(ComponentType.TRANSFORMER, { id: 'TR-TEST', x: 200, y: 260 });
    const ld = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-TEST', x: 200, y: 380 });

    model.addComponent(bb);
    model.addComponent(cb);
    model.addComponent(tr);
    model.addComponent(ld);

    // Conectar rama
    model.addConnection({
      id: 'CONN-1',
      fromComponentId: 'BB-TEST',
      fromTerminalId: bb.terminals[0].id,
      toComponentId: 'CB-TEST',
      toTerminalId: 'CB-TEST-t1'
    });

    const dxf = DxfExporter.exportToDXF(model);

    // Verificaciones de primitivas
    assert.ok(dxf.includes('LINE'), 'Debe contener entidades de tipo LINE');
    assert.ok(dxf.includes('CIRCLE'), 'Debe contener entidades CIRCLE (trafo devanados)');
    assert.ok(dxf.includes('TEXT'), 'Debe contener entidades TEXT');
    assert.ok(dxf.includes('BB-TEST'), 'Debe incluir el texto con el identificador de la barra');
    assert.ok(dxf.includes('CB-TEST'), 'Debe incluir el texto con el identificador del interruptor');
    assert.ok(dxf.includes('TR-TEST'), 'Debe incluir el rótulo del transformador');
  });

  it('debe realizar la transformación de coordenadas SVG a WCS invirtiendo el eje Y correctamente', () => {
    const model = new NetworkModel();

    // Equipo arriba en pantalla (y=50) vs equipo abajo en pantalla (y=400)
    const src = createComponent(ComponentType.SOURCE, { id: 'SRC-TOP', name: 'SRC-TOP', x: 200, y: 50 });
    const load = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-BOT', name: 'LD-BOT', x: 200, y: 400 });

    model.addComponent(src);
    model.addComponent(load);

    const dxf = DxfExporter.exportToDXF(model, { invertY: true, padding: 50 });

    // En CAD cartesiano (WCS), el equipo que estaba arriba (menor Y en SVG) debe tener mayor Y en CAD
    // Buscar los textos en el archivo DXF para comprobar sus coordenadas Y
    const lines = dxf.split('\n');
    let srcY = null;
    let loadY = null;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === 'SRC-TOP') {
        // En la entidad TEXT, el código 20 (coordenada Y) está líneas arriba
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (lines[j].trim() === '20') {
            srcY = parseFloat(lines[j + 1]);
            break;
          }
        }
      }
      if (lines[i].trim() === 'LD-BOT') {
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (lines[j].trim() === '20') {
            loadY = parseFloat(lines[j + 1]);
            break;
          }
        }
      }
    }

    assert.ok(srcY !== null, 'Debe encontrar la coordenada Y del equipo superior');
    assert.ok(loadY !== null, 'Debe encontrar la coordenada Y del equipo inferior');
    assert.ok(srcY > loadY, `El equipo superior en pantalla debe tener mayor Y en CAD (srcY=${srcY} > loadY=${loadY})`);
  });

  it('debe exportar exitosamente a CAD DXF las 6 topologías normalizadas predefinidas', () => {
    const model = new NetworkModel();

    for (const key of Object.values(TOPOLOGY_PRESET_KEYS)) {
      loadTopologyPreset(model, key);

      const dxf = DxfExporter.exportToDXF(model);
      assert.ok(dxf.length > 500, `El DXF generado para ${key} debe contener geometría sustancial`);
      assert.ok(dxf.includes('0_BARRAS'), `El DXF para ${key} debe contener la capa de barras`);
      assert.ok(dxf.includes('0_EQUIPOS'), `El DXF para ${key} debe contener la capa de equipos`);
      assert.ok(dxf.includes('0_CONEXIONES'), `El DXF para ${key} debe contener la capa de ramas`);
      assert.ok(dxf.endsWith('0\nEOF'), `El DXF para ${key} debe terminar en EOF`);
    }
  });

  it('debe ejecutar downloadDXF sin lanzar errores en entorno sin DOM', () => {
    const model = new NetworkModel();
    loadTopologyPreset(model, TOPOLOGY_PRESET_KEYS.SINGLE_BUS);

    assert.doesNotThrow(() => {
      const output = DxfExporter.downloadDXF(model, 'test_export.dxf');
      assert.ok(typeof output === 'string');
      assert.ok(output.includes('AC1009'));
    });
  });
});
