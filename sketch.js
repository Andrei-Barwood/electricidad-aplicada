/* Continuidad domiciliaria: 24 plantillas en cuatro dificultades. */
"use strict";

const COLORS = {
  fase: "#ff4d5e",
  neutro: "#f7f8ff",
  carga: "#ffc857",
  switch: "#5de1ff",
  muted: "#77809c",
  green: "#9de35d",
  tierra: "#9de35d",
  amber: "#ffc857",
  bell: "#d7b3ff",
  ink: "#edf1fb",
};
const FIX = {
  series: "El mando va en la fase: al abrirlo, la fase queda separada de la carga.",
  hot: "Esta carga sale directo del tablero y sigue con tensión aunque los mandos estén abiertos.",
  parallel: "Con los pulsadores abiertos la fase se separa de la carga, y cada pulsador la enciende por sí solo.",
  bipolar: "La fase cruza un polo y el neutro el otro. Los dos polos quedan en el camino.",
};

let nodes = [];
let wires = [];
let components = [];
let activeLevel = null;
let draggingFrom = null;
let heldPush = null;
let draggingComponent = null;
let dragOffset = null;
let resizingComponent = null;
let resizeStart = null;
let resizingTablero = false;
let tableroResizeStart = null;
let resizingCanvas = false;
let canvasResizeStart = null;
let pointer = { x: 0, y: 0 };

let tableroBox = {
  x: 16,
  y: 36,
  w: 164,
  h: 596,
  minW: 164,
  minH: 560,
  maxW: 280,
  maxH: 1200,
};

function inTableroResizeHandle(mx, my) {
  const cornerX = tableroBox.x + tableroBox.w;
  const cornerY = tableroBox.y + tableroBox.h;
  return mx >= cornerX - 22 && mx <= cornerX + 8 && my >= cornerY - 22 && my <= cornerY + 8;
}

function inCanvasResizeHandle(mx, my) {
  return mx >= width - 26 && mx <= width && my >= height - 26 && my <= height;
}

function setTableroSize(nw, nh) {
  tableroBox.w = Math.max(tableroBox.minW, Math.min(tableroBox.maxW, nw));
  tableroBox.h = Math.max(tableroBox.minH, Math.min(tableroBox.maxH, nh));
  if (typeof resizeCanvas === "function" && tableroBox.y + tableroBox.h + 24 > height) {
    resizeCanvas(width, tableroBox.y + tableroBox.h + 30);
  }
  updatePeNodesPosition();
}

function updatePeNodesPosition() {
  const pe1 = nodes.find((n) => n.id === "tda-bar-pe1");
  const pe2 = nodes.find((n) => n.id === "tda-bar-pe2");
  const peBarY = tableroBox.y + tableroBox.h - 44;
  if (pe1) {
    pe1.x = Math.round(tableroBox.x + tableroBox.w * 0.35);
    pe1.y = peBarY + 14;
  }
  if (pe2) {
    pe2.x = Math.round(tableroBox.x + tableroBox.w * 0.65);
    pe2.y = peBarY + 14;
  }
}
let selectedWireType = "fase";
let circuitAnalysis = { short: false, complete: false, loads: [] };
let canvasElt = null;

class Node {
  constructor(id, x, y, type, label, owner = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.label = label;
    this.owner = owner;
    this.radius = 13;
  }
  isHovered(x, y) {
    return dist(x, y, this.x, this.y) <= this.radius + 11;
  }
  draw() {
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const hover = this.isHovered(mouseX, mouseY);
    const active = draggingFrom === this;
    let color = COLORS[this.type] || COLORS.switch;
    if (this.type === "tierra" || this.type === "green") color = COLORS.tierra;
    push();
    stroke(color);
    strokeWeight(hover || active ? 4 : 2);
    fill(active ? color : (isDay ? "#ffffff" : "#171b29"));
    circle(this.x, this.y, (hover || active ? 1.28 : 1) * this.radius * 2);
    if (this.label) {
      noStroke();
      fill(color);
      textSize(10);
      textAlign(CENTER, CENTER);
      let labelY = this.y - 22;
      if (this.labelPos === "bottom") labelY = this.y + 17;
      else if (this.labelPos === "top") labelY = this.y - 16;
      text(this.label, this.x, labelY);
    }
    pop();
  }
}

class Wire {
  constructor(from, to, type) {
    this.from = from;
    this.to = to;
    this.type = type;
    this.pulse = random(TWO_PI);
    this.hash = (from.id.length + to.id.length + from.id.charCodeAt(0) + to.id.charCodeAt(to.id.length - 1)) % 7;
  }
  key() {
    return [this.from.id, this.to.id].sort().join("::");
  }
  draw(energized = false) {
    let color = COLORS.fase;
    if (this.type === "neutro") color = COLORS.neutro;
    else if (this.type === "tierra" || this.type === "green") color = COLORS.tierra;
    
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    const dist2 = Math.sqrt(dx * dx + dy * dy) || 1;
    
    let nx = -dy / dist2;
    let ny = dx / dist2;
    if (ny < 0) { nx = -nx; ny = -ny; }
    
    let sag = dist2 * 0.12 + this.hash * 6;
    if (sag > 60) sag = 60; // Sutil y con límite máximo
    if (sag < 20) sag = 20;

    const cp1x = this.from.x + dx * 0.3 + nx * sag;
    const cp1y = this.from.y + dy * 0.3 + ny * sag;
    const cp2x = this.from.x + dx * 0.7 + nx * sag;
    const cp2y = this.from.y + dy * 0.7 + ny * sag;
    
    push();
    noFill();
    stroke(color);
    strokeCap(ROUND);
    strokeWeight(energized ? 7 + sin(frameCount * 0.15 + this.pulse) * 2 : 4);
    bezier(this.from.x, this.from.y, cp1x, cp1y, cp2x, cp2y, this.to.x, this.to.y);
    pop();
  }
  isHovered(px, py, tolerance = 14) {
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    const dist2 = Math.sqrt(dx * dx + dy * dy) || 1;
    let nx = -dy / dist2;
    let ny = dx / dist2;
    if (ny < 0) { nx = -nx; ny = -ny; }
    let sag = dist2 * 0.12 + this.hash * 6;
    if (sag > 60) sag = 60;
    if (sag < 20) sag = 20;

    const p0x = this.from.x, p0y = this.from.y;
    const p1x = p0x + dx * 0.3 + nx * sag, p1y = p0y + dy * 0.3 + ny * sag;
    const p2x = p0x + dx * 0.7 + nx * sag, p2y = p0y + dy * 0.7 + ny * sag;
    const p3x = this.to.x, p3y = this.to.y;

    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const u = 1 - t;
      const tt = t * t, uu = u * u;
      const uuu = uu * u, ttt = tt * t;
      const x = uuu * p0x + 3 * uu * t * p1x + 3 * u * tt * p2x + ttt * p3x;
      const y = uuu * p0y + 3 * uu * t * p1y + 3 * u * tt * p2y + ttt * p3y;
      if (dist(px, py, x, y) <= tolerance) {
        return true;
      }
    }
    return false;
  }
}

class Component {
  constructor(id, x, y, label, w, h) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.label = label;
    this.w = w;
    this.h = h;
    this.initialW = w;
    this.initialH = h;
    this.nodes = [];
    this.interactive = false;
    this.isolated = false;
    components.push(this);
  }
  addNode(id, dx, dy, type, label) {
    const node = new Node(id, this.x + dx, this.y + dy, type, label, this);
    node.dx = dx; node.dy = dy;
    node.initialDx = dx; node.initialDy = dy;
    node.initialRadius = node.radius;
    this.nodes.push(node);
    nodes.push(node);
    return node;
  }
  getScale() {
    const sx = this.initialW ? this.w / this.initialW : 1;
    const sy = this.initialH ? this.h / this.initialH : 1;
    return { sx, sy, s: Math.min(sx, sy) };
  }
  resize(nw, nh) {
    this.w = Math.max(48, nw);
    this.h = Math.max(36, nh);
    const { sx, sy, s } = this.getScale();
    this.nodes.forEach(n => {
      if (n.initialDx !== undefined && n.initialDy !== undefined) {
        n.dx = n.initialDx * sx;
        n.dy = n.initialDy * sy;
        n.x = this.x + n.dx;
        n.y = this.y + n.dy;
      }
      if (n.initialRadius !== undefined) {
        n.radius = Math.round(Math.max(8, Math.min(26, n.initialRadius * Math.sqrt(s))));
      }
    });
  }
  contains(x, y, pad = 0) {
    return Math.abs(x - this.x) <= (this.w / 2 + pad) && Math.abs(y - this.y) <= (this.h / 2 + pad);
  }
  internalEdges() { return []; }
  onPress() {}
  reset() { this.isolated = false; }
  isolate() { this._one = this.isolated; this.isolated = true; }
  restore() { this.isolated = this._one; }
  isolateAll() { this._all = this.isolated; this.isolated = true; }
  restoreAll() { this.isolated = this._all; }
  snapshot() { return { isolated: this.isolated }; }
  restoreSnap(state) { this.isolated = state.isolated; }
  move(nx, ny) {
    this.x = nx; this.y = ny;
    this.nodes.forEach(n => {
      n.x = this.x + n.dx;
      n.y = this.y + n.dy;
    });
  }
  
  inResizeHandle(mx, my) {
    const { s } = this.getScale();
    const hw = this.w / 2;
    const hh = this.h / 2;
    const rHit = Math.max(16, 20 * s);
    return mx > this.x + hw - rHit && mx < this.x + hw + 10 && my > this.y + hh - rHit && my < this.y + hh + 10;
  }
  
  drawBox(accent) {
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const { s } = this.getScale();
    push();
    rectMode(CENTER);
    fill(isDay ? "#ffffff" : "#252a3d");
    stroke(accent);
    strokeWeight(Math.max(1.5, 2 * s));
    rect(this.x, this.y, this.w, this.h, Math.max(6, 14 * s));
    noStroke();
    fill(isDay ? "#1e2230" : COLORS.ink);
    textAlign(CENTER, CENTER);
    textSize(Math.max(9, Math.round(13 * s)));
    text(this.label, this.x, this.y + this.h / 2 + Math.max(12, 16 * s));
    
    // Resize handle
    fill(isDay ? "#9aa5b9" : "#666666");
    const hs = Math.max(8, 12 * s);
    triangle(this.x + this.w/2, this.y + this.h/2 - hs, this.x + this.w/2, this.y + this.h/2, this.x + this.w/2 - hs, this.y + this.h/2);
    pop();
  }
}

class Key {
  constructor(host, name, node) {
    this.host = host;
    this.name = name;
    this.node = node;
    this.closed = false;
    this.isolated = false;
  }
  conducts() {
    return this.closed && !this.isolated && !this.host.isolated;
  }
  isolate() { this._one = this.isolated; this.isolated = true; }
  restore() { this.isolated = this._one; }
}

class Switch extends Component {
  constructor(id, x, y, label = "9/12") {
    super(id, x, y, label, 132, 78);
    this.interactive = true;
    this.closed = false;
    this.a = this.addNode(id + "-a", -78, 0, "switch", "entrada");
    this.b = this.addNode(id + "-b", 78, 0, "switch", "salida");
  }
  internalEdges() {
    return this.closed && !this.isolated ? [[this.a, this.b]] : [];
  }
  onPress() { this.closed = !this.closed; }
  reset() { super.reset(); this.closed = false; }
  snapshot() { return { isolated: this.isolated, closed: this.closed }; }
  restoreSnap(state) { this.isolated = state.isolated; this.closed = state.closed; }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.closed ? COLORS.green : COLORS.switch);
    push();
    stroke(this.closed ? COLORS.green : COLORS.muted);
    strokeWeight(Math.max(2, 5 * s));
    strokeCap(ROUND);
    if (this.closed) line(this.a.x, this.a.y, this.b.x, this.b.y);
    else line(this.a.x, this.a.y, this.x + 18 * sx, this.y - 24 * sy);
    pop();
  }
}


class Breaker extends Component {
  constructor(id, x, y, label = "Disyuntor") {
    super(id, x, y, label, 90, 120);
    this.interactive = true;
    this.closed = false;
    this.a = this.addNode(id + "-a", 0, -60, "switch", "entrada");
    this.b = this.addNode(id + "-b", 0, 60, "switch", "salida");
  }
  conducts() { return this.closed && !this.isolated; }
  isolate() { this._one = this.isolated; this.isolated = true; }
  restore() { this.isolated = this._one; }
  internalEdges() { return this.conducts() ? [[this.a, this.b]] : []; }
  onPress() { this.closed = !this.closed; }
  reset() { super.reset(); this.closed = false; }
  snapshot() { return { isolated: this.isolated, closed: this.closed }; }
  restoreSnap(state) { this.isolated = state.isolated; this.closed = state.closed; }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.closed ? COLORS.green : COLORS.switch);
    push();
    rectMode(CENTER);
    fill(this.closed ? COLORS.green : COLORS.muted);
    noStroke();
    rect(this.x, this.y + (this.closed ? -10 : 10) * sy, 30 * sx, 40 * sy, Math.max(2, 4 * s));
    fill("#000");
    textAlign(CENTER, CENTER);
    textSize(Math.max(8, Math.round(10 * s)));
    text(this.closed ? "ON" : "OFF", this.x, this.y + (this.closed ? -10 : 10) * sy);
    pop();
  }
}
class Push extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Pulsador", 132, 78);
    this.interactive = true;
    this.closed = false;
    this.a = this.addNode(id + "-a", -78, 0, "switch", "entrada");
    this.b = this.addNode(id + "-b", 78, 0, "switch", "salida");
  }
  internalEdges() {
    return this.closed && !this.isolated ? [[this.a, this.b]] : [];
  }
  onPress() { this.closed = true; }
  reset() { super.reset(); this.closed = false; }
  snapshot() { return { isolated: this.isolated, closed: this.closed }; }
  restoreSnap(state) { this.isolated = state.isolated; this.closed = state.closed; }
  draw() {
    const { sy, s } = this.getScale();
    this.drawBox(this.closed ? COLORS.green : COLORS.switch);
    push();
    fill(this.closed ? COLORS.green : "#171b29");
    stroke(COLORS.switch);
    strokeWeight(Math.max(1.5, 3 * s));
    circle(this.x, this.y - 4 * sy, 28 * s);
    pop();
  }
}

class Commutator extends Component {
  constructor(id, x, y, label = "9/24") {
    super(id, x, y, label, 156, 108);
    this.interactive = true;
    this.selected = "a";
    this.common = this.addNode(id + "-c", -92, 0, "switch", "común");
    this.a = this.addNode(id + "-a", 92, -30, "switch", "A");
    this.b = this.addNode(id + "-b", 92, 30, "switch", "B");
  }
  internalEdges() {
    if (this.isolated) return [];
    return [[this.common, this.selected === "a" ? this.a : this.b]];
  }
  toggle() { this.selected = this.selected === "a" ? "b" : "a"; }
  onPress() { this.toggle(); }
  reset() { super.reset(); this.selected = "a"; }
  snapshot() { return { isolated: this.isolated, selected: this.selected }; }
  restoreSnap(state) { this.isolated = state.isolated; this.selected = state.selected; }
  draw() {
    const { s } = this.getScale();
    this.drawBox(COLORS.switch);
    const target = this.selected === "a" ? this.a : this.b;
    push();
    stroke(COLORS.green);
    strokeWeight(Math.max(2, 5 * s));
    strokeCap(ROUND);
    line(this.common.x, this.common.y, target.x, target.y);
    pop();
  }
}

class Crossover extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Cruce", 156, 112);
    this.interactive = true;
    this.straight = true;
    this.a1 = this.addNode(id + "-a1", -90, -30, "switch", "A");
    this.a2 = this.addNode(id + "-a2", -90, 30, "switch", "B");
    this.b1 = this.addNode(id + "-b1", 90, -30, "switch", "A");
    this.b2 = this.addNode(id + "-b2", 90, 30, "switch", "B");
  }
  pairs() {
    return this.straight ? [[this.a1, this.b1], [this.a2, this.b2]] : [[this.a1, this.b2], [this.a2, this.b1]];
  }
  internalEdges() {
    return this.isolated ? [] : this.pairs();
  }
  toggle() { this.straight = !this.straight; }
  onPress() { this.toggle(); }
  reset() { super.reset(); this.straight = true; }
  snapshot() { return { isolated: this.isolated, straight: this.straight }; }
  restoreSnap(state) { this.isolated = state.isolated; this.straight = state.straight; }
  draw() {
    const { s } = this.getScale();
    this.drawBox(COLORS.switch);
    push();
    stroke(COLORS.green);
    strokeWeight(Math.max(2, 4 * s));
    strokeCap(ROUND);
    this.pairs().forEach(([a, b]) => line(a.x, a.y, b.x, b.y));
    pop();
  }
}

class Gang extends Component {
  constructor(id, x, y, label, outs) {
    super(id, x, y, label, 156, 48 + outs.length * 36);
    this.interactive = true;
    this.common = this.addNode(id + "-c", -96, 0, "switch", "común");
    this.keyList = outs.map((name, index) => {
      const y = (index - (outs.length - 1) / 2) * 52;
      const node = this.addNode(id + "-" + name, 96, y, "switch", "L" + name);
      return new Key(this, name, node);
    });
    this.keys = Object.fromEntries(this.keyList.map((key) => [key.name, key]));
  }
  internalEdges() {
    return this.keyList.filter((key) => key.conducts()).map((key) => [this.common, key.node]);
  }
  nearestKey(y) {
    return this.keyList.reduce((best, key) => Math.abs(y - key.node.y) < Math.abs(y - best.node.y) ? key : best);
  }
  onPress(x, y) { const key = this.nearestKey(y); key.closed = !key.closed; }
  reset() {
    super.reset();
    this.keyList.forEach((key) => { key.closed = false; key.isolated = false; });
  }
  snapshot() {
    return {
      isolated: this.isolated,
      keys: this.keyList.map((key) => ({ closed: key.closed, isolated: key.isolated })),
    };
  }
  restoreSnap(state) {
    this.isolated = state.isolated;
    this.keyList.forEach((key, index) => {
      key.closed = state.keys[index].closed;
      key.isolated = state.keys[index].isolated;
    });
  }
  draw() {
    const { sx, sy, s } = this.getScale();
    const any = this.keyList.some((key) => key.closed);
    this.drawBox(any ? COLORS.green : COLORS.switch);
    push();
    strokeWeight(Math.max(2, 4 * s));
    strokeCap(ROUND);
    this.keyList.forEach((key) => {
      stroke(key.closed ? COLORS.green : COLORS.muted);
      if (key.closed) line(this.common.x, this.common.y, key.node.x, key.node.y);
      else line(this.common.x, this.common.y, key.node.x - 28 * sx, key.node.y - 16 * sy);
    });
    pop();
  }
}

class Bipolar extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Bipolar", 164, 118);
    this.interactive = true;
    this.closed = false;
    this.poleL = true;
    this.poleN = true;
    this.fi = this.addNode(id + "-fi", -94, -32, "fase", "fase");
    this.ni = this.addNode(id + "-ni", -94, 32, "neutro", "neutro");
    this.fo = this.addNode(id + "-fo", 94, -32, "fase", "sale F");
    this.no = this.addNode(id + "-no", 94, 32, "neutro", "sale N");
  }
  internalEdges() {
    if (!this.closed || this.isolated) return [];
    const edges = [];
    if (this.poleL) edges.push([this.fi, this.fo]);
    if (this.poleN) edges.push([this.ni, this.no]);
    return edges;
  }
  onPress() { this.closed = !this.closed; }
  reset() { super.reset(); this.closed = false; this.poleL = true; this.poleN = true; }
  snapshot() {
    return { isolated: this.isolated, closed: this.closed, poleL: this.poleL, poleN: this.poleN };
  }
  restoreSnap(state) {
    this.isolated = state.isolated;
    this.closed = state.closed;
    this.poleL = state.poleL;
    this.poleN = state.poleN;
  }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.closed ? COLORS.green : COLORS.switch);
    push();
    stroke(this.closed ? COLORS.green : COLORS.muted);
    strokeWeight(Math.max(2, 5 * s));
    strokeCap(ROUND);
    if (this.closed) {
      line(this.fi.x, this.fi.y, this.fo.x, this.fo.y);
      line(this.ni.x, this.ni.y, this.no.x, this.no.y);
    } else {
      line(this.fi.x, this.fi.y, this.x - 10 * sx, this.y - 48 * sy);
      line(this.ni.x, this.ni.y, this.x - 10 * sx, this.y + 8 * sy);
    }
    pop();
  }
}

class Load extends Component {
  constructor(id, x, y, label, kind) {
    super(id, x, y, label, 124, 74);
    this.kind = kind;
    const tone = kind === "bell" ? "bell" : "carga";
    if (kind === "socket") {
      this.input = this.addNode(id + "-in", -74, 0, tone, "L");
      this.output = this.addNode(id + "-out", 74, 0, tone, "N");
      this.earth = this.addNode(id + "-pe", 0, -46, "tierra", "PE");
    } else {
      this.input = this.addNode(id + "-in", -74, 0, tone, "entrada");
      this.output = this.addNode(id + "-out", 74, 0, tone, "salida");
    }
    this.on = false;
  }
  isGrounded() {
    if (this.kind !== "socket") return true;
    if (!this.earth) return true;
    const pe1 = nodes.find((n) => n.id === "tda-bar-pe1");
    const pe2 = nodes.find((n) => n.id === "tda-bar-pe2");
    return Boolean((pe1 && reachable(pe1, this.earth)) || (pe2 && reachable(pe2, this.earth)));
  }
  draw() {
    const accent = this.kind === "bell" ? COLORS.bell : COLORS.carga;
    this.drawBox(this.on ? COLORS.green : accent);
    push();
    if (this.kind === "lamp") this.drawLamp();
    else if (this.kind === "socket") this.drawSocket();
    else this.drawBell();
    pop();
  }
  drawLamp() {
    const { sy, s } = this.getScale();
    fill(this.on ? "#fff59d" : "#42485d");
    stroke(COLORS.carga);
    strokeWeight(Math.max(1.5, 3 * s));
    circle(this.x, this.y - 2 * sy, 30 * s);
    line(this.x - 8 * s, this.y - 10 * sy, this.x + 8 * s, this.y + 6 * sy);
    line(this.x + 8 * s, this.y - 10 * sy, this.x - 8 * s, this.y + 6 * sy);
  }
  drawSocket() {
    const { sx, sy, s } = this.getScale();
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const peConnected = this.isGrounded ? this.isGrounded() : false;

    push();
    rectMode(CENTER);

    // Placa modular del enchufe (normativa chilena NCh 2029 / Pliegos RIC)
    fill(isDay ? "#f1f5f9" : "#1a1f2e");
    stroke(this.on ? COLORS.green : (isDay ? "#cbd5e1" : "#3b4256"));
    strokeWeight(Math.max(1.2, 1.8 * s));
    rect(this.x, this.y, 86 * sx, 42 * sy, 10 * s);

    // Bisel interior que aloja los 3 alvéolos
    fill(isDay ? "#ffffff" : "#111420");
    stroke(isDay ? "#e2e8f0" : "#262c3d");
    strokeWeight(1);
    rect(this.x, this.y, 64 * sx, 26 * sy, 13 * s);

    // Alvéolo izquierdo (Fase L)
    fill(this.on ? (isDay ? "#fee2e2" : "#451a1a") : (isDay ? "#e2e8f0" : "#2a3144"));
    stroke(this.on ? COLORS.fase : (isDay ? "#94a3b8" : "#4a5568"));
    strokeWeight(Math.max(1.2, 2 * s));
    circle(this.x - 18 * sx, this.y, 10 * s);

    // Alvéolo central (Tierra de Protección PE según RIC N°10)
    fill(peConnected ? (isDay ? "#dcfce7" : "#064e3b") : (isDay ? "#f1f5f9" : "#222736"));
    stroke(peConnected ? COLORS.tierra : (isDay ? "#94a3b8" : "#4a5568"));
    strokeWeight(Math.max(1.2, 2 * s));
    circle(this.x, this.y, 10 * s);

    // Alvéolo derecho (Neutro N)
    fill(this.on ? (isDay ? "#f8fafc" : "#2a3144") : (isDay ? "#e2e8f0" : "#2a3144"));
    stroke(this.on ? COLORS.neutro : (isDay ? "#94a3b8" : "#4a5568"));
    strokeWeight(Math.max(1.2, 2 * s));
    circle(this.x + 18 * sx, this.y, 10 * s);

    // Traza indicadora interna hacia el borne PE superior
    stroke(peConnected ? COLORS.tierra : (isDay ? "rgba(100,116,139,0.3)" : "rgba(148,163,184,0.2)"));
    strokeWeight(Math.max(1.5, 2 * s));
    strokeCap(ROUND);
    line(this.x, this.y - 7 * sy, this.x, this.y - 30 * sy);

    // Símbolo de tierra pequeño sobre el alvéolo central si está aterrizado
    if (peConnected) {
      stroke(COLORS.tierra);
      strokeWeight(1.2 * s);
      const ty = this.y - 12 * sy;
      line(this.x - 5 * s, ty, this.x + 5 * s, ty);
      line(this.x - 3 * s, ty + 2 * s, this.x + 3 * s, ty + 2 * s);
      line(this.x - 1 * s, ty + 4 * s, this.x + 1 * s, ty + 4 * s);
    }
    pop();
  }
  drawBell() {
    const { sy, s } = this.getScale();
    noFill();
    stroke(this.on ? COLORS.green : COLORS.bell);
    strokeWeight(Math.max(1.5, 3 * s));
    arc(this.x, this.y + 8 * sy, 32 * s, 28 * s, PI, TWO_PI);
    line(this.x - 16 * s, this.y + 8 * sy, this.x + 16 * s, this.y + 8 * sy);
    fill(this.on ? COLORS.green : COLORS.bell);
    noStroke();
    circle(this.x, this.y + 12 * sy, 5 * s);
  }
}

function rule(ref, kind, controls, name, fix) {
  return { ref, kind, controls, name, fix };
}
function lamp(id, x, y, label) { return new Load(id, x, y, label, "lamp"); }
function socket(id, x, y, label) { return new Load(id, x, y, label, "socket"); }
function bell(id, x, y, label = "Timbre") { return new Load(id, x, y, label, "bell"); }


class BoardBreaker extends Component {
  constructor(id, x, y, label = "Automático C10", rating = "10A") {
    super(id, x, y, label, 68, 76);
    this.rating = rating;
    this.interactive = true;
    this.isBoard = true;
    this.closed = true;
    this.inNode = this.addNode(id + "-in", 0, -38, "fase", "");
    this.outNode = this.addNode(id + "-out", 0, 38, "fase", "");
  }
  internalEdges() {
    return this.closed && !this.isolated ? [[this.inNode, this.outNode]] : [];
  }
  onPress() {
    this.closed = !this.closed;
  }
  reset() {
    super.reset();
    this.closed = true;
  }
  snapshot() {
    return { isolated: this.isolated, closed: this.closed };
  }
  restoreSnap(state) {
    this.isolated = state.isolated;
    this.closed = state.closed;
  }
  draw() {
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const { sx, sy, s } = this.getScale();
    push();
    rectMode(CENTER);
    fill(isDay ? "#eef2f8" : "#222738");
    stroke(isDay ? "#929db2" : "#4a536f");
    strokeWeight(Math.max(1.5, 2 * s));
    rect(this.x, this.y, this.w, this.h, Math.max(3, 6 * s));

    fill(isDay ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.3)");
    noStroke();
    rect(this.x, this.y, this.w, 8 * sy);

    fill(isDay ? "#a4b0c2" : "#363d52");
    stroke(isDay ? "#718096" : "#4a5568");
    strokeWeight(1);
    circle(this.inNode.x, this.inNode.y, 10 * s);
    circle(this.outNode.x, this.outNode.y, 10 * s);

    fill(this.closed ? COLORS.green : (isDay ? "#d32f2f" : "#ff4d5e"));
    stroke(this.closed ? "#2d6a1b" : "#6b141a");
    strokeWeight(Math.max(1, 1.5 * s));
    rect(this.x, this.y, 22 * sx, 28 * sy, Math.max(2, 4 * s));

    noStroke();
    fill("#ffffff");
    textAlign(CENTER, CENTER);
    textSize(Math.max(8, Math.round(11 * s)));
    if (typeof textStyle === "function") textStyle(BOLD);
    text(this.closed ? "I" : "O", this.x, this.y);
    if (typeof textStyle === "function") textStyle(NORMAL);

    fill(isDay ? "#475569" : "#94a3b8");
    textSize(Math.max(7, Math.round(8.5 * s)));
    text("MCB", this.x, this.y - 20 * sy);

    fill(isDay ? "#1e293b" : COLORS.ink);
    textSize(Math.max(8, Math.round(10 * s)));
    textAlign(CENTER, TOP);
    text(this.label, this.x, this.y + this.h / 2 + 14 * sy);
    pop();
  }
}

class BoardDifferential extends Component {
  constructor(id, x, y, label = "Diferencial 25A 30mA", rating = "25A / 30mA") {
    super(id, x, y, label, 114, 82);
    this.rating = rating;
    this.interactive = true;
    this.isBoard = true;
    this.closed = true;
    this.inL = this.addNode(id + "-in-l", -32, -40, "fase", "");
    this.inN = this.addNode(id + "-in-n", 32, -40, "neutro", "");
    this.outL = this.addNode(id + "-out-l", -32, 40, "fase", "");
    this.outN = this.addNode(id + "-out-n", 32, 40, "neutro", "");
  }
  internalEdges() {
    return this.closed && !this.isolated
      ? [[this.inL, this.outL], [this.inN, this.outN]]
      : [];
  }
  onPress(mx, my) {
    const { sx, s } = this.getScale();
    if (dist(mx, my, this.x + 28 * sx, this.y) < Math.max(12, 16 * s)) {
      this.closed = false;
    } else {
      this.closed = !this.closed;
    }
  }
  reset() {
    super.reset();
    this.closed = true;
  }
  snapshot() {
    return { isolated: this.isolated, closed: this.closed };
  }
  restoreSnap(state) {
    this.isolated = state.isolated;
    this.closed = state.closed;
  }
  draw() {
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const { sx, sy, s } = this.getScale();
    push();
    rectMode(CENTER);
    fill(isDay ? "#eef2f8" : "#222738");
    stroke(isDay ? "#929db2" : "#4a536f");
    strokeWeight(Math.max(1.5, 2 * s));
    rect(this.x, this.y, this.w, this.h, Math.max(3, 6 * s));

    fill(isDay ? "#a4b0c2" : "#363d52");
    stroke(isDay ? "#718096" : "#4a5568");
    strokeWeight(1);
    circle(this.inL.x, this.inL.y, 10 * s);
    circle(this.inN.x, this.inN.y, 10 * s);
    circle(this.outL.x, this.outL.y, 10 * s);
    circle(this.outN.x, this.outN.y, 10 * s);

    fill(this.closed ? COLORS.green : (isDay ? "#d32f2f" : "#ff4d5e"));
    stroke(this.closed ? "#2d6a1b" : "#6b141a");
    strokeWeight(Math.max(1, 1.5 * s));
    rect(this.x - 14 * sx, this.y, 24 * sx, 28 * sy, Math.max(2, 4 * s));

    noStroke();
    fill("#ffffff");
    textAlign(CENTER, CENTER);
    textSize(Math.max(8, Math.round(11 * s)));
    if (typeof textStyle === "function") textStyle(BOLD);
    text(this.closed ? "I" : "O", this.x - 14 * sx, this.y);
    if (typeof textStyle === "function") textStyle(NORMAL);

    stroke(isDay ? "#b45309" : "#f59e0b");
    strokeWeight(Math.max(1, 1.5 * s));
    fill(isDay ? "#fef3c7" : "#451a03");
    rect(this.x + 28 * sx, this.y, 22 * sx, 22 * sy, Math.max(3, 5 * s));
    noStroke();
    fill(isDay ? "#b45309" : "#fbbf24");
    textSize(Math.max(8, Math.round(11 * s)));
    if (typeof textStyle === "function") textStyle(BOLD);
    text("T", this.x + 28 * sx, this.y);
    if (typeof textStyle === "function") textStyle(NORMAL);

    fill(isDay ? "#475569" : "#94a3b8");
    textSize(Math.max(7, Math.round(8.5 * s)));
    text("30mA", this.x - 14 * sx, this.y - 20 * sy);

    fill(isDay ? "#1e293b" : COLORS.ink);
    textSize(Math.max(8, Math.round(10 * s)));
    textAlign(CENTER, TOP);
    text(this.label, this.x, this.y + this.h / 2 + 15 * sy);
    pop();
  }
}

class DistributionBus extends Component {
  constructor(id, x, y, type = "fase", label = "Barra Fase") {
    super(id, x, y, label, 42, 114);
    this.type = type;
    this.isBoard = true;
    const tone = type === "neutro" ? "neutro" : "fase";
    this.n1 = this.addNode(`${id}-1`, 0, -36, tone, "");
    this.n2 = this.addNode(type === "fase" ? "phase" : "neutral", 0, 0, tone, "");
    this.n3 = this.addNode(`${id}-3`, 0, 36, tone, "");
  }
  internalEdges() {
    if (this.isolated) return [];
    return [
      [this.n1, this.n2],
      [this.n2, this.n3],
      [this.n1, this.n3],
    ];
  }
  draw() {
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    const { sx, sy, s } = this.getScale();
    const copper = this.type === "neutro"
      ? (isDay ? "#94a3b8" : "#475569")
      : (isDay ? "#d97706" : "#b45309");
    const border = this.type === "neutro"
      ? (isDay ? "#64748b" : "#94a3b8")
      : (isDay ? "#b45309" : "#f59e0b");

    push();
    rectMode(CENTER);
    fill(isDay ? "#f1f5f9" : "#1e293b");
    stroke(isDay ? "#cbd5e1" : "#334155");
    strokeWeight(Math.max(1, 1.5 * s));
    rect(this.x, this.y, this.w, this.h, Math.max(3, 6 * s));

    fill(copper);
    stroke(border);
    strokeWeight(Math.max(1, 1.5 * s));
    rect(this.x, this.y, 14 * sx, Math.max(10, this.h - 14 * sy), Math.max(2, 3 * s));

    fill(isDay ? "#ffffff" : "#0f172a");
    stroke(border);
    strokeWeight(1);
    circle(this.n1.x, this.n1.y, 8 * s);
    circle(this.n2.x, this.n2.y, 8 * s);
    circle(this.n3.x, this.n3.y, 8 * s);

    noStroke();
    fill(isDay ? "#1e293b" : COLORS.ink);
    textSize(Math.max(8, Math.round(10 * s)));
    if (typeof textStyle === "function") textStyle(BOLD);
    textAlign(CENTER, typeof BOTTOM !== "undefined" ? BOTTOM : "bottom");
    text(this.label, this.x, this.y - this.h / 2 - 6 * sy);
    if (typeof textStyle === "function") textStyle(NORMAL);
    pop();
  }
}

let showWelcomeModal = true;
let dockedLoadTable = false;
let showLoadTable = true;

function calcCuadroCargas(level = activeLevel) {
  if (!level) return null;
  const rules = level.rules || [];
  
  const lamps = rules.filter(r => r.ref && (r.ref.kind === "lamp" || r.ref.kind === "bell"));
  const sockets = rules.filter(r => r.ref && r.ref.kind === "socket");
  
  const circuits = [];
  const rawTitle = level.headline.split("·")[0].trim() || "Habitación";
  const roomName = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  
  const numLamps = lamps.length > 0 ? lamps.length : (sockets.length > 0 ? 0 : 1);
  if (numLamps > 0) {
    const powerW = numLamps * 100;
    const currentA = +(powerW / 220).toFixed(2);
    circuits.push({
      id: "C-1",
      name: "Alumbrado",
      loadType: "Alumbrado",
      location: roomName,
      points: `${numLamps} centro${numLamps > 1 ? "s" : ""}`,
      powerW,
      currentA,
      breaker: "1 × 10A Curva C",
      diff: "2 × 25A 30mA",
      wire: "1.5 mm² EVA",
      conduit: "16 mm PVC",
    });
  }
  
  if (sockets.length > 0) {
    const numSockets = sockets.length;
    const powerW = numSockets * 250;
    const currentA = +(powerW / 220).toFixed(2);
    circuits.push({
      id: circuits.length === 0 ? "C-1" : "C-2",
      name: "Enchufes",
      loadType: "Enchufes",
      location: roomName,
      points: `${numSockets} toma${numSockets > 1 ? "s" : ""}`,
      powerW,
      currentA,
      breaker: "1 × 16A Curva C",
      diff: "2 × 25A 30mA",
      wire: "3 × 2.5 mm² (F+N+PE) EVA",
      conduit: "20 mm PVC",
    });
  }
  
  const totalPowerW = circuits.reduce((sum, c) => sum + c.powerW, 0);
  const demandFactor = totalPowerW > 1500 ? 0.8 : 1.0;
  const demandPowerW = Math.round(totalPowerW * demandFactor);
  const totalCurrentA = +(demandPowerW / 220).toFixed(2);
  const empalme = totalCurrentA <= 10 ? "Empalme Monofásico A-6 (10A - 2.2 kW)" : "Empalme Monofásico A-9 (16A / 25A - 3.5 a 5.5 kW)";
  
  return {
    tdaName: "CUADRO DE CARGAS · TABLERO TDA-01",
    circuits,
    totalPowerW,
    demandFactor,
    demandPowerW,
    totalCurrentA,
    empalme,
  };
}

function drawWelcomeModal() {
  if (!activeLevel) return;
  const data = calcCuadroCargas(activeLevel);
  if (!data) return;

  const isDay = document.documentElement.getAttribute("data-theme") === "day";

  push();
  // 1. Fondo atenuado (Backdrop)
  fill(0, 0, 0, isDay ? 120 : 170);
  rectMode(CORNER);
  rect(0, 0, width, height);

  // 2. Dimensiones de la ventana modal centrada
  const mw = Math.min(860, width - 40);
  const mx = Math.round((width - mw) / 2);
  const headerH = 52;
  const instrH = 142;
  const tableHeadH = 26;
  const rowH = 30;
  const rowsH = data.circuits.length * rowH;
  const totalsH = 32;
  const footerH = 58;
  const mh = headerH + instrH + 14 + tableHeadH + rowsH + totalsH + footerH + 16;
  const my = Math.max(16, Math.round((height - mh) / 2));

  // 3. Contenedor de la ventana
  fill(isDay ? "#ffffff" : "#131724");
  stroke(isDay ? "#cbd5e1" : "#2e374d");
  strokeWeight(2);
  rect(mx, my, mw, mh, 12);

  // 4. Barra de Cabecera
  fill(isDay ? "#f1f5f9" : "#1a2133");
  stroke(isDay ? "#cbd5e1" : "#2e374d");
  strokeWeight(1);
  rect(mx, my, mw, headerH, 12, 12, 0, 0);

  // Eyebrow & Título del proyecto
  noStroke();
  fill(isDay ? "#0284c7" : "#38bdf8");
  textSize(9.5);
  if (typeof textStyle === "function") textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("PROYECTO TÉCNICO DE INSTALACIÓN ELÉCTRICA · SEC RIC", mx + 20, my + 10);

  fill(isDay ? "#0f172a" : "#f8fafc");
  textSize(14);
  text(activeLevel.headline || "Instalación Eléctrica Domiciliaria", mx + 20, my + 25);
  if (typeof textStyle === "function") textStyle(NORMAL);

  // Botón [✕] en la cabecera
  const closeHover = dist(mouseX, mouseY, mx + mw - 24, my + headerH / 2) < 14;
  fill(closeHover ? (isDay ? "#ef4444" : "#dc2626") : (isDay ? "#e2e8f0" : "#252e44"));
  stroke(isDay ? "#cbd5e1" : "#3b4661");
  strokeWeight(1);
  circle(mx + mw - 24, my + headerH / 2, 24);
  fill(closeHover ? "#ffffff" : (isDay ? "#475569" : "#94a3b8"));
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  if (typeof textStyle === "function") textStyle(BOLD);
  text("✕", mx + mw - 24, my + headerH / 2);
  if (typeof textStyle === "function") textStyle(NORMAL);

  // 5. Caja de Instrucciones Generales ("Qué debes instalar, sin decir cómo")
  const instBoxX = mx + 16;
  const instBoxY = my + headerH + 10;
  const instBoxW = mw - 32;
  fill(isDay ? "#f8fafc" : "#171d2e");
  stroke(isDay ? "#e2e8f0" : "#29344d");
  strokeWeight(1);
  rect(instBoxX, instBoxY, instBoxW, instrH, 8);

  fill(isDay ? "#2563eb" : "#60a5fa");
  noStroke();
  textSize(11);
  textAlign(LEFT, TOP);
  if (typeof textStyle === "function") textStyle(BOLD);
  text("🛠️ ESPECIFICACIONES GENERALES DEL PROYECTO (QUÉ DEBES INSTALAR)", instBoxX + 14, instBoxY + 12);
  if (typeof textStyle === "function") textStyle(NORMAL);

  // Textos técnicos normativos (sin revelar la solución del cableado)
  const circLamps = data.circuits.find(c => c.name === "Alumbrado");
  const circSockets = data.circuits.find(c => c.name === "Enchufes");
  const loadParts = [];
  if (circLamps) loadParts.push(`${circLamps.points} de alumbrado (${circLamps.powerW} W) con su comando`);
  if (circSockets) loadParts.push(`${circSockets.points} de enchufe hembra (${circSockets.powerW} W) con puesta a tierra PE obligatoria`);
  const cargasText = "• Cargas requeridas: " + (loadParts.length > 0 ? loadParts.join(" y ") : "Receptores eléctricos reglamentarios") + ".";

  const breakerList = data.circuits.map(c => c.breaker).join(" / ");
  const protText = `• Protecciones TDA: Alimentar las cargas desde el Tablero TDA mediante Automático Termomagnético Curva C (${breakerList}) e Interruptor Diferencial 25A 30mA.`;

  const normText = "• Normativa RIC (SEC): Todo enchufe debe llevar tierra de protección PE continua conectada a la barra PE. Respetar polaridad Fase-Neutro.";
  const guideText = "• Instrucción: Al pulsar 'Aceptar', este Cuadro de Cargas quedará fijado a la derecha del lienzo como referencia permanente de trabajo.";

  const lines = [cargasText, protText, normText, guideText];
  textSize(10.5);
  textAlign(LEFT, TOP);
  let textCurY = instBoxY + 34;
  lines.forEach((lineText, idx) => {
    fill(idx === 3 ? (isDay ? "#1d4ed8" : "#93c5fd") : (isDay ? "#334155" : "#cbd5e1"));
    if (idx === 3 && typeof textStyle === "function") textStyle(BOLD);
    text(lineText, instBoxX + 14, textCurY, instBoxW - 28);
    if (idx === 3 && typeof textStyle === "function") textStyle(NORMAL);
    textCurY += 25;
  });

  // 6. Tabla del Cuadro de Cargas
  const tableX = instBoxX;
  const tableY = instBoxY + instrH + 12;
  const tableW = instBoxW;

  const cols = [
    { key: "id", label: "Circ.", w: 56, align: CENTER },
    { key: "location", label: "Ubicación / Recinto", w: 130, align: LEFT },
    { key: "points", label: "Puntos", w: 70, align: CENTER },
    { key: "loadType", label: "Carga", w: 80, align: LEFT },
    { key: "powerW", label: "Potencia", w: 76, align: RIGHT, fmt: v => v + " W" },
    { key: "currentA", label: "Corr. (A)", w: 68, align: RIGHT, fmt: v => v + " A" },
    { key: "breaker", label: "Disyuntor (TM)", w: 104, align: CENTER },
    { key: "diff", label: "Diferencial", w: 94, align: CENTER },
    { key: "wire", label: "Conductor", w: tableW - (56 + 130 + 70 + 80 + 76 + 68 + 104 + 94), align: CENTER },
  ];

  let colX = tableX;
  stroke(isDay ? "#cbd5e1" : "#2e374d");
  strokeWeight(1);
  fill(isDay ? "#f1f5f9" : "#1c2336");
  rect(tableX, tableY, tableW, tableHeadH);

  cols.forEach(c => {
    if (colX > tableX) line(colX, tableY, colX, tableY + tableHeadH);
    noStroke();
    fill(isDay ? "#475569" : "#94a3b8");
    textSize(9.5);
    if (typeof textStyle === "function") textStyle(BOLD);
    const tx = c.align === CENTER ? colX + c.w / 2 : (c.align === RIGHT ? colX + c.w - 8 : colX + 8);
    textAlign(c.align, CENTER);
    text(c.label, tx, tableY + tableHeadH / 2);
    if (typeof textStyle === "function") textStyle(NORMAL);
    stroke(isDay ? "#cbd5e1" : "#2e374d");
    strokeWeight(1);
    colX += c.w;
  });

  let curY = tableY + tableHeadH;
  data.circuits.forEach((circ, rIdx) => {
    colX = tableX;
    fill(rIdx % 2 === 0 ? (isDay ? "#ffffff" : "#131724") : (isDay ? "#f8fafc" : "#181d2e"));
    stroke(isDay ? "#cbd5e1" : "#2e374d");
    strokeWeight(1);
    rect(tableX, curY, tableW, rowH);

    cols.forEach(c => {
      if (colX > tableX) line(colX, curY, colX, curY + rowH);
      noStroke();
      fill(isDay ? "#0f172a" : "#f1f5f9");
      textSize(10);
      const val = c.fmt ? c.fmt(circ[c.key]) : circ[c.key];
      const tx = c.align === CENTER ? colX + c.w / 2 : (c.align === RIGHT ? colX + c.w - 8 : colX + 8);
      textAlign(c.align, CENTER);
      text(val, tx, curY + rowH / 2);
      stroke(isDay ? "#cbd5e1" : "#2e374d");
      strokeWeight(1);
      colX += c.w;
    });
    curY += rowH;
  });

  // Fila de Totales
  fill(isDay ? "#f1f5f9" : "#1c2438");
  stroke(isDay ? "#94a3b8" : "#3b82f6");
  strokeWeight(1);
  rect(tableX, curY, tableW, totalsH);

  noStroke();
  fill(isDay ? "#1e40af" : "#60a5fa");
  textSize(9.5);
  if (typeof textStyle === "function") textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text(`TOTALES: Potencia: ${data.totalPowerW} W  |  Factor Demanda: ${data.demandFactor}  |  P. Demandada: ${data.demandPowerW} W`, tableX + 10, curY + totalsH / 2);

  textAlign(RIGHT, CENTER);
  text(`Corriente: ${data.totalCurrentA} A  ·  ${data.empalme.split(" (")[0]}`, tableX + tableW - 10, curY + totalsH / 2);
  if (typeof textStyle === "function") textStyle(NORMAL);

  // 7. Botón [Aceptar] en el pie del modal
  const btnW = 200;
  const btnH = 36;
  const btnX = Math.round(mx + (mw - btnW) / 2);
  const btnY = curY + totalsH + 14;

  const btnHover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
  fill(btnHover ? "#1d4ed8" : "#2563eb");
  stroke(btnHover ? "#1e40af" : "#3b82f6");
  strokeWeight(1.5);
  rect(btnX, btnY, btnW, btnH, 8);

  fill("#ffffff");
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  if (typeof textStyle === "function") textStyle(BOLD);
  text("Aceptar", btnX + btnW / 2, btnY + btnH / 2);
  if (typeof textStyle === "function") textStyle(NORMAL);

  pop();
}

function drawDockedCuadroCargas() {
  if (!activeLevel) return;
  const data = calcCuadroCargas(activeLevel);
  if (!data) return;

  const isDay = document.documentElement.getAttribute("data-theme") === "day";

  push();
  rectMode(CORNER);

  // Coordenadas en el extremo derecho del lienzo
  const panelW = 314;
  const panelX = width - panelW - 14;
  const panelY = 32;
  const panelH = height - panelY - 32;

  // Fondo del recuadro anclado
  fill(isDay ? "#ffffff" : "#121624");
  stroke(isDay ? "#cbd5e1" : "#293247");
  strokeWeight(1.5);
  rect(panelX, panelY, panelW, panelH, 10);

  // Cabecera del panel anclado
  const headH = 42;
  fill(isDay ? "#f1f5f9" : "#192033");
  stroke(isDay ? "#cbd5e1" : "#293247");
  strokeWeight(1);
  rect(panelX, panelY, panelW, headH, 10, 10, 0, 0);

  noStroke();
  fill(isDay ? "#0f172a" : "#f8fafc");
  textSize(11.5);
  if (typeof textStyle === "function") textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("📋 CUADRO DE CARGAS", panelX + 12, panelY + 9);

  fill(isDay ? "#64748b" : "#94a3b8");
  textSize(9);
  if (typeof textStyle === "function") textStyle(NORMAL);
  text("TDA-01 · 220V · Pliego RIC N°02", panelX + 12, panelY + 25);

  // Botón [🔍 Ampliar] en la cabecera
  const ampW = 76;
  const ampH = 22;
  const ampX = panelX + panelW - ampW - 10;
  const ampY = panelY + 10;
  const ampHover = mouseX >= ampX && mouseX <= ampX + ampW && mouseY >= ampY && mouseY <= ampY + ampH;
  fill(ampHover ? (isDay ? "#e2e8f0" : "#2b3652") : (isDay ? "#f8fafc" : "#1d253b"));
  stroke(isDay ? "#cbd5e1" : "#3b4661");
  strokeWeight(1);
  rect(ampX, ampY, ampW, ampH, 5);

  noStroke();
  fill(isDay ? "#1e293b" : "#e2e8f0");
  textAlign(CENTER, CENTER);
  textSize(9.5);
  text("🔍 Ampliar", ampX + ampW / 2, ampY + ampH / 2);

  // Renderizar circuitos
  let curY = panelY + headH + 10;
  data.circuits.forEach((c) => {
    const isAlumb = c.name === "Alumbrado";
    const cardH = 146;
    fill(isDay ? "#f8fafc" : "#161b2c");
    stroke(isDay ? "#e2e8f0" : "#273147");
    strokeWeight(1);
    rect(panelX + 10, curY, panelW - 20, cardH, 6);

    // Badge circuito
    const badgeW = 96;
    const badgeH = 20;
    fill(isAlumb ? (isDay ? "#dbeafe" : "#1e3a8a") : (isDay ? "#fef3c7" : "#78350f"));
    stroke(isAlumb ? (isDay ? "#93c5fd" : "#3b82f6") : (isDay ? "#fde68a" : "#d97706"));
    strokeWeight(1);
    rect(panelX + 18, curY + 8, badgeW, badgeH, 4);

    noStroke();
    fill(isAlumb ? (isDay ? "#1e40af" : "#93c5fd") : (isDay ? "#92400e" : "#fde68a"));
    textSize(9.5);
    if (typeof textStyle === "function") textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(`${c.id} · ${c.name}`, panelX + 18 + badgeW / 2, curY + 8 + badgeH / 2);

    const rows = [
      ["Puntos / Recinto:", `${c.points} (${c.location})`],
      ["Potencia:", `${c.powerW} W (${c.currentA} A)`],
      ["Disyuntor (TM):", c.breaker],
      ["Diferencial (RCD):", c.diff],
      ["Conductor:", c.wire],
      ["Canalización:", c.conduit],
    ];

    let rowY = curY + 34;
    rows.forEach(([k, v]) => {
      noStroke();
      fill(isDay ? "#64748b" : "#8b9bb4");
      textSize(9);
      if (typeof textStyle === "function") textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      text(k, panelX + 18, rowY);

      fill(isDay ? "#0f172a" : "#f1f5f9");
      if (typeof textStyle === "function") textStyle(BOLD);
      textAlign(RIGHT, CENTER);
      text(v, panelX + panelW - 18, rowY);
      rowY += 18;
    });

    curY += cardH + 8;
  });

  // Totales y Parámetros del Tablero
  const totH = 100;
  fill(isDay ? "#f1f5f9" : "#182035");
  stroke(isDay ? "#cbd5e1" : "#2d3a58");
  strokeWeight(1);
  rect(panelX + 10, curY, panelW - 20, totH, 6);

  noStroke();
  fill(isDay ? "#1d4ed8" : "#60a5fa");
  textSize(9.5);
  if (typeof textStyle === "function") textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("PARÁMETROS GENERALES DEL TABLERO", panelX + 18, curY + 8);
  if (typeof textStyle === "function") textStyle(NORMAL);

  const totRows = [
    ["Potencia Instalada:", `${data.totalPowerW} W`],
    ["Potencia Demandada:", `${data.demandPowerW} W (FD: ${data.demandFactor})`],
    ["Corriente Nominal:", `${data.totalCurrentA} A`],
    ["Empalme Monofásico:", data.empalme.split(" (")[0]],
  ];

  let tRowY = curY + 26;
  totRows.forEach(([k, v]) => {
    fill(isDay ? "#64748b" : "#8b9bb4");
    textSize(9);
    textAlign(LEFT, CENTER);
    text(k, panelX + 18, tRowY);

    fill(isDay ? "#0f172a" : "#f1f5f9");
    if (typeof textStyle === "function") textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    text(v, panelX + panelW - 18, tRowY);
    if (typeof textStyle === "function") textStyle(NORMAL);
    tRowY += 17;
  });

  curY += totH + 10;

  // Estado del circuito y botón de avance
  const isComplete = circuitAnalysis && circuitAnalysis.complete;
  const statusBoxH = isComplete ? 68 : 46;
  fill(isComplete ? (isDay ? "#dcfce7" : "#052e16") : (isDay ? "#f8fafc" : "#161b2c"));
  stroke(isComplete ? (isDay ? "#22c55e" : "#16a34a") : (isDay ? "#e2e8f0" : "#273147"));
  strokeWeight(1.5);
  rect(panelX + 10, curY, panelW - 20, statusBoxH, 6);

  noStroke();
  fill(isComplete ? (isDay ? "#15803d" : "#4ade80") : (isDay ? "#64748b" : "#94a3b8"));
  textSize(10);
  if (typeof textStyle === "function") textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(isComplete ? "✔ INSTALACIÓN CONFORME A RIC" : "⏳ Circuito en montaje", panelX + panelW / 2, curY + 8);

  fill(isComplete ? (isDay ? "#166534" : "#86efac") : (isDay ? "#94a3b8" : "#64748b"));
  textSize(8.5);
  if (typeof textStyle === "function") textStyle(NORMAL);
  text(isComplete ? "Aislamiento y protecciones OK" : "Cablea respetando protecciones y tierra PE", panelX + panelW / 2, curY + 24);

  if (isComplete) {
    const nxtW = panelW - 36;
    const nxtH = 22;
    const nxtX = panelX + 18;
    const nxtY = curY + 38;
    const nxtHover = mouseX >= nxtX && mouseX <= nxtX + nxtW && mouseY >= nxtY && mouseY <= nxtY + nxtH;
    fill(nxtHover ? "#15803d" : "#16a34a");
    stroke(isDay ? "#166534" : "#22c55e");
    strokeWeight(1);
    rect(nxtX, nxtY, nxtW, nxtH, 4);

    fill("#ffffff");
    noStroke();
    textSize(9.5);
    if (typeof textStyle === "function") textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("Siguiente Plantilla ➔", nxtX + nxtW / 2, nxtY + nxtH / 2);
    if (typeof textStyle === "function") textStyle(NORMAL);
  }

  pop();
}

function drawCuadroCargas() {
  if (dockedLoadTable) drawDockedCuadroCargas();
  if (showWelcomeModal) drawWelcomeModal();
}

const LEVELS = [
    {
    id: "dormitorio-912",
    headline: "Dormitorio · Interruptor 9/12",
    objective: "Alimentación al Mando: Canaliza la Fase (roja) desde la barra L del TDA hacia el borne común (L) del interruptor 9/12. Retorno de Fase: Conecta el conductor de retorno desde el borne de salida (1) del 9/12 al contacto central del portalámparas. Distribución de Neutro: Lleva el Neutro (blanco o azul) desde la barra N del TDA directamente al casquillo exterior del portalámparas. Verificación de Seguridad: Cierra el automático termomagnético en el TDA y acciona el interruptor 9/12 para encender la lámpara, verificando que la fase quede cortada al abrirlo.",
    success: "La lámpara enciende al cerrar el 9/12 y la fase queda interrumpida de forma segura al abrirlo.",
    parts: "Un interruptor 9/12 y una lámpara.",
    build() {
      const sw = new Switch("sw", 400, 340);
      const load = lamp("lamp", 760, 340, "Lámpara");
      return [rule(load, "series", [sw], "la lámpara")];
    },
  },

    {
    id: "dos-luces",
    headline: "Pasillo · Dos luces en paralelo (9/12)",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne de entrada del interruptor 9/12. Retorno en Paralelo: Canaliza el retorno desde la salida del 9/12 y derívalo en paralelo hacia los contactos centrales de ambas lámparas (L1 y L2). Distribución de Neutro: Lleva el Neutro desde la barra N del TDA en derivación hacia los casquillos exteriores de las dos lámparas. Verificación: Acciona el interruptor 9/12 para energizar simultáneamente ambas luminarias a 220 V.",
    success: "Ambas lámparas encienden y apagan juntas desde el interruptor 9/12.",
    parts: "Un interruptor 9/12 y dos lámparas en paralelo.",
    build() {
      const sw = new Switch("sw", 340, 340);
      const l1 = lamp("l1", 760, 200, "Luz 1");
      const l2 = lamp("l2", 760, 490, "Luz 2");
      return [
        rule(l1, "series", [sw], "la luz 1"),
        rule(l2, "series", [sw], "la luz 2"),
      ];
    },
  },

    {
    id: "enchufe-10",
    headline: "Living · Enchufe 10 A con tierra de protección PE",
    objective: "Alimentación Permanente: Canaliza la Fase (roja) desde la barra L del TDA hacia el borne L del enchufe para suministrar 220 V continuos. Retorno de Neutro: Conecta el conductor Neutro (blanco o azul) desde la barra N del TDA directamente al borne N del tomacorriente. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor de protección verde desde la barra PE del TDA hacia el borne central PE del enchufe. Verificación de Seguridad: Comprueba que el tomacorriente cuente con 220 V entre L y N y protección a tierra PE sin fugas diferenciales.",
    success: "El enchufe 10 A quedó energizado y protegido con puesta a tierra PE según RIC N°10.",
    parts: "Un enchufe 10 A con terminal de tierra PE.",
    build() {
      const sock = socket("sock", 620, 340, "Enchufe 10 A");
      return [rule(sock, "hot", [], "el enchufe 10 A")];
    },
  },

    {
    id: "dos-enchufes",
    headline: "Muro · Dos enchufes 10 A en paralelo con tierra PE",
    objective: "Alimentación en Paralelo: Canaliza Fase y Neutro desde las barras L y N del TDA a los bornes L y N del primer enchufe, derivándolos en paralelo hacia el segundo. Tierra PE Compartida (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA al borne PE del primer enchufe y puentéalo al borne PE del segundo enchufe. Conexión Reglamentaria: Todo tomacorriente de la instalación debe contar con conductor de protección ininterrumpido. Verificación: Comprueba que ambos enchufes entreguen 220 V continuos y enlace equipotencial a tierra.",
    success: "Ambos enchufes comparten fase, neutro y tierra de protección en paralelo bajo norma RIC N°10.",
    parts: "Dos enchufes 10 A en paralelo con terminales de tierra PE.",
    build() {
      const s1 = socket("s1", 620, 200, "Enchufe 1");
      const s2 = socket("s2", 620, 490, "Enchufe 2");
      return [
        rule(s1, "hot", [], "el enchufe 1"),
        rule(s2, "hot", [], "el enchufe 2"),
      ];
    },
  },

    {
    id: "timbre",
    headline: "Acceso · Pulsador y timbre",
    objective: "Alimentación al Pulsador: Canaliza la Fase desde la barra L del TDA al borne de entrada del pulsador de acceso. Retorno de Campana: Lleva el conductor de retorno desde la salida del pulsador hacia la bobina del timbre. Cierre con Neutro: Conecta el conductor Neutro desde la barra N del TDA directamente al borne de retorno del timbre. Verificación: Presiona el pulsador momentáneamente; el timbre debe sonar y desenergizarse inmediatamente al soltarlo.",
    success: "El timbre suena únicamente mientras se mantiene presionado el pulsador.",
    parts: "Un pulsador de campana y un timbre.",
    build() {
      const btn = new Push("btn", 400, 340);
      const ring = bell("bell", 760, 340);
      return [rule(ring, "parallel", [btn], "el timbre")];
    },
  },

    {
    id: "pieza",
    headline: "Dormitorio · Circuito mixto de alumbrado 9/12 y enchufe con tierra PE",
    objective: "Circuito de Alumbrado 9/12: Alimenta el interruptor 9/12 con Fase, conecta su retorno al centro del portalámparas y cierra con Neutro al casquillo. Circuito de Enchufe 10 A: Conecta Fase y Neutro continuos desde las barras del TDA a los bornes L y N del tomacorriente. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA al borne PE del enchufe. Verificación: La lámpara debe encender solo con el interruptor y el enchufe debe mantener 220 V con tierra permanente.",
    success: "Circuito mixto completado: alumbrado conmutable y enchufe protegido con tierra PE reglamentaria.",
    parts: "Un interruptor 9/12, una lámpara y un enchufe 10 A con tierra PE.",
    build() {
      const sw = new Switch("sw", 360, 200);
      const load = lamp("lamp", 720, 200, "Lámpara");
      const sock = socket("sock", 560, 490, "Enchufe 10 A");
      return [
        rule(load, "series", [sw], "la lámpara"),
        rule(sock, "hot", [], "el enchufe"),
      ];
    },
  },

    {
    id: "basico-serie2",
    headline: "Pasillo · Dos lámparas comandadas por interruptor 9/12",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/12. Retorno en Paralelo: Canaliza el conductor de retorno desde la salida del 9/12 hacia los contactos centrales de las lámparas L1 y L2 en derivación paralela. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas lámparas. Verificación: Cierra el 9/12 para verificar que ambas lámparas encienden simultáneamente con 220 V de alimentación.",
    success: "Ambas lámparas encienden al cerrar el 9/12 y se apagan juntas al abrirlo.",
    parts: "Un interruptor 9/12 y dos lámparas en paralelo.",
    build() {

      const sw = new Switch("sw", 300, 340);
      const l1 = lamp("l1", 600, 200, "L1");
      const l2 = lamp("l2", 600, 500, "L2");
      return [
        rule(l1, "series", [sw], "L1", "El interruptor corta L1."),
        rule(l2, "series", [sw], "L2", "El interruptor corta L2.")
      ];
    }
  },

    {
    id: "basico-paralelo3",
    headline: "Comedor · Tres lámparas en paralelo con interruptor 9/12",
    objective: "Alimentación al Mando: Conecta la Fase desde la barra L del TDA al borne de entrada del interruptor 9/12. Retorno Múltiple: Conecta el conductor de retorno desde la salida del 9/12 y derívalo en paralelo a los contactos centrales de las tres lámparas (L1, L2 y L3). Neutro Compartido: Tiende el conductor Neutro desde la barra N del TDA hacia los casquillos exteriores de las tres lámparas. Verificación: Cierra el 9/12 para comprobar que las tres luminarias del comedor se encienden al mismo tiempo con brillo uniforme.",
    success: "Las tres lámparas del comedor encienden simultáneamente desde el interruptor 9/12.",
    parts: "Un interruptor 9/12 y tres lámparas en paralelo.",
    build() {

      const sw = new Switch("sw", 300, 340);
      const l1 = lamp("l1", 600, 150, "L1");
      const l2 = lamp("l2", 600, 350, "L2");
      const l3 = lamp("l3", 600, 550, "L3");
      return [
        rule(l1, "series", [sw], "L1"),
        rule(l2, "series", [sw], "L2"),
        rule(l3, "series", [sw], "L3")
      ];
    }
  },

    {
    id: "basico-timbre-doble",
    headline: "Acceso Doble · Dos pulsadores y un timbre (Función OR)",
    objective: "Alimentación en Paralelo: Conecta la Fase desde la barra L del TDA a los bornes de entrada de ambos pulsadores (P1 y P2). Retorno de Mando: Une las salidas de ambos pulsadores formando una función lógica OR y canaliza el retorno al borne de la campanilla. Retorno de Neutro: Conecta el Neutro desde la barra N del TDA directamente al borne de retorno del timbre. Verificación: Presiona individualmente P1 y luego P2 para confirmar que el timbre suena con cualquiera de los dos accesos.",
    success: "Cualquiera de los dos pulsadores hace sonar el timbre de forma independiente.",
    parts: "Dos pulsadores y un timbre.",
    build() {

      const p1 = new Push("p1", 300, 200, "P1");
      const p2 = new Push("p2", 300, 450, "P2");
      const ring = bell("ring", 600, 340, "Timbre");
      return [
        rule(ring, "parallel", [p1, p2], "el timbre")
      ];
    }
  },

    {
    id: "basico-timbres-paralelos",
    headline: "Acceso · Un pulsador y dos timbres en paralelo",
    objective: "Alimentación al Pulsador: Conecta la Fase desde la barra L del TDA al borne de entrada del pulsador. Retorno en Paralelo: Canaliza el retorno desde la salida del pulsador hacia los bornes de entrada de ambos timbres (T1 y T2). Retorno de Neutro: Tiende el Neutro desde la barra N del TDA en derivación a los bornes de retorno de ambos timbres. Verificación: Presiona el pulsador para confirmar que ambas campanillas suenan al mismo tiempo en diferentes zonas.",
    success: "El pulsador activa simultáneamente ambos timbres en paralelo.",
    parts: "Un pulsador y dos timbres en paralelo.",
    build() {

      const p1 = new Push("p1", 300, 340, "Pulsador");
      const r1 = bell("r1", 600, 200, "T1");
      const r2 = bell("r2", 600, 450, "T2");
      return [
        rule(r1, "parallel", [p1], "T1"),
        rule(r2, "parallel", [p1], "T2")
      ];
    }
  },

    {
    id: "basico-enchufe-cuad",
    headline: "Distribución · Cuatro enchufes 10 A en paralelo con tierra PE",
    objective: "Alimentación en Paralelo: Conecta Fase y Neutro desde las barras del TDA en derivación paralela hacia los bornes L y N de los cuatro tomacorrientes (s1, s2, s3 y s4). Tierra de Protección PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA interconectando los bornes PE de los cuatro enchufes. Seguridad Normativa: Toda base de enchufe debe estar protegida contra contactos indirectos mediante el conductor PE y disyuntor diferencial. Verificación: Comprueba que los cuatro enchufes entreguen 220 V con equipotencialidad a tierra.",
    success: "Los cuatro enchufes operan en paralelo con tierra de protección conforme a norma RIC N°10.",
    parts: "Cuatro enchufes 10 A con terminales de tierra PE.",
    build() {

      const s1 = socket("s1", 400, 200, "E1");
      const s2 = socket("s2", 400, 500, "E2");
      const s3 = socket("s3", 700, 200, "E3");
      const s4 = socket("s4", 700, 500, "E4");
      return [
        rule(s1, "hot", [], "E1"),
        rule(s2, "hot", [], "E2"),
        rule(s3, "hot", [], "E3"),
        rule(s4, "hot", [], "E4")
      ];
    }
  },

    {
    id: "basico-diag-912",
    headline: "Diagnóstico · Control de fase en interruptor 9/12",
    objective: "Diagnóstico de Seguridad: La fase nunca debe conectarse directo al portalámparas porque mantendría el artefacto con tensión peligrosa aun apagado. Alimentación al Mando: Canaliza la Fase desde la barra L del TDA al borne común (L) del interruptor 9/12 para interrumpir el conductor vivo. Retorno a la Carga: Conecta el retorno desde la salida del 9/12 al contacto central de la lámpara. Neutro al Casquillo: Lleva el Neutro desde la barra N del TDA directo al casquillo exterior. Verificación: Acciona el 9/12 y comprueba que la lámpara apaga completamente sin tensión residual en el portalámparas.",
    success: "El interruptor corta la fase adecuadamente y la lámpara opera bajo norma de seguridad.",
    parts: "Un interruptor 9/12 y una lámpara.",
    build() {

      const sw = new Switch("sw", 300, 340);
      const l1 = lamp("l1", 600, 340, "Luz");
      return [rule(l1, "series", [sw], "la luz")];
    }
  },

    {
    id: "basico-diag-corto",
    headline: "Diagnóstico · Cortocircuito en enchufe",
    objective: "Identificación de Falla: Un cable erróneo conecta la Fase directamente al Neutro o a la Tierra PE, disparando la protección termomagnética o diferencial. Despeje de Falla: Utiliza la herramienta Borrador para retirar la conexión en cortocircuito. Conexionado Reglamentario: Conecta Fase a L, Neutro a N y conductor verde desde la barra PE del TDA a PE según RIC N°10. Verificación: Restablece las protecciones del TDA para confirmar que el enchufe queda energizado sin disparo de sobrecorriente.",
    success: "Cortocircuito despejado exitosamente y enchufe correctamente protegido con tierra PE.",
    parts: "Un enchufe 10 A con terminal de tierra PE.",
    build() {

      const s1 = socket("s1", 500, 340, "Enchufe");
      return [rule(s1, "hot", [], "enchufe")];
    }
  },

    {
    id: "basico-extractor",
    headline: "Baño · Extractor de aire comandado por 9/12",
    objective: "Alimentación al Interruptor: Conecta la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/12. Retorno de Ventilación: Canaliza el conductor de retorno desde la salida del 9/12 hacia el borne de fase del extractor de aire. Conexión de Neutro: Lleva el Neutro desde la barra N del TDA directamente al borne neutro del extractor. Verificación: Cierra el interruptor 9/12 para activar el motor del extractor de ventilación, garantizando corte de fase en reposo.",
    success: "El extractor de aire enciende al cerrar el 9/12 y queda desenergizado al abrirlo.",
    parts: "Un interruptor 9/12 y un extractor de aire.",
    build() {

      const sw = new Switch("sw", 300, 340);
      const ext = lamp("ext", 600, 340, "Extractor"); // Usamos lamp como base
      return [rule(ext, "series", [sw], "el extractor")];
    }
  },

    {
    id: "basico-exterior",
    headline: "Patio · Luminaria exterior con interruptor 9/12",
    objective: "Alimentación al Mando: Canaliza la Fase desde la barra L del TDA al borne de entrada del interruptor 9/12. Retorno de Iluminación: Conecta el retorno desde la salida del 9/12 hacia el contacto central del portalámparas exterior. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA al casquillo exterior de la lámpara. Verificación: Cierra el interruptor 9/12 para energizar la luminaria del patio con corte seguro de fase en la maniobra.",
    success: "La luminaria exterior ilumina con seguridad normativa al accionar el interruptor 9/12.",
    parts: "Un interruptor 9/12 y una luminaria exterior.",
    build() {

      const sw = new Switch("sw", 300, 340, "Interior");
      const l1 = lamp("l1", 700, 340, "Exterior");
      return [rule(l1, "series", [sw], "exterior")];
    }
  },

    {
    id: "basico-pasillo-corto",
    headline: "Pasillo Corto · Dos lámparas comandadas por 9/12",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/12. Retorno en Derivación: Lleva el conductor de retorno desde la salida del interruptor hacia los contactos centrales de ambas lámparas. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas luminarias. Verificación: Cierra el interruptor para verificar la iluminación uniforme en todo el pasillo.",
    success: "Ambas luminarias del pasillo encienden simultáneamente desde el interruptor 9/12.",
    parts: "Un interruptor 9/12 y dos lámparas en paralelo.",
    build() {

      const sw = new Switch("sw", 300, 340);
      const l1 = lamp("l1", 600, 200, "L1");
      const l2 = lamp("l2", 600, 450, "L2");
      return [rule(l1, "series", [sw], "L1"), rule(l2, "series", [sw], "L2")];
    }
  },

    {
    id: "dormitorio-915",
    headline: "Dormitorio · Doble efecto 9/15",
    objective: "Alimentación Común: Canaliza la Fase desde la barra L del TDA hacia el borne común de entrada del interruptor doble 9/15. Retorno Efecto 1: Conecta la salida de la Tecla 1 al contacto central de la primera lámpara (L1). Retorno Efecto 2: Conecta la salida de la Tecla 2 al contacto central de la segunda lámpara (L2). Distribución de Neutro: Lleva el Neutro desde la barra N del TDA hacia los casquillos exteriores de ambas lámparas. Verificación: Acciona cada tecla de manera independiente para comprobar el control fraccionado del alumbrado.",
    success: "Cada tecla del 9/15 comanda su respectiva lámpara con total independencia.",
    parts: "Un interruptor doble 9/15 y dos lámparas.",
    build() {
      const dbl = new Gang("dbl", 320, 340, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 760, 200, "Centro");
      const l2 = lamp("l2", 760, 490, "Velador");
      return [
        rule(l1, "series", [dbl.keys["1"]], "el centro", "La tecla L1 es la que corta el centro."),
        rule(l2, "series", [dbl.keys["2"]], "el velador", "La tecla L2 es la que corta el velador."),
      ];
    },
  },

    {
    id: "living-932",
    headline: "Living · Triple efecto 9/32",
    objective: "Alimentación Común: Conecta la Fase desde la barra L del TDA al borne común de entrada de las tres teclas del interruptor 9/32. Retornos Individuales: Conecta la salida de la Tecla 1 a L1, la Tecla 2 a L2 y la Tecla 3 a L3 hacia sus contactos centrales. Distribución de Neutro: Tiende el Neutro desde la barra N del TDA en derivación hacia los casquillos exteriores de las tres lámparas. Verificación: Acciona las tres teclas para verificar el encendido individual y combinado de las luminarias.",
    success: "Las tres lámparas del living se controlan independientemente desde las tres teclas del interruptor 9/32.",
    parts: "Un interruptor triple 9/32 y tres lámparas.",
    build() {
      const tri = new Gang("tri", 300, 340, "9/32", ["1", "2", "3"]);
      const l1 = lamp("l1", 760, 140, "L1");
      const l2 = lamp("l2", 760, 340, "L2");
      const l3 = lamp("l3", 760, 540, "L3");
      return [
        rule(l1, "series", [tri.keys["1"]], "L1", "L1 depende de la tecla L1."),
        rule(l2, "series", [tri.keys["2"]], "L2", "L2 depende de la tecla L2."),
        rule(l3, "series", [tri.keys["3"]], "L3", "L3 depende de la tecla L3."),
      ];
    },
  },

    {
    id: "bano-bipolar",
    headline: "Baño · Iluminación con interruptor bipolar",
    objective: "Corte Omnipolar de Seguridad: En recintos húmedos, el corte bipolar interrumpe simultáneamente Fase y Neutro para máxima protección. Alimentación al Bipolar: Conecta la Fase al borne Fi y el Neutro al borne Ni del interruptor bipolar desde las barras del TDA. Salida hacia la Carga: Conecta la Fase protegida desde Fo al contacto central de la lámpara y el Neutro protegido desde No a su casquillo. Verificación: Acciona el interruptor bipolar para comprobar que ambos polos se conectan y desconectan al unísono.",
    success: "La lámpara enciende al cerrar el interruptor bipolar y ambos polos quedan aislados al abrirlo.",
    parts: "Un interruptor bipolar (corte omnipolar) y una lámpara.",
    build() {
      const bip = new Bipolar("bip", 400, 340);
      const load = lamp("lamp", 780, 340, "Lámpara");
      return [rule(load, "bipolar", [bip], "la lámpara")];
    },
  },

    {
    id: "lavadora",
    headline: "Lavadero · Enchufe de fuerza 16 A con corte bipolar y tierra PE",
    objective: "Alimentación al Corte Bipolar: Conecta Fase y Neutro desde el TDA a las entradas Fi y Ni del interruptor bipolar. Salida hacia Enchufe de Fuerza: Conecta las salidas Fo y No del bipolar a los bornes L y N del enchufe de 16 A. Puesta a Tierra Ininterrumpida (RIC N°10): Conecta el conductor verde directo desde la barra PE del TDA al borne PE del enchufe sin pasar por el interruptor. Verificación: Acciona el bipolar para comprobar la desenergización total del tomacorriente manteniendo el enlace a tierra permanente.",
    success: "El enchufe 16 A cuenta con corte bipolar omnipolar y conexión continua de tierra PE según norma RIC.",
    parts: "Un interruptor bipolar y un enchufe 16 A con terminal de tierra PE.",
    build() {
      const bip = new Bipolar("bip", 400, 340);
      const sock = socket("sock", 790, 340, "Enchufe 16 A");
      return [rule(sock, "bipolar", [bip], "el enchufe 16 A")];
    },
  },

    {
    id: "dos-pulsadores",
    headline: "Acceso · Dos pulsadores en paralelo y un timbre",
    objective: "Alimentación en Paralelo: Conecta la Fase desde la barra L del TDA hacia el borne de entrada de ambos pulsadores (b1 y b2). Retorno de Mando: Une las salidas de ambos pulsadores y canaliza el conductor de retorno hacia la campanilla. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA directamente al borne de retorno del timbre. Verificación: Presiona b1 y luego b2; cualquiera de los dos pulsadores debe accionar el timbre de forma independiente.",
    success: "Cualquiera de los dos pulsadores hace sonar el timbre y el circuito se interrumpe al soltarlos.",
    parts: "Dos pulsadores en paralelo y un timbre.",
    build() {
      const b1 = new Push("b1", 360, 200);
      const b2 = new Push("b2", 360, 490);
      b1.label = "Calle";
      b2.label = "Cocina";
      const ring = bell("bell", 760, 340);
      return [rule(ring, "parallel", [b1, b2], "el timbre")];
    },
  },

    {
    id: "dos-timbres",
    headline: "Casa · Un pulsador y dos timbres en paralelo",
    objective: "Alimentación al Pulsador: Conecta la Fase desde la barra L del TDA al borne de entrada del pulsador de acceso. Retorno en Paralelo: Canaliza el conductor de retorno desde la salida del pulsador hacia los bornes de entrada de ambos timbres (Campanilla 1 y Campanilla 2). Neutro Compartido: Tiende el Neutro desde la barra N del TDA a los bornes de retorno de las dos campanillas. Verificación: Presiona el pulsador para confirmar que ambas campanillas suenan al unísono en diferentes áreas de la vivienda.",
    success: "El pulsador activa simultáneamente ambas campanillas en paralelo.",
    parts: "Un pulsador y dos timbres en paralelo.",
    build() {
      const btn = new Push("btn", 360, 340);
      const bell1 = bell("bell1", 780, 200, "Interior");
      const bell2 = bell("bell2", 780, 490, "Exterior");
      return [
        rule(bell1, "parallel", [btn], "el timbre interior"),
        rule(bell2, "parallel", [btn], "el timbre exterior"),
      ];
    },
  },

    {
    id: "luz-enchufes",
    headline: "Estar · Alumbrado 9/12 y dos enchufes con tierra PE",
    objective: "Alumbrado 9/12: Alimenta el 9/12 con Fase, canaliza su retorno a la lámpara y cierra con Neutro al casquillo. Enchufes en Paralelo: Alimenta los bornes L y N de ambos tomacorrientes continuo desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes. Verificación: Comprueba el encendido de la lámpara mediante el 9/12 y la presencia permanente de 220 V con tierra en los dos enchufes.",
    success: "Alumbrado 9/12 y tomas de enchufe con tierra PE operando conforme a norma RIC N°10.",
    parts: "Un interruptor 9/12, una lámpara y dos enchufes 10 A con tierra PE.",
    build() {
      const sw = new Switch("sw", 300, 200);
      const load = lamp("lamp", 620, 200, "Lámpara");
      const s1 = socket("s1", 460, 490, "Enchufe 1");
      const s2 = socket("s2", 780, 490, "Enchufe 2");
      return [
        rule(load, "series", [sw], "la lámpara"),
        rule(s1, "hot", [], "el enchufe 1"),
        rule(s2, "hot", [], "el enchufe 2"),
      ];
    },
  },

    {
    id: "luces-enchufe",
    headline: "Living · Dos lámparas en paralelo y un enchufe con tierra PE",
    objective: "Alumbrado en Paralelo: Alimenta el 9/12 con Fase, conecta su retorno en paralelo a los centros de ambas lámparas y cierra con Neutro a los casquillos. Enchufe Independiente: Alimenta los bornes L y N del enchufe directo desde las barras de fase y neutro del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA hacia el borne de protección PE del enchufe. Verificación: Acciona el interruptor para encender las dos luces juntas mientras el enchufe permanece energizado y protegido.",
    success: "Las dos lámparas encienden juntas con el 9/12 y el enchufe mantiene 220 V con tierra PE reglamentaria.",
    parts: "Un interruptor 9/12, dos lámparas y un enchufe 10 A con tierra PE.",
    build() {
      const sw = new Switch("sw", 280, 200);
      const l1 = lamp("l1", 540, 200, "Centro");
      const l2 = lamp("l2", 820, 200, "Velador");
      const sock = socket("sock", 620, 490, "Enchufe 10 A");
      return [
        rule(l1, "series", [sw], "el centro"),
        rule(l2, "series", [sw], "el velador"),
        rule(sock, "hot", [], "el enchufe"),
      ];
    },
  },

    {
    id: "medio-915-tres",
    headline: "Living · Doble efecto 9/15 con tres lámparas",
    objective: "Alimentación al 9/15: Conecta la Fase desde la barra L del TDA al borne común de entrada de ambas teclas del interruptor 9/15. Retorno Efecto 1: Canaliza el retorno desde la tecla 1 hacia el contacto central de la lámpara L1. Retorno Efecto 2 en Paralelo: Lleva el retorno desde la tecla 2 y derívalo en paralelo hacia los contactos centrales de las lámparas L2 y L3. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de las tres lámparas. Verificación: Comprueba que la tecla 1 controla L1 y la tecla 2 enciende L2 y L3 simultáneamente.",
    success: "Control doble efecto 9/15 operativo: tecla 1 enciende L1 y tecla 2 comanda L2 y L3.",
    parts: "Un interruptor 9/15 y tres lámparas.",
    build() {

      const dbl = new Gang("dbl", 300, 340, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 600, 150, "L1");
      const l2 = lamp("l2", 600, 350, "L2");
      const l3 = lamp("l3", 600, 550, "L3");
      return [
        rule(l1, "series", [dbl.keys["1"]], "L1"),
        rule(l2, "series", [dbl.keys["2"]], "L2"),
        rule(l3, "series", [dbl.keys["2"]], "L3")
      ];
    }
  },

    {
    id: "medio-915-ext",
    headline: "Baño · Luz y extractor con interruptor 9/15",
    objective: "Alimentación al 9/15: Canaliza la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/15. Retorno de Alumbrado: Conecta el retorno de la tecla 1 al contacto central del portalámparas. Retorno de Ventilación: Conecta el retorno de la tecla 2 al borne de fase del extractor de aire. Distribución de Neutro: Lleva el Neutro desde la barra N del TDA en derivación a la lámpara y al extractor. Verificación: Acciona cada tecla por separado para operar la iluminación y la extracción de aire independientemente.",
    success: "La tecla 1 controla la iluminación y la tecla 2 activa la extracción de aire por separado.",
    parts: "Un interruptor 9/15, una lámpara y un extractor de aire.",
    build() {

      const dbl = new Gang("dbl", 300, 340, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 600, 200, "Luz");
      const ext = lamp("ext", 600, 450, "Extractor");
      return [
        rule(l1, "series", [dbl.keys["1"]], "Luz"),
        rule(ext, "series", [dbl.keys["2"]], "Extractor")
      ];
    }
  },

    {
    id: "medio-932-parcial",
    headline: "Sala · Interruptor 9/32 con tecla de reserva",
    objective: "Alimentación al 9/32: Conecta la Fase desde la barra L del TDA al borne común de entrada de las tres teclas del interruptor 9/32. Retorno Efecto 1: Conecta la salida de la tecla 1 al contacto central de la lámpara L1. Reserva Técnica: La tecla 2 se deja sin conexión como reserva técnica para una futura ampliación, sin carga residual. Retorno Efecto 3: Conecta la salida de la tecla 3 al contacto central de la lámpara L2. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de L1 y L2. Verificación: Acciona las teclas 1 y 3 para confirmar el encendido independiente de cada lámpara.",
    success: "L1 y L2 se comandan de forma independiente con las teclas 1 y 3; la tecla 2 queda disponible para ampliación.",
    parts: "Un interruptor triple 9/32 y dos lámparas (tecla 2 de reserva).",
    build() {

      const tri = new Gang("tri", 300, 340, "9/32", ["1", "2", "3"]);
      const l1 = lamp("l1", 600, 200, "L1");
      const l2 = lamp("l2", 600, 450, "L2");
      return [
        rule(l1, "series", [tri.keys["1"]], "L1"),
        rule(l2, "series", [tri.keys["3"]], "L2")
      ];
    }
  },

    {
    id: "medio-logia",
    headline: "Logia · Enchufes de lavandería con tierra PE",
    objective: "Alumbrado de Logia: Alimenta el interruptor 9/12 con Fase, canaliza su retorno a la lámpara l1 y cierra con Neutro. Fuerza de Lavandería: Alimenta en paralelo los bornes L y N de ambos enchufes (Lavadora y Secadora) desde las barras del TDA. Puesta a Tierra Obligatoria (RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes para prevenir electrocución en zonas húmedas. Verificación: Comprueba el funcionamiento de la luz y la entrega constante de 220 V con enlace a tierra en los dos enchufes.",
    success: "Circuito de logia completado: iluminación funcional y tomas de fuerza protegidas bajo norma RIC N°10.",
    parts: "Un interruptor 9/12, una lámpara y dos enchufes 16 A con tierra PE.",
    build() {

      const sw = new Switch("sw", 300, 150);
      const l1 = lamp("l1", 600, 150, "Luz");
      const s1 = socket("s1", 450, 450, "Lavadora");
      const s2 = socket("s2", 750, 450, "Secadora");
      return [
        rule(l1, "series", [sw], "Luz"),
        rule(s1, "hot", [], "Lavadora"),
        rule(s2, "hot", [], "Secadora")
      ];
    }
  },

    {
    id: "medio-cocina",
    headline: "Cocina · Enchufes de mesón y electrodomésticos con tierra PE",
    objective: "Alumbrado de Cocina: Alimenta el 9/12 desde la barra L del TDA, conecta su retorno a la lámpara l1 y cierra con Neutro al casquillo. Enchufes de Mesón en Paralelo: Canaliza Fase y Neutro continuos en paralelo hacia los tres enchufes (s1, s2 y s3). Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de los tres enchufes sin excepción. Verificación: La lámpara opera con el interruptor y los tres enchufes de mesón disponen de 220 V y enlace equipotencial a tierra.",
    success: "Cocina cableada según RIC N°10: alumbrado independiente y tomas de mesón con tierra de protección PE.",
    parts: "Un interruptor 9/12, una lámpara y tres enchufes con tierra PE.",
    build() {

      const sw = new Switch("sw", 250, 150);
      const l1 = lamp("l1", 500, 150, "Luz");
      const s1 = socket("s1", 250, 450, "Refrigerador");
      const s2 = socket("s2", 550, 450, "Hervidor");
      const s3 = socket("s3", 850, 450, "Horno");
      return [
        rule(l1, "series", [sw], "Luz"),
        rule(s1, "hot", [], "Refri"),
        rule(s2, "hot", [], "Hervidor"),
        rule(s3, "hot", [], "Horno")
      ];
    }
  },

    {
    id: "medio-diag-915",
    headline: "Diagnóstico · Conexión cruzada en interruptor 9/15",
    objective: "Diagnóstico de Circuitos Dobles: En un interruptor 9/15, las teclas no deben interferir entre sí; cada una debe gobernar su propia carga. Alimentación Común: Lleva la Fase desde la barra L del TDA a los bornes comunes de entrada de las teclas 1 y 2. Retornos Separados: Conecta la salida 1 directo a L1 y la salida 2 directo a L2 sin puentear las salidas. Neutro a Portalámparas: Canaliza el Neutro desde la barra N del TDA a los casquillos exteriores de L1 y L2. Verificación: Enciende y apaga cada tecla confirmando que no existe dependencia cruzada entre las luminarias.",
    success: "Cada tecla del 9/15 gobierna su respectiva lámpara con total independencia.",
    parts: "Un interruptor doble 9/15 y dos lámparas.",
    build() {

      const dbl = new Gang("dbl", 300, 340, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 600, 200, "L1");
      const l2 = lamp("l2", 600, 450, "L2");
      return [rule(l1, "series", [dbl.keys["1"]], "L1"), rule(l2, "series", [dbl.keys["2"]], "L2")];
    }
  },

    {
    id: "medio-932-ext",
    headline: "Jardín · Triple efecto 9/32 en tres zonas",
    objective: "Alimentación al 9/32: Conecta la Fase desde la barra L del TDA al borne común de entrada de las tres teclas del interruptor 9/32. Retorno Zona 1: Canaliza la salida de la tecla 1 hacia el contacto central del foco F1. Retorno Zona 2: Canaliza la salida de la tecla 2 hacia el contacto central del foco F2. Retorno Zona 3: Canaliza la salida de la tecla 3 hacia el contacto central del foco F3. Neutro en Derivación: Tiende el Neutro desde la barra N del TDA en derivación a los casquillos de los tres focos. Verificación: Enciende cada una de las tres teclas para corroborar el control fraccionado por zonas.",
    success: "Las tres zonas de iluminación exterior se controlan individualmente mediante las tres teclas del 9/32.",
    parts: "Un interruptor triple 9/32 y tres reflectores.",
    build() {

      const tri = new Gang("tri", 300, 340, "9/32", ["1", "2", "3"]);
      const l1 = lamp("l1", 700, 150, "Foco 1");
      const l2 = lamp("l2", 700, 350, "Foco 2");
      const l3 = lamp("l3", 700, 550, "Foco 3");
      return [
        rule(l1, "series", [tri.keys["1"]], "F1"),
        rule(l2, "series", [tri.keys["2"]], "F2"),
        rule(l3, "series", [tri.keys["3"]], "F3")
      ];
    }
  },

    {
    id: "medio-dos-915",
    headline: "Habitaciones · Dos interruptores 9/15 (Cuatro circuitos)",
    objective: "Alimentación a Módulos: Canaliza la Fase desde la barra L del TDA hacia los bornes comunes de ambos interruptores 9/15 (A y B). Retornos Módulo A: Conecta la salida 1 de 9/15 A a la lámpara A1 y la salida 2 a la lámpara A2. Retornos Módulo B: Conecta la salida 1 de 9/15 B a la lámpara B1 y la salida 2 a la lámpara B2. Neutro General: Distribuye el Neutro desde la barra N del TDA hacia los casquillos exteriores de las cuatro lámparas. Verificación: Comprueba el funcionamiento independiente de los cuatro efectos de alumbrado.",
    success: "Los dos interruptores 9/15 comandan sus cuatro efectos de iluminación con total independencia.",
    parts: "Dos interruptores 9/15 y cuatro lámparas.",
    build() {

      const d1 = new Gang("d1", 280, 200, "9/15 A", ["1", "2"]);
      const d2 = new Gang("d2", 280, 500, "9/15 B", ["1", "2"]);
      const l1 = lamp("l1", 600, 100, "A1");
      const l2 = lamp("l2", 600, 250, "A2");
      const l3 = lamp("l3", 600, 400, "B1");
      const l4 = lamp("l4", 600, 550, "B2");
      return [
        rule(l1, "series", [d1.keys["1"]], "A1"), rule(l2, "series", [d1.keys["2"]], "A2"),
        rule(l3, "series", [d2.keys["1"]], "B1"), rule(l4, "series", [d2.keys["2"]], "B2")
      ];
    }
  },

    {
    id: "medio-falso-cont",
    headline: "Diagnóstico · Continuidad de neutro en 9/15",
    objective: "Diagnóstico de Neutro: Si el conductor neutro no llega a un portalámparas, la lámpara no encenderá aunque reciba fase a través del retorno. Alimentación 9/15: Conecta la Fase desde la barra L del TDA al común del 9/15 y sus retornos a L1 y L2. Continuidad de Neutro: Asegura que el conductor Neutro desde la barra N del TDA alcance los casquillos de ambas lámparas (L1 y L2). Verificación: Acciona ambas teclas del interruptor para verificar que ambas lámparas encienden a pleno brillo.",
    success: "Neutro restablecido correctamente: ambas lámparas del 9/15 encienden con normalidad.",
    parts: "Un interruptor 9/15 y dos lámparas.",
    build() {

      const dbl = new Gang("dbl", 300, 340, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 600, 200, "L1");
      const l2 = lamp("l2", 600, 450, "L2");
      return [rule(l1, "series", [dbl.keys["1"]], "L1"), rule(l2, "series", [dbl.keys["2"]], "L2")];
    }
  },

    {
    id: "medio-mixto-bano",
    headline: "Baño · Circuito mixto con 9/15 y enchufe con tierra PE",
    objective: "Alumbrado 9/15: Alimenta el común del 9/15 con Fase, conecta el retorno 1 a la luz principal l1, el retorno 2 al foco auxiliar l2 y cierra con Neutro. Enchufe en Zona Húmeda: Alimenta L y N del enchufe de afeitadora desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA al borne PE del tomacorriente para evitar riesgos de electrocución. Verificación: Comprueba el control independiente de las dos luces y la energización segura del tomacorriente.",
    success: "Baño completado bajo norma RIC N°10: doble efecto 9/15 y tomacorriente protegido con tierra PE.",
    parts: "Un interruptor 9/15, dos lámparas y un enchufe con tierra PE.",
    build() {

      const dbl = new Gang("dbl", 280, 250, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 600, 150, "Techo");
      const l2 = lamp("l2", 600, 350, "Espejo");
      const s1 = socket("s1", 600, 550, "Enchufe");
      return [rule(l1, "series", [dbl.keys["1"]], "Techo"), rule(l2, "series", [dbl.keys["2"]], "Espejo"), rule(s1, "hot", [], "Enchufe")];
    }
  },

    {
    id: "medio-sensor",
    headline: "Exterior · Iluminación con interruptor sensor",
    objective: "Alimentación de Control: Canaliza la Fase desde la barra L del TDA al borne de entrada del sensor/interruptor. Retorno de Carga: Conecta el conductor de retorno desde la salida del mando hacia el contacto central del foco exterior. Conexión de Neutro: Lleva el Neutro desde la barra N del TDA directamente al casquillo exterior del proyector. Verificación: Acciona el mando para energizar el foco y verificar la correcta conmutación del circuito exterior.",
    success: "El proyector exterior enciende y apaga mediante el mando con corte seguro de fase.",
    parts: "Un interruptor de control (sensor) y un proyector exterior.",
    build() {

      const sw = new Switch("sw", 300, 340, "Sensor");
      const l1 = lamp("l1", 600, 340, "Foco");
      return [rule(l1, "series", [sw], "Foco")];
    }
  },

    {
    id: "medio-garaje",
    headline: "Garaje · Iluminación 9/12 y enchufes para herramientas",
    objective: "Alumbrado 9/12: Alimenta el interruptor 9/12 con Fase, conecta su retorno a la lámpara l1 y cierra con Neutro al casquillo. Enchufes de Fuerza para Taller: Conecta Fase y Neutro en paralelo hacia los tomacorrientes s1 y s2 desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes para la puesta a tierra de herramientas. Verificación: Comprueba el encendido de la luminaria y la entrega de 220 V con tierra permanente en las tomas.",
    success: "Garaje operativo conforme a RIC N°10 con iluminación y enchufes protegidos con tierra PE.",
    parts: "Un interruptor 9/12, una lámpara y dos enchufes con tierra PE.",
    build() {

      const sw = new Switch("sw", 250, 200, "Luz");
      const l1 = lamp("l1", 550, 200, "Tubo");
      const s1 = socket("s1", 250, 450, "Mesa 1");
      const s2 = socket("s2", 550, 450, "Mesa 2");
      return [rule(l1, "series", [sw], "Tubo"), rule(s1, "hot", [], "M1"), rule(s2, "hot", [], "M2")];
    }
  },

    {
    id: "medio-escalera-simple",
    headline: "Escalera Simple · Conmutación 9/24 entre dos pisos",
    objective: "Alimentación Primer Piso: Conecta la Fase desde la barra L del TDA al borne común (C) del conmutador 9/24 sw1. Puentes Viajeros entre Pisos: Tiende dos conductores viajeros entre los bornes laterales (L1 y L2) de sw1 y los bornes laterales de sw2 en el segundo piso. Retorno al Centro de Carga: Conecta el conductor de retorno desde el común de sw2 hacia el contacto central de la lámpara. Cierre con Neutro: Conecta el Neutro desde la barra N del TDA al casquillo exterior de la lámpara. Verificación: Conmuta cualquiera de los dos interruptores para confirmar el control de la luz desde ambos pisos.",
    success: "La lámpara de escala conmuta de manera independiente desde cualquiera de los dos pisos.",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    build() {

      const s1 = new Commutator("sw1", 300, 200, "Piso 1");
      const s2 = new Commutator("sw2", 300, 500, "Piso 2");
      const l1 = lamp("l1", 700, 340, "Luz");
      return [rule(l1, "series", [s1, s2], "Luz")];
    }
  },

    {
    id: "medio-repaso",
    headline: "Repaso General · Combinación de 9/12 y 9/15",
    objective: "Alimentación a Mandos: Lleva la Fase desde la barra L del TDA al común del interruptor 9/12 y a los comunes del interruptor 9/15. Retorno 9/12: Conecta la salida del 9/12 hacia el contacto central de la lámpara L1. Retornos 9/15: Conecta la salida 1 del 9/15 a L2 y la salida 2 del 9/15 a L3. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de las tres lámparas. Verificación: Comprueba que el 9/12 gobierna L1 de forma exclusiva y el 9/15 controla L2 y L3 en doble efecto.",
    success: "Circuito mixto de alumbrado validado: 9/12 controla L1 y 9/15 comanda L2 y L3 de forma independiente.",
    parts: "Un interruptor 9/12, un interruptor doble 9/15 y tres lámparas.",
    build() {

      const sw = new Switch("sw", 280, 200);
      const dbl = new Gang("dbl", 280, 450, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 550, 150, "L1");
      const l2 = lamp("l2", 550, 350, "L2");
      const l3 = lamp("l3", 550, 550, "L3");
      return [rule(l1, "series", [sw], "L1"), rule(l2, "series", [dbl.keys["1"]], "L2"), rule(l3, "series", [dbl.keys["2"]], "L3")];
    }
  },

    {
    id: "escalera-924",
    headline: "Escalera · Circuito de conmutación 9/24",
    objective: "Alimentación Primer 9/24: Conecta la Fase desde la barra L del TDA al borne común (C) del primer conmutador 9/24. Puentes Viajeros: Tiende dos conductores viajeros entre los bornes laterales (A y B) del primer 9/24 y los bornes laterales (A y B) del segundo 9/24. Retorno a la Carga: Conecta el conductor de retorno desde el borne común (C) del segundo 9/24 hacia el contacto central de la lámpara. Neutro al Portalámparas: Canaliza el Neutro desde la barra N del TDA directamente al casquillo de la lámpara. Verificación: Alterna las palancas de ambos conmutadores para confirmar el encendido y apagado de la lámpara desde ambos extremos de la escalera.",
    success: "La lámpara de escala conmuta de manera alternada desde cualquiera de los dos conmutadores 9/24.",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    fix: "La lámpara tiene que apagarse al cambiar cualquiera de los dos 9/24. Revisa los puentes A y B.",
    build() {
      const s1 = new Commutator("s1", 300, 340, "9/24 · 1");
      const s2 = new Commutator("s2", 580, 340, "9/24 · 2");
      const load = lamp("lamp", 860, 340, "Lámpara");
      return [rule(load, "series", [s1, s2], "la lámpara", this.fix)];
    },
  },

    {
    id: "pasillo-924",
    headline: "Pasillo · Conmutada 9/24 con dos lámparas en paralelo",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común del primer conmutador 9/24. Puentes Viajeros: Tiende los dos conductores viajeros entre los bornes laterales de ambos conmutadores 9/24. Retorno en Paralelo: Canaliza el conductor de retorno desde el común del segundo 9/24 hacia los contactos centrales de ambas lámparas. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas luminarias. Verificación: Alterna cualquiera de los dos interruptores para probar el paso de tensión y la conmutación simultánea de las dos luces.",
    success: "Las dos luces del pasillo conmutan simultáneamente desde cualquiera de los dos extremos.",
    parts: "Dos conmutadores 9/24 y dos lámparas en paralelo.",
    fix: "Las dos lámparas conmutan juntas. Cada 9/24 tiene que poder apagarlas.",
    build() {
      const s1 = new Commutator("s1", 280, 340, "9/24 · 1");
      const s2 = new Commutator("s2", 540, 340, "9/24 · 2");
      const l1 = lamp("l1", 840, 200, "Luz 1");
      const l2 = lamp("l2", 840, 490, "Luz 2");
      const fix = this.fix;
      return [
        rule(l1, "series", [s1, s2], "la luz 1", fix),
        rule(l2, "series", [s1, s2], "la luz 2", fix),
      ];
    },
  },

    {
    id: "tres-accesos",
    headline: "Tres Accesos · Conmutación con 9/24 e interruptor de cruce",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común del primer conmutador 9/24. Primer Tramo de Viajeros: Conecta los bornes laterales del primer 9/24 hacia los bornes de entrada del interruptor de cruce. Segundo Tramo de Viajeros: Conecta los bornes de salida del interruptor de cruce hacia los bornes laterales del segundo 9/24. Retorno y Neutro: Conecta el retorno desde el común del segundo 9/24 al centro de la lámpara y cierra con Neutro desde el TDA al casquillo. Verificación: Acciona cualquiera de los tres interruptores (los dos 9/24 o el cruce) para verificar que la lámpara cambia de estado.",
    success: "El cruce suma el tercer punto de control y cualquiera de los tres mandos conmuta la luz.",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y una lámpara.",
    fix: "Cada mando, incluido el cruce, tiene que poder apagar la lámpara. Los puentes pasan por el cruce.",
    build() {
      const s1 = new Commutator("s1", 280, 340, "9/24 · 1");
      const cross = new Crossover("cross", 560, 175);
      const s2 = new Commutator("s2", 560, 500, "9/24 · 2");
      const load = lamp("lamp", 860, 340, "Lámpara");
      return [rule(load, "series", [s1, cross, s2], "la lámpara", this.fix)];
    },
  },

    {
    id: "pasillo-enchufe",
    headline: "Pasillo · Conmutada 9/24 y enchufe con tierra PE",
    objective: "Circuito de Conmutación 9/24: Alimenta el común del primer 9/24, une los puentes viajeros entre ambos conmutadores, conecta el retorno desde el segundo 9/24 a la lámpara y cierra con Neutro. Enchufe Independiente: Alimenta los bornes L y N del tomacorriente directo desde las barras de fase y neutro del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia el borne PE del enchufe. Verificación: Comprueba que la luz conmuta desde ambos conmutadores y el enchufe mantiene 220 V permanentes con enlace a tierra.",
    success: "Conmutada 9/24 operativa y enchufe protegido con tierra PE reglamentaria.",
    parts: "Dos conmutadores 9/24, una lámpara y un enchufe 10 A con tierra PE.",
    fix: "La lámpara depende de los dos 9/24. El enchufe no pasa por ellos.",
    build() {
      const s1 = new Commutator("s1", 280, 190, "9/24 · 1");
      const s2 = new Commutator("s2", 540, 190, "9/24 · 2");
      const load = lamp("lamp", 830, 190, "Lámpara");
      const sock = socket("sock", 620, 480, "Enchufe 10 A");
      return [
        rule(load, "series", [s1, s2], "la lámpara", this.fix),
        rule(sock, "hot", [], "el enchufe", "El enchufe toma fase y neutro directo del tablero."),
      ];
    },
  },

    {
    id: "dos-dormitorios",
    headline: "Dos Habitaciones · Circuitos 9/12 independientes",
    objective: "Alimentación en Paralelo: Canaliza la Fase desde la barra L del TDA hacia los bornes de entrada de ambos interruptores 9/12 (sw1 y sw2). Retornos de Alumbrado: Conecta la salida de sw1 a la lámpara L1 y la salida de sw2 a la lámpara L2. Retorno de Neutro: Lleva el Neutro desde la barra N del TDA en derivación a los casquillos exteriores de L1 y L2. Verificación: Comprueba que cada interruptor 9/12 enciende y apaga exclusivamente la lámpara de su respectiva habitación.",
    success: "Cada habitación cuenta con control de alumbrado 9/12 totalmente independiente.",
    parts: "Dos interruptores 9/12 y dos lámparas.",
    build() {
      const sw1 = new Switch("sw1", 360, 190, "Pieza 1");
      const l1 = lamp("l1", 740, 190, "Luz 1");
      const sw2 = new Switch("sw2", 360, 490, "Pieza 2");
      const l2 = lamp("l2", 740, 490, "Luz 2");
      return [
        rule(l1, "series", [sw1], "la pieza 1", "La luz 1 depende del 9/12 de la pieza 1."),
        rule(l2, "series", [sw2], "la pieza 2", "La luz 2 depende del 9/12 de la pieza 2."),
      ];
    },
  },

    {
    id: "principal",
    headline: "Dormitorio Principal · Conmutada 9/24 y enchufe con tierra PE",
    objective: "Alumbrado de Dormitorio: Conecta la Fase desde la barra L del TDA al común del interruptor 9/15, canaliza sus retornos hacia los contactos centrales de las lámparas L1 y L2 y cierra con Neutro a los casquillos. Enchufe de Cabecera: Conecta Fase y Neutro desde el TDA al tomacorriente para suministro continuo de 220 V. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA al borne PE del enchufe. Verificación: Comprueba el funcionamiento de las luminarias y la presencia de 220 V con tierra reglamentaria en el tomacorriente.",
    success: "Alumbrado y enchufe de cabecera con tierra PE operando conforme a norma RIC N°10.",
    parts: "Un interruptor 9/15, dos lámparas y un enchufe con tierra PE.",
    build() {
      const dbl = new Gang("dbl", 280, 190, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 560, 190, "Centro");
      const l2 = lamp("l2", 840, 190, "Velador");
      const sock = socket("sock", 620, 480, "Enchufe 10 A");
      return [
        rule(l1, "series", [dbl.keys["1"]], "el centro", "La tecla L1 corta el centro."),
        rule(l2, "series", [dbl.keys["2"]], "el velador", "La tecla L2 corta el velador."),
        rule(sock, "hot", [], "el enchufe"),
      ];
    },
  },

    {
    id: "avanzado-924-corto",
    headline: "Escalera Compacta · Conmutación 9/24",
    objective: "Alimentación al Primer 9/24: Lleva la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Puentes Viajeros: Conecta los bornes laterales de s1 con los bornes laterales del segundo conmutador (s2). Retorno a Luminaria: Conecta el común de s2 al contacto central de la lámpara. Distribución de Neutro: Tiende el Neutro desde la barra N del TDA al casquillo exterior de la lámpara. Verificación: Conmuta alternativamente ambos interruptores para verificar el funcionamiento de la escala en dos vías.",
    success: "Conmutación 9/24 en dos vías completada con éxito.",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 340, "Piso 1");
      const l1 = lamp("l1", 540, 340, "Escalera");
      const s2 = new Commutator("s2", 800, 340, "Piso 2");
      return [rule(l1, "series", [s1, s2], "Escalera")];
    }
  },

    {
    id: "avanzado-924-largo",
    headline: "Pasillo Extenso · Conmutada 9/24 con tres luminarias",
    objective: "Alimentación al Primer 9/24: Conecta la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Puentes Viajeros: Tiende los dos conductores viajeros entre los bornes laterales de ambos conmutadores 9/24 (s1 y s2). Retorno Múltiple en Paralelo: Lleva el conductor de retorno desde el común de s2 y conéctalo en derivación a los contactos centrales de las tres lámparas (L1, L2 y L3). Neutro Compartido: Distribuye el Neutro desde la barra N del TDA a los casquillos de las tres luminarias. Verificación: Acciona cualquiera de los dos conmutadores para comprobar que las tres luces encienden y apagan juntas.",
    success: "Las tres luminarias del pasillo conmutan simultáneamente desde los dos extremos mediante el circuito 9/24.",
    parts: "Dos conmutadores 9/24 y tres lámparas en paralelo.",
    build() {

      const s1 = new Commutator("s1", 280, 340, "A");
      const s2 = new Commutator("s2", 800, 340, "B");
      const l1 = lamp("l1", 540, 150, "L1");
      const l2 = lamp("l2", 500, 350, "L2");
      const l3 = lamp("l3", 500, 550, "L3");
      return [
        rule(l1, "series", [s1, s2], "L1"),
        rule(l2, "series", [s1, s2], "L2"),
        rule(l3, "series", [s1, s2], "L3")
      ];
    }
  },

    {
    id: "avanzado-diag-924",
    headline: "Diagnóstico · Error de cableado en conmutada 9/24",
    objective: "Diagnóstico de Puentes Viajeros: En una conmutada 9/24, si la Fase o el Neutro se conectan por error a un borne lateral en vez del común, el sistema producirá un cortocircuito al alternar las posiciones. Cableado Reglamentario: Conecta la Fase únicamente al común del primer 9/24 (s1). Puentes Viajeros: Conecta los puentes viajeros exclusivamente entre los bornes laterales de s1 y s2. Retorno y Neutro: Conecta el común de s2 a la lámpara y cierra el circuito con el Neutro del TDA al casquillo. Verificación: Alterna las cuatro combinaciones de los dos conmutadores sin provocar disparos térmicos.",
    success: "La conmutada 9/24 opera en todas sus combinaciones sin cortocircuito.",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 340, "A");
      const s2 = new Commutator("s2", 800, 340, "B");
      const l1 = lamp("l1", 540, 340, "Luz");
      return [rule(l1, "series", [s1, s2], "Luz")];
    }
  },

    {
    id: "avanzado-mixto-placa",
    headline: "Placa Modular Mixta · Conmutador 9/24 e Interruptor 9/12",
    objective: "Alimentación a Placa: Conecta la Fase desde la barra L del TDA al común del primer 9/24 (s1) y puentéala a la entrada del interruptor 9/12 (sw) en la misma caja. Conmutada 9/24 (L1): Tiende los dos puentes viajeros hacia el segundo 9/24 (s2) y conecta el común de este a la lámpara L1. Efecto 9/12 (L2): Conecta la salida de sw al contacto central de la lámpara L2. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos de ambas lámparas. Verificación: Comprueba que L1 conmuta desde ambos 9/24 y L2 opera de forma independiente con el 9/12.",
    success: "El conmutador 9/24 y el interruptor 9/12 operan en la misma placa sin interferirse mutuamente.",
    parts: "Dos conmutadores 9/24, un interruptor 9/12 y dos lámparas.",
    build() {

      const s1 = new Commutator("s1", 280, 200, "9/24 A");
      const sw = new Switch("sw", 280, 500, "9/12");
      const s2 = new Commutator("s2", 800, 200, "9/24 B");
      const l1 = lamp("l1", 540, 200, "L1");
      const l2 = lamp("l2", 540, 500, "L2");
      return [rule(l1, "series", [s1, s2], "L1"), rule(l2, "series", [sw], "L2")];
    }
  },

    {
    id: "avanzado-tres-accesos-2",
    headline: "Pasillo Distribuidor · Tres accesos con dos lámparas",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Enlace de Cruce: Conecta los bornes laterales de s1 a la entrada del cruce c y las salidas de c a los bornes laterales del segundo 9/24 (s2). Retorno en Paralelo: Lleva el retorno desde el común de s2 derivándolo a los contactos centrales de ambas lámparas (L1 y L2). Neutro Compartido: Tiende el Neutro desde la barra N del TDA a los casquillos exteriores de L1 y L2. Verificación: Acciona los dos 9/24 y el interruptor de cruce; cualquiera de los tres mandos debe cambiar el estado de ambas lámparas.",
    success: "Ambas lámparas conmutan perfectamente desde los tres puntos de mando.",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y dos lámparas en paralelo.",
    build() {

      const s1 = new Commutator("s1", 280, 200, "E1");
      const c = new Crossover("c", 280, 500, "E2");
      const s2 = new Commutator("s2", 800, 200, "E3");
      const l1 = lamp("l1", 540, 200, "L1");
      const l2 = lamp("l2", 540, 500, "L2");
      return [rule(l1, "series", [s1, c, s2], "L1"), rule(l2, "series", [s1, c, s2], "L2")];
    }
  },

    {
    id: "avanzado-cuatro-accesos",
    headline: "Salón Amplio · Conmutación desde cuatro accesos",
    objective: "Alimentación: Lleva la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Cadena de Cruces: Conecta las salidas laterales de s1 a las entradas del primer cruce (c1); conecta las salidas de c1 a las entradas del segundo cruce (c2); conecta las salidas de c2 a los bornes laterales de s2. Retorno de Carga: Conecta el común del segundo 9/24 (s2) al contacto central de la lámpara. Cierre de Neutro: Conecta el Neutro desde la barra N del TDA al casquillo exterior. Verificación: Acciona cada uno de los cuatro interruptores en forma sucesiva; todos deben conmutar la luz de manera independiente.",
    success: "La lámpara del salón conmuta correctamente desde cualquiera de los cuatro interruptores.",
    parts: "Dos conmutadores 9/24, dos interruptores de cruce y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 150, "A");
      const c1 = new Crossover("c1", 280, 350, "B");
      const c2 = new Crossover("c2", 280, 550, "C");
      const s2 = new Commutator("s2", 800, 350, "D");
      const l1 = lamp("l1", 540, 350, "Centro");
      return [rule(l1, "series", [s1, c1, c2, s2], "Centro")];
    }
  },

    {
    id: "avanzado-cinco-accesos",
    headline: "Hotel / Galería · Conmutación desde cinco accesos",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al común del conmutador 9/24 inicial (s1). Cascada de Tres Cruces: Tiende los puentes viajeros en cascada a través de los tres cruces intermedios (c1 ➔ c2 ➔ c3) y remata en los laterales del 9/24 final (s2). Retorno al Consumo: Conecta el común de s2 al contacto central de la luminaria. Cierre con Neutro: Conecta el Neutro desde la barra N del TDA al casquillo de la luminaria. Verificación: Comprueba la alternancia de encendido y apagado accionando cualquiera de los cinco puntos de mando.",
    success: "Circuito de cinco accesos operativo: los dos 9/24 y los tres cruces comandan la luminaria a la perfección.",
    parts: "Dos conmutadores 9/24, tres interruptores de cruce y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 100, "1");
      const c1 = new Crossover("c1", 280, 250, "2");
      const c2 = new Crossover("c2", 280, 400, "3");
      const c3 = new Crossover("c3", 280, 550, "4");
      const s2 = new Commutator("s2", 800, 325, "5");
      const l1 = lamp("l1", 540, 325, "Luz");
      return [rule(l1, "series", [s1, c1, c2, c3, s2], "Luz")];
    }
  },

    {
    id: "avanzado-pasillo-enchufes",
    headline: "Pasillo · Conmutada 9/24 y tres enchufes con tierra PE",
    objective: "Circuito de Alumbrado 9/24: Alimenta el común de s1 desde la barra L del TDA, tiende los puentes viajeros hacia s2, conecta su común al contacto central de la lámpara y cierra con Neutro al casquillo. Circuito de Enchufes en Paralelo: Alimenta en paralelo los bornes L y N de las tres tomas (e1, e2 y e3) desde las barras del TDA. Tierra de Protección PE Obligatoria (RIC N°10): Canaliza el conductor verde desde la barra PE del TDA hacia los bornes PE de los tres enchufes. Verificación: Comprueba que la luz conmuta desde ambos extremos y los tres enchufes entregan 220 V continuos con puesta a tierra reglamentaria.",
    success: "Alumbrado conmutable 9/24 y tres enchufes con tierra PE funcionando conforme a norma.",
    parts: "Dos conmutadores 9/24, una lámpara y tres enchufes 10 A con tierra PE.",
    build() {

      const s1 = new Commutator("s1", 280, 150);
      const s2 = new Commutator("s2", 800, 150);
      const l1 = lamp("l1", 540, 150, "Techo");
      const e1 = socket("e1", 280, 450, "E1");
      const e2 = socket("e2", 540, 450, "E2");
      const e3 = socket("e3", 800, 450, "E3");
      return [rule(l1, "series", [s1, s2], "Techo"), rule(e1, "hot", [], "E1"), rule(e2, "hot", [], "E2"), rule(e3, "hot", [], "E3")];
    }
  },

    {
    id: "avanzado-ext-cruce",
    headline: "Jardín · Conmutada de tres accesos con dos reflectores",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Cruce Intermedio: Canaliza los puentes viajeros pasando por el interruptor de cruce c1 hacia los bornes laterales del segundo 9/24 (s2). Retorno en Paralelo: Conecta el retorno desde el común de s2 a los contactos centrales de ambos reflectores (L1 y L2). Distribución de Neutro: Lleva el Neutro desde la barra N del TDA a los casquillos de ambos reflectores. Verificación: Acciona indistintamente los dos 9/24 o el cruce c1 para comprobar la conmutación simultánea de ambos reflectores.",
    success: "Los dos reflectores de jardín conmutan al unísono desde los tres accesos.",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y dos reflectores.",
    build() {

      const s1 = new Commutator("s1", 280, 200);
      const c1 = new Crossover("c1", 280, 500);
      const s2 = new Commutator("s2", 800, 350);
      const l1 = lamp("l1", 540, 200, "Piscina");
      const l2 = lamp("l2", 540, 500, "Quincho");
      return [rule(l1, "series", [s1, c1, s2], "Piscina"), rule(l2, "series", [s1, c1, s2], "Quincho")];
    }
  },

    {
    id: "avanzado-diag-924-falso",
    headline: "Diagnóstico · Diferencia funcional entre 9/24 y 9/15",
    objective: "Diagnóstico Teórico-Práctico: Un interruptor 9/15 (doble efecto) nunca puede reemplazar a un 9/24 de escala porque no dispone de contacto inversor (conmutación). Cableado Correcto de Escala 9/24: Conecta la Fase al común del primer 9/24 (s1), une los dos laterales viajeros a s2 y extrae el retorno exclusivo desde el común de s2 hacia la lámpara. Cierre de Neutro: Conecta el Neutro desde la barra N del TDA al casquillo de la lámpara. Verificación: Comprueba que alternar cualquiera de las palancas cambia el estado de la lámpara sin dejar puntos muertos ni combinaciones ciegas.",
    success: "Conmutación 9/24 debidamente identificada y operando de forma continua.",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 340);
      const s2 = new Commutator("s2", 800, 340);
      const l1 = lamp("l1", 540, 340, "Luz");
      return [rule(l1, "series", [s1, s2], "Luz")];
    }
  },

    {
    id: "avanzado-924-cruzado",
    headline: "Escalera · Puentes viajeros cruzados en conmutada 9/24",
    objective: "Comprensión de Puentes Viajeros: En un circuito 9/24, cruzar los dos conductores viajeros (borne A1 con B2 y B1 con A2) no altera el funcionamiento eléctrico del sistema, pues ambos son conductores alternativos de fase. Alimentación: Conecta la Fase desde la barra L del TDA al común del primer 9/24 (s1). Puentes Cruzados: Cruza los dos conductores viajeros entre los bornes laterales de s1 y s2. Retorno y Neutro: Conecta el común de s2 al centro de la lámpara y cierra el Neutro al casquillo. Verificación: Alterna los interruptores para confirmar que el cruce de viajeros mantiene la conmutación perfecta.",
    success: "La conmutada 9/24 opera con total normalidad a pesar del cruce de viajeros.",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 340);
      const s2 = new Commutator("s2", 800, 340);
      const l1 = lamp("l1", 540, 340, "Luz");
      return [rule(l1, "series", [s1, s2], "Luz")];
    }
  },

    {
    id: "avanzado-tres-pisos",
    headline: "Edificio de Tres Pisos · Doble circuito de escala 9/24",
    objective: "Alimentación de Escalas: Canaliza la Fase desde la barra L del TDA a los bornes comunes de los conmutadores de entrada de cada tramo (s1a y s2a). Tramo Piso 1 a 2: Conecta los puentes viajeros entre s1a y s1b, llevando el retorno a la lámpara Escalera 1. Tramo Piso 2 a 3: Conecta los puentes viajeros entre s2a y s2b, llevando el retorno a la lámpara Escalera 2. Neutro Común: Distribuye el Neutro desde la barra N del TDA a los casquillos de ambas lámparas de escalera. Verificación: Comprueba que cada tramo de escalera conmuta de forma independiente desde sus respectivos descansos.",
    success: "Ambos tramos de escalera conmutan de forma independiente entre sus respectivos descansos.",
    parts: "Cuatro conmutadores 9/24 y dos lámparas (Escalera 1 y Escalera 2).",
    build() {

      const s1a = new Commutator("s1a", 280, 200, "P1");
      const s1b = new Commutator("s1b", 550, 200, "P2 Abajo");
      const s2a = new Commutator("s2a", 550, 500, "P2 Arriba");
      const s2b = new Commutator("s2b", 820, 500, "P3");
      const l1 = lamp("l1", 415, 350, "Escalera 1");
      const l2 = lamp("l2", 685, 350, "Escalera 2");
      return [rule(l1, "series", [s1a, s1b], "E1"), rule(l2, "series", [s2a, s2b], "E2")];
    }
  },

    {
    id: "avanzado-galpon",
    headline: "Galpón Industrial · Conmutada 9/24 y foco exterior 9/12",
    objective: "Alimentación General: Canaliza la Fase desde la barra L del TDA al común del primer 9/24 (s1) y a la entrada del 9/12 (sw). Alumbrado Nave Central (9/24): Une los puentes viajeros entre s1 y s2 y conecta el común de s2 en paralelo a las lámparas G1 y G2. Alumbrado Exterior (9/12): Conecta la salida de sw al foco exterior Ext. Neutro Compartido: Tiende el Neutro desde la barra N del TDA hacia los casquillos de las tres luminarias. Verificación: Comprueba que la nave central conmuta desde ambos accesos y el foco exterior opera con su propio interruptor.",
    success: "La nave central conmuta desde los accesos y el foco exterior opera de forma independiente.",
    parts: "Dos conmutadores 9/24, un interruptor 9/12 y tres lámparas.",
    build() {

      const s1 = new Commutator("s1", 280, 200);
      const s2 = new Commutator("s2", 800, 200);
      const sw = new Switch("sw", 280, 500);
      const l1 = lamp("l1", 540, 100, "G1");
      const l2 = lamp("l2", 540, 300, "G2");
      const l3 = lamp("l3", 540, 500, "Ext");
      return [rule(l1, "series", [s1, s2], "G1"), rule(l2, "series", [s1, s2], "G2"), rule(l3, "series", [sw], "Ext")];
    }
  },

    {
    id: "avanzado-diag-cruce",
    headline: "Diagnóstico · Identificación de bornes en interruptor de cruce",
    objective: "Diagnóstico de Cruzamiento: El interruptor de cruce posee dos bornes de entrada y dos de salida; conectar entrada y salida en corto anula la conmutación. Alimentación Inicial: Conecta la Fase al común del primer 9/24 (s1). Enlace de Viajeros y Cruce: Conecta los dos viajeros de salida a la entrada del cruce (c1) y desde su salida tiende los viajeros a s2. Retorno y Neutro: Conecta el común de s2 a la lámpara y el casquillo al Neutro del TDA. Verificación: Comprueba que los tres mandos alternan la luz sin provocar posiciones falsas ni disparos.",
    success: "El interruptor de cruce conmuta correctamente y completa la conmutación de tres accesos.",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y una lámpara.",
    build() {

      const s1 = new Commutator("s1", 280, 200);
      const c1 = new Crossover("c1", 540, 200);
      const s2 = new Commutator("s2", 800, 200);
      const l1 = lamp("l1", 540, 500, "Luz");
      return [rule(l1, "series", [s1, c1, s2], "Luz")];
    }
  },

    {
    id: "cocina",
    headline: "Cocina · Alumbrado 9/12 y enchufe de fuerza con tierra PE",
    objective: "Alumbrado 9/12: Conecta la Fase desde la barra L del TDA al 9/12, su retorno a la lámpara y cierra con Neutro al casquillo. Enchufe de Fuerza y Tierra PE: Alimenta el enchufe desde las barras de fase y neutro (o a través del bipolar), y conecta obligatoriamente el conductor verde de protección desde la barra PE del TDA al borne PE del enchufe. Normativa RIC N°02 y N°10: Al completar el cableado con puesta a tierra reglamentaria, se generará el Cuadro de Cargas dividiendo C-1 Alumbrado (10 A) y C-2 Enchufes (16 A). Verificación: Comprueba el funcionamiento de la luz y la presencia de 220 V con tierra segura en el enchufe.",
    success: "Alumbrado y enchufe de fuerza operativos con protección diferencial y tierra PE reglamentaria.",
    parts: "Un interruptor 9/12, una lámpara, un interruptor bipolar y un enchufe 16 A con tierra PE.",
    build() {
      const sw = new Switch("sw", 360, 190);
      const load = lamp("lamp", 720, 190, "Luz");
      const bip = new Bipolar("bip", 360, 490);
      const sock = socket("sock", 760, 490, "Enchufe 16 A");
      return [
        rule(load, "series", [sw], "la luz"),
        rule(sock, "bipolar", [bip], "el enchufe 16 A"),
      ];
    },
  },

    {
    id: "marquesina",
    headline: "Marquesina · Pulsador con timbre y alumbrado 9/12",
    objective: "Alimentación a Mandos: Lleva la Fase desde la barra L del TDA a la entrada del pulsador de acceso (btn) y a la entrada del interruptor 9/12 (sw). Circuito de Timbre: Conecta la salida de btn al borne de entrada del timbre (bell) y cierra su retorno al Neutro del TDA. Circuito de Alumbrado: Conecta la salida de sw al contacto central de la lámpara Marquesina y cierra al Neutro del TDA. Verificación: Presiona el pulsador para verificar el timbre y acciona el 9/12 para encender la marquesina de forma independiente.",
    success: "El timbre suena al presionar el pulsador y la luminaria de marquesina opera con el interruptor 9/12.",
    parts: "Un pulsador, un timbre, un interruptor 9/12 y una lámpara.",
    build() {
      const btn = new Push("btn", 380, 190);
      const ring = bell("bell", 740, 190);
      const sw = new Switch("sw", 380, 490);
      const load = lamp("lamp", 740, 490, "Marquesina");
      return [
        rule(ring, "parallel", [btn], "el timbre"),
        rule(load, "series", [sw], "la marquesina"),
      ];
    },
  },

    {
    id: "living-completo",
    headline: "Living Completo · Doble efecto 9/15 y dos enchufes con tierra PE",
    objective: "Alumbrado 9/15: Alimenta el común del 9/15 con Fase, conecta la salida 1 a L1, la salida 2 a L2 y cierra con Neutro a los casquillos. Enchufes en Paralelo: Alimenta en derivación paralela los bornes L y N de ambos tomacorrientes (s1 y s2) desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes. Verificación: Comprueba que el 9/15 controla ambas luces de manera independiente y las tomas entregan 220 V continuos con tierra de protección.",
    success: "Instalación de living completada con doble efecto 9/15 y enchufes protegidos con tierra PE según norma RIC.",
    parts: "Un interruptor doble 9/15, dos lámparas y dos enchufes con tierra PE.",
    build() {
      const dbl = new Gang("dbl", 270, 190, "9/15", ["1", "2"]);
      const l1 = lamp("l1", 540, 185, "L1");
      const l2 = lamp("l2", 820, 185, "L2");
      const s1 = socket("s1", 460, 490, "Enchufe 1");
      const s2 = socket("s2", 780, 490, "Enchufe 2");
      return [
        rule(l1, "series", [dbl.keys["1"]], "L1", "L1 depende de la tecla L1."),
        rule(l2, "series", [dbl.keys["2"]], "L2", "L2 depende de la tecla L2."),
        rule(s1, "hot", [], "el enchufe 1"),
        rule(s2, "hot", [], "el enchufe 2"),
      ];
    },
  },

    {
    id: "departamento",
    headline: "Departamento · Conmutada 9/24 en pasillo y 9/12 en baño",
    objective: "Alimentación General: Canaliza la Fase desde la barra L del TDA al común del primer conmutador 9/24 (p1) del pasillo y a la entrada del 9/12 (sw) del baño. Conmutada Pasillo (9/24): Tiende los conductores viajeros entre p1 y p2 y conecta el común de p2 a la lámpara de pasillo (hall). Baño (9/12): Conecta el retorno de la salida de sw a la lámpara del baño (bath). Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas lámparas. Verificación: Comprueba que la luz del pasillo conmuta desde los dos accesos y la luz del baño enciende con su propio interruptor.",
    success: "El pasillo conmuta desde ambos extremos y el baño se controla independientemente mediante su 9/12.",
    parts: "Dos conmutadores 9/24, un interruptor 9/12 y dos lámparas.",
    fix: "La lámpara del pasillo depende de los dos 9/24.",
    build() {
      const p1 = new Commutator("p1", 280, 185, "9/24 · 1");
      const p2 = new Commutator("p2", 530, 185, "9/24 · 2");
      const hall = lamp("hall", 820, 185, "Pasillo");
      const sw = new Switch("sw", 400, 490, "Baño");
      const bath = lamp("bath", 760, 490, "Baño");
      return [
        rule(hall, "series", [p1, p2], "el pasillo", this.fix),
        rule(bath, "series", [sw], "el baño"),
      ];
    },
  },

    {
    id: "taller-tda-2",
    headline: "Tablero TDA · Distribución de alumbrado (10 A) y fuerza (16 A)",
    objective: "Alimentación a Protecciones: Conecta la Fase desde la barra L del TDA a las entradas de ambos automáticos de circuito (b1 Alumbrado y b2 Enchufes). Circuito 1 Alumbrado (b1): Desde la salida de b1 alimenta el interruptor 9/12 sw, conecta su retorno a la lámpara l1 y cierra al Neutro del TDA. Circuito 2 Fuerza (b2): Desde la salida de b2 alimenta el borne L del enchufe s1 y conecta su borne N a la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA directo al borne PE del enchufe. Verificación: Cierra ambos automáticos y verifica la independencia operativa de alumbrado y fuerza.",
    success: "Distribución de dos circuitos en tablero TDA validada con protecciones y tierra PE conforme a RIC N°02 y N°10.",
    parts: "Dos automáticos termomagnéticos (b1 y b2), un 9/12, una lámpara y un enchufe con tierra PE.",
    build() {

      const b1 = new Breaker("b1", 250, 200, "Alumbrado");
      const b2 = new Breaker("b2", 250, 500, "Enchufes");
      const sw = new Switch("sw", 500, 200);
      const l1 = lamp("l1", 750, 200, "Luz");
      const s1 = socket("s1", 500, 500, "E1");
      return [rule(l1, "series", [b1, sw], "Luz"), rule(s1, "series", [b2], "E1")];
    }
  },

    {
    id: "taller-tda-3",
    headline: "Tablero TDA · Automático general con dos circuitos derivados",
    objective: "Protección General: Conecta la Fase desde la barra L del TDA a la entrada del automático general (bg). Distribución Secundaria: Conecta la salida de bg a las entradas de los disyuntores de circuito b1 (Alumbrado) y b2 (Fuerza). Circuito Alumbrado (b1): Alimenta el interruptor 9/12 desde b1, conecta el retorno a la lámpara l1 y cierra con Neutro. Circuito Fuerza (b2): Alimenta L y N del enchufe s1 desde b2 y la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Tiende el conductor verde desde la barra PE del TDA hacia el borne PE del enchufe. Verificación: Cierra bg, b1 y b2 para verificar la cascada de protecciones y la operatividad total.",
    success: "Tablero con protección general y circuitos derivados completamente validado bajo normativa SEC.",
    parts: "Un disyuntor general (bg), dos disyuntores de circuito (b1 y b2), un 9/12, una lámpara y un enchufe con tierra PE.",
    build() {

      const bg = new Breaker("bg", 240, 340, "General");
      const b1 = new Breaker("b1", 420, 150, "Alumbrado");
      const b2 = new Breaker("b2", 420, 500, "Fuerza");
      const sw = new Switch("sw", 600, 150);
      const l1 = lamp("l1", 800, 150, "Luz");
      const s1 = socket("s1", 600, 500, "Enchufe");
      return [rule(l1, "series", [bg, b1, sw], "Luz"), rule(s1, "series", [bg, b2], "Enchufe")];
    }
  },

    {
    id: "taller-casa-peq",
    headline: "Vivienda Pequeña · Distribución completa de alumbrado y fuerza",
    objective: "Alimentación por Circuitos: Conecta la Fase desde la barra L del TDA a las entradas de b1 (Alumbrado) y b2 (Fuerza). Circuito C-1 Alumbrado: Alimenta los interruptores s1 y s2 desde b1, conecta sus retornos a l1 y l2 y cierra al Neutro del TDA. Circuito C-2 Fuerza: Alimenta en paralelo los bornes L y N de los tres enchufes (e1, e2 y e3) desde la salida de b2 y la barra de Neutro. Puesta a Tierra PE Obligatoria (RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de los tres enchufes. Verificación: Cierra ambos automáticos y comprueba el funcionamiento independiente de las dos zonas de alumbrado y las tres tomas de corriente.",
    success: "Instalación completa de vivienda validada conforme a pliegos técnicos RIC N°02 y N°10.",
    parts: "Dos disyuntores de circuito (b1 y b2), dos interruptores 9/12, dos lámparas y tres enchufes con tierra PE.",
    build() {

      const b1 = new Breaker("b1", 240, 150, "Ilum");
      const b2 = new Breaker("b2", 240, 450, "Ench");
      const s1 = new Switch("s1", 400, 100, "S1");
      const s2 = new Switch("s2", 400, 250, "S2");
      const l1 = lamp("l1", 600, 100, "L1");
      const l2 = lamp("l2", 600, 250, "L2");
      const e1 = socket("e1", 400, 450, "E1");
      const e2 = socket("e2", 600, 450, "E2");
      const e3 = socket("e3", 800, 450, "E3");
      return [
        rule(l1, "series", [b1, s1], "L1"), rule(l2, "series", [b1, s2], "L2"),
        rule(e1, "series", [b2], "E1"), rule(e2, "series", [b2], "E2"), rule(e3, "series", [b2], "E3")
      ];
    }
  },

    {
    id: "taller-depto",
    headline: "Departamento Completo · Tablero TDA con conmutada 9/24 y baño 9/15",
    objective: "Protección de Circuito: Conecta la Fase desde la barra L del TDA a la entrada del disyuntor general de circuito (bg) y distribuye su salida protegida hacia los mandos. Conmutada Pasillo (9/24): Alimenta el común del conmutador sw1, tiende los viajeros a sw2 y conecta su retorno a la lámpara de pasillo l1. Baño Mixto (9/15): Alimenta el común del 9/15 dbl; conecta la salida 1 a la luz del baño l2 y la salida 2 al extractor de aire ext. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los tres artefactos. Verificación: Cierra el disyuntor bg y prueba la conmutación del pasillo y el control fraccionado del baño.",
    success: "Departamento operativo: disyuntor protege la instalación, pasillo conmuta y baño opera en doble efecto con extracción.",
    parts: "Un disyuntor de circuito, dos conmutadores 9/24, un 9/15, dos lámparas y un extractor de aire.",
    build() {

      const bg = new Breaker("bg", 240, 340, "General");
      const sw1 = new Commutator("sw1", 380, 140, "Pasillo A");
      const sw2 = new Commutator("sw2", 820, 140, "Pasillo B");
      const l1 = lamp("l1", 600, 90, "L Pasillo");
      const dbl = new Gang("dbl", 380, 480, "9/15 Baño", ["1", "2"]);
      const l2 = lamp("l2", 600, 380, "L Baño");
      const ext = lamp("ext", 600, 540, "Extractor");
      return [
        rule(l1, "series", [bg, sw1, sw2], "Pasillo"),
        rule(l2, "series", [bg, dbl.keys["1"]], "Baño Luz"),
        rule(ext, "series", [bg, dbl.keys["2"]], "Baño Ext")
      ];
    }
  },

    {
    id: "taller-oficina",
    headline: "Oficina Comercial · Triple efecto 9/32 y enchufes de trabajo con tierra PE",
    objective: "Distribución por Circuitos: Conecta la Fase desde la barra L del TDA a las entradas de b1 (Alumbrado) y b2 (Fuerza). Circuito C-1 Alumbrado Comercial: Alimenta el común del interruptor triple 9/32 desde b1, conecta las salidas 1, 2 y 3 a l1, l2 y l3, y cierra con Neutro al casquillo. Circuito C-2 Fuerza Puestos de Trabajo: Alimenta los bornes L y N de ambos enchufes (e1 y e2) desde b2 y la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes de oficina. Verificación: Cierra b1 y b2 comprobando el triple encendido por zonas y la alimentación continua con tierra en los escritorios.",
    success: "Oficina comercial operativa bajo norma RIC: triple efecto 9/32 y puestos de trabajo con tierra PE.",
    parts: "Dos automáticos de circuito (b1 y b2), un triple 9/32, tres luminarias y dos enchufes con tierra PE.",
    build() {

      const b1 = new Breaker("b1", 240, 200, "Ilum");
      const b2 = new Breaker("b2", 240, 500, "Fuerza");
      const tri = new Gang("tri", 420, 200, "9/32", ["1", "2", "3"]);
      const l1 = lamp("l1", 650, 100, "Z1");
      const l2 = lamp("l2", 650, 200, "Z2");
      const l3 = lamp("l3", 650, 300, "Z3");
      const e1 = socket("e1", 400, 500, "E1");
      const e2 = socket("e2", 600, 500, "E2");
      return [
        rule(l1, "series", [b1, tri.keys["1"]], "Z1"),
        rule(l2, "series", [b1, tri.keys["2"]], "Z2"),
        rule(l3, "series", [b1, tri.keys["3"]], "Z3"),
        rule(e1, "series", [b2], "E1"),
        rule(e2, "series", [b2], "E2")
      ];
    }
  },

    {
    id: "taller-comercial",
    headline: "Local Comercial · Vitrina, iluminación de salón y enchufe de caja con tierra PE",
    objective: "Protección de Tablero: Conecta la Fase desde la barra L del TDA a la entrada del automático general bg y deriva su salida a los mandos y enchufes. Vitrina y Salón (9/12): Alimenta los interruptores sw1 y sw2, conecta sus retornos a la lámpara de vitrina l1 y salón l2, cerrando con Neutro. Enchufe de Punto de Venta (Caja): Alimenta L y N del enchufe caja con Neutro de la barra del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA al borne PE del enchufe de caja. Verificación: Cierra el automático general bg y verifica el control independiente de la vitrina, el salón y la caja registradora.",
    success: "Local comercial cableado con éxito: vitrina, salón y punto de venta con tierra PE reglamentaria.",
    parts: "Un disyuntor general (bg), dos interruptores 9/12, dos lámparas y un enchufe con tierra PE.",
    build() {

      const bg = new Breaker("bg", 240, 340, "General");
      const sw1 = new Switch("sw1", 400, 150, "Vitrina");
      const sw2 = new Switch("sw2", 400, 340, "General");
      const l1 = lamp("l1", 600, 150, "L Vitrina");
      const l2 = lamp("l2", 600, 340, "L General");
      const caja = socket("caja", 600, 550, "Caja");
      return [
        rule(l1, "series", [bg, sw1], "Vitrina"),
        rule(l2, "series", [bg, sw2], "General"),
        rule(caja, "series", [bg], "Caja")
      ];
    }
  },

    {
    id: "taller-restaurante",
    headline: "Restaurante Comercial · Distribución por sectores con conmutada 9/24",
    objective: "Distribución por Circuitos: Conecta la Fase desde la barra L del TDA a las entradas de los tres automáticos (bC Cocina, bD Salón, bB Baño). Circuito de Fuerza Cocina (bC): Alimenta el tomacorriente eq desde bC con su neutro y conecta el cable verde desde la barra PE del TDA a su borne PE conforme a RIC N°10. Circuito Alumbrado Salón (bD): Alimenta el común del conmutador c1 desde bD, une los viajeros con c2 y conecta el retorno a la lámpara ld. Circuito Baño (bB): Alimenta el interruptor 9/12 sw desde bB y conecta el retorno a la lámpara lb. Verificación: Cierra las tres protecciones y comprueba el funcionamiento independiente de cada área del restaurante.",
    success: "Restaurante comercial operativo con protecciones independientes de fuerza y alumbrado según normativa RIC.",
    parts: "Tres automáticos (bC Cocina, bD Salón, bB Baño), dos conmutadores 9/24, un 9/12, dos lámparas y un enchufe con tierra PE.",
    build() {

      const bC = new Breaker("bC", 240, 150, "Cocina");
      const bD = new Breaker("bD", 240, 350, "Comedor");
      const bB = new Breaker("bB", 240, 550, "Baños");
      const eq = socket("eq", 500, 150, "Equipos");
      const c1 = new Commutator("c1", 400, 350, "A");
      const c2 = new Commutator("c2", 820, 350, "B");
      const ld = lamp("ld", 610, 240, "Luz D");
      const sw = new Switch("sw", 400, 550, "Baño");
      const lb = lamp("lb", 600, 550, "Luz B");
      return [
        rule(eq, "series", [bC], "Cocina"),
        rule(ld, "series", [bD, c1, c2], "Comedor"),
        rule(lb, "series", [bB, sw], "Baño")
      ];
    }
  },

    {
    id: "taller-diag-corto",
    headline: "Diagnóstico · Cortocircuito en tablero TDA y enchufe con tierra PE",
    objective: "Diagnóstico de Cortocircuito: Una conexión incorrecta en el tablero o en el artefacto une directamente la Fase con el Neutro, provocando el disparo del automático. Despeje de Falla: Utiliza la herramienta Borrador para eliminar el cortocircuito franco. Reconexión Conforme a Norma: Conecta la Fase desde la barra L del TDA a la entrada de bg; desde la salida de bg alimenta el borne L del enchufe. Puesta a Tierra PE (Normativa RIC N°10): Conecta el borne N al Neutro del TDA y el conductor verde desde la barra PE al borne PE del enchufe. Verificación: Cierra el automático bg para confirmar que el enchufe se energiza a 220 V con tierra segura sin disparar las protecciones.",
    success: "Cortocircuito despejado exitosamente y enchufe alimentado con protección termomagnética y tierra PE reglamentaria.",
    parts: "Un disyuntor de circuito (bg) y un enchufe con terminal de tierra PE.",
    build() {

      const bg = new Breaker("bg", 240, 340, "General");
      const e1 = socket("e1", 520, 340, "Falla");
      return [rule(e1, "series", [bg], "Falla")];
    }
  },

    {
    id: "taller-diag-retorno",
    headline: "Diagnóstico · Retorno invertido en circuito de escala 9/24",
    objective: "Diagnóstico de Conmutación: Si en un circuito 9/24 se invierte un puente viajero con el conductor de retorno, la lámpara presentará puntos muertos o no encenderá en ciertas posiciones. Alimentación y Protección: Conecta la Fase desde la barra L del TDA a la entrada de bg y desde su salida alimenta el común del primer 9/24 (c1). Puentes Viajeros Exclusivos: Conecta los bornes laterales viajeros entre c1 y c2 sin cruzar con el común. Retorno Exclusivo: Conecta únicamente el común del segundo 9/24 (c2) al centro de la lámpara l1 y cierra al Neutro del TDA. Verificación: Cierra el disyuntor bg y conmuta ambos interruptores comprobando la alternancia perfecta en las cuatro posiciones.",
    success: "Falla de retorno invertido resuelta: la conmutada 9/24 opera en todas sus combinaciones de mando.",
    parts: "Un disyuntor de circuito (bg), dos conmutadores 9/24 y una lámpara.",
    build() {

      const bg = new Breaker("bg", 240, 340, "General");
      const c1 = new Commutator("c1", 400, 340);
      const c2 = new Commutator("c2", 820, 340);
      const l1 = lamp("l1", 610, 220, "Luz");
      return [rule(l1, "series", [bg, c1, c2], "Luz")];
    }
  },

    {
    id: "taller-proyecto-maestro",
    headline: "Proyecto Maestro Final · Examen de acreditación SEC (Pliegos RIC)",
    objective: "Protección Principal y Distribución: Conecta la Fase desde la barra L del TDA al general bg y deriva su salida a los automáticos b1 (Alumbrado) y b2 (Fuerza). Circuito C-1 Alumbrado 9/32: Alimenta el común del interruptor triple 9/32 desde b1, conecta sus retornos independientes a l1, l2 y l3, y cierra con Neutro a los casquillos. Circuito C-2 Fuerza: Alimenta en paralelo los tomacorrientes e1 y e2 desde b2 y la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes. Verificación Final: Cierra todas las protecciones y comprueba el triple efecto de alumbrado, la energización de fuerza y la apertura del cuadro de cargas conforme a RIC N°02.",
    success: "¡Felicitaciones! Has completado el Proyecto Maestro de Instalaciones Eléctricas Domiciliarias conforme a los Pliegos Técnicos RIC de la SEC.",
    parts: "Tres automáticos (bg General, b1 Alumbrado, b2 Enchufes), un 9/32, tres lámparas y dos enchufes con tierra PE.",
    build() {

      const bg = new Breaker("bg", 230, 340, "General");
      const b1 = new Breaker("b1", 340, 180, "Ilum");
      const b2 = new Breaker("b2", 340, 500, "Fuerza");
      const tri = new Gang("tri", 540, 180, "9/32", ["1", "2", "3"]);
      const l1 = lamp("l1", 770, 90, "Z1");
      const l2 = lamp("l2", 770, 190, "Z2");
      const l3 = lamp("l3", 770, 290, "Z3");
      const e1 = socket("e1", 540, 500, "E1");
      const e2 = socket("e2", 770, 500, "E2");
      return [
        rule(l1, "series", [bg, b1, tri.keys["1"]], "Z1"),
        rule(l2, "series", [bg, b1, tri.keys["2"]], "Z2"),
        rule(l3, "series", [bg, b1, tri.keys["3"]], "Z3"),
        rule(e1, "series", [bg, b2], "E1"),
        rule(e2, "series", [bg, b2], "E2")
      ];
    }
  }
];

function graph() {
  const adjacency = new Map(nodes.map((node) => [node, []]));
  wires.forEach((wire) => {
    if (adjacency.has(wire.from) && adjacency.has(wire.to)) {
      adjacency.get(wire.from).push(wire.to);
      adjacency.get(wire.to).push(wire.from);
    }
  });
  components.forEach((component) => {
    component.internalEdges().forEach(([a, b]) => {
      if (adjacency.has(a) && adjacency.has(b)) {
        adjacency.get(a).push(b);
        adjacency.get(b).push(a);
      }
    });
  });
  // Barra PE del tablero: enlace equipotencial interno entre bornes de tierra
  const pe1 = nodes.find((n) => n.id === "tda-bar-pe1");
  const pe2 = nodes.find((n) => n.id === "tda-bar-pe2");
  if (pe1 && pe2 && adjacency.has(pe1) && adjacency.has(pe2)) {
    adjacency.get(pe1).push(pe2);
    adjacency.get(pe2).push(pe1);
  }
  return adjacency;
}

function reachable(start, goal) {
  if (!start || !goal) return false;
  const edges = graph();
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const current = queue.shift();
    if (current === goal) return true;
    (edges.get(current) || []).forEach((next) => {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    });
  }
  return false;
}

function phaseReaches(load) {
  const phase = activeLevel.phase;
  return reachable(phase, load.input) || reachable(phase, load.output);
}

function energized(load) {
  if (reachable(activeLevel.phase, activeLevel.neutral)) return false;
  const phaseInput = reachable(activeLevel.phase, load.input);
  const phaseOutput = reachable(activeLevel.phase, load.output);
  const neutralInput = reachable(activeLevel.neutral, load.input);
  const neutralOutput = reachable(activeLevel.neutral, load.output);
  return (phaseInput && neutralOutput) || (phaseOutput && neutralInput);
}

function isGrounded(load) {
  if (!load || load.kind !== "socket") return true;
  return typeof load.isGrounded === "function" ? load.isGrounded() : true;
}

function touched(load) {
  return wires.some((wire) =>
    wire.from === load.input || wire.to === load.input ||
    wire.from === load.output || wire.to === load.output ||
    (load.earth && (wire.from === load.earth || wire.to === load.earth))
  );
}

function withState(fn) {
  const snaps = components.map((component) => component.snapshot());
  try {
    return fn();
  } finally {
    components.forEach((component, index) => component.restoreSnap(snaps[index]));
  }
}

function withAllOpen(fn) {
  components.forEach((component) => {
    if (!component.isBoard) component.isolateAll();
  });
  try {
    return fn();
  } finally {
    components.forEach((component) => {
      if (!component.isBoard) component.restoreAll();
    });
  }
}

function togglesLoad(load, control) {
  return withState(() => {
    if (typeof control.toggle === "function") {
      control.toggle();
    } else if ("closed" in control) {
      control.closed = !control.closed;
    }
    return !energized(load);
  });
}

function phaseSeparates(load, control) {
  control.isolate();
  try {
    return !phaseReaches(load);
  } finally {
    control.restore();
  }
}

function isManual(control) {
  return control instanceof Switch || control instanceof Key || control instanceof Bipolar || control instanceof Breaker;
}

function judge(item) {
  const load = item.ref;
  const lit = energized(load);
  const grounded = isGrounded(load);

  if (!touched(load)) return { name: item.name, ok: false, lit: false, hint: `Falta continuidad en ${item.name}.` };

  if (item.kind === "series") {
    if (!lit) {
      const open = item.controls.some((control) => isManual(control) && control.closed === false);
      if (open) return { name: item.name, ok: false, lit: false, hint: `Cierra el mando de ${item.name}.` };
      const commute = item.controls.some((control) => control instanceof Commutator || control instanceof Crossover);
      return {
        name: item.name,
        ok: false,
        lit: false,
        hint: commute ? `Prueba la otra posición del conmutador. En esta, la fase no llega a ${item.name}.` : `Falta continuidad en ${item.name}.`,
      };
    }
    const gated = item.controls.every((control) => phaseSeparates(load, control) && togglesLoad(load, control));
    if (!gated) return { name: item.name, ok: false, lit: true, hint: item.fix || FIX.series };
    if (!grounded) {
      return {
        name: item.name,
        ok: false,
        lit: true,
        hint: `Normativa RIC N°10: ${item.name} tiene tensión, pero falta conectar el cable de tierra (PE verde) a la barra PE del tablero.`,
      };
    }
    return { name: item.name, ok: true, lit: true, hint: "" };
  }

  if (item.kind === "hot") {
    if (!lit) return { name: item.name, ok: false, lit: false, hint: `Falta continuidad en ${item.name}.` };
    const still = withAllOpen(() => energized(load));
    if (!still) return { name: item.name, ok: false, lit: true, hint: item.fix || FIX.hot };
    if (!grounded) {
      return {
        name: item.name,
        ok: false,
        lit: true,
        hint: `Normativa RIC N°10: ${item.name} tiene tensión, pero falta conectar el cable de tierra (PE verde) a la barra PE del tablero.`,
      };
    }
    return { name: item.name, ok: true, lit: true, hint: "" };
  }

  if (item.kind === "parallel") {
    const separated = withState(() => {
      item.controls.forEach((control) => { control.closed = false; });
      return !phaseReaches(load);
    });
    const each = separated && item.controls.every((control) => withState(() => {
      item.controls.forEach((other) => { other.closed = false; });
      control.closed = true;
      return energized(load);
    }));
    if (!each) return { name: item.name, ok: false, lit, hint: item.fix || FIX.parallel };
    if (!grounded) {
      return {
        name: item.name,
        ok: false,
        lit: true,
        hint: `Normativa RIC N°10: ${item.name} tiene tensión, pero falta conectar el cable de tierra (PE verde) a la barra PE del tablero.`,
      };
    }
    return { name: item.name, ok: true, lit: true, hint: "" };
  }

  // Bipolar
  const bip = item.controls[0];
  const connectsToBip = bip && (
    reachable(bip.fi, load.input) || reachable(bip.fo, load.input) ||
    reachable(bip.ni, load.output) || reachable(bip.no, load.output)
  );
  if (!connectsToBip && lit && withAllOpen(() => energized(load))) {
    if (!grounded) {
      return {
        name: item.name,
        ok: false,
        lit: true,
        hint: `Normativa RIC N°10: ${item.name} tiene tensión, pero falta conectar el cable de tierra ininterrumpido (PE verde) desde la barra PE del TDA.`,
      };
    }
    return { name: item.name, ok: true, lit: true, hint: "" };
  }
  if (!lit) {
    if (!bip.closed) {
      const wouldEnergize = withState(() => {
        bip.closed = true;
        return energized(load);
      });
      if (wouldEnergize) {
        return { name: item.name, ok: false, lit: false, hint: "Cierra el corte bipolar." };
      }
    }
    return { name: item.name, ok: false, lit: false, hint: `Falta continuidad en ${item.name}.` };
  }

  if (!bip.closed) {
    return { name: item.name, ok: false, lit: true, hint: item.fix || FIX.bipolar };
  }
  
  const drops = ["poleL", "poleN"].every((pole) => {
    const previous = bip[pole];
    bip[pole] = false;
    try {
      return !energized(load);
    } finally {
      bip[pole] = previous;
    }
  });

  const phaseDrops = ["poleL", "poleN"].filter((pole) => {
    const previous = bip[pole];
    bip[pole] = false;
    try {
      return !phaseReaches(load);
    } finally {
      bip[pole] = previous;
    }
  }).length;

  if (!drops || phaseDrops !== 1) {
    return { name: item.name, ok: false, lit: true, hint: item.fix || FIX.bipolar };
  }

  if (!grounded) {
    return {
      name: item.name,
      ok: false,
      lit: true,
      hint: `Normativa RIC N°10: ${item.name} tiene tensión, pero falta conectar el cable de tierra ininterrumpido (PE verde) desde la barra PE del TDA.`,
    };
  }

  return { name: item.name, ok: true, lit: true, hint: "" };
}

function analizarCircuito() {
  if (!activeLevel) return circuitAnalysis;
  const pe1 = nodes.find((n) => n.id === "tda-bar-pe1");
  const pe2 = nodes.find((n) => n.id === "tda-bar-pe2");

  // Verificación de cortocircuitos y fallas a tierra (RIC N°02 y RIC N°06)
  const shortLN = reachable(activeLevel.phase, activeLevel.neutral);
  const shortLPE = (pe1 && reachable(activeLevel.phase, pe1)) || (pe2 && reachable(activeLevel.phase, pe2));
  const shortNPE = (pe1 && reachable(activeLevel.neutral, pe1)) || (pe2 && reachable(activeLevel.neutral, pe2));
  const earthShock = activeLevel.rules.some((r) => r.ref && r.ref.earth && reachable(activeLevel.phase, r.ref.earth));

  let short = false;
  let loads;

  if (shortLPE) {
    short = true;
    activeLevel.rules.forEach((item) => { item.ref.on = false; });
    loads = activeLevel.rules.map((item) => ({
      name: item.name,
      ok: false,
      lit: false,
      hint: "¡Disparo de Diferencial! Cortocircuito de Fase a Tierra (PE). La protección diferencial operó por corriente de fuga (RIC N°06). Levanta ese cable.",
    }));
  } else if (shortNPE) {
    short = true;
    activeLevel.rules.forEach((item) => { item.ref.on = false; });
    loads = activeLevel.rules.map((item) => ({
      name: item.name,
      ok: false,
      lit: false,
      hint: "¡Fuga neutro-tierra! El Neutro tocó la Tierra de protección PE aguas abajo del diferencial (RIC N°06). Separa el Neutro de la Tierra.",
    }));
  } else if (earthShock && !shortLPE) {
    short = true;
    activeLevel.rules.forEach((item) => { item.ref.on = false; });
    loads = activeLevel.rules.map((item) => ({
      name: item.name,
      ok: false,
      lit: false,
      hint: "¡Peligro de electrocución! Conectaste la Fase al borne de Tierra de protección (PE) del enchufe. Corrige esa conexión de inmediato.",
    }));
  } else if (shortLN) {
    short = true;
    activeLevel.rules.forEach((item) => { item.ref.on = false; });
    loads = activeLevel.rules.map((item) => ({
      name: item.name,
      ok: false,
      lit: false,
      hint: "La fase llega al neutro sin atravesar una carga. El automático termomagnético operó por cortocircuito. Levanta ese cable.",
    }));
  } else {
    loads = activeLevel.rules.map((item) => {
      const result = judge(item);
      item.ref.on = result.lit;
      return result;
    });
  }

  const wasComplete = circuitAnalysis && circuitAnalysis.complete;
  const complete = !short && loads.every((item) => item.ok);
  if (complete && !wasComplete) {
    dockedLoadTable = true;
    showLoadTable = true;
  }
  const done = loads.filter((item) => item.ok).length;
  let title = "Circuito en Espera";
  let help = "Canaliza Fase (L) y Neutro (N) desde el tablero TDA hacia los mandos y artefactos según el objetivo.";
  let color = "";

  // Check board power status
  const boardPoweredL = activeLevel.busPhase ? reachable(activeLevel.phase, activeLevel.busPhase) : true;
  const boardPoweredN = activeLevel.busNeutral ? reachable(activeLevel.neutral, activeLevel.busNeutral) : true;

  const circuitWires = wires.filter((w) => (typeof isBoardWire === "function" ? !isBoardWire(w) : true));

  if (shortLPE) {
    title = "¡Falla a tierra (Diferencial)!";
    help = loads[0].hint;
    color = COLORS.fase;
  } else if (shortNPE) {
    title = "¡Fuga Neutro-Tierra!";
    help = loads[0].hint;
    color = COLORS.fase;
  } else if (earthShock) {
    title = "¡Peligro Vital · Tierra Energizada!";
    help = loads[0].hint;
    color = COLORS.fase;
  } else if (shortLN) {
    title = "¡Cortocircuito Franco (Fase - Neutro)!";
    help = loads[0].hint;
    color = COLORS.fase;
  } else if (!boardPoweredL || !boardPoweredN) {
    if (activeLevel.tm && !activeLevel.tm.closed) {
      title = "Automático abierto (0)";
      help = "El automático termomagnético del TDA está abierto (posición 0). Haz clic en él para energizar.";
      color = COLORS.amber;
    } else if (activeLevel.dif && !activeLevel.dif.closed) {
      title = "Diferencial abierto (0)";
      help = "El protector diferencial del TDA está abierto o disparado (posición 0). Haz clic en su palanca para rearmar.";
      color = COLORS.amber;
    } else {
      title = "Tablero sin conexión";
      help = "Falta cablear el tablero TDA: Red ➔ Termomagnético ➔ Diferencial ➔ Barras L/N (o pulsa '🔌 Cablear Tablero').";
      color = COLORS.amber;
    }
  } else if (complete) {
    title = "¡Circuito Conforme a Norma!";
    help = activeLevel.success || "¡Excelente! Todas las cargas operan correctamente y cumplen con la normativa eléctrica SEC.";
    color = COLORS.green;
  } else if (loads.some((item) => item.lit && item.hint && item.hint.includes("RIC N°10"))) {
    const ungrounded = loads.find((item) => item.lit && item.hint && item.hint.includes("RIC N°10"));
    title = "Falta tierra de protección (PE)";
    help = ungrounded.hint;
    color = COLORS.amber;
  } else if (done > 0) {
    title = `${done} de ${loads.length} Cargas Operativas`;
    help = loads.find((item) => !item.ok)?.hint || "Continúa canalizando las cargas restantes.";
    color = COLORS.amber;
  } else if (loads.some((item) => item.lit)) {
    title = "Control Fuera de Norma";
    help = loads.find((item) => !item.ok)?.hint || "Revisa el conexionado del mando o interruptor.";
    color = COLORS.amber;
  } else if (circuitWires.length > 0) {
    title = "Circuito en Montaje";
    help = loads.find((item) => !item.ok)?.hint || "Completa la canalización entre la salida del mando y el borne de la carga.";
    color = COLORS.amber;
  } else {
    title = "Circuito en Espera";
    help = "Canaliza Fase (L) y Neutro (N) desde el tablero TDA hacia los mandos y artefactos según el objetivo.";
    color = "";
  }
  circuitAnalysis = { short, complete, loads, title, help, color };
  const status = document.querySelector("#circuit-status");
  const note = document.querySelector("#circuit-help");
  if (status) {
    status.textContent = title;
    status.style.color = color;
    const statCard = status.closest(".status-card");
    if (statCard) {
      if (color === COLORS.red || color === COLORS.fase) { statCard.style.background = "var(--hot-bg)"; statCard.style.borderColor = "var(--red)"; }
      else if (color === COLORS.green) { statCard.style.background = "var(--ok-bg)"; statCard.style.borderColor = "var(--green)"; }
      else if (color === COLORS.amber) { statCard.style.background = "var(--micro-bg)"; statCard.style.borderColor = "var(--amber)"; }
      else { statCard.style.background = "var(--micro-bg)"; statCard.style.borderColor = "var(--cyan)"; }
    }
  }
  if (note) note.textContent = help;
  const next = document.querySelector("#next-level");
  if (next) next.classList.toggle("ready", complete);
  return circuitAnalysis;
}

function layoutWarnings() {
  const warnings = [];
  const hit = 24;
  nodes.forEach((node, index) => {
    if (node.x - node.radius < 8 || node.y - node.radius < 46 || node.x + node.radius > width - 8 || node.y + node.radius > height - 18) {
      warnings.push(`borde ${node.id}`);
    }
    const isBoardNode = node.id.startsWith("tda-") || node.id === "phase" || node.id === "neutral";
    if (!isBoardNode && node.x - node.radius < 158) warnings.push(`tablero ${node.id}`);
    nodes.slice(index + 1).forEach((other) => {
      const otherBoard = other.id.startsWith("tda-") || other.id === "phase" || other.id === "neutral";
      if (isBoardNode || otherBoard) return;
      if (dist(node.x, node.y, other.x, other.y) < hit * 2) warnings.push(`cerca ${node.id} ${other.id}`);
    });
  });
  components.forEach((component, index) => {
    if (component.isBoard) return;
    if (component.x - component.w / 2 < 158) warnings.push(`caja ${component.id}`);
    if (component.y + component.h / 2 + 22 > height - 4) warnings.push(`caption ${component.id}`);
    if (component.y - component.h / 2 < 46) warnings.push(`top ${component.id}`);
    components.slice(index + 1).forEach((other) => {
      if (other.isBoard) return;
      const overlaps = Math.abs(component.x - other.x) < (component.w + other.w) / 2 + 10
        && Math.abs(component.y - other.y) < (component.h + other.h) / 2 + 10;
      if (overlaps) warnings.push(`solape ${component.id} ${other.id}`);
    });
    nodes.forEach((node) => {
      if (node.owner === component || node.id === "phase" || node.id === "neutral" || node.id.startsWith("tda-")) return;
      const inside = Math.abs(node.x - component.x) < component.w / 2 + node.radius
        && Math.abs(node.y - component.y) < component.h / 2 + node.radius;
      if (inside) warnings.push(`nodo ${node.id} en ${component.id}`);
    });
  });
  return warnings;
}

function syncChrome() {
  const select = document.querySelector("#level-select");
  select.value = activeLevel.id;
  const option = select.selectedOptions[0];
  const badge = document.querySelector("#level-difficulty");
  badge.dataset.tier = option.dataset.tier;
  badge.textContent = `${option.dataset.tierLabel} · plantilla ${option.dataset.index} de ${select.options.length}`;
  const tab = document.querySelector(`.tier-tabs button[data-tier="${option.dataset.tier}"]`);
  document.querySelector("#tier-blurb").textContent = tab.dataset.blurb;
  document.querySelectorAll(".tier-tabs button").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.tier === option.dataset.tier ? "true" : "false");
  });
  document.querySelector("#level-title").textContent = activeLevel.headline;
  
  document.querySelector("#level-objective").textContent = activeLevel.objective;
  
  const tut = document.querySelector("#level-tutorial");
  if (tut) {
    tut.innerHTML = "";
    const rawSteps = activeLevel.objective
      .split(/(?<=\.)\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    rawSteps.forEach(step => {
      const li = document.createElement("li");
      if (step.includes(":")) {
        const colonIdx = step.indexOf(":");
        const label = step.slice(0, colonIdx);
        const rest = step.slice(colonIdx + 1);
        const b = document.createElement("strong");
        b.textContent = label + ": ";
        b.style.color = "var(--cyan)";
        li.appendChild(b);
        li.appendChild(document.createTextNode(rest.trim()));
      } else {
        li.textContent = step;
      }
      tut.appendChild(li);
    });
  }

  document.querySelector("#level-parts").textContent = activeLevel.parts;
  const next = document.querySelector("#next-level");
  next.disabled = [...select.options].findIndex((item) => item.value === activeLevel.id) === select.options.length - 1;
  if (canvasElt) canvasElt.setAttribute("aria-label", `${activeLevel.headline}. ${activeLevel.objective}`);
}

const VALID_BOARD_CONNECTIONS = new Set([
  ["tda-red-l", "tda-tm-in"].sort().join("::"),
  ["tda-tm-out", "tda-dif-in-l"].sort().join("::"),
  ["tda-dif-out-l", "tda-bar-l-1"].sort().join("::"),
  ["tda-red-n", "tda-dif-in-n"].sort().join("::"),
  ["tda-dif-out-n", "tda-bar-n-1"].sort().join("::"),
]);

function isBoardWire(wire) {
  const key = [wire.from.id, wire.to.id].sort().join("::");
  return VALID_BOARD_CONNECTIONS.has(key);
}

function autoWireTdaInternal() {
  const INTERNAL_TDA_NODES = new Set([
    "tda-red-l", "tda-red-n",
    "tda-tm-in", "tda-tm-out",
    "tda-dif-in-l", "tda-dif-out-l",
    "tda-dif-in-n", "tda-dif-out-n",
  ]);
  wires = wires.filter(w => !isBoardWire(w) && !INTERNAL_TDA_NODES.has(w.from.id) && !INTERNAL_TDA_NODES.has(w.to.id));

  // Secuencia reglamentaria RIC N°02:
  // Fase: Red L -> Termomagnético Entrada -> Termomagnético Salida -> Diferencial Entrada L -> Diferencial Salida L -> Barra Fase
  connect("tda-red-l", "tda-tm-in", "fase");
  connect("tda-tm-out", "tda-dif-in-l", "fase");
  connect("tda-dif-out-l", "tda-bar-l-1", "fase");

  // Neutro: Red N -> Diferencial Entrada N -> Diferencial Salida N -> Barra Neutro
  connect("tda-red-n", "tda-dif-in-n", "neutro");
  connect("tda-dif-out-n", "tda-bar-n-1", "neutro");

  if (activeLevel) {
    if (activeLevel.tm) activeLevel.tm.closed = true;
    if (activeLevel.dif) activeLevel.dif.closed = true;
  }
}

function autoWireScenario() {
  const phase = "phase";
  const neutral = "neutral";
  const pe = "tda-bar-pe1";

  const safeConnect = (from, to, type = "fase") => {
    if (!from || !to) return;
    const fId = typeof from === "string" ? from : from.id;
    const tId = typeof to === "string" ? to : to.id;
    connect(fId, tId, type);
  };

  if (!activeLevel || !activeLevel.rules) return;

  activeLevel.rules.forEach((item) => {
    const load = item.ref;
    if (!load) return;

    if (item.kind === "hot") {
      safeConnect(phase, load.input, "fase");
      safeConnect(load.output, neutral, "neutro");
      if (load.earth) safeConnect(pe, load.earth, "tierra");
    } else if (item.kind === "bipolar") {
      const bip = item.controls[0];
      if (activeLevel.id === "cocina") {
        // En cocina el pliego exige conexión directa a barra L/N con tierra PE ininterrumpida
        safeConnect(phase, load.input, "fase");
        safeConnect(load.output, neutral, "neutro");
      } else if (bip) {
        safeConnect(phase, bip.fi, "fase");
        safeConnect(neutral, bip.ni, "neutro");
        safeConnect(bip.fo, load.input, "fase");
        safeConnect(bip.no, load.output, "neutro");
        bip.closed = true;
      } else {
        safeConnect(phase, load.input, "fase");
        safeConnect(load.output, neutral, "neutro");
      }
      if (load.earth) safeConnect(pe, load.earth, "tierra");
    } else if (item.kind === "parallel") {
      item.controls.forEach((c) => {
        safeConnect(phase, c.a, "fase");
        safeConnect(c.b, load.input, "fase");
        c.closed = true;
      });
      safeConnect(load.output, neutral, "neutro");
      if (load.earth) safeConnect(pe, load.earth, "tierra");
    } else if (item.kind === "series") {
      let currentSource = phase;
      let idx = 0;
      const ctrls = item.controls || [];

      while (idx < ctrls.length && ctrls[idx].constructor.name === "Breaker") {
        const brk = ctrls[idx];
        const inN = brk.a || brk.inNode;
        const outN = brk.b || brk.outNode;
        safeConnect(currentSource, inN, "fase");
        currentSource = outN;
        brk.closed = true;
        idx++;
      }

      if (idx >= ctrls.length) {
        safeConnect(currentSource, load.input, "fase");
        safeConnect(load.output, neutral, "neutro");
        if (load.earth) safeConnect(pe, load.earth, "tierra");
      } else {
        const ctrl = ctrls[idx];
        if (ctrl.constructor.name === "Switch") {
          safeConnect(currentSource, ctrl.a, "fase");
          safeConnect(ctrl.b, load.input, "fase");
          safeConnect(load.output, neutral, "neutro");
          ctrl.closed = true;
          if (load.earth) safeConnect(pe, load.earth, "tierra");
        } else if (ctrl.constructor.name === "Key") {
          const host = ctrl.host;
          if (host && host.common) safeConnect(currentSource, host.common, "fase");
          safeConnect(ctrl.node, load.input, "fase");
          safeConnect(load.output, neutral, "neutro");
          ctrl.closed = true;
          if (load.earth) safeConnect(pe, load.earth, "tierra");
        } else if (ctrl.constructor.name === "Commutator") {
          const comm1 = ctrl;
          safeConnect(currentSource, comm1.common, "fase");
          comm1.selected = "a";
          let prevA = comm1.a;
          let prevB = comm1.b;
          idx++;
          while (idx < ctrls.length && ctrls[idx].constructor.name === "Crossover") {
            const cross = ctrls[idx];
            safeConnect(prevA, cross.a1, "fase");
            safeConnect(prevB, cross.a2, "fase");
            prevA = cross.b1;
            prevB = cross.b2;
            cross.straight = true;
            idx++;
          }
          if (idx < ctrls.length && ctrls[idx].constructor.name === "Commutator") {
            const comm2 = ctrls[idx];
            safeConnect(prevA, comm2.a, "fase");
            safeConnect(prevB, comm2.b, "fase");
            safeConnect(comm2.common, load.input, "fase");
            comm2.selected = "a";
          }
          safeConnect(load.output, neutral, "neutro");
          if (load.earth) safeConnect(pe, load.earth, "tierra");
        }
      }
    }
  });
}

function autoWireBoard(fullScenario = false) {
  if (fullScenario) {
    showWelcomeModal = false;
    dockedLoadTable = true;
    showLoadTable = true;
  }

  autoWireTdaInternal();

  if (fullScenario && activeLevel && activeLevel.rules) {
    autoWireScenario();
  }

  analizarCircuito();
}

function loadLevel(id) {
  const def = LEVELS.find((level) => level.id === id) || LEVELS[0];
  nodes = [];
  wires = [];
  components = [];
  draggingFrom = null;
  heldPush = null;
  showWelcomeModal = true;
  dockedLoadTable = false;
  showLoadTable = true;

  // 1. Bornes de Red Eléctrica 220V (Alimentación General)
  const redL = new Node("tda-red-l", 64, 86, "fase", "Red L");
  redL.labelPos = "top";
  const redN = new Node("tda-red-n", 132, 86, "neutro", "Red N");
  redN.labelPos = "top";
  nodes.push(redL, redN);

  // 2. Automático Termomagnético (MCB) - PRIMERO según requerimiento y norma RIC N°02
  const isPower = def.headline.toLowerCase().includes("enchufe") || def.headline.toLowerCase().includes("fuerza");
  const breakerRating = isPower ? "16A" : "10A";
  const tm = new BoardBreaker("tda-tm", 98, 160, `Automático ${breakerRating}`, breakerRating);

  // 3. Disyuntor Diferencial (RCD) - LUEGO según requerimiento
  const dif = new BoardDifferential("tda-dif", 98, 292, "Diferencial 25A 30mA", "25A / 30mA");

  // 4. Barras de Distribución (Busbars)
  const busL = new DistributionBus("tda-bar-l", 64, 470, "fase", "Barra Fase");
  const busN = new DistributionBus("tda-bar-n", 132, 470, "neutro", "Barra Neutro");

  // 5. Barra de Tierra PE
  const peBarY = tableroBox.y + tableroBox.h - 44;
  const pe1 = new Node("tda-bar-pe1", Math.round(tableroBox.x + tableroBox.w * 0.35), peBarY + 14, "tierra", "PE 1");
  pe1.labelPos = "bottom";
  const pe2 = new Node("tda-bar-pe2", Math.round(tableroBox.x + tableroBox.w * 0.65), peBarY + 14, "tierra", "PE 2");
  pe2.labelPos = "bottom";
  nodes.push(pe1, pe2);

  const phase = busL.n2;
  const neutral = busN.n2;

  activeLevel = {
    id: def.id,
    headline: def.headline,
    objective: def.objective,
    success: def.success,
    parts: def.parts,
    phase: redL,
    neutral: redN,
    busPhase: phase,
    busNeutral: neutral,
    gridL: redL,
    gridN: redN,
    tm,
    dif,
    busL,
    busN,
    rules: def.build(),
  };

  // Cablear el tablero internamente siguiendo la norma
  autoWireBoard();

  syncChrome();
  analizarCircuito();
  const warnings = layoutWarnings();
  if (warnings.length) console.warn(def.id, warnings);
  return warnings;
}

function hasWire(a, b) {
  const key = [a.id, b.id].sort().join("::");
  return wires.some((wire) => wire.key() === key);
}

function connect(fromId, toId, type = selectedWireType) {
  const from = nodes.find((node) => node.id === fromId);
  const to = nodes.find((node) => node.id === toId);
  if (!from || !to || from === to || hasWire(from, to)) return false;
  wires.push(new Wire(from, to, type));
  analizarCircuito();
  return true;
}

function clearWires() {
  wires = wires.filter(isBoardWire);
  if (wires.length === 0) autoWireBoard();
  components.forEach((component) => component.reset());
  heldPush = null;
  draggingFrom = null;
  showWelcomeModal = false;
  dockedLoadTable = true;
  showLoadTable = true;
  analizarCircuito();
}

function nodeAt(x, y) {
  return nodes.find((node) => node.isHovered(x, y));
}

function componentAt(x, y) {
  return components
    .filter((component) => component.contains(x, y))
    .sort((a, b) => dist(x, y, a.x, a.y) - dist(x, y, b.x, b.y))[0] || null;
}

function drawTablero() {
  const isDay = document.documentElement.getAttribute("data-theme") === "day";
  const { x, y, w, h } = tableroBox;
  push();
  rectMode(CORNER);

  // Sombra suave del gabinete exterior
  fill(0, 0, 0, isDay ? 15 : 40);
  noStroke();
  rect(x + 2, y + 4, w, h, 14);

  // Gabinete exterior del TDA
  fill(isDay ? "#f8fafc" : "#131722");
  stroke(isDay ? "#94a3b8" : "#334155");
  strokeWeight(2.5);
  rect(x, y, w, h, 14);

  // Cabezal superior del TDA (Panel de título independiente para evitar colisión con Red L / N)
  fill(isDay ? "#e2e8f0" : "#1e2433");
  stroke(isDay ? "#cbd5e1" : "#2d3748");
  strokeWeight(1.2);
  rect(x + 6, y + 6, w - 12, 22, 6);

  fill(isDay ? "#0f172a" : "#f1f5f9");
  textAlign(CENTER, CENTER);
  textSize(11);
  if (typeof textStyle === "function") textStyle(BOLD);
  text("TDA · 220V", x + w / 2, y + 17);
  if (typeof textStyle === "function") textStyle(NORMAL);

  // Placa de montaje DIN interna
  fill(isDay ? "#e2e8f0" : "#1a202c");
  stroke(isDay ? "#cbd5e1" : "#2d3748");
  strokeWeight(1.5);
  rect(x + 6, y + 32, w - 12, h - 42, 10);

  // Rieles DIN metálicos
  fill(isDay ? "#cbd5e1" : "#2d3748");
  noStroke();
  rect(x + 10, 148, w - 20, 24, 3);
  rect(x + 10, 280, w - 20, 24, 3);
  rect(x + 10, 458, w - 20, 24, 3);

  // Barra de Puesta a Tierra (PE) según RIC N°02 y RIC N°06
  const peBarY = y + h - 44;
  const peBarH = 28;

  // Fondo aislante de la barra PE
  fill(isDay ? "#dcfce7" : "#064e3b");
  stroke(isDay ? "#16a34a" : "#10b981");
  strokeWeight(1.5);
  rect(x + 10, peBarY, w - 20, peBarH, 5);

  // Barra colectora de cobre/latón PE
  fill(isDay ? "#86efac" : "#047857");
  noStroke();
  rect(x + 18, peBarY + 10, w - 36, 8, 2);

  // Rótulo de la barra, claramente posicionado arriba de la barra para evitar solapes
  fill(isDay ? "#15803d" : "#6ee7b7");
  textSize(10);
  if (typeof textStyle === "function") textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("BARRA DE TIERRA (PE)", x + w / 2, peBarY - 10);
  if (typeof textStyle === "function") textStyle(NORMAL);

  // Manija de redimensionamiento (Resize Handle) en la esquina inferior derecha del recuadro
  const cornerX = x + w;
  const cornerY = y + h;
  stroke(isDay ? "#94a3b8" : "#64748b");
  strokeWeight(1.8);
  strokeCap(ROUND);
  line(cornerX - 6, cornerY - 16, cornerX - 16, cornerY - 6);
  line(cornerX - 6, cornerY - 11, cornerX - 11, cornerY - 6);
  line(cornerX - 6, cornerY - 6, cornerX - 6, cornerY - 6);
  pop();
}

function drawCanvasResizeHandle() {
  const isDay = document.documentElement.getAttribute("data-theme") === "day";
  push();
  stroke(isDay ? "rgba(99, 98, 124, 0.7)" : "rgba(173, 186, 209, 0.6)");
  strokeWeight(2);
  strokeCap(ROUND);
  line(width - 5, height - 17, width - 17, height - 5);
  line(width - 5, height - 12, width - 12, height - 5);
  line(width - 5, height - 7, width - 7, height - 5);
  pop();
}

function drawHud() {
  const isDay = document.documentElement.getAttribute("data-theme") === "day";
  push();
  noStroke();
  fill(isDay ? "#63627c" : "#98a1bb");
  textSize(12.5);
  textAlign(LEFT, CENTER);
  text("Arrastra de un borne a otro · Clic en el mando para conmutar · Tijera para cortar cables", 22, 16);
  if (!dockedLoadTable) {
    textAlign(RIGHT, CENTER);
    fill(isDay ? "#1e2230" : COLORS.ink);
    text(activeLevel ? activeLevel.headline : "", width - 22, 16);
  }
  pop();
}

function setup() {
  const canvas = createCanvas(1340, 680);
  canvas.parent("simulator-canvas");
  canvasElt = canvas.elt;
  pixelDensity(typeof window !== "undefined" && window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1);
  textFont("IBM Plex Sans, system-ui");
  const select = document.querySelector("#level-select");
  const optionIds = [...select.options].map((option) => option.value);
  const levelIds = LEVELS.map((level) => level.id);
  if (optionIds.join() !== levelIds.join()) console.error("Catálogo distinto", optionIds, levelIds);
  select.addEventListener("change", () => loadLevel(select.value));
  const wireTdaBtn = document.querySelector("#wire-tda");
  if (wireTdaBtn) {
    wireTdaBtn.addEventListener("click", () => {
      autoWireBoard(true);
    });
  }
  const tableBtn = document.querySelector("#toggle-load-table");
  if (tableBtn) {
    tableBtn.addEventListener("click", () => {
      if (showWelcomeModal) {
        showWelcomeModal = false;
        dockedLoadTable = true;
        showLoadTable = true;
      } else {
        if (!dockedLoadTable) {
          dockedLoadTable = true;
          showLoadTable = true;
        } else {
          showWelcomeModal = true;
        }
      }
    });
  }
  document.querySelector("#undo-wire").addEventListener("click", () => {
    if (wires.length > 0) {
      wires.pop();
      analizarCircuito();
    }
  });
  // Atajo universal Ctrl+Z / Cmd+Z para deshacer cables, y ESC / Enter para aceptar cuadro
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Enter") {
      if (showWelcomeModal) {
        showWelcomeModal = false;
        dockedLoadTable = true;
        showLoadTable = true;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (wires.length > 0) {
        wires.pop();
        analizarCircuito();
      }
    }
  });
  document.querySelector("#clear-wires").addEventListener("click", clearWires);
  document.querySelector("#next-level").addEventListener("click", () => {
    const options = [...select.options];
    const index = options.findIndex((option) => option.value === select.value);
    if (index >= 0 && index < options.length - 1) {
      select.value = options[index + 1].value;
      loadLevel(select.value);
    }
  });
  document.querySelectorAll(".tier-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      const current = select.selectedOptions[0];
      if (!current || current.dataset.tier !== button.dataset.tier) {
        select.value = button.dataset.first;
        loadLevel(select.value);
      }
    });
  });
  const setWireType = (type) => {
    selectedWireType = type;
    document.querySelectorAll(".wire-tool").forEach((item) => {
      item.classList.toggle("active", item.dataset.wireType === type);
    });
  };

  document.querySelectorAll(".wire-tool").forEach((button) => {
    button.addEventListener("click", () => {
      setWireType(button.dataset.wireType);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key === "1") setWireType("fase");
    else if (e.key === "2") setWireType("neutro");
    else if (e.key === "3") setWireType("tierra");
    else if (e.key === "4" || e.key.toLowerCase() === "b") setWireType("eraser");
  });
  loadLevel(select.value || "dormitorio-912");
}

// ============================================================================
// EFECTO DE TEASER / TASER Y LUZ ESTROBER (CORTOCIRCUITOS Y CONEXIONES ERRÓNEAS)
// ============================================================================
let teaserSparks = [];

function spawnTeaserSparks(x, y, count = 4) {
  if (teaserSparks.length > 70) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 3;
    teaserSparks.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      life: Math.floor(Math.random() * 14 + 14),
      maxLife: 28,
      size: Math.random() * 2.5 + 1.5,
    });
  }
}

function updateAndDrawTeaserSparks() {
  if (teaserSparks.length === 0) return;
  push();
  for (let i = 0; i < teaserSparks.length; i++) {
    const s = teaserSparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.38;
    s.vx *= 0.96;
    s.life--;

    const ratio = Math.max(0, s.life / s.maxLife);
    if (s.life > 14) {
      stroke("#ffffff");
    } else if (s.life > 7) {
      stroke("#ffea00");
    } else {
      stroke("#ff3d00");
    }
    strokeWeight(Math.max(1, s.size * ratio));
    line(s.x, s.y, s.x - s.vx * 1.6, s.y - s.vy * 1.6);
  }
  teaserSparks = teaserSparks.filter((s) => s.life > 0);
  pop();
}

function drawTeaserLightning(x1, y1, x2, y2, displace = 22, branches = 2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (d < 4) return;
  const numSegments = Math.max(5, Math.min(16, Math.floor(d / 20)));

  const dx = (x2 - x1) / numSegments;
  const dy = (y2 - y1) / numSegments;
  const mag = Math.hypot(dx, dy) || 1;
  const perpX = -dy / mag;
  const perpY = dx / mag;

  const pts = [{ x: x1, y: y1 }];
  for (let i = 1; i < numSegments; i++) {
    const baseX = x1 + dx * i;
    const baseY = y1 + dy * i;
    const envelope = Math.sin((i / numSegments) * Math.PI) * displace;
    const offset = (Math.random() - 0.5) * envelope * 2;
    pts.push({ x: baseX + perpX * offset, y: baseY + perpY * offset });
  }
  pts.push({ x: x2, y: y2 });

  push();
  // Capa 1: Resplandor exterior (cian neón de alto voltaje)
  stroke("#00e5ff");
  strokeWeight(6);
  for (let i = 0; i < pts.length - 1; i++) {
    line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  }

  // Capa 2: Arco intermedio (plasma azul claro)
  stroke("#80f0ff");
  strokeWeight(3.5);
  for (let i = 0; i < pts.length - 1; i++) {
    line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  }

  // Capa 3: Núcleo ardiente de alta tensión (blanco incandescente)
  stroke("#ffffff");
  strokeWeight(1.5);
  for (let i = 0; i < pts.length - 1; i++) {
    line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  }

  // Ramificaciones secundarias del teaser (sub-arcos salvajes)
  if (branches > 0 && pts.length > 4) {
    const bIdx = Math.floor(Math.random() * (pts.length - 3)) + 1;
    const startPt = pts[bIdx];
    let bx = startPt.x;
    let by = startPt.y;
    const bAngle = Math.random() * Math.PI * 2;
    const bLen = Math.random() * 26 + 12;
    const steps = 3;
    stroke("#80f0ff");
    strokeWeight(1.8);
    for (let s = 1; s <= steps; s++) {
      const nextBx = bx + Math.cos(bAngle + (Math.random() - 0.5) * 0.9) * (bLen / steps);
      const nextBy = by + Math.sin(bAngle + (Math.random() - 0.5) * 0.9) * (bLen / steps);
      line(bx, by, nextBx, nextBy);
      bx = nextBx;
      by = nextBy;
    }
  }
  pop();
}

function findFaultPath() {
  if (!activeLevel) return null;
  const pe1 = nodes.find((n) => n.id === "tda-bar-pe1");
  const pe2 = nodes.find((n) => n.id === "tda-bar-pe2");
  const shortLN = reachable(activeLevel.phase, activeLevel.neutral);
  const shortLPE = (pe1 && reachable(activeLevel.phase, pe1)) || (pe2 && reachable(activeLevel.phase, pe2));
  const shortNPE = (pe1 && reachable(activeLevel.neutral, pe1)) || (pe2 && reachable(activeLevel.neutral, pe2));
  const earthShockRule = activeLevel.rules && activeLevel.rules.find((r) => r.ref && r.ref.earth && reachable(activeLevel.phase, r.ref.earth));

  let start = null;
  let goal = null;
  let type = "line-neutral";

  if (shortLPE) {
    start = activeLevel.phase;
    goal = (pe1 && reachable(activeLevel.phase, pe1)) ? pe1 : pe2;
    type = "earth-fault";
  } else if (shortNPE) {
    start = activeLevel.neutral;
    goal = (pe1 && reachable(activeLevel.neutral, pe1)) ? pe1 : pe2;
    type = "neutral-leak";
  } else if (earthShockRule) {
    start = activeLevel.phase;
    goal = earthShockRule.ref.earth;
    type = "shock-hazard";
  } else if (shortLN) {
    start = activeLevel.phase;
    goal = activeLevel.neutral;
    type = "line-neutral";
  }

  if (!start || !goal) return null;

  const edges = graph();
  const queue = [[start]];
  const seen = new Set([start]);
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (current === goal) {
      return { path, start, goal, type };
    }
    const neighbors = edges.get(current) || [];
    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i];
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return { path: [start, goal], start, goal, type };
}

function drawTeaserStrobeBackground(isDay) {
  const f = typeof frameCount === "number" ? frameCount : 0;
  // Cadencia estroboscópica: ráfagas rápidas de 12 Hz (periodo de 5 frames)
  const strobeFrame = f % 5;
  const isFlashPeak = (strobeFrame === 0 || strobeFrame === 1 || strobeFrame === 3);

  if (isFlashPeak) {
    const strobeCycle = Math.floor(f / 5) % 3;
    if (strobeCycle === 0) {
      // Destello blanco cegador de alta tensión
      background(isDay ? "#ffffff" : "#f0fdf4");
    } else if (strobeCycle === 1) {
      // Destello rojo de emergencia / disparo
      background(isDay ? "#fee2e2" : "#450a0a");
    } else {
      // Destello cian eléctrico de descarga plasma
      background(isDay ? "#e0f2fe" : "#082f49");
    }
  } else {
    // Fase oscura de alto contraste: hace que la luz estrober resalte con máxima fuerza
    background(isDay ? "#450a0a" : "#0a0103");
  }
}

function applyTeaserShake() {
  const f = typeof frameCount === "number" ? frameCount : 0;
  const isFlashPeak = (f % 5 === 0 || f % 5 === 1 || f % 5 === 3);
  if (isFlashPeak && typeof translate === "function") {
    const shakeMag = 4;
    const sx = (Math.random() - 0.5) * shakeMag * 2;
    const sy = (Math.random() - 0.5) * shakeMag * 2;
    translate(sx, sy);
  }
}

function drawTeaserArcsAndSparks() {
  const fault = findFaultPath();

  // 1. Arcos taser violentos a lo largo del camino de cortocircuito
  if (fault && fault.path && fault.path.length >= 2) {
    for (let i = 0; i < fault.path.length - 1; i++) {
      const p1 = fault.path[i];
      const p2 = fault.path[i + 1];
      drawTeaserLightning(p1.x, p1.y, p2.x, p2.y, 18, 1);
      spawnTeaserSparks((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 2);
    }
    spawnTeaserSparks(fault.start.x, fault.start.y, 3);
    spawnTeaserSparks(fault.goal.x, fault.goal.y, 3);
  }

  // 2. Arcos taser violentos en el Tablero TDA (donde disparó la protección)
  const tmIn = nodes.find((n) => n.id === "tda-tm-in");
  const tmOut = nodes.find((n) => n.id === "tda-tm-out");
  const difInL = nodes.find((n) => n.id === "tda-dif-in-l");
  const difOutL = nodes.find((n) => n.id === "tda-dif-out-l");

  if (tmIn && tmOut) {
    drawTeaserLightning(tmIn.x, tmIn.y, tmOut.x, tmOut.y, 16, 1);
    spawnTeaserSparks(tmOut.x, tmOut.y, 2);
  }
  if (difInL && difOutL && fault && fault.type !== "line-neutral") {
    drawTeaserLightning(difInL.x, difInL.y, difOutL.x, difOutL.y, 16, 1);
    spawnTeaserSparks(difOutL.x, difOutL.y, 2);
  }

  // 3. Arcos atmosféricos salvajes entre los polos en falla
  if (fault && fault.start && fault.goal) {
    const d = Math.hypot(fault.goal.x - fault.start.x, fault.goal.y - fault.start.y);
    if (d > 40 && d < 750) {
      drawTeaserLightning(fault.start.x, fault.start.y, fault.goal.x, fault.goal.y, 34, 2);
    }
  }

  // 4. Actualizar y renderizar partículas de chispas
  updateAndDrawTeaserSparks();
}

function drawTeaserStrobeOverlay(isDay) {
  const f = typeof frameCount === "number" ? frameCount : 0;
  const isFlashPeak = (f % 5 === 0 || f % 5 === 1 || f % 5 === 3);

  push();
  rectMode(CORNER);

  // Ráfaga estroboscópica sobre el lienzo
  if (isFlashPeak) {
    const flashCol = (f % 10 < 5) ? "rgba(255, 255, 255, 0.40)" : "rgba(239, 68, 68, 0.35)";
    fill(flashCol);
    noStroke();
    rect(0, 0, width, height);
  }

  // Marco perimetral estroboscópico de advertencia
  const borderAlpha = isFlashPeak ? 255 : 80;
  stroke(239, 68, 68, borderAlpha);
  strokeWeight(isFlashPeak ? 7 : 3);
  noFill();
  rect(4, 4, width - 8, height - 8, 8);

  // Letrero parpadeante de alto voltaje en la parte superior
  const bannerW = 430;
  const bannerH = 32;
  const bannerX = Math.round((width - bannerW) / 2);
  const bannerY = 10;

  fill(isFlashPeak ? "#ef4444" : "#7f1d1d");
  stroke(isFlashPeak ? "#ffffff" : "#dc2626");
  strokeWeight(isFlashPeak ? 2 : 1);
  rect(bannerX, bannerY, bannerW, bannerH, 6);

  noStroke();
  fill("#ffffff");
  textAlign(CENTER, CENTER);
  textSize(12);
  if (typeof textStyle === "function") textStyle(BOLD);
  const faultTitle = circuitAnalysis.title || "¡CORTOCIRCUITO DETECTADO!";
  text(`⚡ ${faultTitle.toUpperCase()} ⚡`, bannerX + bannerW / 2, bannerY + bannerH / 2);
  if (typeof textStyle === "function") textStyle(NORMAL);

  pop();
}

function draw() {
  const isDay = document.documentElement.getAttribute("data-theme") === "day";
  const bgNorm = isDay ? "#eaeff7" : "#171b29";
  const isFault = circuitAnalysis && circuitAnalysis.short;

  if (isFault) {
    drawTeaserStrobeBackground(isDay);
  } else {
    background(bgNorm);
  }

  push();
  if (isFault) {
    applyTeaserShake();
  }

  drawGrid();
  drawTablero();
  const live = !isFault && (circuitAnalysis.complete || circuitAnalysis.loads.some((item) => item.lit));
  wires.forEach((wire) => wire.draw(live && wire.type !== "neutro" && wire.type !== "tierra"));

  if (isFault) {
    drawTeaserArcsAndSparks();
  }

  if (draggingFrom) {
    const dx = pointer.x - draggingFrom.x;
    const dy = pointer.y - draggingFrom.y;
    const dist2 = Math.sqrt(dx * dx + dy * dy) || 1;
    let nx = -dy / dist2;
    let ny = dx / dist2;
    if (ny < 0) { nx = -nx; ny = -ny; }
    
    const sag = dist2 * 0.15;
    const cp1x = draggingFrom.x + dx * 0.3 + nx * sag;
    const cp1y = draggingFrom.y + dy * 0.3 + ny * sag;
    const cp2x = draggingFrom.x + dx * 0.7 + nx * sag;
    const cp2y = draggingFrom.y + dy * 0.7 + ny * sag;

    push();
    noFill();
    let previewColor = COLORS[selectedWireType] || COLORS.fase;
    if (selectedWireType === "tierra") previewColor = COLORS.tierra;
    stroke(previewColor);
    strokeWeight(4);
    bezier(
      draggingFrom.x, draggingFrom.y,
      cp1x, cp1y, cp2x, cp2y,
      pointer.x, pointer.y
    );
    pop();
  }
  components.forEach((component) => component.draw());
  nodes.forEach((node) => node.draw());
  drawHud();
  if (dockedLoadTable) {
    drawDockedCuadroCargas();
  }
  if (showWelcomeModal) {
    drawWelcomeModal();
  }
  drawCanvasResizeHandle();
  if (isFault && !showWelcomeModal) {
    drawTeaserStrobeOverlay(isDay);
  }
  pop();
  if (canvasElt) {
    if (inTableroResizeHandle(mouseX, mouseY) || inCanvasResizeHandle(mouseX, mouseY) || resizingTablero || resizingCanvas) {
      canvasElt.style.cursor = "nwse-resize";
    } else if (resizingComponent) {
      canvasElt.style.cursor = "nwse-resize";
    } else if (showWelcomeModal) {
      const data = calcCuadroCargas(activeLevel);
      const mw = Math.min(860, width - 40);
      const mx = Math.round((width - mw) / 2);
      const headerH = 52;
      const instrH = 142;
      const tableHeadH = 26;
      const rowH = 30;
      const rowsH = data && data.circuits ? data.circuits.length * rowH : rowH;
      const totalsH = 32;
      const footerH = 58;
      const mh = headerH + instrH + 14 + tableHeadH + rowsH + totalsH + footerH + 16;
      const my = Math.max(16, Math.round((height - mh) / 2));
      const btnW = 200;
      const btnH = 36;
      const btnX = Math.round(mx + (mw - btnW) / 2);
      const curY = my + headerH + 10 + instrH + 12 + tableHeadH + rowsH;
      const btnY = curY + totalsH + 14;
      const overAceptar = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
      const overClose = dist(mouseX, mouseY, mx + mw - 24, my + headerH / 2) < 16;
      canvasElt.style.cursor = overAceptar || overClose ? "pointer" : "default";
    } else if (dockedLoadTable && mouseX >= width - 314 - 14 && mouseX <= width - 14 && mouseY >= 32 && mouseY <= height - 32) {
      const panelX = width - 314 - 14;
      const ampW = 76;
      const ampH = 22;
      const ampX = panelX + 314 - ampW - 10;
      const ampY = 32 + 10;
      const overAmp = mouseX >= ampX && mouseX <= ampX + ampW && mouseY >= ampY && mouseY <= ampY + ampH;
      const isComplete = circuitAnalysis && circuitAnalysis.complete;
      let overNext = false;
      if (isComplete) {
        const data = calcCuadroCargas(activeLevel);
        const numCircs = data && data.circuits ? data.circuits.length : 1;
        const circsH = numCircs * (146 + 8);
        const curY = 32 + 42 + 10 + circsH + 100 + 10;
        const nxtW = 314 - 36;
        const nxtH = 22;
        const nxtX = panelX + 18;
        const nxtY = curY + 38;
        overNext = mouseX >= nxtX && mouseX <= nxtX + nxtW && mouseY >= nxtY && mouseY <= nxtY + nxtH;
      }
      canvasElt.style.cursor = overAmp || overNext ? "pointer" : "default";
    } else if (selectedWireType === "eraser") {
      const overNode = nodes.some((node) => node.isHovered(mouseX, mouseY));
      const overWire = wires.some((wire) => wire.isHovered(mouseX, mouseY));
      canvasElt.style.cursor = overNode || overWire ? "crosshair" : "default";
    } else {
      const overNode = nodes.some((node) => node.isHovered(mouseX, mouseY));
      const overComp = componentAt(mouseX, mouseY);
      if (overComp && overComp.inResizeHandle && overComp.inResizeHandle(mouseX, mouseY)) {
        canvasElt.style.cursor = "nwse-resize";
      } else if (overNode || draggingFrom) {
        canvasElt.style.cursor = "crosshair";
      } else if (overComp && overComp.interactive) {
        canvasElt.style.cursor = "pointer";
      } else {
        canvasElt.style.cursor = "default";
      }
    }
  }
}

function drawGrid() {
  const isDay = document.documentElement.getAttribute("data-theme") === "day";
  stroke(isDay ? "rgba(90, 100, 191, 0.08)" : "rgba(255, 255, 255, 0.04)");
  strokeWeight(1);
  for (let x = 20; x < width; x += 40) line(x, 0, x, height);
  for (let y = 20; y < height; y += 40) line(0, y, width, y);
}

function mouseMoved() { pointer = { x: mouseX, y: mouseY }; }
function mouseDragged() {
  if (resizingTablero) {
    const nw = Math.max(tableroBox.minW, Math.min(tableroBox.maxW, tableroResizeStart.w + (mouseX - tableroResizeStart.mx)));
    const nh = Math.max(tableroBox.minH, Math.min(tableroBox.maxH, tableroResizeStart.h + (mouseY - tableroResizeStart.my)));
    setTableroSize(nw, nh);
    return false;
  }

  if (resizingCanvas) {
    const nw = Math.max(1040, Math.min(2200, canvasResizeStart.w + (mouseX - canvasResizeStart.mx)));
    const nh = Math.max(660, Math.min(1800, canvasResizeStart.h + (mouseY - canvasResizeStart.my)));
    if (typeof resizeCanvas === "function") resizeCanvas(nw, nh);
    return false;
  }

  if (resizingComponent) {
    const nw = Math.max(48, resizeStart.w + (mouseX - resizeStart.mx) * 2);
    const nh = Math.max(36, resizeStart.h + (mouseY - resizeStart.my) * 2);
    if (resizingComponent.resize) {
      resizingComponent.resize(nw, nh);
    } else {
      resizingComponent.w = nw;
      resizingComponent.h = nh;
    }
    return false;
  }
  
  if (draggingComponent) {
    if (draggingComponent.move) {
      draggingComponent.move(mouseX - dragOffset.x, mouseY - dragOffset.y);
    }
    return false;
  }
  
  pointer = { x: mouseX, y: mouseY };
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  pointer = { x: mouseX, y: mouseY };

  if (inTableroResizeHandle(mouseX, mouseY)) {
    resizingTablero = true;
    tableroResizeStart = { w: tableroBox.w, h: tableroBox.h, mx: mouseX, my: mouseY };
    return false;
  }

  if (inCanvasResizeHandle(mouseX, mouseY)) {
    resizingCanvas = true;
    canvasResizeStart = { w: width, h: height, mx: mouseX, my: mouseY };
    return false;
  }
  
  if (showWelcomeModal) {
    const data = calcCuadroCargas(activeLevel);
    const mw = Math.min(860, width - 40);
    const mx = Math.round((width - mw) / 2);
    const headerH = 52;
    const instrH = 142;
    const tableHeadH = 26;
    const rowH = 30;
    const rowsH = data && data.circuits ? data.circuits.length * rowH : rowH;
    const totalsH = 32;
    const footerH = 58;
    const mh = headerH + instrH + 14 + tableHeadH + rowsH + totalsH + footerH + 16;
    const my = Math.max(16, Math.round((height - mh) / 2));

    // 1. Cerrar [✕] arriba a la derecha
    if (dist(mouseX, mouseY, mx + mw - 24, my + headerH / 2) < 16) {
      showWelcomeModal = false;
      dockedLoadTable = true;
      showLoadTable = true;
      return false;
    }

    // 2. Botón "Aceptar"
    const btnW = 200;
    const btnH = 36;
    const btnX = Math.round(mx + (mw - btnW) / 2);
    const curY = my + headerH + 10 + instrH + 12 + tableHeadH + rowsH;
    const btnY = curY + totalsH + 14;

    if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
      showWelcomeModal = false;
      dockedLoadTable = true;
      showLoadTable = true;
      return false;
    }

    // 3. Clic fuera del recuadro lo acepta y cierra
    if (mouseX < mx || mouseX > mx + mw || mouseY < my || mouseY > my + mh) {
      showWelcomeModal = false;
      dockedLoadTable = true;
      showLoadTable = true;
      return false;
    }
    return false;
  }

  if (dockedLoadTable) {
    const panelW = 314;
    const panelX = width - panelW - 14;
    const panelY = 32;
    const panelH = height - panelY - 32;

    if (mouseX >= panelX && mouseX <= panelX + panelW && mouseY >= panelY && mouseY <= panelY + panelH) {
      // Botón [🔍 Ampliar]
      const ampW = 76;
      const ampH = 22;
      const ampX = panelX + panelW - ampW - 10;
      const ampY = panelY + 10;
      if (mouseX >= ampX && mouseX <= ampX + ampW && mouseY >= ampY && mouseY <= ampY + ampH) {
        showWelcomeModal = true;
        return false;
      }

      // Si está completo, botón Siguiente Plantilla
      const isComplete = circuitAnalysis && circuitAnalysis.complete;
      if (isComplete) {
        const data = calcCuadroCargas(activeLevel);
        const numCircs = data && data.circuits ? data.circuits.length : 1;
        const circsH = numCircs * (146 + 8);
        const curY = panelY + 42 + 10 + circsH + 100 + 10;
        const nxtW = panelW - 36;
        const nxtH = 22;
        const nxtX = panelX + 18;
        const nxtY = curY + 38;
        if (mouseX >= nxtX && mouseX <= nxtX + nxtW && mouseY >= nxtY && mouseY <= nxtY + nxtH) {
          const nextBtn = document.querySelector("#next-level");
          if (nextBtn) nextBtn.click();
          return false;
        }
      }
      return false;
    }
  }

  const hit = nodeAt(mouseX, mouseY);
  
  if (selectedWireType === "eraser") {
    if (hit) {
      const prevLength = wires.length;
      wires = wires.filter(w => w.from !== hit && w.to !== hit);
      if (wires.length < prevLength) analizarCircuito();
      return false;
    }
    const wireIdx = wires.findIndex(w => w.isHovered(mouseX, mouseY));
    if (wireIdx !== -1) {
      wires.splice(wireIdx, 1);
      analizarCircuito();
      return false;
    }
    return false;
  }

  if (hit) {
    draggingFrom = hit;
    return false;
  }
  
  const component = componentAt(mouseX, mouseY);
  if (component) {
    if (component.inResizeHandle && component.inResizeHandle(mouseX, mouseY)) {
      resizingComponent = component;
      resizeStart = { w: component.w, h: component.h, mx: mouseX, my: mouseY };
    } else {
      draggingComponent = component;
      dragOffset = { x: mouseX - component.x, y: mouseY - component.y };
      component.onPress(mouseX, mouseY);
      if (component instanceof Push) heldPush = component;
      analizarCircuito();
    }
    return false;
  }
  return false;
}

function mouseReleased() {
  let changed = false;

  if (resizingTablero) {
    resizingTablero = false;
    return false;
  }

  if (resizingCanvas) {
    resizingCanvas = false;
    return false;
  }
  
  if (resizingComponent) {
    resizingComponent = null;
    return false;
  }
  if (draggingComponent) {
    draggingComponent = null;
    if (heldPush) {
      heldPush.closed = false;
      heldPush = null;
      analizarCircuito();
    }
    return false;
  }

  if (draggingFrom) {
    const target = nodeAt(mouseX, mouseY);
    if (target && target !== draggingFrom) {
      wires.push(new Wire(draggingFrom, target, selectedWireType));
      changed = true;
    }
    draggingFrom = null;
  }
  if (heldPush) {
    heldPush.closed = false;
    heldPush = null;
    changed = true;
  }
  if (changed) analizarCircuito();
}

window.__sim = {
  LEVELS,
  loadLevel,
  connect,
  clearWires,
  autoWireBoard,
  calcCuadroCargas,
  showLoadTable: () => showWelcomeModal || dockedLoadTable || showLoadTable,
  showWelcomeModal: () => showWelcomeModal,
  setWelcomeModal: (val) => { showWelcomeModal = val; },
  dockedLoadTable: () => dockedLoadTable,
  setDockedLoadTable: (val) => { dockedLoadTable = val; },
  acceptWelcomeModal: () => {
    showWelcomeModal = false;
    dockedLoadTable = true;
    showLoadTable = true;
  },
  tableroBox: () => tableroBox,
  setTableroSize,
  resizeCanvas: (w, h) => { if (typeof resizeCanvas === "function") resizeCanvas(w, h); },
  setShowLoadTable: (val) => {
    showLoadTable = val;
    if (!val) {
      showWelcomeModal = false;
      dockedLoadTable = false;
    } else {
      dockedLoadTable = true;
    }
  },
  analizarCircuito,
  findFaultPath,
  teaserSparks: () => teaserSparks,
  draw: () => draw(),
  mousePressed: () => mousePressed(),
  layoutWarnings,
  analysis: () => circuitAnalysis,
  ids: () => nodes.map((node) => node.id),
  setClosed(id, value) {
    const component = components.find((item) => item.id === id);
    if (component) component.closed = value;
    return analizarCircuito();
  },
  setKey(id, key, value) {
    const component = components.find((item) => item.id === id);
    if (component && component.keys) component.keys[key].closed = value;
    return analizarCircuito();
  },
  toggle(id) {
    const component = components.find((item) => item.id === id);
    if (component && component.toggle) component.toggle();
    return analizarCircuito();
  },
  pos(id) {
    const component = components.find((item) => item.id === id);
    return component ? { x: component.x, y: component.y, w: component.w, h: component.h } : null;
  },
};


// Theme Management
const THEME_BTN = document.getElementById("theme-toggle");
if (THEME_BTN) {
  THEME_BTN.addEventListener("click", () => {
    const isDay = document.documentElement.getAttribute("data-theme") === "day";
    document.documentElement.setAttribute("data-theme", isDay ? "night" : "day");
    syncColors();
  });
}

function syncColors() {
  const root = getComputedStyle(document.documentElement);
  COLORS.bg = root.getPropertyValue('--bg').trim();
  COLORS.panel = root.getPropertyValue('--panel').trim();
  COLORS.line = root.getPropertyValue('--line').trim();
  COLORS.text = root.getPropertyValue('--text').trim();
  COLORS.muted = root.getPropertyValue('--muted').trim();
  COLORS.switch = root.getPropertyValue('--panel-2').trim();
  COLORS.cyan = root.getPropertyValue('--cyan').trim();
  COLORS.amber = root.getPropertyValue('--amber').trim();
  COLORS.red = root.getPropertyValue('--red').trim();
  COLORS.green = root.getPropertyValue('--green').trim();
  const isDay = document.documentElement.getAttribute("data-theme") === "day";
  COLORS.tierra = isDay ? "#16a34a" : "#9de35d";
}

document.addEventListener("DOMContentLoaded", syncColors);
