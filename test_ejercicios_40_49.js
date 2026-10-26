// test_ejercicios_40_49.js
// Verificación integral de conectividad, depuración de fallas y cumplimiento normativo RIC
// para los ejercicios 40 al 49 del simulador domiciliario.

const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('simulador.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "outside-only" });
const { window } = dom;

// Entorno simulado de p5.js
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
window.eval(sketchCode + "\nwindow.setup = setup; window.getWires = () => wires; window.getComponents = () => components; window.getNodes = () => nodes; window.getActiveLevel = () => activeLevel;\n");
window.setup();
const sim = window.__sim;

console.log("===============================================================================");
console.log("AUDITORÍA Y DEPURACIÓN DE CONECTIVIDAD: EJERCICIOS 40 AL 49 (SIMULADOR CFT)");
console.log("===============================================================================");

let totalErrors = 0;

const exercises = [
  {
    num: 40,
    id: "pasillo-924",
    name: "Pasillo · Conmutada 9/24 con dos lámparas en paralelo",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "s2-a", "retorno");
      sim.connect("s1-b", "s2-b", "retorno");
      sim.connect("s2-c", "l1-in", "retorno");
      sim.connect("s2-c", "l2-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
      sim.connect("neutral", "l2-out", "neutro");
    },
    validateState: (res) => res.complete && res.loads.length === 2 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "Fase conectada al borne lateral A en lugar del común C",
        wire: () => {
          sim.connect("phase", "s1-a", "fase");
          sim.connect("s1-b", "s2-b", "retorno");
          sim.connect("s2-c", "l1-in", "retorno");
          sim.connect("s2-c", "l2-in", "retorno");
          sim.connect("neutral", "l1-out", "neutro");
          sim.connect("neutral", "l2-out", "neutro");
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 41,
    id: "tres-accesos",
    name: "Tres Accesos · Conmutación con 9/24 e interruptor de cruce",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "cross-a1", "retorno");
      sim.connect("s1-b", "cross-a2", "retorno");
      sim.connect("cross-b1", "s2-a", "retorno");
      sim.connect("cross-b2", "s2-b", "retorno");
      sim.connect("s2-c", "lamp-in", "retorno");
      sim.connect("neutral", "lamp-out", "neutro");
    },
    validateState: (res) => res.complete && res.loads[0].ok,
    faults: [
      {
        name: "Conexión en corto directo a bornes A1-B1 en vez de cruce",
        wire: () => {
          sim.connect("phase", "s1-c", "fase");
          sim.connect("s1-a", "cross-a1", "retorno");
          sim.connect("s1-b", "cross-b1", "retorno");
          sim.connect("cross-a2", "s2-a", "retorno");
          sim.connect("cross-b2", "s2-b", "retorno");
          sim.connect("s2-c", "lamp-in", "retorno");
          sim.connect("neutral", "lamp-out", "neutro");
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 42,
    id: "pasillo-enchufe",
    name: "Pasillo · Conmutada 9/24 y enchufe con tierra PE",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "s2-a", "retorno");
      sim.connect("s1-b", "s2-b", "retorno");
      sim.connect("s2-c", "lamp-in", "retorno");
      sim.connect("neutral", "lamp-out", "neutro");
      sim.connect("phase", "sock-in", "fase");
      sim.connect("neutral", "sock-out", "neutro");
      sim.connect("tda-bar-pe1", "sock-pe", "tierra");
    },
    validateState: (res) => res.complete && res.loads.length === 2 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "Enchufe sin conductor de protección PE (violación RIC N°10)",
        wire: () => {
          sim.connect("phase", "s1-c", "fase");
          sim.connect("s1-a", "s2-a", "retorno");
          sim.connect("s1-b", "s2-b", "retorno");
          sim.connect("s2-c", "lamp-in", "retorno");
          sim.connect("neutral", "lamp-out", "neutro");
          sim.connect("phase", "sock-in", "fase");
          sim.connect("neutral", "sock-out", "neutro");
        },
        expectFault: (res) => !res.complete && res.title.includes("tierra de protección")
      }
    ]
  },
  {
    num: 43,
    id: "dos-dormitorios",
    name: "Dos Habitaciones · Circuitos 9/12 independientes",
    wireValid: () => {
      sim.connect("phase", "sw1-a", "fase");
      sim.connect("sw1-b", "l1-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
      sim.connect("phase", "sw2-a", "fase");
      sim.connect("sw2-b", "l2-in", "retorno");
      sim.connect("neutral", "l2-out", "neutro");
      sim.setClosed("sw1", true);
      sim.setClosed("sw2", true);
    },
    validateState: (res) => res.complete && res.loads.length === 2 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "sw1 comanda ambas lámparas en paralelo (pérdida de independencia)",
        wire: () => {
          sim.connect("phase", "sw1-a", "fase");
          sim.connect("sw1-b", "l1-in", "retorno");
          sim.connect("sw1-b", "l2-in", "retorno");
          sim.connect("neutral", "l1-out", "neutro");
          sim.connect("neutral", "l2-out", "neutro");
          sim.setClosed("sw1", true);
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 44,
    id: "principal",
    name: "Dormitorio Principal · Doble efecto 9/15 y enchufe con tierra PE",
    wireValid: () => {
      sim.connect("phase", "dbl-c", "fase");
      sim.connect("dbl-1", "l1-in", "retorno");
      sim.connect("dbl-2", "l2-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
      sim.connect("neutral", "l2-out", "neutro");
      sim.connect("phase", "sock-in", "fase");
      sim.connect("neutral", "sock-out", "neutro");
      sim.connect("tda-bar-pe1", "sock-pe", "tierra");
      sim.setKey("dbl", "1", true);
      sim.setKey("dbl", "2", true);
    },
    validateState: (res) => res.complete && res.loads.length === 3 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "Enchufe comandado desde tecla 1 en vez de fase directa continua",
        wire: () => {
          sim.connect("phase", "dbl-c", "fase");
          sim.connect("dbl-1", "l1-in", "retorno");
          sim.connect("dbl-2", "l2-in", "retorno");
          sim.connect("neutral", "l1-out", "neutro");
          sim.connect("neutral", "l2-out", "neutro");
          sim.connect("dbl-1", "sock-in", "fase");
          sim.connect("neutral", "sock-out", "neutro");
          sim.connect("tda-bar-pe1", "sock-pe", "tierra");
          sim.setKey("dbl", "1", true);
          sim.setKey("dbl", "2", true);
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 45,
    id: "avanzado-924-corto",
    name: "Escalera Compacta · Conmutación 9/24",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "s2-a", "retorno");
      sim.connect("s1-b", "s2-b", "retorno");
      sim.connect("s2-c", "l1-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
    },
    validateState: (res) => res.complete && res.loads[0].ok,
    faults: [
      {
        name: "Neutro conectado a común de s2 y retorno a barra neutro (Cortocircuito)",
        wire: () => {
          sim.connect("phase", "s1-c", "fase");
          sim.connect("s1-a", "s2-a", "retorno");
          sim.connect("s1-b", "s2-b", "retorno");
          sim.connect("neutral", "s2-c", "neutro");
          sim.connect("l1-in", "phase", "fase");
          sim.connect("l1-out", "neutral", "neutro");
        },
        expectFault: (res) => res.short || res.title.includes("Cortocircuito")
      }
    ]
  },
  {
    num: 46,
    id: "avanzado-924-largo",
    name: "Pasillo Extenso · Conmutada 9/24 con tres luminarias",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "s2-a", "retorno");
      sim.connect("s1-b", "s2-b", "retorno");
      sim.connect("s2-c", "l1-in", "retorno");
      sim.connect("s2-c", "l2-in", "retorno");
      sim.connect("s2-c", "l3-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
      sim.connect("neutral", "l2-out", "neutro");
      sim.connect("neutral", "l3-out", "neutro");
    },
    validateState: (res) => res.complete && res.loads.length === 3 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "L3 conectada en serie con L2 en lugar de derivación en paralelo",
        wire: () => {
          sim.connect("phase", "s1-c", "fase");
          sim.connect("s1-a", "s2-a", "retorno");
          sim.connect("s1-b", "s2-b", "retorno");
          sim.connect("s2-c", "l1-in", "retorno");
          sim.connect("s2-c", "l2-in", "retorno");
          sim.connect("l2-out", "l3-in", "retorno");
          sim.connect("neutral", "l1-out", "neutro");
          sim.connect("neutral", "l3-out", "neutro");
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 47,
    id: "avanzado-diag-924",
    name: "Diagnóstico · Error de cableado en conmutada 9/24",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "s2-a", "retorno");
      sim.connect("s1-b", "s2-b", "retorno");
      sim.connect("s2-c", "l1-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
    },
    validateState: (res) => res.complete && res.loads[0].ok,
    faults: [
      {
        name: "Cableado Carter peligroso (Fase a A y Neutro a B en ambos conmutadores)",
        wire: () => {
          sim.connect("phase", "s1-a", "fase");
          sim.connect("phase", "s2-a", "fase");
          sim.connect("neutral", "s1-b", "neutro");
          sim.connect("neutral", "s2-b", "neutro");
          sim.connect("s1-c", "l1-in", "retorno");
          sim.connect("s2-c", "l1-out", "retorno");
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 48,
    id: "avanzado-mixto-placa",
    name: "Placa Modular Mixta · Conmutador 9/24 e Interruptor 9/12",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "s2-a", "retorno");
      sim.connect("s1-b", "s2-b", "retorno");
      sim.connect("s2-c", "l1-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
      sim.connect("s1-c", "sw-a", "fase");
      sim.connect("sw-b", "l2-in", "retorno");
      sim.connect("neutral", "l2-out", "neutro");
      sim.setClosed("sw", true);
    },
    validateState: (res) => res.complete && res.loads.length === 2 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "Falta puente de fase entre s1 y sw en la placa modular",
        wire: () => {
          sim.connect("phase", "s1-c", "fase");
          sim.connect("s1-a", "s2-a", "retorno");
          sim.connect("s1-b", "s2-b", "retorno");
          sim.connect("s2-c", "l1-in", "retorno");
          sim.connect("neutral", "l1-out", "neutro");
          sim.connect("sw-b", "l2-in", "retorno");
          sim.connect("neutral", "l2-out", "neutro");
          sim.setClosed("sw", true);
        },
        expectFault: (res) => !res.complete
      }
    ]
  },
  {
    num: 49,
    id: "avanzado-tres-accesos-2",
    name: "Pasillo Distribuidor · Tres accesos con dos lámparas",
    wireValid: () => {
      sim.connect("phase", "s1-c", "fase");
      sim.connect("s1-a", "c-a1", "retorno");
      sim.connect("s1-b", "c-a2", "retorno");
      sim.connect("c-b1", "s2-a", "retorno");
      sim.connect("c-b2", "s2-b", "retorno");
      sim.connect("s2-c", "l1-in", "retorno");
      sim.connect("s2-c", "l2-in", "retorno");
      sim.connect("neutral", "l1-out", "neutro");
      sim.connect("neutral", "l2-out", "neutro");
    },
    validateState: (res) => res.complete && res.loads.length === 2 && res.loads.every(l => l.ok),
    faults: [
      {
        name: "Interruptor de cruce conectado directo a la lámpara sin pasar por s2",
        wire: () => {
          sim.connect("phase", "s1-c", "fase");
          sim.connect("s1-a", "c-a1", "retorno");
          sim.connect("s1-b", "c-a2", "retorno");
          sim.connect("c-b1", "l1-in", "retorno");
          sim.connect("c-b2", "l2-in", "retorno");
          sim.connect("neutral", "l1-out", "neutro");
          sim.connect("neutral", "l2-out", "neutro");
        },
        expectFault: (res) => !res.complete
      }
    ]
  }
];

exercises.forEach(ex => {
  console.log(`\n-------------------------------------------------------------------------------`);
  console.log(`Ejercicio ${ex.num}: ${ex.name} [ID: ${ex.id}]`);

  // 1. Validar conexión reglamentaria
  sim.loadLevel(ex.id);
  ex.wireValid();
  const validRes = sim.analizarCircuito();
  if (ex.validateState(validRes)) {
    console.log(`  ✓ Conexión reglamentaria: ÉXITO (Complete = true, ${validRes.title})`);
  } else {
    console.error(`  ✕ FALLA: Conexión reglamentaria no completó satisfactoriamente.`);
    console.error(`    Detalle:`, validRes);
    totalErrors++;
  }

  // 2. Validar detección de fallas típicas
  ex.faults.forEach((fault, fIdx) => {
    sim.loadLevel(ex.id);
    fault.wire();
    const faultRes = sim.analizarCircuito();
    const isDetected = fault.expectFault(faultRes);
    if (isDetected) {
      console.log(`  ✓ Detección de falla [${fIdx + 1}]: "${fault.name}"`);
      console.log(`    Estado detectado: "${faultRes.title}" | Ayuda pedagógica: "${faultRes.help || (faultRes.loads[0] && faultRes.loads[0].hint)}"`);
    } else {
      console.error(`  ✕ FALLA: El simulador no detectó la anomalía "${fault.name}".`);
      totalErrors++;
    }
  });
});

console.log(`\n===============================================================================`);
if (totalErrors === 0) {
  console.log(`>>> ¡ÉXITO TOTAL! Los 10 ejercicios (40 al 49) están perfectamente depurados y verificados.`);
  process.exit(0);
} else {
  console.error(`>>> SE DETECTARON ${totalErrors} ERRORES DE CONECTIVIDAD O DIAGNÓSTICO <<<`);
  process.exit(1);
}
