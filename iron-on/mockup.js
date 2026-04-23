// Garment silhouettes + photo-based scale calibration.
//
// The design is rendered into an inner SVG that's scaled to real garment inches,
// so 5" of text is actually 5" on the rendered garment.

// The SVG we produce uses 100 units per inch internally (generous resolution).
export const UNITS_PER_INCH = 100;

// Return an SVG fragment (string) representing the garment silhouette + a slot for the design.
//
// dims: {chestWidthIn, bodyLengthIn, shoulderWidthIn, printAreaWidthIn, printAreaHeightIn, skirtLengthIn?}
// type: 'tank' | 'dress'
// tint: hex color for the garment fill
// design: <inner svg string already sized to print area>
// placement: {xIn, yIn, scale}   // xIn,yIn relative to center of print area
export function renderGarmentSvg({ type, dims, tint, designSvg, placement, photoDataUrl, calibration }) {
  const u = UNITS_PER_INCH;

  // If photo + calibration exist, render the photo instead of the silhouette.
  if (photoDataUrl && calibration) {
    // Calibration tells us "px_distance between two clicks corresponds to X inches".
    // We lay out an SVG whose coordinate system is garment inches so the photo
    // is scaled such that calibration.refInches corresponds to calibration.pxDist.
    const imgInchWidth = calibration.imgWidthPx / (calibration.pxDist / calibration.refInches);
    const imgInchHeight = calibration.imgHeightPx / (calibration.pxDist / calibration.refInches);
    // Center the photo; treat print area as being at the chest region of the photo
    // (centered horizontally, ~25% down from the top by default).
    const printCenterX = imgInchWidth / 2 + (placement?.xIn || 0);
    const printCenterY = imgInchHeight * 0.28 + (placement?.yIn || 0);
    const viewBoxW = imgInchWidth * u;
    const viewBoxH = imgInchHeight * u;
    const scale = placement?.scale || 1;
    const paw = dims.printAreaWidthIn * u * scale;
    const pah = dims.printAreaHeightIn * u * scale;

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}" width="100%" height="100%">
  <image href="${photoDataUrl}" x="0" y="0" width="${viewBoxW}" height="${viewBoxH}" preserveAspectRatio="none"/>
  <g transform="translate(${printCenterX * u - paw / 2}, ${printCenterY * u - pah / 2}) scale(${scale})">
    <g class="design-slot">${designSvg || ''}</g>
    <rect x="0" y="0" width="${dims.printAreaWidthIn * u}" height="${dims.printAreaHeightIn * u}" fill="none" stroke="#e11d48" stroke-width="2" stroke-dasharray="8 6" opacity="0.7"/>
  </g>
</svg>`.trim();
  }

  // Else, silhouette mode.
  const path = type === 'dress' ? dressPath(dims) : tankPath(dims);
  const totalHeightIn =
    type === 'dress'
      ? dims.bodyLengthIn + (dims.skirtLengthIn || 6)
      : dims.bodyLengthIn;
  const totalWidthIn =
    type === 'dress'
      ? Math.max(dims.chestWidthIn * 1.7, dims.chestWidthIn + 4) // skirt flare
      : dims.chestWidthIn * 1.15;
  const vbW = totalWidthIn * u;
  const vbH = (totalHeightIn + 2) * u;

  // Center the silhouette horizontally; print-area center ~2.5" below top of shoulders.
  const centerX = vbW / 2;
  const printCenterY = 2.5 * u + (placement?.yIn || 0) * u;
  const scale = placement?.scale || 1;
  const paw = dims.printAreaWidthIn * u * scale;
  const pah = dims.printAreaHeightIn * u * scale;
  const placementX = (placement?.xIn || 0) * u;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="100%" height="100%">
  <g transform="translate(${centerX}, ${u})">
    <path d="${path}" fill="${tint || '#cccccc'}" stroke="#00000022" stroke-width="2"/>
  </g>
  <g transform="translate(${centerX + placementX - paw / 2}, ${printCenterY - pah / 2}) scale(${scale})">
    <g class="design-slot">${designSvg || ''}</g>
    <rect x="0" y="0" width="${dims.printAreaWidthIn * u}" height="${dims.printAreaHeightIn * u}" fill="none" stroke="#e11d48" stroke-width="2" stroke-dasharray="8 6" opacity="0.7"/>
  </g>
</svg>`.trim();
}

// Tank top silhouette centered at (0,0) at the top of the neckline.
// All coordinates in SVG units (u per inch).
function tankPath(dims) {
  const u = UNITS_PER_INCH;
  const halfChest = (dims.chestWidthIn / 2) * u;
  const halfShoulder = (dims.shoulderWidthIn / 2) * u;
  const length = dims.bodyLengthIn * u;
  const neck = 1.2 * u; // neckline drop
  const neckHalf = 1.3 * u; // neckline width
  const armhole = 2.6 * u; // how far down armhole goes
  const armholeCurve = halfShoulder - halfChest + 0.4 * u;

  return [
    `M ${-neckHalf} 0`, // neckline left
    `C ${-halfShoulder * 0.6} 0, ${-halfShoulder} 0, ${-halfShoulder} ${0.2 * u}`, // left shoulder
    `L ${-halfShoulder} ${armhole}`, // down the armhole
    `Q ${-halfShoulder - 0.2 * u} ${armhole + 0.5 * u}, ${-halfChest} ${armhole + 1.4 * u}`, // armhole curve in
    `L ${-halfChest} ${length}`, // side seam down
    `L ${halfChest} ${length}`, // hem
    `L ${halfChest} ${armhole + 1.4 * u}`, // right side up
    `Q ${halfShoulder + 0.2 * u} ${armhole + 0.5 * u}, ${halfShoulder} ${armhole}`,
    `L ${halfShoulder} ${0.2 * u}`,
    `C ${halfShoulder} 0, ${halfShoulder * 0.6} 0, ${neckHalf} 0`,
    `Q 0 ${neck}, ${-neckHalf} 0 Z`,
  ].join(' ');
}

// Sleeveless fit-and-flare dress silhouette.
function dressPath(dims) {
  const u = UNITS_PER_INCH;
  const halfChest = (dims.chestWidthIn / 2) * u;
  const halfShoulder = (dims.shoulderWidthIn / 2) * u;
  const bodice = dims.bodyLengthIn * u * 0.55; // waist line
  const totalLength = (dims.bodyLengthIn + (dims.skirtLengthIn || 6)) * u;
  const halfHem = halfChest * 1.6 + 2 * u; // flare out at hem
  const neck = 1.3 * u;
  const neckHalf = 1.4 * u;
  const armhole = 2.5 * u;

  return [
    `M ${-neckHalf} 0`,
    `C ${-halfShoulder * 0.6} 0, ${-halfShoulder} 0, ${-halfShoulder} ${0.2 * u}`,
    `L ${-halfShoulder} ${armhole}`,
    `Q ${-halfShoulder - 0.2 * u} ${armhole + 0.5 * u}, ${-halfChest} ${armhole + 1.4 * u}`,
    `L ${-halfChest * 0.95} ${bodice}`, // waist cinch
    `L ${-halfHem} ${totalLength}`, // skirt flare to hem
    `L ${halfHem} ${totalLength}`,
    `L ${halfChest * 0.95} ${bodice}`,
    `L ${halfChest} ${armhole + 1.4 * u}`,
    `Q ${halfShoulder + 0.2 * u} ${armhole + 0.5 * u}, ${halfShoulder} ${armhole}`,
    `L ${halfShoulder} ${0.2 * u}`,
    `C ${halfShoulder} 0, ${halfShoulder * 0.6} 0, ${neckHalf} 0`,
    `Q 0 ${neck}, ${-neckHalf} 0 Z`,
  ].join(' ');
}

// ----- Photo calibration helpers -----

export function startCalibration({ imageEl, canvasEl, onComplete }) {
  const points = [];
  const ctx = canvasEl.getContext('2d');
  canvasEl.width = imageEl.clientWidth;
  canvasEl.height = imageEl.clientHeight;
  canvasEl.style.width = imageEl.clientWidth + 'px';
  canvasEl.style.height = imageEl.clientHeight + 'px';

  function draw() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.fillStyle = '#e11d48';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(String(i + 1), p.x - 3, p.y + 4);
      ctx.fillStyle = '#e11d48';
    });
    if (points.length === 2) {
      ctx.strokeStyle = '#e11d48';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function onClick(ev) {
    const rect = canvasEl.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    if (points.length >= 2) points.length = 0;
    points.push({ x, y });
    draw();
    if (onComplete) onComplete(points, draw);
  }

  canvasEl.addEventListener('click', onClick);

  return {
    getPoints: () => points.slice(),
    reset: () => {
      points.length = 0;
      draw();
    },
    destroy: () => canvasEl.removeEventListener('click', onClick),
  };
}

// Compute calibration object to feed renderGarmentSvg.
export function buildCalibration({ points, refInches, imageEl }) {
  if (points.length < 2) return null;
  const dx = points[1].x - points[0].x;
  const dy = points[1].y - points[0].y;
  const pxDist = Math.hypot(dx, dy);
  // Convert from rendered (client) pixels back to intrinsic image pixels.
  const ratio = imageEl.naturalWidth / imageEl.clientWidth;
  return {
    pxDist: pxDist * ratio,
    refInches,
    imgWidthPx: imageEl.naturalWidth,
    imgHeightPx: imageEl.naturalHeight,
  };
}
