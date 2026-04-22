// Size chart database for the mockup feature.
//
// All values are approximate garment dimensions (laid flat), in inches.
// They're intended to get the mockup close enough for placement/scale decisions.
// For final-print confidence, upload a photo of the real garment and use the
// calibration tool — that overrides these defaults with exact measurements.
//
// Fields:
//   chestWidthIn      : garment width at the chest when laid flat
//   bodyLengthIn      : top of shoulder to hem (or to waist for dresses)
//   shoulderWidthIn   : shoulder seam to shoulder seam across the top
//   printAreaWidthIn  : conservative safe print width (centered on chest)
//   printAreaHeightIn : conservative safe print height
//   skirtLengthIn?    : additional drop for dresses below the waist
//   garmentTypes      : which silhouettes this size supports ('tank','dress',...)

export const BRAND_CHARTS = {
  primary: {
    label: 'Primary',
    notes: 'Approximates primary.com kids standard fit. Seeded for the slub pocket tank and recess dress.',
    sizes: {
      '2':  { chestWidthIn: 10.5, bodyLengthIn: 14, shoulderWidthIn: 8.5,  printAreaWidthIn: 6, printAreaHeightIn: 6, skirtLengthIn: 6 },
      '3':  { chestWidthIn: 11,   bodyLengthIn: 15, shoulderWidthIn: 9,    printAreaWidthIn: 6.5, printAreaHeightIn: 6.5, skirtLengthIn: 6.5 },
      '4':  { chestWidthIn: 11.5, bodyLengthIn: 16, shoulderWidthIn: 9.5,  printAreaWidthIn: 7, printAreaHeightIn: 7, skirtLengthIn: 7 },
      '5':  { chestWidthIn: 12,   bodyLengthIn: 17, shoulderWidthIn: 10,   printAreaWidthIn: 7.5, printAreaHeightIn: 7.5, skirtLengthIn: 7.5 },
      '6':  { chestWidthIn: 12.5, bodyLengthIn: 18, shoulderWidthIn: 10.5, printAreaWidthIn: 8, printAreaHeightIn: 8, skirtLengthIn: 8 },
      '7':  { chestWidthIn: 13,   bodyLengthIn: 19, shoulderWidthIn: 11,   printAreaWidthIn: 8.5, printAreaHeightIn: 8.5, skirtLengthIn: 8.5 },
      '8':  { chestWidthIn: 13.5, bodyLengthIn: 20, shoulderWidthIn: 11.5, printAreaWidthIn: 9, printAreaHeightIn: 9, skirtLengthIn: 9 },
      '10': { chestWidthIn: 14.5, bodyLengthIn: 22, shoulderWidthIn: 12.5, printAreaWidthIn: 10, printAreaHeightIn: 10, skirtLengthIn: 10 },
      '12': { chestWidthIn: 15.5, bodyLengthIn: 24, shoulderWidthIn: 13.5, printAreaWidthIn: 10.5, printAreaHeightIn: 10.5, skirtLengthIn: 10.5 },
    },
  },

  hm_kids: {
    label: 'H&M Kids',
    notes: 'H&M kids sizing is by age/height. Dimensions approximate flat-garment measurements.',
    sizes: {
      '2-4Y':  { chestWidthIn: 11, bodyLengthIn: 15.5, shoulderWidthIn: 9, printAreaWidthIn: 6.5, printAreaHeightIn: 6.5, skirtLengthIn: 6.5 },
      '4-6Y':  { chestWidthIn: 12, bodyLengthIn: 17, shoulderWidthIn: 10, printAreaWidthIn: 7.5, printAreaHeightIn: 7.5, skirtLengthIn: 7.5 },
      '6-8Y':  { chestWidthIn: 13, bodyLengthIn: 19, shoulderWidthIn: 11, printAreaWidthIn: 8.5, printAreaHeightIn: 8.5, skirtLengthIn: 8.5 },
      '8-10Y': { chestWidthIn: 14, bodyLengthIn: 21, shoulderWidthIn: 12, printAreaWidthIn: 9.5, printAreaHeightIn: 9.5, skirtLengthIn: 9.5 },
    },
  },

  target_cat_and_jack: {
    label: 'Target Cat & Jack',
    notes: 'Target’s kids brand. Generous fits; values approximate US standard.',
    sizes: {
      '2T': { chestWidthIn: 10.5, bodyLengthIn: 14, shoulderWidthIn: 8.5, printAreaWidthIn: 6, printAreaHeightIn: 6, skirtLengthIn: 6 },
      '3T': { chestWidthIn: 11, bodyLengthIn: 15, shoulderWidthIn: 9, printAreaWidthIn: 6.5, printAreaHeightIn: 6.5, skirtLengthIn: 6.5 },
      '4T': { chestWidthIn: 11.5, bodyLengthIn: 16, shoulderWidthIn: 9.5, printAreaWidthIn: 7, printAreaHeightIn: 7, skirtLengthIn: 7 },
      '5':  { chestWidthIn: 12, bodyLengthIn: 17, shoulderWidthIn: 10, printAreaWidthIn: 7.5, printAreaHeightIn: 7.5, skirtLengthIn: 7.5 },
      '6':  { chestWidthIn: 12.5, bodyLengthIn: 18, shoulderWidthIn: 10.5, printAreaWidthIn: 8, printAreaHeightIn: 8, skirtLengthIn: 8 },
      '7':  { chestWidthIn: 13, bodyLengthIn: 19, shoulderWidthIn: 11, printAreaWidthIn: 8.5, printAreaHeightIn: 8.5, skirtLengthIn: 8.5 },
      '8':  { chestWidthIn: 13.5, bodyLengthIn: 20, shoulderWidthIn: 11.5, printAreaWidthIn: 9, printAreaHeightIn: 9, skirtLengthIn: 9 },
    },
  },

  carters: {
    label: "Carter's / OshKosh",
    notes: 'Classic US kids cut; runs slightly smaller at the top end.',
    sizes: {
      '2T': { chestWidthIn: 10.5, bodyLengthIn: 14, shoulderWidthIn: 8.5, printAreaWidthIn: 6, printAreaHeightIn: 6, skirtLengthIn: 6 },
      '3T': { chestWidthIn: 11, bodyLengthIn: 15, shoulderWidthIn: 9, printAreaWidthIn: 6.5, printAreaHeightIn: 6.5, skirtLengthIn: 6.5 },
      '4T': { chestWidthIn: 11.5, bodyLengthIn: 16, shoulderWidthIn: 9.5, printAreaWidthIn: 7, printAreaHeightIn: 7, skirtLengthIn: 7 },
      '5':  { chestWidthIn: 12, bodyLengthIn: 17, shoulderWidthIn: 10, printAreaWidthIn: 7.5, printAreaHeightIn: 7.5, skirtLengthIn: 7.5 },
      '6':  { chestWidthIn: 12.5, bodyLengthIn: 18, shoulderWidthIn: 10.5, printAreaWidthIn: 8, printAreaHeightIn: 8, skirtLengthIn: 8 },
      '7':  { chestWidthIn: 13, bodyLengthIn: 19, shoulderWidthIn: 11, printAreaWidthIn: 8.5, printAreaHeightIn: 8.5, skirtLengthIn: 8.5 },
      '8':  { chestWidthIn: 13.5, bodyLengthIn: 20, shoulderWidthIn: 11.5, printAreaWidthIn: 9, printAreaHeightIn: 9, skirtLengthIn: 9 },
    },
  },

  old_navy_gap: {
    label: 'Old Navy / Gap Kids',
    notes: 'Old Navy and Gap Kids use very similar charts — combined.',
    sizes: {
      '2T': { chestWidthIn: 10.5, bodyLengthIn: 14, shoulderWidthIn: 8.5, printAreaWidthIn: 6, printAreaHeightIn: 6, skirtLengthIn: 6 },
      '3T': { chestWidthIn: 11, bodyLengthIn: 15, shoulderWidthIn: 9, printAreaWidthIn: 6.5, printAreaHeightIn: 6.5, skirtLengthIn: 6.5 },
      'XS (4-5)': { chestWidthIn: 11.75, bodyLengthIn: 16.5, shoulderWidthIn: 9.75, printAreaWidthIn: 7.25, printAreaHeightIn: 7.25, skirtLengthIn: 7.25 },
      'S (6-7)':  { chestWidthIn: 12.75, bodyLengthIn: 18.5, shoulderWidthIn: 10.75, printAreaWidthIn: 8.25, printAreaHeightIn: 8.25, skirtLengthIn: 8.25 },
      'M (8)':    { chestWidthIn: 13.5, bodyLengthIn: 20, shoulderWidthIn: 11.5, printAreaWidthIn: 9, printAreaHeightIn: 9, skirtLengthIn: 9 },
      'L (10-12)': { chestWidthIn: 14.75, bodyLengthIn: 22.5, shoulderWidthIn: 12.75, printAreaWidthIn: 10, printAreaHeightIn: 10, skirtLengthIn: 10 },
    },
  },
};

// Seeded garments that match Whitney's actual order. One-click presets in the Mockup panel.
// Tank size 2 was confirmed as a gift for her cousin (not her 5-year-old daughter).
export const SEEDED_PRESETS = [
  {
    id: 'primary-tank-poppy-2',
    label: 'Primary slub pocket tank — Poppy (size 2, cousin)',
    brand: 'primary',
    size: '2',
    garment: 'tank',
    // Sampled from the primary.com product photo for Poppy.
    tint: '#ee3f2d',
  },
  {
    id: 'primary-dress-fuchsia-5',
    label: 'Primary recess dress — Fuchsia (size 5)',
    brand: 'primary',
    size: '5',
    garment: 'dress',
    tint: '#d8177e',
  },
  {
    id: 'primary-dress-banana-5',
    label: 'Primary recess dress — Banana (size 5)',
    brand: 'primary',
    size: '5',
    garment: 'dress',
    tint: '#f5e047',
  },
];

export function getBrands() {
  return Object.entries(BRAND_CHARTS).map(([id, b]) => ({ id, label: b.label }));
}

export function getSizesForBrand(brandId) {
  const b = BRAND_CHARTS[brandId];
  return b ? Object.keys(b.sizes) : [];
}

export function getDimensions(brandId, size) {
  return BRAND_CHARTS[brandId]?.sizes?.[size] || null;
}
