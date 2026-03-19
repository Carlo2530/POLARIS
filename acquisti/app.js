// POLARIS — Acquisti (Ibrida)
// - suggerimenti (decisione)
// - scorte (controllo)
// - lista acquisti (operatività)
// - link fornitori (azione)

const suggestionsEl = document.getElementById("suggestions");
const heroEl = document.getElementById("heroSuggestions");
const drawer = document.getElementById("drawer");
const dTitle = document.getElementById("dTitle");
const dSub = document.getElementById("dSub");
const dReasons = document.getElementById("dReasons");
const dJson = document.getElementById("dJson");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const btnExportRec = document.getElementById("btnExportRec");

const stockList = document.getElementById("stockList");
const basketEl = document.getElementById("basket");

const kSug = document.getElementById("kSug");
const kLow = document.getElementById("kLow");

const btnSim = document.getElementById("btnSim");
const btnExportList = document.getElementById("btnExportList");
const btnPrint = document.getElementById("btnPrint");
const btnClear = document.getElementById("btnClear");

const btnAdd = document.getElementById("btnAdd");
const btnCancel = document.getElementById("btnCancel");
const linkForm = document.getElementById("linkForm");
const linksEl = document.getElementById("links");
const fMat = document.getElementById("fMat");
const fName = document.getElementById("fName");
const fUrl = document.getElementById("fUrl");

const segBtns = document.querySelectorAll(".seg-btn");

let filter = "all";

// ---------- Demo stock (poi lo colleghi ai dati veri) ----------
let stock = [
  { mat: "PLA", qty: 8, min: 6, humidityAvg: 28, jobs7d: 2, weeklyUse: 3, brand:"Polymaker", colorName:"nero", colorHex:"#121317", sampleImg: "assets/samples/sample_black.png" },
  { mat: "PETG", qty: 4, min: 5, humidityAvg: 34, jobs7d: 3, weeklyUse: 4, brand:"Polymaker", colorName:"rosso", colorHex:"#a60000", sampleImg: "assets/samples/sample_red.png" },
  { mat: "ABS", qty: 1, min: 3, humidityAvg: 52, jobs7d: 2, weeklyUse: 3, brand:"Polymaker", colorName:"verde", colorHex:"#078300", sampleImg: "assets/samples/sample_green.png" },
  { mat: "ASA", qty: 3, min: 3, humidityAvg: 41, jobs7d: 1, weeklyUse: 2, brand:"Polymaker", colorName:"blu", colorHex:"#001877", sampleImg: "assets/samples/sample_darkblue.png" },
  { mat: "PA", qty: 2, min: 4, humidityAvg: 62, jobs7d: 1, weeklyUse: 1, brand:"Polymaker", colorName:"azzurro", colorHex:"#84dcff", sampleImg: "assets/samples/sample_blue.png" },
  { mat: "TPU", qty: 6, min: 3, humidityAvg: 33, jobs7d: 0, weeklyUse: 1, brand:"Polymaker", colorName:"giallo", colorHex:"#fcff3d", sampleImg: "assets/samples/sample_yellow.png" },
  { mat: "PC", qty: 2, min: 3, humidityAvg: 46, jobs7d: 1, weeklyUse: 1, brand:"Polymaker", colorName:"bianco", colorHex:"#dfdfdf", sampleImg: "assets/samples/sample_white.png" },
  { mat: "PA-CF", qty: 1, min: 2, humidityAvg: 58, jobs7d: 1, weeklyUse: 1, brand:"Polymaker", colorName:"nero", colorHex:"#121317", sampleImg: "assets/samples/sample_black.png" },
];

// ---------- Basket ----------
let basket = []; // { mat, qty, why, priority, etaDays }

// ---------- Vendor links (localStorage) ----------
const LS_KEY = "POLARIS_VENDOR_LINKS";
let links = loadLinks();

function loadLinks(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveLinks(){
  localStorage.setItem(LS_KEY, JSON.stringify(links));
}

// ---------- Helpers ----------
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function stateOf(r){
  if (r.qty < r.min) return "err";
  if (r.qty === r.min) return "dry"; // attenzione
  return "done";
}

function stateDotHTML(state){
  // mapping: done=OK, dry=Limite, err=Sotto soglia
  const cls = state === "err" ? "err" : state === "dry" ? "warn" : "ok";
  const aria = state === "err" ? "Sotto soglia" : state === "dry" ? "Limite" : "OK";
  return `<span class="state-dot ${cls}" aria-label="${aria}" title="${aria}"></span>`;
}

function priorityOf(score){
  if (score >= 75) return { key:"Alta", tag:"bad" };
  if (score >= 50) return { key:"Media", tag:"warn" };
  return { key:"Bassa", tag:"ok" };
}

function computeSuggestion(r){
  // ETA stock-out (giorni): qty / weeklyUse * 7 (se weeklyUse=0 => 30)
  const etaDays = r.weeklyUse > 0 ? Math.round((r.qty / r.weeklyUse) * 7) : 30;

  const reasons = [];
  // stock
  if (r.qty < r.min) reasons.push({ t:`Stock ${r.qty} < soglia ${r.min}`, kind:"bad" });
  else if (r.qty === r.min) reasons.push({ t:`Stock al limite (${r.qty})`, kind:"warn" });

  // jobs
  if (r.jobs7d >= 2) reasons.push({ t:`Job pianificati 7gg: ${r.jobs7d}`, kind:"warn" });

  // hygroscopic risk (soglia “tesi”)
  if (r.humidityAvg >= 50) reasons.push({ t:`Rischio igroscopico (avg ${r.humidityAvg}%)`, kind:"bad" });

  // ETA
  if (etaDays <= 7) reasons.push({ t:`ETA stock-out ${etaDays}gg`, kind:"bad" });
  else if (etaDays <= 14) reasons.push({ t:`ETA stock-out ${etaDays}gg`, kind:"warn" });

  // score 0–100 (semplice ma spiegabile)
  let score = 0;
  score += clamp((r.min - r.qty) * 18, 0, 50);      // stock pressure
  score += clamp(r.jobs7d * 10, 0, 20);             // planned work
  score += r.humidityAvg >= 50 ? 20 : (r.humidityAvg >= 40 ? 10 : 0); // hygroscopic
  score += etaDays <= 7 ? 20 : (etaDays <= 14 ? 10 : 0);

  score = clamp(score, 0, 100);

  const pr = priorityOf(score);

  // quantità consigliata: porta a soglia + buffer 2
  const needed = Math.max((r.min - r.qty) + 2, 2);

  return {
  mat: r.mat,
  needed,
  etaDays,
  score,
  priority: pr.key,
  tag: pr.tag,
  reasons,
  brand: r.brand || "Generic",
  colorName: r.colorName || "—",
  colorHex: r.colorHex || "#9aa3ad",
  sampleImg: r.sampleImg || "assets/samples/sample_generic.png",
};

}

function suggestionsAll(){
  // suggerimenti solo se: sotto soglia o limite o eta <= 14 o igro >= 50 o jobs >=2
  const list = stock.map(r=>{
    const s = computeSuggestion(r);
    const isRelevant =
      (r.qty <= r.min) ||
      (s.etaDays <= 14) ||
      (r.humidityAvg >= 50) ||
      (r.jobs7d >= 2);
    return { r, s, isRelevant };
  }).filter(x => x.isRelevant).map(x => x.s);

  // ordina: score desc
  list.sort((a,b)=> b.score - a.score);
  return list;
}

function applyFilter(list){
  if (filter === "critical") return list.filter(s => s.score >= 75 || s.etaDays <= 7);
  if (filter === "soon") return list.filter(s => s.etaDays <= 14);
  return list;
}

// ---------- Render ----------
function renderStock(){
  stockList.innerHTML = "";
  const lowCount = stock.filter(r => r.qty < r.min).length;
  kLow.textContent = lowCount;

  stock.forEach(r=>{
    const tr = document.createElement("div");
    tr.className = "tr";
    tr.innerHTML = `
      <div class="mat">${r.mat}</div>
      <div class="right">${r.qty}</div>
      <div class="right">${r.min}</div>
      <div class="state">${stateDotHTML(stateOf(r))}</div>
    `;
    stockList.appendChild(tr);
  });
}

function renderSuggestions(){
  const all = suggestionsAll();
  const list = applyFilter(all);
  kSug.textContent = all.length;

  // HERO: primi 2
  const hero = list.slice(0,2);
  const rest = list.slice(2);

  // --- HERO render ---
  if(heroEl){
    if(!hero.length){
      heroEl.innerHTML = `<div style="font-weight:900; color: rgba(21,19,26,0.55); font-size:12px;">Nessun suggerimento.</div>`;
    }else{
      heroEl.innerHTML = hero.map(s=>{
        const prClass = s.priority === "Alta" ? "prio-high" : s.priority === "Media" ? "prio-med" : "prio-low";
        const stateClass = s.score >= 75 ? "err" : (s.score >= 50 ? "dry" : "done");
        const hasLink = links.some(l => l.mat.toLowerCase() === s.mat.toLowerCase());
        return `
  <div class="hero-card ${prClass} ${stateClass}">
    <div>
      <div style="font-weight:1000; font-size:14px;">
        ${s.mat}
        <span class="colorline">
          <span class="swatch" style="--swatch:${s.colorHex}"></span>
          <span class="colorname">${s.colorName}</span>
        </span>
      </div>

      <div style="margin-top:6px; font-size:12px; font-weight:800; color: rgba(21,19,26,0.55);">
        ${s.brand} · +${s.needed} bobine · ETA ${s.etaDays}gg · Score ${s.score}/100
      </div>

      <div style="margin-top:12px; display:flex; gap:10px;">
        <button class="btn ghost" data-detail="${s.mat}">Dettaglio</button>
        <button class="btn" data-addbasket="${s.mat}">Aggiungi</button>
      </div>
    </div>

    <div class="sample">
      <img src="${s.sampleImg}" alt="${s.mat} ${s.colorName}">
    </div>
  </div>
`;
      }).join("");
    }
  }

  // --- LIST render (rest) ---
  if(!rest.length){
    suggestionsEl.innerHTML = `<div style="font-weight:900; color: rgba(21,19,26,0.55); font-size:12px;">Nessun altro suggerimento.</div>`;
  }else{
    suggestionsEl.innerHTML = rest.map(s=>{
      const prClass = s.priority === "Alta" ? "prio-high" : s.priority === "Media" ? "prio-med" : "prio-low";
      const stateClass = s.score >= 75 ? "err" : (s.score >= 50 ? "dry" : "done");
      const hasLink = links.some(l => l.mat.toLowerCase() === s.mat.toLowerCase());

      return `
        <div class="rowcard ${prClass} ${stateClass}">
          <div class="row-left">
            <img src="${s.sampleImg}" alt="${s.mat} ${s.colorName}">
            <div style="min-width:0;">
               <div style="font-weight:1000;">
                ${s.mat}
                <span class="colorline">
                 <span class="swatch" style="--swatch:${s.colorHex}"></span>
                 <span class="colorname">${s.colorName}</span>
                </span>
               • +${s.needed}
              </div>
              <div style="margin-top:6px; font-size:12px; font-weight:800; color: rgba(21,19,26,0.55);">
                ${s.brand} · ETA ${s.etaDays}gg · Score ${s.score}/100
              </div>
            </div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn ghost" data-detail="${s.mat}">Dettaglio</button>
            <button class="btn" data-addbasket="${s.mat}">Aggiungi</button>
          </div>
        </div>
      `;
    }).join("");
  }

  // bind buttons (hero + list)
  document.querySelectorAll("[data-detail]").forEach(b=>{
    b.addEventListener("click", ()=> openDrawer(b.dataset.detail));
  });
  document.querySelectorAll("[data-addbasket]").forEach(b=>{
    b.addEventListener("click", ()=> addToBasket(b.dataset.addbasket));
  });
  document.querySelectorAll("[data-open]").forEach(b=>{
    b.addEventListener("click", ()=> openVendorLink(b.dataset.open));
  });
  document.querySelectorAll("[data-addlink]").forEach(b=>{
    b.addEventListener("click", ()=> openForm(b.dataset.addlink));
  });
}

function renderBasket(){
  if(!basket.length){
    basketEl.innerHTML = `<div style="font-weight:900; color: rgba(21,19,26,0.55); font-size:12px;">Lista vuota.</div>`;
    return;
  }

  basketEl.innerHTML = basket.map((b, idx)=>`
    <div class="bitem">
      <div>
        <div class="title">${b.mat} • +${b.qty}</div>
        <div class="meta">
  <span class="prio-badge ${b.priority==='Alta'?'high':b.priority==='Media'?'med':'low'}">
    <span class="dot"></span>${b.priority}
  </span>
  <span style="margin-left:10px;">ETA: ${b.etaDays}gg</span>
</div>
      </div>
      <button class="btn ghost" data-del="${idx}">Rimuovi</button>
    </div>
  `).join("");

  basketEl.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = Number(btn.dataset.del);
      basket.splice(i,1);
      renderBasket();
    });
  });
}

function openDrawer(mat){
  const s = suggestionsAll().find(x => x.mat === mat);
  if(!s) return;

  dTitle.textContent = `Dettaglio • ${s.mat}`;
  dSub.textContent = `Consiglio: +${s.needed} • ETA ${s.etaDays}gg • Score ${s.score}/100 • Priorità ${s.priority}`;

  dReasons.innerHTML = s.reasons.map(r=>`<div class="reason">• ${r.t}</div>`).join("");

  const payload = {
    material: s.mat,
    suggested_qty: s.needed,
    eta_stockout_days: s.etaDays,
    priority: s.priority,
    score: s.score,
    reasons: s.reasons.map(x=>x.t),
    generated_at: new Date().toISOString(),
    notes: "Simulazione tesi POLARIS"
  };

  dJson.textContent = JSON.stringify(payload, null, 2);

  drawer.classList.remove("is-hidden");
  btnExportRec.onclick = () => exportJSON(payload, `POLARIS_reco_${s.mat}.json`);
}

btnCloseDrawer.addEventListener("click", ()=> drawer.classList.add("is-hidden"));

function exportJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function addToBasket(mat){
  const s = suggestionsAll().find(x => x.mat === mat);
  if(!s) return;

  const existing = basket.find(b => b.mat === mat);
  if(existing){
    existing.qty += s.needed;
  }else{
    basket.unshift({ mat, qty: s.needed, priority: s.priority, etaDays: s.etaDays });
  }
  renderBasket();
}

function openVendorLink(mat){
  const list = links.filter(l => l.mat.toLowerCase() === mat.toLowerCase());
  if(!list.length) return openForm(mat);
  window.open(list[0].url, "_blank");
}

// ---------- Vendor links UI ----------
function renderLinks(){
  if(!links.length){
    linksEl.innerHTML = `<div style="font-weight:900; color: rgba(21,19,26,0.55); font-size:12px;">Nessun link salvato.</div>`;
    return;
  }

  linksEl.innerHTML = links.map((l, idx)=>`
    <div class="link">
      <div>
        <div style="font-weight:1000;">${l.mat}</div>
        <div style="margin-top:6px;">
          <a href="${l.url}" target="_blank" rel="noreferrer">${l.name}</a>
        </div>
      </div>
      <button class="btn ghost" data-del="${idx}">Rimuovi</button>
    </div>
  `).join("");

  linksEl.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const i = Number(b.dataset.del);
      links.splice(i,1);
      saveLinks();
      renderLinks();
      renderSuggestions();
    });
  });
}

function openForm(mat=""){
  linkForm.classList.remove("is-hidden");
  fMat.value = mat;
  fName.value = "";
  fUrl.value = "";
  fName.focus();
}

function closeForm(){ linkForm.classList.add("is-hidden"); }

btnAdd.addEventListener("click", ()=> openForm(""));
btnCancel.addEventListener("click", closeForm);

linkForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const mat = fMat.value.trim();
  const name = fName.value.trim();
  const url = fUrl.value.trim();
  if(!mat || !name || !url) return;

  links.unshift({ mat, name, url });
  saveLinks();
  closeForm();
  renderLinks();
  renderSuggestions();
});

// ---------- Sim + export ----------
btnSim.addEventListener("click", ()=>{
  // abbassa 2 materiali a caso
  for(let i=0;i<2;i++){
    const idx = Math.floor(Math.random() * stock.length);
    stock[idx].qty = Math.max(0, stock[idx].qty - (1 + Math.floor(Math.random()*2)));
  }
  renderStock();
  renderSuggestions();
});

btnExportList.addEventListener("click", ()=>{
  const payload = { list: basket, exported_at: new Date().toISOString() };
  exportJSON(payload, "POLARIS_purchase_list.json");
});

btnPrint.addEventListener("click", ()=> window.print());

btnClear.addEventListener("click", ()=>{
  basket = [];
  renderBasket();
});

// ---------- Filter ----------
segBtns.forEach(b=>{
  b.addEventListener("click", ()=>{
    segBtns.forEach(x=>x.classList.remove("is-active"));
    b.classList.add("is-active");
    filter = b.dataset.filter;
    renderSuggestions();
  });
});

// init
renderStock();
renderSuggestions();
renderBasket();
renderLinks();
