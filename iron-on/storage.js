// localStorage-backed library for saved designs.
// Each design: { id, name, updatedAt, state, thumbnail, photo?, calibration? }
//   state     = the serialized app state (layers, workspace, paper, placement, ...)
//   thumbnail = inline SVG string (small)
//   photo/calibration carried along so uploaded product photos survive reload

const KEY_INDEX = 'iron-on:index';
const KEY_DESIGN = (id) => `iron-on:design:${id}`;

function readIndex() {
  try {
    const raw = localStorage.getItem(KEY_INDEX);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndex(arr) {
  localStorage.setItem(KEY_INDEX, JSON.stringify(arr));
}

export function listDesigns() {
  const index = readIndex();
  return index
    .map((meta) => {
      try {
        const raw = localStorage.getItem(KEY_DESIGN(meta.id));
        if (!raw) return null;
        const { thumbnail } = JSON.parse(raw);
        return { ...meta, thumbnail };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function loadDesign(id) {
  const raw = localStorage.getItem(KEY_DESIGN(id));
  if (!raw) return null;
  return JSON.parse(raw);
}

export function saveDesign(design) {
  const id = design.id || newId();
  const updatedAt = Date.now();
  const record = { ...design, id, updatedAt };

  localStorage.setItem(KEY_DESIGN(id), JSON.stringify(record));

  const index = readIndex().filter((m) => m.id !== id);
  index.push({ id, name: record.name || 'Untitled', updatedAt });
  writeIndex(index);
  return record;
}

export function deleteDesign(id) {
  localStorage.removeItem(KEY_DESIGN(id));
  writeIndex(readIndex().filter((m) => m.id !== id));
}

export function duplicateDesign(id) {
  const original = loadDesign(id);
  if (!original) return null;
  const copy = {
    ...original,
    id: newId(),
    name: `${original.name || 'Untitled'} (copy)`,
  };
  return saveDesign(copy);
}

export function exportLibrary() {
  const designs = readIndex().map((meta) => loadDesign(meta.id)).filter(Boolean);
  return JSON.stringify({ version: 1, designs }, null, 2);
}

export function importLibrary(jsonStr) {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || !Array.isArray(parsed.designs)) throw new Error('Invalid library JSON');
  let imported = 0;
  for (const d of parsed.designs) {
    if (!d.id) d.id = newId();
    saveDesign(d);
    imported++;
  }
  return imported;
}

function newId() {
  return 'd_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
