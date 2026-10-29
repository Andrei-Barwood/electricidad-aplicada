
const COLORS = { bg: "#11131d", panel: "#1c2030", switch: "#252a3d", red: "#ff4d5e", L2: "#000000", L3: "#777777", N: "#f7f8ff", cyan: "#5de1ff", green: "#9de35d", amber: "#ffc857", muted: "#a6aec5", wireOff: "#3a4058", text: "#f2f4fa" };
let nodes = [], wires = [], components = [], circuitAnalysis = { short: false, shortDetails: "", complete: false };
let pointer = { x: 0, y: 0 }, draggingFrom = null, draggingComponent = null, resizingComponent = null, dragOffset = {x: 0, y: 0}, resizeStart = {w: 0, h: 0, mx: 0, my: 0}, selectedWireType = "L1";
let activeLevel = null;

class Node {
  constructor(id, x, y, type, label = "") {
    this.id = id; this.x = x; this.y = y; this.type = type; this.label = label;
    this.radius = 12;
    this.potentials = new Set();
  }
  draw(interactive = true) {
    const isHover = interactive && this.isHovered(mouseX, mouseY);
    let fillCol = COLORS.switch;
    if (this.potentials.has("L1")) fillCol = COLORS.red;
    else if (this.potentials.has("L2")) fillCol = COLORS.L2;
    else if (this.potentials.has("L3")) fillCol = COLORS.L3;
    else if (this.potentials.has("N")) fillCol = COLORS.N;
    
    stroke(isHover ? COLORS.cyan : COLORS.muted);
    strokeWeight(isHover ? 3 : 2);
    fill(fillCol);
    circle(this.x, this.y, this.radius * 2);
    
    if (this.label) {
      noStroke(); fill(COLORS.muted); textAlign(CENTER, BOTTOM); textSize(10);
      text(this.label, this.x, this.y - 18);
    }
  }
  isHovered(mx, my) { return dist(mx, my, this.x, this.y) <= this.radius + 6; }
}

class Wire {
  constructor(from, to, type) { this.from = from; this.to = to; this.type = type; }
  draw() {
    let active = false;
    if (this.type === "L1" && this.from.potentials.has("L1")) active = true;
    if (this.type === "L2" && this.from.potentials.has("L2")) active = true;
    if (this.type === "L3" && this.from.potentials.has("L3")) active = true;
    if (this.type === "N" && this.from.potentials.has("N")) active = true;
    
    let c = COLORS.wireOff;
    if (active) {
        if (this.type === "L1") c = COLORS.red;
        if (this.type === "L2") c = COLORS.L2;
        if (this.type === "L3") c = "#10b981"; // Green for 5V
        if (this.type === "L3") c = COLORS.L3;
        if (this.type === "N") c = COLORS.N;
    }
    
    stroke(c); strokeWeight(active ? 4 : 2); noFill();
    bezier(this.from.x, this.from.y, this.from.x, this.from.y + 60, this.to.x, this.to.y + 60, this.to.x, this.to.y);
  }
}

class Component {
  constructor(id, x, y, label, w, h) {
    this.id = id; this.x = x; this.y = y; this.label = label; this.w = w; this.h = h;
    this.initialW = w;
    this.initialH = h;
    this.nodes = []; this.interactive = false;
    components.push(this);
  }
  addNode(id, dx, dy, type, label) {
    const n = new Node(id, this.x + dx, this.y + dy, type, label);
    n.dx = dx; n.dy = dy;
    n.initialDx = dx; n.initialDy = dy;
    n.initialRadius = n.radius;
    this.nodes.push(n);
    nodes.push(n);
    return n;
  }
  getScale() {
    const sx = this.initialW ? this.w / this.initialW : 1;
    const sy = this.initialH ? this.h / this.initialH : 1;
    return { sx, sy, s: Math.min(sx, sy) };
  }
  resize(nw, nh) {
    this.w = Math.max(50, nw);
    this.h = Math.max(40, nh);
    const { sx, sy, s } = this.getScale();
    this.nodes.forEach(n => {
      if (n.initialDx !== undefined && n.initialDy !== undefined) {
        n.dx = n.initialDx * sx;
        n.dy = n.initialDy * sy;
        n.x = this.x + n.dx;
        n.y = this.y + n.dy;
      }
      if (n.initialRadius !== undefined) {
        n.radius = Math.round(Math.max(8, Math.min(24, n.initialRadius * Math.sqrt(s))));
      }
    });
  }
  internalEdges() { return []; }
  evaluateElectromagnetics() { return false; }
  onPress() {}
  reset() {}
  move(nx, ny) {
    this.x = nx; this.y = ny;
    this.nodes.forEach(n => { n.x = this.x + n.dx; n.y = this.y + n.dy; });
  }
  inResizeHandle(mx, my) {
    const { s } = this.getScale();
    const hw = this.w / 2; const hh = this.h / 2;
    const rHit = Math.max(16, 20 * s);
    return mx > this.x + hw - rHit && mx < this.x + hw + 10 && my > this.y + hh - rHit && my < this.y + hh + 10;
  }
  drawBox(accent) {
    const { s } = this.getScale();
    push();
    rectMode(CENTER);
    fill(COLORS.panel);
    stroke(accent);
    strokeWeight(Math.max(1.5, 2 * s));
    rect(this.x, this.y, this.w, this.h, Math.max(6, 14 * s));
    noStroke();
    fill(COLORS.text);
    textAlign(CENTER, TOP);
    textSize(Math.max(9, Math.round(12 * s)));
    text(this.label, this.x, this.y + this.h / 2 + Math.max(5, 8 * s));
    // Draw resize handle
    fill(COLORS.muted);
    const hs = Math.max(8, 12 * s);
    triangle(this.x + this.w/2, this.y + this.h/2 - hs, this.x + this.w/2, this.y + this.h/2, this.x + this.w/2 - hs, this.y + this.h/2);
    pop();
  }
  contains(mx, my, pad=0) { return Math.abs(mx - this.x) <= this.w / 2 + pad && Math.abs(my - this.y) <= this.h / 2 + pad; }
}

class Contactor extends Component {
  constructor(id, x, y, label = "Contactor K1") {
    super(id, x, y, label, 160, 200);
    this.a1 = this.addNode(id+"-A1", -60, -80, "coil", "A1");
    this.a2 = this.addNode(id+"-A2", -60, 80, "coil", "A2");
    
    this.l1 = this.addNode(id+"-L1", -20, -80, "main", "L1");
    this.t1 = this.addNode(id+"-T1", -20, 80, "main", "T1");
    
    this.l2 = this.addNode(id+"-L2", 20, -80, "main", "L2");
    this.t2 = this.addNode(id+"-T2", 20, 80, "main", "T2");
    
    this.l3 = this.addNode(id+"-L3", 60, -80, "main", "L3");
    this.t3 = this.addNode(id+"-T3", 60, 80, "main", "T3");
    
    this.no13 = this.addNode(id+"-13", -60, -20, "aux", "13");
    this.no14 = this.addNode(id+"-14", -60, 20, "aux", "14");
    
    this.active = false;
  }
  evaluateElectromagnetics() {
    const hasPhase = this.a1.potentials.has("L1") || this.a1.potentials.has("L2") || this.a1.potentials.has("L3") || this.a2.potentials.has("L1") || this.a2.potentials.has("L2") || this.a2.potentials.has("L3");
    const hasNeutral = this.a1.potentials.has("N") || this.a2.potentials.has("N");
    
    const shouldBeActive = hasPhase && hasNeutral && (Array.from(this.a1.potentials).join() !== Array.from(this.a2.potentials).join());
    
    if (shouldBeActive !== this.active) {
      this.active = shouldBeActive;
      return true; // state changed!
    }
    return false;
  }
  internalEdges() {
    if (this.active) {
      return [ [this.l1, this.t1], [this.l2, this.t2], [this.l3, this.t3], [this.no13, this.no14] ];
    }
    return [];
  }
  reset() { this.active = false; }
  draw() {
    const { s } = this.getScale();
    this.drawBox(this.active ? COLORS.green : COLORS.switch);
    push();
    stroke(this.active ? COLORS.green : COLORS.muted);
    strokeWeight(Math.max(1.5, 2 * s));
    // Draw symbols
    line(this.a1.x, this.a1.y + 15 * s, this.a1.x, this.a1.y + 25 * s);
    line(this.a2.x, this.a2.y - 15 * s, this.a2.x, this.a2.y - 25 * s);
    rectMode(CENTER);
    fill(COLORS.panel);
    rect(this.a1.x, this.y, 20 * s, 30 * s, Math.max(2, 3 * s));
    pop();
  }
}

class Pushbutton extends Component {
  constructor(id, x, y, label, type="NO") {
    super(id, x, y, label, 80, 80);
    this.interactive = true;
    this.btnType = type;
    this.pressed = false;
    const lLower = (label || "").toLowerCase();
    this.isToggle = type === "toggle" || lLower.includes("sensor") || lLower.includes("interruptor") || lLower.includes("switch");
    this.n1 = this.addNode(id+"-1", -20, 0, "switch", type==="NO"?"3":"1");
    this.n2 = this.addNode(id+"-2", 20, 0, "switch", type==="NO"?"4":"2");
  }
  onPress() { this.pressed = !this.pressed; }
  internalEdges() {
    if (this.btnType === "NO" && this.pressed) return [[this.n1, this.n2]];
    if (this.btnType === "NC" && !this.pressed) return [[this.n1, this.n2]];
    return [];
  }
  reset() { this.pressed = false; }
  draw() {
    const { s } = this.getScale();
    this.drawBox(this.btnType === "NC" ? COLORS.red : COLORS.green);
    push();
    fill(this.pressed ? COLORS.green : COLORS.muted);
    circle(this.x, this.y, 20 * s);
    if (this.isToggle) {
      // Indicador visual de sensor / interruptor biestable
      noFill();
      stroke(this.pressed ? "#ffffff" : COLORS.cyan);
      strokeWeight(Math.max(1.2, 1.8 * s));
      circle(this.x, this.y, 28 * s);
    }
    pop();
  }
}

class Motor3Phase extends Component {
  constructor(id, x, y, label="Motor 3~") {
    super(id, x, y, label, 160, 180);
    this.u1 = this.addNode(id+"-U1", -40, -70, "load", "U1");
    this.v1 = this.addNode(id+"-V1", 0, -70, "load", "V1");
    this.w1 = this.addNode(id+"-W1", 40, -70, "load", "W1");
    
    this.u2 = this.addNode(id+"-U2", -40, 70, "load", "U2");
    this.v2 = this.addNode(id+"-V2", 0, 70, "load", "V2");
    this.w2 = this.addNode(id+"-W2", 40, 70, "load", "W2");
    this.running = false;
  }
  draw() {
    const { s } = this.getScale();
    this.drawBox(this.running ? COLORS.green : COLORS.switch);
    push();
    fill(COLORS.text);
    textAlign(CENTER, CENTER);
    textSize(Math.max(14, Math.round(28 * s)));
    text("M", this.x, this.y);
    pop();
  }
}


class VFD extends Component {
  constructor(id, x, y, label="Variador Frec. (VFD)") {
    super(id, x, y, label, 200, 240);
    this.l1 = this.addNode(id+"-L1", -60, -100, "load", "L1");
    this.l2 = this.addNode(id+"-L2", -20, -100, "load", "L2");
    this.l3 = this.addNode(id+"-L3", 20, -100, "load", "L3");
    
    this.v24 = this.addNode(id+"-24V", 60, -100, "aux", "24V");
    
    this.di1 = this.addNode(id+"-DI1", -60, 100, "aux", "DI1 (FWD)");
    this.di2 = this.addNode(id+"-DI2", -20, 100, "aux", "DI2 (REV)");
    
    this.u = this.addNode(id+"-U", 20, 100, "load", "U");
    this.v = this.addNode(id+"-V", 60, 100, "load", "V");
    this.w = this.addNode(id+"-W", 80, 100, "load", "W");
    
    this.frequency = 0.0;
    this.targetFreq = 0.0;
    this.powered = false;
    this.running = false;
    this.direction = 1;
  }
  
  evaluateElectromagnetics() {
    let changed = false;
    const hasPhase = this.l1.potentials.has("L1") && this.l2.potentials.has("L2") && this.l3.potentials.has("L3");
    const wasPowered = this.powered;
    this.powered = hasPhase;
    if (wasPowered !== this.powered) changed = true;
    
    if (this.powered) {
      const fwd = this.di1.potentials.size > 0;
      const rev = this.di2.potentials.size > 0;
      const wasRunning = this.running;
      const wasDir = this.direction;
      
      if (fwd && !rev) { this.targetFreq = 50.0; this.direction = 1; this.running = true; }
      else if (rev && !fwd) { this.targetFreq = 50.0; this.direction = -1; this.running = true; }
      else { this.targetFreq = 0.0; this.running = false; }
      
      if (wasRunning !== this.running || wasDir !== this.direction) changed = true;
    } else {
      if (this.running) changed = true;
      this.targetFreq = 0.0;
      this.frequency = 0.0;
      this.running = false;
    }
    return changed;
  }
  
  internalEdges() {
    let edges = [];
    if (this.powered) {
      edges.push([this.l1, this.v24]); // 24V source derived from L1
    }
    if (this.running) {
      edges.push([this.l1, this.u]);
      edges.push([this.direction === 1 ? this.l2 : this.l3, this.v]);
      edges.push([this.direction === 1 ? this.l3 : this.l2, this.w]);
    }
    return edges;
  }
  
  draw() {
    const { sx, sy, s } = this.getScale();
    if (this.frequency < this.targetFreq) this.frequency = Math.min(this.targetFreq, this.frequency + 0.5);
    if (this.frequency > this.targetFreq) this.frequency = Math.max(this.targetFreq, this.frequency - 0.5);
    
    this.drawBox(this.powered ? COLORS.cyan : COLORS.switch);
    
    // LCD Screen
    push();
    fill(COLORS.panel);
    stroke(COLORS.muted);
    strokeWeight(Math.max(1, 1.5 * s));
    rectMode(CENTER);
    rect(this.x, this.y - 10 * sy, 120 * sx, 40 * sy, Math.max(3, 5 * s));
    fill(this.powered ? (this.running ? COLORS.green : COLORS.red) : COLORS.muted);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(12, Math.round(22 * s)));
    text(this.frequency.toFixed(1) + " Hz", this.x, this.y - 10 * sy);
    
    textSize(Math.max(8, Math.round(12 * s)));
    fill(COLORS.text);
    if (this.running) {
      text(this.direction === 1 ? "FWD ▶" : "◀ REV", this.x, this.y + 20 * sy);
    } else {
      text("STOP", this.x, this.y + 20 * sy);
    }
    pop();
  }
}

class PLCLogo extends Component {
  constructor(id, x, y, label="Siemens LOGO! 230RC") {
    super(id, x, y, label, 280, 200);
    this.l1 = this.addNode(id+"-L1", -120, -80, "load", "L1");
    this.n = this.addNode(id+"-N", -90, -80, "load", "N");
    this.i1 = this.addNode(id+"-I1", -30, -80, "load", "I1");
    this.i2 = this.addNode(id+"-I2", 10, -80, "load", "I2");
    this.i3 = this.addNode(id+"-I3", 50, -80, "load", "I3");
    this.i4 = this.addNode(id+"-I4", 90, -80, "load", "I4");
    this.q1a = this.addNode(id+"-Q1a", -100, 80, "aux", "Q1.1");
    this.q1b = this.addNode(id+"-Q1b", -70, 80, "aux", "Q1.2");
    this.q2a = this.addNode(id+"-Q2a", -20, 80, "aux", "Q2.1");
    this.q2b = this.addNode(id+"-Q2b", 10, 80, "aux", "Q2.2");
    this.q3a = this.addNode(id+"-Q3a", 60, 80, "aux", "Q3.1");
    this.q3b = this.addNode(id+"-Q3b", 90, 80, "aux", "Q3.2");
    this.powered = false; this.interactive = true;
    this.tCoils = [false, false];
    this.tContacts = [false, false];
    this.timerIds = [null, null];
    this.activeOutputs = [false, false, false, false];
    this.program = (inputs) => [false, false, false, false];
  }
  
  onPress() { openPLCEditor(this); }
  evaluateElectromagnetics() {
    let changed = false;
    const hasPhase = this.l1.potentials.has("L1") || this.l1.potentials.has("L2") || this.l1.potentials.has("L3");
    const hasNeutral = this.n.potentials.has("N");
    const wasPowered = this.powered;
    this.powered = hasPhase && hasNeutral;
    if (wasPowered !== this.powered) changed = true;
    
    if (this.powered) {
      const inputs = [
        this.i1.potentials.size > 0,
        this.i2.potentials.size > 0,
        this.i3.potentials.size > 0,
        this.i4.potentials.size > 0
      ];
      let newOuts = this.program(inputs, [...this.activeOutputs], [...this.tContacts]);
      if (Array.isArray(newOuts)) { newOuts = { q: newOuts, t: [false, false] }; }
      
      for (let i=0; i<4; i++) {
        if (this.activeOutputs[i] !== newOuts.q[i]) {
          this.activeOutputs[i] = newOuts.q[i];
          changed = true;
        }
      }
      for (let i=0; i<2; i++) {
        if (newOuts.t[i] && !this.tCoils[i]) {
          this.tCoils[i] = true;
          this.timerIds[i] = setTimeout(() => {
            this.tContacts[i] = true;
            this.timerIds[i] = null;
            analizarCircuito();
          }, 3000);
        } else if (!newOuts.t[i] && this.tCoils[i]) {
          this.tCoils[i] = false;
          if (this.tContacts[i]) { this.tContacts[i] = false; changed = true; }
          if (this.timerIds[i] !== null) { clearTimeout(this.timerIds[i]); this.timerIds[i] = null; }
        }
      }
    } else {
      for (let i=0; i<4; i++) {
        if (this.activeOutputs[i]) {
          this.activeOutputs[i] = false;
          changed = true;
        }
      }
      for (let i=0; i<2; i++) {
        this.tCoils[i] = false;
        if (this.tContacts[i]) { this.tContacts[i] = false; changed = true; }
        if (this.timerIds[i] !== null) { clearTimeout(this.timerIds[i]); this.timerIds[i] = null; }
      }
    }
    return changed;
  }
  
  internalEdges() {
    let edges = [];
    if (this.activeOutputs[0]) edges.push([this.q1a, this.q1b]);
    if (this.activeOutputs[1]) edges.push([this.q2a, this.q2b]);
    if (this.activeOutputs[2]) edges.push([this.q3a, this.q3b]);
    return edges;
  }
  
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.powered ? COLORS.cyan : COLORS.switch);
    push();
    fill(COLORS.switch);
    stroke(COLORS.muted);
    strokeWeight(Math.max(1, 1.5 * s));
    rectMode(CENTER);
    rect(this.x, this.y, 80 * sx, 50 * sy, Math.max(3, 4 * s));
    if (this.powered) {
      fill(COLORS.green);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(Math.max(9, Math.round(12 * s)));
      text("RUN", this.x, this.y);
    }
    pop();
  }
}

class Timer extends Component {
  constructor(id, x, y, label="Timer T1", delayMs=2000) {
    super(id, x, y, label, 120, 160);
    this.delayMs = delayMs;
    this.a1 = this.addNode(id+"-A1", -40, -60, "coil", "A1");
    this.a2 = this.addNode(id+"-A2", -40, 60, "coil", "A2");
    
    this.no1 = this.addNode(id+"-NO1", 40, -40, "aux", "NO1");
    this.no2 = this.addNode(id+"-NO2", 40, 40, "aux", "NO2");
    
    this.nc1 = this.addNode(id+"-NC1", 0, -40, "aux", "NC1");
    this.nc2 = this.addNode(id+"-NC2", 0, 40, "aux", "NC2");
    
    this.coilEnergized = false;
    this.contactsActive = false;
    this.timerId = null;
  }
  
  evaluateElectromagnetics() {
    const hasPhase = this.a1.potentials.has("L1") || this.a1.potentials.has("L2") || this.a1.potentials.has("L3") || this.a2.potentials.has("L1") || this.a2.potentials.has("L2") || this.a2.potentials.has("L3");
    const hasNeutral = this.a1.potentials.has("N") || this.a2.potentials.has("N");
    const shouldBeEnergized = hasPhase && hasNeutral && (Array.from(this.a1.potentials).join() !== Array.from(this.a2.potentials).join());
    
    let changed = false;
    if (shouldBeEnergized && !this.coilEnergized) {
      this.coilEnergized = true;
      if (this.timerId === null) {
        this.timerId = setTimeout(() => {
          this.contactsActive = true;
          this.timerId = null;
          analizarCircuito();
        }, this.delayMs);
      }
    } else if (!shouldBeEnergized && this.coilEnergized) {
      this.coilEnergized = false;
      if (this.contactsActive) {
          this.contactsActive = false;
          changed = true;
      }
      if (this.timerId !== null) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }
    return changed;
  }
  
  internalEdges() {
    let edges = [];
    if (!this.contactsActive) edges.push([this.nc1, this.nc2]);
    if (this.contactsActive) edges.push([this.no1, this.no2]);
    return edges;
  }
  
  reset() {
    this.coilEnergized = false;
    this.contactsActive = false;
    if (this.timerId !== null) { clearTimeout(this.timerId); this.timerId = null; }
  }
  
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.contactsActive ? COLORS.amber : (this.coilEnergized ? COLORS.cyan : COLORS.switch));
    push();
    stroke(this.contactsActive ? COLORS.amber : COLORS.muted);
    strokeWeight(Math.max(1.5, 2 * s));
    rectMode(CENTER);
    fill(COLORS.panel);
    rect(this.a1.x, this.y, 20 * sx, 30 * sy, Math.max(2, 3 * s));
    line(this.a1.x - 10 * sx, this.y - 15 * sy, this.a1.x + 10 * sx, this.y + 15 * sy);
    line(this.a1.x + 10 * sx, this.y - 15 * sy, this.a1.x - 10 * sx, this.y + 15 * sy);
    pop();
  }
}

class Source3Phase extends Component {
  constructor(x, y) {
    super("source", x, y, "Alimentación", 200, 80);
    this.l1 = this.addNode("source-L1", -60, 0, "source-L1", "L1");
    this.l2 = this.addNode("source-L2", -20, 0, "source-L2", "L2");
    this.l3 = this.addNode("source-L3", 20, 0, "source-L3", "L3");
    this.n = this.addNode("source-N", 60, 0, "source-N", "N");
  }
  draw() { this.drawBox(COLORS.amber); }
}



class PanelSolar extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Panel Solar 170W", 140, 80);
    this.pos = this.addNode(id+"-pos", 40, -40, "source-L1", "+");
    this.neg = this.addNode(id+"-neg", -40, -40, "source-N", "-");
  }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(COLORS.cyan);
    push();
    stroke(COLORS.muted);
    strokeWeight(Math.max(1, 1.5 * s));
    fill(COLORS.panel); 
    rectMode(CENTER);
    rect(this.x, this.y, 120 * sx, 40 * sy, Math.max(3, 4 * s)); 
    line(this.x - 20 * sx, this.y - 20 * sy, this.x - 20 * sx, this.y + 20 * sy);
    line(this.x + 20 * sx, this.y - 20 * sy, this.x + 20 * sx, this.y + 20 * sy);
    pop();
  }
}

class ControladorCarga extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Controlador MPPT", 160, 80);
    this.pPos = this.addNode(id+"-ppos", -60, -40, "load", "PV+");
    this.pNeg = this.addNode(id+"-pneg", -30, -40, "load", "PV-");
    this.bPos = this.addNode(id+"-bpos", 0, -40, "load", "BAT+");
    this.bNeg = this.addNode(id+"-bneg", 30, -40, "load", "BAT-");
  }
  draw() {
    const { sx, s } = this.getScale();
    this.drawBox(COLORS.panel);
    push();
    fill(COLORS.green);
    noStroke();
    circle(this.x - 45 * sx, this.y, 10 * s);
    circle(this.x + 15 * sx, this.y, 10 * s);
    pop();
  }
}

class Inversor extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Inversor 24V->220V", 160, 100);
    this.dcPos = this.addNode(id+"-dcpos", -40, -50, "load", "DC+");
    this.dcNeg = this.addNode(id+"-dcneg", -10, -50, "load", "DC-");
    this.acFase = this.addNode(id+"-acfase", 40, -50, "source-L3", "AC F");
    this.acNeutro = this.addNode(id+"-acneutro", 70, -50, "source-N", "AC N");
  }
  draw() {
    const { sx, s } = this.getScale();
    this.drawBox(COLORS.amber);
    push();
    fill(COLORS.bg);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(9, Math.round(12 * s)));
    text("220V AC", this.x + 55 * sx, this.y);
    pop();
  }
}
class Bateria extends Component {
  constructor(id, x, y, label, type) {
    super(id, x, y, label, 120, 80);
    if (type === "1") {
      this.neg = this.addNode(id+"-neg", -40, -40, "source-N", "-");
      this.pos = this.addNode(id+"-pos", 40, -40, "source-L2", "+");
    } else {
      this.neg = this.addNode(id+"-neg", -40, -40, "source-L2", "-");
      this.pos = this.addNode(id+"-pos", 40, -40, "source-L1", "+");
    }
  }
  draw() {
    const { s } = this.getScale();
    this.drawBox(COLORS.amber);
    push();
    fill(COLORS.bg);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(9, Math.round(12 * s)));
    text("12V", this.x, this.y);
    pop();
  }
}

class TermomagneticoIndustrial extends Component {
  constructor(id, x, y, label="Disyuntor Magnetotérmico 3P+N", rating="32A") {
    super(id, x, y, label, 160, 100);
    this.isBoard = true;
    this.interactive = true;
    this.closed = true;
    this.rating = rating;
    // Bornes superiores (Entrada de línea)
    this.inL1 = this.addNode(id+"-in-l1", -50, -40, "main", "L1-IN");
    this.inL2 = this.addNode(id+"-in-l2", -20, -40, "main", "L2-IN");
    this.inL3 = this.addNode(id+"-in-l3", 20, -40, "main", "L3-IN");
    this.inN  = this.addNode(id+"-in-n",  50, -40, "main", "N-IN");
    // Bornes inferiores (Salida protegida)
    this.outL1 = this.addNode(id+"-out-l1", -50, 40, "main", "L1-OUT");
    this.outL2 = this.addNode(id+"-out-l2", -20, 40, "main", "L2-OUT");
    this.outL3 = this.addNode(id+"-out-l3", 20, 40, "main", "L3-OUT");
    this.outN  = this.addNode(id+"-out-n",  50, 40, "main", "N-OUT");
  }
  internalEdges() {
    if (!this.closed) return [];
    return [
      [this.inL1, this.outL1],
      [this.inL2, this.outL2],
      [this.inL3, this.outL3],
      [this.inN, this.outN]
    ];
  }
  onPress() {
    this.closed = !this.closed;
    analizarCircuito();
  }
  reset() { this.closed = true; }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.closed ? COLORS.green : COLORS.red);
    push();
    rectMode(CENTER);
    // Palanca industrial
    fill(this.closed ? "#10b981" : "#ef4444");
    stroke(COLORS.panel);
    strokeWeight(Math.max(1, 1.5 * s));
    rect(this.x, this.y, 40 * sx, 20 * sy, Math.max(2, 4 * s));
    noStroke();
    fill("#ffffff");
    textAlign(CENTER, CENTER);
    textSize(Math.max(8, Math.round(11 * s)));
    text(this.closed ? "ON (I)" : "OFF (O)", this.x, this.y);
    pop();
  }
}

class DisyuntorDiferencialIndustrial extends Component {
  constructor(id, x, y, label="Interruptor Diferencial 4P 30mA", rating="40A 30mA") {
    super(id, x, y, label, 160, 100);
    this.isBoard = true;
    this.interactive = true;
    this.closed = true;
    this.rating = rating;
    // Entradas
    this.inL1 = this.addNode(id+"-in-l1", -50, -40, "main", "L1-IN");
    this.inL2 = this.addNode(id+"-in-l2", -20, -40, "main", "L2-IN");
    this.inL3 = this.addNode(id+"-in-l3", 20, -40, "main", "L3-IN");
    this.inN  = this.addNode(id+"-in-n",  50, -40, "main", "N-IN");
    // Salidas
    this.outL1 = this.addNode(id+"-out-l1", -50, 40, "main", "L1-OUT");
    this.outL2 = this.addNode(id+"-out-l2", -20, 40, "main", "L2-OUT");
    this.outL3 = this.addNode(id+"-out-l3", 20, 40, "main", "L3-OUT");
    this.outN  = this.addNode(id+"-out-n",  50, 40, "main", "N-OUT");
  }
  internalEdges() {
    if (!this.closed) return [];
    return [
      [this.inL1, this.outL1],
      [this.inL2, this.outL2],
      [this.inL3, this.outL3],
      [this.inN, this.outN]
    ];
  }
  onPress(mx, my) {
    const { sx, s } = this.getScale();
    // Botón de test
    if (dist(mx, my, this.x + 50 * sx, this.y) < Math.max(10, 14 * s)) {
      this.closed = false;
    } else {
      this.closed = !this.closed;
    }
    analizarCircuito();
  }
  reset() { this.closed = true; }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.closed ? COLORS.cyan : COLORS.red);
    push();
    rectMode(CENTER);
    // Palanca
    fill(this.closed ? "#0ea5e9" : "#ef4444");
    stroke(COLORS.panel);
    strokeWeight(Math.max(1, 1.5 * s));
    rect(this.x - 15 * sx, this.y, 35 * sx, 20 * sy, Math.max(2, 4 * s));
    fill("#ffffff");
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(8, Math.round(10 * s)));
    text(this.closed ? "I" : "O", this.x - 15 * sx, this.y);

    // Botón de Test "T"
    stroke("#d97706");
    fill("#fef3c7");
    rect(this.x + 50 * sx, this.y, 22 * sx, 20 * sy, Math.max(2, 4 * s));
    fill("#b45309");
    noStroke();
    text("T", this.x + 50 * sx, this.y);
    pop();
  }
}

class ReleTermico extends Component {
  constructor(id, x, y, label="Relé Térmico F2") {
    super(id, x, y, label, 140, 100);
    this.interactive = true;
    this.tripped = false;
    // Potencia principal
    this.l1 = this.addNode(id+"-L1", -40, -40, "main", "1");
    this.l2 = this.addNode(id+"-L2", 0, -40, "main", "3");
    this.l3 = this.addNode(id+"-L3", 40, -40, "main", "5");
    this.t1 = this.addNode(id+"-T1", -40, 40, "main", "2");
    this.t2 = this.addNode(id+"-T2", 0, 40, "main", "4");
    this.t3 = this.addNode(id+"-T3", 40, 40, "main", "6");
    // Contactos auxiliares de mando
    this.nc95 = this.addNode(id+"-95", -50, 0, "aux", "95");
    this.nc96 = this.addNode(id+"-96", -25, 0, "aux", "96");
    this.no97 = this.addNode(id+"-97", 25, 0, "aux", "97");
    this.no98 = this.addNode(id+"-98", 50, 0, "aux", "98");
  }
  internalEdges() {
    let edges = [ [this.l1, this.t1], [this.l2, this.t2], [this.l3, this.t3] ];
    if (!this.tripped) {
      edges.push([this.nc95, this.nc96]);
    } else {
      edges.push([this.no97, this.no98]);
    }
    return edges;
  }
  onPress() {
    this.tripped = !this.tripped;
    analizarCircuito();
  }
  reset() { this.tripped = false; }
  draw() {
    const { sx, sy, s } = this.getScale();
    this.drawBox(this.tripped ? COLORS.red : COLORS.panel);
    push();
    rectMode(CENTER);
    fill(this.tripped ? COLORS.red : COLORS.muted);
    noStroke();
    rect(this.x, this.y, 24 * sx, 12 * sy, Math.max(2, 3 * s));
    fill("#ffffff");
    textAlign(CENTER, CENTER);
    textSize(Math.max(7, Math.round(9 * s)));
    text(this.tripped ? "TRIP" : "RESET", this.x, this.y);
    pop();
  }
}

class BarraTetrapolar extends Component {
  constructor(id, x, y, label="Barra de Distribución Tetrapolar") {
    super(id, x, y, label, 240, 100);
    this.isBoard = true;
    this.bars = [];
    const busLabels = ["Neutro (N)", "Fase L1 (R)", "Fase L2 (S)", "Fase L3 (T)"];
    for (let i=0; i<4; i++) {
      let b1 = this.addNode(`${id}-b${i}-1`, -80, -30 + i*20, "bar", `${busLabels[i]} 1`);
      let b2 = this.addNode(`${id}-b${i}-2`, 0, -30 + i*20, "bar", `${busLabels[i]} 2`);
      let b3 = this.addNode(`${id}-b${i}-3`, 80, -30 + i*20, "bar", `${busLabels[i]} 3`);
      this.bars.push([b1, b2, b3]);
    }
  }
  internalEdges() {
    let edges = [];
    for (let i=0; i<4; i++) {
      edges.push([this.bars[i][0], this.bars[i][1]]);
      edges.push([this.bars[i][1], this.bars[i][2]]);
    }
    return edges;
  }
  draw() { 
    const { sx, sy, s } = this.getScale();
    this.drawBox(COLORS.panel); 
    push();
    rectMode(CENTER);
    for(let i=0; i<4; i++) {
      const busY = this.y + (-30 + i*20) * sy;
      // Barra de cobre/conductora proporcional y pulida
      fill(i === 0 ? "#475569" : (i === 1 ? "#d97706" : (i === 2 ? "#b45309" : "#92400e")));
      stroke(COLORS.cyan);
      strokeWeight(Math.max(1, 1.8 * s));
      rect(this.x, busY, this.w - 20 * sx, Math.max(6, 11 * sy), Math.max(2, 3 * s));
      
      // Bornes visuales de conexión
      fill("#0f172a");
      stroke(COLORS.cyan);
      strokeWeight(1);
      circle(this.bars[i][0].x, busY, Math.max(6, 8 * s));
      circle(this.bars[i][1].x, busY, Math.max(6, 8 * s));
      circle(this.bars[i][2].x, busY, Math.max(6, 8 * s));
    }
    pop();
  }
}

class BarraBipolar extends Component {
  constructor(id, x, y, label="Barra de Distribución Bipolar") {
    super(id, x, y, label, 200, 80);
    this.isBoard = true;
    this.bars = [];
    const busLabels = ["0V / Neutro", "5V / Fase"];
    for (let i=0; i<2; i++) {
      let b1 = this.addNode(`${id}-b${i}-1`, -60, -15 + i*30, "bar", `${busLabels[i]} 1`);
      let b2 = this.addNode(`${id}-b${i}-2`, 0, -15 + i*30, "bar", `${busLabels[i]} 2`);
      let b3 = this.addNode(`${id}-b${i}-3`, 60, -15 + i*30, "bar", `${busLabels[i]} 3`);
      this.bars.push([b1, b2, b3]);
    }
  }
  internalEdges() {
    let edges = [];
    for (let i=0; i<2; i++) {
      edges.push([this.bars[i][0], this.bars[i][1]]);
      edges.push([this.bars[i][1], this.bars[i][2]]);
    }
    return edges;
  }
  draw() { 
    const { sx, sy, s } = this.getScale();
    this.drawBox(COLORS.panel); 
    push();
    rectMode(CENTER);
    for(let i=0; i<2; i++) {
      const busY = this.y + (-15 + i*30) * sy;
      fill(i === 0 ? "#475569" : "#d97706");
      stroke(COLORS.cyan);
      strokeWeight(Math.max(1, 1.8 * s));
      rect(this.x, busY, this.w - 20 * sx, Math.max(8, 12 * sy), Math.max(2, 3 * s));
      
      fill("#0f172a");
      stroke(COLORS.cyan);
      strokeWeight(1);
      circle(this.bars[i][0].x, busY, Math.max(6, 8 * s));
      circle(this.bars[i][1].x, busY, Math.max(6, 8 * s));
      circle(this.bars[i][2].x, busY, Math.max(6, 8 * s));
    }
    pop();
  }
}

class LM2596 extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Step-Down LM2596", 140, 80);
    this.inPos = this.addNode(id+"-inPos", -50, -20, "load", "IN+ 24V");
    this.inNeg = this.addNode(id+"-inNeg", -50, 20, "load", "IN- 0V");
    this.outPos = this.addNode(id+"-outPos", 50, -20, "load", "OUT+ 5V");
    this.outNeg = this.addNode(id+"-outNeg", 50, 20, "load", "OUT- 0V");
  }
  internalEdges() { return []; }
  evaluateElectromagnetics() {
    let changed = false;
    const active = this.inPos.potentials.has("L1") && this.inNeg.potentials.has("N");
    if (active && this.outPos.type !== "source-L3") {
      this.outPos.type = "source-L3";
      this.outNeg.type = "source-N";
      changed = true;
    } else if (!active && this.outPos.type === "source-L3") {
      this.outPos.type = "load";
      this.outNeg.type = "load";
      changed = true;
    }
    return changed;
  }
  draw() { this.drawBox(COLORS.cyan || "#0ea5e9"); }
}

class Turbina extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Turbina Hidro 5V", 120, 100);
    this.pos = this.addNode(id+"-pos", -20, -50, "load", "+");
    this.neg = this.addNode(id+"-neg", 20, -50, "load", "-");
    this.running = false;
  }
  evaluateElectromagnetics() {
    const wasRunning = this.running;
    this.running = this.pos.potentials.has("L3") && this.neg.potentials.has("N");
    return this.running !== wasRunning;
  }
  draw() {
    const { s } = this.getScale();
    this.drawBox(this.running ? COLORS.green : COLORS.switch);
    push();
    fill(COLORS.text);
    textAlign(CENTER, CENTER);
    textSize(Math.max(12, Math.round(24 * s)));
    text("Turbina", this.x, this.y);
    pop();
  }
}

class MotorDC extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Motor DC 12V", 100, 100);
    this.pos = this.addNode(id+"-pos", -20, -50, "load", "+");
    this.neg = this.addNode(id+"-neg", 20, -50, "load", "-");
    this.running = false;
  }
  evaluateElectromagnetics() {
    let changed = false;
    const wasRunning = this.running;
    this.running = this.pos.potentials.has("L2") && this.neg.potentials.has("N");
    if (wasRunning !== this.running) changed = true;
    return changed;
  }
  draw() {
    const { s } = this.getScale();
    this.drawBox(this.running ? COLORS.green : COLORS.switch);
    push();
    fill(COLORS.bg);
    circle(this.x, this.y, 40 * s); 
    if(this.running) {
        fill(COLORS.text);
        textAlign(CENTER,CENTER);
        textSize(Math.max(8, Math.round(12 * s)));
        text("RUN", this.x, this.y);
    }
    pop();
  }
}

const LEVELS = [
  {
    id: "arranque-directo",
    headline: "1 · Arranque Directo con Tablero y Barras",
    objective: "Tablero Principal de Fuerza y Control:\n1. Conecta la Alimentación (L1, L2, L3, N) a las entradas del Magnetotérmico (TM).\n2. De la salida del Magnetotérmico pasa al Diferencial (DIF).\n3. Desde la salida del Diferencial alimenta los 4 pisos de la Barra de Distribución Tetrapolar (Piso 1=N, Piso 2=L1, Piso 3=L2, Piso 4=L3).\n4. Desde las Barras alimenta el Contactor K1 (L1, L2, L3) y comanda la bobina A1-A2 con los pulsadores Start/Stop y retención (13-14).\n5. De la salida del Contactor (T1, T2, T3) alimenta el Motor 3~ (U1, V1, W1).",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80, "Magnetotérmico General");
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80, "Diferencial General");
      const bus = new BarraTetrapolar("bus", 920, 110, "Barras Distribución 3P+N");
      
      const pStop = new Pushbutton("pStop", 200, 300, "Parada (NC)", "NC");
      const pStart = new Pushbutton("pStart", 350, 300, "Marcha (NO)", "NO");
      const k1 = new Contactor("k1", 580, 360, "Contactor K1");
      const m1 = new Motor3Phase("m1", 920, 360, "Motor Trifásico M1");
      
      return { check: () => k1.active && m1.running };
    }
  },
  {
    id: "control-fuerza-2",
    headline: "2 · Arranque desde dos estaciones con Tablero y Barras",
    objective: "Mando desde 2 Estaciones (Botoneras Dobles):\n1. Cablea la protección general (Red -> Termomagnético -> Diferencial -> Barras Tetrapolares).\n2. Conecta dos botones de parada (NC) en serie.\n3. Conecta dos botones de marcha (NO) en paralelo entre sí y en paralelo con la retención 13-14 de K1.\n4. Al pulsar cualquier marcha, el motor debe arrancar y mantenerse enclavado.",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);

      const s0a = new Pushbutton("s0a", 150, 260, "Parada 1", "NC");
      const s0b = new Pushbutton("s0b", 280, 260, "Parada 2", "NC");
      const s1a = new Pushbutton("s1a", 150, 400, "Marcha 1", "NO");
      const s1b = new Pushbutton("s1b", 280, 400, "Marcha 2", "NO");
      const k1 = new Contactor("k1", 580, 360, "Contactor K1");
      const m1 = new Motor3Phase("m1", 920, 360, "Motor M1");

      return { check: () => k1.active && m1.running };
    }
  },
  {
    id: "control-fuerza-3",
    headline: "3 · Inversión de Giro Manual (K1 Horario / K2 Antihorario)",
    objective: "Inversor de Giro con Enclavamiento Cruzado:\n1. Alimenta las Barras Tetrapolares a través de las protecciones.\n2. Conecta K1 para giro horario directo (L1->U1, L2->V1, L3->W1).\n3. Conecta K2 permutando dos fases (L1->W1, L2->V1, L3->U1).\n4. Comanda las bobinas para activar el sentido de giro deseado con protección de contactores.",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);

      const pStop = new Pushbutton("pStop", 150, 260, "Parada General", "NC");
      const pFwd = new Pushbutton("pFwd", 280, 260, "Marcha FWD", "NO");
      const pRev = new Pushbutton("pRev", 280, 400, "Marcha REV", "NO");
      const k1 = new Contactor("k1", 500, 360, "K1 (Horario)");
      const k2 = new Contactor("k2", 700, 360, "K2 (Antihorario)");
      const m1 = new Motor3Phase("m1", 960, 360, "Motor 3~");

      return { check: () => (k1.active || k2.active) && m1.running };
    }
  },
  {
    id: "control-fuerza-4",
    headline: "4 · Arranque Secuencial Temporizado (2 Motores)",
    objective: "Secuencia Automática de 2 Motores:\n1. Alimenta las Barras de Distribución Tetrapolares mediante el Tablero.\n2. Al presionar Marcha se energiza K1 y el temporizador T1.\n3. Tras el retardo de T1, su contacto activa K2 para arrancar el Motor 2.\n4. Ambos motores quedan operando protegidos desde las barras.",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);

      const pStop = new Pushbutton("pStop", 150, 260, "Parada", "NC");
      const pStart = new Pushbutton("pStart", 280, 260, "Marcha", "NO");
      const k1 = new Contactor("k1", 480, 340, "K1 (Motor 1)");
      const timer = new Timer("t1", 660, 340, "Timer 2s", 2000);
      const k2 = new Contactor("k2", 840, 340, "K2 (Motor 2)");
      const m1 = new Motor3Phase("m1", 480, 560, "Motor M1");
      const m2 = new Motor3Phase("m2", 840, 560, "Motor M2");

      return { check: () => k1.active && k2.active };
    }
  },
  {
    id: "control-fuerza-5",
    headline: "5 · Arranque Estrella-Triángulo (Y-Δ)",
    objective: "Arranque a Tensión Reducida Y-Δ:\n1. Alimenta la Barra Tetrapolar desde el Tablero de Protecciones.\n2. Conecta el Contactor de Línea K1 y el Contactor Estrella K3.\n3. El Temporizador desconecta la Estrella y conecta el Contactor Triángulo K2.\n4. Verifica que el contactor K1 y K2 o K3 queden activos.",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);

      const pStart = new Pushbutton("pStart", 180, 280, "Start", "NO");
      const k1 = new Contactor("k1", 380, 360, "K1 Línea");
      const k2 = new Contactor("k2", 580, 360, "K2 Triángulo");
      const k3 = new Contactor("k3", 780, 360, "K3 Estrella");
      const m1 = new Motor3Phase("m1", 1000, 360, "Motor 3~");

      return { check: () => k1.active && (k2.active || k3.active) };
    }
  },
  {
    id: "control-fuerza-6",
    headline: "6 · Tablero de Distribución Tetrapolar con 2 Cargas",
    objective: "Distribución Equilibrada con Barras Tetrapolares:\n1. Lleva los 3 conductores de fase y neutro al tablero de protección (TM + DIF).\n2. Conecta la salida a la Barra Tetrapolar principal de 4 niveles.\n3. Reparte alimentación trifásica independiente para el Motor M1 y Motor M2 desde las barras.",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);

      const k1 = new Contactor("k1", 400, 340, "K1 Bomba 1");
      const k2 = new Contactor("k2", 700, 340, "K2 Bomba 2");
      const m1 = new Motor3Phase("m1", 400, 560, "Bomba 1");
      const m2 = new Motor3Phase("m2", 700, 560, "Bomba 2");

      return { check: () => k1.active || k2.active || m1.running || m2.running };
    }
  },
  {
    id: "plc-1",
    headline: "25 · Automatización PLC 1: Marcha / Paro Básico",
    objective: "Control Automatizado con Siemens LOGO!:\n1. Alimenta el PLC (L1 y N) desde la Barra Tetrapolar o Tablero.\n2. Conecta el pulsador de marcha a la entrada digital I1 del PLC.\n3. Conecta la salida a relé Q1 para activar el Contactor K1 del motor.\n4. Carga el programa Ladder: I1 -> ( Q1 ).",
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);

      const sStart = new Pushbutton("sStart", 200, 280, "Pulsador I1", "NO");
      const plc = new PLCLogo("plc", 520, 300, "LOGO! 230RC");
      const k1 = new Contactor("k1", 820, 300, "Contactor K1");
      const m1 = new Motor3Phase("m1", 1080, 300, "Motor M1");

      return { check: () => plc.powered && (k1.active || m1.running) };
    }
  },
  {
    id: "plc-2",
    headline: "26 · Automatización PLC 2: Control con 2 Sensores",
    objective: "Lógica Condicional PLC:\n1. Alimenta el PLC y cablea los sensores digitales S1 (I1) y S2 (I2).\n2. Conecta la bobina de mando a la salida Q1.\n3. Configura en el editor Ladder la condición de arranque combinada.",
    build() {
      const src = new Source3Phase(180, 80);
      const bus = new BarraTetrapolar("bus", 450, 80);
      const s1 = new Pushbutton("s1", 180, 260, "Sensor I1", "NO");
      const s2 = new Pushbutton("s2", 180, 420, "Sensor I2", "NO");
      const plc = new PLCLogo("plc", 520, 320, "LOGO! 24V");
      const k1 = new Contactor("k1", 850, 320, "Contactor K1");
      const m1 = new Motor3Phase("m1", 1080, 320, "Motor M1");

      return { check: () => plc.powered && k1.active };
    }
  },
  {
    id: "plc-3",
    headline: "27 · Automatización PLC 3: Enclavamiento Interno",
    objective: "Auto-retención por Software:\n1. Cablea la alimentación del PLC y los pulsadores de Marcha (I1) y Paro (I2).\n2. El relé de salida Q1 debe alimentar la carga motriz.\n3. Realiza la auto-retención dentro de la tabla Ladder sin relés físicos externos.",
    build() {
      const src = new Source3Phase(180, 80);
      const bus = new BarraTetrapolar("bus", 450, 80);
      const pStop = new Pushbutton("pStop", 180, 260, "Paro (I2)", "NC");
      const pStart = new Pushbutton("pStart", 180, 420, "Marcha (I1)", "NO");
      const plc = new PLCLogo("plc", 520, 320, "LOGO! 24V");
      const k1 = new Contactor("k1", 850, 320, "Contactor K1");
      const m1 = new Motor3Phase("m1", 1080, 320, "Motor M1");

      return { check: () => plc.powered && k1.active };
    }
  },
  {
    id: "plc-13",
    headline: "37 · Variador de Frecuencia (VFD) y Motor",
    objective: "Control Electrónico de Velocidad:\n1. Alimenta el VFD conectando L1, L2 y L3 desde la fuente o barra trifásica.\n2. Conecta U, V y W del VFD a los bornes U1, V1 y W1 del motor.\n3. Usa la salida de 24V del VFD para alimentar un botón pulsador (FWD).\n4. Conecta el retorno del botón a la entrada DI1 del VFD para giro a la derecha.",
    build() {
      const source = new Source3Phase(200, 150);
      const vfd = new VFD("vfd", 500, 350);
      const m1 = new Motor3Phase("m1", 800, 400);
      const pFwd = new Pushbutton("pFwd", 200, 400, "Start FWD", "NO");
      
      return { check: () => vfd.running && m1.running };
    }
  },
  {
    id: "plc-escuela",
    headline: "38 · Tablero Escuela Proyecto Futuro (Híbrido + Barras)",
    objective: "SISTEMA HÍBRIDO, BARRAS DE DISTRIBUCIÓN Y TURBINA 5V:\n1. Baterías a Barra 24V: Conecta Batería 1 y 2 en serie (+BAT1 a -BAT2). Lleva el (-) de BAT1 al Piso 1 (0V) y el (+) de BAT2 al Piso 3 (24V) de la Barra Tetrapolar.\n2. Inversor y Panel: Conecta el panel al Inversor/MPPT y los bornes de batería a la Barra Tetrapolar.\n3. Step-Down LM2596: Alimenta IN+ con 24V (Piso 3) e IN- con 0V (Piso 1). OUT+ al Piso 2 (5V) y OUT- al Piso 1 (0V) de la Barra Bipolar.\n4. PLC LOGO!: Aliméntalo con 24V y 0V desde la Barra Tetrapolar.\n5. Turbina 5V: Desde Piso 2 (5V) de la Barra Bipolar a Q1.1 del PLC, de Q1.2 al (+) de la Turbina, y (-) al 0V de la Barra Bipolar.\n6. PLC Ladder: Configura el bucle o temporizador para poner en marcha la Turbina.",
    build() {
      const panel = new PanelSolar("panel", 120, 80);
      const mppt = new ControladorCarga("mppt", 350, 80);
      const inv = new Inversor("inv", 600, 80);
      
      const b1 = new Bateria("b1", 120, 250, "Batería 1", "1");
      const b2 = new Bateria("b2", 120, 450, "Batería 2", "2");
      const barraDC = new BarraTetrapolar("barradc", 380, 280, "Barra Tetrapolar DC (24V/0V)");
      const barraAC = new BarraTetrapolar("barraac", 650, 650, "Barra Tetrapolar AC (220V)");
      
      const stepDown = new LM2596("stepdown", 200, 580);
      const barra5V = new BarraBipolar("barra5v", 400, 580, "Barra Bipolar 5V");
      
      const plc = new PLCLogo("plc", 650, 300, "LOGO! 24V");
      const m1 = new Turbina("m1", 650, 550);
      const s1 = new Pushbutton("s1", 400, 450, "Sensor 1 (I1)", "NO");
      const s2 = new Pushbutton("s2", 500, 450, "Sensor 2 (I2)", "NO");
      return { check: () => components.some(c => c instanceof Turbina && c.running) };
    }
  }
];

function generateLevelFallback(id) {
  const isPLC = id.startsWith("plc");
  const num = id.replace(/\D/g, "") || "1";
  return {
    id: id,
    headline: isPLC ? `Automatización PLC Industrial ${num}` : `Control & Fuerza Industrial ${num}`,
    objective: `Plantilla Industrial ${num}:\n1. Alimenta el Tablero con Termomagnético y Diferencial.\n2. Distribuye la energía mediante la Barra Tetrapolar.\n3. Cablea el circuito de mando y fuerza para activar el actuador motriz.`,
    build() {
      const src = new Source3Phase(180, 80);
      const tm = new TermomagneticoIndustrial("tm", 400, 80);
      const dif = new DisyuntorDiferencialIndustrial("dif", 620, 80);
      const bus = new BarraTetrapolar("bus", 920, 110);
      
      if (isPLC) {
        const s1 = new Pushbutton("s1", 200, 320, "Start", "NO");
        const plc = new PLCLogo("plc", 520, 340, "LOGO! Industrial");
        const k1 = new Contactor("k1", 820, 340, "Contactor K1");
        const m1 = new Motor3Phase("m1", 1080, 340, "Motor 3~");
        return { check: () => plc.powered && (k1.active || m1.running) };
      } else {
        const pStop = new Pushbutton("pStop", 200, 320, "Stop", "NC");
        const pStart = new Pushbutton("pStart", 350, 320, "Start", "NO");
        const k1 = new Contactor("k1", 600, 360, "Contactor K1");
        const m1 = new Motor3Phase("m1", 940, 360, "Motor 3~");
        return { check: () => k1.active && m1.running };
      }
    }
  };
}

function analizarCircuito() {
  circuitAnalysis = { short: false, shortDetails: "", complete: false };
  let changed = true;
  let iterations = 0;
  
  while (changed && iterations < 15) {
    changed = false;
    iterations++;
    
    nodes.forEach(n => n.potentials.clear());
    const sources = nodes.filter(n => n.type.startsWith("source-"));
    sources.forEach(s => s.potentials.add(s.type.replace("source-", "")));
    
    const adj = new Map();
    nodes.forEach(n => adj.set(n, []));
    wires.forEach(w => { adj.get(w.from).push(w.to); adj.get(w.to).push(w.from); });
    components.forEach(c => {
      c.internalEdges().forEach(([a, b]) => { adj.get(a).push(b); adj.get(b).push(a); });
    });
    
    const queue = [...sources];
    while(queue.length > 0) {
      const current = queue.shift();
      const currentPots = Array.from(current.potentials);
      adj.get(current).forEach(neighbor => {
        let added = false;
        currentPots.forEach(p => {
          if (!neighbor.potentials.has(p)) {
            neighbor.potentials.add(p);
            added = true;
          }
        });
        if (added) queue.push(neighbor);
      });
    }
    
    let shorted = false;
    nodes.forEach(n => {
      const p = Array.from(n.potentials);
      let phases = p.filter(x => x.startsWith("L"));
      let neutrals = p.filter(x => x === "N");
      if (phases.length > 1 || (phases.length > 0 && neutrals.length > 0)) shorted = true;
    });
    
    if (shorted) {
      circuitAnalysis.short = true;
      break; 
    }
    
    components.forEach(c => {
      if (typeof c.evaluateElectromagnetics === 'function') {
        if (c.evaluateElectromagnetics()) changed = true;
      }
    });
  }
  
  // Evaluate goal
  if (!circuitAnalysis.short && activeLevel) {
    components.filter(c => c instanceof Motor3Phase).forEach(motor => {
        motor.running = motor.u1.potentials.has("L1") && motor.v1.potentials.has("L2") && motor.w1.potentials.has("L3");
    });
    circuitAnalysis.complete = activeLevel.rules.check();
    
    const statEl = document.getElementById("circuit-status");
    const statCard = statEl.closest(".status-card");
    if (circuitAnalysis.short) {
      statEl.textContent = "¡CORTOCIRCUITO!";
      statEl.style.color = COLORS.red;
      if (statCard) { statCard.style.background = "var(--hot-bg)"; statCard.style.borderColor = "var(--red)"; }
    } else if (circuitAnalysis.complete) {
      statEl.textContent = "¡Plantilla completa!";
      statEl.style.color = COLORS.green;
      if (statCard) { statCard.style.background = "var(--ok-bg)"; statCard.style.borderColor = "var(--green)"; }
    } else {
      statEl.textContent = "Circuito incompleto o apagado.";
      statEl.style.color = COLORS.cyan;
      if (statCard) { statCard.style.background = "var(--micro-bg)"; statCard.style.borderColor = "var(--cyan)"; }
    }
  }
}

function setup() {
  pixelDensity(typeof window !== "undefined" && window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1);
  const canvas = createCanvas(1300, 950);
  canvas.parent("simulator-canvas");
  
  // Link toolbar buttons
  const exportBtn = document.getElementById("btn-export-pdf");
  if (exportBtn) exportBtn.addEventListener("click", () => exportDiagramPDF());
  const copyDiagBtn = document.getElementById("btn-copy-diag");
  if (copyDiagBtn) copyDiagBtn.addEventListener("click", () => copySystemReport());
  const autoBtn = document.getElementById("btn-autocomplete");
  if (autoBtn) autoBtn.addEventListener("click", () => autocompleteCurrentLevel());
  const nextBtn = document.getElementById("next-level");
  if (nextBtn) nextBtn.addEventListener("click", () => nextLevelTemplate());

  loadLevel("arranque-directo");
  
  document.querySelectorAll(".wire-tool").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".wire-tool").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedWireType = btn.dataset.wireType;
    });
  });
  
  const undoBtn = document.getElementById("undo-wire");
  if (undoBtn) undoBtn.addEventListener("click", () => {
    if (wires.length > 0) {
      wires.pop();
      analizarCircuito();
    }
  });

  document.getElementById("clear-wires").addEventListener("click", () => { wires = []; components.forEach(c => c.reset()); analizarCircuito(); });
  
  const select = document.querySelector("#level-select");
  if (select) {
    select.addEventListener("change", () => loadLevel(select.value));
    
    document.querySelectorAll(".tier-tabs button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tier-tabs button").forEach(b => b.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");
        const current = select.selectedOptions[0];
        if (!current || current.dataset.tier !== button.dataset.tier) {
          select.value = button.dataset.first;
          loadLevel(select.value);
        }
      });
    });
  }
}

function nextLevelTemplate() {
  const select = document.getElementById("level-select");
  if (!select) return;
  const currentIndex = select.selectedIndex;
  const nextIndex = (currentIndex + 1) % select.options.length;
  select.selectedIndex = nextIndex;
  loadLevel(select.value);
}

function loadLevel(id) {
  const def = LEVELS.find(l => l.id === id) || generateLevelFallback(id);
  nodes = []; wires = []; components = []; draggingFrom = null;
  activePLC = null; plcGridData = [];
  activeLevel = { id: def.id, headline: def.headline, objective: def.objective, rules: def.build() };
    
  const titleEl = document.getElementById("level-title");
  if (titleEl && activeLevel.headline) titleEl.textContent = activeLevel.headline;
  
  const select = document.getElementById("level-select");
  if (select && select.value !== activeLevel.id) {
    select.value = activeLevel.id;
  }
  
  // Update difficulty indicator and active tier tab
  if (select && select.selectedOptions[0]) {
    const opt = select.selectedOptions[0];
    const diffEl = document.getElementById("level-difficulty");
    if (diffEl) {
      diffEl.textContent = `${opt.dataset.tierLabel || 'Control'} · plantilla ${opt.dataset.index || 1} de ${select.options.length}`;
      diffEl.setAttribute("data-tier", opt.dataset.tier || "control");
    }
    const blurbEl = document.getElementById("tier-blurb");
    const activeTab = document.querySelector(`.tier-tabs button[data-tier="${opt.dataset.tier}"]`);
    if (blurbEl) {
      blurbEl.textContent = (activeTab && activeTab.dataset ? activeTab.dataset.blurb : "") || "Automatización y tableros industriales.";
    }
    document.querySelectorAll(".tier-tabs button").forEach(b => {
      b.setAttribute("aria-pressed", b.dataset && b.dataset.tier === opt.dataset.tier ? "true" : "false");
    });
  }

  document.getElementById("level-objective").textContent = activeLevel.objective || "";
  const tut = document.getElementById("level-tutorial");
  if (tut) {
    tut.innerHTML = "";
    if(activeLevel.objective) {
      activeLevel.objective.split(".").filter(s => s.trim().length > 3).forEach(step => {
        const li = document.createElement("li");
        li.textContent = step.trim() + ".";
        tut.appendChild(li);
      });
    }
  }

  analizarCircuito();
}

function draw() {
  background(COLORS.bg);
  wires.forEach(w => w.draw());
  components.forEach(c => c.draw());
  nodes.forEach(n => n.draw());
  
  if (draggingFrom) {
    stroke(COLORS.cyan); strokeWeight(2); line(draggingFrom.x, draggingFrom.y, mouseX, mouseY);
  }
}

function nodeAt(x, y) { return nodes.find(n => n.isHovered(x, y)); }
function componentAt(x, y) { return components.find(c => c.contains(x, y)); }

function mousePressed() {
  const modal = document.getElementById("plc-modal");
  if (modal && !modal.classList.contains("hidden")) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  pointer = {x: mouseX, y: mouseY};
  
  const hit = nodeAt(mouseX, mouseY);
  
  if (selectedWireType === "eraser" && hit) {
    const prevLength = wires.length;
    wires = wires.filter(w => w.from !== hit && w.to !== hit);
    if (wires.length < prevLength) analizarCircuito();
    return false;
  }

  if (hit) { draggingFrom = hit; return false; }
  
  const comp = componentAt(mouseX, mouseY);
  if (comp) {
    if (comp.inResizeHandle && comp.inResizeHandle(mouseX, mouseY)) {
      resizingComponent = comp;
      resizeStart = { w: comp.w, h: comp.h, mx: mouseX, my: mouseY };
    } else {
      draggingComponent = comp;
      dragOffset = { x: mouseX - comp.x, y: mouseY - comp.y };
      comp.onPress(mouseX, mouseY);
      analizarCircuito();
    }
    return false;
  }
  return false;
}

function mouseReleased() {
  const modal = document.getElementById("plc-modal");
  if (modal && !modal.classList.contains("hidden")) return;
  
  if (resizingComponent) {
    resizingComponent = null;
    return false;
  }
  if (draggingComponent) {
    draggingComponent = null;
    // Release momentary pushbuttons (preserve toggle sensors/switches)
    components.filter(c => c instanceof Pushbutton && !c.isToggle).forEach(c => {
      if (c.pressed) { c.pressed = false; analizarCircuito(); }
    });
    return false;
  }
  
  if (draggingFrom) {
    const target = nodeAt(mouseX, mouseY);
    if (target && target !== draggingFrom) {
      wires.push(new Wire(draggingFrom, target, selectedWireType));
      analizarCircuito();
    }
    draggingFrom = null;
  }
}

function mouseDragged() {
  const modal = document.getElementById("plc-modal");
  if (modal && !modal.classList.contains("hidden")) return;
  
  if (resizingComponent) {
    const nw = Math.max(80, resizeStart.w + (mouseX - resizeStart.mx) * 2);
    const nh = Math.max(80, resizeStart.h + (mouseY - resizeStart.my) * 2);
    resizingComponent.resize(nw, nh);
    return false;
  }
  
  if (draggingComponent) {
    if (draggingComponent.move) {
      draggingComponent.move(mouseX - dragOffset.x, mouseY - dragOffset.y);
    }
    return false;
  }
  
  pointer = {x: mouseX, y: mouseY};
}


// --- PLC LADDER EDITOR LOGIC ---
let activePLC = null;
let plcGridData = []; // 4 rungs x 6 columns
let plcCurrentTool = "NO";

function initPLCEditor() {
  for(let r=0; r<4; r++) {
    let row = [];
    for(let c=0; c<6; c++) {
      row.push({ type: 'WIRE', operand: '' });
    }
    plcGridData.push(row);
  }
}

function renderPLCGrid() {
  const container = document.getElementById("plc-grid");
  if (!container) return;
  container.innerHTML = "";
  for(let r=0; r<4; r++) {
    const rungDiv = document.createElement("div");
    rungDiv.style.display = "flex";
    rungDiv.style.alignItems = "center";
    rungDiv.style.gap = "5px";
    
    const num = document.createElement("div");
    num.style.width = "30px";
    num.style.fontWeight = "bold";
    num.textContent = (r+1).toString();
    rungDiv.appendChild(num);
    
    // Left power rail
    const rail = document.createElement("div");
    rail.style.width = "4px"; rail.style.height = "60px"; rail.style.background = "black";
    rungDiv.appendChild(rail);
    
    for(let c=0; c<6; c++) {
      const cell = document.createElement("div");
      cell.className = "plc-cell";
      const data = plcGridData[r][c];
      
      let sym = "";
      if (data.type === 'NO') sym = "-| |-";
      if (data.type === 'NC') sym = "-|/|-";
      if (data.type === 'WIRE') sym = "-----";
      if (data.type === 'COIL') sym = "-( )-";
      
      const spanSym = document.createElement("div");
      spanSym.className = "plc-symbol";
      spanSym.textContent = sym;
      cell.appendChild(spanSym);
      
      if (data.operand) {
        const spanOp = document.createElement("div");
        spanOp.className = "plc-operand";
        spanOp.textContent = data.operand;
        cell.appendChild(spanOp);
      }
      
      cell.addEventListener("click", () => handleCellClick(r, c));
      rungDiv.appendChild(cell);
    }
    
    // Right power rail (only visually for coils)
    const rail2 = document.createElement("div");
    rail2.style.width = "4px"; rail2.style.height = "60px"; rail2.style.background = "black";
    rungDiv.appendChild(rail2);
    
    container.appendChild(rungDiv);
  }
}

const OPERANDS_IN = ['I1','I2','I3','I4','Q1','Q2','Q3','Q4','T1','T2'];
const OPERANDS_OUT = ['Q1','Q2','Q3','Q4','T1','T2'];

function handleCellClick(r, c) {
  const cell = plcGridData[r][c];
  
  if (plcCurrentTool === "ERASE") {
    cell.type = 'EMPTY';
    cell.operand = '';
  } else if (plcCurrentTool === "WIRE") {
    if (c === 5) return; // Cannot wire coil slot
    cell.type = 'WIRE';
    cell.operand = '';
  } else if (plcCurrentTool === "COIL") {
    if (c !== 5) return; // Coil only in last column
    if (cell.type === 'COIL') {
      let idx = OPERANDS_OUT.indexOf(cell.operand);
      cell.operand = OPERANDS_OUT[(idx + 1) % OPERANDS_OUT.length];
    } else {
      cell.type = 'COIL';
      cell.operand = 'Q1';
    }
  } else if (plcCurrentTool === "NO" || plcCurrentTool === "NC") {
    if (c === 5) return; // Contacts only in 0-4
    if (cell.type === plcCurrentTool) {
      let idx = OPERANDS_IN.indexOf(cell.operand);
      cell.operand = OPERANDS_IN[(idx + 1) % OPERANDS_IN.length];
    } else {
      cell.type = plcCurrentTool;
      cell.operand = 'I1';
    }
  }
  renderPLCGrid();
}

function getLadderForLevel(levelId) {
  // Retorna una matriz 4x6 de ladder adaptada a los requerimientos de cada plantilla PLC
  const emptyGrid = () => [
    [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
    [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
    [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
    [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
  ];

  if (levelId === "plc-escuela") {
    // Oscilador/Reloj con T1 y T2 que comanda la salida de la Turbina Q1
    return [
      [ {type: 'NC', operand: 'T2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'T1'} ],
      [ {type: 'NO', operand: 'T1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'T2'} ],
      [ {type: 'NO', operand: 'T1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-1") {
    // Marcha directa con auto-enclavamiento en Ladder: I1 o Q1 activan Q1
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-2") {
    // Condición AND de 2 sensores: I1 e I2 activan Q1
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'NO', operand: 'I2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-3") {
    // Enclavamiento / Auto-retención por software:
    // Rama 1: I1 (Marcha) en serie con I2 (Paro) activa Q1
    // Rama 2: Q1 (Retención) en serie con I2 mantiene Q1
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'NO', operand: 'I2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'NO', operand: 'I2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-4") {
    // Lógica OR de seguridad / 2 Pulsadores alternativos con auto-enclavamiento:
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'I2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-5") {
    // Temporizador a la conexión: I1 activa T1; T1 activa Q1 (con retención de Q1)
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'T1'} ],
      [ {type: 'NO', operand: 'T1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-6") {
    // Enclavamiento de giro cruzado (Inversión K1/Q1 vs K2/Q2):
    // Q1 con contacto NC de Q2; Q2 con contacto NC de Q1
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'NC', operand: 'Q2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'I2'}, {type: 'NC', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q2'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-7" || levelId === "plc-8") {
    // Cascada secuencial de 2 motores con retención: I1 arranca Q1; Q1 arranca Q2
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q2'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  } else if (levelId === "plc-9" || levelId === "plc-10") {
    // Arranque secuencial con temporizador T1 y retención: I1 activa Q1 y T1; T1 activa Q2
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'T1'} ],
      [ {type: 'NO', operand: 'T1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q2'} ]
    ];
  } else if (levelId === "plc-11" || levelId === "plc-12") {
    // Mando multietapa con parada de emergencia NC (I2): I1 con retención Q1 condicionado a no Paro I2
    return [
      [ {type: 'NO', operand: 'I1'}, {type: 'NO', operand: 'I2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'NO', operand: 'I2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q2'} ],
      [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
    ];
  }

  // Fallback por defecto para cualquier otra plantilla PLC con auto-enclavamiento:
  return [
    [ {type: 'NO', operand: 'I1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
    [ {type: 'NO', operand: 'Q1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
    [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ],
    [ {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'} ]
  ];
}

function autocompleteLadderEditor() {
  const currentLevelId = (activeLevel && activeLevel.id) ? activeLevel.id : "plc-1";
  plcGridData = getLadderForLevel(currentLevelId);
  renderPLCGrid();
}
window.autocompleteLadderEditor = autocompleteLadderEditor;

function openPLCEditor(plcComp) {
  activePLC = plcComp;
  if (plcComp.ladderGrid && Array.isArray(plcComp.ladderGrid)) {
    plcGridData = JSON.parse(JSON.stringify(plcComp.ladderGrid));
  } else if (plcGridData.length === 0) {
    const currentLevelId = (activeLevel && activeLevel.id) ? activeLevel.id : "plc-1";
    plcGridData = getLadderForLevel(currentLevelId);
  }
  
  document.getElementById("plc-modal").classList.remove("hidden");
  document.getElementById("plc-splash").style.display = "flex";
  document.getElementById("plc-splash").style.opacity = "1";
  document.getElementById("plc-editor-ui").classList.add("hidden");
  
  setTimeout(() => {
    document.getElementById("plc-splash").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("plc-splash").style.display = "none";
      document.getElementById("plc-editor-ui").classList.remove("hidden");
      renderPLCGrid();
    }, 1000);
  }, 1500);
}

const initPLCEvents = () => {
  const tools = document.querySelectorAll("#plc-toolbar button");
  tools.forEach(btn => {
    if (btn.id === "btn-plc-autocomplete") return;
    btn.addEventListener("click", () => {
      tools.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      plcCurrentTool = btn.dataset.tool;
    });
  });
  
  document.getElementById("btn-plc-autocomplete")?.addEventListener("click", () => {
    autocompleteLadderEditor();
  });

  document.getElementById("plc-close")?.addEventListener("click", () => {
    closePLC();
  });
  
  document.getElementById("plc-save")?.addEventListener("click", () => {
    savePLC();
  });
};

initPLCEvents();


function closePLC() {
  const modal = document.getElementById("plc-modal");
  if (modal) modal.classList.add("hidden");
  activePLC = null;
}
window.closePLC = closePLC;

function savePLC() {
  if (!activePLC) return;
  const gridSnap = JSON.parse(JSON.stringify(plcGridData));
  activePLC.ladderGrid = gridSnap;
  activePLC.program = (inputs, prevOutputs, prevTimers) => {
    let qStates = [false, false, false, false];
    let tStates = [false, false];
    const getVal = (op) => {
      if (op === 'I1') return inputs[0];
      if (op === 'I2') return inputs[1];
      if (op === 'I3') return inputs[2];
      if (op === 'I4') return inputs[3];
      if (op === 'Q1') return prevOutputs[0];
      if (op === 'Q2') return prevOutputs[1];
      if (op === 'Q3') return prevOutputs[2];
      if (op === 'Q4') return prevOutputs[3];
      if (op === 'T1') return prevTimers[0];
      if (op === 'T2') return prevTimers[1];
      return false;
    };
    for(let r=0; r<4; r++) {
      const rung = gridSnap[r];
      const coil = rung[5];
      if (coil.type !== 'COIL') continue;
      let pathTrue = true;
      for(let c=0; c<5; c++) {
        const cell = rung[c];
        if (cell.type === 'EMPTY') { pathTrue = false; break; }
        if (cell.type === 'WIRE') continue;
        const val = getVal(cell.operand);
        if (cell.type === 'NO' && !val) { pathTrue = false; break; }
        if (cell.type === 'NC' && val) { pathTrue = false; break; }
      }
      if (pathTrue) {
        if (coil.operand === 'Q1') qStates[0] = true;
        if (coil.operand === 'Q2') qStates[1] = true;
        if (coil.operand === 'Q3') qStates[2] = true;
        if (coil.operand === 'Q4') qStates[3] = true;
        if (coil.operand === 'T1') tStates[0] = true;
        if (coil.operand === 'T2') tStates[1] = true;
      }
    }
    return { q: qStates, t: tStates };
  };
  analizarCircuito();
  closePLC();

  const statEl = document.getElementById("circuit-status");
  if (statEl) {
    const prevText = statEl.textContent;
    statEl.textContent = "⚡ Programa Ladder compilado y cargado en PLC";
    setTimeout(() => { analizarCircuito(); }, 1200);
  }
}
window.savePLC = savePLC;


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
  // Call p5.js redraw if needed, though draw loop is constant
}

document.addEventListener("DOMContentLoaded", syncColors);

function copySystemReport() {
  const btn = document.getElementById("btn-copy-diag");
  let report = "--- REPORTE DE DIAGNÓSTICO INDUSTRIAL ---\n";
  components.forEach(c => {
    report += `\n[ ${c.label} ] (ID: ${c.id})\n`;
    if (c instanceof PLCLogo) {
      report += `  Estado: ${c.powered ? 'ENCENDIDO (Alimentación OK)' : 'APAGADO'}\n`;
    }
    if (c instanceof Motor3Phase) {
      report += `  Estado Motor 3~: ${c.running ? 'GIRANDO A VELOCIDAD NOMINAL' : 'DETENIDO'}\n`;
    }
    if (c instanceof VFD) {
      report += `  Variador VFD: ${c.running ? `OPERANDO (${c.frequency.toFixed(1)} Hz, Dir: ${c.direction})` : 'DETENIDO'}\n`;
    }
    if (c instanceof Turbina || c instanceof MotorDC) {
      report += `  Estado Carga DC/Hidro: ${c.running ? 'OPERANDO' : 'DETENIDO'}\n`;
    }
    c.nodes.forEach(n => {
      let connectedWires = wires.filter(w => w.from === n || w.to === n);
      let conns = connectedWires.map(w => {
        let other = w.from === n ? w.to : w.from;
        let otherComp = components.find(comp => comp.nodes.includes(other));
        return `${otherComp ? otherComp.label : '?'}(${other.label})`;
      });
      let pots = Array.from(n.potentials).join(",");
      report += `  - Borne "${n.label}": Potenciales=(${pots || 'sin tensión'}) -> Conectado a: ${conns.join(", ") || "Ninguno"}\n`;
    });
  });
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(report).then(() => {
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "✓ Copiado";
        setTimeout(() => btn.textContent = orig, 2000);
      }
    }).catch(err => {
      alert("Reporte copiado a consola (F12).");
      console.log(report);
    });
  } else {
    console.log(report);
    alert("Reporte impreso en consola de desarrollador.");
  }
}

function exportDiagramPDF() {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    alert("No se encontró el lienzo del diagrama.");
    return;
  }
  const imgData = canvas.toDataURL("image/png");
  let tableHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 10px; text-align: left;">Componente Origen</th>
          <th style="padding: 10px; text-align: left;">Borne</th>
          <th style="padding: 10px; text-align: left;">Componente Destino</th>
          <th style="padding: 10px; text-align: left;">Borne</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  wires.forEach(w => {
    let fromComp = components.find(c => c.nodes.includes(w.from));
    let toComp = components.find(c => c.nodes.includes(w.to));
    tableHTML += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px;">${fromComp ? fromComp.label : '?'}</td>
        <td style="padding: 8px; font-weight: bold;">${w.from.label}</td>
        <td style="padding: 8px;">${toComp ? toComp.label : '?'}</td>
        <td style="padding: 8px; font-weight: bold;">${w.to.label}</td>
      </tr>
    `;
  });
  tableHTML += `</tbody></table>`;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Permite las ventanas emergentes (popups) para exportar el diagrama.");
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Diagrama - ${activeLevel ? activeLevel.headline : 'Tablero Industrial'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 25px; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          .img-container { text-align: center; margin: 20px 0; }
          img { max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Diagrama Unilineal / Multifilar Industrial</h1>
        <p><strong>Plantilla:</strong> ${activeLevel ? activeLevel.headline : ''}</p>
        <div class="img-container">
          <img src="${imgData}" alt="Diagrama de Canvas" />
        </div>
        <h2>Tabla de Cableado y Conexiones (Netlist)</h2>
        ${tableHTML}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function autocompleteCurrentLevel() {
  if (!activeLevel) return;
  wires = [];
  const getC = (lbl) => components.find(c => c.id === lbl);
  const connect = (n1, n2, type="L1") => {
    if (n1 && n2) wires.push(new Wire(n1, n2, type));
  };

  if (activeLevel.id === "plc-escuela") {
    const panel = getC("panel"), mppt = getC("mppt"), b1 = getC("b1"), b2 = getC("b2");
    const barradc = getC("barradc"), inv = getC("inv"), stepdown = getC("stepdown");
    const barra5v = getC("barra5v"), plc = getC("plc"), m1 = getC("m1");
    if (barradc && b1 && b2 && panel && mppt) {
      connect(panel.pos, mppt.pPos, "L1");
      connect(panel.neg, mppt.pNeg, "N");
      connect(b1.neg, barradc.bars[0][0], "N");
      connect(b2.pos, barradc.bars[2][0], "L1");
      connect(b1.pos, b2.neg, "L2");
      connect(mppt.bPos, barradc.bars[2][1], "L1");
      connect(mppt.bNeg, barradc.bars[0][1], "N");
      if (inv) {
        connect(inv.dcPos, barradc.bars[2][2], "L1");
        connect(inv.dcNeg, barradc.bars[0][2], "N");
      }
      if (stepdown && barra5v) {
        connect(barradc.bars[2][0], stepdown.inPos, "L1");
        connect(barradc.bars[0][0], stepdown.inNeg, "N");
        connect(stepdown.outPos, barra5v.bars[1][0], "L3");
        connect(stepdown.outNeg, barra5v.bars[0][0], "N");
      }
      if (plc) {
        connect(barradc.bars[2][1], plc.l1, "L1");
        connect(barradc.bars[0][1], plc.n, "N");
        if (barra5v && m1) {
          connect(barra5v.bars[1][1], plc.q1a, "L3");
          connect(plc.q1b, m1.pos, "L3");
          connect(m1.neg, barra5v.bars[0][1], "N");
        }
      }
      plcGridData = getLadderForLevel("plc-escuela");
      if (plc) { activePLC = plc; window.savePLC(); }
    }
  } else if (activeLevel.id === "plc-13") {
    const src = getC("source"), vfd = getC("vfd"), m1 = getC("m1"), pFwd = getC("pFwd");
    if (src && vfd && m1) {
      connect(src.l1, vfd.l1, "L1");
      connect(src.l2, vfd.l2, "L2");
      connect(src.l3, vfd.l3, "L3");
      connect(vfd.u, m1.u1, "L1");
      connect(vfd.v, m1.v1, "L2");
      connect(vfd.w, m1.w1, "L3");
      if (pFwd) {
        connect(vfd.v24, pFwd.n1, "L1");
        connect(pFwd.n2, vfd.di1, "L1");
        pFwd.pressed = true;
      }
    }
  } else if (components.some(c => c instanceof PLCLogo)) {
    // Autocompletado integral para niveles con PLC LOGO! (plc-1 hasta plc-12)
    const src = components.find(c => c instanceof Source3Phase);
    const tm = components.find(c => c instanceof TermomagneticoIndustrial);
    const dif = components.find(c => c instanceof DisyuntorDiferencialIndustrial);
    const bus = components.find(c => c instanceof BarraTetrapolar);
    const plc = components.find(c => c instanceof PLCLogo);
    const k1 = components.find(c => c instanceof Contactor);
    const m = components.find(c => c instanceof Motor3Phase);
    const pStop = components.find(c => c instanceof Pushbutton && c.btnType === "NC");
    const pStart = components.find(c => c instanceof Pushbutton && (c.btnType === "NO" || !c.btnType));
    const allButtons = components.filter(c => c instanceof Pushbutton);

    // 1. Red -> TM -> DIF -> Barras Tetrapolares (o Red directa a Barras si no hay protecciones en el nivel)
    if (src && tm && dif && bus) {
      connect(src.l1, tm.inL1, "L1"); connect(src.l2, tm.inL2, "L2"); connect(src.l3, tm.inL3, "L3"); connect(src.n, tm.inN, "N");
      connect(tm.outL1, dif.inL1, "L1"); connect(tm.outL2, dif.inL2, "L2"); connect(tm.outL3, dif.inL3, "L3"); connect(tm.outN, dif.inN, "N");
      connect(dif.outN, bus.bars[0][0], "N");
      connect(dif.outL1, bus.bars[1][0], "L1");
      connect(dif.outL2, bus.bars[2][0], "L2");
      connect(dif.outL3, bus.bars[3][0], "L3");
    } else if (src && bus) {
      connect(src.n, bus.bars[0][0], "N");
      connect(src.l1, bus.bars[1][0], "L1");
      connect(src.l2, bus.bars[2][0], "L2");
      connect(src.l3, bus.bars[3][0], "L3");
    }

    // 2. Alimentación del PLC (Fase L1 a Borne L1, Neutro a Borne N)
    const pFeed = bus ? bus.bars[1][1] : (src ? src.l1 : null);
    const nFeed = bus ? bus.bars[0][1] : (src ? src.n : null);
    if (plc && pFeed && nFeed) {
      connect(pFeed, plc.l1, "L1");
      connect(nFeed, plc.n, "N");
    }

    // 3. Entradas Digitales (Pulsadores / Sensores)
    const pFeedIn = bus ? bus.bars[1][2] : (src ? src.l1 : null);
    if (pStart && pStop) {
      connect(pFeedIn, pStart.n1, "L1");
      connect(pStart.n2, plc.i1, "L1");
      connect(pFeedIn, pStop.n1, "L1");
      connect(pStop.n2, plc.i2, "L1");
      pStart.pressed = true;
      pStop.pressed = false;
    } else if (allButtons.length >= 2) {
      connect(pFeedIn, allButtons[0].n1, "L1");
      connect(allButtons[0].n2, plc.i1, "L1");
      connect(pFeedIn, allButtons[1].n1, "L1");
      connect(allButtons[1].n2, plc.i2, "L1");
      allButtons[0].pressed = true;
      allButtons[1].pressed = true;
    } else if (allButtons.length === 1) {
      connect(pFeedIn, allButtons[0].n1, "L1");
      connect(allButtons[0].n2, plc.i1, "L1");
      allButtons[0].pressed = true;
    }

    // 4. Salida a Relé Q1 -> Bobina A1/A2 del Contactor K1
    const pFeedQ = bus ? bus.bars[1][2] : (src ? src.l1 : null);
    const nFeedQ = bus ? bus.bars[0][2] : (src ? src.n : null);
    if (plc && k1) {
      if (pFeedQ) connect(pFeedQ, plc.q1a, "L1");
      connect(plc.q1b, k1.a1, "L1");
      if (nFeedQ) connect(k1.a2, nFeedQ, "N");
    }

    // 5. Potencia Trifásica al Contactor y Motor 3~
    if (k1 && m) {
      if (bus) {
        connect(bus.bars[1][0], k1.l1, "L1");
        connect(bus.bars[2][0], k1.l2, "L2");
        connect(bus.bars[3][0], k1.l3, "L3");
      } else if (src) {
        connect(src.l1, k1.l1, "L1");
        connect(src.l2, k1.l2, "L2");
        connect(src.l3, k1.l3, "L3");
      }
      connect(k1.t1, m.u1, "L1");
      connect(k1.t2, m.v1, "L2");
      connect(k1.t3, m.w1, "L3");
    }

    // 6. Programación Ladder e inyección en el LOGO!
    if (plc) {
      plcGridData = getLadderForLevel(activeLevel.id);
      activePLC = plc;
      window.savePLC();
    }
  } else if (activeLevel.id === "control-fuerza-4") {
    const src = getC("source"), tm = getC("tm"), dif = getC("dif"), bus = getC("bus");
    const pStop = getC("pStop"), pStart = getC("pStart"), k1 = getC("k1"), t1 = getC("t1"), k2 = getC("k2"), m1 = getC("m1"), m2 = getC("m2");
    if (src && tm && dif && bus) {
      connect(src.l1, tm.inL1, "L1"); connect(src.l2, tm.inL2, "L2"); connect(src.l3, tm.inL3, "L3"); connect(src.n, tm.inN, "N");
      connect(tm.outL1, dif.inL1, "L1"); connect(tm.outL2, dif.inL2, "L2"); connect(tm.outL3, dif.inL3, "L3"); connect(tm.outN, dif.inN, "N");
      connect(dif.outN, bus.bars[0][0], "N");
      connect(dif.outL1, bus.bars[1][0], "L1");
      connect(dif.outL2, bus.bars[2][0], "L2");
      connect(dif.outL3, bus.bars[3][0], "L3");

      connect(bus.bars[1][1], k1.l1, "L1"); connect(bus.bars[2][1], k1.l2, "L2"); connect(bus.bars[3][1], k1.l3, "L3");
      connect(k1.t1, m1.u1, "L1"); connect(k1.t2, m1.v1, "L2"); connect(k1.t3, m1.w1, "L3");

      connect(bus.bars[1][1], k2.l1, "L1"); connect(bus.bars[2][1], k2.l2, "L2"); connect(bus.bars[3][1], k2.l3, "L3");
      connect(k2.t1, m2.u1, "L1"); connect(k2.t2, m2.v1, "L2"); connect(k2.t3, m2.w1, "L3");

      connect(bus.bars[1][2], pStop.n1, "L1");
      connect(pStop.n2, pStart.n1, "L1");
      connect(pStart.n2, k1.a1, "L1");
      connect(k1.a1, t1.a1, "L1");
      connect(k1.a2, bus.bars[0][1], "N");
      connect(t1.a2, bus.bars[0][1], "N");
      connect(pStart.n1, k1.no13, "L1");
      connect(pStart.n2, k1.no14, "L1");
      pStart.pressed = true;

      connect(pStop.n2, t1.no1, "L1");
      connect(t1.no2, k2.a1, "L1");
      connect(k2.a2, bus.bars[0][2], "N");
    }
  } else if (activeLevel.id === "control-fuerza-5") {
    const src = getC("source"), tm = getC("tm"), dif = getC("dif"), bus = getC("bus");
    const pStart = getC("pStart"), k1 = getC("k1"), k2 = getC("k2"), k3 = getC("k3"), m1 = getC("m1");
    if (src && tm && dif && bus && k1 && k3) {
      connect(src.l1, tm.inL1, "L1"); connect(src.l2, tm.inL2, "L2"); connect(src.l3, tm.inL3, "L3"); connect(src.n, tm.inN, "N");
      connect(tm.outL1, dif.inL1, "L1"); connect(tm.outL2, dif.inL2, "L2"); connect(tm.outL3, dif.inL3, "L3"); connect(tm.outN, dif.inN, "N");
      connect(dif.outN, bus.bars[0][0], "N");
      connect(dif.outL1, bus.bars[1][0], "L1");
      connect(dif.outL2, bus.bars[2][0], "L2");
      connect(dif.outL3, bus.bars[3][0], "L3");

      connect(bus.bars[1][2], pStart.n1, "L1");
      connect(pStart.n2, k1.a1, "L1");
      connect(pStart.n2, k3.a1, "L1");
      connect(k1.a2, bus.bars[0][1], "N");
      connect(k3.a2, bus.bars[0][1], "N");
      pStart.pressed = true;
    }
  } else {
    // Autocompletado estándar para tableros industriales con contactor y motor
    const src = components.find(c => c instanceof Source3Phase);
    const tm = components.find(c => c instanceof TermomagneticoIndustrial);
    const dif = components.find(c => c instanceof DisyuntorDiferencialIndustrial);
    const bus = components.find(c => c instanceof BarraTetrapolar);
    const k1 = components.find(c => c instanceof Contactor);
    const m = components.find(c => c instanceof Motor3Phase);
    const pStop = components.find(c => c instanceof Pushbutton && c.btnType === "NC");
    const pStart = components.find(c => c instanceof Pushbutton && c.btnType === "NO");

    if (src && tm && dif && bus) {
      // 1. Red -> TM
      connect(src.l1, tm.inL1, "L1"); connect(src.l2, tm.inL2, "L2"); connect(src.l3, tm.inL3, "L3"); connect(src.n, tm.inN, "N");
      // 2. TM -> Diferencial
      connect(tm.outL1, dif.inL1, "L1"); connect(tm.outL2, dif.inL2, "L2"); connect(tm.outL3, dif.inL3, "L3"); connect(tm.outN, dif.inN, "N");
      // 3. Diferencial -> Barras
      connect(dif.outN, bus.bars[0][0], "N");
      connect(dif.outL1, bus.bars[1][0], "L1");
      connect(dif.outL2, bus.bars[2][0], "L2");
      connect(dif.outL3, bus.bars[3][0], "L3");

      if (k1 && m) {
        // Fuerza a contactor y motor
        connect(bus.bars[1][1], k1.l1, "L1");
        connect(bus.bars[2][1], k1.l2, "L2");
        connect(bus.bars[3][1], k1.l3, "L3");
        connect(k1.t1, m.u1, "L1");
        connect(k1.t2, m.v1, "L2");
        connect(k1.t3, m.w1, "L3");
        // Mando a bobina
        if (pStop && pStart) {
          connect(bus.bars[1][2], pStop.n1, "L1");
          connect(pStop.n2, pStart.n1, "L1");
          connect(pStart.n2, k1.a1, "L1");
          connect(k1.a2, bus.bars[0][1], "N");
          // Retención
          connect(pStart.n1, k1.no13, "L1");
          connect(pStart.n2, k1.no14, "L1");
          pStart.pressed = true;
        } else {
          connect(bus.bars[1][2], k1.a1, "L1");
          connect(k1.a2, bus.bars[0][1], "N");
        }
      }
    } else if (k1 && src) {
      if (pStop && pStart) {
        connect(src.l1, pStop.n1, "L1");
        connect(pStop.n2, pStart.n1, "L1");
        connect(pStart.n2, k1.a1, "L1");
        connect(k1.a2, src.n, "N");
        connect(pStart.n1, k1.no13, "L1");
        connect(pStart.n2, k1.no14, "L1");
        pStart.pressed = true;
      }
      if (m) {
        connect(src.l1, k1.l1, "L1");
        connect(src.l2, k1.l2, "L2");
        connect(src.l3, k1.l3, "L3");
        connect(k1.t1, m.u1, "L1");
        connect(k1.t2, m.v1, "L2");
        connect(k1.t3, m.w1, "L3");
      }
    }
  }

  analizarCircuito();
}
