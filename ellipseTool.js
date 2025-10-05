/**
 * Ellipse Tool - For drawing elliptical/oval soma shapes
 *
 * Scientifically accurate for various neuron types:
 * - Purkinje cells: Flask/pear-shaped (35-45px)
 * - Interneurons: Small circular to oval (20-30px)
 * - Sensory neurons: Spherical to ovoid (30-60px)
 *
 * Source: research/neurons/neuron-types.md
 */

export function startDrawingEllipse(x, y, state, config) {
  return {
    type: 'ellipse',
    x: x,
    y: y,
    radiusX: 25,
    radiusY: 25,
    rotation: 0,
    fillColor: config.genericNeuron || '#7F8C8D', // Generic gray (research/color-coding.md)
    strokeColor: '#5D6D7E',
    strokeWidth: 2
  };
}

export function updateEllipse(ellipse, currentX, currentY) {
  ellipse.radiusX = Math.abs(currentX - ellipse.x);
  ellipse.radiusY = Math.abs(currentY - ellipse.y);

  // Minimum size for visibility
  ellipse.radiusX = Math.max(ellipse.radiusX, 10);
  ellipse.radiusY = Math.max(ellipse.radiusY, 10);
}

export function finalizeEllipse(ellipse) {
  // Ensure biologically reasonable aspect ratio
  // Most neuron soma are roughly circular to moderately elongated
  const aspectRatio = ellipse.radiusX / ellipse.radiusY;

  // If too elongated, adjust to reasonable proportions
  if (aspectRatio > 2.5) {
    ellipse.radiusY = ellipse.radiusX / 2.5;
  } else if (aspectRatio < 0.4) {
    ellipse.radiusX = ellipse.radiusY * 0.4;
  }

  return ellipse;
}

/**
 * Check if point is inside ellipse
 */
export function isPointInEllipse(ellipse, px, py) {
  const dx = px - ellipse.x;
  const dy = py - ellipse.y;

  // Ellipse equation: (dx/rx)^2 + (dy/ry)^2 <= 1
  const normalizedX = dx / ellipse.radiusX;
  const normalizedY = dy / ellipse.radiusY;

  return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
}

/**
 * Get bounding box for ellipse
 */
export function getEllipseBounds(ellipse) {
  return {
    x: ellipse.x - ellipse.radiusX,
    y: ellipse.y - ellipse.radiusY,
    width: ellipse.radiusX * 2,
    height: ellipse.radiusY * 2
  };
}
