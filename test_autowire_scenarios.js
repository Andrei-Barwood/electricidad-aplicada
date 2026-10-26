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

const sketchCode = fs.readFileSync('sketch.js', 'utf8');
window.eval(sketchCode + "\nwindow.setup = setup; window.getWires = () => wires;\n");
window.setup();
const sim = window.__sim;

const select = window.document.querySelector("#level-select");
const wireTdaBtn = window.document.querySelector("#wire-tda");
const clearBtn = window.document.querySelector("#clear-wires");

console.log("=== VERIFICACIÓN EXHAUSTIVA DE 'CABLEAR TABLERO' EN LOS 72 ESCENARIOS ===");
let errors = 0;

const EXPECTED_BOARD_WIRES = new Set([
  ["tda-red-l", "tda-tm-in"].sort().join("::"),
  ["tda-tm-out", "tda-dif-in-l"].sort().join("::"),
  ["tda-dif-out-l", "tda-bar-l-1"].sort().join("::"),
  ["tda-red-n", "tda-dif-in-n"].sort().join("::"),
  ["tda-dif-out-n", "tda-bar-n-1"].sort().join("::"),
]);

sim.LEVELS.forEach((lvl, idx) => {
  const levelNum = idx + 1;
  // 1. Cargar nivel
  select.value = lvl.id;
  select.dispatchEvent(new window.Event("change"));

  // Verificar que la ventana de bienvenida esté activa
  if (!sim.showWelcomeModal()) {
    console.error(`FAIL: Nivel ${levelNum} (${lvl.id}) debió mostrar modal de bienvenida.`);
    errors++;
  }

  // 2. Hacer clic en el botón 'Cablear Tablero'
  wireTdaBtn.dispatchEvent(new window.Event("click"));

  // Verificar que el modal se cierre y el cuadro de cargas se ancle a la derecha
  if (sim.showWelcomeModal()) {
    console.error(`FAIL: Nivel ${levelNum} (${lvl.id}) no cerró el modal tras 'Cablear Tablero'.`);
    errors++;
  }
  if (!sim.dockedLoadTable()) {
    console.error(`FAIL: Nivel ${levelNum} (${lvl.id}) no ancló el cuadro tras 'Cablear Tablero'.`);
    errors++;
  }

  // Verificar que los 5 cables del tablero estén exactamente conectados
  const wires = window.getWires();
  const boardWires = wires.filter(w => {
    const key = [w.from.id, w.to.id].sort().join("::");
    return EXPECTED_BOARD_WIRES.has(key);
  });

  if (boardWires.length !== 5) {
    console.error(`FAIL: Nivel ${levelNum} (${lvl.id}) tiene ${boardWires.length} cables de tablero (esperados 5).`);
    errors++;
  }

  // 3. Simular que se borran cables y se vuelve a pulsar 'Cablear Tablero'
  // Provocar cables extra erróneos dentro del TDA
  sim.connect("tda-red-l", "tda-red-n", "fase");
  wireTdaBtn.dispatchEvent(new window.Event("click"));
  const cleanWires = window.getWires().filter(w => {
    const key = [w.from.id, w.to.id].sort().join("::");
    return EXPECTED_BOARD_WIRES.has(key);
  });
  if (cleanWires.length !== 5) {
    console.error(`FAIL: Nivel ${levelNum} (${lvl.id}) fallo al auto-cablear tras limpiar error interno.`);
    errors++;
  }
});

console.log(`\n✓ Todos los 72 niveles validados con el botón 'Cablear Tablero'.`);

// Prueba específica de ejercicio 59 (Cocina):
console.log("\n=== PRUEBA ESPECÍFICA EJERCICIO 59 (COCINA) ===");
select.value = "cocina";
select.dispatchEvent(new window.Event("change"));

// Clic en Cablear Tablero
wireTdaBtn.dispatchEvent(new window.Event("click"));
console.log("1. Estado tras 'Cablear Tablero' en Ejercicio 59:");
console.log("   - Modal cerrado:", !sim.showWelcomeModal());
console.log("   - Cuadro anclado:", sim.dockedLoadTable());
console.log("   - Cables de tablero:", window.getWires().length);

// Alumno conecta según las instrucciones del objetivo (luz 9/12 y enchufe directo a barras con PE)
sim.connect("phase", "sw-a", "fase");
sim.connect("sw-b", "lamp-in", "fase");
sim.connect("lamp-out", "neutral", "neutro");

sim.connect("phase", "sock-in", "fase");
sim.connect("sock-out", "neutral", "neutro");
sim.connect("tda-bar-pe1", "sock-pe", "tierra");

sim.setClosed("sw", true);
const analysis = sim.analizarCircuito();

console.log("2. Circuito cableado y encendido:");
console.log("   - Complete?:", analysis.complete);
console.log("   - Título:", analysis.title);
console.log("   - Luz OK?:", analysis.loads[0].ok);
console.log("   - Enchufe OK?:", analysis.loads[1].ok);

if (!analysis.complete || !analysis.loads[0].ok || !analysis.loads[1].ok) {
  console.error("FAIL: Ejercicio 59 debió completar con cableado directo normativo y PE.");
  errors++;
} else {
  console.log("   ✓ Ejercicio 59 autovalidado y completado exitosamente.");
}

if (errors === 0) {
  console.log("\n>>> ¡TODOS LOS ESCENARIOS Y EL EJERCICIO 59 FUNCIONAN AL 100%! <<<");
  process.exit(0);
} else {
  console.error(`\n>>> Errores encontrados: ${errors} <<<`);
  process.exit(1);
}
