// test_circuit_status_and_objectives.js
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('simulador.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "outside-only" });
const { window } = dom;

// Stubs for p5 environment
window.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
window.random = () => 0.5;
window.TWO_PI = Math.PI * 2;
window.PI = Math.PI;
window.frameCount = 0;
window.sin = Math.sin;
window.mouseX = 0;
window.mouseY = 0;
window.width = 1340;
window.height = 680;
window.createCanvas = (w, h) => ({ parent: () => {}, elt: window.document.createElement("canvas") });
window.pixelDensity = () => {};
window.textFont = () => {};
window.push = () => {};
window.pop = () => {};
window.stroke = () => {};
window.strokeWeight = () => {};
window.fill = () => {};
window.circle = () => {};
window.noStroke = () => {};
window.textSize = () => {};
window.textAlign = () => {};
window.text = () => {};
window.CENTER = 'center';
window.LEFT = 'left';
window.RIGHT = 'right';
window.noFill = () => {};
window.strokeCap = () => {};
window.ROUND = 'round';
window.bezier = () => {};
window.rectMode = () => {};
window.rect = () => {};
window.line = () => {};
window.arc = () => {};
window.CORNER = 'corner';
window.background = () => {};
window.localStorage = { getItem: () => null, setItem: () => {} };

const sketchCode = fs.readFileSync('sketch.js', 'utf8');
window.eval(sketchCode + "\nwindow.setup = setup; window.getWires = () => wires;\n");
window.setup();
const sim = window.__sim;

console.log("=== VERIFICACIÓN: ESTADO DEL CIRCUITO Y RECUADRO DE OBJETIVOS ===");
let errors = 0;

// ============================================================================
// 1. VERIFICACIÓN DEL RECUADRO "ESTADO DEL CIRCUITO"
// ============================================================================
console.log("\n1. Verificación de estados y redacción en 'Estado del circuito':");

// A. Estado inicial (en espera: tablero alimentado pero 0 cables de circuito)
sim.loadLevel("dormitorio-912");
let res = sim.analizarCircuito();
console.log("   - Estado sin cables de circuito:", res.title, "| Ayuda:", res.help);
if (res.title !== "Circuito en Espera") {
  console.error("FAIL: Estado inicial debe ser 'Circuito en Espera'. Actual:", res.title);
  errors++;
}

// B. Tablero sin conexión (vaciamos los cables del tablero)
window.getWires().splice(0, window.getWires().length);
res = sim.analizarCircuito();
console.log("   - Estado sin cables de tablero:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Tablero sin conexión")) {
  console.error("FAIL: Debe indicar 'Tablero sin conexión'. Actual:", res.title);
  errors++;
}

// C. Cableamos el tablero interno y agregamos un cable de circuito
sim.autoWireBoard(false);
sim.connect("phase", "sw-a", "fase");
res = sim.analizarCircuito();
console.log("   - Estado circuito a medio montar:", res.title, "| Ayuda:", res.help);
if (res.title !== "Circuito en Montaje") {
  console.error("FAIL: Con cables iniciados debe indicar 'Circuito en Montaje'. Actual:", res.title);
  errors++;
}

// D. Automático general abierto
sim.setClosed("tda-tm", false);
res = sim.analizarCircuito();
console.log("   - Automático abierto:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Automático")) {
  console.error("FAIL: Debe alertar sobre automático abierto.");
  errors++;
}
sim.setClosed("tda-tm", true);

// E. Diferencial abierto
sim.setClosed("tda-dif", false);
res = sim.analizarCircuito();
console.log("   - Diferencial abierto:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Diferencial")) {
  console.error("FAIL: Debe alertar sobre diferencial abierto.");
  errors++;
}
sim.setClosed("tda-dif", true);

// F. Cortocircuito franco
sim.connect("phase", "neutral", "fase");
res = sim.analizarCircuito();
console.log("   - Cortocircuito Franco:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Cortocircuito Franco")) {
  console.error("FAIL: Debe titularse '¡Cortocircuito Franco (Fase - Neutro)!'.");
  errors++;
}
sim.clearWires();

// G. Falla a tierra
sim.connect("phase", "tda-bar-pe1", "fase");
res = sim.analizarCircuito();
console.log("   - Falla a tierra:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Falla a tierra (Diferencial)")) {
  console.error("FAIL: Debe indicar falla a tierra con disparo diferencial.");
  errors++;
}
sim.clearWires();

// H. Fuga neutro-tierra
sim.connect("neutral", "tda-bar-pe1", "neutro");
res = sim.analizarCircuito();
console.log("   - Fuga neutro-tierra:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Fuga Neutro-Tierra")) {
  console.error("FAIL: Debe indicar fuga neutro-tierra.");
  errors++;
}
sim.clearWires();

// I. Falta tierra PE en enchufe (RIC N°10)
sim.loadLevel("enchufe-10");
sim.connect("phase", "sock-in", "fase");
sim.connect("neutral", "sock-out", "neutro");
res = sim.analizarCircuito();
console.log("   - Falta tierra PE:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("Falta tierra de protección (PE)")) {
  console.error("FAIL: Debe alertar sobre falta de tierra de protección PE. Actual:", res.title);
  errors++;
}

// J. Circuito Conforme a Norma
sim.connect("tda-bar-pe1", "sock-pe", "tierra");
res = sim.analizarCircuito();
console.log("   - Conforme a Norma:", res.title, "| Ayuda:", res.help);
if (res.title !== "¡Circuito Conforme a Norma!") {
  console.error("FAIL: Al completar debe decir '¡Circuito Conforme a Norma!'. Actual:", res.title);
  errors++;
}

// K. Cargas parciales operativas (1 de 3)
sim.loadLevel("medio-915-tres");
sim.connect("phase", "dbl-c", "fase");
sim.connect("dbl-1", "l1-in", "fase");
sim.connect("neutral", "l1-out", "neutro");
sim.setKey("dbl", "1", true);
res = sim.analizarCircuito();
console.log("   - Cargas parciales:", res.title, "| Ayuda:", res.help);
if (!res.title.includes("1 de 3 Cargas Operativas")) {
  console.error("FAIL: Debe indicar '1 de 3 Cargas Operativas'. Actual:", res.title);
  errors++;
}

// ============================================================================
// 2. AUDITORÍA EXHAUSTIVA DE OBJETIVOS EN LOS 72 ESCENARIOS
// ============================================================================
console.log("\n2. Auditoría exhaustiva de objetivos y tutoriales en los 72 escenarios:");

const genericSnippet = "Distribución de Neutro (Conductor de Retorno): Canaliza el conductor de sección blanca o azul (Neutro) directamente desde la barra del Tablero de Distribución Alumbrado (TDA) hacia el casquillo exterior (contacto roscado) de todos los portalámparas.";

sim.LEVELS.forEach((lvl, idx) => {
  const num = idx + 1;
  const select = window.document.querySelector("#level-select");
  select.value = lvl.id;
  select.dispatchEvent(new window.Event("change"));

  // 1. No generic snippet
  if (lvl.objective.includes(genericSnippet)) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: Contiene texto genérico copiado.`);
    errors++;
  }

  // 2. Validate structured tutorial steps
  const steps = lvl.objective.split(/(?<=\.)\s+/).map(s => s.trim()).filter(s => s.length > 5);
  if (steps.length < 3) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: Muy pocos pasos (${steps.length}).`);
    errors++;
  }
  const stepsWithoutColon = steps.filter(s => !s.includes(":"));
  if (stepsWithoutColon.length > 0) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: ${stepsWithoutColon.length} pasos sin prefijo de dos puntos (:) para el tutorial.`);
    stepsWithoutColon.forEach(s => console.error("    *", s));
    errors++;
  }

  // 3. Validate DOM tutorial element rendering
  const tutList = window.document.querySelector("#level-tutorial");
  const tutItems = tutList ? tutList.querySelectorAll("li") : [];
  if (tutItems.length !== steps.length) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: #level-tutorial tiene ${tutItems.length} items, se esperaban ${steps.length}.`);
    errors++;
  }
  // Check that each li has a strong tag with style color
  tutItems.forEach((li, stepIdx) => {
    const strong = li.querySelector("strong");
    if (!strong) {
      console.error(`FAIL [Nivel ${num} - ${lvl.id}]: Paso ${stepIdx + 1} no tiene etiqueta <strong>.`);
      errors++;
    }
  });

  // 4. Validate parts not empty and matching
  if (!lvl.parts || lvl.parts.trim().length < 5) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: 'parts' vacío o demasiado corto.`);
    errors++;
  }

  // 5. Validate headline
  if (!lvl.headline || lvl.headline.trim().length < 5) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: 'headline' vacío o inválido.`);
    errors++;
  }

  // 6. Validate success
  if (!lvl.success || lvl.success.trim().length < 5) {
    console.error(`FAIL [Nivel ${num} - ${lvl.id}]: 'success' vacío o inválido.`);
    errors++;
  }
});

if (errors === 0) {
  console.log("✓ Todos los 72 escenarios verificados con objetivos técnicos, claros, consistentes y tutorial interactivo perfecto.");
  console.log("\n>>> ¡TODAS LAS PRUEBAS DE ESTADO DE CIRCUITO Y OBJETIVOS PASARON CON 0 ERRORES! <<<");
} else {
  console.error(`\n>>> SE DETECTARON ${errors} ERRORES EN LA VERIFICACIÓN <<<`);
  process.exit(1);
}
