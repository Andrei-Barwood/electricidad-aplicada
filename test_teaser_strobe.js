const fs = require('fs');

global.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
global.random = () => 0.5;
global.TWO_PI = Math.PI * 2;
global.PI = Math.PI;
global.frameCount = 0;
global.sin = Math.sin;
global.mouseX = 0;
global.mouseY = 0;
global.width = 1340;
global.height = 680;
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
global.BOTTOM = 'bottom';
global.triangle = () => {};
global.translate = () => {};
global.resizeCanvas = (w, h) => { global.width = w; global.height = h; };

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

console.log("=== PRUEBA: EFECTO TEASER / TASER Y LUZ ESTROBER ANTE CONEXIONES ERRÓNEAS ===");

// 1. Estado inicial normal
sim.loadLevel("dormitorio-912");
sim.acceptWelcomeModal();
let fault = sim.findFaultPath();
console.log("1. Estado inicial sin fallas:");
console.log("   - Short activo:", sim.analysis().short);
console.log("   - Falla detectada:", fault);

if (sim.analysis().short || fault !== null) {
  console.error("FAIL: No debería haber cortocircuito inicialmente.");
  errors++;
} else {
  console.log("   ✓ Circuito limpio sin corto.");
}

// 2. Provocar cortocircuito directo Fase - Neutro
console.log("2. Conectando Fase directa a Neutro (Cortocircuito franco)...");
sim.connect("phase", "neutral");
let res = sim.analizarCircuito();
fault = sim.findFaultPath();

console.log("   - Short activo:", res.short);
console.log("   - Título de alerta:", res.title);
console.log("   - Tipo de falla:", fault ? fault.type : null);
console.log("   - Camino de falla:", fault && fault.path ? fault.path.map(n => n.id) : null);

if (!res.short || !fault || fault.type !== "line-neutral") {
  console.error("FAIL: Debería detectar cortocircuito franco Fase-Neutro.");
  errors++;
} else {
  console.log("   ✓ Cortocircuito franco Fase-Neutro detectado correctamente.");
}

// 3. Probar ejecución de draw() durante el cortocircuito (arcos teaser y luz estrober)
try {
  global.frameCount = 5;
  sim.draw();
  global.frameCount = 6;
  sim.draw();
  console.log("   - Sparks generadas por el teaser:", sim.teaserSparks().length);
  if (sim.teaserSparks().length === 0) {
    console.error("FAIL: Deberían haberse generado chispas eléctricas.");
    errors++;
  } else {
    console.log("   ✓ Arcos teaser y partículas de chispa activadas con éxito.");
  }
} catch (e) {
  console.error("FAIL: Error al ejecutar draw() con efecto estrober:", e);
  errors++;
}

// 4. Provocar cortocircuito a través de un interruptor cerrado (Fase -> sw-a, sw-b -> Neutro)
console.log("4. Provocando cortocircuito a través de mecanismo (llave 9/12 en corto)...");
sim.loadLevel("dormitorio-912");
sim.acceptWelcomeModal();
sim.connect("phase", "sw-a");
sim.connect("sw-b", "neutral");
sim.setClosed("sw", true);
res = sim.analizarCircuito();
fault = sim.findFaultPath();

console.log("   - Con llave cerrada -> Short:", res.short, "Tipo:", fault ? fault.type : null);
if (!res.short || !fault || fault.path.length < 3) {
  console.error("FAIL: El camino del cortocircuito debería atravesar el interruptor.");
  errors++;
} else {
  console.log("   ✓ Camino del cortocircuito a través del interruptor:", fault.path.map(n => n.id).join(" ➔ "));
}

// Al abrir el interruptor, el corto debe desaparecer
sim.setClosed("sw", false);
res = sim.analizarCircuito();
console.log("   - Con llave abierta -> Short:", res.short);
if (res.short) {
  console.error("FAIL: Al abrir el interruptor el cortocircuito debió cortarse.");
  errors++;
} else {
  console.log("   ✓ Cortocircuito interrumpido al abrir la llave.");
}

// 5. Provocar Falla a Tierra (Fase a Barra PE)
console.log("5. Provocando falla Fase a Tierra PE...");
sim.loadLevel("enchufe-10");
sim.acceptWelcomeModal();
sim.connect("phase", "tda-bar-pe1");
res = sim.analizarCircuito();
fault = sim.findFaultPath();

console.log("   - Short:", res.short, "Título:", res.title, "Tipo:", fault ? fault.type : null);
if (!res.short || !fault || fault.type !== "earth-fault") {
  console.error("FAIL: Debería detectar falla a tierra Fase-PE.");
  errors++;
} else {
  console.log("   ✓ Falla a tierra con disparo de diferencial detectada.");
}

// 6. Provocar Fuga Neutro-Tierra
console.log("6. Provocando fuga Neutro a Tierra PE...");
sim.loadLevel("enchufe-10");
sim.acceptWelcomeModal();
sim.connect("neutral", "tda-bar-pe1");
res = sim.analizarCircuito();
fault = sim.findFaultPath();

console.log("   - Short:", res.short, "Título:", res.title, "Tipo:", fault ? fault.type : null);
if (!res.short || !fault || fault.type !== "neutral-leak") {
  console.error("FAIL: Debería detectar fuga neutro-tierra.");
  errors++;
} else {
  console.log("   ✓ Fuga neutro-tierra detectada.");
}

// 7. Retiro de cable erróneo y restauración de estado normal
console.log("7. Desconectando cables erróneos y restableciendo circuito normal...");
sim.clearWires();
sim.connect("phase", "sock-in", "fase");
sim.connect("sock-out", "neutral", "neutro");
sim.connect("tda-bar-pe1", "sock-pe", "tierra");
res = sim.analizarCircuito();

console.log("   - Estado restablecido -> Short:", res.short, "Complete:", res.complete);
if (res.short || !res.complete) {
  console.error("FAIL: Circuito debió completarse sin fallas.");
  errors++;
} else {
  console.log("   ✓ Circuito operativo y efecto estrober desactivado.");
}

if (errors === 0) {
  console.log("\n>>> ¡TODAS LAS PRUEBAS DEL EFECTO TEASER Y LUZ ESTROBER PASARON CON ÉXITO (0 ERRORES)! <<<");
} else {
  console.error(`\n>>> Hubo ${errors} errores en la verificación <<<`);
  process.exit(1);
}
