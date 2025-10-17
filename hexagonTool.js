// Compatibility wrapper for canvasRenderer.js
// Exports rendering functions for hexagon shapes

export function getHexagonVertices(obj) {
    const cx = obj.x;
    const cy = obj.y;
    const radius = obj.radius;
    
    const vertices = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
        vertices.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        });
    }
    return vertices;
}
