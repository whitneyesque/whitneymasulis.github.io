// Curated Google Fonts — grouped by vibe. All free/open-source.
// "varsity" group includes Graduate + several collegiate/freshman-style faces.
export const FONT_GROUPS = [
  {
    label: 'Varsity / Collegiate',
    fonts: [
      'Graduate',         // Classic "Freshman"-style college letters.
      'Staatliches',      // Tall condensed all-caps, team-jersey feel.
      'Bungee',           // Chunky signage.
      'Bungee Shade',     // Bungee with built-in 3D shadow.
      'Bungee Outline',
      'Black Ops One',    // Stencil-military, reads varsity.
      'Rubik Mono One',   // Ultra-heavy block.
      'Anton',            // Impact-like condensed.
      'Oswald',           // Condensed sans.
      'Squada One',       // Compact display.
      'Chonburi',         // Slab with varsity energy.
      'Alfa Slab One',    // Heavy slab.
      'Bowlby One SC',    // Fat caps.
      'Londrina Solid',   // Rounded block.
      'Racing Sans One',  // Italic speed vibe.
    ],
  },
  {
    label: 'Playful / Childlike',
    fonts: [
      'Fredoka',
      'Luckiest Guy',
      'Bangers',
      'Permanent Marker',
      'Sigmar One',
      'Lilita One',
      'Honk',
      'Sour Gummy',
      'Shrikhand',
      'Titan One',
    ],
  },
  {
    label: 'Script / Handwritten',
    fonts: [
      'Pacifico',
      'Lobster',
      'Caveat',
      'Kalam',
      'Shadows Into Light',
      'Gochi Hand',
      'Patrick Hand',
      'Indie Flower',
      'Schoolbell',
      'Satisfy',
    ],
  },
  {
    label: 'Soft / Round',
    fonts: ['Comfortaa', 'Quicksand', 'Varela Round'],
  },
];

// Flat list for lookups and bulk-loading.
export const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);

// Defensive spec used for Google Fonts API URL.
export function googleFontsUrl(families) {
  const encoded = families
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${encoded}&display=swap`;
}

// Inject a <link> for all curated fonts once on app load.
export function loadGoogleFonts() {
  if (document.querySelector('link[data-iron-on-fonts]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleFontsUrl(ALL_FONTS);
  link.dataset.ironOnFonts = 'true';
  document.head.appendChild(link);
}

// Custom uploaded fonts registered via the FontFace API.
// Key: family name. Value: { family, source:'uploaded', dataUrl }
const customFonts = new Map();

export async function registerCustomFont(file) {
  const family = file.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, '');
  const dataUrl = await fileToDataUrl(file);
  const face = new FontFace(family, `url(${dataUrl})`);
  await face.load();
  document.fonts.add(face);
  customFonts.set(family, { family, source: 'uploaded', dataUrl });
  return family;
}

export function listCustomFonts() {
  return Array.from(customFonts.values());
}

export function reHydrateCustomFont(name, dataUrl) {
  if (customFonts.has(name)) return Promise.resolve(name);
  const face = new FontFace(name, `url(${dataUrl})`);
  return face.load().then(() => {
    document.fonts.add(face);
    customFonts.set(name, { family: name, source: 'uploaded', dataUrl });
    return name;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Populate a <select> with groups + current custom fonts.
export function populateFontPicker(select, currentValue) {
  select.innerHTML = '';
  for (const group of FONT_GROUPS) {
    const og = document.createElement('optgroup');
    og.label = group.label;
    for (const family of group.fonts) {
      const opt = document.createElement('option');
      opt.value = family;
      opt.textContent = family;
      opt.style.fontFamily = `"${family}", sans-serif`;
      og.appendChild(opt);
    }
    select.appendChild(og);
  }
  const customs = listCustomFonts();
  if (customs.length) {
    const og = document.createElement('optgroup');
    og.label = 'Uploaded';
    for (const { family } of customs) {
      const opt = document.createElement('option');
      opt.value = family;
      opt.textContent = family;
      opt.style.fontFamily = `"${family}", sans-serif`;
      og.appendChild(opt);
    }
    select.appendChild(og);
  }
  if (currentValue) select.value = currentValue;
}

// Wait for a specific font to be loaded (useful before measuring).
export function whenFontReady(family) {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return document.fonts.load(`16px "${family}"`).catch(() => {});
}
