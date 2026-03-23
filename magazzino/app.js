// POLARIS — Overview tecnica moduli 3×4

const GRID_ID = "grid";
const SVG_PATH = "assets/sagoma-progetto.svg";

const grid = document.getElementById(GRID_ID);

// 12 moduli (3 righe x 4 colonne)
const modules = [
  { id: "D-01", material: "PLA",  status: "done", fill: 11, colors: ["#111","#e53935","#43a047","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },
  { id: "D-02", material: "PETG", status: "dry", fill: 45,  colors: ["#d32f2f","#c2185b","#7b1fa2","#1976d2","#388e3c","#fbc02d","#f57c00","#455a64"] },
  { id: "D-03", material: "ASA",  status: "done", fill: 10, colors: ["#fff","#9e9e9e","#616161","#212121","#ff7043","#26a69a","#ab47bc","#5c6bc0"] },
  { id: "D-04", material: "PLA",   status: "done", fill: 15,  colors: ["#111","#e53935","#43a047","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },

  { id: "D-05", material: "ABS",  status: "dry", fill: 45,  colors: ["#424242","#ef5350","#66bb6a","#42a5f5","#ffee58","#7e57c2","#ffa726","#26c6da"] },
  { id: "D-06", material: "TPU",  status: "done", fill: 11, colors: ["#000","#90a4ae","#ff7043","#8d6e63","#26a69a","#ec407a","#ffee58","#5c6bc0"] },
  { id: "D-07", material: "PC",   status: "dry", fill: 35,  colors: ["#eceff1","#546e7a","#ff8a65","#4db6ac","#ba68c8","#7986cb","#dce775","#ffd54f"] },
  { id: "D-08", material: "PLA",  status: "done", fill: 18, colors: ["#212121","#d81b60","#1e88e5","#43a047","#fdd835","#8e24aa","#fb8c00","#00acc1"] },

  { id: "D-09", material: "PETG", status: "dry", fill: 27,  colors: ["#e0e0e0","#757575","#ffca28","#66bb6a","#42a5f5","#ab47bc","#ef5350","#26c6da"] },
  { id: "D-10", material: "ASA",  status: "done", fill: 19, colors: ["#ffffff","#111111","#ff7043","#26a69a","#7e57c2","#42a5f5","#ffee58","#8d6e63"] },
  { id: "D-11", material: "PA-CF",status: "err", fill: 23,  colors: ["#000","#111","#222","#333","#444","#555","#666","#777"] },
  { id: "D-12", material: "ABS",  status: "done", fill: 16, colors: ["#111","#f4511e","#7cb342","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },
  
  { id: "D-13", material: "PETG", status: "dry", fill: 27,  colors: ["#e0e0e0","#757575","#ffca28","#66bb6a","#42a5f5","#ab47bc","#ef5350","#26c6da"] },
  { id: "D-14", material: "ASA",  status: "done", fill: 19, colors: ["#ffffff","#111111","#ff7043","#26a69a","#7e57c2","#42a5f5","#ffee58","#8d6e63"] },
  { id: "D-15", material: "PC",   status: "dry", fill: 35,  colors: ["#eceff1","#546e7a","#ff8a65","#4db6ac","#ba68c8","#7986cb","#dce775","#ffd54f"] },
  { id: "D-16", material: "ABS",  status: "done", fill: 16, colors: ["#111","#f4511e","#7cb342","#1e88e5","#fdd835","#8e24aa","#fb8c00","#00acc1"] },
];

function updateKpis(mods){
  const kDry  = document.getElementById("kDry");
  const kDone = document.getElementById("kDone");
  const kErr  = document.getElementById("kErr");
  if (!kDry || !kDone || !kErr) return;

  const dry = mods.filter(m => m.status === "dry").length;
  const done = mods.filter(m => m.status === "done").length;
  const err = mods.filter(m => m.status === "err").length;

  kDry.textContent = dry;
  kDone.textContent = done;
  kErr.textContent = err;
}

// -------------------- helpers --------------------

function statusLabel(status) {
  if (status === "dry") return "DA ESSICCARE";
  if (status === "done") return "ESSICCATO";
  return "ERRORE";
}
function badgeClass(status) {
  if (status === "dry") return "dry";
  if (status === "done") return "done";
  return "err";
}
function tileClass(status) {
  return `tile status-${status}`;
}

function paletteSlots(colors) {
  const slots = [];
  for (let i = 0; i < 8; i++) {
    const col = colors[i % colors.length];
    slots.push(`<span class="sw" style="background:${col}"></span>`);
  }
  return slots.join("");
}

// Carica SVG da file e restituisce il markup (<svg ...>...</svg>)
// Importante: lo inseriamo INLINE per poter usare currentColor
async function loadInlineSVG(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossibile caricare SVG: ${url} (${res.status})`);
  let svgText = await res.text();

    // 1) togli width/height esportati da Rhino (pt) -> così CSS controlla davvero la scala
  svgText = svgText
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "");

  // 2) forza fill/stroke anche se Rhino mette style="fill:none;stroke:..."
  svgText = svgText.replace(/style="[^"]*"/gi, (m) => {
    // elimina fill:none e stroke qualsiasi
    let s = m
      .replace(/fill\s*:\s*none\s*;?/gi, "fill:currentColor;")
      .replace(/stroke\s*:\s*[^;"]+\s*;?/gi, "stroke:none;")
      .replace(/stroke-width\s*:\s*[^;"]+\s*;?/gi, "");
    // se dopo non c'è fill, forziamo
    if (!/fill\s*:/i.test(s)) s = s.replace(/"$/, " fill:currentColor;\"");
    return s;
  });

  // Safety: assicuriamoci che la sagoma usi currentColor
  // (se il file ha fill="#000" o fill="none", lo rendiamo currentColor)
  // Questo è volutamente "semplice": funziona bene con sagome monocromatiche.
  svgText = svgText
    .replace(/fill="none"/gi, 'fill="currentColor"')
    .replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="none"')
    .replace(/stroke="[^"]*"/g, 'stroke="none"');

  // Se non c'è "class" sull'svg, lo aggiungiamo
  svgText = svgText.replace(
    /<svg\b([^>]*)>/i,
    (m, attrs) => {
      // se class già presente, non duplicare
      if (/class="/i.test(attrs)) return `<svg${attrs}>`;
      return `<svg class="silhouette"${attrs}>`;
    }
  );

  return svgText;
}

// -------------------- render --------------------

function render(mods, inlineSvgMarkup) {
  if (!grid) {
    console.error(`Elemento #${GRID_ID} non trovato in index.html`);
    return;
  }

  grid.innerHTML = "";

  mods.forEach((m) => {
    const tile = document.createElement("div");
    tile.className = tileClass(m.status);
    tile.dataset.status = m.status;


        const p = Math.max(0, Math.min(100, Math.floor(m.fill ?? 85)));

    tile.innerHTML = `
    <a href="../modulo/index.html?id=${encodeURIComponent(m.id)}" class="tile-link">
      <div class="tile-head">
        <div class="material-name">${m.material}</div>
        <div class="badge ${badgeClass(m.status)}">
          <span class="dot"></span>
          <span>${statusLabel(m.status)}</span>
        </div>
      </div>

      <div class="tile-body">
        <div class="silhouette-wrap">
          ${inlineSvgMarkup}
        </div>
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
      </a>
    `;

    grid.appendChild(tile);
  });
}

// -------------------- init --------------------

(async function init() {
  try {
    const inlineSvg = await loadInlineSVG(SVG_PATH);
    render(modules, inlineSvg);
    updateKpis(modules);
  } catch (err) {
    console.error(err);
    // fallback: se non carica lo SVG, almeno renderizza i moduli senza sagoma
    render(modules, `<svg class="silhouette" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="28" fill="currentColor"></circle>
</svg>`);
    updateKpis(modules);
    alert("Errore: non riesco a caricare la sagoma SVG. Controlla che il file esista in /assets e che il nome sia identico.");
  }
})();
