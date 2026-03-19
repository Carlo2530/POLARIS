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
  { id:"D-01", mat:"PLA", status:"done", grams:750, progress:85 },
  { id:"D-02", mat:"PETG", status:"done", grams:320, progress:100 },
  { id:"D-03", mat:"ASA", status:"done", grams:460, progress:60 },

  { id:"D-05", mat:"ABS", status:"dry", note:"Mancano ~6h", progress:30, grams:150 },
  { id:"D-07", mat:"PA-CF", status:"err", note:"Verifica stato", progress:30, grams:80 },
  { id:"D-06", mat:"TPU", status:"dry", note:"DE07 · 880d", progress:95, grams:280 },
];

const inventory = [
  { mat:"PLA", grams:750, max:1000 },
  { mat:"ABS", grams:150, max:1000 },
  { mat:"PETG", grams:320, max:1000 },
  { mat:"ASA", grams:460, max:1000 },
  { mat:"TPU", grams:280, max:1000 },
  { mat:"PA-CF", grams:80, max:1000 },
];

const nextDays = [
  { when:"Domani", mat:"ABS", hours:"10h", p:55 },
  { when:"Tra 2 giorni", mat:"PETG", hours:"—", p:78 },
  { when:"Tra 3 giorni", mat:"PLA da 11-essiccare", hours:"", p:25 },
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
    const p = pct(m.progress);
    return `
      <div class="ready-card card done" data-id="${m.id}">
        <div class="ready-top">
          <div class="ready-mat">${m.mat}</div>
          <div class="badge-soft done">${statusLabel(m.status)}</div>
        </div>

        <div class="POLARIS-mark" aria-hidden="true">
        ${INLINE_SVG}
        </div>


        <div class="ready-foot">
          <div class="ready-meta">
            <span class="mono">${m.id}</span>
            <span>•</span>
            <span>${m.grams}g disponibili</span>
          </div>

          <div class="ring" style="--p:${p}; --ring: var(--lo);">
            <span>${p}%</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderManage(){
  const list = modules.filter(m => m.status!=="done");
  manageGrid.innerHTML = list.map(m=>{
    const p = pct(m.progress || 0);
    const chipCls = m.status === "err" ? "err" : "dry";
    const barColor = m.status === "err" ? "var(--hi)" : "var(--md)";
    return `
      <div class="manage-card card">
        <div class="manage-top">
          <div>
            <div class="manage-title">${m.mat}</div>
            <div class="manage-sub">${m.note || ""}</div>
          </div>
          <div class="manage-chip ${chipCls}">${statusLabel(m.status)}</div>
        </div>

        <div class="manage-bar">
          <div style="width:${p}%; background:${barColor};"></div>
        </div>

        <div class="manage-foot">
          <div class="mono">${m.id} · ${m.grams || "—"}g disponibili</div>
          <div style="font-weight:1000;">${p}%</div>
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
        <div class="inv-g">${r.grams}g</div>
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
            <div class="next-title">${x.when}</div>
            <div class="muted" style="margin-top:6px; font-weight:900;">${x.mat}</div>
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
