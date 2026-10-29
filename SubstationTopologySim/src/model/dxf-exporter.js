/**
 * DxfExporter - SubstationTopologySim
 * Exportador de planos unifilares a formato estándar CAD ASCII DXF (Release 12 / 2000).
 * Genera entidades geométricas vectoriales puras (LINE, CIRCLE, LWPOLYLINE, TEXT)
 * organizadas por capas normalizadas de ingeniería y códigos de color ACI según nivel de tensión.
 */

import { ComponentType, OperationalState } from './components.js';

/**
 * Tabla de colores estándar ACI (AutoCAD Color Index) por nivel de tensión y disciplina.
 */
export const ACI_COLORS = Object.freeze({
  RED: 1,         // Rojo (500 kV, Barras primarias)
  YELLOW: 2,      // Amarillo (110 kV, Textos y cotas)
  GREEN: 3,       // Verde (66 kV, Equipos de maniobra)
  CYAN: 4,        // Cyan (23 kV, Ramas y conductores)
  BLUE: 5,        // Azul (13.8 kV)
  MAGENTA: 6,     // Magenta
  WHITE: 7,       // Blanco / Negro (Marco, carátula)
  ORANGE: 30      // Naranja (220 kV)
});

export const DXF_LAYERS = Object.freeze({
  BUSBARS: { name: '0_BARRAS', color: ACI_COLORS.RED, lineType: 'CONTINUOUS' },
  EQUIPMENT: { name: '0_EQUIPOS', color: ACI_COLORS.GREEN, lineType: 'CONTINUOUS' },
  CONNECTIONS: { name: '0_CONEXIONES', color: ACI_COLORS.CYAN, lineType: 'CONTINUOUS' },
  TEXTS: { name: '0_TEXTOS', color: ACI_COLORS.YELLOW, lineType: 'CONTINUOUS' },
  VOLT_500KV: { name: '0_VOLT_500KV', color: ACI_COLORS.RED, lineType: 'CONTINUOUS' },
  VOLT_220KV: { name: '0_VOLT_220KV', color: ACI_COLORS.ORANGE, lineType: 'CONTINUOUS' },
  VOLT_110KV: { name: '0_VOLT_110KV', color: ACI_COLORS.YELLOW, lineType: 'CONTINUOUS' },
  VOLT_66KV: { name: '0_VOLT_66KV', color: ACI_COLORS.GREEN, lineType: 'CONTINUOUS' },
  VOLT_23KV: { name: '0_VOLT_23KV', color: ACI_COLORS.CYAN, lineType: 'CONTINUOUS' },
  VOLT_13KV: { name: '0_VOLT_13KV', color: ACI_COLORS.BLUE, lineType: 'CONTINUOUS' }
});

export class DxfExporter {
  /**
   * Genera el contenido textual completo de un archivo ASCII DXF a partir del grafo eléctrico.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @param {Object} [options]
   * @param {boolean} [options.invertY=true] Si es true, invierte el eje Y para adaptarse al sistema cartesiano CAD.
   * @param {number} [options.padding=50] Margen perimetral en unidades de dibujo.
   * @param {number} [options.scale=1.0] Factor de escala geométrico.
   * @returns {string} Fichero DXF completo compatible con software CAD estándar.
   */
  static exportToDXF(networkModel, options = {}) {
    const invertY = options.invertY ?? true;
    const padding = options.padding ?? 50;
    const scale = options.scale ?? 1.0;

    const components = networkModel.getAllComponents();
    const connections = networkModel.getAllConnections();

    // 1. Calcular caja envolvente (Bounding Box) en coordenadas de pantalla SVG
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    if (components.length === 0) {
      minX = 0;
      minY = 0;
      maxX = 800;
      maxY = 600;
    } else {
      for (const comp of components) {
        const x = comp.position.x;
        const y = comp.position.y;
        const w = comp.dimensions.width;
        const h = comp.dimensions.height;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + w > maxX) maxX = x + w;
        if (y + h > maxY) maxY = y + h;
      }
    }

    // Función de transformación de coordenadas (SVG Screen -> CAD WCS)
    const toCad = (svgX, svgY) => {
      const scaledX = (svgX - minX) * scale + padding;
      let scaledY;
      if (invertY) {
        scaledY = (maxY - svgY) * scale + padding;
      } else {
        scaledY = (svgY - minY) * scale + padding;
      }
      return {
        x: Number(scaledX.toFixed(2)),
        y: Number(scaledY.toFixed(2))
      };
    };

    // 2. Construir secciones DXF
    const lines = [];

    // --- SECCIÓN HEADER ---
    lines.push('  0', 'SECTION');
    lines.push('  2', 'HEADER');
    lines.push('  9', '$ACADVER');
    lines.push('  1', 'AC1009'); // AutoCAD Release 11/12 (formato estándar más universal)
    lines.push('  9', '$INSUNITS');
    lines.push(' 70', '      4'); // 4 = Milímetros
    lines.push('  0', 'ENDSEC');

    // --- SECCIÓN TABLES ---
    lines.push('  0', 'SECTION');
    lines.push('  2', 'TABLES');

    // Tabla LTYPE (Tipos de línea)
    lines.push('  0', 'TABLE');
    lines.push('  2', 'LTYPE');
    lines.push(' 70', '     1');
    lines.push('  0', 'LTYPE');
    lines.push('  2', 'CONTINUOUS');
    lines.push(' 70', '     0');
    lines.push('  3', 'Solid line');
    lines.push(' 72', '    65');
    lines.push(' 73', '     0');
    lines.push(' 40', '0.0');
    lines.push('  0', 'ENDTAB');

    // Tabla LAYER (Capas de ingeniería)
    const layerEntries = Object.values(DXF_LAYERS);
    lines.push('  0', 'TABLE');
    lines.push('  2', 'LAYER');
    lines.push(' 70', `     ${layerEntries.length + 1}`);

    // Capa 0 obligatoria
    lines.push('  0', 'LAYER');
    lines.push('  2', '0');
    lines.push(' 70', '     0');
    lines.push(' 62', '     7');
    lines.push('  6', 'CONTINUOUS');

    for (const lyr of layerEntries) {
      lines.push('  0', 'LAYER');
      lines.push('  2', lyr.name);
      lines.push(' 70', '     0');
      lines.push(' 62', `     ${lyr.color}`);
      lines.push('  6', lyr.lineType);
    }
    lines.push('  0', 'ENDTAB');

    // Tabla STYLE (Estilos de texto)
    lines.push('  0', 'TABLE');
    lines.push('  2', 'STYLE');
    lines.push(' 70', '     1');
    lines.push('  0', 'STYLE');
    lines.push('  2', 'STANDARD');
    lines.push(' 70', '     0');
    lines.push(' 40', '0.0');
    lines.push(' 41', '1.0');
    lines.push(' 50', '0.0');
    lines.push(' 71', '     0');
    lines.push(' 42', '2.5');
    lines.push('  3', 'txt');
    lines.push('  4', '');
    lines.push('  0', 'ENDTAB');

    lines.push('  0', 'ENDSEC');

    // --- SECCIÓN BLOCKS (Vacía pero requerida) ---
    lines.push('  0', 'SECTION');
    lines.push('  2', 'BLOCKS');
    lines.push('  0', 'ENDSEC');

    // --- SECCIÓN ENTITIES ---
    lines.push('  0', 'SECTION');
    lines.push('  2', 'ENTITIES');

    // Helper para insertar líneas DXF
    const addLine = (layer, p1, p2) => {
      lines.push('  0', 'LINE');
      lines.push('  8', layer);
      lines.push(' 10', p1.x.toFixed(2));
      lines.push(' 20', p1.y.toFixed(2));
      lines.push(' 30', '0.0');
      lines.push(' 11', p2.x.toFixed(2));
      lines.push(' 21', p2.y.toFixed(2));
      lines.push(' 31', '0.0');
    };

    // Helper para insertar círculos DXF
    const addCircle = (layer, center, radius) => {
      lines.push('  0', 'CIRCLE');
      lines.push('  8', layer);
      lines.push(' 10', center.x.toFixed(2));
      lines.push(' 20', center.y.toFixed(2));
      lines.push(' 30', '0.0');
      lines.push(' 40', radius.toFixed(2));
    };

    // Helper para insertar textos DXF
    const addText = (layer, pos, height, text) => {
      if (!text) return;
      const cleanText = String(text).replace(/[\r\n]+/g, ' ').trim();
      lines.push('  0', 'TEXT');
      lines.push('  8', layer);
      lines.push(' 10', pos.x.toFixed(2));
      lines.push(' 20', pos.y.toFixed(2));
      lines.push(' 30', '0.0');
      lines.push(' 40', height.toFixed(2));
      lines.push('  1', cleanText);
    };

    // Helper para determinar capa según nivel de tensión
    const getVoltageLayer = (voltageLevel, defaultLayer) => {
      if (voltageLevel >= 500) return DXF_LAYERS.VOLT_500KV.name;
      if (voltageLevel >= 220) return DXF_LAYERS.VOLT_220KV.name;
      if (voltageLevel >= 110) return DXF_LAYERS.VOLT_110KV.name;
      if (voltageLevel >= 66)  return DXF_LAYERS.VOLT_66KV.name;
      if (voltageLevel >= 23)  return DXF_LAYERS.VOLT_23KV.name;
      if (voltageLevel >= 13)  return DXF_LAYERS.VOLT_13KV.name;
      return defaultLayer;
    };

    // A. Exportar Conexiones y Ramas Manhattan
    for (const conn of connections) {
      const p1Svg = networkModel.getTerminalAbsolutePosition(conn.fromComponentId, conn.fromTerminalId);
      const p2Svg = networkModel.getTerminalAbsolutePosition(conn.toComponentId, conn.toTerminalId);

      if (!p1Svg || !p2Svg) continue;

      const p1 = toCad(p1Svg.x, p1Svg.y);
      const p2 = toCad(p2Svg.x, p2Svg.y);

      // Obtener tensión de los componentes conectados para la capa
      const comp1 = networkModel.getComponent(conn.fromComponentId);
      const vLvl = comp1?.properties?.voltageLevel || 220;
      const layer = getVoltageLayer(vLvl, DXF_LAYERS.CONNECTIONS.name);

      const dx = Math.abs(p2.x - p1.x);
      const dy = Math.abs(p2.y - p1.y);

      if (dx < 1 || dy < 1) {
        // Trazado rectilíneo directo
        addLine(layer, p1, p2);
      } else {
        // Trazado ortogonal Manhattan en 3 tramos (punto intermedio a mitad de Y)
        const midY = Number(((p1.y + p2.y) / 2).toFixed(2));
        const pMid1 = { x: p1.x, y: midY };
        const pMid2 = { x: p2.x, y: midY };

        addLine(layer, p1, pMid1);
        addLine(layer, pMid1, pMid2);
        addLine(layer, pMid2, p2);
      }
    }

    // B. Exportar Componentes y Aparamenta
    for (const comp of components) {
      const xSvg = comp.position.x;
      const ySvg = comp.position.y;
      const wSvg = comp.dimensions.width;
      const hSvg = comp.dimensions.height;

      const pTL = toCad(xSvg, ySvg);
      const pBR = toCad(xSvg + wSvg, ySvg + hSvg);

      // Coordenadas cartesianas normalizadas de esquinas
      const xMin = Math.min(pTL.x, pBR.x);
      const xMax = Math.max(pTL.x, pBR.x);
      const yMin = Math.min(pTL.y, pBR.y);
      const yMax = Math.max(pTL.y, pBR.y);
      const cx = Number(((xMin + xMax) / 2).toFixed(2));
      const cy = Number(((yMin + yMax) / 2).toFixed(2));

      const vLvl = comp.properties?.voltageLevel || 220;
      const eqLayer = getVoltageLayer(vLvl, DXF_LAYERS.EQUIPMENT.name);

      switch (comp.type) {
        case ComponentType.BUSBAR: {
          const busLayer = getVoltageLayer(vLvl, DXF_LAYERS.BUSBARS.name);
          // Rectángulo de la barra colectora
          addLine(busLayer, { x: xMin, y: yMin }, { x: xMax, y: yMin });
          addLine(busLayer, { x: xMax, y: yMin }, { x: xMax, y: yMax });
          addLine(busLayer, { x: xMax, y: yMax }, { x: xMin, y: yMax });
          addLine(busLayer, { x: xMin, y: yMax }, { x: xMin, y: yMin });

          // Eje central de la barra
          addLine(busLayer, { x: xMin, y: cy }, { x: xMax, y: cy });

          // Etiqueta de la barra
          addText(DXF_LAYERS.TEXTS.name, { x: xMin + 4, y: yMax + 6 }, 5, `${comp.name} [${vLvl} kV]`);
          break;
        }

        case ComponentType.CIRCUIT_BREAKER: {
          // Caja cuadrada externa del interruptor (36x36 mm)
          const bRadius = 18;
          const boxTL = { x: cx - bRadius, y: cy + bRadius };
          const boxTR = { x: cx + bRadius, y: cy + bRadius };
          const boxBR = { x: cx + bRadius, y: cy - bRadius };
          const boxBL = { x: cx - bRadius, y: cy - bRadius };

          addLine(eqLayer, boxTL, boxTR);
          addLine(eqLayer, boxTR, boxBR);
          addLine(eqLayer, boxBR, boxBL);
          addLine(eqLayer, boxBL, boxTL);

          // Cruz interna representativa del interruptor
          addLine(eqLayer, { x: cx - 12, y: cy - 12 }, { x: cx + 12, y: cy + 12 });
          addLine(eqLayer, { x: cx - 12, y: cy + 12 }, { x: cx + 12, y: cy - 12 });

          // Terminal stubs
          addLine(eqLayer, { x: cx, y: yMax }, { x: cx, y: cy + bRadius });
          addLine(eqLayer, { x: cx, y: yMin }, { x: cx, y: cy - bRadius });

          // Etiqueta identificadora
          addText(DXF_LAYERS.TEXTS.name, { x: cx + bRadius + 4, y: cy - 2 }, 4.5, comp.name || comp.id);
          break;
        }

        case ComponentType.DISCONNECTOR: {
          // Contactos fijos (círculos)
          const contactRadius = 3;
          const topContactY = cy + 14;
          const botContactY = cy - 14;

          addCircle(eqLayer, { x: cx, y: topContactY }, contactRadius);
          addCircle(eqLayer, { x: cx, y: botContactY }, contactRadius);

          // Cuchilla del seccionador
          if (comp.operationalState === OperationalState.CLOSED) {
            addLine(eqLayer, { x: cx, y: botContactY + contactRadius }, { x: cx, y: topContactY - contactRadius });
          } else {
            // Cuchilla abierta en ángulo
            addLine(eqLayer, { x: cx, y: botContactY + contactRadius }, { x: cx + 12, y: cy + 4 });
          }

          // Terminal stubs
          addLine(eqLayer, { x: cx, y: yMax }, { x: cx, y: topContactY + contactRadius });
          addLine(eqLayer, { x: cx, y: yMin }, { x: cx, y: botContactY - contactRadius });

          // Etiqueta
          addText(DXF_LAYERS.TEXTS.name, { x: cx + 16, y: cy - 2 }, 4.5, comp.name || comp.id);
          break;
        }

        case ComponentType.TRANSFORMER: {
          // Dos círculos concéntricos/superpuestos estándar IEC (devanados primario y secundario)
          const windingRadius = 16;
          const topWindingY = cy + 11;
          const botWindingY = cy - 11;

          addCircle(eqLayer, { x: cx, y: topWindingY }, windingRadius);
          addCircle(eqLayer, { x: cx, y: botWindingY }, windingRadius);

          // Terminal stubs
          addLine(eqLayer, { x: cx, y: yMax }, { x: cx, y: topWindingY + windingRadius });
          addLine(eqLayer, { x: cx, y: yMin }, { x: cx, y: botWindingY - windingRadius });

          // Rótulo técnico del transformador
          const sMva = comp.properties?.ratedPower || 60;
          const vSec = comp.properties?.secondaryVoltage || 66;
          addText(DXF_LAYERS.TEXTS.name, { x: cx + windingRadius + 4, y: cy + 4 }, 4.5, comp.name || comp.id);
          addText(DXF_LAYERS.TEXTS.name, { x: cx + windingRadius + 4, y: cy - 6 }, 4.0, `${sMva} MVA · ${vLvl}/${vSec} kV`);
          break;
        }

        case ComponentType.FEEDER_LOAD: {
          // Flecha o triángulo descendente de consumo
          const arrowTopY = cy + 8;
          const arrowBotY = cy - 16;
          const arrowW = 14;

          addLine(eqLayer, { x: cx, y: arrowBotY }, { x: cx - arrowW, y: arrowTopY });
          addLine(eqLayer, { x: cx - arrowW, y: arrowTopY }, { x: cx + arrowW, y: arrowTopY });
          addLine(eqLayer, { x: cx + arrowW, y: arrowTopY }, { x: cx, y: arrowBotY });

          // Terminal stub superior
          addLine(eqLayer, { x: cx, y: yMax }, { x: cx, y: arrowTopY });

          // Rótulo
          const pMw = comp.properties?.ratedPower || 20;
          addText(DXF_LAYERS.TEXTS.name, { x: cx + arrowW + 4, y: cy - 2 }, 4.5, comp.name || comp.id);
          addText(DXF_LAYERS.TEXTS.name, { x: cx + arrowW + 4, y: cy - 10 }, 4.0, `${pMw} MW`);
          break;
        }

        case ComponentType.SOURCE: {
          // Generador / Red externa (círculo con símbolo tilde/senoidal)
          const genRadius = 16;
          addCircle(eqLayer, { x: cx, y: cy }, genRadius);

          // Onda senoidal esquemática interna
          addLine(eqLayer, { x: cx - 8, y: cy }, { x: cx - 4, y: cy + 6 });
          addLine(eqLayer, { x: cx - 4, y: cy + 6 }, { x: cx, y: cy });
          addLine(eqLayer, { x: cx, y: cy }, { x: cx + 4, y: cy - 6 });
          addLine(eqLayer, { x: cx + 4, y: cy - 6 }, { x: cx + 8, y: cy });

          // Terminal stub
          addLine(eqLayer, { x: cx, y: yMin }, { x: cx, y: cy - genRadius });

          // Rótulo
          addText(DXF_LAYERS.TEXTS.name, { x: cx + genRadius + 4, y: cy - 2 }, 4.5, comp.name || comp.id);
          addText(DXF_LAYERS.TEXTS.name, { x: cx + genRadius + 4, y: cy - 10 }, 4.0, `${vLvl} kV`);
          break;
        }

        default: {
          // Caja genérica de contorno
          addLine(eqLayer, { x: xMin, y: yMin }, { x: xMax, y: yMin });
          addLine(eqLayer, { x: xMax, y: yMin }, { x: xMax, y: yMax });
          addLine(eqLayer, { x: xMax, y: yMax }, { x: xMin, y: yMax });
          addLine(eqLayer, { x: xMin, y: yMax }, { x: xMin, y: yMin });
          addText(DXF_LAYERS.TEXTS.name, { x: xMin + 4, y: cy }, 4.5, comp.name || comp.id);
        }
      }
    }

    lines.push('  0', 'ENDSEC');

    // --- FIN DE FICHERO DXF ---
    lines.push('  0', 'EOF');

    return lines.join('\n');
  }

  /**
   * Ejecuta la descarga en el navegador del archivo DXF generado.
   * @param {import('./network-model.js').NetworkModel} networkModel
   * @param {string} [filename='subestacion_unifilar.dxf']
   * @param {Object} [options]
   */
  static downloadDXF(networkModel, filename = 'subestacion_unifilar.dxf', options = {}) {
    const dxfString = this.exportToDXF(networkModel, options);

    // Entorno de navegador con DOM disponible
    if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
      const blob = new Blob([dxfString], { type: 'application/dxf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return dxfString;
  }
}
