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

console.log("=== VERIFICACIÓN NORMATIVA RIC N°10 Y N°06: ENCHUFES CON TIERRA ===");

// 1. Probar enchufe 10A solo con Fase y Neutro (debe encender pero NO completar por falta de PE)
sim.loadLevel("enchufe-10");
sim.connect("phase", "sock-in", "fase");
sim.connect("sock-out", "neutral", "neutro");

let res = sim.analizarCircuito();
console.log("1. Enchufe 10A sin tierra PE:");
console.log("   - Lit (con tensión):", res.loads[0].lit);
console.log("   - Complete (cumple RIC):", res.complete);
console.log("   - Título de alerta:", res.title);
console.log("   - Mensaje pedagógico:", res.help);

if (!res.loads[0].lit) {
  console.error("FAIL: El enchufe debería tener tensión 220V.");
  errors++;
}
if (res.complete) {
  console.error("FAIL: El enchufe NO debe validar como completo sin cable de tierra según RIC N°10.");
  errors++;
}
if (!res.title.includes("tierra")) {
  console.error("FAIL: El título debe alertar sobre falta de tierra.");
  errors++;
}

// 2. Conectar cable de tierra de protección desde el TDA (debe completar)
sim.connect("tda-bar-pe1", "sock-pe", "tierra");
res = sim.analizarCircuito();
console.log("\n2. Enchufe 10A con tierra PE conectada a barra TDA:");
console.log("   - Lit:", res.loads[0].lit);
console.log("   - Complete:", res.complete);
console.log("   - Título:", res.title);

if (!res.complete) {
  console.error("FAIL: El enchufe con tierra reglamentaria debe estar completo.");
  errors++;
} else {
  console.log("   ✓ Enchufe 10A validado satisfactoriamente con norma RIC N°10.");
}

// 3. Dos enchufes en paralelo (dos-enchufes) con derivación de tierra
sim.loadLevel("dos-enchufes");
// Alimenta S1
sim.connect("phase", "s1-in", "fase");
sim.connect("s1-out", "neutral", "neutro");
// Puentea S1 a S2
sim.connect("s1-in", "s2-in", "fase");
sim.connect("s1-out", "s2-out", "neutro");
// Conecta tierra solo a S1
sim.connect("tda-bar-pe1", "s1-pe", "tierra");

res = sim.analizarCircuito();
console.log("\n3. Dos enchufes (S1 aterrizado, S2 sin tierra):");
console.log("   - S1 OK?:", res.loads[0].ok);
console.log("   - S2 OK?:", res.loads[1].ok);
console.log("   - Complete?:", res.complete);

if (!res.loads[0].ok || res.loads[1].ok || res.complete) {
  console.error("FAIL: S2 no debe estar OK sin tierra.");
  errors++;
}

// Ahora puentea tierra de S1 a S2 (enlace equipotencial en cascada)
sim.connect("s1-pe", "s2-pe", "tierra");
res = sim.analizarCircuito();
console.log("   - Tras puentear tierra a S2, Complete?:", res.complete);
if (!res.complete) {
  console.error("FAIL: Ambos enchufes deben quedar validados con tierra puenteada.");
  errors++;
} else {
  console.log("   ✓ Derivación de tierra en paralelo validada.");
}

// 4. Prueba de Falla a Tierra (Fase toca Barra PE)
sim.loadLevel("enchufe-10");
sim.connect("phase", "tda-bar-pe1", "fase");
res = sim.analizarCircuito();
console.log("\n4. Cortocircuito Fase a Tierra (PE):");
console.log("   - Short?:", res.short);
console.log("   - Título:", res.title);
console.log("   - Mensaje:", res.help);

if (!res.short || !res.title.includes("Diferencial")) {
  console.error("FAIL: Falla a tierra debe disparar el diferencial.");
  errors++;
} else {
  console.log("   ✓ Protección diferencial operó correctamente por falla a tierra.");
}

// 5. Prueba de Fuga Neutro-Tierra
sim.loadLevel("enchufe-10");
sim.connect("neutral", "tda-bar-pe1", "neutro");
res = sim.analizarCircuito();
console.log("\n5. Fuga Neutro a Tierra (PE):");
console.log("   - Short?:", res.short);
console.log("   - Título:", res.title);
if (!res.short || !res.title.includes("Fuga")) {
  console.error("FAIL: Fuga Neutro-Tierra debe disparar advertencia diferencial.");
  errors++;
} else {
  console.log("   ✓ Fuga neutro-tierra detectada según RIC N°06.");
}

// 6. Prueba de Enchufe 16A con corte Bipolar (lavadora)
sim.loadLevel("lavadora");
// Red a bipolar
sim.connect("phase", "bip-fi", "fase");
sim.connect("neutral", "bip-ni", "neutro");
// Bipolar a enchufe
sim.connect("bip-fo", "sock-in", "fase");
sim.connect("bip-no", "sock-out", "neutro");
// Tierra ininterrumpida directa al enchufe
sim.connect("tda-bar-pe1", "sock-pe", "tierra");

// Bipolar abierto por defecto
res = sim.analizarCircuito();
console.log("\n6. Lavadero 16A Bipolar abierto:");
console.log("   - Con tensión?:", res.loads[0].lit);
console.log("   - Complete?:", res.complete);

// Cerrar bipolar
sim.setClosed("bip", true);
res = sim.analizarCircuito();
console.log("   Bipolar cerrado:");
console.log("   - Con tensión?:", res.loads[0].lit);
console.log("   - Complete?:", res.complete);

if (!res.loads[0].lit || !res.complete) {
  console.error("FAIL: Lavadora 16A debió completar con bipolar cerrado y tierra PE.");
  errors++;
} else {
  console.log("   ✓ Enchufe 16A con corte bipolar y tierra ininterrumpida validado según RIC.");
}

// 7. Prueba de Desacoplamiento Bipolar en Nivel Cocina (Luz y Fuerza)
// Si el enchufe 16 A está cableado a bornes directos de la barra TDA (sin pasar por el bipolar),
// abrir o cerrar el interruptor bipolar NO debe cambiar el estado de energización (lit) del enchufe.
sim.loadLevel("cocina");
sim.connect("tda-bar-l-1", "sock-in", "fase");
sim.connect("tda-bar-n-1", "sock-out", "neutro");
sim.connect("tda-bar-pe1", "sock-pe", "tierra");

sim.setClosed("bip", false);
res = sim.analizarCircuito();
console.log("\n7. Cocina: Enchufe directo con bipolar desconectado (bipolar abierto):");
console.log("   - Enchufe con tensión (lit)?:", res.loads[1].lit);
if (!res.loads[1].lit) {
  console.error("FAIL: El enchufe está cableado a la barra y debió conservar tensión aun con bipolar abierto.");
  errors++;
}

sim.setClosed("bip", true);
res = sim.analizarCircuito();
console.log("   Bipolar cerrado:");
console.log("   - Enchufe con tensión (lit)?:", res.loads[1].lit);
if (!res.loads[1].lit) {
  console.error("FAIL: El enchufe debe permanecer con tensión al cerrar bipolar desconectado.");
  errors++;
}
console.log("   ✓ Enchufe y corte bipolar correctamente desacoplados física y visualmente.");

if (errors === 0) {
  console.log("\n>>> ¡TODAS LAS PRUEBAS DE ENCHUFES Y TIERRA RIC PASARON CON ÉXITO (0 ERRORES)! <<<");
} else {
  console.error(`\n>>> Hubo ${errors} errores en las pruebas de enchufes <<<`);
  process.exit(1);
}
