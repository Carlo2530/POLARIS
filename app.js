// POLARIS — HOME (system overview) — usa sagoma reale inline (come Magazzino)

const readyGrid = document.getElementById("readyGrid");
const manageGrid = document.getElementById("manageGrid");
const invList = document.getElementById("invList");
const nextList = document.getElementById("nextList");

const kReady = document.getElementById("kReady");
const kDry = document.getElementById("kDry");
const kOut = document.getElementById("kOut");
const sysSub = document.getElementById("sysSub");

const kLow = document.getElementById("kLow"); // header (warn)
const kErr = document.getElementById("kErr"); // header (err)
const manageNote = document.getElementById("manageNote");

// === PATH sagoma: usa quella di Magazzino ===
const HOME_SVG_PATH = "magazzino/assets/sagoma-progetto.svg";
let INLINE_SVG = "";

// --- Demo data ---
const modules = [
  { id: "D-01", material: "PLA",  status: "done", fill: 100, colors: ["#111","#e53935","#43a047","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },
  { id: "D-02", material: "PETG", status: "done", fill: 95,  colors: ["#d32f2f","#c2185b","#7b1fa2","#1976d2","#388e3c","#fbc02d","#f57c00","#455a64"] },
  { id: "D-03", material: "ASA",  status: "done", fill: 95, colors: ["#fff","#9e9e9e","#616161","#212121","#ff7043","#26a69a","#ab47bc","#5c6bc0"] },
  { id: "D-04", material: "PLA",   status: "done", fill: 100,  colors: ["#111","#e53935","#43a047","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },

  { id: "D-05", material: "ABS",  status: "done", fill: 88,  colors: ["#424242","#ef5350","#66bb6a","#42a5f5","#ffee58","#7e57c2","#ffa726","#26c6da"] },
  { id: "D-06", material: "TPU",  status: "done", fill: 90, colors: ["#000","#90a4ae","#ff7043","#8d6e63","#26a69a","#ec407a","#ffee58","#5c6bc0"] },
  { id: "D-07", material: "PC",   status: "dry", fill: 35,  colors: ["#eceff1","#546e7a","#ff8a65","#4db6ac","#ba68c8","#7986cb","#dce775","#ffd54f"] },
  { id: "D-08", material: "PLA",  status: "dry", fill: 18, colors: ["#212121","#d81b60","#1e88e5","#43a047","#fdd835","#8e24aa","#fb8c00","#00acc1"] },

  { id: "D-09", material: "PETG", status: "dry", fill: 27,  colors: ["#e0e0e0","#757575","#ffca28","#66bb6a","#42a5f5","#ab47bc","#ef5350","#26c6da"] },
  { id: "D-10", material: "ASA",  status: "dry", fill: 19, colors: ["#ffffff","#111111","#ff7043","#26a69a","#7e57c2","#42a5f5","#ffee58","#8d6e63"] },
  { id: "D-11", material: "PA-CF",status: "err", fill: 23,  colors: ["#000","#111","#222","#333","#444","#555","#666","#777"] },
  { id: "D-12", material: "ABS",  status: "dry", fill: 16, colors: ["#111","#f4511e","#7cb342","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },
];

const inventory = [
  { mat:"PLA", grams:8, max:12 },
  { mat:"ABS", grams:10, max:30 },
  { mat:"PETG", grams:2, max:15 },
  { mat:"ASA", grams:9, max:10 },
  { mat:"TPU", grams:10, max:10 },
  { mat:"PA-CF", grams:3, max:3 },
];

const nextDays = [
  { when:"Domani", mat:"ABS", hours:"10h", p:55 },
  { when:"Tra 2 giorni", mat:"PETG", hours:"", p:78 },
  { when:"Tra 3 giorni", mat:"PLA da essiccare", hours:"", p:5 },
];

// ---------------- SVG inline  ----------------
async function loadInlineSVG(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Impossibile caricare SVG: ${url} (${res.status})`);
  let svgText = await res.text();

  // 1) rimuovi width/height esportati (pt) 
  svgText = svgText
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "");

  // 2) forza fill = currentColor, elimina stroke
  // (utile se Rhino esporta nero fisso o stroke)
  svgText = svgText
    .replace(/fill="none"/gi, 'fill="currentColor"')
    .replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="none"')
    .replace(/stroke="[^"]*"/g, 'stroke="none"')
    .replace(/stroke-width="[^"]*"/g, "");

  // 
  svgText = svgText.replace(
    /<svg\b([^>]*)>/i,
    (m, attrs) => {
      if (/class="/i.test(attrs)) return `<svg${attrs}>`;
      return `<svg class="POLARIS-icon"${attrs}>`;
    }
  );

  return svgText;
}

function paletteSlots(colors = []){
  return Array.from({ length: 8 }, (_, i) => {
    const c = colors[i] || "rgba(21,19,26,0.10)";
    return `<span class="palette-slot" style="--slot:${c}"></span>`;
  }).join("");
}

function statusLabel(s){
  if(s==="done") return "Essiccato";
  if(s==="dry") return "Da essiccare";
  return "Errore";
}

function pct(n){ return Math.max(0, Math.min(100, Math.round(n))); }

// --- Render ---
function renderSystem(){
  const ready = modules.filter(m => m.status==="done").length;
  const dry = modules.filter(m => m.status==="dry").length;
  const out = modules.filter(m => m.status==="err").length;

  if(kReady) kReady.textContent = ready;
  if(kDry) kDry.textContent = dry;
  if(kOut) kOut.textContent = out;

  if(sysSub) sysSub.textContent = `${ready} materiali pronti alla stampa · ${dry} da essiccare`;

  // header compact kpis (warn/err)
  if(kLow) kLow.textContent = dry;
  if(kErr) kErr.textContent = out;

  if(manageNote){
    manageNote.textContent = (dry + out) === 0 ? "Tutto sotto controllo." : "Priorità in evidenza.";
  }
}

function renderReady(){
  const ready = modules.filter(m => m.status==="done");
  readyGrid.innerHTML = ready.map(m=>{
    const p = pct(m.fill);
    return `
      <div class="ready-card card done" data-id="${m.id}">
        <div class="ready-top">
          <div class="ready-mat">${m.material}</div>
          <div class="badge-soft done">${statusLabel(m.status)}</div>
        </div>

        <div class="POLARIS-mark" aria-hidden="true">
        ${INLINE_SVG}
        </div>


        <div class="tile-foot">
  <div class="mono module-id">${m.id}</div>

  <div class="palette8 palette-bottom">
    ${paletteSlots(m.colors)}
  </div>

  <div class="progress">
    <div class="progress-ring" style="--p:${p}"></div>
    <div class="progress-val">${p}<span>%</span></div>
  </div>
</div>

          
        </div>
      </div>
    `;
  }).join("");
}

function renderManage(){
  const list = modules.filter(m => m.status !== "done");

  manageGrid.innerHTML = list.map(m => {
    const p = pct(m.progress || m.fill || 0);
    const barColor = m.status === "err" ? "var(--hi)" : "var(--md)";

    return `
      <div class="manage-card card ${m.status === "err" ? "is-err" : "is-dry"}">
        <div class="manage-top">
          <div class="manage-title">${m.mat || m.material}</div>
          <div class="manage-bar">
            <div style="width:${p}%; background:${barColor};"></div>
          </div>
        </div>
        <div class="manage-foot">
          <div class="mono module-id">${m.id}</div>

          <div class="palette8 palette-bottom">
            ${paletteSlots(m.colors)}
          </div>

          <div class="progress">
            <div class="progress-val">${p}<span>%</span></div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderInventory(){
  invList.innerHTML = inventory.map(r=>{
    const p = pct((r.grams / r.max) * 100);
    return `
      <div class="inv-row">
        <div class="inv-name">${r.mat}</div>
        <div class="inv-g">${r.grams}/${r.max}</div>
        <div class="inv-bar"><div style="width:${p}%;"></div></div>
      </div>
    `;
  }).join("");
}

function renderNext(){
  nextList.innerHTML = nextDays.map(x=>{
    const p = pct(x.p);
    return `
      <div class="next-item">
        <div class="next-top">
          <div>
            <div class="inv-name" style="margin-top:0px;">${x.mat}</div>
            <div class="next-title">${x.when}</div>
          </div>
          <div class="next-meta">
            <span class="dot ok"></span>
            <span>${x.hours || ""}</span>
          </div>
        </div>
        <div class="next-line"><div style="width:${p}%;"></div></div>
      </div>
    `;
  }).join("");
}

// init (carica SVG prima del render)
(async function init(){
  try{
    INLINE_SVG = await loadInlineSVG(HOME_SVG_PATH);
  }catch(e){
    console.error(e);
    // fallback: se manca il file, non blocchiamo la pagina
    INLINE_SVG = `<svg class="POLARIS-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="26" fill="currentColor" opacity="0.9"></circle>
    </svg>`;
  }

  (async function init(){
  try{
    INLINE_SVG = await loadInlineSVG(HOME_SVG_PATH);
  }catch(e){
    console.error(e);
    INLINE_SVG = null;
  }

  renderSystem();
  renderReady();
  renderManage();
  renderInventory();
  renderNext();
})();
})();
