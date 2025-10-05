/**
 * Bipolar Soma Tool - For drawing bipolar neuron cell bodies
 *
 * Scientifically accurate for bipolar neurons:
 * - Oval/elliptical shape (15-30px width, 20-40px height)
 * - Two processes: one dendrite, one axon (opposite poles)
 * - Found in retina and olfactory epithelium
 * - Sensory neurons
 *
 * Source: Neuroscience textbooks (Bipolar Neurons)
 */

export function startDrawingBipolarSoma(x, y, state, config) {
  return {
    type: 'bipolarSoma',
    x: x,
    y: y,
    width: 20,
    height: 30,
    rotation: 0,
    fillColor: config.bipolarColor || '#9B59B6', // Purple (sensory)
    strokeColor: '#7D3C98',
    strokeWidth: 2
  };
}

export function updateBipolarSoma(soma, currentX, currentY) {
  const dx = currentX - soma.x;
  const dy = currentY - soma.y;

  soma.width = Math.abs(dx) * 2;
  soma.height = Math.abs(dy) * 2;

  // Minimum size
  soma.width = Math.max(soma.width, 15);
  soma.height = Math.max(soma.height, 20);
}

export function finalizeBipolarSoma(soma) {
  // Ensure height > width (elongated oval)
  if (soma.height < soma.width) {
    const temp = soma.height;
    soma.height = soma.width;
    soma.width = temp;
  }

  // Maintain reasonable proportions (height 1.2-1.8x width)
  if (soma.height > soma.width * 1.8) {
    soma.height = soma.width * 1.5;
  }

  return soma;
}

/**
 * Check if point is inside bipolar soma (ellipse)
 */
export function isPointInBipolarSoma(soma, px, py) {
  // Transform point to local coordinates considering rotation
  const dx = px - soma.x;
  const dy = py - soma.y;

  // Rotate point by negative rotation angle
  const angle = -(soma.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Check ellipse equation
  const rx = soma.width / 2;
  const ry = soma.height / 2;

  return (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1;
}
