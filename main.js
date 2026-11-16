// Sollagos — motion (biblioteca Motion, personalidade "Premium")
// Easing assinatura: entrada desacelerada · durações 0.2 / 0.45 / 0.9s · stagger ≤ 0.5s no total
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WA = "5522997005965";
const fmt = (n, dec = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- sempre ativo: nav, FAQ, formulário, lightbox ---------------------------
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

function showAll() {
  $$("[data-reveal],[data-stagger]>*,[data-hero],[data-hero-card]").forEach(e => (e.style.opacity = 1));
  $$("[data-count]").forEach(e => (e.textContent = fmt(+e.dataset.count)));
  $$("[data-pct]").forEach(e => (e.textContent = fmt(+e.dataset.pct, +(e.dataset.dec || 0))));
  $$(".bar i").forEach(i => (i.style.transform = "none"));
  $$("[data-split]").forEach(e => (e.style.opacity = 1));
  $("#stepsFill").style.transform = "none";
  $$(".steps li").forEach(l => l.classList.add("on"));
}

let M = null;
try { M = await import("https://cdn.jsdelivr.net/npm/motion@11.18.2/+esm"); } catch (e) { console.warn("Motion indisponível", e); }
const motionOn = M && !reduce;
const { animate, scroll, inView, stagger } = M || {};
const EASE = [0.05, 0.7, 0.1, 1];   // entrada (decelera)
const SOFT = [0.4, 0, 0.2, 1];      // ambiente

// FAQ — altura animada
$$(".qa").forEach(qa => {
  const btn = $("button", qa), box = $(".qa__a", qa);
  btn.addEventListener("click", () => {
    const open = !qa.classList.contains("open");
    $$(".qa.open").forEach(o => o !== qa && close(o));
    open ? openQa(qa) : close(qa);
  });
  function openQa(q) {
    q.classList.add("open"); btn.setAttribute("aria-expanded", true);
    const h = box.scrollHeight;
    motionOn ? animate(box, { height: [0, h] }, { duration: 0.45, ease: EASE }).finished.then(() => (box.style.height = "auto")) : (box.style.height = "auto");
  }
  function close(q) {
    const b = $("button", q), bx = $(".qa__a", q);
    q.classList.remove("open"); b.setAttribute("aria-expanded", false);
    motionOn ? animate(bx, { height: [bx.scrollHeight, 0] }, { duration: 0.3, ease: [0.3, 0, 1, 1] }) : (bx.style.height = 0);
  }
});

// Formulário -> WhatsApp
const form = $(".form");
form.addEventListener("submit", e => {
  e.preventDefault();
  const msg = $(".form__msg", form);
  let ok = true;
  $$("input,select", form).forEach(f => {
    const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value)) || (f.type === "tel" && f.value.replace(/\D/g, "").length < 10);
    f.classList.toggle("is-error", bad);
    if (bad) { ok = false; f.classList.remove("is-error"); void f.offsetWidth; f.classList.add("is-error"); }
  });
  if (!ok) { msg.textContent = "Confira os campos destacados."; return; }
  const d = Object.fromEntries(new FormData(form));
  const text = `Olá! Quero um orçamento de energia solar.%0A%0A*Nome:* ${d.nome}%0A*E-mail:* ${d.email}%0A*Telefone:* ${d.tel}%0A*Consumo médio:* ${d.consumo}`;
  msg.textContent = "Perfeito! Abrindo o WhatsApp…";
  if (motionOn) animate(msg, { opacity: [0, 1], y: [8, 0] }, { duration: 0.45, ease: EASE });
  open(`https://wa.me/${WA}?text=${text}`, "_blank", "noopener");
});

// Lightbox da galeria
const lb = document.createElement("div"); lb.className = "lb"; lb.innerHTML = "<img alt=''>"; document.body.append(lb);
$$(".gallery img").forEach(i => i.addEventListener("click", () => { $("img", lb).src = i.src; lb.classList.add("on"); }));
lb.addEventListener("click", () => lb.classList.remove("on"));
addEventListener("keydown", e => e.key === "Escape" && lb.classList.remove("on"));

// Vídeos: clique para tocar (com som); pausam ao sair da tela; só um por vez
const vids = $$(".vid video");
vids.forEach(v => {
  const fig = v.closest(".vid"), btn = $(".vid__play", fig);
  const toggle = () => { if (v.paused) { vids.forEach(o => o !== v && o.pause()); v.play(); } else v.pause(); };
  btn.addEventListener("click", toggle);
  v.addEventListener("click", toggle);
  v.addEventListener("play", () => { fig.classList.add("playing"); v.controls = true; });
  v.addEventListener("pause", () => fig.classList.remove("playing"));
});
const vio = new IntersectionObserver(es => es.forEach(en => !en.isIntersecting && en.target.pause()), { threshold: 0.2 });
vids.forEach(v => vio.observe(v));

if (!motionOn) { showAll(); }
else {
  // --- HERO: coreografia (herói primeiro, depois cartão, depois apoio) ------
  const h1 = $("[data-split]");
  const split = n => { // palavras com máscara
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t.trim()) return f.append(t);
          const w = document.createElement("span"); w.className = "word"; w.innerHTML = `<span>${t}</span>`; f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) split(c);
    });
  };
  split(h1);
  const words = $$(".word>span", h1);
  animate(words, { y: ["110%", "0%"] }, { duration: 0.9, delay: stagger(0.06, { startDelay: 0.15 }), ease: EASE });
  animate($$("[data-hero]"), { opacity: [0, 1], y: [22, 0] }, { duration: 0.7, delay: stagger(0.1, { startDelay: 0.5 }), ease: EASE });
  animate($("[data-hero-card]"), { opacity: [0, 1], x: [48, 0], scale: [0.97, 1] }, { duration: 0.9, delay: 0.55, ease: EASE });

  // parallax do fundo (camada ambiente, move a 20-30% da velocidade do herói)
  scroll(animate(".hero__bg", { y: ["0%", "14%"] }, { ease: "linear" }), { target: $(".hero"), offset: ["start start", "end start"] });
  scroll(animate(".hero__copy", { y: [0, -50], opacity: [1, 0.2] }, { ease: "linear" }), { target: $(".hero"), offset: ["30% start", "end start"] });
  scroll(animate(".sun--cta", { rotate: [0, 40] }, { ease: "linear" }), { target: $(".cta"), offset: ["start end", "end start"] });

  // --- contadores ---------------------------------------------------------
  const count = (el, to, dec = 0, dur = 1.8) => animate(0, to, { duration: dur, ease: EASE, onUpdate: v => (el.textContent = fmt(v, dec)) });
  const seen = new WeakSet();
  const trigger = (el, to, dec, dur) => inView(el, () => { if (seen.has(el)) return; seen.add(el); count(el, to, dec, dur); }, { amount: 0.6 });
  $$("[data-count]").forEach(el => trigger(el, +el.dataset.count, 0, 1.8));

  // --- reveals -------------------------------------------------------------
  $$("[data-reveal]").forEach(el => inView(el, () => { animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease: EASE }); }, { amount: 0.25 }));
  $$("[data-stagger]").forEach(g => inView(g, () => {
    const kids = [...g.children], step = Math.min(0.08, 0.45 / kids.length);   // orçamento total < 500ms
    animate(kids, { opacity: [0, 1], y: [30, 0] }, { duration: 0.7, delay: stagger(step), ease: EASE });
  }, { amount: 0.2 }));

  // --- passos: linha desenhada pelo scroll + ativação sequencial --------------
  const steps = $("#steps");
  scroll(animate("#stepsFill", { scaleY: [0, 1] }, { ease: "linear" }), { target: steps, offset: ["start 65%", "end 70%"] });
  $$("[data-step]", steps).forEach(li => { li.style.opacity = 0; inView(li, () => { li.classList.add("on"); animate(li, { opacity: [0, 1], x: [-24, 0] }, { duration: 0.7, ease: EASE }); }, { amount: 0.6 }); });

  // --- cases: barras crescem, percentual conta ----------------------------------
  $$(".case").forEach(c => {
    const before = +c.dataset.before, after = +c.dataset.after, h = (after / before) * 100;
    $(".bar--a", c).style.setProperty("--h", Math.max(h, 12) + "%");
    $(".bar--a i", c).style.height = Math.max(h, 12) + "%";
    const pct = $("[data-pct]", c);
    inView(c, () => {
      animate($(".bar--b i", c), { scaleY: [0, 1] }, { duration: 1, ease: EASE });
      animate($(".bar--a i", c), { scaleY: [0, 1] }, { duration: 1, delay: 0.5, ease: EASE });
      animate($$(".bar em", c), { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.4, { startDelay: 0.5 }) });
      if (!seen.has(pct)) { seen.add(pct); animate(0, +pct.dataset.pct, { duration: 1.6, delay: 0.5, ease: EASE, onUpdate: v => (pct.textContent = fmt(v, +(pct.dataset.dec || 0))) }); }
    }, { amount: 0.5 });
  });

  // --- microinterações: botões magnéticos (leve) -----------------------------
  if (matchMedia("(hover:hover)").matches) $$(".btn:not(.btn--block)").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.25 }, { duration: 0.25, ease: SOFT }); });
    b.addEventListener("pointerleave", () => animate(b, { x: 0, y: 0 }, { duration: 0.5, ease: EASE }));
  });
}
