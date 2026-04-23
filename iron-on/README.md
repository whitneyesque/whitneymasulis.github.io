# Iron-On Text Designer

A browser-based design tool for making custom iron-on transfers — the kind you print on transfer paper and iron onto T-shirts, tanks, and dresses.

Live: <https://whitneyesque.github.io/whitneymasulis.github.io/iron-on/>

---

## The core promise

**Design a word. Export it. Print it. Done.**

The whole point of this tool is to skip the usual "design it → open it in Preview → fight with the print dialog → realize it came out at 75% → try again" loop that kills most DIY iron-on projects.

You should be able to:

1. Type `Brooklyn` in the browser.
2. Click **Export**.
3. Get a PNG that is **exactly US Letter (8.5 × 11") at 300 DPI** — already mirrored (if you're using light-fabric transfer paper) and centered on the page.
4. Open that PNG on your computer or phone and hit **Print**.
5. The printer runs it at 100%, no resizing, no scaling dialog, no PDF intermediary.

The PNG dimensions are calibrated for exactly this:

| Paper setting              | Output dimensions      |
| -------------------------- | ---------------------- |
| US Letter @ 300 DPI        | 2550 × 3300 px         |
| Letter landscape @ 300 DPI | 3300 × 2550 px         |
| Square 8×8 @ 300 DPI       | 2400 × 2400 px         |
| Portrait 8×10 @ 300 DPI    | 2400 × 3000 px         |
| Tight crop to design       | Whatever fits, @ 300 DPI |

The background is transparent. Only the ink prints, which is the correct behavior for iron-on paper.

## Works on mobile iOS Chrome (and Safari)

The whole app runs on an iPhone or iPad in Chrome or Safari. This is on purpose:

- Most craft design happens on a phone on the couch, not at a desk.
- Iron-on printing is frequently done via AirPrint, which starts from the iPhone Photos or Files app.
- Mobile Chrome is the bridge between a design idea and a printed transfer sheet.

What works on mobile:

- **Touch-drag** on the canvas to move a text layer.
- Font drop-zone supports the iOS file picker (tap → Choose File → Photo Library / iCloud).
- Export downloads straight to your Photos or Files app — then **Share → Print** passes the exact pixel dimensions to AirPrint at 100% scale.
- Sidebar / canvas layout reflows on narrow screens.

## The design workflow

### 1. The design view

Your paper sits in the center of the screen. On top of it, you place one or more **text layers**.

**Paper** — US Letter 8.5×11", Square 8×8", or Portrait 8×10", each with a **Portrait ↔ Landscape** toggle.

**Per-layer typography** — font family, size, letter spacing, line height, rotation. Content is editable multi-line text.

**Four color modes:**

- **Solid** — one color across the whole word.
- **Per-letter** — every letter can be its own color (rainbow names).
- **Gradient** — custom linear gradient, any angle, as many color stops as you want.
- **Rainbow** — seven-stop ROYGBIV preset at any angle.

**Four stackable effects:**

- **Outline** — configurable color + width.
- **Drop shadow / glow** — color, blur, X/Y offset.
- **Curve / arc** — bend text along a quadratic curve (smile or frown).
- **Sparkles** — procedural star field around the text, with seeded randomness so it stays stable as you tweak.

**Layer operations** — drag to reorder, duplicate, delete. New layers spawn at the center. `Ctrl/Cmd+D` duplicates the selected layer.

**Keyboard shortcuts:**

- `Ctrl/Cmd+S` — save the current design to the library.
- `Ctrl/Cmd+D` — duplicate the selected layer.
- Arrow keys — nudge the selected layer; Shift+arrow nudges in bigger steps.

**Edge warning** — a red banner appears when any text gets within 0.25" of the paper edge, because that margin is needed on transfer paper.

### 2. The mockup view

Switch to the **Mockup** tab to preview your design on an actual garment.

**Quick presets** — pick a real product from the dropdown (*Strawberry Tank size 2*, *Fuchsia Dress size 5*, *Banana Dress size 5*), pre-photographed, with dimensions baked in from the size chart.

On **first use** of a preset, the app asks you to click two points marking the garment's shoulder-to-shoulder width. Those clicks are cached in your browser forever — pick the same garment again and it skips the dialog.

Calibration solves the *"how big will my 4-inch design actually look on a size-2 tank?"* problem. Your design is rendered onto the photo at its true physical size, with a dashed red rectangle showing the garment's safe print area.

If you don't pick a photo, you get a generic tank or dress silhouette tinted to the garment's color — same math, lower fidelity.

## Fonts

A serious font library, in four stripes:

- **~80 curated Google Fonts** across seven categories: *Varsity / Collegiate*, *Playful / Childlike*, *Script / Handwritten*, *Soft / Round*, *Retro / Y2K*, *Bold Display*, *Vintage Serif*.
- **~45 bundled local fonts** shipped in `iron-on/fonts/` as TTF / OTF files — playful display faces suited to apparel decoration (*Hooverville*, *Street Explorer*, *Momcake*, *Spooky Pixels*, *Blockton Varsity*, *Aquire*, etc.).
- **User uploads** — drag a `.ttf` / `.otf` / `.woff` / `.woff2` onto the drop-zone in the Text panel and it registers instantly via the FontFace API (per-design only).
- **Favorites** — star any font to pin it to the top of the picker across reloads (stored in localStorage).

The picker shows a **live preview** of every font, rendered in that face, so you pick by look rather than by name. Built-in search filters by family name.

## Printing tips (Canon inkjet + light-fabric paper)

- Use your printer's **photo / high-quality** setting; paper type = **Plain Paper** (not photo paper).
- Feed the transfer sheet **coated-side-down**, per the package instructions.
- Let the print dry 1–2 minutes before peeling the backing and ironing.
- **Mirroring is required for light-fabric paper** (Export dialog defaults to it checked) — text reads correctly only after transfer. **Uncheck mirror for dark-fabric paper**, which does not require mirroring.

## Save, load, export

**Library (localStorage)** — saved designs get an SVG thumbnail + metadata. Open, duplicate, delete, or export/import the whole library as JSON for backup or transfer between devices.

**Export formats:**

- **Transparent PNG @ 300 DPI** — the real print output. Only the ink prints; paper stays transparent. Pixel dimensions are calibrated to your chosen paper size, see the table above.
- **SVG** — lossless vector export for other design tools.

**Export sizing:**

- **US Letter centered** — fits your design inside an 8.5×11" page with printer margins respected.
- **Tight crop to design** — bounding-box crop around your text with a small margin; useful when you want to reuse leftover transfer paper.

## Technical shape

No build step, no framework. Vanilla ES modules served as static files from GitHub Pages.

### File layout

```
iron-on/
  index.html          — DOM shell
  styles.css          — sticker-shop visual language
  app.js              — central state + SVG render loop + all wiring
  font-picker.js      — custom font dropdown widget (previews, search, favorites)
  fonts.js            — Google Fonts manifest + local @font-face loader + FontFace API bridge
  mockup.js           — garment silhouette SVG generation + photo calibration
  size-charts.js      — brand size tables + seeded garment catalog
  storage.js          — design library persistence in localStorage
  fonts/              — bundled TTF / OTF font files
  IMG_9519.PNG        — strawberry tank photo
  IMG_9521.jpg        — banana dress photo
  IMG_9522.jpg        — fuchsia dress photo
  mockups/            — scratch visual-direction prototypes (craft / varsity / sticker)
```

### Render pipeline

- All sizing is computed in **100 SVG units per inch**, so `size`, `letterSpacing`, `transform.x/y` and export measurements all flow through one consistent unit system.
- The preview is a single `<svg>` whose viewBox is the paper in internal units. Each text layer becomes a `<g>` with its own transform, fill, optional filter, and optional textPath (for curve/arc).
- Per-letter colors are rendered as separate `<tspan>` elements. Gradients and rainbow are `<linearGradient>` defs referenced by `fill="url(#...)"`. Drop shadows are SVG filter primitives.
- PNG export rasterizes the SVG through an offscreen `<canvas>` at 300 DPI (width in inches × 300).
- Mockup view nests the design SVG inside the garment SVG, using `overflow="visible"` so text that exceeds the print area still renders (with the dashed boundary visible around it).

### Adding more local fonts

1. Drop `.ttf` / `.otf` files into `iron-on/fonts/`.
2. Add an entry to `LOCAL_FONTS` in `fonts.js`:
   ```js
   { family: 'My Handwriting', file: 'MyHandwriting.ttf' }
   ```
3. Reload the app. The font appears in the **My Fonts** group in the picker.

### Adding a new garment preset

1. Drop the product photo into `iron-on/` (or a subdirectory).
2. Add an entry to `SEEDED_PRESETS` in `size-charts.js`:
   ```js
   {
     id: 'unique-id',
     label: 'Display name',
     brand: 'primary',     // must exist in BRAND_CHARTS
     size: '5',            // must exist for that brand
     garment: 'dress',     // 'tank' | 'dress'
     tint: '#d8177e',
     image: 'MyPhoto.jpg',
   }
   ```
3. First time anyone picks it, they'll click shoulder-to-shoulder to calibrate. Their calibration is cached per-preset per-browser.
