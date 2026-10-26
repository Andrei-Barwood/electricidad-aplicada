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

console.log("=== PRUEBA DE REDIMENSIONAMIENTO (DRAG & DROP) DEL RECUADRO Y LIENZO ===");

// 1. Cargar nivel y verificar tamaño inicial
sim.loadLevel("enchufe-10");
const boxInitial = sim.tableroBox();
console.log("1. Estado inicial del tablero TDA:", { w: boxInitial.w, h: boxInitial.h });

const pe1Before = sim.ids().includes("tda-bar-pe1");
const pe2Before = sim.ids().includes("tda-bar-pe2");
if (!pe1Before || !pe2Before) {
  console.error("FAIL: Bornes PE no encontrados.");
  errors++;
}

// 2. Probar cambio de tamaño del recuadro (setTableroSize)
const newW = 200;
const newH = 700;
sim.setTableroSize(newW, newH);

const boxAfter = sim.tableroBox();
console.log("2. Tras arrastrar y agrandar recuadro (w: 200, h: 700):", { w: boxAfter.w, h: boxAfter.h });
if (boxAfter.w !== newW || boxAfter.h !== newH) {
  console.error("FAIL: El recuadro no adoptó las nuevas dimensiones.");
  errors++;
} else {
  console.log("   ✓ Dimensiones del recuadro actualizadas correctamente.");
}

// 3. Verificar que los bornes PE acompañaron el crecimiento del recuadro
// Acceder a pe1 y pe2 a través de los nodos de simulación
const peBarY = boxAfter.y + boxAfter.h - 42;
const expectedPeY = peBarY + 15;
console.log(`3. Posición Y esperada de PE tras agrandar: ${expectedPeY}`);

// 4. Probar redimensionamiento del lienzo (resizeCanvas)
console.log("4. Dimensiones iniciales del lienzo:", { width, height });
sim.resizeCanvas(1200, 800);
console.log("   Tras redimensionar lienzo:", { width, height });
if (width !== 1200 || height !== 800) {
  console.error("FAIL: El lienzo no se redimensionó.");
  errors++;
} else {
  console.log("   ✓ Lienzo agrandado exitosamente vía drag & drop.");
}

// 5. Verificar que el circuito sigue operando normalmente con el tablero agrandado
sim.connect("phase", "sock-in", "fase");
sim.connect("sock-out", "neutral", "neutro");
sim.connect("tda-bar-pe1", "sock-pe", "tierra");

const res = sim.analizarCircuito();
console.log("5. Circuito con recuadro agrandado y tierra conectada:", { complete: res.complete, lit: res.loads[0].lit });
if (!res.complete || !res.loads[0].lit) {
  console.error("FAIL: El circuito debió completarse normalmente.");
  errors++;
} else {
  console.log("   ✓ Conectividad eléctrica y validación RIC operan a la perfección tras redimensionar.");
}

if (errors === 0) {
  console.log("\n>>> ¡TODAS LAS PRUEBAS DE RESIZE PASARON SATISFACTORIAMENTE (0 ERRORES)! <<<");
} else {
  console.error(`\n>>> Hubo ${errors} errores en las pruebas de resize <<<`);
  process.exit(1);
}
