// POLARIS — Dettaglio Modulo (simulazione)
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

    "D-02": {
    id: "D-02",
    material: "PLA",
    status: "dry",                 // in essicazione / da essiccare
    humidityTarget: 20,
    // start alto -> scende ma ancora alto (inizio essicazione)
    humiditySeries: genSeries(24, 55, 38),
    dehum: {
      mode: "Auto · PLA",
      cycleMin: 240,
      progress: 0.12,
      etaMin: 210,
      note: "Avvio ciclo: umidità elevata. Deumidificazione in corso."
    },
    colors: ["#111", "#e53935", "#43a047", "#1e88e5", "#fdd835", "#8e24aa", "#fb8c00", "#00acc1"],
    spool: {
      expected: "PLA 1.75mm",
      inserted: "PLA 1.75mm",
      ok: true
    },
    cleaning: {
      lastCleanedISO: "2026-02-10T09:10:00Z",
      tasks: [
        { id: "t1", title: "Rimuovere polvere interna", desc: "Pulizia camera e griglie (panno + aria compressa)." },
        { id: "t2", title: "Controllo guarnizioni", desc: "Verifica integrità e presenza di tagli / schiacciamenti." },
        { id: "t3", title: "Ispezione ventole", desc: "Rotazione libera, rumori, presenza di residui." },
        { id: "t4", title: "Pulizia sensore umidità", desc: "Superficie sensore pulita e senza condensa." }
      ]
    }
  },

  "D-03": {
    id: "D-03",
    material: "PC",
    status: "err",                 // errore, ma umidità OK
    humidityTarget: 18,
    // umidità buona (sotto/sul target)
    humiditySeries: genSeries(24, 22, 17),
    dehum: {
      mode: "Auto · PC",
      cycleMin: 360,
      progress: 0.86,
      etaMin: 40,
      note: "Umidità in range, ma è richiesto un controllo materiale."
    },
    colors: ["#111", "#263238", "#455a64", "#607d8b", "#9e9e9e", "#bdbdbd", "#424242", "#212121"],
    spool: {
      expected: "PC 1.75mm",
      inserted: "PLA 1.75mm",
      ok: false
    },
    cleaning: {
      lastCleanedISO: "2026-02-06T10:20:00Z",
      tasks: [
        { id: "t1", title: "Rimuovere residui materiale", desc: "Controlla eventuali scaglie/filamenti dentro al vano." },
        { id: "t2", title: "Pulizia ventole", desc: "Rimuovi polvere e verifica vibrazioni." },
        { id: "t3", title: "Filtro / griglia ingresso", desc: "Pulizia e riposizionamento corretto." },
        { id: "t4", title: "Pulizia sensore umidità", desc: "Verifica condensa e pulizia superficiale." }
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

// const checklist = document.getElementById("checklist");
// const cleanMeta = document.getElementById("cleanMeta");

// Buttons
//document.getElementById("pauseBtn").addEventListener("click", () => logEvent("ACTION", "Pausa ciclo richiesta (simulazione)"));
//document.getElementById("resumeBtn").addEventListener("click", () => logEvent("ACTION", "Ripresa ciclo richiesta (simulazione)"));
//document.getElementById("addErrorDemo").addEventListener("click", () => simulateWrongSpool());
//document.getElementById("resetChecklist").addEventListener("click", () => resetChecklist());
//document.getElementById("markCleaned").addEventListener("click", () => markCleanedNow());

// Chart
const canvas = document.getElementById("humidityChart");
const ctx = canvas.getContext("2d");

function statusLabel(s){
  if (s === "done") return "OK";
  if (s === "dry") return "Da essiccare";
  if (s === "err") return "Errore";
  return "—";
}

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
  ring.style.setProperty("--p", data.dehum.progress);                 // 0..1
  ring.style.setProperty("--deg", `${Math.round(data.dehum.progress*360)}deg`);

  const progColor =
  data.status === "done" ? "var(--lo)" :
  data.status === "dry"  ? "var(--md)" :
  "var(--hi)";
  
  ring.style.setProperty("--p", data.dehum.progress);
  ring.style.setProperty("--deg", `${Math.round(data.dehum.progress*360)}deg`);
  ring.style.setProperty("--prog", progColor);

  // Palette
  palette.innerHTML = data.colors.map(c => `<span class="sw" style="background:${c}"></span>`).join("");
  paletteLegend.textContent = `8 slot · Materiale: ${data.material}`;

  // Alerts
  renderAlerts();

  // Log initial
  //logEvent("INFO", `Pagina modulo aperta: ${data.id}`);

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
  `Nel modulo è inserita una bobina di ${data.spool.inserted.split(" ")[0]} nel modulo per ${data.material}`,
  "err"
));
  }

  /* // Cleaning due (semplice: > 7 giorni)
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
  } */

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
  //cleanMeta.textContent = `Ultima pulizia: ${days} giorni fa`;

  /* const saved = loadChecklistState(data.id);
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
  }).join(""); */

  /*  checklist.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-task");
      const state = loadChecklistState(data.id);
      state[id] = cb.checked;
      saveChecklistState(data.id, state);
      logEvent("CHECK", `${cb.checked ? "Completato" : "Non completato"}: ${id}`);
    });
  }); */
}

/* function resetChecklist(){
  saveChecklistState(data.id, {});
  renderChecklist();
  logEvent("CHECK", "Checklist resettata");
} */

/* function markCleanedNow(){
  // simulazione: aggiorna meta e reset checklist
  data.cleaning.lastCleanedISO = new Date().toISOString();
  resetChecklist();
  renderAlerts();
  renderChecklist();
  logEvent("MAINT", "Pulizia segnata come completata (ora)");
} */

/* Error simulation
 function simulateWrongSpool(){
  data.status = "err";
  data.spool.ok = false;
  data.spool.inserted = "PETG 1.75mm";
  kStatus.textContent = statusLabel(data.status);
  renderAlerts();
  logEvent("ERROR", "Rilevata bobina non compatibile (simulazione)");
} */

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

  ctx.clearRect(0,0,w,h);

  const pad = { l: 48, r: 18, t: 24, b: 38 };
  const gw = w - pad.l - pad.r;
  const gh = h - pad.t - pad.b;

  const min = Math.min(...series, target) - 2;
  const max = Math.max(...series, target) + 2;

  const x = (i) => pad.l + (i/(series.length-1)) * gw;
  const y = (v) => pad.t + (1 - (v-min)/(max-min)) * gh;

  /* GRID */
  ctx.strokeStyle = "rgba(15,23,42,0.06)";
  ctx.lineWidth = 1;
  for (let i=0; i<=4; i++){
    const yy = pad.t + (i/4)*gh;
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(pad.l+gw, yy);
    ctx.stroke();
  }

  /* TARGET LINE (elegante, arancio soft) */
  ctx.strokeStyle = "rgba(244,162,97,0.65)";
  ctx.setLineDash([6,6]);
  ctx.beginPath();
  ctx.moveTo(pad.l, y(target));
  ctx.lineTo(pad.l+gw, y(target));
  ctx.stroke();
  ctx.setLineDash([]);

  /* LINE COLOR DINAMICO */
  const lastVal = series[series.length-1];
  const color =
    lastVal <= target
      ? "rgba(42,157,143,0.95)"     // verde
      : lastVal <= target + 5
      ? "rgba(244,162,97,0.95)"     // arancio
      : "rgba(230,57,70,0.95)";     // rosso

  /* AREA GRADIENT */
  const gradient = ctx.createLinearGradient(0, pad.t, 0, pad.t+gh);
  gradient.addColorStop(0, color.replace("0.95","0.22"));
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.beginPath();
  series.forEach((v,i)=>{
    const xx = x(i), yy = y(v);
    if (i===0) ctx.moveTo(xx,yy);
    else ctx.lineTo(xx,yy);
  });
  ctx.lineTo(x(series.length-1), pad.t+gh);
  ctx.lineTo(x(0), pad.t+gh);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  /* LINEA PRINCIPALE */
  ctx.beginPath();
  series.forEach((v,i)=>{
    const xx = x(i), yy = y(v);
    if (i===0) ctx.moveTo(xx,yy);
    else ctx.lineTo(xx,yy);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  /* PUNTO FINALE EVIDENZIATO */
  const lx = x(series.length-1);
  const ly = y(lastVal);

  ctx.beginPath();
  ctx.arc(lx, ly, 6, 0, Math.PI*2);
  ctx.fillStyle = color.replace("0.95","0.18");
  ctx.fill();

  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();

  /* LABEL */
  ctx.fillStyle = "rgba(15,23,42,0.6)";
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillText("Umidità %", 12, 18);

  ctx.fillText("24h fa", pad.l, h-12);
  ctx.fillText("ora", pad.l+gw-22, h-12);
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
/* function loadChecklistState(moduleId){
  try{
    return JSON.parse(localStorage.getItem(`POLARIS_check_${moduleId}`) || "{}");
  }catch{
    return {};
  }
} */

/* function saveChecklistState(moduleId, obj){
  localStorage.setItem(`POLARIS_check_${moduleId}`, JSON.stringify(obj));
} */

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

