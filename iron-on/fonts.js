// Curated Google Fonts — grouped by vibe. All free/open-source.
// "Varsity" group includes Graduate + several collegiate/freshman-style faces.
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
      'Bowlby One',
      'Londrina Solid',
      'Racing Sans One',
      'Knewave',
      'Bagel Fat One',
      'Faster One',
      'Teko',
      'Ultra',
      'Rowdies',
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
      'Chewy',
      'Boogaloo',
      'Carter One',
      'Gluten',
      'Amatic SC',
      'Rubik Bubbles',
      'Rubik Glitch',
      'Fuzzy Bubbles',
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
      'Dancing Script',
      'Great Vibes',
      'Kaushan Script',
      'Sacramento',
      'Homemade Apple',
      'Allison',
    ],
  },
  {
    label: 'Soft / Round',
    fonts: [
      'Comfortaa',
      'Quicksand',
      'Varela Round',
      'Nunito',
      'Baloo 2',
      'Mali',
    ],
  },
  {
    label: 'Retro / Y2K',
    fonts: [
      'Monoton',
      'Silkscreen',
      'Press Start 2P',
      'VT323',
      'Bungee Spice',
      'Rubik Wet Paint',
      'Rubik Burned',
    ],
  },
  {
    label: 'Bold Display',
    fonts: [
      'Archivo Black',
      'Koulen',
      'Russo One',
      'Yanone Kaffeesatz',
      'Big Shoulders Display',
      'Poller One',
    ],
  },
  {
    label: 'Vintage Serif',
    fonts: [
      'Playfair Display',
      'DM Serif Display',
      'Abril Fatface',
      'Fraunces',
      'Rozha One',
      'Bodoni Moda',
    ],
  },
];

// Flat list for lookups and bulk-loading.
export const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);

// Build a Google Fonts CSS2 URL for a batch of families.
export function googleFontsUrl(families) {
  const encoded = families
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${encoded}&display=swap`;
}

// Google's CSS2 endpoint will reject very long URLs (~2 KB). With >80 families
// we split the list into chunks and inject one <link> per chunk.
const CHUNK_SIZE = 30;

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function loadGoogleFonts() {
  if (document.querySelector('link[data-iron-on-fonts]')) return;
  for (const group of chunk(ALL_FONTS, CHUNK_SIZE)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontsUrl(group);
    link.dataset.ironOnFonts = 'true';
    document.head.appendChild(link);
  }
}

// Bundled local fonts shipped with the repo (dropped into iron-on/fonts/).
// Edit LOCAL_FONTS below to add/remove faces — the CSS @font-face is injected
// at boot, and the family appears in the "My Fonts" group in the picker.
//
// Each entry: { family, file, weight?, style?, format? }
// file is relative to iron-on/fonts/ (e.g. "MyHandwriting.ttf")
export const LOCAL_FONTS = [
  { family: 'Aquire',                   file: 'Aquire-BW0ox.otf' },
  { family: 'Aquire Bold',              file: 'AquireBold-8Ma60.otf' },
  { family: 'Aquire Light',             file: 'AquireLight-YzE0o.otf' },
  { family: 'Backtrack',                file: 'BacktrackRegular-8KVM.ttf' },
  { family: 'Balonku',                  file: 'BalonkuRegular-la1w.otf' },
  { family: 'Blockton Varsity',         file: 'BlocktonVarsity-xR01q.ttf' },
  { family: 'Cake Nom',                 file: 'CakeNom-87Y0.ttf' },
  { family: 'Colgan',                   file: 'Colgan-4nxMp.otf' },
  { family: 'Collegiate Heavy Outline', file: 'CollegiateheavyoutlineMedium-B0yx.ttf' },
  { family: 'Fluffy Blitz',             file: 'FluffyblitzdemoRegular-yY415.otf' },
  { family: 'Gas Huffer Phat',          file: 'GasHufferPhat-2v3e.ttf' },
  { family: 'Gasley',                   file: 'Gasley-e97Om.otf' },
  { family: 'Ghang',                    file: 'Ghang-2nxo.ttf' },
  { family: 'Ghang Plain',              file: 'GhangPlain-vKW9.ttf' },
  { family: 'Glowtone',                 file: 'GlowtonePersonalUseRegular-6R14D.otf' },
  { family: 'Hooverville',              file: 'Hooverville-ymK3.ttf' },
  { family: 'Hyper Blob',               file: 'HyperBlob-ZVj6l.ttf' },
  { family: 'Hyper Blob Outline',       file: 'HyperBlobOutline-OVj6o.ttf' },
  { family: 'Hyper Blob Alt',           file: 'Hyperblobregular-axj6J.otf' },
  { family: 'Hyper Blob Outline Alt',   file: 'Hyperbloboutline-Eaj3g.otf' },
  { family: 'Kortz',                    file: 'Kortz-JRn4B.otf' },
  { family: 'Kortz TTF',                file: 'Kortz-GO5aa.ttf' },
  { family: 'Momcake Bold',             file: 'MomcakeBold-WyonA.otf' },
  { family: 'Momcake Thin',             file: 'MomcakeThin-9Y6aZ.otf' },
  { family: 'Old Sport College',        file: 'OldSport01CollegeNcv-aeGm.ttf' },
  { family: 'Old Sport Athletic',       file: 'OldSport02AthleticNcv-E0gj.ttf' },
  { family: 'Playgum',                  file: 'Playgum-6RGZv.otf' },
  { family: 'Playgum TTF',              file: 'Playgum-yYxmZ.ttf' },
  { family: 'Procrastinating Pixie',    file: 'ProcrastinatingPixie-WyVOO.ttf' },
  { family: 'PW Yummy Donuts',          file: 'Pwyummydonuts-9p30.ttf' },
  { family: 'Shiny Unicorn',            file: 'ShinyUnicornPersonalUse-ow93q.otf' },
  { family: 'Shiny Unicorn Display',    file: 'ShinyUnicornDisplayPersonalUse-gxym3.otf' },
  { family: 'Smilen',                   file: 'Smilen-gKW6.otf' },
  { family: 'Softcakes',                file: 'Softcakesdemo-nAv2V.ttf' },
  { family: 'Spicy Sale',               file: 'SpicySale-9M2l7.otf' },
  { family: 'Spicy Sale TTF',           file: 'SpicySale-lxrme.ttf' },
  { family: 'Spooky Bat',               file: 'SpookyBat-YqAY4.ttf' },
  { family: 'Spooky Monsta',            file: 'SpookyMonsta-K7p2A.ttf' },
  { family: 'Spooky Pixels',            file: 'SpookypixelsRegular-RpzzM.otf' },
  { family: 'Spooky Pixels Bold',       file: 'SpookypixelsBold-8MWWD.otf' },
  { family: 'Spooky Pixels Outline',    file: 'SpookypixelsOutline-BWyyV.otf' },
  { family: 'Spooky Theme',             file: 'SpookyTheme-1jyaj.otf' },
  { family: 'Spooky Webbie',            file: 'SpookyWebbie-lgvxX.ttf' },
  { family: 'Sporting Outline',         file: 'SportingOutline-x3e85.ttf' },
  { family: 'Street Explorer',          file: 'StreetExplorer-X3Y9Z.otf' },
  { family: 'Third Street',             file: 'ThirdStreet-GOpWq.ttf' },
  { family: 'Third Street Bold',        file: 'ThirdStreetBold-JRqla.ttf' },
  { family: 'Unicorn Balloon',          file: 'UnicornBalloon-BWlq8.ttf' },
];

const localFonts = new Map();

function guessFormat(file) {
  const m = /\.([a-z0-9]+)$/i.exec(file);
  if (!m) return 'truetype';
  const ext = m[1].toLowerCase();
  if (ext === 'ttf') return 'truetype';
  if (ext === 'otf') return 'opentype';
  if (ext === 'woff') return 'woff';
  if (ext === 'woff2') return 'woff2';
  return 'truetype';
}

export function loadLocalFonts() {
  if (!LOCAL_FONTS.length) return;
  if (document.querySelector('style[data-iron-on-local-fonts]')) return;
  const css = LOCAL_FONTS.map(f => {
    const fmt = f.format || guessFormat(f.file);
    const w = f.weight || 400;
    const s = f.style || 'normal';
    return `@font-face{font-family:"${f.family}";src:url("fonts/${f.file}") format("${fmt}");font-weight:${w};font-style:${s};font-display:swap;}`;
  }).join('\n');
  const styleTag = document.createElement('style');
  styleTag.dataset.ironOnLocalFonts = 'true';
  styleTag.textContent = css;
  document.head.appendChild(styleTag);
  for (const f of LOCAL_FONTS) {
    localFonts.set(f.family, { family: f.family, source: 'local', file: f.file });
  }
}

export function listLocalFonts() {
  return Array.from(localFonts.values());
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
