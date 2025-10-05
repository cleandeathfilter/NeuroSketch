/**
 * Apical Dendrite Tool - For drawing the primary apical dendrite of pyramidal neurons
 *
 * Scientifically accurate apical dendrite morphology:
 * - Thick trunk extending from pyramidal soma apex
 * - Base: 8-12px diameter (thicker than basal dendrites)
 * - Tip: 3-5px (tapers less than basal dendrites)
 * - Length: 100-300px (extends through cortical layers)
 * - Dense dendritic spines, especially near apical tuft
 * - Single primary dendrite per pyramidal neuron
 *
 * Apical tuft characteristics:
 * - Elaborate branching at distal end (layer 1)
 * - High spine density
 * - Receives long-range inputs
 *
 * Source: Neuroscience textbooks (Pyramidal neuron morphology)
 * Research: Apical dendrites are hallmark of pyramidal neurons
 */

export function startDrawingApicalDendrite(x, y, state, config) {
  return {
    type: 'apicalDendrite',
    x1: x,
    y1: y,
    x2: x,
    y2: y,
    baseWidth: 10, // Thicker than basal dendrites
    tipWidth: 4,   // Tapers less than basal
    strokeColor: config.apicalColor || '#E67E22', // Orange-red (excitatory)
    showGradient: true,
    showSpines: true,
    spineDensity: 0.08, // Higher than basal (4 per 50px)
    spineType: 'mixed',
    spineColor: '#D35400',
    showTuft: false, // Optional apical tuft at tip
    attachedToSoma: null // Reference to pyramidal soma if snapped
  };
}

export function updateApicalDendrite(dendrite, currentX, currentY) {
  dendrite.x2 = currentX;
  dendrite.y2 = currentY;
}

export function finalizeApicalDendrite(dendrite) {
  const length = Math.sqrt(
    Math.pow(dendrite.x2 - dendrite.x1, 2) + Math.pow(dendrite.y2 - dendrite.y1, 2)
  );

  // Ensure reasonable proportions
  dendrite.baseWidth = Math.max(dendrite.baseWidth, 8);
  dendrite.tipWidth = Math.max(dendrite.tipWidth, 3);

  // Apical dendrites maintain thickness better than basal
  if (length > 200) {
    dendrite.tipWidth = dendrite.baseWidth * 0.5; // Less taper
  } else {
    dendrite.tipWidth = dendrite.baseWidth * 0.6;
  }

  return dendrite;
}

/**
 * Render apical dendrite with heavy spine coverage
 */
export function renderApicalDendrite(ctx, dendrite, zoom = 1) {
  const dx = dendrite.x2 - dendrite.x1;
  const dy = dendrite.y2 - dendrite.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return;

  // Perpendicular vector for width
  const perpX = -dy / length;
  const perpY = dx / length;

  // Create polygon for tapered shape
  const baseHalfWidth = (dendrite.baseWidth / 2) / zoom;
  const tipHalfWidth = (dendrite.tipWidth / 2) / zoom;

  const path = new Path2D();

  // Base left
  path.moveTo(
    dendrite.x1 + perpX * baseHalfWidth,
    dendrite.y1 + perpY * baseHalfWidth
  );

  // Tip left
  path.lineTo(
    dendrite.x2 + perpX * tipHalfWidth,
    dendrite.y2 + perpY * tipHalfWidth
  );

  // Tip right
  path.lineTo(
    dendrite.x2 - perpX * tipHalfWidth,
    dendrite.y2 - perpY * tipHalfWidth
  );

  // Base right
  path.lineTo(
    dendrite.x1 - perpX * baseHalfWidth,
    dendrite.y1 - perpY * baseHalfWidth
  );

  path.closePath();

  // Apply gradient
  if (dendrite.showGradient) {
    const gradient = ctx.createLinearGradient(dendrite.x1, dendrite.y1, dendrite.x2, dendrite.y2);
    gradient.addColorStop(0, dendrite.strokeColor);

    const fadeColor = lightenColor(dendrite.strokeColor, 0.4);
    gradient.addColorStop(1, fadeColor);

    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = dendrite.strokeColor;
  }

  ctx.fill(path);

  // Draw dendritic spines
  if (dendrite.showSpines && length > 30) {
    drawApicalSpines(ctx, dendrite, length, perpX, perpY, zoom);
  }

  // Draw apical tuft if enabled
  if (dendrite.showTuft && length > 100) {
    drawApicalTuft(ctx, dendrite, perpX, perpY, zoom);
  }
}

/**
 * Draw dendritic spines along apical dendrite (higher density)
 */
function drawApicalSpines(ctx, dendrite, length, perpX, perpY, zoom) {
  const dx = dendrite.x2 - dendrite.x1;
  const dy = dendrite.y2 - dendrite.y1;
  const ux = dx / length;
  const uy = dy / length;

  const spineDensity = dendrite.spineDensity || 0.08;
  const numSpines = Math.floor(length * spineDensity);

  const seed = dendrite.x1 + dendrite.y1;

  ctx.fillStyle = dendrite.spineColor || dendrite.strokeColor;
  ctx.strokeStyle = dendrite.spineColor || dendrite.strokeColor;

  for (let i = 0; i < numSpines; i++) {
    const t = (i + 1) / (numSpines + 1) + (seededRandom(seed + i) - 0.5) * 0.1;
    if (t < 0.1 || t > 0.95) continue;

    const px = dendrite.x1 + ux * length * t;
    const py = dendrite.y1 + uy * length * t;

    const widthAtPoint = dendrite.baseWidth + t * (dendrite.tipWidth - dendrite.baseWidth);

    const side = (i % 2 === 0) ? 1 : -1;

    // More mushroom spines in apical (mature, stable synapses)
    let spineType = dendrite.spineType || 'mixed';
    if (spineType === 'mixed') {
      const rand = seededRandom(seed + i + 100);
      if (rand < 0.2) spineType = 'stubby';
      else if (rand < 0.75) spineType = 'mushroom'; // Higher proportion
      else spineType = 'thin';
    }

    drawSpine(ctx, px, py, perpX * side, perpY * side, widthAtPoint, spineType, zoom);
  }
}

/**
 * Draw apical tuft (branching at distal end)
 */
function drawApicalTuft(ctx, dendrite, perpX, perpY, zoom) {
  const ux = dendrite.x2 - dendrite.x1;
  const uy = dendrite.y2 - dendrite.y1;
  const length = Math.sqrt(ux * ux + uy * uy);
  const dirX = ux / length;
  const dirY = uy / length;

  // Draw 3-5 small branches at tip
  const numBranches = 4;
  const branchLength = (15 + Math.random() * 10) / zoom;
  const branchWidth = 1.5 / zoom;

  ctx.strokeStyle = lightenColor(dendrite.strokeColor, 0.3);
  ctx.lineWidth = branchWidth;
  ctx.lineCap = 'round';

  for (let i = 0; i < numBranches; i++) {
    const angle = (i - numBranches / 2) * 0.4; // Spread branches
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Rotate direction vector
    const branchDirX = dirX * cos - dirY * sin;
    const branchDirY = dirX * sin + dirY * cos;

    const endX = dendrite.x2 + branchDirX * branchLength;
    const endY = dendrite.y2 + branchDirY * branchLength;

    ctx.beginPath();
    ctx.moveTo(dendrite.x2, dendrite.y2);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

/**
 * Draw individual spine (same as taperedLine)
 */
function drawSpine(ctx, x, y, perpX, perpY, dendriteWidth, type, zoom) {
  if (type === 'stubby') {
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
    const neckLength = (2 + Math.random() * 1) / zoom;
    const headRadius = (1.2 + Math.random() * 0.5) / zoom;

    const neckEndX = x + perpX * (dendriteWidth / 2 + neckLength);
    const neckEndY = y + perpY * (dendriteWidth / 2 + neckLength);

    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    ctx.moveTo(x + perpX * dendriteWidth / 2, y + perpY * dendriteWidth / 2);
    ctx.lineTo(neckEndX, neckEndY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(neckEndX, neckEndY, headRadius, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'thin') {
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

    ctx.beginPath();
    ctx.arc(endX, endY, width, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Check if point is near apical dendrite
 */
export function isPointOnApicalDendrite(dendrite, px, py, tolerance = 10) {
  const dx = dendrite.x2 - dendrite.x1;
  const dy = dendrite.y2 - dendrite.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return false;

  const t = Math.max(0, Math.min(1,
    ((px - dendrite.x1) * dx + (py - dendrite.y1) * dy) / (length * length)
  ));

  const closestX = dendrite.x1 + t * dx;
  const closestY = dendrite.y1 + t * dy;

  const distance = Math.sqrt(
    Math.pow(px - closestX, 2) + Math.pow(py - closestY, 2)
  );

  const widthAtPoint = dendrite.baseWidth + t * (dendrite.tipWidth - dendrite.baseWidth);

  return distance <= (widthAtPoint / 2 + tolerance);
}

/**
 * Snap apical dendrite to pyramidal soma apex
 */
export function snapToSomaApex(dendrite, somaObjects) {
  const snapDistance = 30;
  let nearestPyramid = null;
  let minDistance = Infinity;

  for (const soma of somaObjects) {
    if (soma.type !== 'triangle') continue; // Only pyramidal neurons

    // Calculate distance from dendrite base to soma center
    const dx = dendrite.x1 - soma.x;
    const dy = dendrite.y1 - soma.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < snapDistance && distance < minDistance) {
      minDistance = distance;
      nearestPyramid = soma;
    }
  }

  if (nearestPyramid) {
    // Snap to apex (top point of triangle)
    dendrite.x1 = nearestPyramid.x;
    dendrite.y1 = nearestPyramid.y - nearestPyramid.height / 2;

    // Point dendrite upward
    const currentLength = Math.sqrt(
      Math.pow(dendrite.x2 - dendrite.x1, 2) + Math.pow(dendrite.y2 - dendrite.y1, 2)
    );
    dendrite.x2 = dendrite.x1;
    dendrite.y2 = dendrite.y1 - currentLength;

    // Match soma color
    if (nearestPyramid.fillColor) {
      dendrite.strokeColor = lightenColor(nearestPyramid.fillColor, -0.1);
    }

    dendrite.attachedToSoma = nearestPyramid;
  }

  return dendrite;
}

/**
 * Seeded random for consistent spines
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Lighten/darken color
 */
function lightenColor(color, amount) {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const newR = Math.min(255, Math.max(0, Math.floor(r + (255 - r) * amount)));
    const newG = Math.min(255, Math.max(0, Math.floor(g + (255 - g) * amount)));
    const newB = Math.min(255, Math.max(0, Math.floor(b + (255 - b) * amount)));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  return color;
}
