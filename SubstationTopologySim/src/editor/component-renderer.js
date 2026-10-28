/**
 * ComponentRenderer - SubstationTopologySim
 * Renderizador SVG vectorial de símbolos eléctricos normalizados (IEEE / IEC).
 * Incorpora doble codificación: color + iconografía/letras (I/O) y estado de energización viva.
 */

import { ComponentType, OperationalState } from '../model/components.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class ComponentRenderer {
  /**
   * Obtiene el color representativo según nivel de tensión.
   * @param {number} kv
   * @returns {string}
   */
  static getVoltageColor(kv) {
    if (kv >= 500) return 'var(--voltage-500kv)';
    if (kv >= 220) return 'var(--voltage-220kv)';
    if (kv >= 110) return 'var(--voltage-110kv)';
    if (kv >= 66)  return 'var(--voltage-66kv)';
    if (kv >= 23)  return 'var(--voltage-23kv)';
    return 'var(--voltage-13kv)';
  }

  /**
   * Renderiza el elemento SVG de un componente completo.
   * @param {Object} comp - Datos del componente
   * @param {boolean} isSelected - Si está seleccionado actualmente
   * @returns {SVGGElement}
   */
  static render(comp, isSelected = false) {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('id', `svg-comp-${comp.id}`);
    const energizedClass = comp.isEnergized ? 'energized' : 'deenergized';
    group.setAttribute('class', `substation-component ${isSelected ? 'selected' : ''} ${energizedClass}`);
    group.setAttribute('transform', `translate(${comp.position.x}, ${comp.position.y})`);
    group.dataset.componentId = comp.id;

    const w = comp.dimensions.width;
    const h = comp.dimensions.height;

    // Caja de selección envolvente (visible solo si está seleccionado)
    const bbox = document.createElementNS(SVG_NS, 'rect');
    bbox.setAttribute('class', 'component-selection-bbox');
    bbox.setAttribute('x', -8);
    bbox.setAttribute('y', -8);
    bbox.setAttribute('width', w + 16);
    bbox.setAttribute('height', h + 24);
    bbox.setAttribute('rx', 6);
    group.appendChild(bbox);

    // Contenedor del símbolo específico
    const symbolGroup = document.createElementNS(SVG_NS, 'g');
    symbolGroup.setAttribute('class', 'symbol-body');

    switch (comp.type) {
      case ComponentType.BUSBAR:
        this.renderBusbar(symbolGroup, comp);
        break;
      case ComponentType.CIRCUIT_BREAKER:
        this.renderCircuitBreaker(symbolGroup, comp);
        break;
      case ComponentType.DISCONNECTOR:
        this.renderDisconnector(symbolGroup, comp);
        break;
      case ComponentType.TRANSFORMER:
        this.renderTransformer(symbolGroup, comp);
        break;
      case ComponentType.FEEDER_LOAD:
        this.renderLoad(symbolGroup, comp);
        break;
      case ComponentType.SOURCE:
        this.renderSource(symbolGroup, comp);
        break;
    }

    group.appendChild(symbolGroup);

    // Terminales eléctricos (puntos de conexión)
    this.renderTerminals(group, comp);

    // Etiqueta identificadora y estado de energización
    this.renderLabels(group, comp);

    return group;
  }

  /**
   * Renderiza una barra eléctrica (Busbar).
   */
  static renderBusbar(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;
    const vColor = this.getVoltageColor(comp.properties.voltageLevel);

    const bar = document.createElementNS(SVG_NS, 'rect');
    bar.setAttribute('class', 'symbol-busbar-body');
    bar.setAttribute('x', 0);
    bar.setAttribute('y', 0);
    bar.setAttribute('width', w);
    bar.setAttribute('height', h);
    bar.setAttribute('rx', 4);
    bar.setAttribute('fill', vColor);
    bar.setAttribute('stroke', comp.isEnergized ? '#ef4444' : '#ffffff');
    bar.setAttribute('stroke-width', comp.isEnergized ? '2.5' : '1.5');
    bar.setAttribute('filter', comp.isEnergized ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.7))' : 'drop-shadow(0 0 3px rgba(0,0,0,0.5))');
    parent.appendChild(bar);

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', 6);
    line.setAttribute('y1', h / 2);
    line.setAttribute('x2', w - 6);
    line.setAttribute('y2', h / 2);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '4 4');
    parent.appendChild(line);
  }

  /**
   * Renderiza un Interruptor de Potencia (Circuit Breaker).
   */
  static renderCircuitBreaker(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;
    const isClosed = comp.operationalState === OperationalState.CLOSED;
    const isOOS = comp.operationalState === OperationalState.OUT_OF_SERVICE;

    const box = document.createElementNS(SVG_NS, 'rect');
    box.setAttribute('class', 'symbol-breaker-box');
    box.setAttribute('x', 5);
    box.setAttribute('y', 5);
    box.setAttribute('width', w - 10);
    box.setAttribute('height', h - 10);
    box.setAttribute('rx', 4);
    box.setAttribute('fill', isOOS ? '#292524' : (isClosed ? '#3b1212' : '#062d22'));
    box.setAttribute('stroke', isOOS ? '#f97316' : (isClosed ? 'var(--color-state-closed)' : 'var(--color-state-open)'));
    box.setAttribute('stroke-width', '2');
    parent.appendChild(box);

    if (isClosed) {
      const cross1 = document.createElementNS(SVG_NS, 'line');
      cross1.setAttribute('class', 'symbol-breaker-cross');
      cross1.setAttribute('x1', 12);
      cross1.setAttribute('y1', 12);
      cross1.setAttribute('x2', w - 12);
      cross1.setAttribute('y2', h - 12);
      parent.appendChild(cross1);

      const cross2 = document.createElementNS(SVG_NS, 'line');
      cross2.setAttribute('class', 'symbol-breaker-cross');
      cross2.setAttribute('x1', w - 12);
      cross2.setAttribute('y1', 12);
      cross2.setAttribute('x2', 12);
      cross2.setAttribute('y2', h - 12);
      parent.appendChild(cross2);
    } else if (isOOS) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('class', 'state-badge-text');
      text.setAttribute('x', w / 2);
      text.setAttribute('y', h / 2);
      text.setAttribute('fill', '#f97316');
      text.textContent = 'MTO';
      parent.appendChild(text);
    } else {
      const gapLine1 = document.createElementNS(SVG_NS, 'line');
      gapLine1.setAttribute('class', 'symbol-breaker-open-indicator');
      gapLine1.setAttribute('x1', w / 2);
      gapLine1.setAttribute('y1', 8);
      gapLine1.setAttribute('x2', w / 2);
      gapLine1.setAttribute('y2', 16);
      parent.appendChild(gapLine1);

      const openCircle = document.createElementNS(SVG_NS, 'circle');
      openCircle.setAttribute('cx', w / 2);
      openCircle.setAttribute('cy', h / 2);
      openCircle.setAttribute('r', 6);
      openCircle.setAttribute('fill', 'none');
      openCircle.setAttribute('stroke', 'var(--color-state-open)');
      openCircle.setAttribute('stroke-width', '2');
      parent.appendChild(openCircle);

      const gapLine2 = document.createElementNS(SVG_NS, 'line');
      gapLine2.setAttribute('class', 'symbol-breaker-open-indicator');
      gapLine2.setAttribute('x1', w / 2);
      gapLine2.setAttribute('y1', h - 16);
      gapLine2.setAttribute('x2', w / 2);
      gapLine2.setAttribute('y2', h - 8);
      parent.appendChild(gapLine2);
    }

    const pinIn = document.createElementNS(SVG_NS, 'line');
    pinIn.setAttribute('x1', w / 2);
    pinIn.setAttribute('y1', 0);
    pinIn.setAttribute('x2', w / 2);
    pinIn.setAttribute('y2', 5);
    pinIn.setAttribute('stroke', '#94a3b8');
    pinIn.setAttribute('stroke-width', '2');
    parent.appendChild(pinIn);

    const pinOut = document.createElementNS(SVG_NS, 'line');
    pinOut.setAttribute('x1', w / 2);
    pinOut.setAttribute('y1', h - 5);
    pinOut.setAttribute('x2', w / 2);
    pinOut.setAttribute('y2', h);
    pinOut.setAttribute('stroke', '#94a3b8');
    pinOut.setAttribute('stroke-width', '2');
    parent.appendChild(pinOut);
  }

  /**
   * Renderiza un Seccionador (Disconnector).
   */
  static renderDisconnector(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;
    const isClosed = comp.operationalState === OperationalState.CLOSED;

    const topPad = document.createElementNS(SVG_NS, 'circle');
    topPad.setAttribute('cx', w / 2);
    topPad.setAttribute('cy', 14);
    topPad.setAttribute('r', 3);
    topPad.setAttribute('fill', '#f1f5f9');
    parent.appendChild(topPad);

    const pivot = document.createElementNS(SVG_NS, 'circle');
    pivot.setAttribute('cx', w / 2);
    pivot.setAttribute('cy', h - 14);
    pivot.setAttribute('r', 3.5);
    pivot.setAttribute('fill', isClosed ? 'var(--color-state-closed)' : 'var(--color-state-open)');
    parent.appendChild(pivot);

    const blade = document.createElementNS(SVG_NS, 'line');
    blade.setAttribute('class', 'symbol-disconnector-blade');
    blade.setAttribute('x1', w / 2);
    blade.setAttribute('y1', h - 14);

    if (isClosed) {
      blade.setAttribute('x2', w / 2);
      blade.setAttribute('y2', 14);
      blade.setAttribute('stroke', 'var(--color-state-closed)');
    } else {
      blade.setAttribute('x2', (w / 2) + 16);
      blade.setAttribute('y2', 18);
      blade.setAttribute('stroke', 'var(--color-state-open)');
    }
    blade.setAttribute('stroke-width', '2.5');
    parent.appendChild(blade);

    const lineTop = document.createElementNS(SVG_NS, 'line');
    lineTop.setAttribute('x1', w / 2);
    lineTop.setAttribute('y1', 0);
    lineTop.setAttribute('x2', w / 2);
    lineTop.setAttribute('y2', 14);
    lineTop.setAttribute('stroke', '#94a3b8');
    lineTop.setAttribute('stroke-width', '2');
    parent.appendChild(lineTop);

    const lineBottom = document.createElementNS(SVG_NS, 'line');
    lineBottom.setAttribute('x1', w / 2);
    lineBottom.setAttribute('y1', h - 14);
    lineBottom.setAttribute('x2', w / 2);
    lineBottom.setAttribute('y2', h);
    lineBottom.setAttribute('stroke', '#94a3b8');
    lineBottom.setAttribute('stroke-width', '2');
    parent.appendChild(lineBottom);
  }

  /**
   * Renderiza un Transformador de Potencia (Transformer).
   */
  static renderTransformer(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;
    const r = 18;
    const c1y = (h / 2) - 10;
    const c2y = (h / 2) + 10;

    const winding1 = document.createElementNS(SVG_NS, 'circle');
    winding1.setAttribute('class', 'symbol-transformer-winding');
    winding1.setAttribute('cx', w / 2);
    winding1.setAttribute('cy', c1y);
    winding1.setAttribute('r', r);
    winding1.setAttribute('stroke', this.getVoltageColor(comp.properties.voltageLevel || 220));
    winding1.setAttribute('fill', 'rgba(23, 31, 44, 0.6)');
    parent.appendChild(winding1);

    const winding2 = document.createElementNS(SVG_NS, 'circle');
    winding2.setAttribute('class', 'symbol-transformer-winding');
    winding2.setAttribute('cx', w / 2);
    winding2.setAttribute('cy', c2y);
    winding2.setAttribute('r', r);
    winding2.setAttribute('stroke', this.getVoltageColor(comp.properties.secondaryVoltage || 66));
    winding2.setAttribute('fill', 'rgba(23, 31, 44, 0.6)');
    parent.appendChild(winding2);

    const lineIn = document.createElementNS(SVG_NS, 'line');
    lineIn.setAttribute('x1', w / 2);
    lineIn.setAttribute('y1', 0);
    lineIn.setAttribute('x2', w / 2);
    lineIn.setAttribute('y2', c1y - r);
    lineIn.setAttribute('stroke', '#94a3b8');
    lineIn.setAttribute('stroke-width', '2');
    parent.appendChild(lineIn);

    const lineOut = document.createElementNS(SVG_NS, 'line');
    lineOut.setAttribute('x1', w / 2);
    lineOut.setAttribute('y1', c2y + r);
    lineOut.setAttribute('x2', w / 2);
    lineOut.setAttribute('y2', h);
    lineOut.setAttribute('stroke', '#94a3b8');
    lineOut.setAttribute('stroke-width', '2');
    parent.appendChild(lineOut);
  }

  /**
   * Renderiza una Carga / Alimentador (Feeder Load).
   */
  static renderLoad(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;

    const lineIn = document.createElementNS(SVG_NS, 'line');
    lineIn.setAttribute('x1', w / 2);
    lineIn.setAttribute('y1', 0);
    lineIn.setAttribute('x2', w / 2);
    lineIn.setAttribute('y2', 15);
    lineIn.setAttribute('stroke', '#94a3b8');
    lineIn.setAttribute('stroke-width', '2');
    parent.appendChild(lineIn);

    const arrow = document.createElementNS(SVG_NS, 'polygon');
    const tipY = h - 6;
    const baseY = 15;
    const points = `${w / 2},${tipY} ${(w / 2) - 14},${baseY} ${(w / 2) + 14},${baseY}`;
    arrow.setAttribute('points', points);
    arrow.setAttribute('fill', comp.isEnergized ? '#0284c7' : '#334155');
    arrow.setAttribute('stroke', comp.isEnergized ? '#38bdf8' : '#64748b');
    arrow.setAttribute('stroke-width', '1.5');
    parent.appendChild(arrow);
  }

  /**
   * Renderiza una Fuente de Red Eléctrica (Source / Grid).
   */
  static renderSource(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;
    const r = 18;
    const cy = 24;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', w / 2);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', comp.isEnergized ? 'rgba(239, 68, 68, 0.25)' : 'rgba(100, 116, 139, 0.2)');
    circle.setAttribute('stroke', comp.isEnergized ? '#ef4444' : '#64748b');
    circle.setAttribute('stroke-width', '2');
    parent.appendChild(circle);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M ${(w / 2) - 10} ${cy} Q ${(w / 2) - 5} ${cy - 8} ${w / 2} ${cy} T ${(w / 2) + 10} ${cy}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', comp.isEnergized ? '#f87171' : '#94a3b8');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    parent.appendChild(path);

    const lineOut = document.createElementNS(SVG_NS, 'line');
    lineOut.setAttribute('x1', w / 2);
    lineOut.setAttribute('y1', cy + r);
    lineOut.setAttribute('x2', w / 2);
    lineOut.setAttribute('y2', h);
    lineOut.setAttribute('stroke', '#94a3b8');
    lineOut.setAttribute('stroke-width', '2');
    parent.appendChild(lineOut);
  }

  /**
   * Renderiza los terminales de conexión.
   */
  static renderTerminals(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;

    for (const term of comp.terminals) {
      const pinX = w * term.relX;
      const pinY = h * term.relY;

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('class', `component-terminal ${comp.isEnergized ? 'energized' : ''}`);
      circle.setAttribute('cx', pinX);
      circle.setAttribute('cy', pinY);
      circle.setAttribute('r', 4.5);
      circle.dataset.terminalId = term.id;
      circle.dataset.componentId = comp.id;

      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = `Terminal ${term.name} (${comp.name}) - Clic para cablear`;
      circle.appendChild(title);

      parent.appendChild(circle);
    }
  }

  /**
   * Renderiza las etiquetas de texto de ingeniería y el indicador de energización.
   */
  static renderLabels(parent, comp) {
    const w = comp.dimensions.width;
    const h = comp.dimensions.height;

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'component-label');
    label.setAttribute('x', w / 2);
    label.setAttribute('y', h + 14);
    label.textContent = comp.name;
    parent.appendChild(label);
  }
}
