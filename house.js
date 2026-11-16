// Sollagos — casa 3D (three.js) + scroll (GSAP ScrollTrigger)
// Hero: as placas pousam no telhado conforme o scroll. Simulador: nº de placas muda com o consumo.
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroCanvas = document.getElementById("heroCanvas");
const simCanvas = document.getElementById("simCanvas");

let THREE, gsap, ScrollTrigger;
try {
  [THREE, { default: gsap }, { default: ScrollTrigger }] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"),
    import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm"),
    import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm"),
  ]);
  gsap.registerPlugin(ScrollTrigger);
  const t = document.createElement("canvas");
  if (!(t.getContext("webgl2") || t.getContext("webgl"))) throw new Error("sem WebGL");
} catch (e) {
  console.warn("3D indisponível, usando versão estática", e);
  root.classList.add("no3d");
}

const pointer = { x: 0, y: 0 };
addEventListener("pointermove", e => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; }, { passive: true });

function panelTexture() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 224;
  const g = c.getContext("2d");
  g.fillStyle = "#c9d3e6"; g.fillRect(0, 0, 256, 224);              // moldura
  const grd = g.createLinearGradient(0, 0, 256, 224); grd.addColorStop(0, "#1b3f96"); grd.addColorStop(1, "#0c1f55");
  g.fillStyle = grd; g.fillRect(8, 8, 240, 208);
  g.strokeStyle = "rgba(140,175,255,.55)"; g.lineWidth = 2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(8 + i * 40, 8); g.lineTo(8 + i * 40, 216); g.stroke(); }
  for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(8, 8 + j * 52); g.lineTo(248, 8 + j * 52); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(255,214,130,1)"); r.addColorStop(.25, "rgba(255,170,60,.55)"); r.addColorStop(1, "rgba(255,144,0,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function build(canvas, opt = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x2a4a3a, 0.5); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1); dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024); dir.shadow.bias = -0.0006; dir.shadow.normalBias = 0.03;
  Object.assign(dir.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 40 });
  scene.add(dir);

  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...o });
  const add = (geo, m, x = 0, y = 0, z = 0, parent = scene) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  // ilha
  add(new THREE.CylinderGeometry(5.6, 5.2, 0.5, 40), mat(0x4aa56b), 0, -0.25, 0).castShadow = false;
  add(new THREE.CylinderGeometry(5.2, 3.9, 1.1, 40), mat(0x8a5a3c), 0, -1.05, 0);
  add(box(0.9, 0.03, 3.2), mat(0xe9d7ad), 0.9, 0.015, 3.2);

  // corpo da casa (perfil com empena, extrudado na largura)
  const s = new THREE.Shape(); s.moveTo(-1.6, 0); s.lineTo(1.6, 0); s.lineTo(1.6, 2); s.lineTo(0, 3.1); s.lineTo(-1.6, 2); s.closePath();
  const body = new THREE.ExtrudeGeometry(s, { depth: 4.4, bevelEnabled: false }); body.translate(0, 0, -2.2); body.rotateY(Math.PI / 2);
  add(body, mat(0xf6efe2));
  add(box(4.5, 0.25, 3.3), mat(0xd8cdb8), 0, 0.125, 0);            // rodapé

  // telhado: duas águas
  const run = 1.9, rise = 1.1 * run / 1.6, L = Math.hypot(run, rise), th = Math.atan2(rise, run);
  const roofMat = mat(0xc9653d);
  const slopes = [0, Math.PI].map(ry => {
    const g = new THREE.Group(); g.position.set(0, 3.1, 0); g.rotation.y = ry;
    const inner = new THREE.Group(); inner.rotation.x = th; g.add(inner); scene.add(g);
    add(box(4.9, 0.14, L), roofMat, 0, 0.07, L / 2, inner);
    return inner;
  });
  add(box(5, 0.16, 0.22), mat(0xa94f2d), 0, 3.2, 0);                // cumeeira

  // janelas e porta
  const winMat = new THREE.MeshStandardMaterial({ color: 0x1b2c55, emissive: 0xffb84d, emissiveIntensity: 0, roughness: 0.3 });
  const white = mat(0xffffff);
  add(box(1.16, 0.96, 0.06), white, -1.0, 1.2, 1.6); add(box(1.0, 0.8, 0.09), winMat, -1.0, 1.2, 1.6);
  add(box(0.06, 0.96, 1.06), white, 2.2, 1.2, 0); add(box(0.09, 0.8, 0.9), winMat, 2.2, 1.2, 0);
  add(box(0.87, 1.5, 0.06), white, 0.9, 0.75, 1.6); add(box(0.75, 1.4, 0.09), mat(0x204c97), 0.9, 0.72, 1.6);
  add(new THREE.SphereGeometry(0.04, 8, 8), mat(0xffb340), 1.15, 0.72, 1.66);
  add(box(0.1, 0.42, 0.3), mat(0xe3e6ee), 2.24, 1.0, 1.15);        // medidor
  const led = add(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x2bd46a }), 2.3, 1.1, 1.15); led.castShadow = false;

  // vegetação
  const leaf = mat(0x2f7d4f), leaf2 = mat(0x3d9a5a), trunk = mat(0x7a5236);
  [[-3.6, -0.6, 1.15], [-3.1, 2.0, 0.8], [3.7, -1.9, 0.95]].forEach(([x, z, k]) => {
    add(new THREE.CylinderGeometry(0.1 * k, 0.16 * k, 1.1 * k, 6), trunk, x, 0.55 * k, z);
    add(new THREE.IcosahedronGeometry(0.85 * k, 0), leaf, x, 1.6 * k, z);
    add(new THREE.IcosahedronGeometry(0.55 * k, 0), leaf2, x + 0.2 * k, 2.3 * k, z);
  });
  [[2.1, 2.3, 0.38], [-2.4, 2.1, 0.32], [-0.3, 2.2, 0.26]].forEach(([x, z, r]) => add(new THREE.IcosahedronGeometry(r, 0), leaf2, x, r * 0.7, z));

  // placas (6 x 3 na água da frente)
  const pMat = new THREE.MeshStandardMaterial({ map: panelTexture(), roughness: 0.3, metalness: 0.35, emissive: 0x1a3a8a, emissiveIntensity: 0.2 });
  const pGeo = box(0.7, 0.045, 0.62), slots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) slots.push({ r, c });
  slots.sort((a, b) => a.r - b.r || Math.abs(a.c - 2.5) - Math.abs(b.c - 2.5));
  const baseY = 0.14 + 0.03;
  const panels = slots.map(({ r, c }) => {
    const m = add(pGeo, pMat, -2.25 + 0.35 + c * 0.76, baseY, 0.18 + 0.31 + r * 0.68, slopes[0]);
    m.visible = false; return { v: 0, mesh: m };
  });

  // sol
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffc85a, toneMapped: false })); scene.add(sun);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); glow.scale.setScalar(9); sun.add(glow);

  // fluxo de energia: telhado -> medidor
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(1.9, 2.75, 0.9), new THREE.Vector3(2.45, 2.55, 1.15), new THREE.Vector3(2.42, 1.9, 1.15), new THREE.Vector3(2.32, 1.25, 1.15)]);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffb340, toneMapped: false });
  const dots = [...Array(5)].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), dotMat); scene.add(d); return d; });

  const state = { sun: 0, lit: 0, orbit: 0, drag: 0 };
  const cDawn = new THREE.Color(0xff7a3c), cDay = new THREE.Color(0xfff1dc), tmp = new THREE.Color();
  let R = 11.5;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    R = (opt.dist || 12.5) * Math.max(1, 1.15 / cam.aspect);
    const [ox, oy] = opt.shift ? opt.shift(w, h) : [0, 0];
    ox || oy ? cam.setViewOffset(w, h, ox, oy, w, h) : cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  function frame(ms) {
    const t = ms / 1000, sv = state.sun;
    let on = 0;
    for (const p of panels) {
      const m = p.mesh, v = p.v; m.visible = v > 0.01; if (v > 0.5) on++;
      m.position.y = baseY + (1 - v) * 2.4; m.scale.setScalar(0.5 + 0.5 * v); m.rotation.z = (1 - v) * 0.5;
    }
    sun.position.set(5 - 3.6 * sv, -2.4 + 8 * sv, -9);
    dir.position.set(4.5, 1.6 + 8.5 * sv, 7);
    dir.intensity = 0.15 + 2.3 * sv; dir.color.copy(tmp.lerpColors(cDawn, cDay, sv));
    hemi.intensity = 0.38 + 0.7 * sv;
    winMat.emissiveIntensity = state.lit * 1.7;
    pMat.emissiveIntensity = 0.2 + 0.25 * sv * (0.5 + 0.5 * Math.sin(t * 1.6));
    const flow = state.lit > 0.4 && on > 0;
    dots.forEach((d, i) => { d.visible = flow; if (flow) { curve.getPoint((t * 0.3 + i / dots.length) % 1, d.position); } });
    led.material.color.setHex(flow ? 0x2bd46a : 0x55606f);

    const yaw = (opt.yaw0 || 0.5) + state.orbit + state.drag + (reduce ? 0 : Math.sin(t * 0.25) * 0.05 + pointer.x * 0.1);
    cam.position.set(Math.sin(yaw) * R, 4.8 - pointer.y * 0.4, Math.cos(yaw) * R);
    cam.lookAt(0, 1.5, 0);
    renderer.render(scene, cam);
  }
  let running = false, raf = 0;
  const loop = ms => { frame(ms); if (running) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { running = e.isIntersecting; cancelAnimationFrame(raf); if (running) raf = requestAnimationFrame(loop); }).observe(canvas);

  if (opt.drag) {
    let last = null;
    canvas.addEventListener("pointerdown", e => { last = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; });
    canvas.addEventListener("pointermove", e => { if (last === null) return; state.drag = Math.max(-1.5, Math.min(1.5, state.drag + (e.clientX - last) * 0.008)); last = e.clientX; });
    const end = () => { last = null; canvas.style.cursor = "grab"; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  }

  function setPanels(n, animated = true) {
    panels.forEach((p, i) => {
      const to = i < n ? 1 : 0;
      gsap.killTweensOf(p);
      if (!animated || reduce) p.v = to;
      else gsap.to(p, { v: to, duration: to ? 0.7 : 0.35, delay: to ? Math.max(0, i - (setPanels.prev || 0)) * 0.05 : 0, ease: to ? "power3.out" : "power2.in" });
    });
    setPanels.prev = n;
  }
  return { state, panels, setPanels };
}

if (!root.classList.contains("no3d")) {
  // ---------- HERO: timeline amarrada ao scroll ----------
  const hero = build(heroCanvas, { yaw0: 0.3, dist: 15, shift: (w, h) => (w > 700 ? [-w * 0.25, -h * 0.04] : [0, -h * 0.2]) });
  const billEl = document.getElementById("hudBill"), cntEl = document.getElementById("hudPanels"), hud = document.querySelector(".hud");
  const bill = { v: 800 }, N = hero.panels.length;
  const paint = () => {
    billEl.textContent = Math.round(bill.v);
    cntEl.textContent = `${hero.panels.filter(p => p.v > 0.5).length} de ${N} placas`;
    hud.classList.toggle("done", bill.v < 85);
  };
  if (reduce) {
    root.classList.add("nopin");
    hero.state.sun = 0.9; hero.state.lit = 1; hero.setPanels(N, false); bill.v = 80;
    document.querySelector(".hero__day").style.opacity = 1; paint();
  } else {
    const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: paint, scrollTrigger: { trigger: ".hero3d", start: "top top", end: "bottom bottom", scrub: 0.6 } });
    tl.to(hero.state, { sun: 0.92, duration: 1 }, 0)
      .to(hero.state, { orbit: 0.5, duration: 1.1 }, 0)
      .to(".hero__day", { opacity: 1, duration: 0.9 }, 0)
      .to(".scrollhint", { opacity: 0, duration: 0.08 }, 0.02);
    hero.panels.forEach((p, i) => tl.to(p, { v: 1, duration: 0.16, ease: "power2.out" }, 0.1 + i * 0.036));
    tl.to(bill, { v: 80, duration: 0.78 }, 0.1)
      .to(hero.state, { lit: 1, duration: 0.14 }, 0.8)
      .to({}, { duration: 0.12 }, 1);
  }

  // ---------- SIMULADOR ----------
  const sim = build(simCanvas, { yaw0: 0.55, drag: true });
  sim.state.sun = 0.85; sim.state.lit = 1;
  let first = true;
  const apply = n => { sim.setPanels(n, !first); first = false; };
  addEventListener("sim:change", e => apply(e.detail.panels));
  // primeira entrada: placas pousam quando o simulador aparece
  const start = window.__simPanels || 7;
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); first = false; sim.setPanels(window.__simPanels || start, true); } }, { threshold: 0.35 }).observe(simCanvas);
}
