/* app.js – UI logic. Reads LQ_OBJECTS (data.js) and LQProgress (progress.js). */
const $ = (s, r = document) => r.querySelector(s);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TOTAL = LQ_OBJECTS.length;
const panel = $("#panel");
let currentId = null, pinned = false, closeTimer = null, lastTrigger = null;
const canHover = window.matchMedia("(hover: hover)").matches;

/* ---- SVG fallback lunar base (drawn in code, so no image files are required) ---- */
function sceneSvg() {
  const stars = [[60,40],[140,110],[260,60],[380,30],[520,90],[640,40],[720,120],[900,50],[960,150],[300,160]].map(s => `<circle cx="${s[0]}" cy="${s[1]}" r="1.6" fill="#fff" opacity=".8"/>`).join("");
  return `<svg viewBox="0 0 1000 560" role="img" aria-label="Illustration of a lunar outpost with a habitat, rover, solar panels, antenna and lander">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030610"/><stop offset="1" stop-color="#10223f"/></linearGradient>
  <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d8f95"/><stop offset="1" stop-color="#3b3d44"/></linearGradient></defs>
  <rect width="1000" height="560" fill="url(#sky)"/>${stars}
  <circle cx="820" cy="95" r="34" fill="#2f6fb5"/><path d="M800 85q20-12 35 4q-10 18-30 14z" fill="#4fae7a" opacity=".8"/>
  <path d="M0 400 Q250 370 500 392 T1000 385 V560 H0Z" fill="url(#gnd)"/>
  <ellipse cx="200" cy="520" rx="70" ry="14" fill="#2f3138"/><ellipse cx="820" cy="525" rx="55" ry="11" fill="#2f3138"/>
  <!-- solar panels -->
  <g fill="#1f4f9a" stroke="#9cc3ff" stroke-width="2"><path d="M100 405l50-40h70l-50 40z"/><path d="M160 410l50-40h70l-50 40z"/></g><path d="M150 410v20M210 415v20" stroke="#ccc" stroke-width="3"/>
  <!-- water tank, habitat, lab -->
  <rect x="340" y="330" width="40" height="72" rx="12" fill="#cfd8e3" stroke="#6b7a8c" stroke-width="2"/>
  <path d="M370 402A70 70 0 0 1 510 402Z" fill="#e8edf3" stroke="#7a889a" stroke-width="3"/><rect x="370" y="385" width="140" height="17" fill="#9aa6b5"/><circle cx="440" cy="365" r="12" fill="#38d6e8" opacity=".6"/>
  <path d="M517 402V262" stroke="#ccc" stroke-width="3"/><rect x="500" y="255" width="36" height="26" rx="4" fill="#d94b4b"/><path d="M510 268h16M518 260v16" stroke="#fff" stroke-width="3"/>
  <rect x="660" y="335" width="80" height="67" rx="6" fill="#d9dee6" stroke="#7a889a" stroke-width="2"/><path d="M670 335a30 30 0 0 1 60 0z" fill="#aeb8c6"/>
  <!-- life support unit, astronaut -->
  <rect x="272" y="420" width="56" height="38" rx="5" fill="#8fa1b8" stroke="#53657d" stroke-width="2"/><circle cx="290" cy="439" r="8" fill="#38d6e8" opacity=".7"/>
  <circle cx="580" cy="402" r="11" fill="#f2f2f2" stroke="#999" stroke-width="2"/><rect x="568" y="412" width="24" height="34" rx="9" fill="#f2f2f2" stroke="#999" stroke-width="2"/><rect x="560" y="418" width="10" height="26" rx="4" fill="#cfcfcf"/>
  <!-- rover -->
  <rect x="663" y="452" width="74" height="22" rx="6" fill="#c9ced6" stroke="#6c7480" stroke-width="2"/><path d="M690 452l10-16h25l6 16" fill="#9aa6b5"/><circle cx="676" cy="482" r="10" fill="#333"/><circle cx="724" cy="482" r="10" fill="#333"/>
  <!-- comms mast -->
  <path d="M880 400V285" stroke="#ccc" stroke-width="4"/><path d="M850 275q30 26 60 0" fill="none" stroke="#ddd" stroke-width="5"/><circle cx="880" cy="282" r="4" fill="#ffb23e"/>
  <!-- lander -->
  <path d="M850 428l12-48h36l12 48z" fill="#d8b24a" stroke="#8a6d1f" stroke-width="2"/><path d="M846 440l12-12M914 440l-12-12" stroke="#ccc" stroke-width="4"/><rect x="866" y="365" width="28" height="16" rx="3" fill="#e9e9e9"/>
  </svg>`;
}

/* ---- Build scene hotspots and list ---- */
function buildScene() {
  $("#scene").innerHTML = sceneSvg() + LQ_OBJECTS.map((o, i) =>
    `<button class="hs" data-id="${o.id}" style="left:${o.x}%;top:${o.y}%" aria-label="${esc(o.name)}: open information panel">${i + 1}<span class="tip">${esc(o.name)}</span></button>`).join("");
  $("#objList").innerHTML = LQ_OBJECTS.map((o, i) =>
    `<li><button data-id="${o.id}"><b>${i + 1}. ${esc(o.name)}</b><small>${esc(o.category)}</small></button></li>`).join("");
}

/* ---- Panel ---- */
const list = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
function panelHtml(o) {
  const q = o.quiz;
  return `<button class="close" aria-label="Close panel">×</button>
  <p class="cat">${esc(o.category)}</p><h2 id="pTitle" tabindex="-1">${esc(o.name)}</h2><p>${esc(o.overview)}</p>
  <details open><summary>Purpose and how it works</summary><div><p>${esc(o.purpose)}</p><p>${esc(o.how)}</p><b>Main components</b>${list(o.components)}</div></details>
  <details><summary>Normal operating checks</summary><div>${list(o.checks)}</div></details>
  <details><summary>Risks and warning signs</summary><div>${list(o.risks)}</div></details>
  <details><summary>Safety and emergency response</summary><div>${list(o.safety)}<p><b>Emergency:</b> ${esc(o.emergency)}</p></div></details>
  <details><summary>Training task</summary><div><p>${esc(o.task)}</p><p class="sim">Simulated scenario, not an operational procedure.</p></div></details>
  <details open><summary>Knowledge check</summary><div id="quiz"><p>${esc(q.q)}</p>
   ${q.options.map((t, i) => `<button class="opt" data-i="${i}">${esc(t)}</button>`).join("")}<p id="fb" role="status" aria-live="polite"></p></div></details>`;
}

function openPanel(id, pin, trigger) {
  clearTimeout(closeTimer);
  if (pin) { pinned = true; lastTrigger = trigger || lastTrigger; }
  if (currentId !== id) {
    const o = LQ_OBJECTS.find(x => x.id === id); if (!o) return;
    currentId = id; panel.innerHTML = panelHtml(o);
    LQProgress.markExplored(id); updateProgress();
    const prev = LQProgress.quizResult(id);
    if (prev === true) $("#fb").textContent = "You answered this correctly before.";
  }
  panel.hidden = false; panel.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => panel.classList.add("open"));
  document.querySelectorAll(".hs").forEach(b => b.classList.toggle("active", b.dataset.id === id));
  if (pin) $("#pTitle").focus({ preventScroll: true });
}
function closePanel() {
  const wasPinned = pinned;
  clearTimeout(closeTimer); pinned = false; currentId = null;
  panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true");
  setTimeout(() => { if (!panel.classList.contains("open")) panel.hidden = true; }, 260);
  document.querySelectorAll(".hs").forEach(b => b.classList.remove("active"));
  if (wasPinned && lastTrigger) lastTrigger.focus({ preventScroll: true });
}
function scheduleClose() { if (!pinned) { clearTimeout(closeTimer); closeTimer = setTimeout(closePanel, 300); } }

function answer(btn) {
  const o = LQ_OBJECTS.find(x => x.id === currentId), pick = +btn.dataset.i, right = pick === o.quiz.answer;
  const opts = [...panel.querySelectorAll(".opt")];
  opts.forEach(b => { b.disabled = true; });
  btn.classList.add(right ? "right" : "wrong");
  if (!right) opts[o.quiz.answer].classList.add("right");
  LQProgress.recordQuiz(o.id, right);
  $("#fb").innerHTML = `${right ? "Correct." : "Not quite."} ${esc(o.quiz.explain)}` + (right ? "" : ` <button class="btn" id="retry">Try again</button>`);
  const retry = $("#retry"); if (retry) retry.onclick = () => openPanelRefresh(o.id);
  updateProgress();
}
function openPanelRefresh(id) { currentId = null; openPanel(id, true); }

/* ---- Progress display ---- */
function updateProgress() {
  const s = LQProgress.summary(TOTAL);
  $("#heroExplored").textContent = `${s.explored} / ${TOTAL}`; $("#heroProgress").textContent = s.readiness + "%";
  $("#pExplored").textContent = `${s.explored} / ${TOTAL}`; $("#pQuiz").textContent = `${s.correct} / ${TOTAL}`;
  $("#pReady").textContent = s.readiness + "%"; $("#pBar").style.width = s.readiness + "%";
  LQ_OBJECTS.forEach(o => document.querySelectorAll(`[data-id="${o.id}"]`).forEach(el => el.classList.toggle("done", LQProgress.isExplored(o.id))));
}

/* ---- Events ---- */
function init() {
  buildScene(); updateProgress();
  $("#menuBtn").addEventListener("click", e => { const open = $("#navLinks").classList.toggle("open"); e.target.setAttribute("aria-expanded", open); });
  $("#navLinks").addEventListener("click", e => { if (e.target.tagName === "A") { $("#navLinks").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false"); } });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-id]"); if (t && (t.classList.contains("hs") || t.closest("#objList"))) { openPanel(t.dataset.id, true, t); return; }
    if (e.target.closest(".close")) closePanel();
    const opt = e.target.closest(".opt"); if (opt && !opt.disabled) answer(opt);
  });
  if (canHover) {   /* hover preview on desktop; clicking pins the panel open */
    $("#scene").addEventListener("mouseover", e => { const b = e.target.closest(".hs"); if (b && !pinned) openPanel(b.dataset.id, false); });
    $("#scene").addEventListener("mouseout", e => { if (e.target.closest(".hs")) scheduleClose(); });
    panel.addEventListener("mouseenter", () => clearTimeout(closeTimer));
    panel.addEventListener("mouseleave", scheduleClose);
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && currentId) closePanel(); });
  $("#resetBtn").addEventListener("click", () => {
    if (confirm("Reset all training progress on this browser? This cannot be undone.")) { LQProgress.reset(); closePanel(); updateProgress(); }
  });
}
document.addEventListener("DOMContentLoaded", init);
