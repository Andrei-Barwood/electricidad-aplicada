/* Magia · La electricidad, según el mago Vaelithor */
(function (global) {
  "use strict";
  const W = 1280, H = 720;
  const A = "magia/assets";
  const RAIN = ["#f5c518", "#f08c00", "#e23d28", "#d12b6a", "#7b4ea3", "#3b6ea8", "#3aa07a", "#8bbd3a"];
  const WOOD = "#c9a36a";
  const INK = "#3a2f27";

  let view = "hub";
  let floorIdx = 0;
  let tutIdx = 0;
  let phase = 0;
  let sketch = null;
  let world = null;
  let dragging = null;
  let dragOff = { x: 0, y: 0 };
  let dragMoved = false;
  let imgs = {};
  let done = new Set();
  let showTable = false;

  try {
    JSON.parse(localStorage.getItem("ea-magia-done") || "[]").forEach((id) => done.add(id));
  } catch (e) {}

  function floors() { return global.MAGIA_FLOORS || []; }
  function floor() { return floors()[floorIdx]; }
  function tut() { return floor().tuts[tutIdx]; }
  function nPlay() { return (tut().say || []).length; }
  function isQuiz() { return phase >= nPlay(); }

  function saveDone(id) {
    done.add(id);
    try { localStorage.setItem("ea-magia-done", JSON.stringify([...done])); } catch (e) {}
  }
  function stars(f) {
    return f.tuts.reduce((n, t) => n + (done.has(t.id) ? 1 : 0), 0);
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function host() { return document.getElementById("mg-view"); }

  function applyDeepLink() {
    const q = new URLSearchParams(location.search).get("mg");
    if (!q) return;
    const m = String(q).match(/^(\d+)(?:\.(\d+))?$/);
    if (!m) return;
    const n = +m[1];
    const fi = floors().findIndex((f) => f.n === n);
    if (fi < 0) return;
    floorIdx = fi;
    if (m[2]) {
      const ti = +m[2] - 1;
      if (ti >= 0 && ti < floors()[fi].tuts.length) {
        tutIdx = ti;
        phase = 0;
        view = "play";
        return;
      }
    }
    view = "floor";
  }

  function boot() {
    if (!host()) return;
    applyDeepLink();
    render();
  }

  function show() {
    applyDeepLink();
    if (view === "play") {
      if (!host() || !host().querySelector("#mg-canvas")) render();
      else ensureSketch();
    } else render();
  }
  function hide() { destroySketch(); }

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
      const star = "★".repeat(s) + "☆".repeat(4 - s);
      return `<button type="button" class="mg-floor" data-floor="${i}">
        <img src="${A}/floors/f${String(f.n).padStart(2, "0")}.jpg" alt="">
        <div class="body">
          <div class="n">${f.roman} · ${f.n}.0</div>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.concept)}</p>
          <div class="mg-stars" aria-label="${s} de 4">${star}</div>
        </div>
      </button>`;
    }).join("");
    return `
      <div class="mg-toolbar">
        <button type="button" class="mg-btn gold" data-go="kit">Inventario de inversión</button>
        <span class="mg-hint">Se empieza en el 1.0. Se sube de piso cuando el de abajo ya se ha tocado.</span>
      </div>
      <div class="mg-grid">${cards}</div>
      <div class="mg-sat">
        <h3>Cómo se usa un sábado</h3>
        <p class="mg-lede">Lees juntos el cuento de esa pestaña. Eliges un tutorial de los cuatro, no los cuatro. Cuarenta minutos, no una olimpiada. Dejas los juguetes a la vista al día siguiente. La pregunta del cierre se hace de verdad. Si la respuesta sale al revés, se vuelve a jugar cambiando una sola cosa.</p>
      </div>
      <div class="mg-note"><strong>Se juega con un adulto.</strong> Las canicas, los imanes, Mouse Trap y los ovillos de lana se vigilan. Nadie deja a una niña de siete sola con un tubo de KerPlunk ni con un imán suelto. Este taller no sustituye las visitas: aquí el mismo taller se toca.</div>
    `;
  }

  function htmlFloor() {
    const f = floor();
    const tuts = f.tuts.map((t, i) => {
      const mark = done.has(t.id) ? " ★" : "";
      const nn = String(f.n).padStart(2, "0");
      return `<button type="button" class="mg-tut" data-tut="${i}">
        <img src="${A}/mesas/f${nn}-t${i + 1}.jpg" alt="">
        <div class="body">
          <div class="n">Tutorial ${i + 1}${mark}</div>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.pov)}</p>
        </div>
      </button>`;
    }).join("");
    return `
      <div class="mg-toolbar">
        <button type="button" class="mg-btn ghost" data-go="hub">← Catorce pisos</button>
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
    const nn = String(f.n).padStart(2, "0");
    return `
      <div class="mg-toolbar">
        <button type="button" class="mg-btn ghost" data-go="floor">← ${esc(f.title)}</button>
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
      view = b.dataset.go;
      render();
    }));
    el.querySelectorAll("[data-floor]").forEach((b) => b.addEventListener("click", () => {
      floorIdx = +b.dataset.floor;
      view = "floor";
      render();
    }));
    el.querySelectorAll("[data-tut]").forEach((b) => b.addEventListener("click", () => {
      tutIdx = +b.dataset.tut;
      phase = 0;
      view = "play";
      render();
    }));
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
    if (!fb) return;
    if (i === t.q.ok) {
      fb.textContent = t.q.good;
      fb.style.color = "#5e7a5e";
      saveDone(t.id);
    } else {
      fb.textContent = t.q.bad;
      fb.style.color = "#c46a4a";
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

  function ensureSketch() {
    const holder = document.getElementById("mg-canvas");
    if (!holder) return;
    if (typeof p5 !== "function") {
      holder.innerHTML = "<p class='mg-lede' style='padding:24px;color:#fff'>No se pudo cargar p5.js.</p>";
      syncChrome();
      return;
    }
    if (sketch) return;
    sketch = new p5((p) => {
      p.preload = () => {
        imgs.cuenco = p.loadImage(A + "/sprites/cuenco.png");
        imgs.proton = p.loadImage(A + "/sprites/proton.png");
        imgs.electron = p.loadImage(A + "/sprites/electron.png");
        imgs.nin = p.loadImage(A + "/sprites/nin.png");
        imgs.varita = p.loadImage(A + "/sprites/varita.png");
        imgs.plus = p.loadImage(A + "/sprites/placa-mas.png");
        imgs.minus = p.loadImage(A + "/sprites/placa-menos.png");
        imgs.linterna = p.loadImage(A + "/sprites/linterna.png");
        imgs.silk = p.loadImage(A + "/sprites/silk.png");
        imgs.prado = p.loadImage(A + "/sprites/bg-prado.jpg");
        const extra = ["mesa-vacia.jpg", "abaco.png", "piramide.png", "cups.png", "potato.png",
          "silk-kilo.png", "silk-mili.png", "car.png", "connect4.png", "rainbow.png",
          "bowl-dark.png", "bowl-med.png", "bowl-small.png", "marble.png", "shoe.png",
          "hourglass.png", "bills.png", "bill-1.png", "bill-10.png", "bill-5.png",
          "scale.png", "register.png", "triangle.png", "mousetrap.png", "passport.png",
          "glasses.png", "hat-bow.png", "kapla-stack.png"];
        extra.forEach((f) => {
          imgs[f.replace(/\.(png|jpg)$/, "")] = p.loadImage(A + "/sprites/" + f);
        });
      };
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
      p.mouseClicked = () => onClick(p);
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
      hat: 44, potato: 110, ice: 28, stick: 10, hippo: 80, card: 44, plate: 90,
      camera: 50, top: 40, churro: 20, bead: 16, paper: 70, shoe: 70, house: 80,
      block: 28, gear: 50, caterpillar: 90, robot: 80, pendulum: 18, arrow: 80,
      abaco: 210, piramide: 150, cups: 110, rainbow: 140, connect4: 130,
      mousetrap: 160, triangle: 120, hourglass: 70, register: 90, scale: 100,
      passport: 70, bills: 110
    };
    return Object.assign({
      kind, x, y, vx: 0, vy: 0,
      r: sizes[kind] || 32,
      q: 0, label: "", color: WOOD, static: false, grabbed: false, inBowl: false,
      restRot: 0,
      tilt: 0
    }, extra || {});
  }

  function setupPhase() {
    dragging = null;
    const t = tut();
    world = {
      kind: t.kind, variant: t.variant || "",
      pieces: [], targets: [], paths: [], meters: [], labels: [],
      sliders: [], flags: {}, t: 0, flow: 1, heat: 0, height: 1, load: 4,
      useMesa: false
    };
    if (isQuiz()) return;
    const k = KINDS[t.kind] || KINDS.table;
    k.setup(world, phase, t);
  }

  function drawWorld(p) {
    drawTable(p);
    if (!world) return;
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
  }

  function updateWorld(p) {
    if (!world || isQuiz()) return;
    world.t++;
    world.pieces.forEach((pc) => {
      if (pc.grabbed || pc.static) return;
      if (pc.orbitR) {
        pc.orbit = (pc.orbit || 0) + (pc.orbitSp || 0.03);
        pc.x += ((pc.cx + Math.cos(pc.orbit) * pc.orbitR) - pc.x) * 0.12;
        pc.y += ((pc.cy + Math.sin(pc.orbit) * pc.orbitR * 0.7) - pc.y) * 0.12;
      }
      if (pc.roll && world.paths[pc.path]) {
        const path = world.paths[pc.path];
        pc.s = (pc.s || 0) + pc.roll * (path.speed || 1) * (world.flow || 1);
        if (pc.s > 1) {
          if (path.loop) pc.s = 0;
          else { pc.s = 1; pc.roll = 0; world.flags.arrived = (world.flags.arrived || 0) + 1; }
        }
        const pt = along(path.pts, pc.s);
        pc.x = pt.x; pc.y = pt.y;
      }
    });
    const k = KINDS[world.kind];
    if (k && k.update) k.update(p, world);
  }

  function zOf(pc) {
    if (pc.kind === "cuenco" || pc.kind === "bowl" || pc.kind === "house" || pc.kind === "mousetrap") return 0;
    if (pc.kind === "silk" || pc.kind === "abaco" || pc.kind === "connect4") return 1;
    return 2;
  }

  function drawTable(p) {
    if (world && world.useMesa && imgs["mesa-vacia"] && imgs["mesa-vacia"].width) {
      p.image(imgs["mesa-vacia"], W / 2, H / 2, W, H);
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
    }
  }

  function drawTarget(p, tg) {
    p.noFill();
    p.stroke(tg.color || "rgba(94,122,94,0.7)");
    p.strokeWeight(2);
    p.drawingContext.setLineDash([6, 6]);
    p.circle(tg.x, tg.y, (tg.r || 50) * 2);
    p.drawingContext.setLineDash([]);
    if (tg.label) drawLabel(p, { x: tg.x, y: tg.y + (tg.r || 50) + 16, text: tg.label });
  }

  function drawLabel(p, lb) {
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill(255, 250, 243, 220);
    p.rect(lb.x, lb.y, Math.min(260, 18 + (lb.text || "").length * 8), 28, 8);
    p.fill(INK);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.text(lb.text, lb.x, lb.y);
  }

  function drawMeter(p, m, i) {
    const x = W - 300, y = 28 + i * 58, w = 260, h = 48;
    p.rectMode(p.CORNER);
    p.noStroke();
    p.fill(255, 250, 243, 230);
    p.rect(x, y, w, h, 12);
    p.fill("#6b5a4d");
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(m.label, x + 12, y + 6);
    p.fill("#e4d3bc");
    p.rect(x + 12, y + 26, w - 24, 12, 8);
    p.fill(m.color || "#c46a4a");
    const v = Math.max(0, Math.min(1, m.value / (m.max || 1)));
    p.rect(x + 12, y + 26, (w - 24) * v, 12, 8);
  }

  function drawSlider(p, s) {
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
    p.text(s.label + " " + (Math.round(s.v * 10) / 10), kx, s.y - 16);
  }

  function drawPiece(p, pc) {
    p.push();
    p.translate(pc.x, pc.y);
    p.rotate(pc.restRot || 0);
    p.drawingContext.shadowColor = "rgba(40,24,10,0.32)";
    p.drawingContext.shadowBlur = pc.grabbed ? 22 : 14;
    p.drawingContext.shadowOffsetY = pc.grabbed ? 10 : 6;
    const img = imgOf(pc);
    if (img && img.width) {
      const h = pc.r * 2 * (img.height / img.width);
      p.image(img, 0, 0, pc.r * 2, h);
    } else {
      drawToy(p, pc);
    }
    p.drawingContext.shadowBlur = 0;
    if (pc.q) {
      p.noStroke();
      p.fill(pc.q > 0 ? "#c46a4a" : "#6a8eae");
      p.circle(pc.r * 0.55, -pc.r * 0.55, 16);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(pc.q > 0 ? "+" : "−", pc.r * 0.55, -pc.r * 0.55);
    }
    if (pc.caption && !(world && world.useMesa)) {
      p.fill(INK);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(12);
      p.text(pc.caption, 0, pc.r + 4);
    }
    p.pop();
  }

  function imgOf(pc) {
    if (pc.sprite && imgs[pc.sprite] && imgs[pc.sprite].width) return imgs[pc.sprite];
    const map = {
      proton: "proton", electron: "electron", nin: "nin", cuenco: "cuenco",
      plus: "plus", minus: "minus", linterna: "linterna", varita: "varita",
      abaco: "abaco", piramide: "piramide", potato: "potato", car: "car",
      shoe: "shoe", hourglass: "hourglass", rainbow: "rainbow",
      connect4: "connect4", mousetrap: "mousetrap", triangle: "triangle",
      register: "register", scale: "scale", passport: "passport", bills: "bills",
      marble: "marble", cups: "cups"
    };
    if (pc.kind === "silk") {
      if (pc.sprite) return imgs[pc.sprite];
      return imgs.silk;
    }
    if (pc.kind === "bowl") return imgs[pc.sprite] || imgs.cuenco;
    if (pc.kind === "coin") return imgs[pc.sprite] || imgs["bill-1"];
    if (pc.kind === "hat") return imgs["hat-bow"];
    if (pc.kind === "cup") return imgs.cups;
    const k = map[pc.kind];
    return k && imgs[k] && imgs[k].width ? imgs[k] : null;
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
        p.fill(pc.color || RAIN[pc.n || 0]);
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
        p.textSize(11);
        p.text(pc.n || "1", 0, 0);
        break;
      case "kapla":
        p.fill("#e6d2a2");
        p.rectMode(p.CENTER);
        p.rect(0, 0, pc.w || 70, pc.h || 12, 2);
        break;
      case "tile":
        p.fill(pc.color || "#6a8eae");
        p.rectMode(p.CENTER);
        p.rect(0, 0, pc.r * 2, pc.r * 2, 6);
        p.stroke(255, 180);
        p.noFill();
        p.rect(0, 0, pc.r * 1.5, pc.r * 1.5, 4);
        break;
      case "lamp":
        p.fill(pc.on ? "#f5c518" : "#bbb");
        p.circle(0, -8, 28);
        p.fill("#8b6914");
        p.rectMode(p.CENTER);
        p.rect(0, 12, 14, 16, 3);
        break;
      case "yarn":
        p.fill(pc.color || "#c46a4a");
        p.circle(0, 0, pc.r * 2);
        p.noFill();
        p.stroke(255, 200);
        p.arc(-4, -4, pc.r, pc.r, 0, p.PI);
        p.arc(6, 4, pc.r * 0.8, pc.r * 0.8, 0, p.PI);
        break;
      case "hat":
        p.fill(pc.color || "#3a2f27");
        p.ellipse(0, 6, 40, 10);
        p.rectMode(p.CENTER);
        p.rect(0, -6, 22, 20, 4);
        break;
      case "potato":
        p.fill("#c9844a");
        p.ellipse(0, 0, 70, 86);
        p.fill("#3a2f27");
        p.circle(-12, -8, 8);
        p.circle(12, -8, 8);
        p.fill("#6a2");
        p.ellipse(0, 14, 18, 8);
        break;
      case "ice":
        p.fill(180, 220, 230, 200);
        p.stroke(120, 160, 180);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 26, 26, 4);
        break;
      case "stick":
        p.stroke("#8b5a2b");
        p.strokeWeight(6);
        p.line(-30, 0, 30, 0);
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
        p.rect(0, 0, 36, 52, 4);
        p.fill("#fff");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(pc.n || "", 0, 0);
        break;
      case "plate":
        p.fill(pc.color || "#c46a4a");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 18, 110, 4);
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
        p.line(-pc.len / 2, 0, pc.len / 2, 0);
        break;
      case "bead":
        p.fill(pc.color || RAIN[0]);
        p.circle(0, 0, 16);
        break;
      case "paper":
        p.fill(pc.empty ? "#f3ead8" : "#fffaf3");
        p.stroke("#c4a574");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 90, 70, 6);
        p.noStroke();
        p.fill(INK);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(pc.empty ? "¿?" : pc.caption, 0, 0);
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
        p.rect(0, 10, 70, 50, 4);
        p.fill("#c46a4a");
        p.triangle(-40, -12, 40, -12, 0, -48);
        break;
      case "block":
        p.fill(pc.color || "#e6d2a2");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 24, 16, 2);
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
        p.fill("#6a8eae");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 40, 56, 6);
        p.fill("#f5c518");
        p.circle(-8, -8, 8);
        p.circle(8, -8, 8);
        break;
      case "pendulum":
        p.stroke("#8b6914");
        p.strokeWeight(3);
        p.line(0, -pc.arm, 0, 0);
        p.noStroke();
        p.fill("#c46a4a");
        p.circle(0, 0, 22);
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
        p.triangle(0, 0, -12, -7, -12, 7);
        p.pop();
        break;
      case "silk":
        p.fill(pc.color || "#7b4ea3");
        p.ellipse(0, 0, pc.r * 2.4, pc.r * 1.4);
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
    let t = s * total;
    for (let i = 1; i < pts.length; i++) {
      if (t <= segs[i - 1]) {
        const u = t / segs[i - 1];
        return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u };
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
    const rr = pc.kind === "churro" ? Math.max(pc.len / 2, 20) : (pc.r || 30);
    return Math.hypot(x - pc.x, y - pc.y) < rr + 8;
  }

  function onPress(p) {
    if (!world || isQuiz()) return;
    const { x, y } = ptr(p);
    dragMoved = false;
    for (let i = world.sliders.length - 1; i >= 0; i--) {
      const s = world.sliders[i];
      const kx = s.x + (s.v - s.min) / (s.max - s.min) * s.w;
      if (Math.hypot(x - kx, y - s.y) < 22 || (x > s.x && x < s.x + s.w && Math.abs(y - s.y) < 18)) {
        dragging = { slider: s };
        return;
      }
    }
    for (let i = world.pieces.length - 1; i >= 0; i--) {
      const pc = world.pieces[i];
      if (pc.static && pc.kind !== "cuenco" && pc.kind !== "bowl" && !pc.clickable) continue;
      if (hit(pc, x, y)) {
        if (pc.clickable) { clickPiece(pc); return; }
        if (pc.static) continue;
        dragging = pc;
        pc.grabbed = true;
        pc.vx = pc.vy = 0;
        if (pc.inBowl) {
          pc.inBowl = false;
          pc.r = pc.rHand || 16;
        }
        dragOff.x = pc.x - x;
        dragOff.y = pc.y - y;
        world.pieces.splice(i, 1);
        world.pieces.push(pc);
        return;
      }
    }
    world.flags.clicked = { x, y };
  }

  function onDrag(p) {
    if (!dragging || isQuiz()) return;
    const { x, y } = ptr(p);
    dragMoved = true;
    if (dragging.slider) {
      const s = dragging.slider;
      s.v = s.min + Math.max(0, Math.min(1, (x - s.x) / s.w)) * (s.max - s.min);
      if (s.key) world[s.key] = s.v;
      return;
    }
    dragging.x = x + dragOff.x;
    dragging.y = y + dragOff.y;
  }

  function onRelease() {
    if (!dragging) return;
    if (dragging.slider) { dragging = null; return; }
    const pc = dragging;
    pc.grabbed = false;
    pc.tilt = 0;
    if (pc.kind === "abaco" && !dragMoved) {
      world.flags.abacoTap = (world.flags.abacoTap || 0) + 1;
    }
    world.targets.forEach((tg) => {
      if (Math.hypot(pc.x - tg.x, pc.y - tg.y) < (tg.r || 50) + 10) {
        if (!tg.accept || tg.accept === pc.kind || (tg.accept || "").split(",").includes(pc.kind)) {
          pc.inBowl = true;
          const nest = Math.min(12, (tg.r || 50) * 0.22);
          pc.rHand = pc.rHand || pc.r;
          if (pc.kind === "marble" || pc.kind === "proton" || pc.kind === "electron") pc.r = nest;
          const spread = (tg.r || 50) * 0.45;
          pc.x = tg.x + (Math.random() - 0.5) * spread;
          pc.y = tg.y + (Math.random() - 0.5) * spread * 0.55 + 6;
          tg.held = (tg.held || 0) + 1;
        }
      }
    });
    dragging = null;
  }

  function onClick(p) {
    if (!world || isQuiz() || dragMoved) return;
    const { x, y } = ptr(p);
    world.pieces.forEach((pc) => {
      if ((pc.kind === "proton" || pc.kind === "electron") && hit(pc, x, y) && world.kind === "casita" && phase === 2) {
        pc.q *= -1;
        pc.kind = pc.q > 0 ? "proton" : "electron";
      }
    });
  }

  function clickPiece(pc) {
    if (pc.toggle === "lamp") pc.on = !pc.on;
    if (pc.toggle === "path") {
      const path = world.paths[pc.path];
      if (path) path.open = path.open === false ? true : false;
    }
    if (pc.kind === "paper" || (pc.clickable && pc.caption && (pc.kind === "passport" || pc.kind === "car" || pc.kind === "hourglass"))) {
      world.pieces.forEach((q) => { if (q.caption) q.empty = false; });
      pc.empty = true;
      world.flags.empty = pc.caption;
    }
    if (pc.kind === "hat" && pc.wear) {
      const pot = world.pieces.find((q) => q.kind === "potato");
      if (pot) { pot.hat = pc.color; pc.x = pot.x; pc.y = pot.y - 50; }
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
      pc.vx *= 0.92; pc.vy *= 0.92;
      pc.x = Math.max(40, Math.min(W - 40, pc.x + pc.vx));
      pc.y = Math.max(40, Math.min(H - 40, pc.y + pc.vy));
    });
  }

  /* ---------- kinds ---------- */
  const KINDS = {};

  KINDS.table = {
    setup(w) {
      w.labels.push({ x: 640, y: 80, text: "Arrastra los juguetes. El taller se toca." });
      w.pieces.push(piece("nin", 400, 360));
      w.pieces.push(piece("marble", 520, 360, { color: "#5c3a21" }));
      w.pieces.push(piece("bowl", 700, 380, { static: true }));
    }
  };

  KINDS.tens = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("abaco", 640, 390, { r: 230 }));
        w.pieces.push(piece("piramide", 1080, 420, { r: 120 }));
        w.pieces.push(piece("cups", 180, 480, { r: 90 }));
        w.labels.push({ x: 640, y: 72, text: "Toca el ábaco: una hilera es diez. Arrástralo, se mueve torpe." });
        w.meters.push({ label: "Hileras tocadas", value: 0, max: 10, color: "#7b4ea3" });
      } else if (ph === 1) {
        [["chico · 1", 300, 62], ["mediano · 10", 640, 88], ["grande · 100", 980, 118]].forEach(([label, x, r]) => {
          w.targets.push({ x, y: 400, r: r * 0.52, label, accept: "marble,proton,electron" });
          w.pieces.push(piece("bowl", x, 400, { static: true, r, sprite: "cuenco" }));
        });
        for (let i = 0; i < 10; i++) {
          w.pieces.push(piece("proton", 70 + (i % 2) * 36, 110 + Math.floor(i / 2) * 36, { q: 0, r: 16, rHand: 16 }));
        }
        for (let i = 0; i < 8; i++) {
          w.pieces.push(piece("electron", 1180 - (i % 2) * 36, 110 + Math.floor(i / 2) * 36, { q: 0, r: 16, rHand: 16 }));
        }
      } else if (ph === 2) {
        w.pieces.push(piece("cups", 420, 400, { r: 80, n: 1 }));
        w.pieces.push(piece("cups", 860, 380, { r: 130, n: 5, static: true }));
        w.targets.push({ x: 860, y: 380, r: 80, label: "vaso gordo", accept: "cups,cup" });
        w.labels.push({ x: 640, y: 80, text: "El vaso chico es un pedacito. Arrástralo al gordo." });
        w.meters.push({ label: "Vertidos", value: 0, max: 5, color: "#6a8eae" });
      } else {
        for (let i = 0; i < 10; i++) {
          w.pieces.push(piece("coin", 170 + (i % 5) * 118, 250 + Math.floor(i / 5) * 78, { sprite: "bill-1", r: 54 }));
        }
        w.pieces.push(piece("coin", 1020, 400, { sprite: "bill-10", r: 92, static: true, caption: "billete 10" }));
        w.targets.push({ x: 1020, y: 400, r: 95, label: "cambia el peldaño", accept: "coin" });
        w.labels.push({ x: 640, y: 80, text: "Diez de 1 por un 10. El tesoro no cambió." });
      }
    },
    update() {
      if (phase === 0 && world.meters[0]) world.meters[0].value = Math.min(10, world.flags.abacoTap || 0);
      if (phase === 2 && world.targets[0] && world.meters[0]) world.meters[0].value = world.targets[0].held || 0;
    }
  };

  KINDS.costume = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("nin", 640, 430, { static: true, r: 100, restRot: 0 }));
        w.pieces.push(piece("silk", 260, 250, { sprite: "silk-kilo", r: 130, caption: "kilo" }));
        w.pieces.push(piece("silk", 1020, 240, { sprite: "silk-mili", r: 70, caption: "mili" }));
        w.targets.push({ x: 640, y: 430, r: 90, label: "el tesoro desnudo", accept: "silk" });
      } else if (ph === 1) {
        w.pieces.push(piece("potato", 640, 400, { static: true, r: 130, restRot: 0 }));
        ["Tera", "Giga", "Mega", "Kilo", "mili", "micro", "nano", "pico"].forEach((name, i) => {
          w.pieces.push(piece("hat", 150 + (i % 4) * 100, 120 + Math.floor(i / 4) * 90, { caption: name, clickable: true, wear: true, r: 36 }));
        });
        w.pieces.push(piece("hat", 1100, 500, { sprite: "glasses", r: 40, caption: "gafas", clickable: true, wear: true }));
      } else if (ph === 2) {
        w.pieces.push(piece("cups", 400, 400, { r: 85, n: 1 }));
        w.pieces.push(piece("cups", 880, 380, { r: 140, n: 5, static: true }));
        w.targets.push({ x: 880, y: 380, r: 80, label: "mismo agua, otro disfraz", accept: "cups,cup" });
        w.meters.push({ label: "Vertidos", value: 0, max: 5, color: "#6a8eae" });
      } else {
        for (let i = 0; i < 6; i++) w.pieces.push(piece("coin", 160 + (i % 3) * 130, 240 + Math.floor(i / 3) * 90, { sprite: "bill-10", r: 58 }));
        w.targets.push({ x: 1020, y: 400, r: 90, accept: "coin", label: "seis kilos" });
      }
    },
    update() {
      if (phase === 2) {
        const tg = world.targets[0];
        if (tg) world.meters[0].value = tg.held || 0;
      }
    }
  };

  KINDS.passport = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("passport", 280, 340, { clickable: true, static: true, caption: "camino", r: 70 }));
        w.pieces.push(piece("car", 640, 360, { clickable: true, static: true, caption: "velocidad", r: 80 }));
        w.pieces.push(piece("hourglass", 1000, 340, { clickable: true, static: true, caption: "reloj", r: 80 }));
        w.labels.push({ x: 640, y: 80, text: "Toca un juguete para dejarlo vacío. El taller adivina el que falta." });
      } else if (ph === 1) {
        w.pieces.push(piece("car", 220, 400, { r: 90 }));
        w.pieces.push(piece("hourglass", 1100, 180, { r: 70, static: true }));
        w.labels.push({ x: 640, y: 80, text: "Arrastra el coche por la mesa. El reloj cuenta tramos." });
        w.meters.push({ label: "Tramos", value: 0, max: 10, color: "#c46a4a" });
      } else if (ph === 2) {
        w.pieces.push(piece("shoe", 340, 380, { r: 80 }));
        w.pieces.push(piece("silk", 900, 360, { sprite: "silk-kilo", r: 120 }));
        w.labels.push({ x: 640, y: 80, text: "Mide con el zapato y con el silk. El pasillo no cambia." });
      } else {
        w.pieces.push(piece("scale", 980, 280, { r: 110, static: true }));
        w.pieces.push(piece("bowl", 360, 420, { static: true, r: 90, sprite: "cuenco", caption: "libras" }));
        w.pieces.push(piece("bowl", 640, 420, { static: true, r: 90, sprite: "cuenco", caption: "kilos" }));
        w.targets.push({ x: 360, y: 420, r: 60, accept: "marble,proton", label: "libras" });
        w.targets.push({ x: 640, y: 420, r: 60, accept: "marble,electron", label: "kilos" });
        for (let i = 0; i < 8; i++) w.pieces.push(piece("proton", 80, 80 + i * 42, { q: 0, r: 16, rHand: 16 }));
        for (let i = 0; i < 8; i++) w.pieces.push(piece("electron", 1200, 80 + i * 42, { q: 0, r: 16, rHand: 16 }));
        w.pieces.push(piece("register", 1100, 520, { r: 80 }));
      }
    },
    update() {
      if (phase === 1) {
        const car = world.pieces.find((pc) => pc.kind === "car");
        if (car) world.meters[0].value = Math.max(0, (car.x - 180) / 100);
      }
    }
  };

  KINDS.recipe = {
    setup(w, ph) {
      w.useMesa = true;
      if (ph === 0) {
        w.pieces.push(piece("connect4", 640, 400, { r: 150, clickable: true }));
        w.pieces.push(piece("rainbow", 180, 280, { r: 110, caption: "paréntesis" }));
        w.labels.push({ x: 640, y: 72, text: "6(4+8). El arcoíris de adentro se nombra primero. Toca el Connect 4." });
        w.flags.order = [];
        w.meters.push({ label: "Orden", value: 0, max: 3, color: "#5e7a5e" });
      } else if (ph === 1) {
        w.pieces.push(piece("triangle", 640, 380, { r: 150 }));
        w.pieces.push(piece("triangle", 200, 480, { sprite: "kapla-stack", r: 90 }));
        w.labels.push({ x: 640, y: 80, text: "El atajo se mira: tres listones, un triángulo. Arrástralo." });
      } else if (ph === 2) {
        w.pieces.push(piece("mousetrap", 560, 380, { r: 180, static: true }));
        w.pieces.push(piece("marble", 180, 480, { r: 28 }));
        w.pieces.push(piece("bowl", 1100, 480, { static: true, r: 90, sprite: "cuenco" }));
        w.targets.push({ x: 1100, y: 480, r: 70, accept: "marble", label: "la caja" });
        w.labels.push({ x: 640, y: 72, text: "Pieza por pieza: haz que la canica llegue al cuenco." });
      } else {
        w.pieces.push(piece("triangle", 400, 360, { r: 130 }));
        w.pieces.push(piece("triangle", 800, 360, { sprite: "kapla-stack", r: 100 }));
        w.labels.push({ x: 640, y: 80, text: "Tirar todo a la vez no llega. Pieza por pieza sí." });
      }
    },
    update() {
      if ((phase === 0 || phase === 2) && world.flags.lastClick) {
        const pc = world.flags.lastClick;
        world.flags.order.push(pc.n || pc.step);
        world.flags.lastClick = null;
        if (world.meters[0]) world.meters[0].value = world.flags.order.length;
      }
    }
  };

  KINDS.casita = {
    setup(w, ph) {
      w.prado = true;
      if (ph === 0) {
        w.pieces.push(piece("cuenco", 640, 355, { static: true, r: 120 }));
        for (let i = 0; i < 5; i++) w.pieces.push(piece("proton", 180 + (i % 3) * 58, 160 + Math.floor(i / 3) * 58, { q: 1 }));
        w.pieces.push(piece("nin", 200, 520));
        w.pieces.push(piece("nin", 270, 540));
        for (let i = 0; i < 8; i++) w.pieces.push(piece("electron", 1080, 140 + i * 58, { q: -1, orbit: i, orbitR: 130, cx: 640, cy: 355, orbitSp: 0 }));
        w.targets.push({ x: 640, y: 355, r: 90, accept: "proton,nin" });
      } else if (ph === 1) {
        [["Conductor · generoso", 280, "conductor"], ["Aislante · celoso", 640, "aislante"], ["Semiconductor · si se lo pides", 1000, "semi"]].forEach(([label, x, kind]) => {
          w.pieces.push(piece("cuenco", x, 380, { static: true, r: 100, house: kind, clickable: true }));
          w.labels.push({ x, y: 508, text: label });
          for (let i = 0; i < 5; i++) w.pieces.push(piece("electron", x, 380, { q: -1, house: kind, orbit: i, orbitR: 48, cx: x, cy: 380, orbitSp: 0.04 }));
        });
        w.pieces.push(piece("linterna", 160, 120));
      } else if (ph === 2) {
        w.pieces.push(piece("proton", 420, 300, { q: 1 }));
        w.pieces.push(piece("electron", 860, 300, { q: -1 }));
        w.pieces.push(piece("proton", 500, 520, { q: 1 }));
        w.pieces.push(piece("proton", 760, 520, { q: 1 }));
        w.pieces.push(piece("electron", 200, 200, { q: -1 }));
        w.pieces.push(piece("electron", 1080, 480, { q: -1 }));
      } else {
        w.pieces.push(piece("plus", 430, 360, { q: 1, plate: true }));
        w.pieces.push(piece("minus", 850, 360, { q: -1, plate: true }));
        w.meters.push({ label: "El hechizo (1 / distancia²)", value: 1, max: 2, color: "#c46a4a" });
      }
    },
    bg(p) {
      if (world.prado && imgs.prado && imgs.prado.width) {
        p.push();
        p.tint(255, 210);
        p.image(imgs.prado, W / 2, H / 2, W, H);
        p.pop();
      }
    },
    draw(p) {
      if (phase === 3) {
        const plates = world.pieces.filter((pc) => pc.plate);
        if (plates.length === 2) {
          const [a, b] = plates;
          const glow = world.meters[0] ? world.meters[0].value : 1;
          p.stroke(196, 106, 74, 40 + 80 * glow);
          p.strokeWeight(6 + 18 * glow);
          p.line(a.x, a.y, b.x, b.y);
        }
      }
    },
    update() {
      if (phase === 0) {
        const n = world.pieces.filter((pc) => (pc.kind === "proton" || pc.kind === "nin") && pc.inBowl).length;
        world.pieces.forEach((pc) => {
          if (pc.kind === "electron") pc.orbitSp = n ? 0.02 : 0;
        });
      }
      if (phase === 1) {
        const lamp = world.pieces.find((pc) => pc.kind === "linterna");
        world.pieces.forEach((pc) => {
          if (pc.house === "conductor" && world.flags.lastClick && world.flags.lastClick.house === "conductor") pc.orbitSp = 0.08;
          if (pc.house === "semi" && lamp && Math.hypot(lamp.x - 1000, lamp.y - 380) < 120) pc.orbitSp = 0.08;
        });
      }
      if (phase === 2) coulomb(0.55);
      if (phase === 3) {
        const plates = world.pieces.filter((pc) => pc.plate);
        if (plates.length === 2 && world.meters[0]) {
          const r = Math.hypot(plates[0].x - plates[1].x, plates[0].y - plates[1].y);
          world.meters[0].value = Math.min(2, (220 * 220) / (r * r));
        }
      }
    }
  };

  KINDS.parade = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 140, y: 220 }, { x: 500, y: 220 }, { x: 700, y: 360 }, { x: 1100, y: 360 }], color: "#8b6914", w: 22, loop: false, speed: 0.006 });
      if (ph === 0) {
        w.pieces.push(piece("bowl", 240, 500, { static: true }));
        w.targets.push({ x: 240, y: 500, r: 55, accept: "marble", label: "un paquete = 10" });
        for (let i = 0; i < 14; i++) w.pieces.push(piece("marble", 900 + (i % 4) * 40, 140 + Math.floor(i / 4) * 40, { color: RAIN[i % 6] }));
      } else if (ph === 1 || ph === 2) {
        w.pieces.push(piece("bowl", 1100, 360, { static: true }));
        w.labels.push({ x: 640, y: 80, text: "Toca el reloj para soltar un paquete." });
        w.pieces.push(piece("paper", 180, 120, { caption: "reloj", clickable: true, static: true }));
        w.meters.push({ label: "Paquetes", value: 0, max: 8, color: "#c46a4a" });
      } else {
        for (let i = 0; i < 8; i++) w.pieces.push(piece("stick", 500, 180 + i * 40, { clickable: true }));
        for (let i = 0; i < 12; i++) w.pieces.push(piece("marble", 640, 200 + (i % 6) * 28, { color: RAIN[i % 8] }));
        w.labels.push({ x: 640, y: 80, text: "Un palito es el fusible. Sácalo: si caen todas, fundió." });
      }
    },
    update() {
      if ((phase === 1 || phase === 2) && world.flags.lastClick && world.flags.lastClick.caption === "reloj") {
        world.flags.lastClick = null;
        const m = piece("marble", 140, 220, { color: "#5c3a21", roll: 1, path: 0 });
        world.pieces.push(m);
        if (world.meters[0]) world.meters[0].value += 1;
      }
    }
  };

  KINDS.ramp = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 180, y: 160 }, { x: 500, y: 420 }, { x: 700, y: 420 }], color: "#e67e22", w: 18, speed: 0.01 });
      w.paths.push({ pts: [{ x: 180, y: 80 }, { x: 900, y: 500 }, { x: 1100, y: 500 }], color: "#c0392b", w: 18, speed: 0.014 });
      w.pieces.push(piece("car", 180, 160, { color: "#c0392b", clickable: true, path: 0 }));
      w.pieces.push(piece("car", 180, 80, { color: "#2980b9", clickable: true, path: 1 }));
      w.pieces.push(piece("bowl", 640, 560, { static: true, caption: "Luggy" }));
      w.targets.push({ x: 640, y: 560, r: 50, accept: "coin", label: "tesoro / minuto" });
      w.meters.push({ label: "Monedas", value: 0, max: 12, color: "#d4a017" });
      if (ph >= 2) w.pieces.push(piece("bowl", 1040, 200, { static: true, caption: "alcancía Ah" }));
      if (ph === 3) w.pieces.push(piece("silk", 640, 300, { color: "#6a8eae" }));
      w.labels.push({ x: 780, y: 100, text: "Toca un coche para soltarlo. Más alto = más empujón." });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        const car = world.flags.lastClick;
        car.roll = 1;
        world.flags.lastClick = null;
      }
      if (world.flags.arrived) {
        world.pieces.push(piece("coin", 640, 520, { n: 1 }));
        world.meters[0].value += world.flags.arrived;
        world.flags.arrived = 0;
      }
    }
  };

  KINDS.materials = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 120, y: 300 }, { x: 600, y: 300 }], color: "#4a4a4a", w: 22, speed: 0.012 });
      w.pieces.push(piece("kapla", 820, 300, { w: 18, h: 160, static: true, caption: "vidrio" }));
      w.pieces.push(piece("churro", 640, 500, { len: 220, thick: 18, color: "#c9844a", clickable: true }));
      w.pieces.push(piece("linterna", 200, 500));
      w.labels.push({ x: 360, y: 220, text: "pasillo de cobre" });
      w.labels.push({ x: 820, y: 200, text: "puerta de vidrio" });
      if (ph >= 2) {
        w.pieces.push(piece("potato", 240, 140, { static: true, caption: "Operation · en la fila" }));
        w.pieces.push(piece("card", 1040, 140, { n: "?", color: "#6a8eae", static: true, caption: "Guess Who · al lado" }));
      }
      w.pieces.push(piece("marble", 140, 300, { color: "#5c3a21", clickable: true, path: 0 }));
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "marble") {
        world.flags.lastClick.roll = 1;
        world.flags.lastClick = null;
      }
      const lamp = world.pieces.find((pc) => pc.kind === "linterna");
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (lamp && ch && Math.hypot(lamp.x - ch.x, lamp.y - ch.y) < 90) ch.color = "#e67e22";
    }
  };

  KINDS.churro = {
    setup(w) {
      w.sliders.push({ x: 80, y: 80, w: 220, min: 80, max: 360, v: 180, label: "largo", key: "len" });
      w.sliders.push({ x: 80, y: 130, w: 220, min: 8, max: 36, v: 16, label: "gordo", key: "thick" });
      w.sliders.push({ x: 80, y: 180, w: 220, min: 0, max: 2, v: 0, label: "material", key: "mat" });
      w.pieces.push(piece("churro", 720, 360, { len: 180, thick: 16, color: "#c9844a", static: true }));
      w.meters.push({ label: "Desfile", value: 0.7, max: 1, color: "#5e7a5e" });
      w.labels.push({ x: 720, y: 220, text: "Largo cansa. Flaco cansa. Material difícil cansa." });
    },
    update() {
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (!ch) return;
      ch.len = world.len || 180;
      ch.thick = world.thick || 16;
      const mat = world.mat || 0;
      ch.color = mat > 1.2 ? "#6e4420" : mat > 0.6 ? "#c9844a" : "#e8c9a0";
      const flow = (ch.thick / 20) / ((ch.len / 180) * (1 + mat));
      world.meters[0].value = Math.max(0.05, Math.min(1, flow));
    }
  };

  KINDS.awg = {
    setup(w, ph) {
      for (let i = 7; i >= 0; i--) {
        w.pieces.push(piece("tile", 640, 360, { r: 30 + i * 22, color: RAIN[i] + "99", static: true, clickable: true, n: i }));
      }
      w.pieces.push(piece("nin", 200, 500));
      w.labels.push({ x: 640, y: 80, text: ph < 2 ? "El arco chico es hilo de hormiga. El grande, camino gordo." : "Cada tres arcos hacia adentro: la mitad de hueco." });
      w.meters.push({ label: "Calibre (chico = gordo)", value: 7, max: 7, color: "#7b4ea3" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n != null) {
        world.meters[0].value = world.flags.lastClick.n;
        const nin = world.pieces.find((pc) => pc.kind === "nin");
        if (nin) { nin.x = 640; nin.y = 360; }
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.heatice = {
    setup(w, ph) {
      w.sliders.push({ x: 80, y: 90, w: 260, min: 0, max: 1, v: 0.2, label: "calor", key: "heat" });
      w.pieces.push(piece("churro", 640, 280, { len: 260, thick: 18, color: "#c9844a", static: true, caption: "cobre" }));
      w.pieces.push(piece("churro", 640, 380, { len: 260, thick: 18, color: "#e8c9a0", static: true, caption: "NTC" }));
      w.meters.push({ label: "Cansancio del cobre", value: 0.3, max: 1, color: "#c46a4a" });
      w.meters.push({ label: "Cansancio del NTC", value: 0.7, max: 1, color: "#5e7a5e" });
      if (ph >= 2) {
        for (let i = 0; i < 12; i++) w.pieces.push(piece("ice", 420 + (i % 6) * 36, 520 + Math.floor(i / 6) * 36, { clickable: true }));
        w.labels.push({ x: 900, y: 540, text: "Hielo entero: cansancio cero. Sácalo: se queja." });
      }
    },
    update() {
      const h = world.heat || 0;
      world.meters[0].value = 0.25 + h * 0.7;
      world.meters[1].value = 0.8 - h * 0.6;
      if (world.flags.lastClick && world.flags.lastClick.kind === "ice") {
        world.flags.lastClick.gone = true;
        world.pieces = world.pieces.filter((pc) => !pc.gone);
        world.flags.lastClick = null;
        world.flags.ice = (world.flags.ice || 0) + 1;
      }
    }
  };

  KINDS.bands = {
    setup(w, ph) {
      if (ph === 0) {
        RAIN.slice(0, 4).forEach((c, i) => w.pieces.push(piece("tile", 200, 180 + i * 90, { color: c, r: 28, caption: ["dígito", "dígito", "× peldaños", "justo"][i] })));
        w.targets.push({ x: 700, y: 360, r: 40, accept: "tile", label: "el tapón" });
        w.pieces.push(piece("churro", 700, 360, { len: 160, thick: 36, color: "#e8c9a0", static: true }));
      } else if (ph === 1) {
        w.sliders.push({ x: 400, y: 200, w: 480, min: 0.1, max: 2, v: 1, label: "pegajoso", key: "flow" });
        w.meters.push({ label: "Lo fácil = 1 / pegajoso", value: 1, max: 2, color: "#5e7a5e" });
      } else if (ph === 2) {
        for (let i = 0; i < 8; i++) w.pieces.push(piece("tile", 200 + (i % 4) * 80, 200 + Math.floor(i / 4) * 80, { r: 22, color: RAIN[i], clickable: true }));
        w.pieces.push(piece("bowl", 860, 360, { static: true, caption: "Perfection" }));
        w.targets.push({ x: 860, y: 360, r: 50, accept: "tile", label: "si entra fácil, puente" });
      } else {
        w.pieces.push(piece("hippo", 640, 400, { clickable: true }));
        w.sliders.push({ x: 400, y: 200, w: 480, min: 0, max: 1, v: 0.2, label: "empujón", key: "height" });
        w.meters.push({ label: "Boca del hipopótamo", value: 0, max: 1, color: "#c46a4a" });
      }
    },
    update() {
      if (phase === 1 && world.meters[0]) world.meters[0].value = 1 / (world.flow || 1);
      if (phase === 3 && world.meters[0]) world.meters[0].value = (world.height || 0) > 0.7 ? 1 : 0;
    }
  };

  KINDS.ohm = {
    setup(w, ph) {
      const names = w.variant === "hopkinson"
        ? ["Empujón-de-vueltas", "Río", "Difícil"]
        : ["Empujón", "Desfile", "Cansancio"];
      const cols = ["#c46a4a", "#6a8eae", "#5e7a5e"];
      names.forEach((n, i) => w.pieces.push(piece("mouse", 280 + i * 280, 220, { color: cols[i], caption: n, static: true })));
      w.sliders.push({ x: 80, y: 80, w: 240, min: 0.3, max: 2, v: 1, label: "empujón", key: "height" });
      w.sliders.push({ x: 80, y: 130, w: 240, min: 0.3, max: 3, v: 1, label: "cansancio", key: "flow" });
      w.pieces.push(piece("churro", 640, 480, { len: 280, thick: 16, color: "#c9844a", static: true }));
      w.meters.push({ label: names[1], value: 1, max: 2, color: cols[1] });
      w.labels.push({ x: 640, y: 360, text: ph === 0 ? "Si dos están en la mesa, el tercero aparece." : "Mismo empujón, más pegajoso → desfile más flaco." });
    },
    update() {
      const V = world.height || 1, R = world.flow || 1;
      world.meters[0].value = V / R;
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (ch) ch.thick = 8 + 18 * (V / R);
    }
  };

  KINDS.power = KINDS.ramp;
  KINDS.eff = {
    setup(w, ph) {
      [280, 640, 1000].forEach((x, i) => {
        w.pieces.push(piece("bowl", x, 360, { static: true }));
        w.targets.push({ x, y: 360, r: 50, accept: "marble", label: ["fuente", "eslabón flojo", "casa"][i] });
      });
      for (let i = 0; i < 10; i++) w.pieces.push(piece("marble", 80, 120 + i * 40, { color: "#6a8eae" }));
      if (ph >= 1) w.pieces.push(piece("potato", 640, 160, { static: true, caption: "Operation: si suena, se pierde la mitad" }));
      w.meters.push({ label: "Llegan / salieron", value: 1, max: 1, color: "#5e7a5e" });
    },
    update() {
      const held = world.targets.map((t) => t.held || 0);
      if (held[0]) world.meters[0].value = (held[2] || 0) / held[0];
    }
  };
  KINDS.energy = {
    setup(w, ph) {
      w.pieces.push(piece("lamp", 640, 280, { on: true, static: true, clickable: true, toggle: "lamp" }));
      w.sliders.push({ x: 360, y: 120, w: 520, min: 1, max: 4, v: 1, label: "minutos", key: "height" });
      w.meters.push({ label: "Brillo (rapidez)", value: 1, max: 1, color: "#f5c518" });
      w.meters.push({ label: "Tesoro (monedas)", value: 1, max: 4, color: "#d4a017" });
      w.labels.push({ x: 640, y: 500, text: ph < 2 ? "El brillo no cambia. El tesoro sí, con el reloj." : "Tres vueltas, tres alquileres. El aparato no se volvió más gordo." });
    },
    update() {
      world.meters[0].value = 1;
      world.meters[1].value = world.height || 1;
    }
  };

  KINDS.series = {
    setup(w, ph) {
      const open = w.variant === "fuse" && ph >= 1;
      w.paths.push({ pts: [{ x: 120, y: 360 }, { x: 400, y: 360 }, { x: 640, y: 360 }, { x: 1160, y: 360 }], color: "#4a4a4a", w: 20, open: !open, speed: 0.01 });
      w.pieces.push(piece("car", 140, 350, { clickable: true, path: 0 }));
      if (w.variant === "sum") {
        w.labels.push({ x: 400, y: 280, text: "liso" });
        w.labels.push({ x: 640, y: 280, text: "zigzag" });
        w.labels.push({ x: 900, y: 280, text: "campana" });
        w.meters.push({ label: "Tiempo", value: 0.3 + ph * 0.25, max: 1, color: "#c46a4a" });
      }
      if (w.variant === "fuse") {
        w.pieces.push(piece("ice", 640, 300, { clickable: true, caption: "fusible" }));
        w.labels.push({ x: 640, y: 140, text: "Saca el cubito: se apaga toda la fila." });
      }
      if (w.variant === "identity") {
        for (let i = 0; i < 3; i++) w.pieces.push(piece("nin", 400 + i * 160, 260, { static: true }));
        w.labels.push({ x: 640, y: 160, text: "Un solo camino. El desfile es el mismo en todos." });
      }
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        world.flags.lastClick.roll = world.paths[0].open === false ? 0 : 1;
        world.flags.lastClick = null;
      }
      if (world.flags.lastClick && world.flags.lastClick.kind === "ice") {
        world.paths[0].open = false;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.divider = {
    setup(w) {
      [1, 3, 5].forEach((n, i) => {
        w.pieces.push(piece("block", 400 + i * 160, 500 - n * 40, { color: RAIN[n], r: 40, static: true, caption: String(n) }));
        w.pieces.push(piece("nin", 400 + i * 160, 500 - n * 40 - 50));
      });
      w.labels.push({ x: 640, y: 120, text: "Empujón total 9. El 5 se lleva más rebanada." });
      w.meters.push({ label: "Rebanada del 5", value: 5 / 9, max: 1, color: "#c46a4a" });
    }
  };

  KINDS.parallel = {
    setup(w, ph) {
      w.pieces.push(piece("house", 180, 200, { static: true, caption: "Casa A", color: "#e8d7b8" }));
      w.pieces.push(piece("house", 1100, 200, { static: true, caption: "Casa B", color: "#d7e6d2" }));
      w.paths.push({ pts: [{ x: 220, y: 240 }, { x: 1060, y: 240 }], color: "#5e7a5e", w: 16, speed: 0.012 });
      w.paths.push({ pts: [{ x: 220, y: 400 }, { x: 1060, y: 400 }], color: "#c46a4a", w: 10, speed: 0.006 });
      w.pieces.push(piece("car", 240, 230, { color: "#5e7a5e", clickable: true, path: 0 }));
      w.pieces.push(piece("car", 240, 390, { color: "#c46a4a", clickable: true, path: 1 }));
      if (w.variant === "fuse") {
        w.pieces.push(piece("lamp", 500, 180, { on: true, clickable: true, toggle: "lamp" }));
        w.pieces.push(piece("lamp", 780, 180, { on: true, clickable: true, toggle: "lamp" }));
        w.labels.push({ x: 640, y: 80, text: "Cubre una: la otra sigue. Quita un riel: el otro coche sigue." });
      } else if (w.variant === "easy") {
        w.pieces.push(piece("hippo", 640, 560, { clickable: true }));
        w.labels.push({ x: 640, y: 100, text: "El camino fácil (el de arriba, más gordo) se lleva más desfile." });
      } else {
        w.labels.push({ x: 640, y: 100, text: "Dos casas. Todo camino válido toca las dos." });
      }
      if (ph >= 2 && w.variant === "fuse") {
        w.pieces.push(piece("kapla", 640, 320, { w: 14, h: 200, caption: "corto" }));
      }
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        world.flags.lastClick.roll = 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.kcl = {
    setup(w) {
      w.pieces.push(piece("bowl", 640, 360, { static: true, r: 110, caption: "nudo" }));
      w.targets.push({ x: 640, y: 360, r: 80, accept: "marble", label: "entra = sale" });
      [[200, 200], [200, 500], [200, 360]].forEach(([x, y], i) => {
        w.labels.push({ x, y: y - 40, text: "entra " + [3, 2, 4][i] });
        for (let k = 0; k < [3, 2, 4][i]; k++) w.pieces.push(piece("marble", x, y + k * 18, { color: RAIN[i] }));
      });
      w.labels.push({ x: 1040, y: 240, text: "sale 5" });
      w.labels.push({ x: 1040, y: 480, text: "¿sale ?" });
      w.meters.push({ label: "Faltan por salir", value: 4, max: 9, color: "#7b4ea3" });
    },
    update() {
      const held = world.targets[0] ? world.targets[0].held || 0 : 0;
      world.meters[0].value = Math.max(0, 9 - held);
    }
  };

  KINDS.nest = {
    setup(w, ph) {
      for (let i = 7; i >= 0; i--) w.pieces.push(piece("tile", 640, 360, { r: 28 + i * 20, color: RAIN[i], static: true, clickable: true, n: i, caption: i === 0 ? "adentro" : "" }));
      w.labels.push({ x: 640, y: 100, text: ph < 2 ? "Nombra primero el arco de adentro." : "Sustituye el patio por un listón. Luego reabre." });
      w.flags.named = [];
      w.meters.push({ label: "De adentro hacia afuera", value: 0, max: 8, color: "#7b4ea3" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n != null) {
        world.flags.named.push(world.flags.lastClick.n);
        world.meters[0].value = world.flags.named.length;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.ladder = {
    setup(w) {
      for (let i = 0; i < 4; i++) {
        w.pieces.push(piece("kapla", 640, 520 - i * 90, { w: 220 - i * 20, h: 16, static: true }));
        w.pieces.push(piece("nin", 640, 480 - i * 90, { clickable: true, n: 3 - i, caption: i === 0 ? "último" : "" }));
      }
      w.labels.push({ x: 640, y: 80, text: "Empieza por el último peldaño. Si empiezas por el primero, se enreda." });
      w.flags.order = [];
      w.meters.push({ label: "Orden de reducción", value: 0, max: 4, color: "#5e7a5e" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "nin") {
        world.flags.order.push(world.flags.lastClick.n);
        world.meters[0].value = world.flags.order.length;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.pot = {
    setup(w) {
      w.pieces.push(piece("kapla", 640, 360, { w: 520, h: 18, static: true }));
      w.pieces.push(piece("nin", 640, 330));
      w.pieces.push(piece("hippo", 1000, 500, { caption: "golosa" }));
      w.pieces.push(piece("marble", 280, 500, { color: "#f0e6d2", caption: "educada" }));
      w.sliders.push({ x: 380, y: 160, w: 520, min: 0, max: 1, v: 0.5, label: "grifo", key: "height" });
      w.meters.push({ label: "Tobogán del grifo", value: 0.5, max: 1, color: "#c46a4a" });
    },
    update() {
      const nin = world.pieces.find((pc) => pc.kind === "nin");
      const hip = world.pieces.find((pc) => pc.kind === "hippo");
      if (nin) nin.x = 380 + (world.height || 0.5) * 520;
      let v = world.height || 0.5;
      if (hip && nin && Math.hypot(hip.x - nin.x, hip.y - nin.y) < 120) v = Math.min(1, v + 0.15);
      world.meters[0].value = v;
    }
  };

  KINDS.meters = {
    setup(w, ph) {
      w.paths.push({ pts: [{ x: 140, y: 400 }, { x: 1140, y: 400 }], color: "#4a4a4a", w: 18 });
      w.pieces.push(piece("potato", 400, 250, { caption: "Operation · en la fila" }));
      w.pieces.push(piece("card", 900, 180, { n: "¿?", color: "#6a8eae", caption: "Guess Who · al lado" }));
      w.pieces.push(piece("tile", 640, 560, { color: "#5e7a5e", caption: "Perfection · palacio apagado" }));
      w.labels.push({ x: 640, y: 80, text: ph === 0 ? "Amperímetro en la fila." : ph === 1 ? "Voltímetro al lado." : "Ohmímetro con el palacio apagado." });
    }
  };

  KINDS.isource = {
    setup(w, ph) {
      w.pieces.push(piece("caterpillar", 300, 260, { clickable: true }));
      w.paths.push({ pts: [{ x: 200, y: 500 }, { x: 1000, y: 200 }], color: "#e67e22", w: 16, speed: 0.01 });
      w.pieces.push(piece("car", 220, 490, { clickable: true, path: 0 }));
      w.pieces.push(piece("churro", 900, 480, { len: 160, thick: 20, color: "#c9844a" }));
      w.labels.push({ x: 640, y: 80, text: ph < 2 ? "El gusanito manda el paso. El coche de la rampa, no." : "Tapa el final de la rampa: el coche se para. El gusanito sigue." });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "car") {
        const tap = world.pieces.find((pc) => pc.kind === "churro");
        const car = world.flags.lastClick;
        car.roll = (tap && tap.x > 800 && phase >= 2) ? 0 : 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.disguise = {
    setup(w, ph) {
      w.pieces.push(piece("robot", 400, 320, { clickable: true, caption: "Transformers" }));
      w.pieces.push(piece("car", 400, 500, { static: true, caption: "el mismo, otro disfraz" }));
      w.pieces.push(piece("potato", 860, 340));
      w.pieces.push(piece("hat", 860, 200, { color: RAIN[2], clickable: true, wear: true }));
      w.pieces.push(piece("nin", 1100, 400, { caption: "carga" }));
      w.labels.push({ x: 640, y: 80, text: ph < 2 ? "Hacia fuera hace lo mismo." : "El Nin-carga no se entera del disfraz de adentro." });
    }
  };

  KINDS.mesh = {
    setup(w) {
      w.pieces.push(piece("tile", 500, 320, { r: 90, color: "#6a8eae55", static: true, caption: "malla 1" }));
      w.pieces.push(piece("tile", 780, 320, { r: 90, color: "#c46a4a55", static: true, caption: "malla 2" }));
      w.pieces.push(piece("kapla", 640, 320, { w: 14, h: 160, static: true, caption: "pared compartida (−)" }));
      w.labels.push({ x: 640, y: 80, text: "La pared compartida se resta. Por casas se cuentan alturas." });
    }
  };

  KINDS.diamond = {
    setup(w, ph) {
      const nums = ph === 0 ? [5, 20, 5, 10] : [5, 5, 10, 10];
      const pos = [[640, 180], [860, 360], [640, 540], [420, 360]];
      nums.forEach((n, i) => w.pieces.push(piece("card", pos[i][0], pos[i][1], { n, color: RAIN[i], static: true })));
      w.pieces.push(piece("marble", 640, 360, { color: "#5c3a21" }));
      w.labels.push({ x: 640, y: 80, text: ph === 0 ? "5×20 ≠ 5×10: la diagonal pasa." : "Productos iguales: la canica se queda." });
    },
    update() {
      const m = world.pieces.find((pc) => pc.kind === "marble");
      if (!m || m.grabbed) return;
      if (phase === 0) { m.x += (860 - m.x) * 0.02; m.y += (200 - m.y) * 0.02; }
    }
  };

  KINDS.super = {
    setup(w, ph) {
      w.pieces.push(piece("lamp", 400, 240, { on: ph !== 1, clickable: true, toggle: "lamp", caption: "tesoro A" }));
      w.pieces.push(piece("lamp", 880, 240, { on: ph !== 0, clickable: true, toggle: "lamp", caption: "tesoro B" }));
      w.pieces.push(piece("churro", 640, 480, { len: 240, thick: 18, color: "#c9844a", caption: "calor: no se superpone" }));
      w.labels.push({ x: 640, y: 80, text: ph < 3 ? "Enciende uno, cuenta. Enciende el otro, suma." : "Amasa con las dos manos: el calor no es la suma." });
      w.meters.push({ label: "Desfile A+B", value: (ph !== 1 ? 1 : 0) + (ph !== 0 ? 1 : 0), max: 2, color: "#6a8eae" });
    },
    update() {
      const lamps = world.pieces.filter((pc) => pc.kind === "lamp");
      world.meters[0].value = lamps.filter((l) => l.on).length;
    }
  };

  KINDS.box = {
    setup(w) {
      w.pieces.push(piece("house", 640, 320, { r: 100, static: true, caption: "cajita de dos bornes" }));
      w.pieces.push(piece("nin", 640, 520, { caption: "carga: no abras la caja" }));
      w.labels.push({ x: 640, y: 80, text: "Solo pincha dos bornes. Magic 8 Ball: ves la respuesta, no el cubo." });
    }
  };

  KINDS.match = {
    setup(w) {
      [1, 2, 4, 8].forEach((n, i) => {
        w.pieces.push(piece("kapla", 280 + i * 200, 400, { w: 20, h: 30 + n * 22, static: true, clickable: true, n, caption: "carga " + n }));
      });
      w.labels.push({ x: 640, y: 120, text: "Pasillo de la cajita = 4. Toca cada carga. El máximo es 4." });
      w.meters.push({ label: "Tesoro entregado", value: 0, max: 4, color: "#d4a017" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n) {
        const n = world.flags.lastClick.n;
        world.meters[0].value = n === 4 ? 4 : n === 2 || n === 8 ? 2 : 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.echo = {
    setup(w, ph) {
      const cols = ["#c46a4a", "#f5c518", "#5e7a5e", "#6a8eae"];
      cols.forEach((c, i) => w.pieces.push(piece("tile", 340 + i * 160, 360, { color: c, r: 40, clickable: true, n: i })));
      w.flags.seq = [];
      w.labels.push({ x: 640, y: 120, text: ph === 0 ? "Tú tocas, el palacio responde. Luego al revés. El eco es justo." : "Suelta en A, cuenta en B. Muda el tesoro: mismo número." });
      w.meters.push({ label: "Eco", value: 0, max: 4, color: "#7b4ea3" });
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.n != null) {
        world.flags.seq.push(world.flags.lastClick.n);
        world.meters[0].value = world.flags.seq.length % 5;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.cap = {
    setup(w, ph) {
      w.pieces.push(piece("plate", 520, 360, { color: "#c46a4a" }));
      w.pieces.push(piece("plate", 760, 360, { color: "#6a8eae" }));
      w.pieces.push(piece("silk", 640, 360, { color: "#f3c6d8", r: 50 }));
      w.sliders.push({ x: 360, y: 100, w: 560, min: 40, max: 280, v: 120, label: "distancia", key: "height" });
      w.meters.push({ label: "Viento", value: 0.7, max: 1, color: "#c46a4a" });
      w.meters.push({ label: "Cubo", value: 0.5, max: 1, color: "#6a8eae" });
      if (w.variant === "bank" || ph >= 2) {
        w.pieces.push(piece("bowl", 240, 520, { static: true, caption: "paralelo" }));
        w.pieces.push(piece("bowl", 400, 520, { static: true }));
        w.pieces.push(piece("bowl", 980, 480, { static: true, caption: "serie" }));
        w.pieces.push(piece("bowl", 980, 600, { static: true }));
      }
    },
    update() {
      const d = world.height || 120;
      const plates = world.pieces.filter((pc) => pc.kind === "plate");
      if (plates[0] && plates[1] && !plates[0].grabbed) {
        plates[0].x = 640 - d / 2; plates[1].x = 640 + d / 2;
      }
      world.meters[0].value = Math.min(1, 80 / d);
      world.meters[1].value = Math.min(1, 80 / d);
    }
  };

  KINDS.tau = {
    setup(w) {
      w.pieces.push(piece("bowl", 640, 400, { static: true, r: 120, caption: w.variant === "L" ? "ovillo" : "cubo" }));
      w.targets.push({ x: 640, y: 400, r: 80, accept: "marble", label: w.variant === "L" ? "desfile" : "paquetes" });
      w.sliders.push({ x: 80, y: 90, w: 260, min: 0.3, max: 3, v: 1, label: "pasillo", key: "flow" });
      for (let i = 0; i < 16; i++) w.pieces.push(piece("marble", 80, 160 + i * 28, { color: w.variant === "L" ? "#c46a4a" : "#6a8eae" }));
      w.meters.push({ label: "Llenado (tau)", value: 0, max: 1, color: "#7b4ea3" });
      w.labels.push({ x: 960, y: 120, text: "A un tau, el 63 %. A cinco, se da por lleno." });
    },
    update() {
      const held = world.targets[0] ? world.targets[0].held || 0 : 0;
      const tau = world.flow || 1;
      world.meters[0].value = 1 - Math.exp(-held / (5 * tau));
    }
  };

  KINDS.sq = {
    setup(w) {
      w.sliders.push({ x: 80, y: 90, w: 280, min: 1, max: 4, v: 1, label: w.variant === "L" ? "desfile" : "tobogán", key: "height" });
      w.meters.push({ label: "Tesoro escondido", value: 1, max: 16, color: "#d4a017" });
      w.labels.push({ x: 720, y: 200, text: "Duplicar, cuatro veces. El tesoro crece al cuadrado." });
      for (let i = 0; i < 4; i++) w.pieces.push(piece("coin", 500 + i * 70, 400, { n: 1, static: true }));
    },
    update() {
      const h = world.height || 1;
      world.meters[0].value = h * h;
    }
  };

  KINDS.flux = {
    setup(w) {
      w.paths.push({ pts: [{ x: 120, y: 360 }, { x: 500, y: 360 }, { x: 640, y: 360 }, { x: 780, y: 360 }, { x: 1160, y: 360 }], color: "#7b4ea3", w: 70 });
      w.pieces.push(piece("kapla", 640, 360, { w: 40, h: 180, static: true, caption: "cuello" }));
      for (let i = 0; i < 10; i++) w.pieces.push(piece("marble", 160, 200 + i * 28, { color: "#7b4ea3" }));
      w.pieces.push(piece("varita", 200, 120));
      w.labels.push({ x: 640, y: 80, text: "Mismo río, cuello más flaco: más densidad." });
      w.meters.push({ label: "Densidad en el cuello", value: 0.4, max: 1, color: "#7b4ea3" });
    },
    update() {
      const n = world.pieces.filter((pc) => pc.kind === "marble" && pc.x > 560 && pc.x < 720).length;
      world.meters[0].value = Math.min(1, 0.3 + n * 0.1);
    }
  };

  KINDS.gap = {
    setup(w, ph) {
      w.pieces.push(piece("tile", 640, 360, { r: 140, color: "#6a8eae55", static: true }));
      w.pieces.push(piece("kapla", 780, 360, { w: 24, h: 80, clickable: true, caption: "huequito" }));
      w.pieces.push(piece("varita", 240, 240));
      w.meters.push({ label: "Empujón necesario", value: 0.3, max: 1, color: "#c46a4a" });
      w.labels.push({ x: 640, y: 80, text: ph === 0 ? "Anillo cerrado: fácil." : "Abre el huequito: el aire se come el empujón." });
    },
    update() {
      const gap = world.pieces.find((pc) => pc.caption === "huequito");
      world.meters[0].value = gap && Math.abs(gap.x - 640) > 80 ? 0.85 : 0.25;
    }
  };

  KINDS.memory = {
    setup(w) {
      w.pieces.push(piece("churro", 640, 360, { len: 280, thick: 22, color: "#c9844a" }));
      w.labels.push({ x: 640, y: 120, text: "Estira y suelta. No vuelve del todo. El hierro recuerda." });
      w.meters.push({ label: "Memoria (no vuelve a cero)", value: 0.2, max: 1, color: "#c46a4a" });
    },
    update() {
      const ch = world.pieces.find((pc) => pc.kind === "churro");
      if (ch && !ch.grabbed) {
        ch.len += (200 - ch.len) * 0.02;
        world.meters[0].value = Math.min(1, Math.abs(ch.len - 200) / 80 + 0.2);
      }
    }
  };

  KINDS.lenz = {
    setup(w) {
      w.pieces.push(piece("silk", 400, 360, { color: "#6a8eae", r: 80 }));
      w.pieces.push(piece("yarn", 860, 360, { color: "#c46a4a" }));
      w.pieces.push(piece("nin", 980, 360, { caption: "eco" }));
      w.labels.push({ x: 640, y: 100, text: "Silk quieto: calla. Ondea de prisa: el Nin salta atrás." });
    },
    update() {
      const silk = world.pieces.find((pc) => pc.kind === "silk");
      const nin = world.pieces.find((pc) => pc.kind === "nin");
      if (silk && nin && silk.grabbed) {
        nin.x += (silk.x < silk._lx ? 8 : -8);
      }
      if (silk) silk._lx = silk.x;
    }
  };

  KINDS.freewheel = {
    setup(w) {
      w.paths.push({ pts: [{ x: 140, y: 300 }, { x: 700, y: 300 }], color: "#4a4a4a", w: 18, open: true, speed: 0.01 });
      w.paths.push({ pts: [{ x: 700, y: 300 }, { x: 700, y: 500 }, { x: 140, y: 500 }, { x: 140, y: 300 }], color: "#5e7a5e", w: 14, speed: 0.01 });
      w.pieces.push(piece("yarn", 200, 200));
      w.pieces.push(piece("marble", 160, 300, { clickable: true, path: 0, color: "#c46a4a" }));
      w.labels.push({ x: 640, y: 80, text: "Sin el arco amigo, abrir es chispazo. Con el arco, el desfile se desvía." });
      w.pieces.push(piece("tile", 700, 300, { color: "#5e7a5e", r: 24, caption: "camino amigo", static: true }));
    },
    update() {
      if (world.flags.lastClick && world.flags.lastClick.kind === "marble") {
        world.flags.lastClick.roll = 1;
        world.flags.lastClick = null;
      }
    }
  };

  KINDS.swing = {
    setup(w, ph) {
      w.pieces.push(piece("pendulum", 640, 280, { arm: 160, static: true }));
      w.sliders.push({ x: 80, y: 90, w: 260, min: 0.4, max: 2.2, v: 1, label: "prisa", key: "flow" });
      w.meters.push({ label: "Periodo", value: 1, max: 2, color: "#7b4ea3" });
      w.meters.push({ label: "Frecuencia", value: 1, max: 2, color: "#c46a4a" });
      if (w.variant === "phase") {
        w.pieces.push(piece("silk", 940, 400, { color: "#6a8eae" }));
        w.labels.push({ x: 640, y: 560, text: "Si el silk llega después, el desfile retrasa." });
      } else if (w.variant === "avg") {
        w.pieces.push(piece("bowl", 400, 560, { static: true, caption: "arriba" }));
        w.pieces.push(piece("bowl", 880, 560, { static: true, caption: "abajo" }));
        w.labels.push({ x: 640, y: 80, text: "Diez ciclos: la balanza empata. Promedio cero." });
      } else {
        w.pieces.push(piece("top", 240, 400));
        w.labels.push({ x: 640, y: 560, text: "Más prisa, periodo más corto." });
      }
      w.flags.th = 0;
    },
    update() {
      const f = world.flow || 1;
      world.flags.th += 0.04 * f;
      const pen = world.pieces.find((pc) => pc.kind === "pendulum");
      if (pen) {
        const ang = Math.sin(world.flags.th) * 0.8;
        pen.x = 640 + Math.sin(ang) * 160;
        pen.y = 220 + Math.cos(ang) * 160;
      }
      world.meters[0].value = 1 / f;
      world.meters[1].value = f / 2.2;
    }
  };

  KINDS.rms = {
    setup(w) {
      w.pieces.push(piece("churro", 400, 360, { len: 220, thick: 20, color: "#c9844a", caption: "río quieto" }));
      w.pieces.push(piece("churro", 880, 360, { len: 220, thick: 20, color: "#e8c9a0", caption: "vaivén" }));
      w.meters.push({ label: "Calor quieto", value: 1, max: 1, color: "#c46a4a" });
      w.meters.push({ label: "Calor RMS del columpio", value: 0.707, max: 1, color: "#7b4ea3" });
      w.labels.push({ x: 640, y: 120, text: "Mismo pico, menos calor. El abrigo se compra contra el pico." });
    }
  };

  KINDS.photo = {
    setup(w) {
      w.pieces.push(piece("pendulum", 520, 320, { arm: 150, static: true }));
      w.pieces.push(piece("camera", 980, 280));
      w.flags.th = 0;
      w.labels.push({ x: 640, y: 80, text: "En el pico, pendiente cero. Al cruzar el medio, máxima. Toma la foto." });
      w.meters.push({ label: "Pendiente", value: 0, max: 1, color: "#c46a4a" });
    },
    update() {
      world.flags.th += 0.04;
      const pen = world.pieces.find((pc) => pc.kind === "pendulum");
      const ang = Math.sin(world.flags.th) * 0.9;
      if (pen) {
        pen.x = 520 + Math.sin(ang) * 150;
        pen.y = 240 + Math.cos(ang) * 150;
      }
      world.meters[0].value = Math.abs(Math.cos(world.flags.th));
    }
  };

  KINDS.rlc = {
    setup(w) {
      [["Tapón", "#c46a4a", 0], ["Ovillo", "#7b4ea3", 1.57], ["Cubo", "#6a8eae", -1.57]].forEach(([n, c, ph], i) => {
        w.pieces.push(piece("mouse", 280 + i * 280, 240, { color: c, caption: n, static: true, ph }));
      });
      w.sliders.push({ x: 80, y: 80, w: 240, min: 0.4, max: 2.4, v: 1, label: "música", key: "flow" });
      w.meters.push({ label: "Ovillo pegajoso", value: 0.4, max: 1, color: "#7b4ea3" });
      w.meters.push({ label: "Cubo fácil", value: 0.4, max: 1, color: "#6a8eae" });
      w.labels.push({ x: 640, y: 500, text: "A más música, ovillo más pegajoso, cubo más fácil." });
    },
    update() {
      const f = world.flow || 1;
      world.meters[0].value = Math.min(1, f / 2);
      world.meters[1].value = Math.min(1, 1 / f);
    }
  };

  KINDS.bill = {
    setup(w) {
      w.sliders.push({ x: 80, y: 90, w: 280, min: 0, max: 90, v: 0, label: "ángulo", key: "height" });
      w.meters.push({ label: "Tesoro facturado", value: 1, max: 1, color: "#d4a017" });
      w.pieces.push(piece("house", 900, 360, { static: true, caption: "caja registradora" }));
      w.labels.push({ x: 500, y: 280, text: "Cero grados: se factura todo. Noventa: el cajero no cobra." });
    },
    update() {
      const ang = (world.height || 0) * Math.PI / 180;
      world.meters[0].value = Math.abs(Math.cos(ang));
    }
  };

  KINDS.streets = {
    setup(w) {
      w.paths.push({ pts: [{ x: 200, y: 400 }, { x: 1080, y: 400 }], color: "#c46a4a", w: 10 });
      w.paths.push({ pts: [{ x: 640, y: 120 }, { x: 640, y: 640 }], color: "#6a8eae", w: 10 });
      w.labels.push({ x: 1080, y: 380, text: "calle de verdad" });
      w.labels.push({ x: 760, y: 140, text: "calle de lado" });
      w.pieces.push(piece("arrow", 640, 400, { dx: 160, dy: -120, static: true }));
      w.sliders.push({ x: 80, y: 80, w: 220, min: -180, max: 180, v: 0, label: "ángulo", key: "height" });
      w.labels.push({ x: 240, y: 200, text: "j gira noventa. Ovillo +j, cubo −j." });
    },
    update() {
      const ar = world.pieces.find((pc) => pc.kind === "arrow");
      if (ar) {
        const a = (world.height || 0) * Math.PI / 180;
        ar.dx = Math.cos(a) * 180;
        ar.dy = -Math.sin(a) * 180;
      }
    }
  };

  global.EA_MAGIA = { boot, show, hide, floors };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
