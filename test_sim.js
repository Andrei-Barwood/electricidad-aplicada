const fs = require('fs');

global.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
global.random = () => 0.5;
global.TWO_PI = Math.PI * 2;
global.PI = Math.PI;
global.frameCount = 0;
global.sin = Math.sin;
global.mouseX = 0;
global.mouseY = 0;
global.width = 1000;
global.height = 1000;
global.push = () => {};
global.pop = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.fill = () => {};
global.circle = () => {};
global.noStroke = () => {};
global.textSize = () => {};
global.textAlign = () => {};
global.text = () => {};
global.CENTER = 'center';
global.LEFT = 'left';
global.RIGHT = 'right';
global.noFill = () => {};
global.strokeCap = () => {};
global.ROUND = 'round';
global.bezier = () => {};
global.rectMode = () => {};
global.rect = () => {};
global.line = () => {};
global.arc = () => {};
global.PI = Math.PI;
global.CORNER = 'corner';
global.background = () => {};

global.window = { addEventListener: () => {} };
global.getComputedStyle = () => ({ getPropertyValue: () => "#000" });
const dummyElem = {
  textContent: '',
  style: {},
  classList: { toggle: () => {}, add: () => {}, remove: () => {} },
  dataset: { tier: 'basico', tierLabel: 'Básico', index: '1', blurb: '' },
  setAttribute: () => {},
  addEventListener: () => {},
  closest: () => dummyElem,
  appendChild: () => {},
  selectedOptions: [{ dataset: { tier: 'basico', tierLabel: 'Básico', index: '1' } }],
  options: []
};
global.document = {
  querySelector: () => dummyElem,
  querySelectorAll: () => [dummyElem],
  getElementById: () => dummyElem,
  documentElement: { getAttribute: () => "night", setAttribute: () => {} },
  createElement: () => dummyElem,
  createTextNode: (t) => ({ textContent: t }),
  addEventListener: () => {}
};

const sketchCode = fs.readFileSync('sketch.js', 'utf8');
eval(sketchCode);

const sim = window.__sim;

sim.loadLevel("escalera-924");

const logResult = (name) => {
  const result = sim.analizarCircuito();
  console.log(`${name} -> Complete: ${result.complete}, Lit: ${result.loads.some(l => l.lit)}, Short: ${result.short}`);
};

// Case 1: Correct
sim.connect("phase", "s1-c");
sim.connect("s1-a", "s2-a");
sim.connect("s1-b", "s2-b");
sim.connect("s2-c", "lamp-in");
sim.connect("lamp-out", "neutral");
logResult("Correct");
sim.clearWires();

// Case 2: Incomplete
sim.connect("phase", "s1-c");
sim.connect("s1-a", "lamp-in");
sim.connect("lamp-out", "neutral");
logResult("Incomplete bypass");
sim.clearWires();

// Case 3: Bridge short?
sim.connect("phase", "s1-c");
sim.connect("s1-a", "s2-a");
sim.connect("s1-b", "s2-a"); // Both runners to A
sim.connect("s2-c", "lamp-in");
sim.connect("lamp-out", "neutral");
logResult("Both runners to same bridge");
sim.clearWires();

// Case 4: Carter wiring (puentes con fase y neutro) - this is a real-life dangerous wiring
sim.connect("phase", "s1-a");
sim.connect("phase", "s2-a");
sim.connect("neutral", "s1-b");
sim.connect("neutral", "s2-b");
sim.connect("s1-c", "lamp-in");
sim.connect("s2-c", "lamp-out");
logResult("Carter wiring (short-circuit method)");
sim.clearWires();
