/**
 * Axon Hillock Tool - For drawing the axon initial segment
 *
 * Scientifically accurate axon hillock morphology:
 * - Triangular/conical taper from soma to axon initial segment (AIS)
 * - Critical site of action potential initiation
 * - Contains highest density of voltage-gated Na+ channels
 * - Typically 20-60μm long (20-60px in our scale)
 * - Tapers from soma diameter (~50px) to axon diameter (~3px)
 *
 * Visual characteristics:
 * - Smooth gradient color from soma to axon
 * - Cone/triangle shape pointing toward axon
 * - Should snap/align to soma edge when placed
 * - Lighter color than soma but darker than axon
 *
 * Source: Neuroscience textbooks (Kandel, Purves, Bear)
 * Research: AIS is first 20-60μm of axon, site of AP initiation
 */

export function startDrawingAxonHillock(x, y, state, config) {
  return {
    type: 'axonHillock',
    x: x, // Base attachment point (on soma)
    y: y,
    baseWidth: 12, // Width at soma attachment (will auto-adjust to soma)
    tipWidth: 3, // Width at axon start
    length: 40, // Length of hillock
    angle: 0, // Angle pointing toward axon (radians)
    fillColor: config.hillockColor || '#D98880', // Lighter red than soma
    strokeColor: '#A93226',
    strokeWidth: 1,
    attachedToSoma: null, // Reference to soma object if snapped
    showAPIndicator: false // Optional: show AP initiation site glow
  };
}

export function updateAxonHillock(hillock, currentX, currentY) {
  // Calculate angle and length from base to current point
  const dx = currentX - hillock.x;
  const dy = currentY - hillock.y;

  hillock.length = Math.sqrt(dx * dx + dy * dy);
  hillock.angle = Math.atan2(dy, dx);

  // Minimum and maximum length constraints
  hillock.length = Math.max(20, Math.min(hillock.length, 100));
}

export function finalizeAxonHillock(hillock) {
  // Ensure reasonable proportions
  if (hillock.length < 20) {
    hillock.length = 40; // Default length
  }

  // Base should be wider than tip
  if (hillock.baseWidth <= hillock.tipWidth) {
    hillock.baseWidth = hillock.tipWidth * 3;
  }

  return hillock;
}

/**
 * Render axon hillock with gradient taper
 */
export function renderAxonHillock(ctx, hillock, zoom = 1) {
  ctx.save();

  // Translate to base point and rotate
  ctx.translate(hillock.x, hillock.y);
  ctx.rotate(hillock.angle);

  // Calculate trapezoid vertices (base to tip taper)
  const baseHalfWidth = (hillock.baseWidth / 2) / zoom;
  const tipHalfWidth = (hillock.tipWidth / 2) / zoom;
  const length = hillock.length;

  // Create gradient from base to tip
  const gradient = ctx.createLinearGradient(0, 0, length, 0);
  gradient.addColorStop(0, hillock.fillColor); // Base color
  gradient.addColorStop(1, lightenColor(hillock.fillColor, 0.3)); // Lighter at tip

  // Draw tapered hillock
  ctx.beginPath();
  ctx.moveTo(0, -baseHalfWidth); // Top left (base)
  ctx.lineTo(length, -tipHalfWidth); // Top right (tip)
  ctx.lineTo(length, tipHalfWidth); // Bottom right (tip)
  ctx.lineTo(0, baseHalfWidth); // Bottom left (base)
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = hillock.strokeColor;
  ctx.lineWidth = hillock.strokeWidth / zoom;
  ctx.stroke();

  // Optional: AP initiation indicator (small glow at AIS)
  if (hillock.showAPIndicator) {
    const aisPosition = length * 0.3; // AIS is ~30% along hillock

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FFD700'; // Gold glow
    ctx.beginPath();
    ctx.arc(aisPosition, 0, 8 / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Check if point is inside axon hillock
 */
export function isPointInAxonHillock(hillock, px, py, tolerance = 5) {
  // Transform point to hillock's local coordinate system
  const dx = px - hillock.x;
  const dy = py - hillock.y;

  // Rotate point by negative angle
  const cos = Math.cos(-hillock.angle);
  const sin = Math.sin(-hillock.angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Check if point is within trapezoid bounds
  if (localX < -tolerance || localX > hillock.length + tolerance) {
    return false;
  }

  // Calculate width at this x position (linear interpolation)
  const t = localX / hillock.length;
  const widthAtX = hillock.baseWidth + t * (hillock.tipWidth - hillock.baseWidth);
  const halfWidth = widthAtX / 2;

  return Math.abs(localY) <= halfWidth + tolerance;
}

/**
 * Snap hillock to nearest soma edge
 * Returns updated hillock with attachment info
 */
export function snapToSoma(hillock, somaObjects) {
  const snapDistance = 30; // Max distance to snap (px)
  let nearestSoma = null;
  let minDistance = Infinity;

  for (const soma of somaObjects) {
    // Calculate distance from hillock base to soma center
    const dx = hillock.x - soma.x;
    const dy = hillock.y - soma.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if close enough to snap
    const somaRadius = getSomaRadius(soma);
    if (distance < somaRadius + snapDistance && distance < minDistance) {
      minDistance = distance;
      nearestSoma = soma;
    }
  }

  if (nearestSoma) {
    // Snap to soma edge
    const dx = hillock.x - nearestSoma.x;
    const dy = hillock.y - nearestSoma.y;
    const angle = Math.atan2(dy, dx);
    const somaRadius = getSomaRadius(nearestSoma);

    // Place hillock base at soma edge
    hillock.x = nearestSoma.x + somaRadius * Math.cos(angle);
    hillock.y = nearestSoma.y + somaRadius * Math.sin(angle);

    // Point hillock outward from soma
    hillock.angle = angle;

    // Auto-match base width to soma size
    hillock.baseWidth = Math.min(somaRadius * 0.3, 15);

    // Store attachment reference
    hillock.attachedToSoma = nearestSoma;

    // Match soma color
    if (nearestSoma.fillColor) {
      hillock.fillColor = lightenColor(nearestSoma.fillColor, 0.2);
    }
  }

  return hillock;
}

/**
 * Get soma radius based on type
 */
function getSomaRadius(soma) {
  if (soma.type === 'circle') {
    return soma.radius || 30;
  } else if (soma.type === 'hexagon') {
    return soma.radius || 40;
  } else if (soma.type === 'triangle') {
    return Math.max(soma.width, soma.height) / 2 || 25;
  }
  return 30; // Default
}

/**
 * Helper: Lighten color for gradient
 */
function lightenColor(color, amount) {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  return color;
}
