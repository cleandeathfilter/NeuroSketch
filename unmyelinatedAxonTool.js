/**
 * Unmyelinated Axon Tool - For drawing axons with CONSTANT diameter
 *
 * Scientifically accurate axon morphology:
 * - CONSTANT diameter throughout length (2-4px) - NO TAPERING
 * - Can be straight or curved (uses quadratic Bezier)
 * - Axons maintain uniform width unlike dendrites which taper
 * - Used for unmyelinated axons (C-fibers, some CNS axons)
 *
 * Key difference from dendrites:
 * - Dendrites TAPER (thick to thin) - use taperedLineTool.js
 * - Axons CONSTANT width (uniform diameter)
 *
 * Source: Neuroscience textbooks (Kandel, Purves, Bear)
 * Research: Axons have constant diameter due to uniform cytoskeletal structure
 */

export function startDrawingUnmyelinatedAxon(x, y, state, config) {
  return {
    type: 'unmyelinatedAxon',
    x1: x,
    y1: y,
    x2: x,
    y2: y,
    controlX: x,
    controlY: y,
    strokeWidth: 3,
    strokeColor: config.axonColor || '#A93226', // Default axon color
    isCurveMode: false, // First click = endpoint, second click = control point
    smooth: true,
    showControlPoint: false // Show control handle in edit mode
  };
}

export function updateUnmyelinatedAxon(path, currentX, currentY, clickCount) {
  if (clickCount === 1) {
    // First drag: set endpoint
    path.x2 = currentX;
    path.y2 = currentY;

    // Auto-calculate control point (perpendicular midpoint offset)
    const midX = (path.x1 + path.x2) / 2;
    const midY = (path.y1 + path.y2) / 2;

    // Perpendicular vector
    const dx = path.x2 - path.x1;
    const dy = path.y2 - path.y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const perpX = -dy / length;
      const perpY = dx / length;

      // Offset control point perpendicular to line (20% of length)
      const offset = length * 0.2;
      path.controlX = midX + perpX * offset;
      path.controlY = midY + perpY * offset;
    }
  } else if (clickCount === 2) {
    // Second drag: adjust control point
    path.controlX = currentX;
    path.controlY = currentY;
  }
}

export function finalizeUnmyelinatedAxon(path) {
  // Ensure minimum length
  const length = Math.sqrt(
    Math.pow(path.x2 - path.x1, 2) + Math.pow(path.y2 - path.y1, 2)
  );

  if (length < 20) {
    // Too short, convert to straight line
    path.controlX = (path.x1 + path.x2) / 2;
    path.controlY = (path.y1 + path.y2) / 2;
  }

  return path;
}

/**
 * Render unmyelinated axon using quadratic bezier with CONSTANT width
 */
export function renderUnmyelinatedAxon(ctx, path, zoom = 1) {
  ctx.save();

  ctx.strokeStyle = path.strokeColor;
  ctx.lineWidth = path.strokeWidth / zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(path.x1, path.y1);
  ctx.quadraticCurveTo(path.controlX, path.controlY, path.x2, path.y2);
  ctx.stroke();

  // Show control point if in edit mode
  if (path.showControlPoint) {
    // Control point handle
    ctx.fillStyle = '#3498DB';
    ctx.beginPath();
    ctx.arc(path.controlX, path.controlY, 5 / zoom, 0, Math.PI * 2);
    ctx.fill();

    // Lines to endpoints
    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);

    ctx.beginPath();
    ctx.moveTo(path.x1, path.y1);
    ctx.lineTo(path.controlX, path.controlY);
    ctx.lineTo(path.x2, path.y2);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  ctx.restore();
}

/**
 * Check if point is near unmyelinated axon
 */
export function isPointOnUnmyelinatedAxon(path, px, py, tolerance = 10) {
  // Sample points along curve and check distance
  const numSamples = 20;
  let minDistance = Infinity;

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;

    // Quadratic bezier formula
    const x = Math.pow(1 - t, 2) * path.x1 +
              2 * (1 - t) * t * path.controlX +
              Math.pow(t, 2) * path.x2;

    const y = Math.pow(1 - t, 2) * path.y1 +
              2 * (1 - t) * t * path.controlY +
              Math.pow(t, 2) * path.y2;

    const distance = Math.sqrt(
      Math.pow(px - x, 2) + Math.pow(py - y, 2)
    );

    minDistance = Math.min(minDistance, distance);
  }

  return minDistance <= tolerance;
}

/**
 * Get point along curve at parameter t (0-1)
 */
export function getPointOnCurve(path, t) {
  const x = Math.pow(1 - t, 2) * path.x1 +
            2 * (1 - t) * t * path.controlX +
            Math.pow(t, 2) * path.x2;

  const y = Math.pow(1 - t, 2) * path.y1 +
            2 * (1 - t) * t * path.controlY +
            Math.pow(t, 2) * path.y2;

  return { x, y };
}

/**
 * Get tangent (direction) at parameter t
 */
export function getTangentOnCurve(path, t) {
  // Derivative of bezier curve
  const dx = 2 * (1 - t) * (path.controlX - path.x1) +
             2 * t * (path.x2 - path.controlX);

  const dy = 2 * (1 - t) * (path.controlY - path.y1) +
             2 * t * (path.y2 - path.controlY);

  const length = Math.sqrt(dx * dx + dy * dy);

  return {
    x: dx / length,
    y: dy / length
  };
}

/**
 * Create smooth unmyelinated axon with automatic nice curvature
 */
export function createSmoothAxon(x1, y1, x2, y2, curvature = 0.3) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular offset
  const perpX = -dy / length;
  const perpY = dx / length;

  const offset = length * curvature;

  return {
    type: 'unmyelinatedAxon',
    x1, y1, x2, y2,
    controlX: midX + perpX * offset,
    controlY: midY + perpY * offset,
    strokeWidth: 3,
    strokeColor: '#A93226'
  };
}
