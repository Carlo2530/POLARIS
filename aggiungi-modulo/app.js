const SVG_PATH = "../magazzino/assets/sagoma-progetto.svg";

const els = {
  moduleName: document.getElementById("moduleName"),
  moduleZone: document.getElementById("moduleZone"),
  moduleNote: document.getElementById("moduleNote"),

  pairBtn: document.getElementById("pairBtn"),
  saveBtn: document.getElementById("saveBtn"),

  nfcCard: document.getElementById("nfcCard"),
  nfcTitle: document.getElementById("nfcTitle"),
  nfcText: document.getElementById("nfcText"),
  nfcModuleShape: document.getElementById("nfcModuleShape"),

  autoId: document.getElementById("autoId"),
  autoConnection: document.getElementById("autoConnection"),
  autoFilaments: document.getElementById("autoFilaments"),
  autoTemp: document.getElementById("autoTemp"),
  autoPalette: document.getElementById("autoPalette"),
  autoProfile: document.getElementById("autoProfile"),

  previewTile: document.getElementById("previewTile"),
  previewName: document.getElementById("previewName"),
  previewBadge: document.getElementById("previewBadge"),
  previewBadgeText: document.getElementById("previewBadgeText"),
  previewStatusText: document.getElementById("previewStatusText"),
  previewId: document.getElementById("previewId"),
  previewZone: document.getElementById("previewZone"),
  previewConnection: document.getElementById("previewConnection"),
  previewNote: document.getElementById("previewNote"),
  previewPalette: document.getElementById("previewPalette"),
  previewPercent: document.getElementById("previewPercent"),
  pairState: document.getElementById("pairState"),
  previewSilhouette: document.getElementById("previewSilhouette")
};

let paired = false;

const automaticProfiles = [
  {
    id: "D-13",
    temp: "Adattiva in base al filamento",
    profile: "Smart Dry Profile",
    palette: ["#111111","#2a9d8f","#e9c46a","#f4a261","#e76f51","#8d99ae","#457b9d","#f1faee"]
  },
  {
    id: "D-14",
    temp: "Gestita automaticamente dal sistema",
    profile: "Dynamic Material Mapping",
    palette: ["#1d3557","#457b9d","#a8dadc","#f1faee","#e63946","#ffb703","#2a9d8f","#6d597a"]
  },
  {
    id: "D-15",
    temp: "Profilo termico automatico",
    profile: "Adaptive Storage Logic",
    palette: ["#101418","#495057","#ced4da","#2a9d8f","#3a86ff","#ffb703","#e76f51","#8338ec"]
  }
];

function sanitizeText(value, fallback = "—") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function emptyPaletteMarkup() {
  return new Array(8)
    .fill('<span class="sw is-empty"></span>')
    .join("");
}

function paletteMarkup(colors) {
  return colors.map(color => `<span class="sw" style="background:${color}"></span>`).join("");
}

function updatePreviewText() {
  els.previewName.textContent = sanitizeText(els.moduleName.value, "Nuovo modulo");
  els.previewZone.textContent = sanitizeText(els.moduleZone.value, "Zona non definita");
  els.previewNote.textContent = sanitizeText(els.moduleNote.value, "Nessuna nota inserita.");
}

function setUnpairedState() {
  paired = false;

  els.nfcTitle.textContent = "Avvicina il telefono al modulo";
  els.nfcText.textContent = "Rileva e associa automaticamente l’hardware del nuovo modulo POLARIS.";

  els.autoId.textContent = "In attesa";
  els.autoConnection.textContent = "Non associato";
  els.autoFilaments.textContent = "Automatico dopo inserimento";
  els.autoTemp.textContent = "Calcolata dal sistema";
  els.autoPalette.textContent = "Generata automaticamente";
  els.autoProfile.textContent = "Adattivo";

  els.previewTile.className = "tile preview-tile";
  els.previewBadge.className = "badge dry";
  els.previewBadgeText.textContent = "NON ASSOCIATO";
  els.previewStatusText.textContent = "In attesa di associazione";
  els.previewId.textContent = "ID non assegnato";
  els.previewConnection.textContent = "In attesa";
  els.previewPalette.innerHTML = emptyPaletteMarkup();
  els.previewPercent.textContent = "--";
  els.pairState.textContent = "Pronto per pairing NFC";
  els.pairBtn.textContent = "Connetti modulo";
}

function setPairedState() {
  paired = true;

  const profile = automaticProfiles[Math.floor(Math.random() * automaticProfiles.length)];

  els.nfcTitle.textContent = "Modulo rilevato correttamente";
  els.nfcText.textContent = "Associazione completata. I parametri di gestione saranno definiti automaticamente dal sistema.";

  els.autoId.textContent = profile.id;
  els.autoConnection.textContent = "Associato via NFC";
  els.autoFilaments.textContent = "Riconoscimento automatico attivo";
  els.autoTemp.textContent = profile.temp;
  els.autoPalette.textContent = "Sincronizzazione automatica attiva";
  els.autoProfile.textContent = profile.profile;

  els.previewTile.className = "tile preview-tile";
  els.previewBadge.className = "badge done";
  els.previewBadgeText.textContent = "ASSOCIATO";
  els.previewStatusText.textContent = "Modulo pronto per il sistema";
  els.previewId.textContent = profile.id;
  els.previewConnection.textContent = "Associato via NFC";
  els.previewPalette.innerHTML = paletteMarkup(profile.palette);
  els.previewPercent.textContent = "Auto";
  els.pairState.textContent = "Modulo pronto per riconoscimento filamenti";
  els.pairBtn.textContent = "Ricollega modulo";
}

function togglePairing() {
  if (paired) {
    setUnpairedState();
  } else {
    setPairedState();
  }
}

function handleReset() {
  requestAnimationFrame(() => {
    setUnpairedState();
    updatePreviewText();
  });
}

function fakeSaveFeedback() {
  const original = els.saveBtn.textContent;
  els.saveBtn.disabled = true;
  els.saveBtn.textContent = "Modulo salvato";

  setTimeout(() => {
    els.saveBtn.disabled = false;
    els.saveBtn.textContent = original;
  }, 1400);
}

async function loadInlineSVG(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossibile caricare SVG: ${url} (${res.status})`);
  let svgText = await res.text();

  svgText = svgText
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "");

  svgText = svgText.replace(/style="[^"]*"/gi, (m) => {
    let s = m
      .replace(/fill\s*:\s*none\s*;?/gi, "fill:currentColor;")
      .replace(/stroke\s*:\s*[^;"]+\s*;?/gi, "stroke:none;")
      .replace(/stroke-width\s*:\s*[^;"]+\s*;?/gi, "");

    if (!/fill\s*:/i.test(s)) s = s.replace(/"$/, ' fill:currentColor;"');
    return s;
  });

  svgText = svgText
    .replace(/fill="none"/gi, 'fill="currentColor"')
    .replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="none"')
    .replace(/stroke="[^"]*"/g, 'stroke="none"');

  svgText = svgText.replace(
    /<svg\b([^>]*)>/i,
    (m, attrs) => {
      if (/class="/i.test(attrs)) return `<svg${attrs}>`;
      return `<svg class="silhouette"${attrs}>`;
    }
  );

  return svgText;
}

async function initPreviewSVG() {
  try {
    const inlineSvg = await loadInlineSVG(SVG_PATH);

    if (els.previewSilhouette) {
      els.previewSilhouette.innerHTML = inlineSvg;
    }

    if (els.nfcModuleShape) {
      els.nfcModuleShape.innerHTML = inlineSvg;
    }
  } catch (err) {
    console.error(err);

    const fallback = `
      <svg class="silhouette" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="28" fill="currentColor"></circle>
      </svg>
    `;

    if (els.previewSilhouette) {
      els.previewSilhouette.innerHTML = fallback;
    }

    if (els.nfcModuleShape) {
      els.nfcModuleShape.innerHTML = fallback;
    }
  }
}

els.moduleName.addEventListener("input", updatePreviewText);
els.moduleZone.addEventListener("input", updatePreviewText);
els.moduleNote.addEventListener("input", updatePreviewText);

els.pairBtn.addEventListener("click", togglePairing);

document.getElementById("moduleForm").addEventListener("reset", handleReset);

els.saveBtn.addEventListener("click", () => {
  const payload = {
    name: sanitizeText(els.moduleName.value, "Nuovo modulo"),
    zone: sanitizeText(els.moduleZone.value, "Zona non definita"),
    note: sanitizeText(els.moduleNote.value, ""),
    paired
  };

  console.log("POLARIS new module:", payload);
  fakeSaveFeedback();
});

updatePreviewText();
setUnpairedState();
initPreviewSVG();