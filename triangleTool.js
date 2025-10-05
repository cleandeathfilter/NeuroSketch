/**
 * Triangle Tool - For drawing triangular soma shapes (pyramidal neurons)
 *
 * Scientifically accurate for pyramidal neuron soma:
 * - Base width: 20-30px (15-25μm scaled)
 * - Height: 30-40px
 * - Shape: Triangular/pyramidal pointing upward
 *
 * Source: research/neurons/neuron-types.md (Pyramidal Neurons)
 */

export function startDrawingTriangle(x, y, state, config) {
  return {
    type: 'triangle',
    x: x,
    y: y,
    width: 30, // Will be updated as user drags
    height: 30,
    rotation: 0,
    fillColor: config.excitatory || '#E74C3C', // Excitatory neurons (research/color-coding.md)
    strokeColor: '#C0392B',
    strokeWidth: 2,
    pointingUp: true // For pyramidal neurons, apex points up
  };
}

export function updateTriangle(triangle, currentX, currentY) {
  const dx = currentX - triangle.x;
  const dy = currentY - triangle.y;

  // Make it centered on start point
  triangle.width = Math.abs(dx) * 2;
  triangle.height = Math.abs(dy) * 2;

  // Minimum size for visibility
  triangle.width = Math.max(triangle.width, 20);
  triangle.height = Math.max(triangle.height, 20);
}

export function finalizeTriangle(triangle) {
  // Ensure proportions are biologically reasonable
  // Pyramidal soma: roughly equilateral to slightly taller than wide
  if (triangle.height < triangle.width * 0.8) {
    triangle.height = triangle.width * 1.0;
  }

  return triangle;
}

/**
 * Calculate triangle vertices for rendering
 */
export function getTriangleVertices(triangle) {
  const hw = triangle.width / 2;
  const hh = triangle.height / 2;

  if (triangle.pointingUp) {
    return [
      { x: triangle.x, y: triangle.y - hh },           // Top apex
      { x: triangle.x - hw, y: triangle.y + hh },      // Bottom left
      { x: triangle.x + hw, y: triangle.y + hh }       // Bottom right
    ];
  } else {
    return [
      { x: triangle.x, y: triangle.y + hh },           // Bottom apex
      { x: triangle.x - hw, y: triangle.y - hh },      // Top left
      { x: triangle.x + hw, y: triangle.y - hh }       // Top right
    ];
  }
}

/**
 * Check if point is inside triangle
 */
export function isPointInTriangle(triangle, px, py) {
  const vertices = getTriangleVertices(triangle);
  const [v1, v2, v3] = vertices;

  // Use barycentric coordinates
  const denominator = ((v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y));
  const a = ((v2.y - v3.y) * (px - v3.x) + (v3.x - v2.x) * (py - v3.y)) / denominator;
  const b = ((v3.y - v1.y) * (px - v3.x) + (v1.x - v3.x) * (py - v3.y)) / denominator;
  const c = 1 - a - b;

  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}
