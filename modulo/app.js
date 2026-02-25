// AURA — Dettaglio Modulo (simulazione)
// Supporta querystring: ?id=D-01

const qs = new URLSearchParams(location.search);
const moduleId = qs.get("id") || "D-01";

// Mock dati modulo
const MODULES = {
  "D-01": {
    id: "D-01",
    material: "PLA",
    status: "done",                 // done | dry | err
    humidityTarget: 20,             // %
    humiditySeries: genSeries(24, 28, 18), // 24h (valore iniziale, finale)
    dehum: {
      mode: "Auto · PLA",
      cycleMin: 180,
      progress: 0.92,               // 0..1
      etaMin: 15,
      note: "Ciclo quasi completato. Stabilizzazione in corso."
    },
    colors: ["#111", "#e53935", "#43a047", "#1e88e5", "#fdd835", "#8e24aa", "#fb8c00", "#00acc1"],
    spool: {
      expected: "PLA 1.75mm",
      inserted: "PLA 1.75mm",
      ok: true
    },
    cleaning: {
      lastCleanedISO: "2026-02-06T10:20:00Z",
      tasks: [
        { id: "t1", title: "Rimuovere polvere interna", desc: "Pulizia camera e griglie (panno + aria compressa)." },
        { id: "t2", title: "Controllo guarnizioni", desc: "Verifica integrità e presenza di tagli / schiacciamenti." },
        { id: "t3", title: "Ispezione ventole", desc: "Rotazione libera, rumori, presenza di residui." },
        { id: "t4", title: "Pulizia sensore umidità", desc: "Superficie sensore pulita e senza condensa." }
      ]
    }
  },

  "D-04": {
    id: "D-04",
    material: "PA",
    status: "err",
    humidityTarget: 18,
    humiditySeries: genSeries(24, 45, 42),
    dehum: {
      mode: "Manual · PA",
      cycleMin: 360,
      progress: 0.28,
      etaMin: 260,
      note: "Errore: bobina non compatibile / sensore spool mismatch."
    },
    colors: ["#000", "#263238", "#455a64", "#607d8b", "#9e9e9e", "#bdbdbd", "#424242", "#212121"],
    spool: {
      expected: "PA 1.75mm",
      inserted: "PETG 1.75mm",
      ok: false
    },
    cleaning: {
      lastCleanedISO: "2026-02-02T14:05:00Z",
      tasks: [
        { id: "t1", title: "Rimuovere residui materiale", desc: "Controlla eventuali scaglie/filamenti dentro al vano." },
        { id: "t2", title: "Pulizia ventole", desc: "Rimuovi polvere e verifica vibrazioni." },
        { id: "t3", title: "Filtro / griglia ingresso", desc: "Pulizia e riposizionamento corretto." },
        { id: "t4", title: "Sanificazione rapida", desc: "Panno asciutto su superfici interne (no liquidi)." }
      ]
    }
  }
};

// fallback: se id non c’è in mock, usa D-01
const data = MODULES[moduleId] || MODULES["D-01"];

// Elements
const pageTitle = document.getElementById("pageTitle");
const kStatus = document.getElementById("kStatus");
const kHumidity = document.getElementById("kHumidity");
const kTarget = document.getElementById("kTarget");

const mTrend = document.getElementById("mTrend");
const mMinMax = document.getElementById("mMinMax");
const mSamples = document.getElementById("mSamples");

const dehumNote = document.getElementById("dehumNote");
const ringPct = document.getElementById("ringPct");
const eta = document.getElementById("eta");
const cycle = document.getElementById("cycle");
const mode = document.getElementById("mode");
const ring = document.querySelector(".ring");

const palette = document.getElementById("palette");
const paletteLegend = document.getElementById("paletteLegend");

const alerts = document.getElementById("alerts");
const eventLog = document.getElementById("eventLog");

const checklist = document.getElementById("checklist");
const cleanMeta = document.getElementById("cleanMeta");

// Buttons
document.getElementById("pauseBtn").addEventListener("click", () => logEvent("ACTION", "Pausa ciclo richiesta (simulazione)"));
document.getElementById("resumeBtn").addEventListener("click", () => logEvent("ACTION", "Ripresa ciclo richiesta (simulazione)"));
document.getElementById("addErrorDemo").addEventListener("click", () => simulateWrongSpool());
document.getElementById("resetChecklist").addEventListener("click", () => resetChecklist());
document.getElementById("markCleaned").addEventListener("click", () => markCleanedNow());

// Chart
const canvas = document.getElementById("humidityChart");
const ctx = canvas.getContext("2d");

// Init
renderAll();

function renderAll(){
  pageTitle.textContent = `Modulo ${data.id} · ${data.material}`;

  // KPI
  kStatus.textContent = statusLabel(data.status);
  kHumidity.textContent = `${last(data.humiditySeries).toFixed(0)}%`;
  kTarget.textContent = `${data.humidityTarget}%`;

  // Trend/min/max
  const first = data.humiditySeries[0];
  const lastv = last(data.humiditySeries);
  const delta = lastv - first;
  mTrend.textContent = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  const min = Math.min(...data.humiditySeries);
  const max = Math.max(...data.humiditySeries);
  mMinMax.textContent = `${min.toFixed(0)}% / ${max.toFixed(0)}%`;
  mSamples.textContent = `${data.humiditySeries.length}`;

  // Dehumidification
  dehumNote.textContent = data.dehum.note;
  ringPct.textContent = `${Math.round(data.dehum.progress * 100)}%`;
  eta.textContent = fmtMin(data.dehum.etaMin);
  cycle.textContent = fmtMin(data.dehum.cycleMin);
  mode.textContent = data.dehum.mode;
  ring.style.background = `conic-gradient(var(--info) ${Math.round(data.dehum.progress*360)}deg, rgba(15,23,42,0.06) 0deg)`;

  // Palette
  palette.innerHTML = data.colors.map(c => `<span class="sw" style="background:${c}"></span>`).join("");
  paletteLegend.textContent = `8 slot · Materiale: ${data.material}`;

  // Alerts
  renderAlerts();

  // Log initial
  logEvent("INFO", `Pagina modulo aperta: ${data.id}`);

  // Cleaning
  renderChecklist();

  // Chart draw
  drawHumidityChart(data.humiditySeries, data.humidityTarget);
}

function renderAlerts(){
  const items = [];

  // Spool check
  if (data.spool.ok){
    items.push(alertCard(
      "Validazione bobina",
      `Bobina corretta: ${data.spool.inserted}`,
      "ok"
    ));
  } else {
    items.push(alertCard(
      "Errore bobina",
      `Atteso: ${data.spool.expected} · Inserito: ${data.spool.inserted}`,
      "err"
    ));
  }

  // Cleaning due (semplice: > 7 giorni)
  const daysSince = daysSinceISO(data.cleaning.lastCleanedISO);
  if (daysSince > 7){
    items.push(alertCard(
      "Pulizia consigliata",
      `Ultima pulizia: ${daysSince} giorni fa`,
      "warn"
    ));
  } else {
    items.push(alertCard(
      "Manutenzione",
      `Ultima pulizia: ${daysSince} giorni fa`,
      "ok"
    ));
  }

  alerts.innerHTML = items.join("");
}

function alertCard(title, desc, tone){
  const badge = tone === "ok" ? "OK" : tone === "warn" ? "ATTENZIONE" : "ERRORE";
  return `
    <div class="alert">
      <div>
        <div class="t">${escapeHtml(title)}</div>
        <div class="d">${escapeHtml(desc)}</div>
      </div>
      <span class="badge ${tone}">${badge}</span>
    </div>
  `;
}

function renderChecklist(){
  const days = daysSinceISO(data.cleaning.lastCleanedISO);
  cleanMeta.textContent = `Ultima pulizia: ${days} giorni fa`;

  const saved = loadChecklistState(data.id);
  checklist.innerHTML = data.cleaning.tasks.map(t => {
    const checked = saved[t.id] === true;
    return `
      <label class="check">
        <input type="checkbox" data-task="${t.id}" ${checked ? "checked" : ""}/>
        <div>
          <div class="cTitle">${escapeHtml(t.title)}</div>
          <div class="cDesc">${escapeHtml(t.desc)}</div>
        </div>
      </label>
    `;
  }).join("");

  checklist.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-task");
      const state = loadChecklistState(data.id);
      state[id] = cb.checked;
      saveChecklistState(data.id, state);
      logEvent("CHECK", `${cb.checked ? "Completato" : "Non completato"}: ${id}`);
    });
  });
}

function resetChecklist(){
  saveChecklistState(data.id, {});
  renderChecklist();
  logEvent("CHECK", "Checklist resettata");
}

function markCleanedNow(){
  // simulazione: aggiorna meta e reset checklist
  data.cleaning.lastCleanedISO = new Date().toISOString();
  resetChecklist();
  renderAlerts();
  renderChecklist();
  logEvent("MAINT", "Pulizia segnata come completata (ora)");
}

// Error simulation
function simulateWrongSpool(){
  data.status = "err";
  data.spool.ok = false;
  data.spool.inserted = "PETG 1.75mm";
  kStatus.textContent = statusLabel(data.status);
  renderAlerts();
  logEvent("ERROR", "Rilevata bobina non compatibile (simulazione)");
}

// Logging
function logEvent(type, msg){
  const ts = new Date().toISOString().replace("T"," ").slice(0,19);
  const line = `[${ts}] ${type.padEnd(6)} ${msg}`;
  eventLog.textContent = (line + "\n" + eventLog.textContent).trim();
}

// Chart drawing (no libs)
function drawHumidityChart(series, target){
  const w = canvas.width;
  const h = canvas.height;

  // clear
  ctx.clearRect(0,0,w,h);

  // padding
  const pad = { l: 44, r: 16, t: 18, b: 34 };
  const gw = w - pad.l - pad.r;
  const gh = h - pad.t - pad.b;

  const min = Math.min(...series, target) - 2;
  const max = Math.max(...series, target) + 2;

  const x = (i) => pad.l + (i/(series.length-1)) * gw;
  const y = (v) => pad.t + (1 - (v-min)/(max-min)) * gh;

  // grid lines
  ctx.strokeStyle = "rgba(15,23,42,0.08)";
  ctx.lineWidth = 1;
  for (let i=0; i<=4; i++){
    const yy = pad.t + (i/4)*gh;
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(pad.l+gw, yy);
    ctx.stroke();
  }

  // target line
  ctx.strokeStyle = "rgba(244,162,97,0.7)";
  ctx.setLineDash([6,6]);
  ctx.beginPath();
  ctx.moveTo(pad.l, y(target));
  ctx.lineTo(pad.l+gw, y(target));
  ctx.stroke();
  ctx.setLineDash([]);

  // line
  ctx.strokeStyle = "rgba(58,134,255,0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  series.forEach((v,i)=>{
    const xx = x(i), yy = y(v);
    if (i===0) ctx.moveTo(xx,yy);
    else ctx.lineTo(xx,yy);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = "rgba(58,134,255,0.95)";
  series.forEach((v,i)=>{
    const xx = x(i), yy = y(v);
    ctx.beginPath();
    ctx.arc(xx, yy, 3, 0, Math.PI*2);
    ctx.fill();
  });

  // axes labels
  ctx.fillStyle = "rgba(15,23,42,0.65)";
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillText("Umidità %", 10, 16);

  // y ticks
  ctx.fillStyle = "rgba(15,23,42,0.55)";
  for (let i=0; i<=4; i++){
    const vv = max - (i/4)*(max-min);
    const yy = pad.t + (i/4)*gh;
    ctx.fillText(vv.toFixed(0), 10, yy+4);
  }

  // x labels
  ctx.fillStyle = "rgba(15,23,42,0.55)";
  ctx.fillText("24h fa", pad.l, h-12);
  ctx.fillText("ora", pad.l+gw-20, h-12);
}

// Helpers
function last(arr){ return arr[arr.length-1]; }
function fmtMin(min){
  if (min < 60) return `${min} min`;
  const h = Math.floor(min/60);
  const m = min%60;
  return `${h}h ${m}m`;
}
function daysSinceISO(iso){
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000*60*60*24)));
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

// Persist checklist per module
function loadChecklistState(moduleId){
  try{
    return JSON.parse(localStorage.getItem(`aura_check_${moduleId}`) || "{}");
  }catch{
    return {};
  }
}
function saveChecklistState(moduleId, obj){
  localStorage.setItem(`aura_check_${moduleId}`, JSON.stringify(obj));
}

// Generate a descending series (humid decreases) with small noise
function genSeries(n, start, end){
  const out = [];
  for (let i=0; i<n; i++){
    const t = i/(n-1);
    const base = start + (end - start) * t;
    const noise = (Math.random() - 0.5) * 2.2;
    out.push(base + noise);
  }
  // smooth a bit
  for (let i=1; i<n-1; i++){
    out[i] = (out[i-1] + out[i] + out[i+1]) / 3;
  }
  return out;
}
