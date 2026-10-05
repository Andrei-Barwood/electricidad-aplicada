
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
    this.nodes = []; this.interactive = false;
    components.push(this);
  }
  addNode(id, dx, dy, type, label) { const n = new Node(id, this.x + dx, this.y + dy, type, label); n.dx = dx; n.dy = dy; this.nodes.push(n); nodes.push(n); return n; }
  internalEdges() { return []; }
  evaluateElectromagnetics() { return false; }
  onPress() {}
  reset() {}
  move(nx, ny) {
    this.x = nx; this.y = ny;
    this.nodes.forEach(n => { n.x = this.x + n.dx; n.y = this.y + n.dy; });
  }
  inResizeHandle(mx, my) {
    const hw = this.w / 2; const hh = this.h / 2;
    return mx > this.x + hw - 20 && mx < this.x + hw + 10 && my > this.y + hh - 20 && my < this.y + hh + 10;
  }
  drawBox(accent) {
    push(); rectMode(CENTER); fill(COLORS.panel); stroke(accent); strokeWeight(2); rect(this.x, this.y, this.w, this.h, 14);
    noStroke(); fill(COLORS.text); textAlign(CENTER, TOP); textSize(12); text(this.label, this.x, this.y + this.h / 2 + 8);
    // Draw resize handle
    fill(COLORS.muted);
    triangle(this.x + this.w/2, this.y + this.h/2 - 10, this.x + this.w/2, this.y + this.h/2, this.x + this.w/2 - 10, this.y + this.h/2);
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
    this.drawBox(this.active ? COLORS.green : COLORS.switch);
    push(); stroke(this.active ? COLORS.green : COLORS.muted); strokeWeight(2);
    // Draw symbols
    line(this.a1.x, this.a1.y+15, this.a1.x, this.a1.y+25);
    line(this.a2.x, this.a2.y-15, this.a2.x, this.a2.y-25);
    rectMode(CENTER); fill(COLORS.panel); rect(this.a1.x, this.y, 20, 30);
    pop();
  }
}

class Pushbutton extends Component {
  constructor(id, x, y, label, type="NO") {
    super(id, x, y, label, 80, 80);
    this.interactive = true;
    this.btnType = type;
    this.pressed = false;
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
    this.drawBox(this.btnType === "NC" ? COLORS.red : COLORS.green);
    push(); fill(this.pressed ? COLORS.green : COLORS.muted); circle(this.x, this.y, 20); pop();
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
    this.drawBox(this.running ? COLORS.green : COLORS.switch);
    push(); fill(COLORS.text); textAlign(CENTER, CENTER); textSize(28); text("M", this.x, this.y); pop();
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
    if (this.frequency < this.targetFreq) this.frequency = Math.min(this.targetFreq, this.frequency + 0.5);
    if (this.frequency > this.targetFreq) this.frequency = Math.max(this.targetFreq, this.frequency - 0.5);
    
    this.drawBox(this.powered ? COLORS.cyan : COLORS.switch);
    
    // LCD Screen
    push();
    fill(COLORS.panel);
    stroke(COLORS.muted);
    rectMode(CENTER);
    rect(this.x, this.y - 10, 120, 40, 5);
    fill(this.powered ? (this.running ? COLORS.green : COLORS.red) : COLORS.muted);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(22);
    text(this.frequency.toFixed(1) + " Hz", this.x, this.y - 10);
    
    textSize(12);
    fill(COLORS.text);
    if (this.running) {
      text(this.direction === 1 ? "FWD ▶" : "◀ REV", this.x, this.y + 20);
    } else {
      text("STOP", this.x, this.y + 20);
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
    this.drawBox(this.powered ? COLORS.cyan : COLORS.switch);
    push();
    fill(COLORS.switch);
    stroke(COLORS.muted);
    rectMode(CENTER);
    rect(this.x, this.y, 80, 50, 4);
    if (this.powered) {
      fill(COLORS.green);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
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
    this.drawBox(this.contactsActive ? COLORS.amber : (this.coilEnergized ? COLORS.cyan : COLORS.switch));
    push(); stroke(this.contactsActive ? COLORS.amber : COLORS.muted); strokeWeight(2);
    rectMode(CENTER); fill(COLORS.panel); rect(this.a1.x, this.y, 20, 30);
    line(this.a1.x-10, this.y-15, this.a1.x+10, this.y+15);
    line(this.a1.x+10, this.y-15, this.a1.x-10, this.y+15);
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
    this.drawBox(COLORS.cyan);
    push(); stroke(COLORS.muted); fill(COLORS.panel); 
    rectMode(CENTER); rect(this.x, this.y, 120, 40, 4); 
    line(this.x - 20, this.y - 20, this.x - 20, this.y + 20);
    line(this.x + 20, this.y - 20, this.x + 20, this.y + 20);
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
    this.drawBox(COLORS.panel);
    push(); fill(COLORS.green); noStroke(); circle(this.x - 45, this.y, 10); circle(this.x + 15, this.y, 10); pop();
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
    this.drawBox(COLORS.amber);
    push(); fill(COLORS.bg); noStroke(); textAlign(CENTER,CENTER); textSize(12); text("220V AC", this.x + 55, this.y); pop();
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
    this.drawBox(COLORS.amber);
    push(); fill(COLORS.bg); noStroke(); textAlign(CENTER, CENTER); textSize(12); text("12V", this.x, this.y); pop();
  }
}

class BarraTetrapolar extends Component {
  constructor(id, x, y) {
    super(id, x, y, "Barra Tetrapolar", 240, 100);
    this.bars = [];
    for (let i=0; i<4; i++) {
      let b1 = this.addNode(`${id}-b${i}-1`, -80, -30 + i*20, "bar", `Piso ${i+1}`);
      let b2 = this.addNode(`${id}-b${i}-2`, 0, -30 + i*20, "bar", `Piso ${i+1}`);
      let b3 = this.addNode(`${id}-b${i}-3`, 80, -30 + i*20, "bar", `Piso ${i+1}`);
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
    this.drawBox(COLORS.panel); 
    push();
    stroke(COLORS.cyan);
    strokeWeight(4);
    for(let i=0; i<4; i++) {
      line(this.x - 90, this.y - 30 + i*20, this.x + 90, this.y - 30 + i*20);
    }
    pop();
  }
}


class BarraBipolar extends Component {
  constructor(id, x, y, label="Barra Bipolar 5V") {
    super(id, x, y, label, 200, 80);
    this.bars = [];
    for (let i=0; i<2; i++) {
      let b1 = this.addNode(`${id}-b${i}-1`, -60, -15 + i*30, "bar", `Piso ${i+1}`);
      let b2 = this.addNode(`${id}-b${i}-2`, 0, -15 + i*30, "bar", `Piso ${i+1}`);
      let b3 = this.addNode(`${id}-b${i}-3`, 60, -15 + i*30, "bar", `Piso ${i+1}`);
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
  draw() { this.drawBox(COLORS.panel); }
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
    this.drawBox(this.running ? COLORS.green : COLORS.switch);
    push(); fill(COLORS.text); textAlign(CENTER, CENTER); textSize(24); text("Turbina", this.x, this.y); pop();
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
    this.drawBox(this.running ? COLORS.green : COLORS.switch);
    push(); fill(COLORS.bg); circle(this.x, this.y, 40); 
    if(this.running) {
        fill(COLORS.text); textAlign(CENTER,CENTER); textSize(12); text("RUN", this.x, this.y);
    }
    pop();
  }
}

const LEVELS = [
  {
    id: "plc-13",
    headline: "Variador de Frecuencia (VFD)",
    objective: "El Variador de Frecuencia permite arrancar el motor suavemente.\n1. Alimenta el VFD conectando L1, L2 y L3 desde la fuente trifásica.\n2. Conecta U, V y W del VFD a los bornes U1, V1 y W1 del motor.\n3. Usa la salida de 24V del VFD para alimentar un botón pulsador (FWD).\n4. Conecta el retorno del botón a la entrada DI1 del VFD para giro a la derecha.",
    build() {
      const source = new Source3Phase(200, 150);
      const vfd = new VFD("vfd", 500, 350);
      const m1 = new Motor3Phase("m1", 800, 400);
      const pFwd = new Pushbutton("pFwd", 200, 400, "Start", "NO");
      
      return { check: () => vfd.running && m1.running };
    }
  },
  {
    id: "arranque-directo",
    headline: "Arranque Directo con Enclavamiento",
    objective: "Cablea el circuito de control. Conecta Fase (L1) al botón NC (Parada), luego al botón NO (Marcha), y de ahí a A1. El neutro a A2. Finalmente, pon en paralelo el contacto 13-14 del contactor con el botón NO para lograr la auto-retención.",
    build() {
      const source = new Source3Phase(500, 100);
      const k1 = new Contactor("k1", 500, 400, "K1");
      const pStop = new Pushbutton("pStop", 300, 250, "Parada", "NC");
      const pStart = new Pushbutton("pStart", 300, 400, "Marcha", "NO");
      const m1 = new Motor3Phase("m1", 700, 600, "Motor");
      
      return {
        check: () => k1.active
      };
    }
  },

    {
    id: "plc-escuela",
    headline: "Tablero Escuela Proyecto Futuro (Turbina 5V)",
    objective: `SISTEMA HÍBRIDO, BARRAS DE DISTRIBUCIÓN Y TURBINA 5V:

1. Baterías a Barra 24V: Conecta las baterías (Batería 1 y 2) en serie (puente entre BAT1+ y BAT2-). Lleva el (-) de BAT1 al Piso 1 (0V) y el (+) de BAT2 al Piso 3 (24V) de la Barra Tetrapolar.
2. Inversor y Panel: Conecta el panel al Inversor, y los bornes de batería del Inversor a la Barra Tetrapolar (24V y 0V).
3. Step-Down LM2596: Alimenta el IN+ con 24V (Piso 3) y el IN- con 0V (Piso 1). Su salida OUT+ llévala al Piso 2 de la Barra Bipolar 5V, y el OUT- al Piso 1 de la Barra Bipolar 5V.
4. PLC LOGO!: Aliméntalo con 24V (L1) y 0V (N) desde la Barra Tetrapolar.
5. Potencia de Turbina: Saca un cable de 5V (Piso 2 Barra Bipolar) hacia Q1.1 del PLC. Desde Q1.2 conecta al (+) de la Turbina. El (-) de la Turbina va al 0V de la Barra Bipolar.
6. PLC Ladder: Configura el Generador de Impulsos para la Turbina.`, 
        build() {
            const panel = new PanelSolar("panel", 120, 80);
      const mppt = new ControladorCarga("mppt", 350, 80);
      const inv = new Inversor("inv", 600, 80);
      
      const b1 = new Bateria("b1", 120, 250, "Batería 1", "1");
      const b2 = new Bateria("b2", 120, 450, "Batería 2", "2");
      const barraDC = new BarraTetrapolar("barradc", 380, 280);
      const barraAC = new BarraTetrapolar("barraac", 650, 650);
      
      const stepDown = new LM2596("stepdown", 200, 580);
      const barra5V = new BarraBipolar("barra5v", 400, 580);
      
      const plc = new PLCLogo("plc", 650, 300, "LOGO! 24V");
      const m1 = new Turbina("m1", 650, 550);
      const s1 = new Pushbutton("s1", 400, 450, "Sensor 1 (I1)", "NO");
      const s2 = new Pushbutton("s2", 500, 450, "Sensor 2 (I2)", "NO");
      return { check: () => components.some(c => c instanceof Turbina && c.running) };
    }
  }
];

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
  const canvas = createCanvas(1300, 950);
  canvas.parent("simulator-canvas");
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
        const current = select.selectedOptions[0];
        if (!current || current.dataset.tier !== button.dataset.tier) {
          select.value = button.dataset.first;
          loadLevel(select.value);
        }
      });
    });
  }
}

function loadLevel(id) {
  const def = LEVELS.find(l => l.id === id) || LEVELS[0];
  nodes = []; wires = []; components = []; draggingFrom = null;
  activeLevel = { id: def.id, headline: def.headline, objective: def.objective, rules: def.build() };
    
  const titleEl = document.getElementById("level-title");
  if (titleEl && activeLevel.headline) titleEl.textContent = activeLevel.headline;
  
  const select = document.getElementById("level-select");
  if (select && select.value !== activeLevel.id) {
    select.value = activeLevel.id;
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
    // Release pushbuttons
    components.filter(c => c instanceof Pushbutton).forEach(c => {
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
  components.filter(c => c instanceof Pushbutton).forEach(c => {
    if (c.pressed) { c.pressed = false; analizarCircuito(); }
  });
}

function mouseDragged() {
  const modal = document.getElementById("plc-modal");
  if (modal && !modal.classList.contains("hidden")) return;
  
  if (resizingComponent) {
    const nw = Math.max(80, resizeStart.w + (mouseX - resizeStart.mx) * 2);
    const nh = Math.max(80, resizeStart.h + (mouseY - resizeStart.my) * 2);
    resizingComponent.w = nw;
    resizingComponent.h = nh;
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

function openPLCEditor(plcComp) {
  activePLC = plcComp;
  if (plcGridData.length === 0) initPLCEditor();
  // We could try to decompile plc.program, but for now we just show the grid as is (preserves state per session).
  // Ideally, if it's the first time, we could populate it based on the level, but let's start blank for them to program!
  // Wait, if the level has a pre-programmed lambda, and they open it, it's blank. Let's let it be blank, so they HAVE to program it!
  
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
    btn.addEventListener("click", () => {
      tools.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      plcCurrentTool = btn.dataset.tool;
    });
  });
  
  document.getElementById("plc-close")?.addEventListener("click", () => {
    document.getElementById("plc-modal").classList.add("hidden");
    activePLC = null;
  });
  
  document.getElementById("plc-save")?.addEventListener("click", () => {
    if (!activePLC) return;
    
    // Compile Grid to a Function!
    // We capture a snapshot of the grid
    const gridSnap = JSON.parse(JSON.stringify(plcGridData));
    
    activePLC.program = (inputs, prevOutputs, prevTimers) => {
      let qStates = [false, false, false, false];
      
      const getVal = (op) => {
        if (op === 'I1') return inputs[0];
        if (op === 'I2') return inputs[1];
        if (op === 'I3') return inputs[2];
        if (op === 'I4') return inputs[3];
        if (op === 'Q1') return prevOutputs[0];
        if (op === 'Q2') return prevOutputs[1];
        if (op === 'Q3') return prevOutputs[2];
        if (op === 'Q4') return prevOutputs[3];
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
        }
      }
      return { q: qStates, t: tStates };
    };
    
    analizarCircuito();
    document.getElementById("plc-modal").classList.add("hidden");
    activePLC = null;
  });
};

initPLCEvents();


window.closePLC = function() {
  document.getElementById("plc-modal").classList.add("hidden");
  activePLC = null;
};
window.savePLC = function() {
  if (!activePLC) return;
  const gridSnap = JSON.parse(JSON.stringify(plcGridData));
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
  // Call p5.js redraw if needed, though draw loop is constant
}

document.addEventListener("DOMContentLoaded", syncColors);

// --- LOGIC FOR DIAGNOSTIC REPORT ---
setTimeout(() => {
  const btn = document.createElement("button");
  btn.textContent = "Copiar Reporte al Portapapeles";
  btn.style.position = "absolute";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.padding = "10px 15px";
  btn.style.backgroundColor = "#0ea5e9";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "5px";
  btn.style.cursor = "pointer";
  btn.style.zIndex = "9999";
  btn.style.fontWeight = "bold";
  document.body.appendChild(btn);

  btn.onclick = () => {
    let report = "--- REPORTE DE SISTEMA SNOCOMM ---\n";
    components.forEach(c => {
      report += `\n[ ${c.label} ] (ID: ${c.id})\n`;
      if (c instanceof PLCLogo) {
          report += `  Estado: ${c.powered ? 'ENCENDIDO (Recibe Fase y Neutro)' : 'APAGADO'}\n`;
      }
      if (c instanceof MotorDC) {
          report += `  Estado: ${c.running ? 'GIRANDO' : 'DETENIDO'}\n`;
      }
      c.nodes.forEach(n => {
        let connectedWires = wires.filter(w => w.from === n || w.to === n);
        let conns = connectedWires.map(w => {
          let other = w.from === n ? w.to : w.from;
          let otherComp = components.find(comp => comp.nodes.includes(other));
          return `${otherComp ? otherComp.label : '?'}(${other.label})`;
        });
        let pots = Array.from(n.potentials).join(",");
        report += `  - Borne "${n.label}": Energía=(${pots || 'vacio'}) -> Conectado a: ${conns.join(", ") || "Nada"}\n`;
      });
    });
    
    navigator.clipboard.writeText(report).then(() => {
      btn.textContent = "¡Copiado!";
      setTimeout(() => btn.textContent = "Copiar Reporte al Portapapeles", 2000);
    }).catch(err => {
      console.log(report);
      alert("Error al copiar. Abre la consola (F12) para ver el reporte.");
    });
  };
}, 1000);

// --- BUTTON FOR LEVEL AUTOCOMPLETE ---
setTimeout(() => {
  const autoBtn = document.createElement("button");
  autoBtn.textContent = "Autocompletar Nivel (SOLUCIÓN)";
  autoBtn.style.position = "absolute";
  autoBtn.style.bottom = "65px";
  autoBtn.style.right = "20px";
  autoBtn.style.padding = "10px 15px";
  autoBtn.style.backgroundColor = "#10b981";
  autoBtn.style.color = "white";
  autoBtn.style.border = "none";
  autoBtn.style.borderRadius = "5px";
  autoBtn.style.cursor = "pointer";
  autoBtn.style.zIndex = "9999";
  autoBtn.style.fontWeight = "bold";
  document.body.appendChild(autoBtn);

  autoBtn.onclick = () => {
    wires = []; // clear all wires
    
    
    // Find components
    const getC = (lbl) => components.find(c => c.id === lbl);
    const panel = getC("panel");
    const mppt = getC("mppt");
    const b1 = getC("b1");
    const b2 = getC("b2");
    const barradc = getC("barradc");
    const inv = getC("inv");
    const stepdown = getC("stepdown");
    const barra5v = getC("barra5v");
    const plc = getC("plc");
    const m1 = getC("m1");
    
    if(!barradc) { alert("Error: Componentes no encontrados."); return; }
    
    const connectNodes = (n1, n2) => wires.push(new Wire(n1, n2));
    
    // 1. Panel a MPPT
    connectNodes(panel.pos, mppt.pPos);
    connectNodes(panel.neg, mppt.pNeg);
    
    // 2. Baterías a Barra DC (Serie para 24V)
    connectNodes(b1.neg, barradc.bars[0][0]); // 0V -> Piso 1
    connectNodes(b2.pos, barradc.bars[2][0]); // 24V -> Piso 3
    connectNodes(b1.pos, b2.neg); // Jumper Serie
    
    // 3. MPPT a Barra DC
    connectNodes(mppt.bPos, barradc.bars[2][1]);
    connectNodes(mppt.bNeg, barradc.bars[0][1]);
    
    // 4. Inversor
    connectNodes(inv.dcPos, barradc.bars[2][2]);
    connectNodes(inv.dcNeg, barradc.bars[0][2]);
    
    // 5. Step-Down LM2596
    connectNodes(barradc.bars[2][0], stepdown.inPos);
    connectNodes(barradc.bars[0][0], stepdown.inNeg);
    
    // 6. Barra Bipolar 5V
    connectNodes(stepdown.outPos, barra5v.bars[1][0]); // 5V al Piso 2
    connectNodes(stepdown.outNeg, barra5v.bars[0][0]); // 0V al Piso 1
    
    // 7. Alimentación PLC (24V)
    connectNodes(barradc.bars[2][1], plc.l1); 
    connectNodes(barradc.bars[0][1], plc.n);  
    
    // 8. Turbina y Salida PLC (5V aislado)
    connectNodes(barra5v.bars[1][1], plc.q1a); // 5V al relé Q1.1
    connectNodes(plc.q1b, m1.pos); // Q1.2 a la turbina
    connectNodes(m1.neg, barra5v.bars[0][1]); // Turbina al 0V de la barra 5V

    // 9. PLC Ladder Logic (Generador Impulsos / Bucle)
    plcGridData = [
      [ {type: 'NC', operand: 'T2'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'T1'} ],
      [ {type: 'NO', operand: 'T1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'T2'} ],
      [ {type: 'NO', operand: 'T1'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'WIRE'}, {type: 'COIL', operand: 'Q1'} ],
      [ {type: 'EMPTY'}, {type: 'EMPTY'}, {type: 'EMPTY'}, {type: 'EMPTY'}, {type: 'EMPTY'}, {type: 'EMPTY'} ]
    ];
    
    activePLC = plc;
    window.savePLC(); 
    
    alert("¡Nivel autocompletado con Step-Down y Turbina de 5V!");

  };
}, 1500);

// --- BUTTON FOR PDF EXPORT ---
setTimeout(() => {
  const pdfBtn = document.createElement("button");
  pdfBtn.textContent = "Exportar Diagrama a PDF";
  pdfBtn.style.position = "absolute";
  pdfBtn.style.bottom = "110px";
  pdfBtn.style.right = "20px";
  pdfBtn.style.padding = "10px 15px";
  pdfBtn.style.backgroundColor = "#ef4444"; // Red
  pdfBtn.style.color = "white";
  pdfBtn.style.border = "none";
  pdfBtn.style.borderRadius = "5px";
  pdfBtn.style.cursor = "pointer";
  pdfBtn.style.zIndex = "9999";
  pdfBtn.style.fontWeight = "bold";
  document.body.appendChild(pdfBtn);

  pdfBtn.onclick = () => {
    // Capture canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        alert("No se encontró el lienzo del diagrama.");
        return;
    }
    const imgData = canvas.toDataURL("image/png");
    
    // Build Wiring Table
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif;">
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
            <th style="padding: 10px; text-align: left;">Origen</th>
            <th style="padding: 10px; text-align: left;">Borne</th>
            <th style="padding: 10px; text-align: left;">Destino</th>
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
    
    // Print Window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Diagrama - Proyecto Futuro</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e293b; text-align: center; }
            .img-container { text-align: center; margin: 20px 0; }
            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h1>Diagrama de Conexiones - Tablero Escuela</h1>
          <div class="img-container">
            <img src="${imgData}" alt="Diagrama de Canvas" />
          </div>
          <h2>Tabla de Cableado (Netlist)</h2>
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
  };
}, 1800);
