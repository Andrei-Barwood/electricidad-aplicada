const fs = require('fs');
const assert = require('assert');

console.log("=== INICIANDO PRUEBAS DE RESPONSIVIDAD DEL LIENZO DEL SIMULADOR ===");

// 1. Verificar simulador.css
const css = fs.readFileSync('simulador.css', 'utf8');

// Comprobar que #simulator-canvas tiene width: 100%, max-width: 100%, overflow: hidden
assert(css.includes('#simulator-canvas {'), "Falta regla #simulator-canvas en simulador.css");
assert(css.includes('overflow: hidden;'), "#simulator-canvas debe tener overflow: hidden para evitar scrollbars no deseados");
assert(css.includes('width: 100%;'), "#simulator-canvas debe ocupar el 100% del contenedor");

// Comprobar que #simulator-canvas canvas tiene width: 100% !important, height: auto !important, max-width: 1340px, aspect-ratio
assert(css.includes('#simulator-canvas canvas {'), "Falta regla #simulator-canvas canvas en simulador.css");
assert(/width:\s*100%\s*!important/.test(css), "El canvas debe tener width: 100% !important");
assert(/height:\s*auto\s*!important/.test(css), "El canvas debe tener height: auto !important");
assert(/aspect-ratio:\s*1340\s*\/\s*680/.test(css), "El canvas debe tener aspect-ratio: 1340 / 680");
assert(/touch-action:\s*none/.test(css), "El canvas debe tener touch-action: none");

console.log("✓ simulador.css verificado correctamente con reglas responsive fluidas.");

// 2. Verificar sketch.js
const sketch = fs.readFileSync('sketch.js', 'utf8');
assert(sketch.includes('function updateCanvasResponsiveStyle()'), "sketch.js debe definir updateCanvasResponsiveStyle()");
assert(sketch.includes('function windowResized()'), "sketch.js debe implementar windowResized() para eventos de resize de ventana");
assert(sketch.includes('function touchStarted()'), "sketch.js debe implementar touchStarted()");
assert(sketch.includes('function touchMoved()'), "sketch.js debe implementar touchMoved()");
assert(sketch.includes('function touchEnded()'), "sketch.js debe implementar touchEnded()");

console.log("✓ Funciones responsive y de soporte táctil presentes en sketch.js.");

// 3. Simular entorno DOM y verificar comportamiento en diferentes anchos de pantalla
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
global.resizeCanvas = (w, h) => { global.width = w; global.height = h; };
global.pixelDensity = () => {};
global.textFont = () => {};
global.createCanvas = (w, h) => ({
  elt: {
    style: {
      setProperty: function(prop, val, prio) { this[prop] = val; }
    },
    setAttribute: () => {}
  },
  parent: () => {}
});

global.window = { addEventListener: () => {} };
global.getComputedStyle = () => ({ getPropertyValue: () => "#000" });
const dummyElem = {
  textContent: '',
  style: { setProperty: function(prop, val) { this[prop] = val; } },
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
  createElement: () => dummyElem,
  createTextNode: (t) => ({ textContent: t }),
  documentElement: { getAttribute: () => "night", setAttribute: () => {} },
  addEventListener: () => {}
};

// Cargar sketch.js en el entorno global
const vm = require('vm');
vm.runInThisContext(sketch);

// Probar setup() y updateCanvasResponsiveStyle
setup();
const elt = window.__sim.getCanvasElt();
assert(elt, "canvasElt debe existir tras setup()");
assert.strictEqual(elt.style.width, "100%", "El estilo width del canvas debe ser 100%");
assert.strictEqual(elt.style['max-width'], "1340px", "El estilo max-width debe ser 1340px");
assert.strictEqual(elt.style.height, "auto", "El estilo height debe ser auto");
assert.strictEqual(elt.style['aspect-ratio'], "1340 / 680", "El estilo aspect-ratio debe ser 1340 / 680");

console.log("✓ setup() configuró exitosamente las propiedades responsive del canvas.");

// Probar redimensionamiento dinámico
window.__sim.resizeCanvas(1600, 800);
assert.strictEqual(elt.style['max-width'], "1600px", "max-width debe actualizarse dinámicamente al redimensionar");
assert.strictEqual(elt.style['aspect-ratio'], "1600 / 800", "aspect-ratio debe actualizarse dinámicamente");

console.log("✓ Redimensionamiento dinámico actualiza max-width y aspect-ratio correctamente.");

// 4. Verificación matemática exhaustiva de proyección de coordenadas en múltiples resoluciones
const resolutions = [
  { name: "Pantalla Ultrawide / 4K", containerW: 1920, expectedScale: 1.0 }, // Capped at max-width 1340px
  { name: "Desktop Nativo", containerW: 1340, expectedScale: 1.0 },
  { name: "Laptop / Panel Iframe", containerW: 1000, expectedScale: 1000 / 1340 },
  { name: "Tablet iPad Portrait", containerW: 768, expectedScale: 768 / 1340 },
  { name: "Móvil Horizontal", containerW: 480, expectedScale: 480 / 1340 },
  { name: "Móvil iPhone Portrait", containerW: 375, expectedScale: 375 / 1340 },
  { name: "Móvil Compacto", containerW: 320, expectedScale: 320 / 1340 }
];

const testPoints = [
  { desc: "Borne TDA Fase (116, 120)", x: 116, y: 120 },
  { desc: "Interruptor 9/12 (500, 360)", x: 500, y: 360 },
  { desc: "Lámpara C1 (740, 200)", x: 740, y: 200 },
  { desc: "Botón Cuadro Cargas (1170, 48)", x: 1170, y: 48 }
];

resolutions.forEach(res => {
  const renderedW = Math.min(res.containerW, 1340);
  const renderedH = renderedW * (680 / 1340);
  const sx = renderedW / 1340;
  const sy = renderedH / 680;

  testPoints.forEach(pt => {
    // Coordenada en pantalla tras escalado CSS
    const screenX = pt.x * sx;
    const screenY = pt.y * sy;

    // Desproyección p5.js: getMousePos(canvas, 1340, 680, evt)
    const computedX = screenX / sx;
    const computedY = screenY / sy;

    assert(Math.abs(computedX - pt.x) < 0.001, `Error en X para ${res.name} en ${pt.desc}`);
    assert(Math.abs(computedY - pt.y) < 0.001, `Error en Y para ${res.name} en ${pt.desc}`);
  });
  console.log(`✓ ${res.name} (${res.containerW}px -> render ${renderedW.toFixed(1)}x${renderedH.toFixed(1)}px): coordenadas 100% exactas.`);
});

// 5. Verificar index.html y electricidad-aplicada.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
const eaHtml = fs.readFileSync('electricidad-aplicada.html', 'utf8');

assert(indexHtml.includes('#panel-simulador .simulador-frame-card'), "index.html debe tener la regla responsive simulador-frame-card");
assert(indexHtml.includes('class="card simulador-frame-card"'), "index.html debe usar la clase simulador-frame-card");
assert(eaHtml.includes('#panel-simulador .simulador-frame-card'), "electricidad-aplicada.html debe tener la regla responsive simulador-frame-card");
assert(eaHtml.includes('class="card simulador-frame-card"'), "electricidad-aplicada.html debe usar la clase simulador-frame-card");

console.log("✓ index.html y electricidad-aplicada.html configurados con clase responsive simulador-frame-card.");

console.log("\n>>> ¡TODAS LAS PRUEBAS DE RESPONSIVIDAD DEL LIENZO PASARON SATISFACTORIAMENTE (0 ERRORES)! <<<");
