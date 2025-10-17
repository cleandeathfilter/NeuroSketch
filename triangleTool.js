// Compatibility wrapper for canvasRenderer.js
// Exports rendering functions for triangle shapes

export function getTriangleVertices(obj) {
    const cx = obj.x;
    const cy = obj.y;
    const width = obj.width;
    const height = obj.height;
    
    // Calculate three vertices of equilateral triangle
    return [
        { x: cx, y: cy - height / 2 },           // Top
        { x: cx - width / 2, y: cy + height / 2 }, // Bottom left
        { x: cx + width / 2, y: cy + height / 2 }  // Bottom right
    ];
}
