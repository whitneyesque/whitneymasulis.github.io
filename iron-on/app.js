// app.js — iron-on text designer
// Boots the app shell, holds app state, rebuilds the SVG preview on every change.
// SVG viewBox uses UNITS_PER_INCH (100) units per inch so sizes are intuitive.

import {
  FONT_GROUPS, ALL_FONTS, loadGoogleFonts, loadLocalFonts,
  registerCustomFont, listCustomFonts, reHydrateCustomFont,
  whenFontReady,
} from './fonts.js';
import { createFontPicker } from './font-picker.js';
import {
  BRAND_CHARTS, SEEDED_PRESETS,
  getBrands, getSizesForBrand, getDimensions,
} from './size-charts.js';
import { UNITS_PER_INCH, renderGarmentSvg, startCalibration, buildCalibration } from './mockup.js';
import {
  listDesigns, loadDesign, saveDesign, deleteDesign, duplicateDesign,
  exportLibrary, importLibrary,
} from './storage.js';

// ========== SECTION 1: CONSTANTS / STATE / DOM / HELPERS ==========

const DEFAULT_FONT = 'Bungee';
const DEFAULT_COLOR = '#e11d48';
const DISPLAY_PX_PER_IN = 60;
const SVG_NS = 'http://www.w3.org/2000/svg';

const PAPER_SIZES = {
  letter:   { widthIn: 8.5, heightIn: 11, label: 'US Letter 8.5×11"' },
  square:   { widthIn: 8,   heightIn: 8,  label: 'Square 8×8"' },
  portrait: { widthIn: 8,   heightIn: 10, label: 'Portrait 8×10"' },
};

const RAINBOW_STOPS = [
  { offset: 0,    color: '#ff2e2e' },
  { offset: 0.17, color: '#ff8c1a' },
  { offset: 0.34, color: '#ffd91a' },
  { offset: 0.50, color: '#3cc73c' },
  { offset: 0.66, color: '#1a9cff' },
  { offset: 0.83, color: '#4a3cff' },
  { offset: 1.0,  color: '#a03cff' },
];

function newId() { return 'l_' + Math.random().toString(36).slice(2, 10); }

function makeTextLayer(overrides = {}) {
  return {
    id: newId(),
    type: 'text',
    content: 'Brooklyn',
    font: { family: DEFAULT_FONT, source: 'google' },
    size: 120,
    letterSpacing: 0,
    lineHeight: 1.1,
    fill: {
      mode: 'solid',
      color: DEFAULT_COLOR,
      letterColors: {},
      gradient: { angle: 0, stops: [
        { offset: 0, color: '#e11d48' },
        { offset: 1, color: '#1a9cff' },
      ] },
      rainbowAngle: 0,
    },
    stroke:  { enabled: false, color: '#000000', width: 4 },
    shadow:  { enabled: false, color: '#000000', blur: 6, dx: 2, dy: 2 },
    curve:   { enabled: false, amount: 40 },
    sparkle: { enabled: false, density: 12, size: 14, color: '#ffd700' },
    transform: { x: 0, y: 0, rotation: 0 },
    ...overrides,
  };
}

const state = {
  designId: null,
  name: 'Untitled design',
  layers: [makeTextLayer()],
  selectedId: null,
  paperSize: 'letter',
  orientation: 'portrait', // 'portrait' | 'landscape' — swaps paper w/h
  view: 'design',
  zoom: 100,
  mockup: {
    preset: '',
    brand: 'primary',
    size: '5',
    garment: 'tank',
    tint: '#ef3e2c',
    photoDataUrl: null,
    calibration: null,
    placement: { xIn: 0, yIn: 0, scale: 1 },
  },
  export: { format: 'png', size: 'letter', mirror: true },
  customFonts: {},
};
state.selectedId = state.layers[0].id;

let dirty = false;
function markDirty()  { if (!dirty) { dirty = true;  els.unsavedDot.hidden = false; } }
function markClean()  { dirty = false; els.unsavedDot.hidden = true; }

// The custom font picker. Instantiated in init() once the DOM is ready.
let fontPicker = null;

function getSelected() {
  return state.layers.find(l => l.id === state.selectedId) || state.layers[0] || null;
}

function selectLayer(id) {
  state.selectedId = id;
  syncPanelToLayer();
  renderLayersPanel();
  renderAll();
}

const $ = (id) => document.getElementById(id);
const els = {
  designName: $('design-name'),
  unsavedDot: $('unsaved-dot'),
  btnLibrary: $('btn-library'),
  btnSave: $('btn-save'),
  btnExport: $('btn-export'),

  tabDesign: $('tab-design'),
  tabMockup: $('tab-mockup'),

  panelBtns: document.querySelectorAll('.panel-btn'),
  panels: document.querySelectorAll('.panel'),

  btnAddText: $('btn-add-text'),
  layerList: $('layer-list'),

  textContent: $('text-content'),
  textFontUpload: $('text-font-upload'),
  textSize: $('text-size'),
  textSizeVal: $('text-size-val'),
  textSpacing: $('text-spacing'),
  textSpacingVal: $('text-spacing-val'),
  textLineHeight: $('text-lineheight'),
  textLineHeightVal: $('text-lineheight-val'),
  textRotation: $('text-rotation'),
  textRotationVal: $('text-rotation-val'),

  colorModeTabs: document.querySelectorAll('.mode-tab'),
  colorSections: document.querySelectorAll('.color-section'),
  colorSolid: $('color-solid'),
  perLetterList: $('per-letter-list'),
  btnPerLetterReset: $('btn-per-letter-reset'),
  gradientAngle: $('gradient-angle'),
  gradientAngleVal: $('gradient-angle-val'),
  gradientStops: $('gradient-stops'),
  btnAddStop: $('btn-add-stop'),
  rainbowAngle: $('rainbow-angle'),
  rainbowAngleVal: $('rainbow-angle-val'),

  strokeEnabled: $('stroke-enabled'),
  strokeColor: $('stroke-color'),
  strokeWidth: $('stroke-width'),
  strokeWidthVal: $('stroke-width-val'),
  shadowEnabled: $('shadow-enabled'),
  shadowColor: $('shadow-color'),
  shadowBlur: $('shadow-blur'),
  shadowBlurVal: $('shadow-blur-val'),
  shadowDx: $('shadow-dx'),
  shadowDxVal: $('shadow-dx-val'),
  shadowDy: $('shadow-dy'),
  shadowDyVal: $('shadow-dy-val'),
  curveEnabled: $('curve-enabled'),
  curveAmount: $('curve-amount'),
  curveAmountVal: $('curve-amount-val'),
  sparkleEnabled: $('sparkle-enabled'),
  sparkleDensity: $('sparkle-density'),
  sparkleDensityVal: $('sparkle-density-val'),
  sparkleSize: $('sparkle-size'),
  sparkleSizeVal: $('sparkle-size-val'),
  sparkleColor: $('sparkle-color'),

  mockupPreset: $('mockup-preset'),
  mockupBrand: $('mockup-brand'),
  mockupSize: $('mockup-size'),
  mockupGarment: $('mockup-garment'),
  mockupTint: $('mockup-tint'),
  mockupPhoto: $('mockup-photo'),
  calibrationHint: $('calibration-hint'),
  calibrationLabel: $('calibration-label'),
  btnResetPhoto: $('btn-reset-photo'),
  placementX: $('placement-x'),
  placementXVal: $('placement-x-val'),
  placementY: $('placement-y'),
  placementYVal: $('placement-y-val'),
  placementScale: $('placement-scale'),
  placementScaleVal: $('placement-scale-val'),

  edgeWarning: $('edge-warning'),
  canvasWrap: $('canvas-wrap'),
  preview: $('preview'),
  paperSize: $('paper-size'),
  orientationToggle: $('orientation-toggle'),
  fontDropZone: $('font-drop-zone'),
  customFontChips: $('custom-font-chips'),
  zoom: $('zoom'),
  zoomVal: $('zoom-val'),

  exportDialog: $('export-dialog'),
  exportFormat: $('export-format'),
  exportSize: $('export-size'),
  exportMirror: $('export-mirror'),
  btnExportCancel: $('btn-export-cancel'),
  btnExportDownload: $('btn-export-download'),

  libraryDialog: $('library-dialog'),
  btnNewDesign: $('btn-new-design'),
  btnExportLibrary: $('btn-export-library'),
  importLibrary: $('import-library'),
  libraryGrid: $('library-grid'),
  btnLibraryClose: $('btn-library-close'),

  calibrationDialog: $('calibration-dialog'),
  calDialogMeasure: $('cal-dialog-measure'),
  calDialogInches: $('cal-dialog-inches'),
  calImage: $('cal-image'),
  calCanvas: $('cal-canvas'),
  calStatus: $('cal-status'),
  btnCalReset: $('btn-cal-reset'),
  btnCalCancel: $('btn-cal-cancel'),
  btnCalOk: $('btn-cal-ok'),
};

function svgEl(tag, attrs = {}, children = []) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) n.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c == null) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}

function clearChildren(n) { while (n.firstChild) n.removeChild(n.firstChild); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function urlToDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const blob = await res.blob();
  return fileToDataUrl(blob);
}

// Cache calibrations per preset id in localStorage so the user only picks
// shoulders once per garment photo.
const CALIBRATION_CACHE_KEY = 'iron-on-calibrations';
function readCalibrationCache() {
  try { return JSON.parse(localStorage.getItem(CALIBRATION_CACHE_KEY)) || {}; }
  catch { return {}; }
}
function writeCalibrationCache(obj) {
  try { localStorage.setItem(CALIBRATION_CACHE_KEY, JSON.stringify(obj)); } catch {}
}
function cacheCalibration(presetId, cal) {
  if (!presetId) return;
  const c = readCalibrationCache();
  c[presetId] = cal;
  writeCalibrationCache(c);
}
function lookupCalibration(presetId) {
  if (!presetId) return null;
  return readCalibrationCache()[presetId] || null;
}

function getPaperDims() {
  const p = PAPER_SIZES[state.paperSize] || PAPER_SIZES.letter;
  // Landscape swaps width/height; square paper is unaffected.
  const landscape = state.orientation === 'landscape';
  const w = landscape ? p.heightIn : p.widthIn;
  const h = landscape ? p.widthIn  : p.heightIn;
  return {
    widthIn: w,
    heightIn: h,
    widthU: w * UNITS_PER_INCH,
    heightU: h * UNITS_PER_INCH,
  };
}

function applyZoom() {
  const scale = state.zoom / 100;
  const vb = els.preview.getAttribute('viewBox');
  if (!vb) return;
  const parts = vb.split(/\s+/).map(Number);
  const w = parts[2] || 1, h = parts[3] || 1;
  const inW = w / UNITS_PER_INCH;
  const inH = h / UNITS_PER_INCH;
  els.preview.setAttribute('width', inW * DISPLAY_PX_PER_IN * scale);
  els.preview.setAttribute('height', inH * DISPLAY_PX_PER_IN * scale);
}

function populateMockupDropdowns() {
  els.mockupPreset.innerHTML = '<option value="">— Choose a seeded garment —</option>';
  for (const p of SEEDED_PRESETS) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.label;
    els.mockupPreset.appendChild(o);
  }
  els.mockupBrand.innerHTML = '';
  for (const b of getBrands()) {
    const o = document.createElement('option');
    o.value = b.id;
    o.textContent = b.label;
    els.mockupBrand.appendChild(o);
  }
  els.mockupBrand.value = state.mockup.brand;
  refreshSizeOptions();
}

function refreshSizeOptions() {
  els.mockupSize.innerHTML = '';
  for (const s of getSizesForBrand(state.mockup.brand)) {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s;
    els.mockupSize.appendChild(o);
  }
  if (getSizesForBrand(state.mockup.brand).includes(state.mockup.size)) {
    els.mockupSize.value = state.mockup.size;
  } else {
    state.mockup.size = els.mockupSize.value;
  }
}

// ========== SECTION 2: RENDER PIPELINE ==========

function renderAll() {
  const preview = els.preview;
  clearChildren(preview);
  preview.classList.toggle('mockup-mode', state.view === 'mockup');

  if (state.view === 'design') {
    const paper = getPaperDims();
    preview.setAttribute('viewBox', `0 0 ${paper.widthU} ${paper.heightU}`);
    const defs = svgEl('defs');
    preview.appendChild(defs);

    // Paper background (white) so exports visually match preview.
    preview.appendChild(svgEl('rect', {
      x: 0, y: 0, width: paper.widthU, height: paper.heightU,
      fill: '#ffffff', 'data-paper': 'true',
    }));

    for (const layer of state.layers) {
      const isSelected = layer.id === state.selectedId;
      const g = renderTextLayer(layer, defs, paper, isSelected);
      preview.appendChild(g);
    }
  } else {
    renderMockupView();
  }

  applyZoom();
  // Defer edge warning so getBBox sees the laid-out text.
  requestAnimationFrame(() => updateEdgeWarning());
}

function renderTextLayer(layer, defs, paper, isSelected) {
  const cx = paper.widthU / 2 + layer.transform.x;
  const cy = paper.heightU / 2 + layer.transform.y;
  const g = svgEl('g', {
    'data-layer-id': layer.id,
    class: 'layer' + (isSelected ? ' selected' : ''),
    transform: `translate(${cx}, ${cy}) rotate(${layer.transform.rotation})`,
  });

  const shadowId = buildShadowFilter(defs, layer);
  const fillValue = buildLayerFill(defs, layer);
  const usePerLetter = layer.fill.mode === 'per-letter';

  const textAttrs = {
    'font-family': `"${layer.font.family}", sans-serif`,
    'font-size': layer.size,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    'letter-spacing': layer.letterSpacing,
    fill: fillValue,
  };
  if (layer.stroke.enabled && layer.stroke.width > 0) {
    textAttrs.stroke = layer.stroke.color;
    textAttrs['stroke-width'] = layer.stroke.width;
    textAttrs['stroke-linejoin'] = 'round';
    textAttrs['paint-order'] = 'stroke fill';
  }
  if (shadowId) textAttrs.filter = `url(#${shadowId})`;

  const text = svgEl('text', textAttrs);

  const content = layer.content || '';
  const lines = content.split('\n');
  const lineH = layer.size * layer.lineHeight;
  const firstOffset = -((lines.length - 1) * lineH) / 2;

  if (layer.curve.enabled && layer.curve.amount !== 0) {
    // Flatten to single line for curve.
    const flat = content.replace(/\n/g, ' ');
    const pathId = `curve-${layer.id}`;
    const estW = Math.max(40, estimateTextWidth({ ...layer, content: flat }) * 1.1);
    const sag = layer.curve.amount * 2.5;
    // Quadratic bezier from left to right, control point above/below.
    // With y-down SVG: positive sag dips text center downward (smile).
    const pathD = `M ${-estW / 2} 0 Q 0 ${sag * 2} ${estW / 2} 0`;
    defs.appendChild(svgEl('path', { id: pathId, d: pathD, fill: 'none' }));

    const tp = svgEl('textPath', { href: `#${pathId}`, 'startOffset': '50%' });
    if (usePerLetter) {
      let absIdx = 0;
      // Walk original content to preserve per-letter indexing across the flatten.
      for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (ch === '\n') { absIdx++; continue; }
        const color = layer.fill.letterColors[absIdx] || layer.fill.color;
        const tspan = svgEl('tspan', { fill: color, 'data-char-idx': absIdx });
        tspan.textContent = ch;
        tp.appendChild(tspan);
        absIdx++;
      }
    } else {
      tp.textContent = flat;
    }
    text.appendChild(tp);
  } else {
    let absIdx = 0;
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) absIdx++; // account for '\n'
      const y = firstOffset + lineIdx * lineH;
      if (usePerLetter && line.length > 0) {
        for (let j = 0; j < line.length; j++) {
          const ch = line[j];
          const color = layer.fill.letterColors[absIdx] || layer.fill.color;
          const tspan = svgEl('tspan', {
            fill: color,
            'data-char-idx': absIdx,
          });
          if (j === 0) {
            tspan.setAttribute('x', 0);
            tspan.setAttribute('y', y);
          }
          tspan.textContent = ch;
          text.appendChild(tspan);
          absIdx++;
        }
      } else {
        const tspan = svgEl('tspan', { x: 0, y });
        tspan.textContent = line.length ? line : ' ';
        text.appendChild(tspan);
        absIdx += line.length;
      }
    });
  }

  g.appendChild(text);

  if (layer.sparkle.enabled && layer.sparkle.density > 0) {
    g.appendChild(buildSparkles(layer));
  }

  if (isSelected) {
    // Dashed bbox drawn post-layout so it hugs the actual glyphs.
    // Defer to rAF so getBBox() works after insertion.
    requestAnimationFrame(() => {
      try {
        if (!text.isConnected) return;
        const bb = text.getBBox();
        const pad = 6;
        const outline = svgEl('rect', {
          x: bb.x - pad, y: bb.y - pad,
          width: bb.width + pad * 2, height: bb.height + pad * 2,
          fill: 'none', stroke: '#3b82f6', 'stroke-width': 2,
          'stroke-dasharray': '8 5', 'pointer-events': 'none',
          'data-selection-outline': 'true',
        });
        g.appendChild(outline);
      } catch {}
    });
  }

  return g;
}

function buildLayerFill(defs, layer) {
  const fill = layer.fill;
  if (fill.mode === 'solid' || fill.mode === 'per-letter') {
    return fill.color || DEFAULT_COLOR;
  }
  if (fill.mode === 'gradient') {
    const id = `grad-${layer.id}`;
    const rad = ((fill.gradient.angle || 0) - 90) * Math.PI / 180;
    const x2 = 0.5 + Math.cos(rad) * 0.5;
    const y2 = 0.5 + Math.sin(rad) * 0.5;
    const x1 = 1 - x2;
    const y1 = 1 - y2;
    const grad = svgEl('linearGradient', { id, x1, y1, x2, y2 });
    const stops = [...fill.gradient.stops].sort((a, b) => a.offset - b.offset);
    for (const s of stops) {
      grad.appendChild(svgEl('stop', { offset: s.offset, 'stop-color': s.color }));
    }
    defs.appendChild(grad);
    return `url(#${id})`;
  }
  if (fill.mode === 'rainbow') {
    const id = `rainbow-${layer.id}`;
    const rad = ((fill.rainbowAngle || 0) - 90) * Math.PI / 180;
    const x2 = 0.5 + Math.cos(rad) * 0.5;
    const y2 = 0.5 + Math.sin(rad) * 0.5;
    const x1 = 1 - x2;
    const y1 = 1 - y2;
    const grad = svgEl('linearGradient', { id, x1, y1, x2, y2 });
    for (const s of RAINBOW_STOPS) {
      grad.appendChild(svgEl('stop', { offset: s.offset, 'stop-color': s.color }));
    }
    defs.appendChild(grad);
    return `url(#${id})`;
  }
  return DEFAULT_COLOR;
}

function buildShadowFilter(defs, layer) {
  if (!layer.shadow.enabled) return null;
  const id = `shadow-${layer.id}`;
  const filter = svgEl('filter', {
    id, x: '-50%', y: '-50%', width: '200%', height: '200%',
  });
  filter.appendChild(svgEl('feGaussianBlur', {
    in: 'SourceAlpha', stdDeviation: layer.shadow.blur,
  }));
  filter.appendChild(svgEl('feOffset', {
    dx: layer.shadow.dx, dy: layer.shadow.dy, result: 'offsetblur',
  }));
  filter.appendChild(svgEl('feFlood', {
    'flood-color': layer.shadow.color, 'flood-opacity': 0.7, result: 'color',
  }));
  filter.appendChild(svgEl('feComposite', {
    in: 'color', in2: 'offsetblur', operator: 'in', result: 'shadow',
  }));
  const merge = svgEl('feMerge');
  merge.appendChild(svgEl('feMergeNode', { in: 'shadow' }));
  merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
  filter.appendChild(merge);
  defs.appendChild(filter);
  return id;
}

function buildSparkles(layer) {
  const g = svgEl('g', { 'data-sparkles': 'true' });
  const n = Math.round(layer.sparkle.density);
  const lines = (layer.content || '').split('\n');
  const estW = Math.max(60, estimateTextWidth(layer));
  const estH = Math.max(60, lines.length * layer.size * layer.lineHeight);
  const rng = seededRandom(layer.id + ':' + n + ':' + layer.sparkle.size);
  for (let i = 0; i < n; i++) {
    const x = (rng() - 0.5) * (estW + 120);
    const y = (rng() - 0.5) * (estH + 120);
    const s = layer.sparkle.size * (0.5 + rng() * 0.7);
    g.appendChild(svgEl('path', {
      d: starPath(x, y, s),
      fill: layer.sparkle.color,
    }));
  }
  return g;
}

function starPath(cx, cy, r) {
  const inner = r * 0.28;
  return [
    `M ${cx} ${cy - r}`,
    `L ${cx + inner} ${cy - inner}`,
    `L ${cx + r} ${cy}`,
    `L ${cx + inner} ${cy + inner}`,
    `L ${cx} ${cy + r}`,
    `L ${cx - inner} ${cy + inner}`,
    `L ${cx - r} ${cy}`,
    `L ${cx - inner} ${cy - inner}`,
    'Z',
  ].join(' ');
}

function seededRandom(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  let s = h >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function estimateTextWidth(layer) {
  const lines = (layer.content || '').split('\n');
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  return longest * layer.size * 0.55 + longest * (layer.letterSpacing || 0);
}

function computeTightBounds() {
  const groups = els.preview.querySelectorAll('[data-layer-id]');
  if (!groups.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of groups) {
    let bbox;
    try { bbox = g.getBBox(); } catch { continue; }
    if (!bbox || (bbox.width === 0 && bbox.height === 0)) continue;
    const ctm = g.getCTM();
    if (!ctm) continue;
    const pts = [
      { x: bbox.x, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y },
      { x: bbox.x, y: bbox.y + bbox.height },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
    ];
    for (const p of pts) {
      const tx = ctm.a * p.x + ctm.c * p.y + ctm.e;
      const ty = ctm.b * p.x + ctm.d * p.y + ctm.f;
      if (tx < minX) minX = tx;
      if (ty < minY) minY = ty;
      if (tx > maxX) maxX = tx;
      if (ty > maxY) maxY = ty;
    }
  }
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function updateEdgeWarning() {
  if (state.view !== 'design') { els.edgeWarning.hidden = true; return; }
  const paper = getPaperDims();
  const bounds = computeTightBounds();
  if (!bounds) { els.edgeWarning.hidden = true; return; }
  const margin = 0.25 * UNITS_PER_INCH;
  const tooClose =
    bounds.x < margin ||
    bounds.y < margin ||
    bounds.x + bounds.width > paper.widthU - margin ||
    bounds.y + bounds.height > paper.heightU - margin;
  els.edgeWarning.hidden = !tooClose;
}

// ========== SECTION 3: PANEL SYNC (text / color / effects) ==========

function syncPanelToLayer() {
  const layer = getSelected();
  if (!layer) return;

  // Text panel
  els.textContent.value = layer.content;
  if (layer.font && layer.font.family && fontPicker) {
    fontPicker.setFamily(layer.font.family);
  }
  els.textSize.value = layer.size;
  els.textSizeVal.textContent = layer.size;
  els.textSpacing.value = layer.letterSpacing;
  els.textSpacingVal.textContent = layer.letterSpacing;
  els.textLineHeight.value = layer.lineHeight;
  els.textLineHeightVal.textContent = layer.lineHeight;
  els.textRotation.value = layer.transform.rotation;
  els.textRotationVal.textContent = layer.transform.rotation;

  // Color panel
  els.colorSolid.value = layer.fill.color || DEFAULT_COLOR;
  els.gradientAngle.value = layer.fill.gradient.angle;
  els.gradientAngleVal.textContent = layer.fill.gradient.angle;
  els.rainbowAngle.value = layer.fill.rainbowAngle;
  els.rainbowAngleVal.textContent = layer.fill.rainbowAngle;
  setColorMode(layer.fill.mode);
  buildPerLetterUI();
  buildGradientUI();

  // Effects panel
  els.strokeEnabled.checked = layer.stroke.enabled;
  els.strokeColor.value = layer.stroke.color;
  els.strokeWidth.value = layer.stroke.width;
  els.strokeWidthVal.textContent = layer.stroke.width;

  els.shadowEnabled.checked = layer.shadow.enabled;
  els.shadowColor.value = layer.shadow.color;
  els.shadowBlur.value = layer.shadow.blur;
  els.shadowBlurVal.textContent = layer.shadow.blur;
  els.shadowDx.value = layer.shadow.dx;
  els.shadowDxVal.textContent = layer.shadow.dx;
  els.shadowDy.value = layer.shadow.dy;
  els.shadowDyVal.textContent = layer.shadow.dy;

  els.curveEnabled.checked = layer.curve.enabled;
  els.curveAmount.value = layer.curve.amount;
  els.curveAmountVal.textContent = layer.curve.amount;

  els.sparkleEnabled.checked = layer.sparkle.enabled;
  els.sparkleDensity.value = layer.sparkle.density;
  els.sparkleDensityVal.textContent = layer.sparkle.density;
  els.sparkleSize.value = layer.sparkle.size;
  els.sparkleSizeVal.textContent = layer.sparkle.size;
  els.sparkleColor.value = layer.sparkle.color;
}

function setColorMode(mode) {
  els.colorModeTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  els.colorSections.forEach(sec => sec.classList.toggle('hidden', sec.dataset.for !== mode));
}

function buildPerLetterUI() {
  const layer = getSelected();
  if (!layer) return;
  const list = els.perLetterList;
  list.innerHTML = '';
  const content = layer.content || '';
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '\n') {
      const br = document.createElement('div');
      br.className = 'per-letter-break';
      br.textContent = '↵';
      list.appendChild(br);
      continue;
    }
    if (ch === ' ') {
      const spacer = document.createElement('div');
      spacer.className = 'per-letter-spacer';
      spacer.textContent = '␣';
      list.appendChild(spacer);
      continue;
    }
    const color = layer.fill.letterColors[i] || layer.fill.color || DEFAULT_COLOR;
    const wrap = document.createElement('label');
    wrap.className = 'per-letter';
    wrap.title = `Letter ${i + 1}: ${ch}`;

    const letter = document.createElement('span');
    letter.className = 'per-letter-glyph';
    letter.textContent = ch;
    letter.style.color = color;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = color;
    input.addEventListener('input', () => {
      const cur = getSelected();
      if (!cur) return;
      cur.fill.letterColors[i] = input.value;
      letter.style.color = input.value;
      markDirty();
      renderAll();
    });

    wrap.appendChild(letter);
    wrap.appendChild(input);
    list.appendChild(wrap);
  }
}

function buildGradientUI() {
  const layer = getSelected();
  if (!layer) return;
  const box = els.gradientStops;
  box.innerHTML = '';
  layer.fill.gradient.stops.forEach((stop, idx) => {
    const row = document.createElement('div');
    row.className = 'gradient-stop-row';

    const offset = document.createElement('input');
    offset.type = 'range';
    offset.min = '0';
    offset.max = '1';
    offset.step = '0.01';
    offset.value = String(stop.offset);
    offset.className = 'gradient-stop-offset';

    const color = document.createElement('input');
    color.type = 'color';
    color.value = stop.color;
    color.className = 'gradient-stop-color';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-icon';
    remove.textContent = '×';
    remove.title = 'Remove stop';

    offset.addEventListener('input', () => {
      const cur = getSelected();
      if (!cur) return;
      cur.fill.gradient.stops[idx].offset = Number(offset.value);
      markDirty();
      renderAll();
    });
    color.addEventListener('input', () => {
      const cur = getSelected();
      if (!cur) return;
      cur.fill.gradient.stops[idx].color = color.value;
      markDirty();
      renderAll();
    });
    remove.addEventListener('click', () => {
      const cur = getSelected();
      if (!cur) return;
      if (cur.fill.gradient.stops.length <= 2) return;
      cur.fill.gradient.stops.splice(idx, 1);
      buildGradientUI();
      markDirty();
      renderAll();
    });

    row.appendChild(offset);
    row.appendChild(color);
    row.appendChild(remove);
    box.appendChild(row);
  });
}

// ========== SECTION 4: LAYERS PANEL + LAYER OPS ==========

function renderLayersPanel() {
  const list = els.layerList;
  list.innerHTML = '';
  state.layers.forEach((layer, idx) => {
    const li = document.createElement('li');
    li.className = 'layer-item' + (layer.id === state.selectedId ? ' selected' : '');
    li.draggable = true;
    li.dataset.layerId = layer.id;
    li.dataset.idx = String(idx);

    const name = document.createElement('span');
    name.className = 'layer-name';
    const first = (layer.content || '').split('\n')[0] || '(empty)';
    name.textContent = first.length > 18 ? first.slice(0, 17) + '…' : first;

    const btnDup = document.createElement('button');
    btnDup.type = 'button';
    btnDup.className = 'btn btn-icon';
    btnDup.textContent = '⎘';
    btnDup.title = 'Duplicate layer';

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn btn-icon';
    btnDel.textContent = '🗑';
    btnDel.title = 'Delete layer';
    if (state.layers.length <= 1) btnDel.disabled = true;

    li.appendChild(name);
    li.appendChild(btnDup);
    li.appendChild(btnDel);

    li.addEventListener('click', (ev) => {
      if (ev.target === btnDup || ev.target === btnDel) return;
      selectLayer(layer.id);
    });
    btnDup.addEventListener('click', (ev) => {
      ev.stopPropagation();
      duplicateLayerById(layer.id);
    });
    btnDel.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteLayer(layer.id);
    });

    li.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', String(idx));
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (ev) => {
      ev.preventDefault();
      li.classList.remove('drag-over');
      const fromIdx = Number(ev.dataTransfer.getData('text/plain'));
      if (!Number.isFinite(fromIdx)) return;
      moveLayer(fromIdx, idx);
    });

    list.appendChild(li);
  });
}

function addTextLayer() {
  const layer = makeTextLayer({ content: 'New text' });
  state.layers.push(layer);
  state.selectedId = layer.id;
  markDirty();
  renderLayersPanel();
  syncPanelToLayer();
  renderAll();
}

function deleteLayer(id) {
  if (state.layers.length <= 1) return;
  const idx = state.layers.findIndex(l => l.id === id);
  if (idx < 0) return;
  state.layers.splice(idx, 1);
  if (state.selectedId === id) {
    state.selectedId = state.layers[Math.min(idx, state.layers.length - 1)].id;
  }
  markDirty();
  renderLayersPanel();
  syncPanelToLayer();
  renderAll();
}

function duplicateLayerById(id) {
  const idx = state.layers.findIndex(l => l.id === id);
  if (idx < 0) return;
  const copy = JSON.parse(JSON.stringify(state.layers[idx]));
  copy.id = newId();
  copy.transform = {
    ...copy.transform,
    x: copy.transform.x + 30,
    y: copy.transform.y + 30,
  };
  state.layers.splice(idx + 1, 0, copy);
  state.selectedId = copy.id;
  markDirty();
  renderLayersPanel();
  syncPanelToLayer();
  renderAll();
}

function moveLayer(fromIdx, toIdx) {
  if (fromIdx === toIdx) return;
  if (fromIdx < 0 || fromIdx >= state.layers.length) return;
  if (toIdx < 0 || toIdx >= state.layers.length) return;
  const [item] = state.layers.splice(fromIdx, 1);
  state.layers.splice(toIdx, 0, item);
  markDirty();
  renderLayersPanel();
  renderAll();
}

// ========== SECTION 5: LIBRARY DIALOG + PERSISTENCE ==========

function openLibrary() {
  renderLibraryList();
  els.libraryDialog.showModal();
}

function closeLibrary() {
  els.libraryDialog.close();
}

function renderLibraryList() {
  const designs = listDesigns();
  const grid = els.libraryGrid;
  grid.innerHTML = '';
  if (!designs.length) {
    const empty = document.createElement('div');
    empty.className = 'library-empty';
    empty.textContent = 'No saved designs yet. Click Save in the top bar to store your current design.';
    grid.appendChild(empty);
    return;
  }
  for (const meta of designs) {
    const card = document.createElement('div');
    card.className = 'library-card';

    const thumb = document.createElement('div');
    thumb.className = 'library-thumb';
    thumb.innerHTML = meta.thumbnail || '';

    const name = document.createElement('div');
    name.className = 'library-card-name';
    name.textContent = meta.name || 'Untitled';

    const date = document.createElement('div');
    date.className = 'library-card-date';
    date.textContent = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : '';

    const actions = document.createElement('div');
    actions.className = 'library-card-actions';

    const btnOpen = document.createElement('button');
    btnOpen.type = 'button';
    btnOpen.className = 'btn btn-primary';
    btnOpen.textContent = 'Open';
    btnOpen.addEventListener('click', async () => {
      const design = loadDesign(meta.id);
      if (!design) return;
      await applyDesignData(design);
      closeLibrary();
    });

    const btnDup = document.createElement('button');
    btnDup.type = 'button';
    btnDup.className = 'btn';
    btnDup.textContent = 'Copy';
    btnDup.addEventListener('click', () => {
      duplicateDesign(meta.id);
      renderLibraryList();
    });

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn';
    btnDel.textContent = 'Delete';
    btnDel.addEventListener('click', () => {
      if (!confirm(`Delete "${meta.name || 'Untitled'}"?`)) return;
      deleteDesign(meta.id);
      renderLibraryList();
    });

    actions.append(btnOpen, btnDup, btnDel);
    card.append(thumb, name, date, actions);
    grid.appendChild(card);
  }
}

function serializeState() {
  return {
    name: state.name,
    layers: JSON.parse(JSON.stringify(state.layers)),
    selectedId: state.selectedId,
    paperSize: state.paperSize,
    orientation: state.orientation,
    mockup: JSON.parse(JSON.stringify(state.mockup)),
    export: JSON.parse(JSON.stringify(state.export)),
    customFonts: { ...state.customFonts },
  };
}

async function applyDesignData(record) {
  if (!record) return;
  state.designId = record.id || null;
  const s = record.state || {};
  state.name = s.name || 'Untitled design';
  state.layers = (s.layers && s.layers.length) ? s.layers : [makeTextLayer()];
  state.selectedId = s.selectedId && state.layers.some(l => l.id === s.selectedId)
    ? s.selectedId
    : state.layers[0].id;
  state.paperSize = s.paperSize || 'letter';
  state.orientation = s.orientation === 'landscape' ? 'landscape' : 'portrait';
  if (s.mockup) state.mockup = { ...state.mockup, ...s.mockup };
  if (s.export) state.export = { ...state.export, ...s.export };
  state.customFonts = s.customFonts || {};

  // Rehydrate custom fonts so the <select> shows them and the renderer can use them.
  const fontJobs = [];
  for (const [family, dataUrl] of Object.entries(state.customFonts)) {
    fontJobs.push(reHydrateCustomFont(family, dataUrl).catch(() => {}));
  }
  await Promise.all(fontJobs);

  if (fontPicker) fontPicker.setFamily(state.layers[0]?.font?.family || DEFAULT_FONT);
  if (fontPicker) fontPicker.refresh();
  renderCustomFontChips();
  els.designName.value = state.name;
  els.paperSize.value = state.paperSize;
  syncOrientationToggle();

  // Mockup dropdown reflect
  if (els.mockupBrand) els.mockupBrand.value = state.mockup.brand;
  refreshSizeOptions();
  if (els.mockupGarment) els.mockupGarment.value = state.mockup.garment;
  if (els.mockupTint) els.mockupTint.value = state.mockup.tint;
  if (state.mockup.photoDataUrl) {
    els.calibrationHint.classList.remove('hidden');
    els.btnResetPhoto.classList.remove('hidden');
  } else {
    els.calibrationHint.classList.add('hidden');
    els.btnResetPhoto.classList.add('hidden');
  }

  renderLayersPanel();
  syncPanelToLayer();
  renderAll();
  markClean();
}

function makeThumbnail() {
  const paper = getPaperDims();
  // Build a slim SVG from current layers (no selection outline, no paper fill).
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', `0 0 ${paper.widthU} ${paper.heightU}`);
  svg.setAttribute('width', '160');
  svg.setAttribute('height', '160');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const defs = svgEl('defs');
  svg.appendChild(defs);
  svg.appendChild(svgEl('rect', {
    x: 0, y: 0, width: paper.widthU, height: paper.heightU, fill: '#ffffff',
  }));
  for (const layer of state.layers) {
    svg.appendChild(renderTextLayer(layer, defs, paper, false));
  }
  return new XMLSerializer().serializeToString(svg);
}

function saveCurrentDesign() {
  const record = saveDesign({
    id: state.designId || undefined,
    name: state.name || 'Untitled',
    state: serializeState(),
    thumbnail: makeThumbnail(),
  });
  state.designId = record.id;
  markClean();
}

function newBlankDesign() {
  state.designId = null;
  state.name = 'Untitled design';
  state.layers = [makeTextLayer()];
  state.selectedId = state.layers[0].id;
  state.paperSize = 'letter';
  state.orientation = 'portrait';
  state.mockup.photoDataUrl = null;
  state.mockup.calibration = null;
  els.designName.value = state.name;
  els.paperSize.value = state.paperSize;
  syncOrientationToggle();
  els.calibrationHint.classList.add('hidden');
  els.btnResetPhoto.classList.add('hidden');
  renderLayersPanel();
  syncPanelToLayer();
  renderAll();
  markClean();
}

// ========== SECTION 6: EXPORT (PNG @ 300 DPI, SVG) ==========

function openExport() {
  els.exportFormat.value = state.export.format;
  els.exportSize.value = state.export.size;
  els.exportMirror.checked = state.export.mirror;
  els.exportDialog.showModal();
}

async function doExport() {
  state.export.format = els.exportFormat.value;
  state.export.size = els.exportSize.value;
  state.export.mirror = els.exportMirror.checked;

  const tight = state.export.size === 'tight';
  const svgData = buildExportSvg({ mirror: state.export.mirror, tight });
  const safeName = (state.name || 'iron-on')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'iron-on';

  if (state.export.format === 'svg') {
    exportSvgFile(svgData.svg, `${safeName}.svg`);
  } else {
    await exportPng(svgData, `${safeName}.png`);
  }
  els.exportDialog.close();
}

function buildExportSvg({ mirror, tight }) {
  const paper = getPaperDims();
  let vbX = 0, vbY = 0, vbW = paper.widthU, vbH = paper.heightU;

  if (tight) {
    const bounds = computeTightBounds();
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      const pad = 0.1 * UNITS_PER_INCH;
      vbX = bounds.x - pad;
      vbY = bounds.y - pad;
      vbW = bounds.width + pad * 2;
      vbH = bounds.height + pad * 2;
    }
  }

  const widthIn = vbW / UNITS_PER_INCH;
  const heightIn = vbH / UNITS_PER_INCH;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  svg.setAttribute('width', `${widthIn}in`);
  svg.setAttribute('height', `${heightIn}in`);

  const defs = svgEl('defs');

  // Embed uploaded fonts via data-URL @font-face so PNG rasterization picks them up.
  if (Object.keys(state.customFonts).length) {
    const style = svgEl('style');
    let css = '';
    for (const [fam, dataUrl] of Object.entries(state.customFonts)) {
      css += `@font-face { font-family: "${fam}"; src: url("${dataUrl}"); }\n`;
    }
    style.textContent = css;
    defs.appendChild(style);
  }
  svg.appendChild(defs);

  const wrap = svgEl('g');
  if (mirror) {
    // Reflect about the viewBox's horizontal center.
    wrap.setAttribute('transform', `translate(${2 * vbX + vbW}, 0) scale(-1, 1)`);
  }
  for (const layer of state.layers) {
    wrap.appendChild(renderTextLayer(layer, defs, paper, false));
  }
  svg.appendChild(wrap);

  return {
    svg: new XMLSerializer().serializeToString(svg),
    widthIn,
    heightIn,
  };
}

async function exportPng({ svg, widthIn, heightIn }, filename) {
  const DPI = 300;
  const pxW = Math.max(1, Math.round(widthIn * DPI));
  const pxH = Math.max(1, Math.round(heightIn * DPI));
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to rasterize SVG'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext('2d');
    // Transparent background (needed for iron-on — only text ink is printed).
    ctx.clearRect(0, 0, pxW, pxH);
    ctx.drawImage(img, 0, 0, pxW, pxH);
    const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (!pngBlob) throw new Error('PNG encoding failed');
    downloadBlob(pngBlob, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function exportSvgFile(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ========== SECTION 7: CANVAS DRAG (mouse + touch) ==========

function initCanvasDrag() {
  const svg = els.preview;
  let drag = null; // { id, startClientX, startClientY, origX, origY, scale }

  function clientToUnitScale() {
    const rect = svg.getBoundingClientRect();
    const vb = svg.getAttribute('viewBox');
    if (!vb || rect.width === 0) return 1;
    const parts = vb.split(/\s+/).map(Number);
    const vbW = parts[2] || 1;
    return vbW / rect.width;
  }

  function findLayerId(target) {
    let el = target;
    while (el && el !== svg) {
      if (el.getAttribute && el.getAttribute('data-layer-id')) {
        return el.getAttribute('data-layer-id');
      }
      el = el.parentNode;
    }
    return null;
  }

  function start(clientX, clientY, target) {
    if (state.view !== 'design') return;
    const id = findLayerId(target);
    if (!id) return;
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    if (state.selectedId !== id) {
      state.selectedId = id;
      syncPanelToLayer();
      renderLayersPanel();
    }
    drag = {
      id,
      startClientX: clientX,
      startClientY: clientY,
      origX: layer.transform.x,
      origY: layer.transform.y,
      scale: clientToUnitScale(),
    };
    renderAll();
  }

  function move(clientX, clientY) {
    if (!drag) return;
    const layer = state.layers.find(l => l.id === drag.id);
    if (!layer) return;
    const dx = (clientX - drag.startClientX) * drag.scale;
    const dy = (clientY - drag.startClientY) * drag.scale;
    layer.transform.x = drag.origX + dx;
    layer.transform.y = drag.origY + dy;
    markDirty();
    renderAll();
  }

  function end() {
    drag = null;
  }

  svg.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    start(e.clientX, e.clientY, e.target);
  });
  window.addEventListener('mousemove', (e) => {
    if (drag) {
      e.preventDefault();
      move(e.clientX, e.clientY);
    }
  });
  window.addEventListener('mouseup', end);

  svg.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    start(t.clientX, t.clientY, e.target);
  }, { passive: true });
  svg.addEventListener('touchmove', (e) => {
    if (!drag || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    move(t.clientX, t.clientY);
  }, { passive: false });
  window.addEventListener('touchend', end);
  window.addEventListener('touchcancel', end);
}

// ========== SECTION 8: MOCKUP VIEW + CALIBRATION ==========

let _calibrationHandle = null;

function buildDesignInnerSvg(dims) {
  // Render current layers into a standalone SVG scaled to the garment's print area.
  const u = UNITS_PER_INCH;
  const areaW = dims.printAreaWidthIn * u;
  const areaH = dims.printAreaHeightIn * u;
  const paper = {
    widthIn: dims.printAreaWidthIn,
    heightIn: dims.printAreaHeightIn,
    widthU: areaW,
    heightU: areaH,
  };
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', `0 0 ${areaW} ${areaH}`);
  svg.setAttribute('width', areaW);
  svg.setAttribute('height', areaH);
  // Text wider than the print area should still render in the mockup (with the
  // dashed print-area boundary visible around it) rather than get clipped by
  // the nested SVG's viewport.
  svg.setAttribute('overflow', 'visible');
  svg.style.overflow = 'visible';
  const defs = svgEl('defs');
  svg.appendChild(defs);
  for (const layer of state.layers) {
    svg.appendChild(renderTextLayer(layer, defs, paper, false));
  }
  return new XMLSerializer().serializeToString(svg);
}

function renderMockupView() {
  const preview = els.preview;
  const dims = getDimensions(state.mockup.brand, state.mockup.size);
  if (!dims) {
    preview.setAttribute('viewBox', '0 0 800 1000');
    const msg = svgEl('text', {
      x: 400, y: 500, 'text-anchor': 'middle', fill: '#999', 'font-size': 32,
    });
    msg.textContent = 'Pick a brand + size to preview on a garment';
    preview.appendChild(msg);
    return;
  }

  const designSvg = buildDesignInnerSvg(dims);
  const garmentSvg = renderGarmentSvg({
    type: state.mockup.garment,
    dims,
    tint: state.mockup.tint,
    designSvg,
    placement: state.mockup.placement,
    photoDataUrl: state.mockup.photoDataUrl,
    calibration: state.mockup.calibration,
  });

  const doc = new DOMParser().parseFromString(garmentSvg, 'image/svg+xml');
  const root = doc.documentElement;
  preview.setAttribute('viewBox', root.getAttribute('viewBox') || '0 0 800 1000');
  // Move children — importing handles namespaces correctly.
  for (const child of Array.from(root.childNodes)) {
    preview.appendChild(document.importNode(child, true));
  }
}

function initMockupPanel() {
  els.mockupPreset.addEventListener('change', async () => {
    const p = SEEDED_PRESETS.find(pp => pp.id === els.mockupPreset.value);
    if (!p) return;
    state.mockup.preset = p.id;
    state.mockup.brand = p.brand;
    state.mockup.size = p.size;
    state.mockup.garment = p.garment;
    state.mockup.tint = p.tint;
    els.mockupBrand.value = p.brand;
    refreshSizeOptions();
    els.mockupSize.value = p.size;
    els.mockupGarment.value = p.garment;
    els.mockupTint.value = p.tint;

    // Load the bundled garment photo, apply cached calibration if present,
    // else open the calibration dialog so the user clicks shoulders once.
    if (p.image) {
      try {
        const dataUrl = await urlToDataUrl(p.image);
        state.mockup.photoDataUrl = dataUrl;
        els.btnResetPhoto.classList.remove('hidden');
        const cached = lookupCalibration(p.id);
        if (cached) {
          state.mockup.calibration = cached;
          els.calibrationHint.classList.add('hidden');
          markDirty();
          renderAll();
        } else {
          state.mockup.calibration = null;
          els.calibrationHint.classList.remove('hidden');
          markDirty();
          renderAll();
          openCalibrationDialog();
        }
      } catch (err) {
        console.error('Failed to load garment photo', err);
        alert(`Could not load photo for "${p.label}": ${err && err.message ? err.message : err}`);
        markDirty();
        renderAll();
      }
    } else {
      markDirty();
      renderAll();
    }
  });

  els.mockupBrand.addEventListener('change', () => {
    state.mockup.brand = els.mockupBrand.value;
    refreshSizeOptions();
    state.mockup.size = els.mockupSize.value;
    markDirty();
    renderAll();
  });
  els.mockupSize.addEventListener('change', () => {
    state.mockup.size = els.mockupSize.value;
    markDirty();
    renderAll();
  });
  els.mockupGarment.addEventListener('change', () => {
    state.mockup.garment = els.mockupGarment.value;
    markDirty();
    renderAll();
  });
  els.mockupTint.addEventListener('input', () => {
    state.mockup.tint = els.mockupTint.value;
    markDirty();
    renderAll();
  });

  els.mockupPhoto.addEventListener('change', async () => {
    const file = els.mockupPhoto.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    state.mockup.photoDataUrl = dataUrl;
    state.mockup.calibration = null;
    els.calibrationHint.classList.remove('hidden');
    els.btnResetPhoto.classList.remove('hidden');
    markDirty();
    renderAll();
    openCalibrationDialog();
  });

  els.btnResetPhoto.addEventListener('click', () => {
    state.mockup.photoDataUrl = null;
    state.mockup.calibration = null;
    els.mockupPhoto.value = '';
    els.calibrationHint.classList.add('hidden');
    els.btnResetPhoto.classList.add('hidden');
    markDirty();
    renderAll();
  });

  els.placementX.addEventListener('input', () => {
    // Slider value is in 100ths of an inch for fine control.
    const raw = Number(els.placementX.value);
    state.mockup.placement.xIn = raw / 100;
    els.placementXVal.textContent = raw;
    markDirty();
    renderAll();
  });
  els.placementY.addEventListener('input', () => {
    const raw = Number(els.placementY.value);
    state.mockup.placement.yIn = raw / 100;
    els.placementYVal.textContent = raw;
    markDirty();
    renderAll();
  });
  els.placementScale.addEventListener('input', () => {
    const v = Number(els.placementScale.value);
    state.mockup.placement.scale = v;
    els.placementScaleVal.textContent = v;
    markDirty();
    renderAll();
  });
}

async function openCalibrationDialog() {
  if (!state.mockup.photoDataUrl) return;
  const dlg = els.calibrationDialog;
  const img = els.calImage;
  const canvas = els.calCanvas;
  const dims = getDimensions(state.mockup.brand, state.mockup.size);
  const refInches = dims ? dims.shoulderWidthIn : 10;
  els.calDialogMeasure.textContent = 'shoulder-to-shoulder';
  els.calDialogInches.textContent = `${refInches}"`;

  img.src = state.mockup.photoDataUrl;
  if (!img.complete) {
    await new Promise(res => {
      img.onload = res;
      img.onerror = res;
    });
  }

  // Open first so the image element has a rendered size.
  dlg.showModal();
  // Re-bind on every open; clean up the previous handle if any.
  if (_calibrationHandle) { _calibrationHandle.destroy(); _calibrationHandle = null; }
  await new Promise(r => requestAnimationFrame(r));

  const handle = startCalibration({
    imageEl: img,
    canvasEl: canvas,
    onComplete: (points) => {
      if (points.length === 2) {
        els.calStatus.textContent = 'Two points set. Click OK to apply, or reset and try again.';
        els.btnCalOk.disabled = false;
      } else {
        els.calStatus.textContent = 'Click the second point.';
        els.btnCalOk.disabled = true;
      }
    },
  });
  _calibrationHandle = handle;
  els.calStatus.textContent = 'Click the first point.';
  els.btnCalOk.disabled = true;

  els.btnCalReset.onclick = () => {
    handle.reset();
    els.btnCalOk.disabled = true;
    els.calStatus.textContent = 'Click the first point.';
  };
  els.btnCalCancel.onclick = () => {
    handle.destroy();
    _calibrationHandle = null;
    dlg.close();
  };
  els.btnCalOk.onclick = () => {
    const points = handle.getPoints();
    const calibration = buildCalibration({ points, refInches, imageEl: img });
    if (calibration) {
      state.mockup.calibration = calibration;
      // Remember this calibration for the preset, so the next time the user
      // picks the same garment from the dropdown we skip the dialog.
      if (state.mockup.preset) cacheCalibration(state.mockup.preset, calibration);
      els.calibrationHint.classList.add('hidden');
      markDirty();
      renderAll();
    }
    handle.destroy();
    _calibrationHandle = null;
    dlg.close();
  };
}

// ========== EDGE WARNING + KEYBOARD (Section 9) ==========

function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) {
      return;
    }

    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentDesign();
      return;
    }
    if (mod && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      const cur = getSelected();
      if (cur) duplicateLayerById(cur.id);
      return;
    }

    const layer = getSelected();
    if (!layer) return;
    const step = e.shiftKey ? 20 : 2;
    let moved = false;
    if (e.key === 'ArrowLeft')  { layer.transform.x -= step; moved = true; }
    else if (e.key === 'ArrowRight') { layer.transform.x += step; moved = true; }
    else if (e.key === 'ArrowUp')    { layer.transform.y -= step; moved = true; }
    else if (e.key === 'ArrowDown')  { layer.transform.y += step; moved = true; }
    if (moved) {
      e.preventDefault();
      markDirty();
      renderAll();
    }
  });
}

// ========== SECTION 10: WIRE PANELS ==========

function wirePanelTabs() {
  els.panelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.panel;
      els.panelBtns.forEach(b => b.classList.toggle('active', b === btn));
      els.panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
    });
  });
}

function wireViewToggle() {
  els.tabDesign.addEventListener('click', () => {
    state.view = 'design';
    els.tabDesign.classList.add('active');
    els.tabMockup.classList.remove('active');
    renderAll();
  });
  els.tabMockup.addEventListener('click', () => {
    state.view = 'mockup';
    els.tabMockup.classList.add('active');
    els.tabDesign.classList.remove('active');
    renderAll();
  });
}

function wireDesignName() {
  els.designName.addEventListener('input', () => {
    state.name = els.designName.value;
    markDirty();
  });
}

function wireTextPanel() {
  els.textContent.addEventListener('input', () => {
    const l = getSelected();
    if (!l) return;
    l.content = els.textContent.value;
    buildPerLetterUI();
    renderLayersPanel();
    if (fontPicker) fontPicker.refreshSample();
    markDirty();
    renderAll();
  });

  // Font-picker selection callback is wired in initFontPicker().

  els.textFontUpload.addEventListener('change', async () => {
    const file = els.textFontUpload.files?.[0];
    if (!file) return;
    try {
      const family = await registerCustomFont(file);
      const rec = listCustomFonts().find(r => r.family === family);
      if (rec) state.customFonts[family] = rec.dataUrl;
      if (fontPicker) { fontPicker.setFamily(family); fontPicker.refresh(); }
      renderCustomFontChips();
      const l = getSelected();
      if (l) {
        l.font = { family, source: 'uploaded' };
        markDirty();
        renderAll();
      }
    } catch (err) {
      alert(`Could not load font: ${err && err.message ? err.message : err}`);
    }
    els.textFontUpload.value = '';
  });

  const rangeBind = (el, valEl, apply) => {
    el.addEventListener('input', () => {
      const l = getSelected();
      if (!l) return;
      const v = Number(el.value);
      valEl.textContent = v;
      apply(l, v);
      markDirty();
      renderAll();
    });
  };
  rangeBind(els.textSize, els.textSizeVal, (l, v) => { l.size = v; });
  rangeBind(els.textSpacing, els.textSpacingVal, (l, v) => { l.letterSpacing = v; });
  rangeBind(els.textLineHeight, els.textLineHeightVal, (l, v) => { l.lineHeight = v; });
  rangeBind(els.textRotation, els.textRotationVal, (l, v) => { l.transform.rotation = v; });
}

function wireColorPanel() {
  els.colorModeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const l = getSelected();
      if (!l) return;
      l.fill.mode = mode;
      setColorMode(mode);
      if (mode === 'per-letter') buildPerLetterUI();
      if (mode === 'gradient') buildGradientUI();
      markDirty();
      renderAll();
    });
  });

  els.colorSolid.addEventListener('input', () => {
    const l = getSelected();
    if (!l) return;
    l.fill.color = els.colorSolid.value;
    markDirty();
    renderAll();
  });

  els.btnPerLetterReset.addEventListener('click', () => {
    const l = getSelected();
    if (!l) return;
    l.fill.letterColors = {};
    buildPerLetterUI();
    markDirty();
    renderAll();
  });

  els.gradientAngle.addEventListener('input', () => {
    const v = Number(els.gradientAngle.value);
    els.gradientAngleVal.textContent = v;
    const l = getSelected();
    if (!l) return;
    l.fill.gradient.angle = v;
    markDirty();
    renderAll();
  });
  els.btnAddStop.addEventListener('click', () => {
    const l = getSelected();
    if (!l) return;
    l.fill.gradient.stops.push({ offset: 0.5, color: '#ffffff' });
    buildGradientUI();
    markDirty();
    renderAll();
  });

  els.rainbowAngle.addEventListener('input', () => {
    const v = Number(els.rainbowAngle.value);
    els.rainbowAngleVal.textContent = v;
    const l = getSelected();
    if (!l) return;
    l.fill.rainbowAngle = v;
    markDirty();
    renderAll();
  });
}

function wireEffectsPanel() {
  const bindCheck = (el, apply) => {
    el.addEventListener('change', () => {
      const l = getSelected();
      if (!l) return;
      apply(l, el.checked);
      markDirty();
      renderAll();
    });
  };
  const bindColor = (el, apply) => {
    el.addEventListener('input', () => {
      const l = getSelected();
      if (!l) return;
      apply(l, el.value);
      markDirty();
      renderAll();
    });
  };
  const bindRange = (el, valEl, apply) => {
    el.addEventListener('input', () => {
      const l = getSelected();
      if (!l) return;
      const v = Number(el.value);
      valEl.textContent = v;
      apply(l, v);
      markDirty();
      renderAll();
    });
  };

  bindCheck(els.strokeEnabled, (l, v) => { l.stroke.enabled = v; });
  bindColor(els.strokeColor, (l, v) => { l.stroke.color = v; });
  bindRange(els.strokeWidth, els.strokeWidthVal, (l, v) => { l.stroke.width = v; });

  bindCheck(els.shadowEnabled, (l, v) => { l.shadow.enabled = v; });
  bindColor(els.shadowColor, (l, v) => { l.shadow.color = v; });
  bindRange(els.shadowBlur, els.shadowBlurVal, (l, v) => { l.shadow.blur = v; });
  bindRange(els.shadowDx, els.shadowDxVal, (l, v) => { l.shadow.dx = v; });
  bindRange(els.shadowDy, els.shadowDyVal, (l, v) => { l.shadow.dy = v; });

  bindCheck(els.curveEnabled, (l, v) => { l.curve.enabled = v; });
  bindRange(els.curveAmount, els.curveAmountVal, (l, v) => { l.curve.amount = v; });

  bindCheck(els.sparkleEnabled, (l, v) => { l.sparkle.enabled = v; });
  bindRange(els.sparkleDensity, els.sparkleDensityVal, (l, v) => { l.sparkle.density = v; });
  bindRange(els.sparkleSize, els.sparkleSizeVal, (l, v) => { l.sparkle.size = v; });
  bindColor(els.sparkleColor, (l, v) => { l.sparkle.color = v; });
}

function wirePaperAndZoom() {
  els.paperSize.addEventListener('change', () => {
    state.paperSize = els.paperSize.value;
    markDirty();
    renderAll();
  });
  els.zoom.addEventListener('input', () => {
    state.zoom = Number(els.zoom.value);
    els.zoomVal.textContent = state.zoom;
    applyZoom();
  });
}

function syncOrientationToggle() {
  if (!els.orientationToggle) return;
  for (const btn of els.orientationToggle.querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset.orientation === state.orientation);
  }
}

function wireOrientationToggle() {
  if (!els.orientationToggle) return;
  els.orientationToggle.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-orientation]');
    if (!btn) return;
    const o = btn.dataset.orientation;
    if (o !== 'portrait' && o !== 'landscape') return;
    if (state.orientation === o) return;
    state.orientation = o;
    syncOrientationToggle();
    markDirty();
    renderAll();
  });
}

// Custom-font chips list (below the drop-zone)
function renderCustomFontChips() {
  const box = els.customFontChips;
  if (!box) return;
  box.innerHTML = '';
  const fams = Object.keys(state.customFonts || {});
  for (const fam of fams) {
    const chip = document.createElement('span');
    chip.className = 'custom-font-chip';
    chip.textContent = fam;
    chip.style.fontFamily = `"${fam}", sans-serif`;
    box.appendChild(chip);
  }
}

// Drag-and-drop on the font upload zone, delegating to the same handler
// that the file input uses. Keeps click-to-browse working via the <label>.
function wireFontDropZone() {
  const dz = els.fontDropZone;
  const input = els.textFontUpload;
  if (!dz || !input) return;

  const ingestFile = async (file) => {
    try {
      const family = await registerCustomFont(file);
      const rec = listCustomFonts().find(r => r.family === family);
      if (rec) state.customFonts[family] = rec.dataUrl;
      if (fontPicker) { fontPicker.setFamily(family); fontPicker.refresh(); }
      renderCustomFontChips();
      const l = getSelected();
      if (l) {
        l.font = { family, source: 'uploaded' };
        markDirty();
        renderAll();
      }
    } catch (err) {
      alert(`Could not load font: ${err && err.message ? err.message : err}`);
    }
  };

  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('is-drag');
  });
  dz.addEventListener('dragleave', () => dz.classList.remove('is-drag'));
  dz.addEventListener('drop', async (e) => {
    e.preventDefault();
    dz.classList.remove('is-drag');
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) {
      alert('Font file must be .ttf, .otf, .woff or .woff2');
      return;
    }
    await ingestFile(file);
  });
}

function wireLayersPanel() {
  els.btnAddText.addEventListener('click', addTextLayer);
}

function wireLibraryButtons() {
  els.btnLibrary.addEventListener('click', openLibrary);
  els.btnSave.addEventListener('click', saveCurrentDesign);
  els.btnLibraryClose.addEventListener('click', closeLibrary);
  els.btnNewDesign.addEventListener('click', () => {
    newBlankDesign();
    closeLibrary();
  });
  els.btnExportLibrary.addEventListener('click', () => {
    const json = exportLibrary();
    downloadBlob(new Blob([json], { type: 'application/json' }), 'iron-on-library.json');
  });
  els.importLibrary.addEventListener('change', async () => {
    const file = els.importLibrary.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const n = importLibrary(text);
      renderLibraryList();
      alert(`Imported ${n} design${n === 1 ? '' : 's'}.`);
    } catch (e) {
      alert(`Import failed: ${e && e.message ? e.message : e}`);
    }
    els.importLibrary.value = '';
  });
}

function wireExportPanel() {
  els.btnExport.addEventListener('click', openExport);
  els.btnExportCancel.addEventListener('click', () => els.exportDialog.close());
  els.btnExportDownload.addEventListener('click', doExport);
}

// ========== SECTION 11: INIT ==========

function initFontPicker() {
  fontPicker = createFontPicker({
    rootId: 'font-picker',
    getSampleText: () => {
      const l = getSelected();
      return (l && l.content) ? l.content : 'Brooklyn';
    },
    onSelect: async (fam) => {
      await whenFontReady(fam);
      const l = getSelected();
      if (!l) return;
      l.font = { ...(l.font || {}), family: fam };
      markDirty();
      renderAll();
    },
  });
  fontPicker.setFamily(state.layers[0]?.font?.family || DEFAULT_FONT);
}

async function init() {
  loadGoogleFonts();
  loadLocalFonts();
  initFontPicker();
  populateMockupDropdowns();
  els.mockupGarment.value = state.mockup.garment;
  els.mockupTint.value = state.mockup.tint;
  els.paperSize.value = state.paperSize;

  els.designName.value = state.name;

  wirePanelTabs();
  wireViewToggle();
  wireDesignName();
  wireTextPanel();
  wireFontDropZone();
  wireColorPanel();
  wireEffectsPanel();
  wirePaperAndZoom();
  wireOrientationToggle();
  wireLayersPanel();
  wireLibraryButtons();
  wireExportPanel();
  initMockupPanel();
  initCanvasDrag();
  initKeyboardShortcuts();

  syncOrientationToggle();
  renderCustomFontChips();
  renderLayersPanel();
  syncPanelToLayer();
  renderAll();

  // Re-render once the default font resolves so measurements look right.
  whenFontReady(DEFAULT_FONT).then(() => renderAll());

  markClean();
}

document.addEventListener('DOMContentLoaded', init);
