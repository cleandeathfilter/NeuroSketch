/**
 * Tapered Line Tool - For drawing dendrites with dendritic spines
 *
 * Scientifically accurate dendritic morphology:
 * - Dendrites: Taper from 4-8px at base to 1-3px at tips
 * - Dendritic spines: Small protrusions along length (1-3px)
 * - Spine types: Stubby, Mushroom, Thin
 * - Critical for dendritic tree realism and synaptic contact visualization
 *
 * Spine morphology based on research:
 * - Stubby: Short, wide (0.5-1μm)
 * - Mushroom: Bulbous head with thin neck (mature, stable)
 * - Thin: Long, narrow (immature, plastic)
 *
 * Source: Neuroscience textbooks, dendritic spine literature
 */

export function startDrawingTaperedLine(x, y, state, config) {
  return {
    type: 'taperedLine',
    x1: x,
    y1: y,
    x2: x,
    y2: y,
    baseWidth: 6, // Typical dendrite base
    tipWidth: 2,  // Typical dendrite tip
    strokeColor: config.dendriteColor || '#FF8A42', // Orange (excitatory dendrite)
    isDendrite: true,
    showGradient: true,
    showSpines: true, // NEW: Toggle spine visibility
    spineDensity: 0.06, // NEW: Spines per pixel (3 per 50px default)
    spineType: 'mixed', // NEW: 'stubby', 'mushroom', 'thin', 'mixed'
    spineColor: '#FF6B35' // NEW: Slightly darker than dendrite
  };
}

export function updateTaperedLine(line, currentX, currentY) {
  line.x2 = currentX;
  line.y2 = currentY;
}

export function finalizeTaperedLine(line) {
  const length = Math.sqrt(
    Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2)
  );

  // Adjust taper based on length (longer = more taper appropriate)
  if (length < 50) {
    // Short process - minimal taper
    line.tipWidth = line.baseWidth * 0.6;
  } else if (length > 150) {
    // Long process - significant taper
    line.tipWidth = line.baseWidth * 0.3;
  }

  // Dendrite vs Axon defaults
  if (line.isDendrite) {
    // Dendrites: thicker, more taper
    line.baseWidth = Math.max(line.baseWidth, 4);
    line.tipWidth = Math.max(line.tipWidth, 1);
  } else {
    // Axons: thinner, less taper
    line.baseWidth = Math.min(line.baseWidth, 4);
    line.tipWidth = line.baseWidth * 0.8; // Minimal taper
  }

  return line;
}

/**
 * Draw tapered line with smooth width transition and dendritic spines
 */
export function renderTaperedLine(ctx, line, zoom = 1) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return;

  // Perpendicular vector for width
  const perpX = -dy / length;
  const perpY = dx / length;

  // Create polygon for tapered shape
  const baseHalfWidth = (line.baseWidth / 2) / zoom;
  const tipHalfWidth = (line.tipWidth / 2) / zoom;

  const path = new Path2D();

  // Base left
  path.moveTo(
    line.x1 + perpX * baseHalfWidth,
    line.y1 + perpY * baseHalfWidth
  );

  // Tip left
  path.lineTo(
    line.x2 + perpX * tipHalfWidth,
    line.y2 + perpY * tipHalfWidth
  );

  // Tip right
  path.lineTo(
    line.x2 - perpX * tipHalfWidth,
    line.y2 - perpY * tipHalfWidth
  );

  // Base right
  path.lineTo(
    line.x1 - perpX * baseHalfWidth,
    line.y1 - perpY * baseHalfWidth
  );

  path.closePath();

  // Apply gradient if enabled
  if (line.showGradient) {
    const gradient = ctx.createLinearGradient(line.x1, line.y1, line.x2, line.y2);
    gradient.addColorStop(0, line.strokeColor);

    // Fade to lighter/transparent at tip
    const fadeColor = lightenColor(line.strokeColor, 0.5);
    gradient.addColorStop(1, fadeColor);

    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = line.strokeColor;
  }

  ctx.fill(path);

  // Draw dendritic spines if enabled
  if (line.showSpines && line.isDendrite && length > 20) {
    drawDendriticSpines(ctx, line, length, perpX, perpY, zoom);
  }
}

/**
 * Draw dendritic spines along dendrite
 */
function drawDendriticSpines(ctx, line, length, perpX, perpY, zoom) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const ux = dx / length;
  const uy = dy / length;

  // Calculate number of spines based on density
  const spineDensity = line.spineDensity || 0.06;
  const numSpines = Math.floor(length * spineDensity);

  // Use seed based on line position for consistent spine placement
  const seed = line.x1 + line.y1;

  ctx.fillStyle = line.spineColor || line.strokeColor;
  ctx.strokeStyle = line.spineColor || line.strokeColor;

  for (let i = 0; i < numSpines; i++) {
    // Position along dendrite (avoid base and tip)
    const t = (i + 1) / (numSpines + 1) + (seededRandom(seed + i) - 0.5) * 0.1;
    if (t < 0.1 || t > 0.9) continue;

    // Point on dendrite
    const px = line.x1 + ux * length * t;
    const py = line.y1 + uy * length * t;

    // Width at this point
    const widthAtPoint = line.baseWidth + t * (line.tipWidth - line.baseWidth);

    // Alternating sides
    const side = (i % 2 === 0) ? 1 : -1;

    // Determine spine type
    let spineType = line.spineType || 'mixed';
    if (spineType === 'mixed') {
      const rand = seededRandom(seed + i + 100);
      if (rand < 0.3) spineType = 'stubby';
      else if (rand < 0.7) spineType = 'mushroom';
      else spineType = 'thin';
    }

    // Draw spine based on type
    drawSpine(ctx, px, py, perpX * side, perpY * side, widthAtPoint, spineType, zoom);
  }
}

/**
 * Draw individual dendritic spine
 */
function drawSpine(ctx, x, y, perpX, perpY, dendriteWidth, type, zoom) {
  const baseSize = 2 / zoom; // Base spine size

  if (type === 'stubby') {
    // Stubby: Short, wide protrusion
    const length = (1 + Math.random() * 0.5) / zoom;
    const width = 1.5 / zoom;

    const endX = x + perpX * (dendriteWidth / 2 + length);
    const endY = y + perpY * (dendriteWidth / 2 + length);

    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + perpX * dendriteWidth / 2, y + perpY * dendriteWidth / 2);
    ctx.lineTo(endX, endY);
    ctx.stroke();

  } else if (type === 'mushroom') {
    // Mushroom: Thin neck with bulbous head
    const neckLength = (2 + Math.random() * 1) / zoom;
    const headRadius = (1.2 + Math.random() * 0.5) / zoom;

    const neckEndX = x + perpX * (dendriteWidth / 2 + neckLength);
    const neckEndY = y + perpY * (dendriteWidth / 2 + neckLength);

    // Draw neck
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    ctx.moveTo(x + perpX * dendriteWidth / 2, y + perpY * dendriteWidth / 2);
    ctx.lineTo(neckEndX, neckEndY);
    ctx.stroke();

    // Draw head
    ctx.beginPath();
    ctx.arc(neckEndX, neckEndY, headRadius, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'thin') {
    // Thin: Long, narrow protrusion
    const length = (2.5 + Math.random() * 1) / zoom;
    const width = 0.6 / zoom;

    const endX = x + perpX * (dendriteWidth / 2 + length);
    const endY = y + perpY * (dendriteWidth / 2 + length);

    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + perpX * dendriteWidth / 2, y + perpY * dendriteWidth / 2);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Small tip
    ctx.beginPath();
    ctx.arc(endX, endY, width, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Seeded random number generator for consistent spine placement
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Check if point is near tapered line
 */
export function isPointOnTaperedLine(line, px, py, tolerance = 10) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return false;

  // Project point onto line
  const t = Math.max(0, Math.min(1,
    ((px - line.x1) * dx + (py - line.y1) * dy) / (length * length)
  ));

  // Closest point on line
  const closestX = line.x1 + t * dx;
  const closestY = line.y1 + t * dy;

  // Distance to closest point
  const distance = Math.sqrt(
    Math.pow(px - closestX, 2) + Math.pow(py - closestY, 2)
  );

  // Width at this point (interpolated)
  const widthAtPoint = line.baseWidth + t * (line.tipWidth - line.baseWidth);

  return distance <= (widthAtPoint / 2 + tolerance);
}

/**
 * Helper: Lighten color for gradient effect
 */
function lightenColor(color, amount) {
  // Simple RGB lightening
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

    return `rgb(${newR}, ${newG}, ${newB})`;
  }
  return color;
}
