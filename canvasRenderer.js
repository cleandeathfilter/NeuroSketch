/**
 * canvasRenderer.js - Modular canvas rendering system for NeuroSketch
 * Handles drawing all objects on the canvas, with support for skipping objects currently being edited
 */

import { getTriangleVertices } from './triangleTool.js';
import { getHexagonVertices } from './hexagonTool.js';
import { renderTaperedLine } from './taperedLineTool.js';
import { renderUnmyelinatedAxon } from './unmyelinatedAxonTool.js';
import { renderMyelinatedAxon } from './myelinatedAxonTool.js';
import { renderAxonHillock } from './axonHillockTool.js';
import { renderApicalDendrite } from './apicalDendriteTool.js';
import { graphToCanvas } from './graphTool.js';

/**
 * Draw an object on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} obj - Object to draw
 * @param {Object} editingObj - Object currently being edited (will be skipped)
 * @param {number} zoom - Current zoom level
 * @param {boolean} isDarkMode - Current theme mode
 */
export function drawObject(ctx, obj, editingObj = null, zoom = 1, isDarkMode = false) {
    // Skip objects currently being edited
    if (editingObj && obj === editingObj) {
        return;
    }

    // Apply rotation if object has rotation property
    const hasRotation = obj.rotation && obj.rotation !== 0;
    if (hasRotation) {
        ctx.save();
        // Calculate center point for rotation
        const center = getObjectCenter(obj);
        ctx.translate(center.x, center.y);
        ctx.rotate(obj.rotation * Math.PI / 180); // Convert degrees to radians
        ctx.translate(-center.x, -center.y);
    }

    if (obj.type === 'circle') {
        drawCircle(ctx, obj, zoom);
    } else if (obj.type === 'rectangle') {
        drawRectangle(ctx, obj, zoom);
    } else if (obj.type === 'line') {
        drawLine(ctx, obj, zoom);
    } else if (obj.type === 'text') {
        drawText(ctx, obj, zoom, isDarkMode);
    } else if (obj.type === 'triangle') {
        drawTriangle(ctx, obj, zoom);
    } else if (obj.type === 'hexagon') {
        drawHexagon(ctx, obj, zoom);
    } else if (obj.type === 'ellipse') {
        drawEllipse(ctx, obj, zoom);
    } else if (obj.type === 'taperedLine') {
        renderTaperedLine(ctx, obj, zoom);
    } else if (obj.type === 'unmyelinatedAxon') {
        renderUnmyelinatedAxon(ctx, obj, zoom);
    } else if (obj.type === 'myelinatedAxon') {
        renderMyelinatedAxon(ctx, obj, zoom);
    } else if (obj.type === 'axonHillock') {
        renderAxonHillock(ctx, obj, zoom);
    } else if (obj.type === 'apicalDendrite') {
        renderApicalDendrite(ctx, obj, zoom);
    } else if (obj.type === 'bipolarSoma') {
        drawBipolarSoma(ctx, obj, zoom);
    } else if (obj.type === 'freehand') {
        drawFreehand(ctx, obj, zoom);
    } else if (obj.type === 'image') {
        drawImage(ctx, obj, zoom);
    } else if (obj.type === 'graph') {
        drawGraph(ctx, obj, zoom, isDarkMode);
    }

    if (hasRotation) {
        ctx.restore();
    }
}

/**
 * Get the center point of an object for rotation
 */
function getObjectCenter(obj) {
    if (obj.type === 'circle') {
        return { x: obj.x, y: obj.y };
    } else if (obj.type === 'line' || obj.type === 'taperedLine' || obj.type === 'unmyelinatedAxon' || obj.type === 'myelinatedAxon' || obj.type === 'apicalDendrite') {
        return {
            x: (obj.x1 + obj.x2) / 2,
            y: (obj.y1 + obj.y2) / 2
        };
        return { x: obj.x, y: obj.y };
    } else if (obj.type === 'freehand') {
        // Calculate bounds for freehand
        if (!obj.points || obj.points.length === 0) return { x: 0, y: 0 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        obj.points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        return {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        };
    } else {
        // Rectangle, text, triangle, hexagon, ellipse, graph, curvedPath, image
        return {
            x: obj.x + (obj.width || 0) / 2,
            y: obj.y + (obj.height || 0) / 2
        };
    }
}

/**
 * Draw a circle object
 */
function drawCircle(ctx, obj, zoom) {
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);

    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    if (obj.strokeColor) {
        ctx.strokeStyle = obj.strokeColor;
        ctx.lineWidth = obj.strokeWidth / zoom;
        ctx.stroke();
    }
}

/**
 * Draw a rectangle object
 */
function drawRectangle(ctx, obj, zoom) {
    ctx.beginPath();
    ctx.rect(obj.x, obj.y, obj.width, obj.height);

    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    if (obj.strokeColor) {
        ctx.strokeStyle = obj.strokeColor;
        ctx.lineWidth = obj.strokeWidth / zoom;
        ctx.stroke();
    }
}

/**
 * Draw a line object
 */
function drawLine(ctx, obj, zoom) {
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y);
    ctx.lineTo(obj.x2, obj.y2);
    ctx.strokeStyle = obj.strokeColor;
    ctx.lineWidth = obj.strokeWidth / zoom;
    ctx.stroke();
}

/**
 * Draw a text object
 */
function drawText(ctx, obj, zoom, isDarkMode) {
    // Auto-resize textbox to fit content if not empty
    if (obj.text) {
        autoResizeTextbox(ctx, obj);
    }

    // Draw background if not transparent
    if (obj.backgroundColor !== 'transparent' && obj.backgroundOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = obj.backgroundOpacity;
        ctx.fillStyle = obj.backgroundColor;

        if (obj.borderRadius > 0) {
            roundRect(ctx, obj.x, obj.y, obj.width, obj.height, obj.borderRadius);
            ctx.fill();
        } else {
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
        ctx.restore();
    }

    // Draw border if enabled
    if (obj.hasBorder) {
        ctx.strokeStyle = obj.borderColor;
        ctx.lineWidth = obj.borderWidth / zoom;

        if (obj.borderRadius > 0) {
            roundRect(ctx, obj.x, obj.y, obj.width, obj.height, obj.borderRadius);
            ctx.stroke();
        } else {
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
    }

    // Draw text content
    if (obj.text) {
        drawTextContent(ctx, obj, zoom);
    } else {
        // Draw placeholder text
        drawPlaceholderText(ctx, obj, zoom, isDarkMode);
    }
}

/**
 * Draw the actual text content
 */
function drawTextContent(ctx, obj, zoom) {
    ctx.save();

    // Set font (actual size, canvas will scale it)
    const fontSize = obj.fontSize;
    ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${fontSize}px ${obj.fontFamily}`;
    ctx.fillStyle = obj.textColor;
    ctx.textBaseline = 'top';

    const lines = obj.text.split('\n');
    const lineHeight = fontSize * obj.lineHeight;
    const padding = 5;

    lines.forEach((line, index) => {
        let x = obj.x + padding;

        // Apply text alignment
        if (obj.textAlign === 'center') {
            x = obj.x + obj.width / 2;
            ctx.textAlign = 'center';
        } else if (obj.textAlign === 'right') {
            x = obj.x + obj.width - padding;
            ctx.textAlign = 'right';
        } else {
            ctx.textAlign = 'left';
        }

        const y = obj.y + padding + (index * lineHeight);

        if (line.trim() || lines.length === 1) {
            ctx.fillText(line, x, y);
        }
    });

    ctx.restore();
}

/**
 * Draw placeholder text for empty textboxes
 */
function drawPlaceholderText(ctx, obj, zoom, isDarkMode) {
    ctx.save();

    const fontSize = obj.fontSize;
    ctx.font = `italic ${obj.fontWeight} ${fontSize}px ${obj.fontFamily}`;
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const x = obj.x + 5;
    const y = obj.y + 5;

    ctx.fillText('Type here...', x, y);

    ctx.restore();
}

/**
 * Auto-resize textbox to fit content
 */
function autoResizeTextbox(ctx, obj) {
    // Don't auto-resize if user has manually resized the textbox
    if (obj.manualResize) {
        return;
    }

    if (!obj.text) {
        // Set minimum size for empty textboxes
        obj.width = Math.max(obj.width, 100);
        obj.height = Math.max(obj.height, 30);
        return;
    }

    ctx.save();

    // Use actual font size for measurement
    const fontSize = obj.fontSize;
    ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${fontSize}px ${obj.fontFamily}`;

    const lines = obj.text.split('\n');
    const lineHeight = fontSize * obj.lineHeight;
    const padding = 10; // 5px on each side

    // Calculate required width (longest line)
    let maxWidth = 0;
    lines.forEach(line => {
        if (line.trim() === '') {
            // Empty line still takes some space
            const spaceMetrics = ctx.measureText(' ');
            maxWidth = Math.max(maxWidth, spaceMetrics.width);
        } else {
            const metrics = ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        }
    });

    // Calculate required height
    const textHeight = lines.length * lineHeight;

    // Update textbox dimensions with minimum sizes
    obj.width = Math.max(maxWidth + padding, 50);
    obj.height = Math.max(textHeight + padding, 30);

    ctx.restore();
}

/**
 * Draw rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Draw selection handles for an object
 */
export function drawSelection(ctx, obj, zoom, isDarkMode) {
    // Apply rotation transform if object has rotation
    const hasRotation = obj.rotation && obj.rotation !== 0;
    if (hasRotation) {
        ctx.save();
        const center = getObjectCenter(obj);
        ctx.translate(center.x, center.y);
        ctx.rotate(obj.rotation * Math.PI / 180);
        ctx.translate(-center.x, -center.y);
    }

    let bounds;

    if (obj.type === 'circle') {
        bounds = {
            left: obj.x - obj.radius,
            right: obj.x + obj.radius,
            top: obj.y - obj.radius,
            bottom: obj.y + obj.radius
        };
    } else if (obj.type === 'rectangle') {
        bounds = {
            left: Math.min(obj.x, obj.x + obj.width),
            right: Math.max(obj.x, obj.x + obj.width),
            top: Math.min(obj.y, obj.y + obj.height),
            bottom: Math.max(obj.y, obj.y + obj.height)
        };
    } else if (obj.type === 'text') {
        bounds = {
            left: obj.x,
            right: obj.x + obj.width,
            top: obj.y,
            bottom: obj.y + obj.height
        };
    } else if (obj.type === 'line') {
        bounds = {
            left: Math.min(obj.x, obj.x2) - 5 / zoom,
            right: Math.max(obj.x, obj.x2) + 5 / zoom,
            top: Math.min(obj.y, obj.y2) - 5 / zoom,
            bottom: Math.max(obj.y, obj.y2) + 5 / zoom
        };
    } else if (obj.type === 'triangle') {
        bounds = {
            left: obj.x - obj.width / 2,
            right: obj.x + obj.width / 2,
            top: obj.y - obj.height / 2,
            bottom: obj.y + obj.height / 2
        };
    } else if (obj.type === 'hexagon') {
        bounds = {
            left: obj.x - obj.radius,
            right: obj.x + obj.radius,
            top: obj.y - obj.radius,
            bottom: obj.y + obj.radius
        };
    } else if (obj.type === 'ellipse') {
        bounds = {
            left: obj.x - obj.radiusX,
            right: obj.x + obj.radiusX,
            top: obj.y - obj.radiusY,
            bottom: obj.y + obj.radiusY
        };
    } else if (obj.type === 'taperedLine') {
        bounds = {
            left: Math.min(obj.x1, obj.x2) - obj.baseWidth / 2,
            right: Math.max(obj.x1, obj.x2) + obj.baseWidth / 2,
            top: Math.min(obj.y1, obj.y2) - obj.baseWidth / 2,
            bottom: Math.max(obj.y1, obj.y2) + obj.baseWidth / 2
        };
    } else if (obj.type === 'unmyelinatedAxon') {
        bounds = {
            left: Math.min(obj.x1, obj.x2, obj.controlX) - obj.strokeWidth,
            right: Math.max(obj.x1, obj.x2, obj.controlX) + obj.strokeWidth,
            top: Math.min(obj.y1, obj.y2, obj.controlY) - obj.strokeWidth,
            bottom: Math.max(obj.y1, obj.y2, obj.controlY) + obj.strokeWidth
        };
    } else if (obj.type === 'myelinatedAxon') {
        bounds = {
            left: Math.min(obj.x1, obj.x2) - obj.myelinWidth / 2,
            right: Math.max(obj.x1, obj.x2) + obj.myelinWidth / 2,
            top: Math.min(obj.y1, obj.y2) - obj.myelinWidth / 2,
            bottom: Math.max(obj.y1, obj.y2) + obj.myelinWidth / 2
        };
    } else if (obj.type === 'axonHillock') {
        const cos = Math.cos(obj.angle);
        const sin = Math.sin(obj.angle);
        const endX = obj.x + obj.length * cos;
        const endY = obj.y + obj.length * sin;
        const maxWidth = Math.max(obj.baseWidth, obj.tipWidth);
        bounds = {
            left: Math.min(obj.x, endX) - maxWidth,
            right: Math.max(obj.x, endX) + maxWidth,
            top: Math.min(obj.y, endY) - maxWidth,
            bottom: Math.max(obj.y, endY) + maxWidth
        };
    } else if (obj.type === 'apicalDendrite') {
        bounds = {
            left: Math.min(obj.x1, obj.x2) - obj.baseWidth / 2,
            right: Math.max(obj.x1, obj.x2) + obj.baseWidth / 2,
            top: Math.min(obj.y1, obj.y2) - obj.baseWidth / 2,
            bottom: Math.max(obj.y1, obj.y2) + obj.baseWidth / 2
        };
    } else if (obj.type === 'bipolarSoma') {
        const hw = obj.width / 2;
        const hh = obj.height / 2;
        const maxDim = Math.max(hw, hh);
        bounds = {
            left: obj.x - maxDim,
            right: obj.x + maxDim,
            top: obj.y - maxDim,
            bottom: obj.y + maxDim
        };
    } else if (obj.type === 'image') {
        bounds = {
            left: obj.x,
            right: obj.x + obj.width,
            top: obj.y,
            bottom: obj.y + obj.height
        };
    } else if (obj.type === 'freehand') {
        // Calculate bounds from all points
        if (obj.points && obj.points.length > 0) {
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            obj.points.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
            });
            bounds = {left: minX, right: maxX, top: minY, bottom: maxY};
        } else {
            bounds = {left: obj.x - 20, right: obj.x + 20, top: obj.y - 20, bottom: obj.y + 20};
        }
    } else {
        // Default bounds for unknown types
        bounds = {
            left: obj.x - 20,
            right: obj.x + 20,
            top: obj.y - 20,
            bottom: obj.y + 20
        };
    }

    // Draw selection box
    ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(
        bounds.left,
        bounds.top,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top
    );
    ctx.setLineDash([]);

    // Draw resize handles (increased from 6 to 10 for better visibility and UX)
    const handleSize = 10 / zoom;
    ctx.fillStyle = isDarkMode ? '#000000' : '#FFFFFF';
    ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.lineWidth = 2 / zoom;

    let handles = [];

    if (obj.type === 'line') {
        // For lines, show handles at start and end points
        handles = [
            {x: obj.x, y: obj.y},
            {x: obj.x2, y: obj.y2}
        ];
    } else if (obj.type === 'taperedLine') {
        // For tapered lines, show handles at start and end points
        handles = [
            {x: obj.x1, y: obj.y1},
            {x: obj.x2, y: obj.y2}
        ];
    } else if (obj.type === 'unmyelinatedAxon') {
        // For unmyelinated axons, show handles at start, end, and control point
        handles = [
            {x: obj.x1, y: obj.y1},
            {x: obj.x2, y: obj.y2},
            {x: obj.controlX, y: obj.controlY}
        ];
    } else if (obj.type === 'myelinatedAxon') {
        // For myelinated axons, show handles at start and end points
        handles = [
            {x: obj.x1, y: obj.y1},
            {x: obj.x2, y: obj.y2}
        ];
    } else if (obj.type === 'axonHillock') {
        // For axon hillocks, show handle at base only
        handles = [
            {x: obj.x, y: obj.y}
        ];
        // For axon terminals, show center handle
        handles = [
            {x: obj.x, y: obj.y}
        ];
    } else if (obj.type === 'apicalDendrite') {
        // For apical dendrites, show handles at start and end points
        handles = [
            {x: obj.x1, y: obj.y1},
            {x: obj.x2, y: obj.y2}
        ];
    } else if (obj.type === 'bipolarSoma') {
        // For bipolar somas, show all 8 handles
        handles = [
            {x: bounds.left, y: bounds.top},
            {x: bounds.right, y: bounds.top},
            {x: bounds.left, y: bounds.bottom},
            {x: bounds.right, y: bounds.bottom},
            {x: (bounds.left + bounds.right) / 2, y: bounds.top},
            {x: (bounds.left + bounds.right) / 2, y: bounds.bottom},
            {x: bounds.left, y: (bounds.top + bounds.bottom) / 2},
            {x: bounds.right, y: (bounds.top + bounds.bottom) / 2}
        ];
    } else {
        // For text, circles, rectangles, triangles, hexagons, ellipses, images - show all 8 handles
        handles = [
            {x: bounds.left, y: bounds.top},
            {x: bounds.right, y: bounds.top},
            {x: bounds.left, y: bounds.bottom},
            {x: bounds.right, y: bounds.bottom},
            {x: (bounds.left + bounds.right) / 2, y: bounds.top},
            {x: (bounds.left + bounds.right) / 2, y: bounds.bottom},
            {x: bounds.left, y: (bounds.top + bounds.bottom) / 2},
            {x: bounds.right, y: (bounds.top + bounds.bottom) / 2}
        ];
    }

    handles.forEach((h, index) => {
        // Make control point for curved path distinct (third handle)
        if (obj.type === 'curvedPath' && index === 2) {
            ctx.fillStyle = '#3498DB'; // Blue for control point
            ctx.beginPath();
            ctx.arc(h.x, h.y, handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
            // Reset for other handles
            ctx.fillStyle = isDarkMode ? '#000000' : '#FFFFFF';
            ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
        } else {
            ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        }
    });

    // Draw rotation handle (stays in rotated space so it moves with object)
    // Skip rotation handle for linear structures (dendrites, axons, hillocks, terminals)
    if (obj.type !== 'taperedLine' && obj.type !== 'unmyelinatedAxon' && obj.type !== 'myelinatedAxon' &&
        obj.type !== 'axonHillock' && obj.type !== 'apicalDendrite') {
        // Position it at the top center of the bounds
        // Use larger distance for smaller objects to prevent overly sensitive rotation
        const objectHeight = bounds.bottom - bounds.top;
        const minDistance = 40 / zoom; // Minimum distance from bounds
        const handleDistance = Math.max(minDistance, objectHeight * 0.3);

        const centerX = (bounds.left + bounds.right) / 2;
        const rotateHandleY = bounds.top - handleDistance;
        const arrowSize = 12 / zoom;

        // Draw curved arrow for rotation
        ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.lineWidth = 2 / zoom;

    // Draw arc (curved part of arrow)
    ctx.beginPath();
    ctx.arc(centerX, rotateHandleY, arrowSize / 2, -Math.PI * 0.3, Math.PI * 1.3, false);
    ctx.stroke();

    // Draw arrow head at the end of arc
    const arrowHeadAngle = Math.PI * 1.3;
    const arrowHeadX = centerX + (arrowSize / 2) * Math.cos(arrowHeadAngle);
    const arrowHeadY = rotateHandleY + (arrowSize / 2) * Math.sin(arrowHeadAngle);

    // Arrow head pointing direction
    const arrowAngle = arrowHeadAngle + Math.PI / 2;
    const arrowHeadSize = 6 / zoom;

    ctx.beginPath();
    ctx.moveTo(arrowHeadX, arrowHeadY);
    ctx.lineTo(
        arrowHeadX + arrowHeadSize * Math.cos(arrowAngle - 0.4),
        arrowHeadY + arrowHeadSize * Math.sin(arrowAngle - 0.4)
    );
    ctx.lineTo(
        arrowHeadX + arrowHeadSize * Math.cos(arrowAngle + 0.4),
        arrowHeadY + arrowHeadSize * Math.sin(arrowAngle + 0.4)
    );
    ctx.closePath();
    ctx.fill();
    }

    // Restore rotation transform after drawing rotation handle
    if (hasRotation) {
        ctx.restore();
    }
}

/**
 * Draw a triangle object (pyramidal neuron soma)
 */
function drawTriangle(ctx, obj, zoom) {
    const vertices = getTriangleVertices(obj);

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    ctx.lineTo(vertices[1].x, vertices[1].y);
    ctx.lineTo(vertices[2].x, vertices[2].y);
    ctx.closePath();

    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    if (obj.strokeColor) {
        ctx.strokeStyle = obj.strokeColor;
        ctx.lineWidth = obj.strokeWidth / zoom;
        ctx.stroke();
    }
}

/**
 * Draw a hexagon object (motor neuron soma)
 */
function drawHexagon(ctx, obj, zoom) {
    const vertices = getHexagonVertices(obj);

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();

    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    if (obj.strokeColor) {
        ctx.strokeStyle = obj.strokeColor;
        ctx.lineWidth = obj.strokeWidth / zoom;
        ctx.stroke();
    }
}

/**
 * Draw an ellipse object (various neuron soma)
 */
function drawEllipse(ctx, obj, zoom) {
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y, obj.radiusX, obj.radiusY, obj.rotation || 0, 0, Math.PI * 2);

    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    if (obj.strokeColor) {
        ctx.strokeStyle = obj.strokeColor;
        ctx.lineWidth = obj.strokeWidth / zoom;
        ctx.stroke();
    }
}

/**
 * Draw a bipolar soma (oval neuron cell body)
 */
function drawBipolarSoma(ctx, obj, zoom) {
    ctx.beginPath();
    const rx = obj.width / 2;
    const ry = obj.height / 2;
    ctx.ellipse(obj.x, obj.y, rx, ry, (obj.rotation || 0) * Math.PI / 180, 0, Math.PI * 2);

    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    if (obj.strokeColor) {
        ctx.strokeStyle = obj.strokeColor;
        ctx.lineWidth = obj.strokeWidth / zoom;
        ctx.stroke();
    }
}
/**
 * Draw an image object
 */
function drawImage(ctx, obj, zoom) {
    if (!obj.imageElement) {
        // If image element doesn't exist, try to recreate it from src
        if (obj.src) {
            const img = new Image();
            img.onload = () => {
                obj.imageElement = img;
            };
            img.src = obj.src;
        }
        return;
    }

    ctx.save();

    // Apply opacity
    if (obj.opacity !== undefined) {
        ctx.globalAlpha = obj.opacity;
    }

    // Draw the image
    ctx.drawImage(
        obj.imageElement,
        obj.x,
        obj.y,
        obj.width,
        obj.height
    );

    ctx.restore();
}

/**
 * Draw a freehand path object with smooth Bezier curves
 */
function drawFreehand(ctx, obj, zoom) {
    if (!obj.points || obj.points.length < 2) return;

    ctx.save();

    ctx.strokeStyle = obj.strokeColor || '#000000';
    ctx.lineWidth = obj.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    // Move to first point
    ctx.moveTo(obj.points[0].x, obj.points[0].y);

    if (obj.points.length === 2) {
        // Just draw a line if only 2 points
        ctx.lineTo(obj.points[1].x, obj.points[1].y);
    } else {
        // Draw smooth curves through points using quadratic Bezier curves
        // This creates smooth curves by using midpoints as curve endpoints
        for (let i = 1; i < obj.points.length - 2; i++) {
            const xc = (obj.points[i].x + obj.points[i + 1].x) / 2;
            const yc = (obj.points[i].y + obj.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(obj.points[i].x, obj.points[i].y, xc, yc);
        }

        // Draw the last two points
        if (obj.points.length >= 2) {
            ctx.quadraticCurveTo(
                obj.points[obj.points.length - 2].x,
                obj.points[obj.points.length - 2].y,
                obj.points[obj.points.length - 1].x,
                obj.points[obj.points.length - 1].y
            );
        }
    }

    // Close path if specified
    if (obj.closed) {
        ctx.closePath();
    }

    // Stroke the path
    ctx.stroke();

    // Fill if specified
    if (obj.fillColor && obj.fillColor !== 'transparent') {
        ctx.fillStyle = obj.fillColor;
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draw a scientific graph object
 */
function drawGraph(ctx, graph, zoom, isDarkMode) {
    ctx.save();

    // Draw background
    if (graph.backgroundColor === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(graph.x, graph.y, graph.width, graph.height);
    }

    // Draw border
    ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(graph.x, graph.y, graph.width, graph.height);

    // Set up clipping region to keep everything inside graph bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(graph.x, graph.y, graph.width, graph.height);
    ctx.clip();

    // Draw grid if enabled
    if (graph.showGrid) {
        drawGraphGrid(ctx, graph, zoom, isDarkMode);
    }

    // Draw axes
    if (graph.showAxes) {
        drawGraphAxes(ctx, graph, zoom, isDarkMode);
    }

    // Draw reference lines (threshold, resting)
    if (graph.thresholdLine && graph.thresholdLine.show) {
        drawReferenceLine(ctx, graph, graph.thresholdLine.value, graph.thresholdLine.color, zoom);
    }
    if (graph.restingLine && graph.restingLine.show) {
        drawReferenceLine(ctx, graph, graph.restingLine.value, graph.restingLine.color, zoom);
    }

    // Draw the main curve
    drawGraphCurve(ctx, graph, zoom);

    // Draw point labels if enabled
    if (graph.showLabels) {
        drawPointLabels(ctx, graph, zoom, isDarkMode);
    }

    ctx.restore(); // Restore after clipping

    // Draw axis labels (outside clip region)
    if (graph.showAxes) {
        drawAxisLabels(ctx, graph, zoom, isDarkMode);
    }

    ctx.restore();
}

/**
 * Draw grid lines for graph
 */
function drawGraphGrid(ctx, graph, zoom, isDarkMode) {
    ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1 / zoom;

    const xRange = graph.xMax - graph.xMin;
    const yRange = graph.yMax - graph.yMin;

    // Determine grid spacing (aim for ~10 divisions)
    const xStep = Math.pow(10, Math.floor(Math.log10(xRange / 10)));
    const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 10)));

    // Vertical grid lines
    for (let x = Math.ceil(graph.xMin / xStep) * xStep; x <= graph.xMax; x += xStep) {
        const canvasPos = graphToCanvas(x, 0, graph);
        ctx.beginPath();
        ctx.moveTo(canvasPos.x, graph.y);
        ctx.lineTo(canvasPos.x, graph.y + graph.height);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = Math.ceil(graph.yMin / yStep) * yStep; y <= graph.yMax; y += yStep) {
        const canvasPos = graphToCanvas(0, y, graph);
        ctx.beginPath();
        ctx.moveTo(graph.x, canvasPos.y);
        ctx.lineTo(graph.x + graph.width, canvasPos.y);
        ctx.stroke();
    }
}

/**
 * Draw axes for graph
 */
function drawGraphAxes(ctx, graph, zoom, isDarkMode) {
    ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.lineWidth = 2 / zoom;

    // Y-axis (left edge)
    ctx.beginPath();
    ctx.moveTo(graph.x, graph.y);
    ctx.lineTo(graph.x, graph.y + graph.height);
    ctx.stroke();

    // X-axis (bottom edge)
    ctx.beginPath();
    ctx.moveTo(graph.x, graph.y + graph.height);
    ctx.lineTo(graph.x + graph.width, graph.y + graph.height);
    ctx.stroke();

    // Draw tick marks
    drawGraphTicks(ctx, graph, zoom, isDarkMode);
}

/**
 * Draw tick marks on axes
 */
function drawGraphTicks(ctx, graph, zoom, isDarkMode) {
    ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.lineWidth = 1 / zoom;
    ctx.font = `${10 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const xRange = graph.xMax - graph.xMin;
    const yRange = graph.yMax - graph.yMin;
    const xStep = Math.pow(10, Math.floor(Math.log10(xRange / 10)));
    const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 10)));

    const tickSize = 5 / zoom;

    // X-axis ticks
    for (let x = Math.ceil(graph.xMin / xStep) * xStep; x <= graph.xMax; x += xStep) {
        const canvasPos = graphToCanvas(x, 0, graph);
        ctx.beginPath();
        ctx.moveTo(canvasPos.x, graph.y + graph.height);
        ctx.lineTo(canvasPos.x, graph.y + graph.height + tickSize);
        ctx.stroke();

        // Tick label
        ctx.fillText(x.toFixed(1), canvasPos.x, graph.y + graph.height + tickSize + 2 / zoom);
    }

    // Y-axis ticks
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(graph.yMin / yStep) * yStep; y <= graph.yMax; y += yStep) {
        const canvasPos = graphToCanvas(0, y, graph);
        ctx.beginPath();
        ctx.moveTo(graph.x - tickSize, canvasPos.y);
        ctx.lineTo(graph.x, canvasPos.y);
        ctx.stroke();

        // Tick label
        ctx.fillText(y.toFixed(0), graph.x - tickSize - 2 / zoom, canvasPos.y);
    }
}

/**
 * Draw axis labels
 */
function drawAxisLabels(ctx, graph, zoom, isDarkMode) {
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.font = `bold ${12 / zoom}px Arial`;

    // X-axis label (bottom center)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(graph.xLabel, graph.x + graph.width / 2, graph.y + graph.height + 30 / zoom);

    // Y-axis label (left, rotated)
    ctx.save();
    ctx.translate(graph.x - 40 / zoom, graph.y + graph.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(graph.yLabel, 0, 0);
    ctx.restore();
}

/**
 * Draw a reference line (threshold, resting, etc.)
 */
function drawReferenceLine(ctx, graph, yValue, color, zoom) {
    const startPos = graphToCanvas(graph.xMin, yValue, graph);
    const endPos = graphToCanvas(graph.xMax, yValue, graph);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
}

/**
 * Draw the main curve using Bezier interpolation
 */
function drawGraphCurve(ctx, graph, zoom) {
    if (!graph.curvePoints || graph.curvePoints.length < 2) return;

    ctx.strokeStyle = graph.lineColor;
    ctx.lineWidth = graph.lineWidth / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    // Convert first point to canvas space
    const firstPoint = graphToCanvas(graph.curvePoints[0].x, graph.curvePoints[0].y, graph);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    // Draw smooth curve through all points
    // We'll use quadratic Bezier curves where control points alternate
    let i = 1;
    while (i < graph.curvePoints.length) {
        if (i < graph.curvePoints.length - 1) {
            // Use current point as control, next as endpoint
            const cp = graphToCanvas(graph.curvePoints[i].x, graph.curvePoints[i].y, graph);
            const ep = graphToCanvas(graph.curvePoints[i + 1].x, graph.curvePoints[i + 1].y, graph);
            ctx.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y);
            i += 2;
        } else {
            // Last point, just line to it
            const lp = graphToCanvas(graph.curvePoints[i].x, graph.curvePoints[i].y, graph);
            ctx.lineTo(lp.x, lp.y);
            i++;
        }
    }

    ctx.stroke();
}

/**
 * Draw point labels on the curve
 */
function drawPointLabels(ctx, graph, zoom, isDarkMode) {
    if (!graph.curvePoints) return;

    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.font = `bold ${9 / zoom}px Arial`;
    ctx.textAlign = 'center';

    for (const point of graph.curvePoints) {
        if (point.label && point.type === 'anchor') {
            const canvasPos = graphToCanvas(point.x, point.y, graph);

            // Draw phase label above point
            ctx.textBaseline = 'bottom';
            ctx.fillText(point.label, canvasPos.x, canvasPos.y - 8 / zoom);

            // Draw voltage value below point
            ctx.font = `${8 / zoom}px Arial`;
            ctx.textBaseline = 'top';
            ctx.fillStyle = isDarkMode ? '#AAA' : '#666';
            ctx.fillText(`${point.y.toFixed(0)}mV`, canvasPos.x, canvasPos.y + 3 / zoom);

            // Reset font and color for next point
            ctx.font = `bold ${9 / zoom}px Arial`;
            ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        }
    }
}

/**
 * Draw selection handles for graph control points
 */
export function drawGraphSelection(ctx, graph, zoom) {
    if (!graph.curvePoints) return;

    ctx.save();

    // Draw bounding box
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(graph.x, graph.y, graph.width, graph.height);
    ctx.setLineDash([]);

    // Draw control point handles
    for (const point of graph.curvePoints) {
        const canvasPos = graphToCanvas(point.x, point.y, graph);

        // Draw handle
        if (point.type === 'anchor') {
            // Anchor points: blue squares
            ctx.fillStyle = '#3498DB';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2 / zoom;
            const size = 8 / zoom;
            ctx.fillRect(canvasPos.x - size/2, canvasPos.y - size/2, size, size);
            ctx.strokeRect(canvasPos.x - size/2, canvasPos.y - size/2, size, size);
        } else {
            // Control points: smaller circles
            ctx.fillStyle = '#E74C3C';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.arc(canvasPos.x, canvasPos.y, 5 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    // Draw resize handles at corners
    const handleSize = 8 / zoom;
    const handles = [
        {x: graph.x, y: graph.y}, // nw
        {x: graph.x + graph.width, y: graph.y}, // ne
        {x: graph.x, y: graph.y + graph.height}, // sw
        {x: graph.x + graph.width, y: graph.y + graph.height} // se
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 / zoom;

    for (const handle of handles) {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    }

    ctx.restore();
}
