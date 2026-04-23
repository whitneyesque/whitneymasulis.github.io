// Custom font picker: live previews, search, and favorites.
//
// Consumes FONT_GROUPS / listCustomFonts / listLocalFonts from fonts.js.
// Mounts inside a host element that already contains trigger + popover DOM
// (see index.html #font-picker).

import { FONT_GROUPS, listCustomFonts, listLocalFonts, whenFontReady } from './fonts.js';

const FAVS_KEY = 'iron-on-font-favs';

function readFavs() {
  try {
    const v = JSON.parse(localStorage.getItem(FAVS_KEY));
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function writeFavs(list) {
  try { localStorage.setItem(FAVS_KEY, JSON.stringify(list)); } catch {}
}

export function createFontPicker({ rootId, onSelect, getSampleText }) {
  const root = document.getElementById(rootId);
  if (!root) throw new Error(`font-picker: root #${rootId} not found`);
  const trigger = root.querySelector('.fp-trigger');
  const triggerSample = root.querySelector('#fp-trigger-sample');
  const triggerName = root.querySelector('#fp-trigger-name');
  const pop = root.querySelector('.fp-pop');
  const list = root.querySelector('.fp-list');
  const search = root.querySelector('.fp-search');

  let currentFamily = '';
  let query = '';
  let favs = readFavs();
  let open = false;

  function sample() {
    const txt = (getSampleText && getSampleText()) || 'Brooklyn';
    // First line only, trimmed to ~14 chars to keep rows compact.
    const line = String(txt).split('\n')[0].trim();
    return line ? line.slice(0, 14) : 'Brooklyn';
  }

  function groupedList() {
    // Start with favorites (if any).
    const groups = [];
    if (favs.length) {
      groups.push({ label: '★ Favorites', fonts: favs.slice() });
    }
    // Uploaded custom fonts.
    const customs = listCustomFonts().map(f => f.family);
    if (customs.length) groups.push({ label: 'Uploaded', fonts: customs });
    // Bundled local fonts (files shipped in the repo).
    const locals = listLocalFonts().map(f => f.family);
    if (locals.length) groups.push({ label: 'My Fonts', fonts: locals });
    // Curated Google Fonts groups.
    groups.push(...FONT_GROUPS.map(g => ({ label: g.label, fonts: g.fonts.slice() })));
    return groups;
  }

  function filterGroups(groups) {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map(g => ({ label: g.label, fonts: g.fonts.filter(f => f.toLowerCase().includes(q)) }))
      .filter(g => g.fonts.length);
  }

  function render() {
    list.innerHTML = '';
    const groups = filterGroups(groupedList());
    if (!groups.length) {
      const empty = document.createElement('div');
      empty.className = 'fp-empty';
      empty.textContent = 'No fonts match.';
      list.appendChild(empty);
      return;
    }
    const s = sample();
    for (const g of groups) {
      const h = document.createElement('div');
      h.className = 'fp-group-label';
      h.textContent = g.label;
      list.appendChild(h);
      for (const family of g.fonts) {
        list.appendChild(renderRow(family, s));
        // Kick off font loading in the background so the preview picks up.
        whenFontReady(family);
      }
    }
  }

  function renderRow(family, sampleText) {
    const row = document.createElement('div');
    row.className = 'fp-row' + (family === currentFamily ? ' sel' : '');
    row.dataset.family = family;
    row.setAttribute('role', 'option');

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'fp-star' + (favs.includes(family) ? ' on' : '');
    star.textContent = favs.includes(family) ? '★' : '☆';
    star.title = favs.includes(family) ? 'Unfavorite' : 'Favorite';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFav(family);
    });

    const preview = document.createElement('span');
    preview.className = 'fp-sample';
    preview.style.fontFamily = `"${family}", sans-serif`;
    preview.textContent = sampleText;

    const name = document.createElement('span');
    name.className = 'fp-name';
    name.textContent = family;

    row.appendChild(star);
    row.appendChild(preview);
    row.appendChild(name);

    row.addEventListener('click', () => {
      select(family);
    });

    return row;
  }

  function toggleFav(family) {
    if (favs.includes(family)) {
      favs = favs.filter(f => f !== family);
    } else {
      favs = [family, ...favs];
    }
    writeFavs(favs);
    render();
  }

  function setFamily(family) {
    currentFamily = family;
    triggerName.textContent = family;
    triggerSample.textContent = sample();
    triggerSample.style.fontFamily = `"${family}", sans-serif`;
    whenFontReady(family);
  }

  function select(family) {
    setFamily(family);
    close();
    if (onSelect) onSelect(family);
  }

  function openPop() {
    open = true;
    pop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    render();
    requestAnimationFrame(() => search.focus());
  }
  function close() {
    open = false;
    pop.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    search.value = '';
    query = '';
  }

  trigger.addEventListener('click', () => {
    open ? close() : openPop();
  });
  search.addEventListener('input', () => {
    query = search.value || '';
    render();
  });
  document.addEventListener('click', (e) => {
    if (!open) return;
    if (root.contains(e.target)) return;
    close();
  });
  document.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') { e.preventDefault(); close(); }
  });

  return {
    setFamily,
    refresh: () => { if (open) render(); },
    refreshSample: () => {
      // Re-render sample text on rows + trigger.
      if (currentFamily) triggerSample.textContent = sample();
      if (open) render();
    },
  };
}
