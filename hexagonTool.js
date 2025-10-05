/**
 * Hexagon Tool - For drawing hexagonal/polygonal soma shapes
 *
 * Scientifically accurate for motor neuron soma:
 * - Diameter: 50-80px (50-80μm scaled)
 * - Shape: Polygonal to stellate (star-shaped)
 * - Used for multipolar neurons (motor, interneurons)
 *
 * Source: research/neurons/neuron-types.md (Motor Neurons)
 */

export function startDrawingHexagon(x, y, state, config) {
  return {
    type: 'hexagon',
    x: x,
    y: y,
    radius: 30, // Will be updated as user drags
    rotation: 0,
    sides: 6, // Regular hexagon (can be 5-7 for stellate variation)
    fillColor: config.motorNeuron || '#4A90E2', // Motor neuron blue (research/color-coding.md)
    strokeColor: '#2E5F8D',
    strokeWidth: 2
  };
}

export function updateHexagon(hexagon, currentX, currentY) {
  const dx = currentX - hexagon.x;
  const dy = currentY - hexagon.y;

  hexagon.radius = Math.sqrt(dx * dx + dy * dy);

  // Minimum size for visibility
  hexagon.radius = Math.max(hexagon.radius, 15);
}

export function finalizeHexagon(hexagon) {
  // Motor neurons have large soma: 50-80px typical
  // If too small, adjust to reasonable size
  if (hexagon.radius < 25) {
    hexagon.radius = 30; // Default to 60px diameter
  }

  return hexagon;
}

/**
 * Calculate hexagon vertices for rendering
 */
export function getHexagonVertices(hexagon) {
  const vertices = [];
  const sides = hexagon.sides || 6;
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = hexagon.rotation || 0;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + angleStep * i;
    vertices.push({
      x: hexagon.x + hexagon.radius * Math.cos(angle),
      y: hexagon.y + hexagon.radius * Math.sin(angle)
    });
  }

  return vertices;
}

/**
 * Check if point is inside hexagon
 */
export function isPointInHexagon(hexagon, px, py) {
  const dx = px - hexagon.x;
  const dy = py - hexagon.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Simple circle test (hexagon is inscribed in this circle)
  return distance <= hexagon.radius;
}

/**
 * Get irregular polygon for stellate (star-shaped) soma
 * Used for motor neurons with irregular shape
 */
export function getStellateVertices(hexagon) {
  const vertices = [];
  const sides = hexagon.sides || 6;
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = hexagon.rotation || 0;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + angleStep * i;
    // Vary radius slightly for irregular stellate shape
    const radiusVariation = 0.9 + Math.random() * 0.2; // 90-110% of radius
    const r = hexagon.radius * radiusVariation;

    vertices.push({
      x: hexagon.x + r * Math.cos(angle),
      y: hexagon.y + r * Math.sin(angle)
    });
  }

  return vertices;
}
