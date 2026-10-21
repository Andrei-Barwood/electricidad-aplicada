/* Magia · La electricidad, según el mago Vaelithor
   Motor Unificado: 14 Pisos (56 Tutoriales Interactivos) + Taller de Potencias de 10 (Vaelithor)
   Depurado sin pifias según bitacora magia.md (Prompts 0 al 14)
*/
(function (global) {
  "use strict";

  const W = 1280, H = 720;
  const A = "magia/assets";
  const RAIN = ["#f5c518", "#f08c00", "#e23d28", "#d12b6a", "#7b4ea3", "#3b6ea8", "#3aa07a", "#8bbd3a"];
  const WOOD = "#c9a36a";
  const INK = "#3a2f27";
  const GOLD = "#e6a817";

  let view = "hub"; // "hub" | "floor" | "play" | "kit" | "vaelithor"
  let floorIdx = 0;
  let tutIdx = 0;
  let vaelithorIdx = 0;
  let isVaelithorMode = false;
  let phase = 0;
  let sketch = null;
  let world = null;
  let dragging = null;
  let dragOff = { x: 0, y: 0 };
  let dragStartPos = { x: 0, y: 0 };
  let dragMoved = false;
  let done = new Set();
  let showTable = false;
  let sparks = [];

  try {
    JSON.parse(localStorage.getItem("ea-magia-done") || "[]").forEach((id) => done.add(id));
  } catch (e) {}

  // Helper para obtener rutas de imágenes (soporta MAGIA_ASSETS Base64 o rutas de magia/assets)
  function getAssetSrc(key) {
    if (global.MAGIA_ASSETS && global.MAGIA_ASSETS[key]) {
      return global.MAGIA_ASSETS[key];
    }
    const directMap = {
      playroom_bg: A + "/playroom_bg.jpg",
      wooden_blocks: A + "/wooden_blocks.jpg",
      vaelithor_avatar: A + "/vaelithor.jpg",
      prado: A + "/sprites/bg-prado.jpg",
      "mesa-vacia": A + "/sprites/mesa-vacia.jpg",
      plus: A + "/sprites/placa-mas.png",
      minus: A + "/sprites/placa-menos.png"
    };
    if (directMap[key]) return directMap[key];
    return A + "/sprites/" + key + ".png";
  }

  // Carga no bloqueante con HTMLImageElement (100% inmune a CORS en file:// y http://)
  const imgs = {};
  const ALL_SPRITE_KEYS = [
    "playroom_bg", "wooden_blocks", "vaelithor_avatar", "prado", "mesa-vacia",
    "mago_vaelithor", "wooden_resistor", "wooden_tray",
    "cube_2000", "cube_3m", "cube_10_3", "cube_10_6", "disc_kohm", "disc_mohm",
    "cuenco", "proton", "electron", "nin", "varita", "plus", "minus", "linterna", "silk",
    "abaco", "piramide", "cups", "potato", "potato_new", "silk-kilo", "silk-mili",
    "car", "car_new", "connect4", "rainbow", "bowl-dark", "bowl-med", "bowl-small",
    "marble", "shoe", "shoe_new", "hourglass", "bills", "bill-1", "bill-10", "bill-5",
    "scale", "register", "triangle", "mousetrap", "passport", "glasses", "hat-bow",
    "kapla-stack", "kapla", "mouse", "hippo", "caterpillar", "gear", "house",
    "camera", "top", "yarn"
  ];

  ALL_SPRITE_KEYS.forEach((key) => {
    const im = new Image();
    im.crossOrigin = null;
    const wrap = { elt: im, width: 0, height: 0, loaded: false };
    im.onload = () => {
      wrap.width = im.naturalWidth || im.width || 120;
      wrap.height = im.naturalHeight || im.height || 120;
      wrap.loaded = true;
    };
    im.src = getAssetSrc(key);
    if (im.complete && im.naturalWidth > 0) {
      wrap.width = im.naturalWidth;
      wrap.height = im.naturalHeight;
      wrap.loaded = true;
    }
    imgs[key] = wrap;
  });

  function drawLoadedImage(p, wrap, x, y, w, h) {
    if (!wrap || !wrap.loaded || !wrap.width) return false;
    const targetH = h != null ? h : (w * (wrap.height / wrap.width));
    p.drawingContext.drawImage(wrap.elt, x - w / 2, y - targetH / 2, w, targetH);
    return true;
  }

  // Síntesis de audio con Web Audio API
  let audioCtx = null;
  function playWoodClick() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.065);
      gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.065);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.065);
    } catch (e) {}
  }

  function playMagicChime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.42);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.08);
        osc.stop(audioCtx.currentTime + i * 0.08 + 0.42);
      });
    } catch (e) {}
  }

  function floors() { return global.MAGIA_FLOORS || []; }
  function vaelithorTuts() { return global.MAGIA_VAELITHOR_TUTS || []; }
  function floor() { return floors()[floorIdx] || floors()[0]; }
  function tut() {
    if (isVaelithorMode) return vaelithorTuts()[vaelithorIdx] || vaelithorTuts()[0];
    const f = floor();
    return (f && f.tuts[tutIdx]) || null;
  }
  function nPlay() { const t = tut(); return t ? (t.say || []).length : 0; }
  function isQuiz() { return phase >= nPlay(); }

  function saveDone(id) {
    done.add(id);
    try { localStorage.setItem("ea-magia-done", JSON.stringify([...done])); } catch (e) {}
  }
  function stars(f) {
    return (f.tuts || []).reduce((n, t) => n + (done.has(t.id) ? 1 : 0), 0);
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function host() { return document.getElementById("mg-view"); }

  function applyDeepLink() {
    try {
      const q = new URLSearchParams(location.search).get("mg");
      if (!q) return false;
      if (q === "vaelithor" || q === "v") {
        isVaelithorMode = true;
        vaelithorIdx = 0;
        phase = 0;
        view = "play";
        return true;
      }
      const m = String(q).match(/^(\d+)(?:\.(\d+))?$/);
      if (!m) return false;
      const n = +m[1];
      const fi = floors().findIndex((f) => f.n === n);
      if (fi < 0) return false;
      isVaelithorMode = false;
      floorIdx = fi;
      if (m[2]) {
        const ti = +m[2] - 1;
        if (ti >= 0 && ti < floors()[fi].tuts.length) {
          tutIdx = ti;
          phase = 0;
          view = "play";
          return true;
        }
      }
      view = "floor";
      return true;
    } catch (e) {
      return false;
    }
  }

  function boot() {
    if (!host()) return;
    applyDeepLink();
    render();
  }

  function show() {
    const linked = applyDeepLink();
    if (linked) {
      render();
      return;
    }
    if (view === "play") {
      if (!host() || !host().querySelector("#mg-canvas")) render();
      else ensureSketch();
    } else render();
  }

  function hide() {
    if (sketch) {
      try { sketch.noLoop(); } catch (e) {}
    }
  }

  function destroySketch() {
    if (sketch) {
      try { sketch.remove(); } catch (e) {}
      sketch = null;
    }
    world = null;
    dragging = null;
  }

  function render() {
    destroySketch();
    const el = host();
    if (!el) return;
    const panel = document.getElementById("panel-magia");
    if (panel) panel.classList.toggle("mg-playing", view === "play");
    if (view === "hub") el.innerHTML = htmlHub();
    else if (view === "floor") el.innerHTML = htmlFloor();
    else if (view === "play") el.innerHTML = htmlPlay();
    else if (view === "kit") el.innerHTML = htmlKit();
    bind();
    if (view === "play") ensureSketch();
  }

  function htmlHub() {
    const cards = floors().map((f, i) => {
      const s = stars(f);
      const star = "★".repeat(s) + "☆".repeat(Math.max(0, 4 - s));
      return `<button type="button" class="mg-floor" data-floor="${i}">
        <img src="${A}/floors/f${String(f.n).padStart(2, "0")}.jpg" alt="${esc(f.title)}">
        <div class="body">
          <div class="n">${f.roman} · ${f.n}.0</div>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.concept)}</p>
          <div class="mg-stars" aria-label="${s} de 4">${star}</div>
        </div>
      </button>`;
    }).join("");

    const vDone = vaelithorTuts().filter((t) => done.has(t.id)).length;
    const vStars = "★".repeat(vDone) + "☆".repeat(Math.max(0, 3 - vDone));

    return `
      <div class="mg-toolbar" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button type="button" class="mg-btn gold" data-go="kit">Inventario de inversión</button>
        <button type="button" class="mg-btn sage" id="mg-open-vaelithor">★ Taller de Resistores de Vaelithor (2 kΩ y 3 MΩ) · ${vStars}</button>
        <span class="mg-hint">Se empieza en el 1.0. Se sube de piso cuando el de abajo ya se ha tocado.</span>
      </div>
      <div class="mg-grid">${cards}</div>
      <div class="mg-sat">
        <h3>Cómo se usa un sábado</h3>
        <p class="mg-lede">Lees juntos el cuento de esa pestaña. Eliges un tutorial de los cuatro, no los cuatro. Cuarenta minutos, no una olimpiada. Dejas los juguetes a la vista al día siguiente. La pregunta del cierre se hace de verdad. Si la respuesta sale al revés, se vuelve a jugar cambiando una sola cosa.</p>
      </div>
      <div class="mg-note"><strong>Se juega en equipo.</strong> Las canicas, los imanes, Mouse Trap y los ovillos de lana se vigilan. Este taller no sustituye las visitas: aquí el mismo taller se toca.</div>
    `;
  }

  function htmlFloor() {
    const f = floor();
    const tuts = f.tuts.map((t, i) => {
      const mark = done.has(t.id) ? " ★" : "";
      const nn = String(f.n).padStart(2, "0");
      return `<button type="button" class="mg-tut" data-tut="${i}">
        <img src="${A}/mesas/f${nn}-t${i + 1}.jpg" alt="${esc(t.title)}">
        <div class="body">
          <div class="n">Tutorial ${i + 1} (${t.id})${mark}</div>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.pov)}</p>
        </div>
      </button>`;
    }).join("");
    return `
      <div class="mg-toolbar" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <button type="button" class="mg-btn ghost" data-go="hub">← Catorce pisos</button>
        ${f.n === 1 ? `<button type="button" class="mg-btn gold" id="mg-open-vaelithor">★ Taller Especial: Resistores 2.000 Ω y 3.000.000 Ω</button>` : ""}
      </div>
      <div class="mg-concept">
        <div class="mg-kicker">${f.roman} · pestaña ${f.n}.0</div>
        <h3 style="margin:4px 0 6px">${esc(f.title)}</h3>
        <p>${esc(f.concept)}</p>
      </div>
      <div class="mg-tuts">${tuts}</div>
    `;
  }

  function htmlPlay() {
    const f = floor();
    const t = tut();
    if (isVaelithorMode) {
      return `
        <div class="mg-toolbar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="mg-btn ghost" data-go="hub">← Catorce pisos</button>
            <button type="button" class="mg-btn ${vaelithorIdx === 0 ? "gold" : "ghost"}" data-vtut="0">1. Resistor 2.000 Ω</button>
            <button type="button" class="mg-btn ${vaelithorIdx === 1 ? "gold" : "ghost"}" data-vtut="1">2. Resistor 3.000.000 Ω</button>
            <button type="button" class="mg-btn ${vaelithorIdx === 2 ? "gold" : "ghost"}" data-vtut="2">3. Taller Doble Encastre</button>
          </div>
          <span class="mg-kicker" id="mg-phase-label">1 / ${nPlay() + 1}</span>
        </div>
        <div class="mg-kicker">TALLER VAELITHOR · ${t.id} · ${esc(t.title)}</div>
        <p class="mg-lede" style="margin:4px 0 8px">Punto de vista: ${esc(t.pov)}</p>
        <div class="mg-say" id="mg-say"></div>
        <div class="mg-stage">
          <div id="mg-canvas"></div>
          <div class="mg-qbox" id="mg-qbox">
            <h2>Vaelithor pregunta</h2>
            <p id="mg-qtext"></p>
            <div class="mg-opts" id="mg-opts"></div>
            <div class="mg-fb" id="mg-fb"></div>
          </div>
        </div>
        <div class="mg-dock">
          <button type="button" class="mg-btn ghost" id="mg-prev">Atrás</button>
          <button type="button" class="mg-btn" id="mg-next">Siguiente rincón</button>
          <button type="button" class="mg-btn sage" id="mg-reset">Volver a poner</button>
          <button type="button" class="mg-btn gold" id="mg-mesa">Mesa de verdad</button>
          <span class="mg-hint" id="mg-hint"></span>
        </div>
        <div class="mg-photo" id="mg-photo" hidden>
          <img src="${getAssetSrc("wooden_blocks")}" alt="Mesa de bloques de madera de Vaelithor">
          <p class="mg-lede" style="padding:8px 12px">${esc(t.toys)}. ${esc(t.why)}</p>
        </div>
      `;
    }

    const nn = String(f.n).padStart(2, "0");
    const tutTabs = f.tuts.map((item, idx) =>
      `<button type="button" class="mg-btn ${idx === tutIdx ? "gold" : "ghost"}" data-switch-tut="${idx}" style="padding:5px 10px; font-size:12px;">${item.id}</button>`
    ).join("");

    return `
      <div class="mg-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button type="button" class="mg-btn ghost" data-go="floor">← ${esc(f.title)}</button>
          ${tutTabs}
        </div>
        <span class="mg-kicker" id="mg-phase-label">1 / ${nPlay() + 1}</span>
      </div>
      <div class="mg-kicker">${f.roman} · ${t.id} · ${esc(t.title)}</div>
      <p class="mg-lede" style="margin:4px 0 8px">Punto de vista: ${esc(t.pov)}</p>
      <div class="mg-say" id="mg-say"></div>
      <div class="mg-stage">
        <div id="mg-canvas"></div>
        <div class="mg-qbox" id="mg-qbox">
          <h2>Vaelithor pregunta</h2>
          <p id="mg-qtext"></p>
          <div class="mg-opts" id="mg-opts"></div>
          <div class="mg-fb" id="mg-fb"></div>
        </div>
      </div>
      <div class="mg-dock">
        <button type="button" class="mg-btn ghost" id="mg-prev">Atrás</button>
        <button type="button" class="mg-btn" id="mg-next">Siguiente rincón</button>
        <button type="button" class="mg-btn sage" id="mg-reset">Volver a poner</button>
        <button type="button" class="mg-btn gold" id="mg-mesa">Mesa de verdad</button>
        <span class="mg-hint" id="mg-hint"></span>
      </div>
      <div class="mg-photo" id="mg-photo" hidden>
        <img src="${A}/mesas/f${nn}-t${tutIdx + 1}.jpg" alt="Mesa de juguetes de este tutorial">
        <p class="mg-lede" style="padding:8px 12px">${esc(t.toys)}. ${esc(t.why)}</p>
      </div>
    `;
  }

  function htmlKit() {
    return `
      <div class="mg-toolbar">
        <button type="button" class="mg-btn ghost" data-go="hub">← Catorce pisos</button>
      </div>
      <div class="mg-kit">
        <h3>Inventario de inversión · el kit que se hereda</h3>
        <p class="mg-lede">Compra esto primero. Se usa en casi todos los pisos. El resto se añade cuando toque. No hace falta tenerlo todo el primer día.</p>
        <ul>
          <li>Fisher-Price Measure Up Cups · ábaco Hape · Mouse Trap · Play-Doh Fun Factory</li>
          <li>Canicas Grapat y Grimm’s · circuito de haya HABA, Hape o nic</li>
          <li>Tres ratones Maileg · Connect 4 · Kapla 200 · una casa de madera</li>
          <li>Sarah’s Silks · relojes de arena HABA · Monopoly Junior · Luggy Olli Ella</li>
          <li>Waytoplay · Hot Wheels Track Builder · Connetix · Potato Head</li>
          <li>TickiT varitas · ovillos de lana · arcoíris Grimm’s · PlanToys balanza, alcancía, caja y cámara</li>
        </ul>
        <p class="mg-lede" style="margin-top:10px">Para los tres primeros pisos: vasos, ábaco, Mouse Trap, Play-Doh y canicas. Luego una casa y Kapla. Luego un circuito serio. Con eso ya se puede subir.</p>
        <div class="mg-chips">
          <span class="mg-chip">peldaño</span><span class="mg-chip">disfraz</span><span class="mg-chip">pasaporte</span>
          <span class="mg-chip">casita</span><span class="mg-chip">tobogán</span><span class="mg-chip">pasillo pegajoso</span>
          <span class="mg-chip">empujón</span><span class="mg-chip">desfile</span><span class="mg-chip">cansancio</span>
          <span class="mg-chip">tesoro</span><span class="mg-chip">canicas</span><span class="mg-chip">cubo</span>
          <span class="mg-chip">ovillo</span><span class="mg-chip">columpio</span><span class="mg-chip">foto</span>
        </div>
      </div>
    `;
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function bind() {
    const el = host();
    if (!el) return;
    el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      const target = b.dataset.go;
      if (target === "hub") isVaelithorMode = false;
      view = target;
      render();
    }));
    el.querySelectorAll("[data-floor]").forEach((b) => b.addEventListener("click", () => {
      isVaelithorMode = false;
      floorIdx = +b.dataset.floor;
      view = "floor";
      render();
    }));
    el.querySelectorAll("[data-tut]").forEach((b) => b.addEventListener("click", () => {
      isVaelithorMode = false;
      tutIdx = +b.dataset.tut;
      phase = 0;
      view = "play";
      render();
    }));
    el.querySelectorAll("[data-switch-tut]").forEach((b) => b.addEventListener("click", () => {
      isVaelithorMode = false;
      tutIdx = +b.dataset.switchTut;
      phase = 0;
      render();
    }));
    el.querySelectorAll("[data-vtut]").forEach((b) => b.addEventListener("click", () => {
      isVaelithorMode = true;
      vaelithorIdx = +b.dataset.vtut;
      phase = 0;
      render();
    }));
    const openV = $("#mg-open-vaelithor", el);
    if (openV) openV.addEventListener("click", () => {
      isVaelithorMode = true;
      vaelithorIdx = 0;
      phase = 0;
      view = "play";
      render();
    });
    const prev = $("#mg-prev", el);
    const next = $("#mg-next", el);
    const reset = $("#mg-reset", el);
    const mesa = $("#mg-mesa", el);
    if (prev) prev.addEventListener("click", () => shiftPhase(-1));
    if (next) next.addEventListener("click", () => {
      if (isQuiz()) { phase = 0; setupPhase(); syncChrome(); }
      else shiftPhase(1);
    });
    if (reset) reset.addEventListener("click", () => { setupPhase(); syncChrome(); });
    if (mesa) mesa.addEventListener("click", () => {
      showTable = !showTable;
      const ph = $("#mg-photo", el);
      if (ph) ph.hidden = !showTable;
    });
  }

  function shiftPhase(d) {
    const max = nPlay();
    phase = Math.max(0, Math.min(max, phase + d));
    setupPhase();
    syncChrome();
  }

  function syncChrome() {
    const t = tut();
    if (!t) return;
    const max = nPlay();
    const say = $("#mg-say");
    const hint = $("#mg-hint");
    const lab = $("#mg-phase-label");
    const qbox = $("#mg-qbox");
    const prev = $("#mg-prev");
    const next = $("#mg-next");
    if (lab) lab.textContent = `${phase + 1} / ${max + 1}`;
    if (prev) prev.disabled = phase === 0;
    if (next) next.textContent = isQuiz() ? "Otra vez" : "Siguiente rincón";
    if (isQuiz()) {
      if (say) say.textContent = "Vaelithor pregunta. Elige con las manos, no con un discurso.";
      if (hint) hint.textContent = "La pregunta del cierre se hace de verdad.";
      if (qbox) {
        qbox.style.display = "block";
        $("#mg-qtext").textContent = t.q.text;
        $("#mg-fb").textContent = "";
        $("#mg-opts").innerHTML = t.q.opts.map((o, i) =>
          `<button type="button" class="mg-btn ${i === 0 ? "" : "ghost"}" data-opt="${i}">${esc(o)}</button>`
        ).join("");
        $("#mg-opts").querySelectorAll("[data-opt]").forEach((b) => {
          b.addEventListener("click", () => answer(+b.dataset.opt));
        });
      }
    } else {
      if (qbox) qbox.style.display = "none";
      if (say) say.textContent = t.say[phase] || "";
      if (hint) hint.textContent = (t.hint && t.hint[phase]) || t.toys;
    }
  }

  function answer(i) {
    const t = tut();
    const fb = $("#mg-fb");
    if (!fb || !t) return;
    if (i === t.q.ok) {
      playMagicChime();
      fb.textContent = t.q.good;
      fb.style.color = "#5e7a5e";
      saveDone(t.id);
    } else {
      playWoodClick();
      fb.textContent = t.q.bad;
      fb.style.color = "#c46a4a";
    }
  }

  function ensureSketch() {
    const holder = document.getElementById("mg-canvas");
    if (!holder) return;
    if (typeof p5 !== "function") {
      holder.innerHTML = "<p class='mg-lede' style='padding:24px;color:#fff'>No se pudo cargar p5.js.</p>";
      syncChrome();
      return;
    }
    if (sketch && holder.querySelector("canvas")) {
      sketch.loop();
      return;
    }
    if (sketch) {
      try { sketch.remove(); } catch (e) {}
      sketch = null;
    }
    sketch = new p5((p) => {
      // Sin preload() bloqueante: el lienzo inicia en el acto y usa imgs cargadas por HTMLImageElement
      p.setup = () => {
        p.createCanvas(W, H).parent(holder);
        p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
        p.imageMode(p.CENTER);
        p.textFont("Georgia");
        setupPhase();
        syncChrome();
      };
      p.draw = () => {
        if (!world) return;
        drawWorld(p);
        updateWorld(p);
      };
      p.mousePressed = () => onPress(p);
      p.mouseDragged = () => onDrag(p);
      p.mouseReleased = () => onRelease(p);
      p.touchStarted = () => { onPress(p); return false; };
      p.touchMoved = () => { onDrag(p); return false; };
      p.touchEnded = () => { onRelease(p); return false; };
    }, holder);
  }

  function piece(kind, x, y, extra) {
    const sizes = {
      proton: 52, electron: 52, nin: 74, cuenco: 200, plus: 100, minus: 100,
      linterna: 120, silk: 110, varita: 130, marble: 34, bowl: 92, cup: 70,
      mouse: 64, car: 88, coin: 48, kapla: 18, tile: 46, lamp: 36, yarn: 70,
      hat: 44, potato: 110, ice: 28, stick: 14, hippo: 80, card: 44, plate: 90,
      camera: 50, top: 44, churro: 20, bead: 16, paper: 70, shoe: 70, house: 80,
      block: 28, gear: 50, caterpillar: 90, robot: 80, pendulum: 22, arrow: 80,
      abaco: 210, piramide: 150, cups: 110, rainbow: 140, connect4: 130,
      mousetrap: 160, triangle: 120, hourglass: 70, register: 90, scale: 100,
      passport: 70, bills: 110
    };
    return Object.assign({
      kind, x, y, origX: x, origY: y, vx: 0, vy: 0,
      r: sizes[kind] || 32,
      q: 0, label: "", color: WOOD, static: false, grabbed: false, inBowl: false,
      inTarget: null,
      restRot: 0,
      tilt: 0
    }, extra || {});
  }

  function recalcTargets() {
    if (!world) return;
    world.targets.forEach((tg) => {
      if (world.kind === "powers_of_ten") return;
      const inCount = world.pieces.filter((p) => p.inTarget === tg).length;
      tg.held = inCount + (tg.pourCount || 0);
    });
  }

  function setupPhase() {
    dragging = null;
    sparks = [];
    const t = tut();
    if (!t) return;
    world = {
      kind: t.kind, variant: t.variant || "",
      pieces: [], targets: [], paths: [], meters: [], labels: [],
      sliders: [], flags: {}, t: 0, flow: 1, heat: 0, height: 1, load: 4,
      useMesa: false, completed: false
    };
    if (isQuiz()) return;
    const k = KINDS[t.kind] || KINDS.table;
    k.setup(world, phase, t);
  }

  function drawWorld(p) {
    if (!world) return;
    if (world.kind === "powers_of_ten") {
      KINDS.powers_of_ten.draw(p, world);
      return;
    }
    drawTable(p);
    const k0 = KINDS[world.kind];
    if (k0 && k0.bg) k0.bg(p, world);
    world.paths.forEach((path) => drawPath(p, path));
    world.targets.forEach((tg) => drawTarget(p, tg));
    const order = [...world.pieces].sort((a, b) => zOf(a) - zOf(b));
    order.forEach((pc) => drawPiece(p, pc));
    world.labels.forEach((lb) => drawLabel(p, lb));
    world.meters.forEach((m, i) => drawMeter(p, m, i));
    world.sliders.forEach((s) => drawSlider(p, s));
    const k = KINDS[world.kind];
    if (k && k.draw) k.draw(p, world);
    drawSparks(p);
  }

  function updateWorld(p) {
    if (!world || isQuiz()) return;
    world.t++;
    if (world.kind === "powers_of_ten") return;
    world.pieces.forEach((pc) => {
      if (pc.grabbed || pc.static) return;
      if (pc.orbitR) {
        pc.orbit = (pc.orbit || 0) + (pc.orbitSp || 0.03);
        pc.x += ((pc.cx + Math.cos(pc.orbit) * pc.orbitR) - pc.x) * 0.12;
        pc.y += ((pc.cy + Math.sin(pc.orbit) * pc.orbitR * 0.7) - pc.y) * 0.12;
      }
      if (pc.roll && world.paths[pc.path]) {
        const path = world.paths[pc.path];
        if (path.open === false) {
          pc.roll = 0;
          return;
        }
        const maxS = path.stopAt != null ? path.stopAt : 1;
        pc.s = (pc.s || 0) + pc.roll * (path.speed || 0.01) * (world.flow || 1);
        if (pc.s >= maxS) {
          if (path.loop && maxS >= 1) pc.s = 0;
          else {
            pc.s = maxS;
            pc.roll = 0;
            if (maxS >= 1) world.flags.arrived = (world.flags.arrived || 0) + 1;
          }
        }
        const pt = along(path.pts, pc.s);
        pc.x = pt.x; pc.y = pt.y;
      }
    });
    const k = KINDS[world.kind];
    if (k && k.update) k.update(p, world);
  }

  function zOf(pc) {
    if (pc.grabbed) return 10;
    if (pc.kind === "cuenco" || pc.kind === "bowl" || pc.kind === "house" || pc.kind === "mousetrap") return 0;
    if (pc.kind === "silk" || pc.kind === "abaco" || pc.kind === "connect4" || pc.kind === "tile") return 1;
    if (pc.kind === "hat" && pc.worn) return 5;
    return 2;
  }

  function drawTable(p) {
    if (world && world.useMesa && imgs["mesa-vacia"] && imgs["mesa-vacia"].loaded) {
      drawLoadedImage(p, imgs["mesa-vacia"], W / 2, H / 2, W, H);
      p.drawingContext.save();
      const g = p.drawingContext.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 740);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(40,24,10,0.18)");
      p.drawingContext.fillStyle = g;
      p.drawingContext.fillRect(0, 0, W, H);
      p.drawingContext.restore();
      return;
    }
    p.background(243, 234, 216);
    p.noStroke();
    p.fill(232, 215, 184);
    p.ellipse(W / 2, H / 2 + 18, 1180, 640);
    p.fill(210, 186, 148);
    p.ellipse(W / 2, H / 2 + 18, 1140, 610);
    for (let i = 0; i < 14; i++) {
      p.stroke(200, 174, 132, 50);
      p.strokeWeight(2);
      p.line(120 + i * 80, 80, 80 + i * 82, 660);
    }
    p.drawingContext.save();
    const g = p.drawingContext.createRadialGradient(W / 2, H / 2, 180, W / 2, H / 2, 720);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(40,24,10,0.22)");
    p.drawingContext.fillStyle = g;
    p.drawingContext.fillRect(0, 0, W, H);
    p.drawingContext.restore();
  }

  function drawPath(p, path) {
    p.push();
    p.noFill();
    p.stroke(path.color || "#8b6914");
    p.strokeWeight(path.w || 16);
    p.strokeJoin(p.ROUND);
    p.beginShape();
    path.pts.forEach((pt) => p.vertex(pt.x, pt.y));
    p.endShape();
    if (path.open === false) {
      p.stroke("#c46a4a");
      p.strokeWeight(6);
      const mid = along(path.pts, 0.5);
      p.line(mid.x - 18, mid.y - 18, mid.x + 18, mid.y + 18);
      p.line(mid.x - 18, mid.y + 18, mid.x + 18, mid.y - 18);
    }
    p.pop();
  }

  function drawTarget(p, tg) {
    p.push();
    p.noFill();
    p.stroke(tg.color || "rgba(94,122,94,0.75)");
    p.strokeWeight(2.5);
    p.drawingContext.setLineDash([6, 6]);
    p.circle(tg.x, tg.y, (tg.r || 50) * 2);
    p.drawingContext.setLineDash([]);
    if (tg.held) {
      p.noStroke();
      p.fill(255, 230, 120, 55);
      p.circle(tg.x, tg.y, (tg.r || 50) * 1.85);
    }
    if (tg.label) drawLabel(p, { x: tg.x, y: tg.y + (tg.r || 50) + 18, text: tg.label + (tg.held ? ` (${tg.held})` : "") });
    p.pop();
  }

  function drawLabel(p, lb) {
    if (!lb || !lb.text) return;
    p.push();
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(255, 250, 243, 228);
    const w = Math.min(480, Math.max(80, 22 + (lb.text || "").length * 7.6));
    p.rect(lb.x, lb.y, w, 28, 8);
    p.fill(lb.color || INK);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text(lb.text, lb.x, lb.y);
    p.pop();
  }

  function drawMeter(p, m, i) {
    p.push();
    const x = W - 300, y = 28 + i * 58, w = 260, h = 48;
    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(255, 250, 243, 235);
    p.rect(x, y, w, h, 12);
    p.fill("#6b5a4d");
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    const valStr = typeof m.value === "number" ? " · " + (Math.round(m.value * 100) / 100) : "";
    p.text(m.label + valStr, x + 12, y + 6);
    p.fill("#e4d3bc");
    p.rect(x + 12, y + 26, w - 24, 12, 8);
    p.fill(m.color || "#c46a4a");
    const v = Math.max(0, Math.min(1, (m.value || 0) / (m.max || 1)));
    p.rect(x + 12, y + 26, (w - 24) * v, 12, 8);
    p.pop();
  }

  function drawSlider(p, s) {
    p.push();
    p.stroke("#8b6914");
    p.strokeWeight(6);
    p.line(s.x, s.y, s.x + s.w, s.y);
    const kx = s.x + (s.v - s.min) / (s.max - s.min) * s.w;
    p.noStroke();
    p.fill("#c46a4a");
    p.circle(kx, s.y, 22);
    p.fill(INK);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text(s.label + ": " + (Math.round(s.v * 100) / 100), s.x + s.w / 2, s.y - 12);
    p.pop();
  }

  function imgOf(pc) {
    if (pc.noSprite) return null;
    if (pc.sprite && imgs[pc.sprite] && imgs[pc.sprite].loaded) return imgs[pc.sprite];
    const map = {
      proton: "proton", electron: "electron", nin: "nin", cuenco: "cuenco",
      plus: "plus", minus: "minus", linterna: "linterna", varita: "varita",
      abaco: "abaco", piramide: "piramide", potato: "potato", car: "car",
      shoe: "shoe", hourglass: "hourglass", rainbow: "rainbow",
      connect4: "connect4", mousetrap: "mousetrap", triangle: "triangle",
      register: "register", scale: "scale", passport: "passport", bills: "bills",
      marble: "marble", cups: "cups",
      mouse: "mouse", hippo: "hippo", caterpillar: "caterpillar", gear: "gear",
      house: "house", camera: "camera", top: "top", yarn: "yarn"
    };
    if (pc.kind === "silk") {
      if (pc.sprite && imgs[pc.sprite] && imgs[pc.sprite].loaded) return imgs[pc.sprite];
      return imgs.silk && imgs.silk.loaded ? imgs.silk : null;
    }
    if (pc.kind === "bowl") return (pc.sprite && imgs[pc.sprite] && imgs[pc.sprite].loaded) ? imgs[pc.sprite] : (imgs.cuenco && imgs.cuenco.loaded ? imgs.cuenco : null);
    if (pc.kind === "coin") return (pc.sprite && imgs[pc.sprite] && imgs[pc.sprite].loaded) ? imgs[pc.sprite] : (imgs["bill-1"] && imgs["bill-1"].loaded ? imgs["bill-1"] : null);
    if (pc.kind === "hat") return (pc.sprite && imgs[pc.sprite] && imgs[pc.sprite].loaded) ? imgs[pc.sprite] : (imgs["hat-bow"] && imgs["hat-bow"].loaded ? imgs["hat-bow"] : null);
    if (pc.kind === "cup") return imgs.cups && imgs.cups.loaded ? imgs.cups : null;
    // Para marble o yarn o mouse con colores diferenciados, si no tienen sprite explícito y tienen tint/color especial:
    const k = map[pc.kind];
    return k && imgs[k] && imgs[k].loaded ? imgs[k] : null;
  }

  function drawPiece(p, pc) {
    // Caso especial para péndulo con pivote fijo en el techo (pc.px, pc.py)
    if (pc.kind === "pendulum" && pc.px != null && pc.py != null) {
      p.push();
      p.stroke("#8b6914");
      p.strokeWeight(4);
      p.line(pc.px, pc.py, pc.x, pc.y);
      p.fill("#5c3a21");
      p.noStroke();
      p.circle(pc.px, pc.py, 12);
      p.pop();
    }

    p.push();
    p.translate(pc.x, pc.y);
    p.rotate((pc.restRot || 0) + (pc.tilt || 0));
    p.drawingContext.shadowColor = "rgba(40,24,10,0.32)";
    p.drawingContext.shadowBlur = pc.grabbed ? 22 : 12;
    p.drawingContext.shadowOffsetY = pc.grabbed ? 10 : 5;

    const img = imgOf(pc);
    const useVectorForCustomDims = (pc.kind === "kapla" && (pc.w || pc.h)) || pc.kind === "churro" || pc.kind === "tile" || pc.kind === "pendulum" || pc.kind === "arrow";
    if (img && img.width && !useVectorForCustomDims) {
      const h = pc.r * 2 * (img.height / img.width);
      drawLoadedImage(p, img, 0, 0, pc.r * 2, h);
      // Si es un ratón o canica con color distintivo, dibuja un collar/halo sutil de su color
      if ((pc.kind === "mouse" || pc.kind === "yarn") && pc.color) {
        p.noFill();
        p.stroke(pc.color);
        p.strokeWeight(4);
        p.circle(0, 0, pc.r * 1.9);
      }
    } else {
      drawToy(p, pc);
    }

    p.drawingContext.shadowBlur = 0;
    p.drawingContext.shadowOffsetY = 0;

    // Indicador de incógnita o pieza tapada (Prompt 1.3 / 4.1)
    if (pc.empty || pc.covered) {
      p.fill(255, 248, 225, 235);
      p.stroke("#c46a4a");
      p.strokeWeight(3);
      p.circle(0, 0, Math.max(54, pc.r * 1.3));
      p.noStroke();
      p.fill("#c46a4a");
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(24);
      p.text("¿?", 0, 1);
      p.textStyle(p.NORMAL);
    }

    if (pc.q) {
      p.noStroke();
      p.fill(pc.q > 0 ? "#c46a4a" : "#6a8eae");
      p.circle(pc.r * 0.55, -pc.r * 0.55, 18);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(pc.q > 0 ? "+" : "−", pc.r * 0.55, -pc.r * 0.55);
    }

    if (pc.caption) {
      p.rectMode(p.CENTER);
      p.noStroke();
      p.fill(255, 250, 243, 215);
      const cw = Math.max(48, pc.caption.length * 7.2 + 14);
      p.rect(0, pc.r + 14, cw, 20, 6);
      p.fill(INK);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11.5);
      p.text(pc.caption, 0, pc.r + 14);
    }
    p.pop();
  }

  function drawToy(p, pc) {
    p.noStroke();
    switch (pc.kind) {
      case "marble":
        p.fill(pc.color || "#5c3a21");
        p.circle(0, 0, pc.r * 2);
        p.fill(255, 230, 200, 90);
        p.circle(-pc.r * 0.28, -pc.r * 0.28, pc.r * 0.7);
        break;
      case "bowl":
        p.fill(pc.color || "#8b5a2b");
        p.ellipse(0, 8, pc.r * 2, pc.r * 1.15);
        p.fill("#6e4420");
        p.ellipse(0, 4, pc.r * 1.55, pc.r * 0.7);
        break;
      case "cup":
      case "cups":
        p.fill(pc.color || RAIN[(pc.n || 0) % RAIN.length]);
        p.rectMode(p.CENTER);
        p.rect(0, 0, pc.r * 1.3, pc.r * 1.6, 8);
        p.fill(255, 255, 255, 40);
        p.rect(0, -4, pc.r * 0.9, pc.r * 0.9, 6);
        p.fill(INK);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(String(pc.n || ""), 0, 0);
        break;
      case "nin":
        p.fill("#e8c9a0");
        p.ellipse(0, 10, 28, 46);
        p.circle(0, -18, 28);
        p.fill(pc.color || "#c46a4a");
        p.circle(0, -18, 10);
        break;
      case "mouse":
        p.fill(pc.color || "#d8c2a4");
        p.ellipse(0, 6, 46, 34);
        p.circle(-16, -10, 16);
        p.circle(16, -10, 16);
        p.fill(INK);
        p.circle(-8, 2, 4);
        p.circle(8, 2, 4);
        break;
      case "car":
        p.fill(pc.color || "#c0392b");
        p.rectMode(p.CENTER);
        p.rect(0, -4, 56, 22, 6);
        p.fill("#222");
        p.circle(-16, 12, 14);
        p.circle(16, 12, 14);
        break;
      case "coin":
        p.fill(pc.color || "#d4a017");
        p.circle(0, 0, pc.r * 2);
        p.fill("#2b220f");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(pc.n || "1", 0, 0);
        break;
      case "kapla":
        p.fill(pc.color || "#e6d2a2");
        p.stroke("#b59862");
        p.strokeWeight(1.5);
        p.rectMode(p.CENTER);
        p.rect(0, 0, pc.w || 70, pc.h || 14, 3);
        break;
      case "tile":
        p.fill(pc.color || "#6a8eae");
        p.rectMode(p.CENTER);
        p.rect(0, 0, pc.r * 2, pc.r * 2, 8);
        p.stroke(255, 190);
        p.strokeWeight(2);
        p.noFill();
        p.rect(0, 0, pc.r * 1.5, pc.r * 1.5, 5);
        if (pc.n != null && world && (world.kind === "awg" || world.kind === "nest")) {
          p.noStroke();
          p.fill(INK);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(11);
          p.text("#" + pc.n, 0, -pc.r + 4);
        }
        break;
      case "lamp":
        if (pc.on) {
          p.fill(245, 197, 24, 90);
          p.circle(0, -8, 58);
        }
        p.fill(pc.on ? "#f5c518" : "#bbb");
        p.circle(0, -8, 30);
        p.fill("#8b6914");
        p.rectMode(p.CENTER);
        p.rect(0, 12, 16, 16, 3);
        break;
      case "yarn":
        p.fill(pc.color || "#c46a4a");
        p.circle(0, 0, pc.r * 2);
        p.noFill();
        p.stroke(255, 200);
        p.strokeWeight(2);
        p.arc(-4, -4, pc.r, pc.r, 0, p.PI);
        p.arc(6, 4, pc.r * 0.8, pc.r * 0.8, 0, p.PI);
        break;
      case "hat":
        p.fill(pc.color || "#3a2f27");
        p.ellipse(0, 6, 44, 12);
        p.rectMode(p.CENTER);
        p.rect(0, -6, 26, 22, 4);
        break;
      case "potato":
        p.fill("#c9844a");
        p.ellipse(0, 0, 74, 90);
        p.fill("#3a2f27");
        p.circle(-12, -8, 8);
        p.circle(12, -8, 8);
        p.fill("#6a2");
        p.ellipse(0, 14, 18, 8);
        break;
      case "ice":
        p.fill(180, 225, 240, 215);
        p.stroke(110, 160, 185);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 28, 28, 5);
        break;
      case "stick":
        p.stroke(pc.pulled ? "#c46a4a" : "#8b5a2b");
        p.strokeWeight(7);
        p.line(-38, 0, 38, 0);
        break;
      case "hippo":
        p.fill(pc.color || "#c46a4a");
        p.ellipse(0, 8, 70, 44);
        p.ellipse(18, -8, 36, 28);
        p.fill("#222");
        p.circle(24, -12, 6);
        break;
      case "card":
        p.fill(pc.color || "#e23d28");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 42, 58, 5);
        p.fill("#fff");
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.textSize(15);
        p.text(pc.n != null ? String(pc.n) : "", 0, 0);
        p.textStyle(p.NORMAL);
        break;
      case "plate":
        p.fill(pc.color || "#c46a4a");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 20, 120, 5);
        break;
      case "camera":
        p.fill("#3a2f27");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 54, 36, 6);
        p.fill("#6a8eae");
        p.circle(6, 0, 22);
        break;
      case "top":
        p.fill(RAIN[2]);
        p.ellipse(0, 6, 40, 16);
        p.fill(RAIN[5]);
        p.triangle(0, -22, -10, 4, 10, 4);
        break;
      case "churro":
        p.stroke(pc.color || "#c9844a");
        p.strokeWeight(pc.thick || 14);
        p.strokeCap(p.ROUND);
        p.line(-(pc.len || 160) / 2, 0, (pc.len || 160) / 2, 0);
        break;
      case "bead":
        p.fill(pc.color || RAIN[0]);
        p.circle(0, 0, 16);
        break;
      case "paper":
        p.fill(pc.empty ? "#f3ead8" : "#fffaf3");
        p.stroke("#c4a574");
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 96, 72, 8);
        p.noStroke();
        p.fill(INK);
        p.textSize(13);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(pc.empty ? "¿?" : (pc.caption || ""), 0, 0);
        break;
      case "shoe":
        p.fill("#5c3a21");
        p.ellipse(4, 6, 50, 22);
        p.rectMode(p.CENTER);
        p.rect(-10, -4, 22, 18, 4);
        break;
      case "house":
        p.fill(pc.color || "#e8d7b8");
        p.rectMode(p.CENTER);
        p.rect(0, 10, 74, 54, 4);
        p.fill("#c46a4a");
        p.triangle(-44, -14, 44, -14, 0, -50);
        break;
      case "block":
        p.fill(pc.color || "#e6d2a2");
        p.rectMode(p.CENTER);
        p.rect(0, 0, (pc.r || 28) * 1.3, (pc.r || 28) * 1.1, 4);
        break;
      case "gear":
        p.fill("#d4a017");
        p.circle(0, 0, 48);
        p.fill("#f6efe4");
        p.circle(0, 0, 16);
        break;
      case "caterpillar":
        p.fill("#5e7a5e");
        for (let i = -2; i <= 2; i++) p.circle(i * 16, 0, 28);
        p.fill("#3a2f27");
        p.circle(32, -6, 6);
        break;
      case "robot":
        p.fill(pc.altForm ? "#c0392b" : "#6a8eae");
        p.rectMode(p.CENTER);
        if (pc.altForm) {
          p.rect(0, 0, 68, 34, 8);
          p.fill("#222");
          p.circle(-18, 18, 14);
          p.circle(18, 18, 14);
        } else {
          p.rect(0, 0, 48, 64, 6);
          p.fill("#f5c518");
          p.circle(-10, -10, 9);
          p.circle(10, -10, 9);
        }
        break;
      case "pendulum":
        if (pc.px == null) {
          p.stroke("#8b6914");
          p.strokeWeight(3);
          p.line(0, -(pc.arm || 140), 0, 0);
        }
        p.noStroke();
        p.fill("#c46a4a");
        p.circle(0, 0, 28);
        break;
      case "arrow":
        p.stroke(pc.color || "#7b4ea3");
        p.strokeWeight(5);
        p.line(0, 0, pc.dx || 80, pc.dy || 0);
        p.fill(pc.color || "#7b4ea3");
        p.noStroke();
        p.push();
        p.translate(pc.dx || 80, pc.dy || 0);
        p.rotate(Math.atan2(pc.dy || 0, pc.dx || 80));
        p.triangle(0, 0, -14, -8, -14, 8);
        p.pop();
        break;
      case "silk":
        p.fill(pc.color || "#7b4ea3");
        p.ellipse(0, 0, pc.r * 2.2, pc.r * 1.35);
        break;
      default:
        p.fill(pc.color || WOOD);
        p.circle(0, 0, pc.r * 2);
    }
  }

  function along(pts, s) {
    if (!pts || pts.length < 2) return { x: 0, y: 0 };
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push(d); total += d;
    }
    let t = Math.max(0, Math.min(1, s)) * total;
    for (let i = 1; i < pts.length; i++) {
      if (t <= segs[i - 1] || i === pts.length - 1) {
        const u = segs[i - 1] > 0 ? t / segs[i - 1] : 0;
        return {
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u
        };
      }
      t -= segs[i - 1];
    }
    return pts[pts.length - 1];
  }

  function ptr(p) {
    if (p.touches && p.touches.length) return { x: p.touches[0].x, y: p.touches[0].y };
    return { x: p.mouseX, y: p.mouseY };
  }

  function hit(pc, x, y) {
    if (pc.kind === "churro") {
      const hw = (pc.len || 160) / 2 + 14;
      const hh = Math.max((pc.thick || 16) / 2 + 16, 26);
      return Math.abs(x - pc.x) <= hw && Math.abs(y - pc.y) <= hh;
    }
    if (pc.kind === "kapla" && (pc.w || pc.h)) {
      const hw = (pc.w || 70) / 2 + 12;
      const hh = (pc.h || 16) / 2 + 12;
      return Math.abs(x - pc.x) <= hw && Math.abs(y - pc.y) <= hh;
    }
    if (pc.kind === "stick") {
      return Math.abs(x - pc.x) <= 44 && Math.abs(y - pc.y) <= 18;
    }
    const rr = pc.r || 32;
    return Math.hypot(x - pc.x, y - pc.y) < rr + 10;
  }

  function onPress(p) {
    if (!world || isQuiz()) return;
    const { x, y } = ptr(p);
    dragMoved = false;
    dragStartPos = { x, y };

    if (world.kind === "powers_of_ten") {
      KINDS.powers_of_ten.onPress(x, y);
      return;
    }

    // 1. Sliders tienen prioridad
    for (let i = world.sliders.length - 1; i >= 0; i--) {
      const s = world.sliders[i];
      const kx = s.x + (s.v - s.min) / (s.max - s.min) * s.w;
      if (Math.hypot(x - kx, y - s.y) < 24 || (x >= s.x - 10 && x <= s.x + s.w + 10 && Math.abs(y - s.y) < 20)) {
        dragging = { slider: s };
        s.v = s.min + Math.max(0, Math.min(1, (x - s.x) / s.w)) * (s.max - s.min);
        if (s.key) world[s.key] = s.v;
        return;
      }
    }

    // 2. Piezas (soportando simultáneamente clickable + draggable según Prompt 0)
    for (let i = world.pieces.length - 1; i >= 0; i--) {
      const pc = world.pieces[i];
      if (!hit(pc, x, y)) continue;
      if (pc.static && !pc.clickable) continue;

      if (pc.static && pc.clickable) {
        playWoodClick();
        clickPiece(pc, x, y);
        return;
      }

      // Pieza móvil (puede ser además clickable al soltar sin arrastrar)
      dragging = pc;
      pc.grabbed = true;
      pc.vx = pc.vy = 0;
      if (pc.inBowl) {
        pc.inBowl = false;
        pc.inTarget = null;
        pc.r = pc.rHand || pc.r;
        recalcTargets();
      }
      dragOff.x = pc.x - x;
      dragOff.y = pc.y - y;
      playWoodClick();
      world.pieces.splice(i, 1);
      world.pieces.push(pc);
      return;
    }

    world.flags.clicked = { x, y };
  }

  function onDrag(p) {
    if (!dragging || isQuiz()) return;
    const { x, y } = ptr(p);
    if (Math.hypot(x - dragStartPos.x, y - dragStartPos.y) > 6) {
      dragMoved = true;
    }
    if (world.kind === "powers_of_ten") {
      KINDS.powers_of_ten.onDrag(x, y);
      return;
    }
    if (dragging.slider) {
      const s = dragging.slider;
      s.v = s.min + Math.max(0, Math.min(1, (x - s.x) / s.w)) * (s.max - s.min);
      if (s.key) world[s.key] = s.v;
      return;
    }
    const prevX = dragging.x;
    dragging.x = Math.max(30, Math.min(W - 30, x + dragOff.x));
    dragging.y = Math.max(30, Math.min(H - 30, y + dragOff.y));
    dragging.tilt = Math.max(-0.25, Math.min(0.25, (dragging.x - prevX) * 0.025));

    // Si en 11.4 memory el usuario arrastra el churro, estirarlo interactivamente
    if (world.kind === "memory" && dragging.kind === "churro") {
      dragging.len = Math.min(420, Math.max(180, 220 + Math.abs(x - 640) * 0.9));
      world.flags.stretched = true;
    }
  }

  function onRelease(p) {
    if (!dragging) return;
    if (world && world.kind === "powers_of_ten") {
      KINDS.powers_of_ten.onRelease();
      return;
    }
    if (dragging.slider) {
      dragging = null;
      return;
    }
    const pc = dragging;
    pc.grabbed = false;
    pc.tilt = 0;

    // Si fue un toque corto (< 6px), activar clickPiece o abacoTap
    if (!dragMoved) {
      if (pc.kind === "abaco") {
        world.flags.abacoTap = (world.flags.abacoTap || 0) + 1;
      }
      if (pc.clickable) {
        clickPiece(pc, pc.x, pc.y);
      }
      if ((pc.kind === "proton" || pc.kind === "electron") && world.kind === "casita" && phase === 2) {
        pc.q *= -1;
        pc.kind = pc.q > 0 ? "proton" : "electron";
      }
    } else {
      // Si arrastró el ábaco en 1.1 también cuenta como explorable
      if (pc.kind === "abaco") {
        world.flags.abacoTap = (world.flags.abacoTap || 0) + 1;
      }
    }

    // Verificar si cayó dentro de algún target (evitando inflación artificial de tg.held)
    world.targets.forEach((tg) => {
      if (Math.hypot(pc.x - tg.x, pc.y - tg.y) < (tg.r || 50) + 22) {
        const accepts = (tg.accept || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (!accepts.length || accepts.includes(pc.kind)) {
          // Caso especial: verter con vaso chico (1.1 ph=2 y 1.2 ph=2)
          if (pc.pourable) {
            tg.pourCount = Math.min(tg.maxPour || 5, (tg.pourCount || 0) + 1);
            pc.x = pc.origX;
            pc.y = pc.origY;
            pc.inBowl = false;
            pc.inTarget = null;
            playMagicChime();
            recalcTargets();
            return;
          }
          pc.inBowl = true;
          pc.inTarget = tg;
          const nest = Math.min(14, (tg.r || 50) * 0.25);
          pc.rHand = pc.rHand || pc.r;
          if (pc.kind === "marble" || pc.kind === "proton" || pc.kind === "electron") pc.r = nest;
          const spread = (tg.r || 50) * 0.42;
          pc.x = tg.x + (Math.random() - 0.5) * spread;
          pc.y = tg.y + (Math.random() - 0.5) * spread * 0.55 + 4;
          playWoodClick();
        }
      }
    });

    recalcTargets();
    dragging = null;
  }

  function clickPiece(pc) {
    if (pc.toggle === "lamp") pc.on = !pc.on;
    if (pc.toggle === "path") {
      const path = world.paths[pc.path];
      if (path) path.open = path.open === false ? true : false;
    }
    // 1.3 passport: cubrir un juguete con "¿?"
    if (pc.kind === "paper" || (pc.clickable && pc.caption && (pc.kind === "passport" || pc.kind === "car" || pc.kind === "hourglass"))) {
      if (world.kind === "passport") {
        world.pieces.forEach((q) => { if (q.caption) q.empty = false; });
        pc.empty = true;
        world.flags.empty = pc.caption;
      }
    }
    // 1.2 costume: poner sombrero sobre la cabeza de Potato Head (arriba de los ojos)
    if (pc.kind === "hat" && pc.wear) {
      const pot = world.pieces.find((q) => q.kind === "potato");
      if (pot) {
        world.pieces.forEach((h) => {
          if (h.kind === "hat" && h !== pc && h.worn) {
            h.worn = false;
            h.x = h.origX;
            h.y = h.origY;
          }
        });
        pot.hat = pc.caption || pc.color;
        pc.worn = true;
        pc.x = pot.x;
        pc.y = pc.sprite === "glasses" ? pot.y - 12 : pot.y - 95;
      }
    }
    // 2.2 parade: sacar palito de KerPlunk
    if (pc.kind === "stick") {
      pc.pulled = !pc.pulled;
      pc.x = pc.pulled ? pc.origX - 95 : pc.origX;
    }
    // 4.1 ohm: tapar/destapar uno de los 3 ratones para mostrar la incógnita
    if (pc.kind === "mouse" && world.kind === "ohm") {
      world.pieces.forEach((m) => { if (m.kind === "mouse" && m !== pc) m.covered = false; });
      pc.covered = !pc.covered;
      world.flags.coveredMouse = pc.covered ? pc.idx : null;
    }
    // 8.2 disguise: transformar robot <-> coche
    if (pc.kind === "robot") {
      pc.altForm = !pc.altForm;
    }
    // 14.1 photo: disparar flash con la cámara
    if (pc.kind === "camera") {
      world.flags.flash = 25;
      world.flags.shotSlope = world.meters[0] ? world.meters[0].value : 0;
      playMagicChime();
    }
    world.flags.lastClick = pc;
  }

  function coulomb(k) {
    const charged = world.pieces.filter((pc) => pc.q && !pc.static);
    for (let i = 0; i < charged.length; i++) {
      for (let j = i + 1; j < charged.length; j++) {
        const a = charged[i], b = charged[j];
        if (a.grabbed || b.grabbed) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        let r2 = Math.max(dx * dx + dy * dy, 1600);
        const r = Math.sqrt(r2);
        const f = (k * 1400 * a.q * b.q) / r2;
        a.vx += (dx / r) * f; a.vy += (dy / r) * f;
        b.vx -= (dx / r) * f; b.vy -= (dy / r) * f;
      }
    }
    charged.forEach((pc) => {
      if (pc.grabbed) return;
      pc.vx *= 0.9; pc.vy *= 0.9;
      pc.x = Math.max(50, Math.min(W - 50, pc.x + pc.vx));
      pc.y = Math.max(50, Math.min(H - 50, pc.y + pc.vy));
    });
  }

  function spawnWinSparks(cx, cy) {
    for (let i = 0; i < 40; i++) {
      sparks.push({
        x: (cx || 640) + (Math.random() - 0.5) * 360,
        y: (cy || 360) + (Math.random() - 0.5) * 180,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 1,
        alpha: 255,
        color: [255, 205 + Math.random() * 50, 35],
        r: Math.random() * 6 + 3
      });
    }
  }

  function drawSparks(p) {
    if (!sparks.length) return;
    p.push();
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08;
      s.alpha -= 4;
      if (s.alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      p.noStroke();
      p.fill(s.color[0], s.color[1], s.color[2], s.alpha);
      p.circle(s.x, s.y, s.r);
    }
    p.pop();
  }

  /* ==========================================================================
     DEFINICIÓN DE JUEGOS INTERACTIVOS (KINDS) — PISOS I AL XIV + VAELITHOR
     ========================================================================== */
  const KINDS = {};

  KINDS.table = {
    setup(w) {
      w.labels.push({ x: 640, y: 80, text: "Arrastra los juguetes. El taller se toca." });
      w.pieces.push(piece("nin", 400, 360));
      w.pieces.push(piece("marble", 520, 360, { color: "#5c3a21" }));
      w.pieces.push(piece("bowl", 700, 380, { static: true }));
    }
  };

  /* ---------- Taller Especial Vaelithor: Potencias de 10 (2 kΩ y 3 MΩ) ---------- */
  KINDS.powers_of_ten = {
    setup(w, ph, t) {
      if (t.variant === "mega") {
        w.targets = [
          { key: "val", accept: "cube_3m", label: "Valor Inicial (Ω)", x: 620, y: 395, r: 65, held: null },
          { key: "pow", accept: "cube_10_6", label: "Potencia de 10 (10ⁿ)", x: 820, y: 395, r: 65, held: null },
          { key: "pre", accept: "disc_mohm", label: "Abreviatura Prefijo (MΩ)", x: 1020, y: 395, r: 65, held: null }
        ];
        w.pieces = [
          piece("cube_3m", 580, 580, { r: 60, sprite: "cube_3m", label: "3,000,000 Ω" }),
          piece("cube_10_6", 820, 580, { r: 60, sprite: "cube_10_6", label: "10⁶" }),
          piece("disc_mohm", 1060, 580, { r: 58, sprite: "disc_mohm", label: "MΩ" })
        ];
      } else if (t.variant === "dual") {
        w.targets = [
          { key: "t1", accept: "cube_2000", label: "2.000 Ω", x: 600, y: 320, r: 55, held: null },
          { key: "t2", accept: "cube_10_3", label: "10³", x: 800, y: 320, r: 55, held: null },
          { key: "t3", accept: "disc_kohm", label: "kΩ", x: 1000, y: 320, r: 55, held: null },
          { key: "b1", accept: "cube_3m", label: "3.000.000 Ω", x: 600, y: 460, r: 55, held: null },
          { key: "b2", accept: "cube_10_6", label: "10⁶", x: 800, y: 460, r: 55, held: null },
          { key: "b3", accept: "disc_mohm", label: "MΩ", x: 1000, y: 460, r: 55, held: null }
        ];
        w.pieces = [
          piece("cube_2000", 520, 600, { r: 50, sprite: "cube_2000", label: "2000 Ω" }),
          piece("cube_3m", 640, 600, { r: 50, sprite: "cube_3m", label: "3,000,000 Ω" }),
          piece("cube_10_3", 760, 600, { r: 50, sprite: "cube_10_3", label: "10³" }),
          piece("cube_10_6", 880, 600, { r: 50, sprite: "cube_10_6", label: "10⁶" }),
          piece("disc_kohm", 1000, 600, { r: 48, sprite: "disc_kohm", label: "kΩ" }),
          piece("disc_mohm", 1120, 600, { r: 48, sprite: "disc_mohm", label: "MΩ" })
        ];
      } else {
        w.targets = [
          { key: "val", accept: "cube_2000", label: "Valor Inicial (Ω)", x: 620, y: 395, r: 65, held: null },
          { key: "pow", accept: "cube_10_3", label: "Potencia de 10 (10ⁿ)", x: 820, y: 395, r: 65, held: null },
          { key: "pre", accept: "disc_kohm", label: "Abreviatura Prefijo (kΩ)", x: 1020, y: 395, r: 65, held: null }
        ];
        w.pieces = [
          piece("cube_2000", 580, 580, { r: 60, sprite: "cube_2000", label: "2000 Ω" }),
          piece("cube_10_3", 820, 580, { r: 60, sprite: "cube_10_3", label: "10³" }),
          piece("disc_kohm", 1060, 580, { r: 58, sprite: "disc_kohm", label: "kΩ" })
        ];
      }
    },
    onPress(x, y) {
      for (let i = world.pieces.length - 1; i >= 0; i--) {
        const pc = world.pieces[i];
        if (Math.hypot(x - pc.x, y - pc.y) < pc.r + 14) {
          dragging = pc;
          pc.grabbed = true;
          dragOff.x = pc.x - x;
          dragOff.y = pc.y - y;
          if (pc.slotKey) {
            const prevTg = world.targets.find((t) => t.key === pc.slotKey);
            if (prevTg) prevTg.held = null;
            pc.slotKey = null;
            pc.inSlot = false;
          }
          playWoodClick();
          world.pieces.splice(i, 1);
          world.pieces.push(pc);
          return;
        }
      }
    },
    onDrag(x, y) {
      if (!dragging) return;
      const prevX = dragging.x;
      dragging.x = x + dragOff.x;
      dragging.y = y + dragOff.y;
      dragging.tilt = (dragging.x - prevX) * 0.04;
    },
    onRelease() {
      const pc = dragging;
      if (!pc) return;
      pc.grabbed = false;
      pc.tilt = 0;
      let snapped = false;
      world.targets.forEach((tg) => {
        if (Math.hypot(pc.x - tg.x, pc.y - tg.y) < tg.r + 30) {
          if (!tg.held && tg.accept === pc.kind) {
            pc.x = tg.x;
            pc.y = tg.y;
            pc.inSlot = true;
            pc.slotKey = tg.key;
            tg.held = pc;
            snapped = true;
            playWoodClick();
          }
        }
      });
      if (!snapped && !pc.inSlot && pc.y < 480) {
        pc.x = pc.origX;
        pc.y = pc.origY;
      }
      dragging = null;
    },
    draw(p, w) {
      const bg = imgs.playroom_bg;
      if (bg && bg.loaded) drawLoadedImage(p, bg, W / 2, H / 2, W, H);
      else p.background(245, 238, 225);

      const vx = 220, vy = 430 + Math.sin(w.t * 0.04) * 5;
      if (imgs.mago_vaelithor && imgs.mago_vaelithor.loaded) {
        drawLoadedImage(p, imgs.mago_vaelithor, vx, vy, 480, 520);
      }

      const tx = 820, ty = w.variant === "dual" ? 420 : 450;
      const tw = w.variant === "dual" ? 720 : 660;
      const th = w.variant === "dual" ? 400 : 360;
      if (imgs.wooden_tray && imgs.wooden_tray.loaded) {
        drawLoadedImage(p, imgs.wooden_tray, tx, ty, tw, th);
      } else {
        p.fill(215, 175, 125); p.stroke(INK); p.strokeWeight(4); p.rectMode(p.CENTER);
        p.rect(tx, ty, tw, th, 18);
      }

      if (w.variant !== "dual" && imgs.wooden_resistor && imgs.wooden_resistor.loaded) {
        drawLoadedImage(p, imgs.wooden_resistor, 820, 190, 340, 100);
        drawLabel(p, {
          x: 820, y: 255,
          text: w.variant === "mega" ? "Resistor de Gran Potencia · 3.000.000 Ω (3 MΩ)" : "Resistor de Madera Torneada · 2.000 Ω (2 kΩ)"
        });
      }

      w.targets.forEach((tg) => drawTarget(p, tg));

      w.pieces.forEach((pc) => {
        p.push();
        p.translate(pc.x, pc.y);
        p.rotate(pc.tilt || 0);
        const wrap = imgs[pc.sprite];
        const sz = pc.grabbed ? pc.r * 2.15 : pc.r * 2;
        if (!drawLoadedImage(p, wrap, 0, 0, sz, sz)) {
          p.fill(225, 185, 135); p.stroke(INK); p.strokeWeight(3); p.rectMode(p.CENTER);
          p.rect(0, 0, sz, sz, 12);
          p.noStroke(); p.fill(INK); p.textAlign(p.CENTER, p.CENTER); p.textSize(14);
          p.text(pc.label, 0, 0);
        }
        p.pop();
      });

      const allHeld = w.targets.length > 0 && w.targets.every((tg) => tg.held);
      if (allHeld) {
        drawLabel(p, {
          x: 820, y: w.variant === "dual" ? 245 : 295,
          text: w.variant === "mega"
            ? "¡Correcto! 3.000.000 Ω = 3 × 10⁶ Ω = 3 MΩ"
            : "¡Correcto! 2.000 Ω = 2 × 10³ Ω = 2 kΩ"
        });
        if (!w.completed) {
          w.completed = true;
          playMagicChime();
          saveDone(tut().id);
          spawnWinSparks(820, 380);
        }
      }
      drawSparks(p);
    }
  };

  /* ---------- PISO I: 1.1 tens, 1.2 costume, 1.3 passport, 1.4 recipe ---------- */
  KINDS.tens = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("abaco", 640, 390, { r: 220, clickable: true }));
        w.pieces.push(piece("piramide", 1060, 420, { r: 120 }));
        w.pieces.push(piece("cups", 200, 470, { r: 90 }));
        w.labels.push({ x: 640, y: 72, text: "Toca o mueve el ábaco: cada hilera vale diez (10¹)." });
        w.meters.push({ label: "Hileras tocadas (×10)", value: 0, max: 10, color: "#7b4ea3" });
      } else if (ph === 1) {
        [["chico · 1 (10⁰)", 300, 65], ["mediano · 10 (10¹)", 640, 92], ["grande · 100 (10²)", 980, 120]].forEach(([label, x, r]) => {
          w.targets.push({ x, y: 400, r: r * 0.62, label, accept: "marble,proton,electron" });
          w.pieces.push(piece("bowl", x, 400, { static: true, r, sprite: "cuenco" }));
        });
        for (let i = 0; i < 10; i++) {
          w.pieces.push(piece("proton", 70 + (i % 2) * 38, 120 + Math.floor(i / 2) * 38, { q: 0, r: 18, rHand: 18 }));
        }
        for (let i = 0; i < 8; i++) {
          w.pieces.push(piece("electron", 1180 - (i % 2) * 38, 120 + Math.floor(i / 2) * 38, { q: 0, r: 18, rHand: 18 }));
        }
        w.meters.push({ label: "Canicas en cuencos", value: 0, max: 10, color: "#5e7a5e" });
      } else if (ph === 2) {
        w.pieces.push(piece("cups", 420, 400, { r: 80, n: 1, pourable: true, caption: "vaso 1 (verter)" }));
        w.pieces.push(piece("cups", 860, 380, { r: 130, n: 5, static: true, caption: "vaso 5" }));
        w.targets.push({ x: 860, y: 380, r: 90, label: "vaso gordo (5 vertidos)", accept: "cups,cup", maxPour: 5 });
        w.labels.push({ x: 640, y: 80, text: "Arrastra el vaso chico al gordo varias veces para verter." });
        w.meters.push({ label: "Vertidos (décimos)", value: 0, max: 5, color: "#6a8eae" });
      } else {
        for (let i = 0; i < 10; i++) {
          w.pieces.push(piece("coin", 170 + (i % 5) * 118, 250 + Math.floor(i / 5) * 85, { sprite: "bill-1", r: 50, n: "1" }));
        }
        w.pieces.push(piece("coin", 1020, 400, { sprite: "bill-10", r: 92, static: true, caption: "billete 10" }));
        w.targets.push({ x: 1020, y: 400, r: 95, label: "cambia 10 de 1 por un 10", accept: "coin" });
        w.labels.push({ x: 640, y: 80, text: "Diez billetes de 1 valen lo mismo que un billete de 10." });
        w.meters.push({ label: "Billetes de 1 cambiados", value: 0, max: 10, color: "#d4a017" });
      }
    },
    update() {
      if (phase === 0 && world.meters[0]) world.meters[0].value = Math.min(10, world.flags.abacoTap || 0);
      if (phase === 1 && world.meters[0]) {
        const total = world.targets.reduce((acc, t) => acc + (t.held || 0), 0);
        world.meters[0].value = total;
      }
      if (phase === 2 && world.targets[0] && world.meters[0]) world.meters[0].value = world.targets[0].held || 0;
      if (phase === 3 && world.targets[0] && world.meters[0]) world.meters[0].value = world.targets[0].held || 0;
    }
  };

  KINDS.costume = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("nin", 640, 430, { static: true, r: 100 }));
        w.pieces.push(piece("silk", 260, 260, { sprite: "silk-kilo", r: 125, caption: "kilo (×1000)" }));
        w.pieces.push(piece("silk", 1020, 260, { sprite: "silk-mili", r: 75, caption: "mili (÷1000)" }));
        w.targets.push({ x: 640, y: 430, r: 95, label: "el Nin (tesoro desnudo)", accept: "silk" });
        w.labels.push({ x: 640, y: 75, text: "Viste al Nin con el pañuelo kilo o mili: el Nin sigue siendo uno." });
      } else if (ph === 1) {
        w.pieces.push(piece("potato", 640, 420, { static: true, r: 125, caption: "Sr. Cara de Papa" }));
        ["Tera (10¹²)", "Giga (10⁹)", "Mega (10⁶)", "Kilo (10³)", "mili (10⁻³)", "micro (10⁻⁶)", "nano (10⁻⁹)", "pico (10⁻¹²)"].forEach((name, i) => {
          w.pieces.push(piece("hat", 150 + (i % 4) * 110, 120 + Math.floor(i / 4) * 95, {
            caption: name, clickable: true, wear: true, r: 38, color: RAIN[i % RAIN.length]
          }));
        });
        w.pieces.push(piece("hat", 1080, 480, { sprite: "glasses", r: 44, caption: "gafas", clickable: true, wear: true }));
        w.labels.push({ x: 640, y: 65, text: "Toca cualquier sombrero-prefijo para ponérselo en la cabeza." });
      } else if (ph === 2) {
        w.pieces.push(piece("cups", 400, 400, { r: 85, n: 1, pourable: true, caption: "vaso chico" }));
        w.pieces.push(piece("cups", 880, 380, { r: 140, n: 5, static: true, caption: "vaso grande" }));
        w.targets.push({ x: 880, y: 380, r: 90, label: "misma agua, otro disfraz", accept: "cups,cup", maxPour: 5 });
        w.meters.push({ label: "Vertidos", value: 0, max: 5, color: "#6a8eae" });
      } else {
        for (let i = 0; i < 6; i++) {
          w.pieces.push(piece("coin", 180 + (i % 3) * 130, 240 + Math.floor(i / 3) * 95, { sprite: "bill-10", r: 56, caption: "1.000" }));
        }
        w.targets.push({ x: 1000, y: 400, r: 95, accept: "coin", label: "6 kilos = 6.000" });
        w.meters.push({ label: "Kilos reunidos", value: 0, max: 6, color: "#d4a017" });
      }
    },
    update() {
      if (phase === 1) {
        const pot = world.pieces.find((p) => p.kind === "potato");
        if (pot && pot.hat) {
          pot.caption = "Disfraz: " + pot.hat;
        }
      }
      if (phase === 2 && world.targets[0] && world.meters[0]) {
        world.meters[0].value = world.targets[0].held || 0;
      }
      if (phase === 3 && world.targets[0] && world.meters[0]) {
        world.meters[0].value = world.targets[0].held || 0;
      }
    }
  };

  KINDS.passport = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("passport", 280, 350, { clickable: true, static: true, caption: "camino (d)", r: 75 }));
        w.pieces.push(piece("car", 640, 360, { clickable: true, static: true, caption: "velocidad (v)", r: 85 }));
        w.pieces.push(piece("hourglass", 1000, 350, { clickable: true, static: true, caption: "reloj (t)", r: 78 }));
        w.labels.push({ x: 640, y: 80, text: "Toca un juguete para taparlo (¿?). Con los otros dos se descubre." });
        w.labels.push({ x: 640, y: 540, text: "Toca cualquiera de los tres juguetes para ver la fórmula." });
      } else if (ph === 1) {
        w.pieces.push(piece("car", 220, 400, { r: 88, caption: "arrástrame" }));
        w.pieces.push(piece("hourglass", 1080, 190, { r: 70, static: true, caption: "1 tramo / seg" }));
        w.labels.push({ x: 640, y: 80, text: "Arrastra el coche hacia la derecha: el reloj cuenta los tramos." });
        w.meters.push({ label: "Tramos recorridos", value: 0, max: 10, color: "#c46a4a" });
      } else if (ph === 2) {
        w.pieces.push(piece("shoe", 340, 380, { r: 80, caption: "1 paso = 0.25 m" }));
        w.pieces.push(piece("silk", 900, 360, { sprite: "silk-kilo", r: 115, caption: "1 silk = 1 m" }));
        w.labels.push({ x: 640, y: 80, text: "Mide la mesa con el zapato o con el silk: la mesa mide lo mismo." });
        w.meters.push({ label: "Medida en zapatos", value: 4, max: 10, color: "#8b6914" });
        w.meters.push({ label: "Medida en silks", value: 1, max: 10, color: "#7b4ea3" });
      } else {
        w.pieces.push(piece("scale", 980, 280, { r: 105, static: true, caption: "1 kg ≈ 2.2 lb" }));
        w.pieces.push(piece("bowl", 360, 420, { static: true, r: 90, sprite: "cuenco", caption: "libras (lb)" }));
        w.pieces.push(piece("bowl", 640, 420, { static: true, r: 90, sprite: "cuenco", caption: "kilos (kg)" }));
        w.targets.push({ x: 360, y: 420, r: 65, accept: "marble,proton", label: "libras" });
        w.targets.push({ x: 640, y: 420, r: 65, accept: "marble,electron", label: "kilos" });
        for (let i = 0; i < 8; i++) w.pieces.push(piece("proton", 80, 100 + i * 42, { q: 0, r: 16, rHand: 16 }));
        for (let i = 0; i < 8; i++) w.pieces.push(piece("electron", 1200, 100 + i * 42, { q: 0, r: 16, rHand: 16 }));
        w.pieces.push(piece("register", 1080, 520, { r: 80, caption: "conversor" }));
      }
    },
    update() {
      if (phase === 0 && world.flags.empty && world.labels[1]) {
        const map = {
          "camino (d)": "Tapaste CAMINO: Camino = Velocidad × Reloj",
          "velocidad (v)": "Tapaste VELOCIDAD: Velocidad = Camino ÷ Reloj",
          "reloj (t)": "Tapaste RELOJ: Reloj = Camino ÷ Velocidad"
        };
        world.labels[1].text = map[world.flags.empty] || "";
      }
      if (phase === 1) {
        const car = world.pieces.find((pc) => pc.kind === "car");
        if (car && world.meters[0]) world.meters[0].value = Math.max(0, Math.min(10, (car.x - 180) / 90));
      }
    }
  };

  KINDS.recipe = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("rainbow", 360, 360, { r: 120, clickable: true, step: 1, caption: "1º Paréntesis (4+8=12)" }));
        w.pieces.push(piece("connect4", 860, 380, { r: 140, clickable: true, step: 2, caption: "2º Multiplicar 6×12=72" }));
        w.labels.push({ x: 640, y: 72, text: "Receta 6(4+8): Toca primero el arcoíris (adentro) y luego el Connect 4." });
        w.flags.order = [];
        w.meters.push({ label: "Pasos en orden", value: 0, max: 2, color: "#5e7a5e" });
      } else if (ph === 1) {
        w.pieces.push(piece("triangle", 640, 380, { r: 145, caption: "Triángulo firme" }));
        w.pieces.push(piece("triangle", 240, 460, { sprite: "kapla-stack", r: 95, caption: "3 listones" }));
        w.labels.push({ x: 640, y: 80, text: "Tres datos armados como triángulo sostienen toda la receta." });
      } else if (ph === 2) {
        w.pieces.push(piece("mousetrap", 580, 380, { r: 170, static: true }));
        w.pieces.push(piece("marble", 200, 460, { r: 28, caption: "canica" }));
        w.pieces.push(piece("bowl", 1060, 460, { static: true, r: 90, sprite: "cuenco" }));
        w.targets.push({ x: 1060, y: 460, r: 75, accept: "marble", label: "la trampa final" });
        w.labels.push({ x: 640, y: 72, text: "Lleva la canica paso a paso hasta el cuenco final." });
      } else {
        w.pieces.push(piece("triangle", 420, 360, { r: 130, caption: "paso 1" }));
        w.pieces.push(piece("triangle", 820, 360, { sprite: "kapla-stack", r: 100, caption: "paso 2" }));
        w.labels.push({ x: 640, y: 80, text: "Tirar todo a la vez no llega. Pieza por pieza sí." });
      }
    },
    update() {
      if (phase === 0 && world.flags.lastClick && world.flags.lastClick.step) {
        const s = world.flags.lastClick.step;
        world.flags.lastClick = null;
        if (s === 1 && world.flags.order.length === 0) {
          world.flags.order.push(1);
          world.labels[0].text = "¡Bien! Adentro dio 12. Ahora toca el Connect 4 para multiplicar por 6.";
        } else if (s === 2 && world.flags.order.length === 1) {
          world.flags.order.push(2);
          world.labels[0].text = "¡Exacto! 6 × 12 = 72. El paréntesis siempre manda primero.";
          playMagicChime();
        } else if (s === 2 && world.flags.order.length === 0) {
          world.labels[0].text = "¡Cuidado! Si multiplicas antes de sumar adentro, la receta sale al revés. Toca el arcoíris primero.";
        }
        if (world.meters[0]) world.meters[0].value = world.flags.order.length;
      }
    }
  };

  /* ---------- PISO II: 2.1 casita, 2.2 parade, 2.3 ramp, 2.4 materials ---------- */
  KINDS.casita = {
    setup(w, ph) {
      w.prado = true;
      if (ph === 0) {
        w.pieces.push(piece("cuenco", 640, 355, { static: true, r: 120, caption: "núcleo" }));
        for (let i = 0; i < 5; i++) w.pieces.push(piece("proton", 180 + (i % 3) * 62, 160 + Math.floor(i / 3) * 62, { q: 1, caption: "protón +" }));
        w.pieces.push(piece("nin", 200, 520, { caption: "neutrón" }));
        w.pieces.push(piece("nin", 280, 540, { caption: "neutrón" }));
        // Los electrones esperan en la derecha sin colapsar hasta que haya protones en el cuenco
        for (let i = 0; i < 8; i++) {
          w.pieces.push(piece("electron", 1080, 120 + i * 62, {
            q: -1, orbit: (i * Math.PI) / 4, orbitR: 0, cx: 640, cy: 355, orbitSp: 0
          }));
        }
        w.targets.push({ x: 640, y: 355, r: 95, accept: "proton,nin", label: "mete protones al cuenco" });
        w.labels.push({ x: 640, y: 70, text: "Mete protones y Nins al cuenco: verás a los electrones ponerse a girar." });
      } else if (ph === 1) {
        [["Conductor · generoso", 280, "conductor"], ["Aislante · celoso", 640, "aislante"], ["Semiconductor · con luz", 1000, "semi"]].forEach(([label, x, kind]) => {
          w.pieces.push(piece("cuenco", x, 380, { static: true, r: 100, house: kind, clickable: true }));
          w.labels.push({ x, y: 508, text: label });
          for (let i = 0; i < 5; i++) {
            w.pieces.push(piece("electron", x + Math.cos(i * 1.25) * 55, 380 + Math.sin(i * 1.25) * 40, {
              q: -1, house: kind, orbit: i * 1.25, orbitR: 55, cx: x, cy: 380, orbitSp: kind === "conductor" ? 0.05 : 0.005
            }));
          }
        });
        w.pieces.push(piece("linterna", 160, 130, { caption: "acércame al 3º" }));
        w.labels.push({ x: 640, y: 70, text: "Toca el conductor o acerca la linterna al semiconductor." });
      } else if (ph === 2) {
        w.pieces.push(piece("proton", 440, 300, { q: 1 }));
        w.pieces.push(piece("electron", 840, 300, { q: -1 }));
        w.pieces.push(piece("proton", 520, 500, { q: 1 }));
        w.pieces.push(piece("proton", 740, 500, { q: 1 }));
        w.pieces.push(piece("electron", 240, 220, { q: -1 }));
        w.pieces.push(piece("electron", 1040, 480, { q: -1 }));
        w.labels.push({ x: 640, y: 70, text: "Iguales se empujan, distintos se buscan. Toca una canica para cambiar su signo." });
      } else {
        w.pieces.push(piece("plus", 430, 360, { q: 1, plate: true, caption: "placa +" }));
        w.pieces.push(piece("minus", 850, 360, { q: -1, plate: true, caption: "placa −" }));
        w.meters.push({ label: "Fuerza (1 / distancia²)", value: 1, max: 2, color: "#c46a4a" });
        w.labels.push({ x: 640, y: 70, text: "Acerca las placas a la mitad de distancia: el tirón sube 4 veces." });
      }
    },
    bg(p) {
      if (world.prado && imgs.prado && imgs.prado.loaded) {
        p.push();
        drawLoadedImage(p, imgs.prado, W / 2, H / 2, W, H);
        p.fill(255, 250, 240, 60);
        p.noStroke();
        p.rect(0, 0, W, H);
        p.pop();
      }
    },
    draw(p) {
      if (phase === 3) {
        const plates = world.pieces.filter((pc) => pc.plate);
        if (plates.length === 2) {
          const [a, b] = plates;
          const glow = world.meters[0] ? world.meters[0].value : 1;
          p.stroke(196, 106, 74, 50 + 80 * glow);
          p.strokeWeight(6 + 16 * glow);
          p.line(a.x, a.y, b.x, b.y);
        }
      }
    },
    update() {
      if (phase === 0) {
        const n = world.pieces.filter((pc) => (pc.kind === "proton" || pc.kind === "nin") && pc.inBowl).length;
        world.pieces.forEach((pc, idx) => {
          if (pc.kind === "electron") {
            pc.orbitR = n > 0 ? (idx < 2 ? 115 : 175) : 0;
            pc.orbitSp = n > 0 ? 0.025 + n * 0.005 : 0;
          }
        });
      }
      if (phase === 1) {
        const lamp = world.pieces.find((pc) => pc.kind === "linterna");
        world.pieces.forEach((pc) => {
          if (pc.house === "conductor" && world.flags.lastClick && world.flags.lastClick.house === "conductor") pc.orbitSp = 0.09;
          if (pc.house === "semi" && lamp) {
            pc.orbitSp = Math.hypot(lamp.x - 1000, lamp.y - 380) < 160 ? 0.09 : 0.005;
          }
        });
      }
      if (phase === 2) coulomb(0.55);
      if (phase === 3) {
        const plates = world.pieces.filter((pc) => pc.plate);
        if (plates.length === 2 && world.meters[0]) {
          const r = Math.max(80, Math.hypot(plates[0].x - plates[1].x, plates[0].y - plates[1].y));
          world.meters[0].value = Math.min(2, (280 * 280) / (r * r));
        }
      }
    }
  };

  KINDS.parade = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 140, y: 220 }, { x: 500, y: 220 }, { x: 700, y: 360 }, { x: 1100, y: 360 }], color: "#8b6914", w: 22, loop: false, speed: 0.008 });
      if (ph === 0) {
        w.pieces.push(piece("bowl", 260, 500, { static: true }));
        w.targets.push({ x: 260, y: 500, r: 65, accept: "marble", label: "1 paquete = 10 canicas" });
        for (let i = 0; i < 14; i++) w.pieces.push(piece("marble", 880 + (i % 4) * 44, 140 + Math.floor(i / 4) * 44, { color: RAIN[i % 6] }));
        w.meters.push({ label: "Canicas en el paquete", value: 0, max: 10, color: "#5e7a5e" });
      } else if (ph === 1 || ph === 2) {
        w.pieces.push(piece("bowl", 1100, 360, { static: true }));
        w.labels.push({ x: 640, y: 80, text: "Toca el botón «reloj» para soltar paquetes por la pista (I = Q / t)." });
        w.pieces.push(piece("paper", 180, 120, { caption: "reloj", clickable: true, static: true }));
        w.meters.push({ label: "Paquetes por turno", value: 0, max: 8, color: "#c46a4a" });
      } else {
        for (let i = 0; i < 6; i++) w.pieces.push(piece("stick", 640, 210 + i * 38, { clickable: true, static: true }));
        for (let i = 0; i < 12; i++) w.pieces.push(piece("marble", 600 + (i % 4) * 26, 150 + Math.floor(i / 4) * 24, { color: RAIN[i % 8] }));
        w.labels.push({ x: 640, y: 80, text: "Toca los palitos de KerPlunk para sacarlos: si sacas varios, caen todas (¡fusible fundido!)." });
        w.meters.push({ label: "Palitos retirados", value: 0, max: 3, color: "#c46a4a" });
      }
    },
    update() {
      if (phase === 0 && world.targets[0] && world.meters[0]) {
        world.meters[0].value = world.targets[0].held || 0;
      }
      if ((phase === 1 || phase === 2) && world.flags.lastClick && world.flags.lastClick.caption === "reloj") {
        world.flags.lastClick = null;
        const m = piece("marble", 140, 220, { color: RAIN[(world.meters[0].value || 0) % RAIN.length], roll: 1, path: 0, s: 0 });
        world.pieces.push(m);
        if (world.meters[0]) world.meters[0].value = Math.min(8, (world.meters[0].value || 0) + 1);
      }
      if (phase === 3) {
        const pulled = world.pieces.filter((p) => p.kind === "stick" && p.pulled).length;
        if (world.meters[0]) world.meters[0].value = pulled;
        if (pulled >= 2) {
          world.pieces.forEach((p) => {
            if (p.kind === "marble" && !p.grabbed && p.y < 590) {
              p.vy = (p.vy || 0) + 0.45;
              p.y = Math.min(595, p.y + p.vy);
            }
          });
        }
      }
    }
  };

  KINDS.ramp = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 180, y: 200 }, { x: 520, y: 420 }, { x: 760, y: 420 }], color: "#e67e22", w: 18, speed: 0.01 });
      w.paths.push({ pts: [{ x: 180, y: 90 }, { x: 880, y: 500 }, { x: 1120, y: 500 }], color: "#c0392b", w: 18, speed: 0.016 });
      w.pieces.push(piece("car", 180, 200, { color: "#e67e22", clickable: true, path: 0, s: 0, caption: "rampa baja (1 moneda)" }));
      w.pieces.push(piece("car", 180, 90, { color: "#c0392b", clickable: true, path: 1, s: 0, caption: "rampa alta (2 monedas)" }));
      w.pieces.push(piece("bowl", 640, 580, { static: true, caption: "Luggy (tesoro)" }));
      w.targets.push({ x: 640, y: 580, r: 60, accept: "coin", label: "tesoro acumulado" });
      w.meters.push({ label: "Monedas ganadas", value: 0, max: 12, color: "#d4a017" });
      if (ph >= 2) w.pieces.push(piece("bowl", 1040, 200, { static: true, caption: "alcancía Ah" }));
      if (ph === 3) w.pieces.push(piece("silk", 640, 300, { color: "#6a8eae", caption: "tierra (suelo común)" }));
      w.labels.push({ x: 740, y: 75, text: "Toca un coche para lanzarlo. Si ya llegó, tócalo de nuevo para relanzar." });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        const car = world.flags.lastClick;
        if ((car.s || 0) >= 0.98) car.s = 0;
        car.roll = 1;
        world.flags.lastCarPath = car.path;
        world.flags.lastClick = null;
      }
      if (world.flags.arrived) {
        const bonus = world.flags.lastCarPath === 1 ? 2 : 1;
        for (let k = 0; k < bonus; k++) {
          world.pieces.push(piece("coin", 610 + Math.random() * 60, 540 + Math.random() * 30, { n: "1", r: 34 }));
        }
        if (world.meters[0]) world.meters[0].value = Math.min(12, (world.meters[0].value || 0) + bonus);
        world.flags.arrived = 0;
      }
    }
  };

  KINDS.materials = {
    setup(w, ph) {
      // El riel llega hasta la puerta de vidrio en x=820 y sigue hasta x=1060
      w.paths.push({ pts: [{ x: 120, y: 300 }, { x: 820, y: 300 }, { x: 1060, y: 300 }], color: "#4a4a4a", w: 22, speed: 0.012, stopAt: 0.72 });
      w.pieces.push(piece("kapla", 820, 300, { w: 22, h: 160, caption: "puerta de vidrio (arrástrame)" }));
      w.pieces.push(piece("churro", 640, 500, { len: 220, thick: 18, color: "#c9844a", clickable: true, caption: "semiconductor" }));
      w.pieces.push(piece("linterna", 240, 500, { caption: "acércame al churro" }));
      w.labels.push({ x: 420, y: 220, text: "pasillo de cobre (conductor)" });
      w.labels.push({ x: 820, y: 190, text: "pared de vidrio (aislante)" });
      if (ph >= 2) {
        w.pieces.push(piece("potato", 240, 130, { static: true, caption: "Operation · en la fila" }));
        w.pieces.push(piece("card", 1040, 130, { n: "?", color: "#6a8eae", static: true, caption: "Guess Who · al lado" }));
      }
      w.pieces.push(piece("marble", 140, 300, { color: "#5c3a21", clickable: true, path: 0, s: 0, caption: "toca para rodar" }));
    },
    update() {
      const glass = world.pieces.find((pc) => pc.kind === "kapla");
      if (glass && world.paths[0]) {
        const blocking = Math.hypot(glass.x - 820, glass.y - 300) < 65;
        world.paths[0].stopAt = blocking ? 0.72 : 1;
      }
      if (world.flags.lastClick && world.flags.lastClick.kind === "marble") {
        const m = world.flags.lastClick;
        if ((m.s || 0) >= (world.paths[0].stopAt || 1) - 0.02) m.s = 0;
        m.roll = 1;
        world.flags.lastClick = null;
      }
      const lamp = world.pieces.find((pc) => pc.kind === "linterna");
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (lamp && ch) {
        const near = Math.hypot(lamp.x - ch.x, lamp.y - ch.y) < 120;
        ch.color = near ? "#f5c518" : "#c9844a";
        ch.caption = near ? "semiconductor (¡activo con luz!)" : "semiconductor (dormido)";
      }
    }
  };

  /* ---------- PISO III: 3.1 churro, 3.2 awg, 3.3 heatice, 3.4 bands ---------- */
  KINDS.churro = {
    setup(w) {
      w.sliders.push({ x: 80, y: 80, w: 220, min: 80, max: 360, v: 180, label: "largo (L)", key: "len" });
      w.sliders.push({ x: 80, y: 135, w: 220, min: 8, max: 36, v: 18, label: "grosor (A)", key: "thick" });
      w.sliders.push({ x: 80, y: 190, w: 220, min: 0, max: 2, v: 0, label: "material (ρ)", key: "mat" });
      w.pieces.push(piece("churro", 680, 360, { len: 180, thick: 18, color: "#e8c9a0", static: true, caption: "cobre (R = ρ·L/A)" }));
      w.meters.push({ label: "Facilidad de paso (1/R)", value: 0.7, max: 1, color: "#5e7a5e" });
      w.meters.push({ label: "Cansancio (Resistencia R)", value: 0.3, max: 1, color: "#c46a4a" });
      w.labels.push({ x: 680, y: 210, text: "Largo cansa. Flaco cansa. Material difícil cansa." });
    },
    update() {
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (!ch) return;
      ch.len = world.len || 180;
      ch.thick = world.thick || 18;
      const mat = world.mat || 0;
      const matName = mat > 1.2 ? "nicrom (difícil)" : mat > 0.6 ? "aluminio (medio)" : "cobre (fácil)";
      ch.color = mat > 1.2 ? "#6e4420" : mat > 0.6 ? "#c9844a" : "#e8c9a0";
      ch.caption = `${matName} · L=${Math.round(ch.len)} · A=${Math.round(ch.thick)}`;
      const flow = (ch.thick / 20) / ((ch.len / 180) * (1 + mat));
      world.meters[0].value = Math.max(0.05, Math.min(1, flow));
      world.meters[1].value = Math.max(0.05, Math.min(1, 1 - flow * 0.75));
    }
  };

  KINDS.awg = {
    setup(w, ph) {
      for (let i = 7; i >= 0; i--) {
        w.pieces.push(piece("tile", 640, 370, {
          r: 32 + i * 24, color: RAIN[i] + "aa", static: true, clickable: true, n: i
        }));
      }
      w.pieces.push(piece("nin", 220, 480, { caption: "viajero" }));
      w.labels.push({
        x: 640, y: 72,
        text: ph < 2
          ? "Toca cualquier arcoíris: el chico (#0) es hilo de hormiga; el grande (#7) es autopista."
          : "Regla del 3: cada 3 arcos hacia adentro, el área cae a la mitad y la resistencia se duplica."
      });
      w.meters.push({ label: "Hueco del túnel (Área)", value: 7, max: 7, color: "#5e7a5e" });
      w.meters.push({ label: "Número AWG (al revés)", value: 10, max: 30, color: "#7b4ea3" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n != null) {
        const idx = world.flags.lastClick.n;
        world.meters[0].value = idx;
        if (world.meters[1]) world.meters[1].value = 28 - idx * 2.5;
        const nin = world.pieces.find((pc) => pc.kind === "nin");
        // Se coloca al borde derecho del arco seleccionado sin tapar el centro
        if (nin) {
          const r = 32 + idx * 24;
          nin.x = 640 + r + 36;
          nin.y = 370;
          nin.caption = `Arco #${idx}`;
        }
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.heatice = {
    setup(w, ph) {
      w.sliders.push({ x: 80, y: 90, w: 260, min: 0, max: 1, v: 0.2, label: "calor (T)", key: "heat" });
      w.pieces.push(piece("churro", 620, 270, { len: 260, thick: 18, color: "#c9844a", static: true, caption: "cobre (PTC: +calor = +R)" }));
      w.pieces.push(piece("churro", 620, 380, { len: 260, thick: 18, color: "#e8c9a0", static: true, caption: "NTC (+calor = −R)" }));
      w.meters.push({ label: "Cansancio del cobre", value: 0.3, max: 1, color: "#c46a4a" });
      w.meters.push({ label: "Cansancio del NTC", value: 0.7, max: 1, color: "#5e7a5e" });
      if (ph >= 2) {
        for (let i = 0; i < 8; i++) {
          w.pieces.push(piece("ice", 460 + (i % 4) * 48, 500 + Math.floor(i / 4) * 44, { clickable: true, static: true, caption: "hielo" }));
        }
        w.meters.push({ label: "Superconductor (0 = sin queja)", value: 0, max: 1, color: "#3b6ea8" });
        w.labels.push({ x: 640, y: 615, text: "Con todos los hielos: resistencia CERO (superconductor). Toca los hielos para quitarlos." });
      }
    },
    update() {
      const h = world.heat || 0.2;
      world.meters[0].value = 0.25 + h * 0.7;
      world.meters[1].value = Math.max(0.08, 0.85 - h * 0.65);
      if (world.flags.lastClick && world.flags.lastClick.kind === "ice") {
        world.flags.lastClick.gone = true;
        world.pieces = world.pieces.filter((pc) => !pc.gone);
        world.flags.lastClick = null;
        world.flags.iceRemoved = (world.flags.iceRemoved || 0) + 1;
      }
      if (world.meters[2]) {
        const removed = world.flags.iceRemoved || 0;
        world.meters[2].value = Math.min(1, removed / 8);
      }
    }
  };

  KINDS.bands = {
    setup(w, ph) {
      if (ph === 0) {
        const bandData = [
          { col: "#e23d28", cap: "1ª: 2 (rojo)", val: 2 },
          { col: "#7b4ea3", cap: "2ª: 7 (violeta)", val: 7 },
          { col: "#f08c00", cap: "3ª: ×10³ (naranja)", val: 1000 },
          { col: "#d4a017", cap: "4ª: ±5% (oro)", val: 5 }
        ];
        bandData.forEach((b, i) => {
          w.pieces.push(piece("tile", 200, 160 + i * 110, { color: b.col, r: 30, caption: b.cap, bandIdx: i }));
        });
        w.targets.push({ x: 700, y: 360, r: 85, accept: "tile", label: "arma el tapón (27 kΩ)" });
        w.pieces.push(piece("churro", 700, 360, { len: 200, thick: 42, color: "#e8c9a0", static: true, caption: "resistor" }));
        w.meters.push({ label: "Bandas colocadas", value: 0, max: 4, color: "#d4a017" });
      } else if (ph === 1) {
        w.sliders.push({ x: 400, y: 200, w: 480, min: 0.2, max: 2, v: 1, label: "resistencia R", key: "flow" });
        w.meters.push({ label: "Conductancia G = 1 / R (Siemens)", value: 1, max: 2, color: "#5e7a5e" });
        w.labels.push({ x: 640, y: 360, text: "Lo fácil (G) es el inverso de lo difícil (R): G = 1 / R." });
      } else if (ph === 2) {
        for (let i = 0; i < 6; i++) {
          w.pieces.push(piece("tile", 220 + (i % 3) * 95, 220 + Math.floor(i / 3) * 110, {
            r: 28, color: RAIN[i], clickable: true, caption: "ficha " + (i + 1)
          }));
        }
        w.pieces.push(piece("bowl", 860, 360, { static: true, caption: "Perfection (continuidad)" }));
        w.targets.push({ x: 860, y: 360, r: 65, accept: "tile", label: "arrastra ficha aquí (¡PIII!)" });
        w.meters.push({ label: "Continuidad (pitido)", value: 0, max: 1, color: "#5e7a5e" });
      } else {
        w.pieces.push(piece("hippo", 640, 420, { clickable: true, caption: "varistor (guardián)" }));
        w.sliders.push({ x: 400, y: 180, w: 480, min: 0, max: 1, v: 0.2, label: "empujón (voltaje)", key: "height" });
        w.meters.push({ label: "Boca del hipopótamo (traga el rayo)", value: 0, max: 1, color: "#c46a4a" });
        w.labels.push({ x: 640, y: 560, text: "Con empujón normal no hace nada; si pasa de 0.7 abre la boca y protege la casa." });
      }
    },
    update() {
      if (phase === 0 && world.targets[0] && world.meters[0]) {
        const h = world.targets[0].held || 0;
        world.meters[0].value = h;
        const ch = world.pieces.find((p) => p.kind === "churro");
        if (ch && h >= 3) ch.caption = "27 × 1.000 = 27.000 Ω (27 kΩ)";
      }
      if (phase === 1 && world.meters[0]) world.meters[0].value = Math.min(2, 1 / (world.flow || 1));
      if (phase === 2 && world.targets[0] && world.meters[0]) {
        const hasTile = (world.targets[0].held || 0) > 0;
        if (hasTile && !world.meters[0].value) playMagicChime();
        world.meters[0].value = hasTile ? 1 : 0;
      }
      if (phase === 3 && world.meters[0]) {
        const high = (world.height || 0) > 0.7;
        world.meters[0].value = high ? 1 : 0;
        const hip = world.pieces.find((p) => p.kind === "hippo");
        if (hip) hip.caption = high ? "¡BOCA ABIERTA! (cortocircuito protector)" : "varistor vigilando (cerrado)";
      }
    }
  };

  /* ---------- PISO IV: 4.1 ohm, 4.2 power, 4.3 eff, 4.4 energy ---------- */
  KINDS.ohm = {
    setup(w, ph) {
      const names = w.variant === "hopkinson"
        ? ["Empujón-de-vueltas (F=N·I)", "Río magnético (Φ)", "Reluctancia (ℜ)"]
        : ["Empujón (V)", "Desfile (I)", "Cansancio (R)"];
      const cols = ["#c46a4a", "#6a8eae", "#5e7a5e"];
      names.forEach((n, i) => {
        w.pieces.push(piece("mouse", 300 + i * 320, 220, {
          color: cols[i], caption: n, static: true, clickable: true, idx: i
        }));
      });
      w.sliders.push({ x: 80, y: 80, w: 240, min: 0.3, max: 2.5, v: 1.2, label: "empujón (V)", key: "height" });
      w.sliders.push({ x: 80, y: 135, w: 240, min: 0.3, max: 3, v: 1.0, label: "cansancio (R)", key: "flow" });
      w.pieces.push(piece("churro", 640, 480, { len: 300, thick: 18, color: "#c9844a", static: true, caption: "tubo del desfile" }));
      w.meters.push({ label: names[1], value: 1.2, max: 2.5, color: cols[1] });
      w.labels.push({
        x: 640, y: 360,
        text: ph === 0
          ? "Toca cualquiera de los 3 ratones para taparlo y ver cómo los otros dos lo calculan."
          : "Mueve los controles: mismo empujón con más cansancio → desfile más flaco."
      });
    },
    update() {
      const V = world.height || 1.2, R = world.flow || 1;
      const I = V / R;
      world.meters[0].value = I;
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (ch) ch.thick = Math.max(6, Math.min(38, 8 + 16 * I));
      if (world.flags.coveredMouse != null && world.labels[0]) {
        const isHop = world.variant === "hopkinson";
        const formulas = isHop
          ? [
              `Tapaste EMPUJÓN (F): F = Φ × ℜ = ${(I * R).toFixed(2)}`,
              `Tapaste RÍO (Φ): Φ = F ÷ ℜ = ${I.toFixed(2)}`,
              `Tapaste RELUCTANCIA (ℜ): ℜ = F ÷ Φ = ${R.toFixed(2)}`
            ]
          : [
              `Tapaste EMPUJÓN (V): V = I × R = ${V.toFixed(2)} V`,
              `Tapaste DESFILE (I): I = V ÷ R = ${I.toFixed(2)} A`,
              `Tapaste CANSANCIO (R): R = V ÷ I = ${R.toFixed(2)} Ω`
            ];
        world.labels[0].text = formulas[world.flags.coveredMouse];
      }
    }
  };

  // 4.2 power: Propio minijuego de Potencia P = V·I = I²·R = V²/R (sin clonar ramp)
  KINDS.power = {
    setup(w, ph) {
      w.sliders.push({ x: 80, y: 80, w: 250, min: 0.5, max: 3, v: 1.5, label: "empujón (V)", key: "height" });
      w.sliders.push({ x: 80, y: 135, w: 250, min: 0.5, max: 3, v: 1.5, label: "desfile (I)", key: "flow" });
      w.pieces.push(piece("lamp", 480, 340, { on: true, static: true, r: 50, caption: "lámpara (brillo = P)" }));
      w.pieces.push(piece("churro", 820, 340, { len: 220, thick: 24, color: "#c9844a", static: true, caption: "calor (I²·R)" }));
      w.pieces.push(piece("bowl", 650, 540, { static: true, caption: "monedas por minuto (Watts)" }));
      w.meters.push({ label: "Potencia P = V × I (W)", value: 2.25, max: 9, color: "#f5c518" });
      w.meters.push({ label: "Calor de pérdidas (I²·R)", value: 2.25, max: 9, color: "#e23d28" });
      w.labels.push({
        x: 650, y: 200,
        text: ph < 2
          ? "La riqueza por minuto es Empujón × Desfile (P = V × I)."
          : "Cuidado con el desfile: si duplicas I, ¡el calor (I²·R) se multiplica por CUATRO!"
      });
    },
    update() {
      const V = world.height || 1.5;
      const I = world.flow || 1.5;
      const P = V * I;
      const heatLoss = I * I;
      world.meters[0].value = P;
      world.meters[1].value = heatLoss;
      const ch = world.pieces.find((p) => p.kind === "churro");
      if (ch) {
        ch.color = heatLoss > 4.5 ? "#e23d28" : heatLoss > 2 ? "#f08c00" : "#c9844a";
        ch.thick = 16 + heatLoss * 2.5;
        ch.caption = `Calor I²·R = ${heatLoss.toFixed(1)} W`;
      }
      const lamp = world.pieces.find((p) => p.kind === "lamp");
      if (lamp) {
        lamp.r = 36 + P * 3.5;
        lamp.caption = `P = ${V.toFixed(1)} × ${I.toFixed(1)} = ${P.toFixed(1)} W`;
      }
    }
  };

  KINDS.eff = {
    setup(w, ph) {
      [280, 640, 1000].forEach((x, i) => {
        w.pieces.push(piece("bowl", x, 380, { static: true }));
        w.targets.push({ x, y: 380, r: 65, accept: "marble", label: ["1. Salieron (Fuente)", "2. Perdidas en calor", "3. Llegaron (Casa)"][i] });
      });
      for (let i = 0; i < 10; i++) {
        w.pieces.push(piece("marble", 80 + (i % 2) * 38, 130 + Math.floor(i / 2) * 44, { color: "#6a8eae" }));
      }
      if (ph >= 1) {
        w.pieces.push(piece("potato", 640, 170, { static: true, caption: "Eslabón flojo: η_total = η₁ × η₂" }));
      }
      w.meters.push({ label: "Eficiencia η = Llegaron / Total", value: 0, max: 1, color: "#5e7a5e" });
      w.labels.push({ x: 640, y: 72, text: "Reparte las canicas entre las que se pierden en el camino y las que llegan a casa." });
    },
    update() {
      const held = world.targets.map((t) => t.held || 0);
      const totalUsed = held[0] + held[1] + held[2];
      // Eficiencia acotada en [0, 1]: las que llegan a la casa respecto al total puesto en juego
      if (totalUsed > 0) {
        world.meters[0].value = Math.min(1, held[2] / Math.max(1, held[1] + held[2], held[0]));
      } else {
        world.meters[0].value = 0;
      }
    }
  };

  KINDS.energy = {
    setup(w, ph) {
      w.pieces.push(piece("lamp", 640, 280, { on: true, static: true, clickable: true, toggle: "lamp", r: 48, caption: "toca para encender/apagar" }));
      w.sliders.push({ x: 360, y: 120, w: 520, min: 1, max: 4, v: 1, label: "horas encendida (t)", key: "height" });
      w.meters.push({ label: "Brillo / Potencia (kW)", value: 1, max: 1, color: "#f5c518" });
      w.meters.push({ label: "Factura de Energía E = P × t (kWh)", value: 1, max: 4, color: "#d4a017" });
      w.labels.push({
        x: 640, y: 500,
        text: ph < 2
          ? "La potencia es qué tan fuerte brilla; la energía (kWh) es potencia × tiempo encendido."
          : "Si apagas la lámpara, la potencia cae a 0 y el cobro se detiene."
      });
    },
    update() {
      const lamp = world.pieces.find((p) => p.kind === "lamp");
      const isOn = lamp && lamp.on ? 1 : 0;
      const hrs = world.height || 1;
      world.meters[0].value = isOn;
      world.meters[1].value = isOn * hrs;
    }
  };

  /* ---------- PISO V: 5.1–5.4 series y 5.3 divider ---------- */
  KINDS.series = {
    setup(w, ph) {
      const open = w.variant === "fuse" && ph >= 1;
      w.paths.push({ pts: [{ x: 120, y: 360 }, { x: 400, y: 360 }, { x: 640, y: 360 }, { x: 1140, y: 360 }], color: "#4a4a4a", w: 20, open: !open, speed: 0.01 });
      w.pieces.push(piece("car", 140, 360, { clickable: true, path: 0, s: 0, caption: "toca para avanzar" }));
      if (w.variant === "sum") {
        w.pieces.push(piece("churro", 400, 360, { len: 90, thick: 16, color: "#e8c9a0", static: true, caption: "R₁ = 2 Ω" }));
        w.pieces.push(piece("churro", 640, 360, { len: 110, thick: 16, color: "#c9844a", static: true, caption: "R₂ = 3 Ω" }));
        w.pieces.push(piece("churro", 900, 360, { len: 130, thick: 16, color: "#8b5a2b", static: true, caption: "R₃ = 4 Ω" }));
        w.labels.push({ x: 640, y: 160, text: "En serie los cansancios se suman: R_total = 2 + 3 + 4 = 9 Ω." });
        w.meters.push({ label: "Cansancio total (R₁+R₂+R₃)", value: 0.35 + ph * 0.2, max: 1, color: "#c46a4a" });
      } else if (w.variant === "fuse") {
        w.pieces.push(piece("ice", 640, 360, { clickable: true, caption: "puente/fusible (tócame o sácame)" }));
        w.labels.push({ x: 640, y: 140, text: "Toca o saca el cubito de en medio: si se abre un punto, se apaga toda la fila." });
      } else {
        for (let i = 0; i < 3; i++) {
          w.pieces.push(piece("nin", 400 + i * 220, 260, { static: true, caption: "cuenta el mismo desfile" }));
        }
        w.labels.push({ x: 640, y: 150, text: "Un solo camino: los tres Nins ven pasar exactamente el mismo desfile (I₁ = I₂ = I₃)." });
      }
    },
    update() {
      const ice = world.pieces.find((p) => p.kind === "ice");
      if (world.variant === "fuse" && ice && world.paths[0]) {
        const inPlace = Math.hypot(ice.x - 640, ice.y - 360) < 45 && !ice.pulledOut;
        world.paths[0].open = inPlace;
      }
      if (world.flags.lastClick && world.flags.lastClick.kind === "ice") {
        const ic = world.flags.lastClick;
        ic.pulledOut = !ic.pulledOut;
        ic.y = ic.pulledOut ? 220 : 360;
        world.paths[0].open = !ic.pulledOut;
        world.flags.lastClick = null;
      }
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        const car = world.flags.lastClick;
        if ((car.s || 0) >= 0.98) car.s = 0;
        car.roll = world.paths[0].open === false ? 0 : 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.divider = {
    setup(w) {
      w.sliders.push({ x: 80, y: 80, w: 260, min: 1, max: 9, v: 5, label: "tramo R₃", key: "load" });
      [1, 3, 5].forEach((n, i) => {
        w.pieces.push(piece("block", 400 + i * 200, 480 - n * 32, {
          color: RAIN[n], r: 42, static: true, idx: i, caption: `R${i + 1} = ${n} Ω`
        }));
        w.pieces.push(piece("nin", 400 + i * 200, 480 - n * 32 - 58, { static: true, idx: i }));
      });
      w.labels.push({ x: 640, y: 120, text: "Ley de voltajes de Kirchhoff: el tramo más duro se lleva la tajada más grande." });
      w.meters.push({ label: "Tajada de voltaje en R₃ (V₃ / V_total)", value: 5 / 9, max: 1, color: "#c46a4a" });
    },
    update() {
      const r3 = Math.round((world.load || 5) * 10) / 10;
      const total = 1 + 3 + r3;
      world.meters[0].value = r3 / total;
      const b3 = world.pieces.find((p) => p.kind === "block" && p.idx === 2);
      if (b3) {
        b3.caption = `R₃ = ${r3} Ω (${Math.round((r3 / total) * 100)}% del empujón)`;
      }
    }
  };

  /* ---------- PISO VI: 6.1–6.4 parallel y 6.3 kcl ---------- */
  KINDS.parallel = {
    setup(w, ph) {
      w.pieces.push(piece("house", 160, 320, { static: true, caption: "Nudo A (9 V)", color: "#e8d7b8" }));
      w.pieces.push(piece("house", 1120, 320, { static: true, caption: "Nudo B (0 V)", color: "#d7e6d2" }));
      w.paths.push({ pts: [{ x: 220, y: 240 }, { x: 1060, y: 240 }], color: "#5e7a5e", w: 18, speed: 0.014, open: true });
      w.paths.push({ pts: [{ x: 220, y: 400 }, { x: 1060, y: 400 }], color: "#c46a4a", w: 10, speed: 0.007, open: true });
      w.pieces.push(piece("car", 240, 240, { color: "#5e7a5e", clickable: true, path: 0, s: 0, caption: "rama ancha (rápida)" }));
      w.pieces.push(piece("car", 240, 400, { color: "#c46a4a", clickable: true, path: 1, s: 0, caption: "rama angosta (lenta)" }));
      if (w.variant === "fuse") {
        w.pieces.push(piece("lamp", 640, 180, { on: true, static: true, clickable: true, toggle: "lamp", branch: 0, caption: "lámpara 1 (tócame)" }));
        w.pieces.push(piece("lamp", 640, 460, { on: true, static: true, clickable: true, toggle: "lamp", branch: 1, caption: "lámpara 2 (tócame)" }));
        w.labels.push({ x: 640, y: 80, text: "Apaga una lámpara: la otra rama sigue encendida y con el mismo empujón." });
      } else if (w.variant === "easy") {
        w.pieces.push(piece("hippo", 640, 560, { clickable: true, caption: "dos caminos = menos espera que uno solo" }));
        w.labels.push({ x: 640, y: 90, text: "La rama de arriba (más ancha) deja pasar el doble de coches que la de abajo." });
      } else {
        w.labels.push({ x: 640, y: 90, text: "En paralelo ambas ramas comparten los mismos dos nudos (Casa A y Casa B)." });
      }
      if (ph >= 2 && w.variant === "fuse") {
        w.pieces.push(piece("kapla", 640, 320, { w: 18, h: 190, caption: "cortocircuito (puente liso)" }));
      }
    },
    update() {
      if (world.variant === "fuse") {
        const lamps = world.pieces.filter((p) => p.kind === "lamp");
        lamps.forEach((l) => {
          if (world.paths[l.branch]) world.paths[l.branch].open = l.on;
        });
      }
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        const car = world.flags.lastClick;
        if ((car.s || 0) >= 0.98) car.s = 0;
        car.roll = 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.kcl = {
    setup(w) {
      w.pieces.push(piece("bowl", 640, 360, { static: true, r: 110, caption: "nudo (nada se esconde)" }));
      w.targets.push({ x: 640, y: 360, r: 85, accept: "marble", label: "entra 3+2+4 = 9" });
      [[200, 180], [200, 350], [200, 520]].forEach(([x, y], i) => {
        const count = [3, 2, 4][i];
        w.labels.push({ x, y: y - 40, text: `Rama ${i + 1}: entran ${count}` });
        for (let k = 0; k < count; k++) {
          w.pieces.push(piece("marble", x + k * 24, y, { color: RAIN[i] }));
        }
      });
      w.labels.push({ x: 1020, y: 240, text: "Por arriba salen 5" });
      w.labels.push({ x: 1020, y: 480, text: "Por abajo salen: 9 − 5 = 4" });
      w.meters.push({ label: "Canicas en el nudo (de 9)", value: 0, max: 9, color: "#7b4ea3" });
    },
    update() {
      const held = world.targets[0] ? world.targets[0].held || 0 : 0;
      world.meters[0].value = held;
    }
  };

  /* ---------- PISO VII: 7.1 nest, 7.2 ladder, 7.3 pot, 7.4 meters ---------- */
  KINDS.nest = {
    setup(w, ph) {
      for (let i = 5; i >= 0; i--) {
        w.pieces.push(piece("tile", 640, 370, {
          r: 34 + i * 26, color: RAIN[i], static: true, clickable: true, n: i,
          caption: i === 0 ? "0 (adentro)" : ""
        }));
      }
      w.labels.push({
        x: 640, y: 80,
        text: ph < 2
          ? "Reducción serie-paralelo: toca los cuadros desde el más chico (#0 adentro) hacia afuera (#5)."
          : "Cada vez que resuelves el paréntesis de adentro, el circuito se encoge un piso."
      });
      w.flags.nextExpected = 0;
      w.meters.push({ label: "Capas resueltas (de adentro afuera)", value: 0, max: 6, color: "#7b4ea3" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n != null) {
        const clickedN = world.flags.lastClick.n;
        world.flags.lastClick = null;
        if (clickedN === world.flags.nextExpected) {
          world.flags.nextExpected++;
          world.meters[0].value = world.flags.nextExpected;
          world.labels[0].text = world.flags.nextExpected === 6
            ? "¡Perfecto! Resolviste las 6 capas desde adentro hacia afuera."
            : `¡Bien! Capa #${clickedN} reducida. Ahora toca la capa #${world.flags.nextExpected}.`;
          if (world.flags.nextExpected === 6) playMagicChime();
        } else {
          world.labels[0].text = `¡Empieza por adentro! Toca primero la capa #${world.flags.nextExpected}.`;
        }
      }
    }
  };

  KINDS.ladder = {
    setup(w) {
      for (let i = 0; i < 4; i++) {
        // i=0 es el peldaño de abajo (el más lejano a la fuente, orden 0)
        w.pieces.push(piece("kapla", 640, 520 - i * 95, { w: 240 - i * 20, h: 16, static: true }));
        w.pieces.push(piece("nin", 640, 485 - i * 95, {
          clickable: true, static: true, stepIdx: i,
          caption: i === 0 ? "1º último peldaño (fondo)" : `peldaño ${4 - i}`
        }));
      }
      w.labels.push({ x: 640, y: 80, text: "Escalera: toca los Nins empezando por el último peldaño (abajo) hacia arriba." });
      w.flags.nextRung = 0;
      w.meters.push({ label: "Peldaños plegados desde el fondo", value: 0, max: 4, color: "#5e7a5e" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "nin" && world.flags.lastClick.stepIdx != null) {
        const idx = world.flags.lastClick.stepIdx;
        world.flags.lastClick = null;
        if (idx === world.flags.nextRung) {
          world.flags.nextRung++;
          world.meters[0].value = world.flags.nextRung;
          world.labels[0].text = world.flags.nextRung === 4
            ? "¡Escalera resuelta! Plegaste todos los peldaños hasta la entrada."
            : `¡Correcto! Peldaño plegado. Sube al siguiente peldaño.`;
          if (world.flags.nextRung === 4) playMagicChime();
        } else {
          world.labels[0].text = "¡Por ahí se enreda! Toca primero el peldaño más lejano que queda abajo.";
        }
      }
    }
  };

  KINDS.pot = {
    setup(w) {
      w.pieces.push(piece("kapla", 640, 360, { w: 520, h: 18, static: true, caption: "pista del potenciómetro" }));
      w.pieces.push(piece("nin", 640, 325, { static: true, caption: "cursor (grifo)" }));
      w.pieces.push(piece("hippo", 1000, 500, { caption: "carga golosa (arrástrame al Nin)" }));
      w.pieces.push(piece("marble", 280, 500, { color: "#f0e6d2", caption: "carga educada (alta R)" }));
      w.sliders.push({ x: 380, y: 150, w: 520, min: 0, max: 1, v: 0.5, label: "posición del grifo", key: "height" });
      w.meters.push({ label: "Voltaje en el grifo (V_out)", value: 0.5, max: 1, color: "#c46a4a" });
      w.labels.push({ x: 640, y: 75, text: "Mueve el grifo. Si acercas el hipopótamo goloso al Nin, el voltaje se hunde (efecto de carga)." });
    },
    update() {
      const nin = world.pieces.find((pc) => pc.kind === "nin");
      const hip = world.pieces.find((pc) => pc.kind === "hippo");
      if (nin) nin.x = 380 + (world.height != null ? world.height : 0.5) * 520;
      let v = world.height != null ? world.height : 0.5;
      // Efecto de carga real: el hipopótamo (baja R_L) hace caer la tensión del divisor
      if (hip && nin && Math.hypot(hip.x - nin.x, hip.y - nin.y) < 130) {
        v = Math.max(0.05, v * 0.55);
        nin.caption = "cursor (¡hundido por carga golosa!)";
      } else if (nin) {
        nin.caption = "cursor (sin carga pesada)";
      }
      world.meters[0].value = v;
    }
  };

  KINDS.meters = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 140, y: 400 }, { x: 1140, y: 400 }], color: "#4a4a4a", w: 18 });
      w.pieces.push(piece("potato", 360, 220, { caption: "Amperímetro (en la fila)" }));
      w.pieces.push(piece("card", 640, 220, { n: "V", color: "#6a8eae", caption: "Voltímetro (al lado)" }));
      w.pieces.push(piece("tile", 920, 220, { color: "#5e7a5e", caption: "Óhmetro (sin batería)" }));
      w.targets.push({ x: 420, y: 400, r: 65, accept: "potato", label: "en serie (en la fila)" });
      w.targets.push({ x: 760, y: 490, r: 65, accept: "card,tile", label: "en paralelo (al lado)" });
      w.meters.push({ label: "Instrumentos bien conectados", value: 0, max: 2, color: "#5e7a5e" });
      w.labels.push({
        x: 640, y: 80,
        text: ph === 0
          ? "Arrastra el Amperímetro al círculo de la fila (serie)."
          : ph === 1
          ? "Arrastra el Voltímetro al círculo de al lado (paralelo)."
          : "El Óhmetro siempre se usa con el circuito apagado."
      });
    },
    update() {
      const total = world.targets.reduce((acc, t) => acc + (t.held || 0), 0);
      if (world.meters[0]) world.meters[0].value = total;
    }
  };

  /* ---------- PISO VIII: 8.1 isource, 8.2 disguise, 8.3 mesh, 8.4 diamond ---------- */
  KINDS.isource = {
    setup(w, ph) {
      w.pieces.push(piece("caterpillar", 300, 250, { clickable: true, caption: "fuente de corriente (paso fijo)" }));
      w.paths.push({ pts: [{ x: 200, y: 500 }, { x: 1000, y: 240 }], color: "#e67e22", w: 16, speed: 0.012 });
      w.pieces.push(piece("car", 220, 490, { clickable: true, path: 0, s: 0, caption: "toca para lanzar" }));
      // Empieza en x=520 para no bloquear la salida hasta que el usuario lo arrastre al final (>800)
      w.pieces.push(piece("churro", 520, 560, { len: 140, thick: 20, color: "#c9844a", caption: "tapón (arrástrame a la derecha)" }));
      w.labels.push({
        x: 640, y: 80,
        text: ph < 2
          ? "El gusanito impone el desfile fijo (I); la rampa impone la altura fija (V)."
          : "Si arrastras el tapón al final de la rampa (derecha), el coche se frena."
      });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        const tap = world.pieces.find((pc) => pc.kind === "churro");
        const car = world.flags.lastClick;
        if ((car.s || 0) >= 0.98) car.s = 0;
        const blocked = tap && tap.x > 800 && tap.y < 360;
        car.roll = blocked ? 0 : 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.disguise = {
    setup(w, ph) {
      w.pieces.push(piece("robot", 400, 340, { clickable: true, static: true, caption: "Thévenin / Norton (tócame)" }));
      w.pieces.push(piece("potato", 780, 380, { static: true, caption: "caja equivalente" }));
      w.pieces.push(piece("hat", 780, 210, { color: RAIN[2], clickable: true, wear: true, caption: "disfraz serie/paralelo" }));
      w.pieces.push(piece("nin", 1060, 400, { static: true, caption: "Nin-carga (recibe el mismo desfile)" }));
      w.meters.push({ label: "Desfile entregado al Nin-carga", value: 1, max: 1, color: "#5e7a5e" });
      w.labels.push({
        x: 640, y: 80,
        text: ph < 2
          ? "Toca el Transformer o el sombrero: cambie como cambie por dentro, el Nin-carga recibe lo mismo."
          : "Fuente de voltaje en serie con R = Fuente de corriente en paralelo con la misma R."
      });
    },
    update() {
      const rob = world.pieces.find((p) => p.kind === "robot");
      if (rob) {
        rob.caption = rob.altForm ? "Modo Norton (I en paralelo con R)" : "Modo Thévenin (V en serie con R)";
      }
    }
  };

  KINDS.mesh = {
    setup(w) {
      w.sliders.push({ x: 80, y: 80, w: 220, min: 1, max: 6, v: 4, label: "malla 1 (I₁)", key: "height" });
      w.sliders.push({ x: 80, y: 135, w: 220, min: 1, max: 6, v: 1.5, label: "malla 2 (I₂)", key: "flow" });
      w.pieces.push(piece("tile", 490, 350, { r: 95, color: "#6a8eae55", static: true, caption: "Malla 1 (horaria)" }));
      w.pieces.push(piece("tile", 790, 350, { r: 95, color: "#c46a4a55", static: true, caption: "Malla 2 (horaria)" }));
      w.pieces.push(piece("kapla", 640, 350, { w: 18, h: 180, static: true, caption: "pared compartida (I₁ − I₂)" }));
      w.meters.push({ label: "Corriente neta en pared central |I₁ − I₂|", value: 2.5, max: 6, color: "#7b4ea3" });
      w.labels.push({ x: 640, y: 80, text: "Mueve las corrientes de Malla 1 y Malla 2: en la pared compartida se restan." });
    },
    update() {
      const i1 = world.height || 4;
      const i2 = world.flow || 1.5;
      const diff = Math.abs(i1 - i2);
      world.meters[0].value = diff;
      const wall = world.pieces.find((p) => p.kind === "kapla");
      if (wall) wall.caption = `pared compartida: ${i1.toFixed(1)} − ${i2.toFixed(1)} = ${(i1 - i2).toFixed(1)} A`;
    }
  };

  KINDS.diamond = {
    setup(w, ph) {
      const nums = ph === 0 ? [5, 20, 5, 10] : [5, 10, 10, 5];
      const pos = [[480, 200], [800, 200], [480, 500], [800, 500]];
      nums.forEach((n, i) => w.pieces.push(piece("card", pos[i][0], pos[i][1], {
        n, color: RAIN[i], static: true, caption: `R${i + 1} = ${n} Ω`
      })));
      w.pieces.push(piece("marble", 640, 350, { color: "#5c3a21", caption: "puente central" }));
      w.meters.push({ label: "Corriente por el puente central", value: ph === 0 ? 0.8 : 0, max: 1, color: "#c46a4a" });
      w.labels.push({
        x: 640, y: 80,
        text: ph === 0
          ? "Desequilibrado (5×10 ≠ 20×5): la canica se desliza por el puente central."
          : "Puente de Wheatstone en equilibrio (5×10 = 5×10): por el medio no pasa nada (0 A)."
      });
    },
    update() {
      const m = world.pieces.find((pc) => pc.kind === "marble");
      if (!m || m.grabbed) return;
      if (phase === 0) {
        m.x += (780 - m.x) * 0.02;
        m.y += (350 - m.y) * 0.02;
      } else {
        m.x += (640 - m.x) * 0.08;
        m.y += (350 - m.y) * 0.08;
      }
    }
  };

  /* ---------- PISO IX: 9.1 super, 9.2 box, 9.3 match, 9.4 echo ---------- */
  KINDS.super = {
    setup(w, ph) {
      w.pieces.push(piece("lamp", 400, 240, { on: ph !== 1, static: true, clickable: true, toggle: "lamp", caption: "Fuente A (1 A)" }));
      w.pieces.push(piece("lamp", 880, 240, { on: ph !== 0, static: true, clickable: true, toggle: "lamp", caption: "Fuente B (1 A)" }));
      w.pieces.push(piece("churro", 640, 460, { len: 260, thick: 20, color: "#c9844a", static: true, caption: "calor I²·R (no lineal)" }));
      w.labels.push({
        x: 640, y: 80,
        text: ph < 3
          ? "Superposición: toca las fuentes. Las corrientes sí se suman (1 + 1 = 2)."
          : "¡Cuidado! Con las dos fuentes encendidas el calor no es el doble, es CUATRO veces (2² = 4)."
      });
      w.meters.push({ label: "Corriente I_A + I_B (lineal)", value: 1, max: 2, color: "#6a8eae" });
      w.meters.push({ label: "Calor (I_A + I_B)² (cuadrático)", value: 1, max: 4, color: "#e23d28" });
    },
    update() {
      const lamps = world.pieces.filter((pc) => pc.kind === "lamp");
      const active = lamps.filter((l) => l.on).length;
      world.meters[0].value = active;
      world.meters[1].value = active * active;
    }
  };

  KINDS.box = {
    setup(w) {
      w.pieces.push(piece("house", 640, 320, { r: 105, static: true, caption: "Caja Negra (V_th = 12 V, R_th = 4 Ω)" }));
      w.pieces.push(piece("card", 300, 500, { n: "V", color: "#6a8eae", caption: "1. Medir circuito abierto (V_th)" }));
      w.pieces.push(piece("kapla", 980, 500, { w: 90, h: 22, caption: "2. Medir cortocircuito (I_cc)" }));
      w.targets.push({ x: 640, y: 460, r: 75, accept: "card,kapla", label: "conecta a los 2 bornes" });
      w.meters.push({ label: "Voltaje en bornes (V)", value: 12, max: 12, color: "#6a8eae" });
      w.meters.push({ label: "Corriente en bornes (A)", value: 0, max: 3, color: "#c46a4a" });
      w.labels.push({ x: 640, y: 80, text: "Sin abrir la caja: acerca la carta V (mide V_th = 12 V) o el listón (mide I_cc = 3 A → R_th = 12/3 = 4 Ω)." });
    },
    update() {
      const card = world.pieces.find((p) => p.kind === "card");
      const kap = world.pieces.find((p) => p.kind === "kapla");
      const cardIn = card && Math.hypot(card.x - 640, card.y - 460) < 95;
      const kapIn = kap && Math.hypot(kap.x - 640, kap.y - 460) < 95;
      if (kapIn) {
        world.meters[0].value = 0;
        world.meters[1].value = 3;
      } else if (cardIn) {
        world.meters[0].value = 12;
        world.meters[1].value = 0;
      } else {
        world.meters[0].value = 12;
        world.meters[1].value = 0;
      }
    }
  };

  KINDS.match = {
    setup(w) {
      [1, 2, 4, 8].forEach((n, i) => {
        w.pieces.push(piece("kapla", 260 + i * 240, 420, {
          w: 28, h: 36 + n * 18, static: true, clickable: true, n,
          caption: `Carga R_L = ${n} Ω`
        }));
      });
      w.labels.push({ x: 640, y: 110, text: "La caja tiene R_interna = 4 Ω. Toca cada carga: el máximo tesoro se entrega cuando R_L = 4 Ω." });
      w.meters.push({ label: "Potencia entregada a la carga", value: 0, max: 4, color: "#d4a017" });
      w.meters.push({ label: "Eficiencia η (en R_L=4 Ω es 50%)", value: 0, max: 1, color: "#5e7a5e" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n) {
        const rl = world.flags.lastClick.n;
        const rth = 4;
        // P_norm = 4 * rth * rl / (rth + rl)^2 * 4
        const pNorm = (4 * rth * rl) / ((rth + rl) * (rth + rl)) * 4;
        const eff = rl / (rth + rl);
        world.meters[0].value = pNorm;
        world.meters[1].value = eff;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.echo = {
    setup(w, ph) {
      const cols = ["#c46a4a", "#f5c518", "#5e7a5e", "#6a8eae"];
      cols.forEach((c, i) => w.pieces.push(piece("tile", 300 + i * 220, 360, {
        color: c, r: 44, static: true, clickable: true, n: i,
        caption: i === 0 ? "Puerta A (10 V)" : i === 3 ? "Puerta B (10 V)" : `Tramo ${i}`
      })));
      w.flags.seq = [];
      w.labels.push({
        x: 640, y: 110,
        text: ph === 0
          ? "Reciprocidad: toca Puerta A o Puerta B. El eco que llega al otro extremo vale exactamente lo mismo."
          : "Poner la fuente en A y medir corriente en B da igual que poner la fuente en B y medir en A."
      });
      w.meters.push({ label: "Corriente en el otro extremo (A ↔ B)", value: 0, max: 4, color: "#7b4ea3" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n != null) {
        world.flags.seq.push(world.flags.lastClick.n);
        world.meters[0].value = 2.5;
        world.flags.lastClick = null;
      }
    }
  };

  /* ---------- PISO X: 10.1 cap, 10.2 tau, 10.3 cap(bank), 10.4 sq ---------- */
  KINDS.cap = {
    setup(w, ph) {
      w.pieces.push(piece("plate", 540, 340, { color: "#c46a4a", caption: "placa +" }));
      w.pieces.push(piece("plate", 740, 340, { color: "#6a8eae", caption: "placa −" }));
      w.pieces.push(piece("silk", 260, 260, { color: "#f3c6d8", r: 58, caption: "dieléctrico (mételo en medio)" }));
      w.sliders.push({ x: 360, y: 90, w: 560, min: 60, max: 320, v: 200, label: "separación d", key: "height" });
      w.meters.push({ label: "Campo eléctrico E = V / d", value: 0.6, max: 1, color: "#c46a4a" });
      w.meters.push({ label: "Capacidad C = ε·A / d", value: 0.5, max: 1, color: "#6a8eae" });
      if (w.variant === "bank" || ph >= 2) {
        w.pieces.push(piece("bowl", 260, 560, { static: true, r: 75, caption: "Paralelo: C₁ + C₂ (más ancho)" }));
        w.pieces.push(piece("bowl", 430, 560, { static: true, r: 75 }));
        w.pieces.push(piece("bowl", 960, 500, { static: true, r: 70, caption: "Serie: menos capacidad" }));
        w.pieces.push(piece("bowl", 960, 610, { static: true, r: 70 }));
      }
    },
    update() {
      const plates = world.pieces.filter((pc) => pc.kind === "plate");
      const silk = world.pieces.find((pc) => pc.kind === "silk");
      const slider = world.sliders[0];
      if (plates[0] && plates[1]) {
        if (plates[0].grabbed || plates[1].grabbed) {
          const dist = Math.max(60, Math.min(320, Math.abs(plates[1].x - plates[0].x)));
          world.height = dist;
          if (slider) slider.v = dist;
        } else {
          const d = world.height || 200;
          plates[0].x = 640 - d / 2;
          plates[1].x = 640 + d / 2;
        }
      }
      const d = world.height || 200;
      const hasDielectric = silk && Math.hypot(silk.x - 640, silk.y - 340) < 100;
      const eps = hasDielectric ? 1.8 : 1.0;
      world.meters[0].value = Math.min(1, 90 / d);
      world.meters[1].value = Math.min(1, (85 * eps) / d);
    }
  };

  KINDS.tau = {
    setup(w) {
      const isL = w.variant === "L";
      w.pieces.push(piece("bowl", 640, 400, { static: true, r: 120, caption: isL ? "ovillo L (τ = L / R)" : "cubo C (τ = R · C)" }));
      w.targets.push({ x: 640, y: 400, r: 85, accept: "marble", label: isL ? "desfile (63% en 1τ)" : "carga (63% en 1τ)" });
      w.sliders.push({ x: 80, y: 90, w: 260, min: 0.4, max: 2.5, v: 1, label: "constante τ", key: "flow" });
      for (let i = 0; i < 15; i++) {
        w.pieces.push(piece("marble", 80 + (i % 3) * 34, 170 + Math.floor(i / 3) * 38, { color: isL ? "#c46a4a" : "#6a8eae" }));
      }
      w.meters.push({ label: "Llenado exponencial (1 − e⁻ᵗ/τ)", value: 0, max: 1, color: "#7b4ea3" });
      w.labels.push({ x: 760, y: 110, text: "A 1 τ se llena el 63,2%. A los 5 τ (99,3%) ya se da por lleno." });
    },
    update() {
      const held = world.targets[0] ? world.targets[0].held || 0 : 0;
      const tau = world.flow || 1;
      world.meters[0].value = 1 - Math.exp(-held / (3 * tau));
    }
  };

  KINDS.sq = {
    setup(w) {
      const isL = w.variant === "L";
      w.sliders.push({ x: 80, y: 90, w: 280, min: 1, max: 4, v: 1, label: isL ? "desfile I" : "voltaje V", key: "height" });
      w.meters.push({ label: isL ? "Energía E = ½·L·I² (crece al cuadrado)" : "Energía E = ½·C·V² (crece al cuadrado)", value: 1, max: 16, color: "#d4a017" });
      w.labels.push({ x: 720, y: 180, text: "Si duplicas la entrada (×2), la energía guardada se multiplica por CUATRO (×4)." });
    },
    draw(p, w) {
      const h = Math.round(w.height || 1);
      const count = h * h;
      p.push();
      for (let i = 0; i < count; i++) {
        const cx = 480 + (i % 4) * 78;
        const cy = 280 + Math.floor(i / 4) * 78;
        if (!drawLoadedImage(p, imgs["bill-1"], cx, cy, 62, 62)) {
          p.fill("#d4a017");
          p.circle(cx, cy, 52);
        }
      }
      p.pop();
    },
    update() {
      const h = world.height || 1;
      world.meters[0].value = h * h;
    }
  };

  /* ---------- PISO XI: 11.1 flux, 11.2 gap, 11.3 ohm(hopkinson), 11.4 memory ---------- */
  KINDS.flux = {
    setup(w) {
      w.paths.push({ pts: [{ x: 120, y: 360 }, { x: 500, y: 360 }, { x: 640, y: 360 }, { x: 780, y: 360 }, { x: 1160, y: 360 }], color: "#7b4ea3", w: 70 });
      w.pieces.push(piece("kapla", 640, 360, { w: 44, h: 180, static: true, caption: "cuello angosto (menor área A)" }));
      for (let i = 0; i < 10; i++) {
        w.pieces.push(piece("marble", 200 + (i % 2) * 38, 200 + Math.floor(i / 2) * 38, { color: "#7b4ea3" }));
      }
      w.pieces.push(piece("varita", 220, 110, { caption: "imán (acércalo a las canicas)" }));
      w.labels.push({ x: 640, y: 80, text: "Acerca la varita imantada para llevar las canicas al cuello: mismo flujo Φ en menos área = más densidad B." });
      w.meters.push({ label: "Densidad B = Φ / A en el cuello", value: 0.3, max: 1, color: "#7b4ea3" });
    },
    update() {
      const wand = world.pieces.find((p) => p.kind === "varita");
      if (wand && wand.grabbed) {
        world.pieces.forEach((m) => {
          if (m.kind === "marble" && !m.grabbed && Math.hypot(wand.x - m.x, wand.y - m.y) < 180) {
            m.x += (wand.x - m.x) * 0.08;
            m.y += (wand.y - m.y) * 0.08;
          }
        });
      }
      const n = world.pieces.filter((pc) => pc.kind === "marble" && pc.x > 540 && pc.x < 740).length;
      world.meters[0].value = Math.min(1, 0.25 + n * 0.08);
    }
  };

  KINDS.gap = {
    setup(w, ph) {
      w.pieces.push(piece("tile", 640, 360, { r: 140, color: "#6a8eae55", static: true, caption: "núcleo de hierro" }));
      w.pieces.push(piece("kapla", 780, 360, { w: 28, h: 90, clickable: true, caption: "entrehierro (arrástrame afuera)" }));
      w.pieces.push(piece("varita", 240, 240, { caption: "bobina" }));
      w.meters.push({ label: "Empujón N·I necesario", value: 0.25, max: 1, color: "#c46a4a" });
      w.labels.push({
        x: 640, y: 80,
        text: ph === 0
          ? "Anillo de hierro cerrado: el flujo pasa facilísimo. Arrastra la pieza «entrehierro» hacia afuera."
          : "Al abrir un huequito de aire, la reluctancia se dispara y pide mucho más empujón."
      });
    },
    update() {
      const gap = world.pieces.find((pc) => pc.kind === "kapla");
      const open = gap && Math.hypot(gap.x - 780, gap.y - 360) > 45;
      world.meters[0].value = open ? 0.9 : 0.25;
      if (gap) gap.caption = open ? "¡Entrehierro de aire abierto!" : "entrehierro cerrado (hierro)";
    }
  };

  KINDS.memory = {
    setup(w) {
      w.sliders.push({ x: 80, y: 85, w: 260, min: -1, max: 1, v: 0, label: "imantación H", key: "height" });
      w.pieces.push(piece("churro", 640, 420, { len: 220, thick: 24, color: "#c9844a", caption: "plastilina / hierro (estírame)" }));
      w.labels.push({ x: 640, y: 80, text: "Histéresis: estira el churro o mueve H. Cuando vuelves H a cero, el hierro conserva memoria (remanencia)." });
      w.meters.push({ label: "Magnetismo guardado B (remanencia)", value: 0.25, max: 1, color: "#c46a4a" });
    },
    draw(p, w) {
      // Pequeña curva de lazo de histéresis B-H ilustrativa
      p.push();
      const cx = 640, cy = 240;
      p.stroke("#8b6914"); p.strokeWeight(1.5);
      p.line(cx - 110, cy, cx + 110, cy);
      p.line(cx, cy - 70, cx, cy + 70);
      p.noFill(); p.stroke("#7b4ea3"); p.strokeWeight(3);
      p.bezier(cx - 90, cy + 55, cx - 20, cy + 55, cx + 20, cy - 55, cx + 90, cy - 55);
      p.bezier(cx + 90, cy - 55, cx + 20, cy - 55, cx - 20, cy + 55, cx - 90, cy + 55);
      p.pop();
    },
    update() {
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      const h = world.height || 0;
      if (Math.abs(h) > 0.3) world.flags.stretched = true;
      const baseLen = world.flags.stretched ? 265 : 220;
      if (ch && !ch.grabbed) {
        const targetLen = baseLen + Math.abs(h) * 110;
        ch.len += (targetLen - ch.len) * 0.08;
        world.meters[0].value = Math.min(1, (ch.len - 190) / 180);
      }
    }
  };

  /* ---------- PISO XII: 12.1 tau(L), 12.2 lenz, 12.3 freewheel, 12.4 sq(L) ---------- */
  KINDS.lenz = {
    setup(w) {
      w.pieces.push(piece("silk", 420, 360, { color: "#6a8eae", r: 85, caption: "imán / campo (muéveme rápido)" }));
      w.pieces.push(piece("yarn", 760, 360, { color: "#c46a4a", static: true, caption: "bobina" }));
      w.pieces.push(piece("nin", 960, 360, { caption: "eco inducido (Ley de Lenz)" }));
      w.meters.push({ label: "Chispazo inducido |dΦ/dt|", value: 0, max: 1, color: "#c46a4a" });
      w.labels.push({ x: 640, y: 90, text: "Faraday y Lenz: si el pañuelo está quieto, el Nin no se mueve. Si lo agitas rápido, el Nin se opone al cambio." });
    },
    update() {
      const silk = world.pieces.find((pc) => pc.kind === "silk");
      const nin = world.pieces.find((pc) => pc.kind === "nin");
      if (silk && nin) {
        const prevX = silk._lx != null ? silk._lx : silk.x;
        const dx = silk.x - prevX;
        silk._lx = silk.x;
        if (silk.grabbed && Math.abs(dx) > 0.5) {
          // Ley de Lenz: se opone proporcionalmente a la rapidez del cambio
          nin.x = Math.max(820, Math.min(1180, nin.x - dx * 0.65));
          world.meters[0].value = Math.min(1, Math.abs(dx) / 28);
        } else {
          // Si está quieto, vuelve suavemente al reposo y el voltaje inducido es 0
          nin.x += (960 - nin.x) * 0.08;
          world.meters[0].value *= 0.85;
        }
      }
    }
  };

  KINDS.freewheel = {
    setup(w) {
      w.paths.push({ pts: [{ x: 140, y: 280 }, { x: 700, y: 280 }], color: "#4a4a4a", w: 18, open: true, speed: 0.012 });
      w.paths.push({ pts: [{ x: 700, y: 280 }, { x: 700, y: 500 }, { x: 140, y: 500 }, { x: 140, y: 280 }], color: "#5e7a5e", w: 14, open: true, loop: true, speed: 0.012 });
      w.pieces.push(piece("yarn", 220, 180, { static: true, caption: "bobina con inercia" }));
      w.pieces.push(piece("marble", 160, 280, { clickable: true, path: 0, s: 0, color: "#c46a4a", caption: "toca para lanzar" }));
      w.pieces.push(piece("tile", 700, 280, { color: "#5e7a5e", r: 30, caption: "diodo de rueda libre (tócame)", static: true, clickable: true }));
      w.meters.push({ label: "Chispazo peligroso", value: 0, max: 1, color: "#e23d28" });
      w.labels.push({ x: 640, y: 80, text: "Lanza la canica: al llegar al final, el camino verde (diodo de rueda libre) la deja girar sin chispazo." });
    },
    update() {
      const m = world.pieces.find((p) => p.kind === "marble");
      if (world.flags.lastClick && world.flags.lastClick.kind === "tile") {
        world.paths[1].open = world.paths[1].open === false ? true : false;
        world.flags.lastClick = null;
      }
      if (world.flags.lastClick && world.flags.lastClick.kind === "marble") {
        const mb = world.flags.lastClick;
        mb.path = 0;
        mb.s = 0;
        mb.roll = 1;
        world.flags.lastClick = null;
      }
      if (m && m.path === 0 && (m.s || 0) >= 0.98) {
        if (world.paths[1].open !== false) {
          m.path = 1;
          m.s = 0;
          m.roll = 1;
          world.meters[0].value = 0.05;
        } else {
          world.meters[0].value = 1;
          spawnWinSparks(700, 280);
        }
      }
    }
  };

  /* ---------- PISO XIII: 13.1–13.3 swing y 13.4 rms ---------- */
  KINDS.swing = {
    setup(w) {
      w.pieces.push(piece("pendulum", 640, 320, { px: 640, py: 150, arm: 170, static: true, caption: "columpio AC" }));
      w.sliders.push({ x: 80, y: 90, w: 260, min: 0.4, max: 2.2, v: 1, label: "frecuencia f", key: "flow" });
      w.meters.push({ label: "Periodo T = 1 / f", value: 1, max: 2.5, color: "#7b4ea3" });
      w.meters.push({ label: "Frecuencia f (Hz)", value: 1, max: 2.2, color: "#c46a4a" });
      if (w.variant === "phase") {
        w.sliders.push({ x: 80, y: 145, w: 260, min: 0, max: 180, v: 60, label: "desfase φ (°)", key: "height" });
        w.pieces.push(piece("silk", 640, 440, { color: "#6a8eae", static: true, caption: "segunda onda (desfasada)" }));
        w.labels.push({ x: 640, y: 580, text: "Desfase: el pañuelo azul sigue el mismo ritmo pero retrasado un ángulo φ." });
      } else if (w.variant === "avg") {
        w.pieces.push(piece("bowl", 400, 560, { static: true, caption: "medio ciclo + (+V)" }));
        w.pieces.push(piece("bowl", 880, 560, { static: true, caption: "medio ciclo − (−V)" }));
        w.labels.push({ x: 640, y: 80, text: "En un ciclo entero empuja igual hacia la derecha que hacia la izquierda: promedio matemático = 0." });
      } else {
        w.pieces.push(piece("top", 240, 420, { caption: "trompo (ω = 2πf)" }));
        w.labels.push({ x: 640, y: 580, text: "A más frecuencia (más ciclos por segundo), el periodo T de cada vaivén es más corto." });
      }
      w.flags.th = 0;
    },
    update() {
      const f = world.flow || 1;
      world.flags.th += 0.045 * f;
      const pen = world.pieces.find((pc) => pc.kind === "pendulum");
      if (pen) {
        const ang = Math.sin(world.flags.th) * 0.85;
        pen.x = pen.px + Math.sin(ang) * pen.arm;
        pen.y = pen.py + Math.cos(ang) * pen.arm;
      }
      if (world.variant === "phase") {
        const silk = world.pieces.find((pc) => pc.kind === "silk");
        const phi = ((world.height != null ? world.height : 60) * Math.PI) / 180;
        if (silk) {
          silk.x = 640 + Math.sin(world.flags.th - phi) * 140;
        }
      }
      world.meters[0].value = 1 / f;
      world.meters[1].value = f;
    }
  };

  KINDS.rms = {
    setup(w) {
      w.sliders.push({ x: 80, y: 90, w: 280, min: 0.5, max: 2, v: 1.0, label: "pico V_max", key: "height" });
      w.pieces.push(piece("churro", 420, 380, { len: 220, thick: 22, color: "#c9844a", static: true, caption: "DC continua = V_max" }));
      w.pieces.push(piece("churro", 860, 380, { len: 220, thick: 18, color: "#e8c9a0", static: true, caption: "AC alterna (V_rms = 0,707·V_max)" }));
      w.meters.push({ label: "Valor Pico V_max", value: 1, max: 2, color: "#c46a4a" });
      w.meters.push({ label: "Valor Eficaz V_rms = V_max / √2", value: 0.707, max: 2, color: "#7b4ea3" });
      w.labels.push({ x: 640, y: 120, text: "El valor eficaz (RMS = 0,707 del pico) dice cuánto calienta; pero el aislante debe aguantar el pico entero." });
    },
    update() {
      const vMax = world.height || 1.0;
      const vRms = vMax * 0.7071;
      world.meters[0].value = vMax;
      world.meters[1].value = vRms;
      const chs = world.pieces.filter((p) => p.kind === "churro");
      if (chs[0]) chs[0].caption = `Pico V_max = ${(vMax * 311).toFixed(0)} V`;
      if (chs[1]) chs[1].caption = `Eficaz V_rms = ${(vRms * 311).toFixed(0)} V`;
    }
  };

  /* ---------- PISO XIV: 14.1 photo, 14.2 rlc, 14.3 bill, 14.4 streets ---------- */
  KINDS.photo = {
    setup(w) {
      w.pieces.push(piece("pendulum", 520, 320, { px: 520, py: 160, arm: 165, static: true, caption: "vaivén x(t)" }));
      w.pieces.push(piece("camera", 960, 300, { clickable: true, caption: "toca para tomar foto (derivada)" }));
      w.flags.th = 0;
      w.labels.push({ x: 640, y: 80, text: "Toca la cámara: en los extremos la velocidad (pendiente) es 0; al cruzar el centro es máxima." });
      w.meters.push({ label: "Pendiente instantánea |dx/dt|", value: 0, max: 1, color: "#c46a4a" });
      w.meters.push({ label: "Última foto tomada", value: 0, max: 1, color: "#3b6ea8" });
    },
    draw(p, w) {
      if (w.flags.flash && w.flags.flash > 0) {
        p.push();
        p.noStroke();
        p.fill(255, 255, 240, w.flags.flash * 7);
        p.rect(0, 0, W, H);
        p.pop();
        w.flags.flash--;
      }
    },
    update() {
      world.flags.th += 0.04;
      const pen = world.pieces.find((pc) => pc.kind === "pendulum");
      const ang = Math.sin(world.flags.th) * 0.85;
      if (pen) {
        pen.x = pen.px + Math.sin(ang) * pen.arm;
        pen.y = pen.py + Math.cos(ang) * pen.arm;
      }
      world.meters[0].value = Math.abs(Math.cos(world.flags.th));
      if (world.flags.shotSlope != null && world.meters[1]) {
        world.meters[1].value = world.flags.shotSlope;
      }
    }
  };

  KINDS.rlc = {
    setup(w) {
      [
        ["Tapón R (en fase 0°)", "#c46a4a", 0],
        ["Ovillo L (+90°, X_L = ωL)", "#7b4ea3", Math.PI / 2],
        ["Cubo C (−90°, X_C = 1/ωC)", "#6a8eae", -Math.PI / 2]
      ].forEach(([n, c, ph], i) => {
        w.pieces.push(piece("mouse", 300 + i * 320, 320, {
          color: c, caption: n, static: true, ph, baseY: 320
        }));
      });
      w.sliders.push({ x: 80, y: 80, w: 260, min: 0.4, max: 2.4, v: 1, label: "frecuencia ω", key: "flow" });
      w.meters.push({ label: "Reactancia Inductiva X_L = ω·L", value: 0.4, max: 1, color: "#7b4ea3" });
      w.meters.push({ label: "Reactancia Capacitiva X_C = 1/(ω·C)", value: 0.4, max: 1, color: "#6a8eae" });
      w.labels.push({ x: 640, y: 540, text: "A más frecuencia ω: el ovillo L se vuelve más duro; el cubo C se vuelve más fácil. Si X_L = X_C: ¡resonancia!" });
      w.flags.th = 0;
    },
    update() {
      const f = world.flow || 1;
      world.flags.th = (world.flags.th || 0) + 0.05 * f;
      world.pieces.forEach((m) => {
        if (m.kind === "mouse" && m.ph != null) {
          m.y = m.baseY + Math.sin(world.flags.th + m.ph) * 55;
        }
      });
      world.meters[0].value = Math.min(1, f / 2.4);
      world.meters[1].value = Math.min(1, 0.42 / f);
    }
  };

  KINDS.bill = {
    setup(w) {
      w.sliders.push({ x: 80, y: 90, w: 280, min: 0, max: 90, v: 0, label: "ángulo φ (°)", key: "height" });
      w.meters.push({ label: "Potencia Activa P = S·cos(φ) (W)", value: 1, max: 1, color: "#d4a017" });
      w.meters.push({ label: "Potencia Reactiva Q = S·sen(φ) (VAr)", value: 0, max: 1, color: "#6a8eae" });
      w.pieces.push(piece("house", 900, 380, { static: true, caption: "medidor (cobra P)" }));
      w.pieces.push(piece("arrow", 480, 420, { dx: 180, dy: 0, static: true, color: "#7b4ea3", caption: "S aparente" }));
      w.labels.push({ x: 540, y: 190, text: "0° (cos φ = 1): todo es trabajo útil P. 90° (cos φ = 0): va y viene como espuma reactiva Q." });
    },
    update() {
      const deg = world.height || 0;
      const ang = (deg * Math.PI) / 180;
      world.meters[0].value = Math.cos(ang);
      world.meters[1].value = Math.sin(ang);
      const ar = world.pieces.find((p) => p.kind === "arrow");
      if (ar) {
        ar.dx = Math.cos(ang) * 180;
        ar.dy = -Math.sin(ang) * 180;
        ar.caption = `FP = cos(${Math.round(deg)}°) = ${Math.cos(ang).toFixed(2)}`;
      }
    }
  };

  KINDS.streets = {
    setup(w) {
      w.paths.push({ pts: [{ x: 200, y: 400 }, { x: 1080, y: 400 }], color: "#c46a4a", w: 8 });
      w.paths.push({ pts: [{ x: 640, y: 120 }, { x: 640, y: 640 }], color: "#6a8eae", w: 8 });
      w.labels.push({ x: 1030, y: 430, text: "Eje Real (R · cos θ)" });
      w.labels.push({ x: 750, y: 145, text: "Eje Imaginario (+j · sen θ)" });
      w.pieces.push(piece("arrow", 640, 400, { dx: 180, dy: 0, static: true, color: "#7b4ea3" }));
      w.sliders.push({ x: 80, y: 80, w: 230, min: -180, max: 180, v: 45, label: "ángulo θ (°)", key: "height" });
      w.sliders.push({ x: 80, y: 135, w: 230, min: 60, max: 240, v: 180, label: "módulo |Z|", key: "flow" });
      w.labels.push({ x: 260, y: 210, text: "Multiplicar por j gira +90°. Ovillo = +jX_L, Cubo = −jX_C." });
    },
    draw(p, w) {
      const ar = w.pieces.find((pc) => pc.kind === "arrow");
      if (!ar) return;
      p.push();
      p.strokeWeight(2.5);
      p.drawingContext.setLineDash([6, 6]);
      // Proyección al eje Real
      p.stroke("#c46a4a");
      p.line(640 + ar.dx, 400 + ar.dy, 640 + ar.dx, 400);
      // Proyección al eje Imaginario
      p.stroke("#6a8eae");
      p.line(640 + ar.dx, 400 + ar.dy, 640, 400 + ar.dy);
      p.drawingContext.setLineDash([]);
      p.pop();
    },
    update() {
      const ar = world.pieces.find((pc) => pc.kind === "arrow");
      if (ar) {
        const deg = world.height != null ? world.height : 45;
        const mag = world.flow || 180;
        const a = (deg * Math.PI) / 180;
        ar.dx = Math.cos(a) * mag;
        ar.dy = -Math.sin(a) * mag;
        const re = Math.round(Math.cos(a) * mag);
        const im = Math.round(Math.sin(a) * mag);
        ar.caption = `Z = ${re} ${im >= 0 ? "+" : "−"} j${Math.abs(im)} (${Math.round(mag)}∠${Math.round(deg)}°)`;
      }
    }
  };

  global.EA_MAGIA = { boot, show, hide, floors };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
