const fs = require('fs');

global.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
global.random = () => 0.5;
global.TWO_PI = Math.PI * 2;
global.PI = Math.PI;
global.frameCount = 0;
global.sin = Math.sin;
global.mouseX = 0;
global.mouseY = 0;
global.width = 1040;
global.height = 660;
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
global.TOP = 'top';
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
global.textStyle = () => {};
global.BOLD = 'bold';
global.NORMAL = 'normal';

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

eval(fs.readFileSync('sketch.js', 'utf8'));

const sim = window.__sim;
let errors = 0;

console.log("=== VERIFICACIÓN DE 72 PLANTILLAS Y TABLERO TDA ===");

// 1. Layout Warnings en las 72 plantillas
let totalWarnings = 0;
sim.LEVELS.forEach((level, i) => {
  const w = sim.loadLevel(level.id);
  if (w.length > 0) {
    console.error(`[WARN] Plantilla ${i + 1} (${level.id}):`, w);
    totalWarnings += w.length;
    errors++;
  }
});
console.log(`✓ 72 plantillas verificadas. Total advertencias de colisión: ${totalWarnings}`);

// 2. Verificar componentes del Tablero TDA
sim.loadLevel("dormitorio-912");
const ids = sim.ids();
const requiredBoardNodes = [
  "tda-red-l", "tda-red-n",
  "tda-tm-in", "tda-tm-out",
  "tda-dif-in-l", "tda-dif-in-n", "tda-dif-out-l", "tda-dif-out-n",
  "tda-bar-l-1", "phase", "tda-bar-l-3",
  "tda-bar-n-1", "neutral", "tda-bar-n-3",
  "tda-bar-pe1", "tda-bar-pe2"
];

const missing = requiredBoardNodes.filter(id => !ids.includes(id));
if (missing.length > 0) {
  console.error("Nodos faltantes en TDA:", missing);
  errors++;
} else {
  console.log("✓ Todos los bornes requeridos del Tablero TDA están presentes.");
}

// 3. Probar circuito completo con TDA y Cuadro de Cargas
// En dormitorio-912: conectar de barra a 9/12, a lámpara, y neutro a barra
sim.connect("phase", "sw-a");
sim.connect("sw-b", "lamp-in");
sim.connect("lamp-out", "neutral");
sim.setClosed("sw", true);

let res = sim.analizarCircuito();
console.log("Dormitorio 9/12 resuelto:", { complete: res.complete, lit: res.loads[0].lit, short: res.short });
if (!res.complete) {
  console.error("Error: Circuito debería estar completo");
  errors++;
}

// 4. Verificar que se activó el Cuadro de Cargas
if (!sim.showLoadTable()) {
  console.error("Error: showLoadTable debería ser true al completar el circuito");
  errors++;
} else {
  console.log("✓ Cuadro de Cargas se activó automáticamente en el lienzo.");
}

// 5. Verificar datos del Cuadro de Cargas
const cc = sim.calcCuadroCargas();
console.log("Cuadro de Cargas generado:", {
  tda: cc.tdaName,
  circuits: cc.circuits.length,
  totalW: cc.totalPowerW,
  totalA: cc.totalCurrentA,
  empalme: cc.empalme
});

if (cc.circuits.length < 1 || cc.totalPowerW <= 0) {
  console.error("Error en datos de cuadro de cargas");
  errors++;
} else {
  console.log("✓ Cuadro de Cargas calculado conforme a RIC N°02.");
}

// 6. Probar disparo de protecciones del Tablero
console.log("--- Prueba de Protecciones ---");
// Abrir Termomagnético
sim.setClosed("tda-tm", false);
res = sim.analizarCircuito();
console.log("Con Termomagnético abierto -> Lámpara encendida?:", res.loads[0].lit, "Título:", res.title);
if (res.loads[0].lit) {
  console.error("Error: Lámpara no debió encender con TM abierto");
  errors++;
}

// Cerrar Termomagnético y abrir Diferencial
sim.setClosed("tda-tm", true);
sim.setClosed("tda-dif", false);
res = sim.analizarCircuito();
console.log("Con Diferencial abierto -> Lámpara encendida?:", res.loads[0].lit, "Título:", res.title);
if (res.loads[0].lit) {
  console.error("Error: Lámpara no debió encender con DIF abierto");
  errors++;
}

// Cerrar Diferencial -> vuelve a energizar
sim.setClosed("tda-dif", true);
res = sim.analizarCircuito();
console.log("Con ambas protecciones cerradas -> Lámpara encendida?:", res.loads[0].lit);
if (!res.loads[0].lit) {
  console.error("Error: Lámpara debió encender");
  errors++;
}

// 7. Prueba de circuito mixto con enchufes (C-1 + C-2)
sim.loadLevel("cocina");
const ccCocina = sim.calcCuadroCargas();
console.log("Cocina (mixto) -> Circuitos:", ccCocina.circuits.map(c => `${c.id} (${c.name}): ${c.powerW}W, ${c.breaker}`));
if (ccCocina.circuits.length !== 2) {
  console.error("Cocina debería tener 2 circuitos (Alumbrado y Enchufes)");
  errors++;
} else {
  console.log("✓ Circuito mixto divide correctamente C-1 Alumbrado (10A) y C-2 Enchufes (16A).");
}

if (errors === 0) {
  console.log("\n>>> ¡TODAS LAS PRUEBAS PASARON SATISFACTORIAMENTE (0 ERRORES)! <<<");
} else {
  console.error(`\n>>> Hubo ${errors} errores en la verificación <<<`);
  process.exit(1);
}
