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
global.CORNER = 'corner';
global.background = () => {};

global.window = { addEventListener: () => {} };
global.getComputedStyle = () => ({ getPropertyValue: () => "#000" });
const dummyElem = {
  textContent: '',
  style: {},
  classList: { toggle: () => {}, add: () => {}, remove: () => {} },
  dataset: { tier: 'medio', tierLabel: 'Medio', index: '17', blurb: '' },
  setAttribute: () => {},
  addEventListener: () => {},
  closest: () => dummyElem,
  appendChild: () => {},
  selectedOptions: [{ dataset: { tier: 'medio', tierLabel: 'Medio', index: '17' } }],
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

try {
  sim.loadLevel("dormitorio-915");
  
  // Wire it up correctly
  sim.connect("phase", "dbl-c");
  sim.connect("dbl-1", "l1-in");
  sim.connect("l1-out", "neutral");
  sim.connect("dbl-2", "l2-in");
  sim.connect("l2-out", "neutral");

  let res = sim.analizarCircuito();
  console.log("Before click, complete?", res.complete);

  sim.setKey("dbl", "1", true);
  res = sim.analizarCircuito();
  console.log("After key 1, complete?", res.complete);

  sim.setKey("dbl", "2", true);
  res = sim.analizarCircuito();
  console.log("After key 2, complete?", res.complete);

} catch (e) {
  console.log("ERROR", e);
}
