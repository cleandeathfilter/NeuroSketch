/**
 * ObjectRenderer - View layer for rendering canvas objects
 *
 * Purpose: Separate rendering logic from business logic
 *
 * Pattern: MVC Pattern (from CLAUDE.md Pattern 0.5) - VIEW component
 *
 * Benefits:
 * - Rendering can be swapped (Canvas API → WebGL → SVG)
 * - Models remain platform-independent
 * - Easy to add new rendering styles (themes, export formats)
 * - Can render same model in multiple ways
 *
 * Integration: Works alongside existing canvasRenderer.js during migration
 */

/**
 * Base renderer class for all object types
 */
export class Renderer {
    /**
     * Render an object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {BaseObject} model - Object model to render
     * @param {number} zoom - Current zoom level
     */
    static render(ctx, model, zoom) {
        throw new Error(`render() not implemented for ${this.constructor.name}`);
    }

    /**
     * Render selection UI for an object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {BaseObject} model - Selected object model
     * @param {number} zoom - Current zoom level
     */
    static renderSelection(ctx, model, zoom) {
        // Default: Draw bounding box with resize handles
        const bounds = model.getBounds();

        ctx.save();

        // Dotted bounding box
        ctx.strokeStyle = '#3498DB';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.strokeRect(
            bounds.left,
            bounds.top,
            bounds.right - bounds.left,
            bounds.bottom - bounds.top
        );

        ctx.setLineDash([]);

        // 8 resize handles (corners + edges)
        const handleSize = 10 / zoom;
        const handles = [
            {x: bounds.left, y: bounds.top},                                    // nw
            {x: (bounds.left + bounds.right) / 2, y: bounds.top},              // n
            {x: bounds.right, y: bounds.top},                                   // ne
            {x: bounds.right, y: (bounds.top + bounds.bottom) / 2},            // e
            {x: bounds.right, y: bounds.bottom},                                // se
            {x: (bounds.left + bounds.right) / 2, y: bounds.bottom},           // s
            {x: bounds.left, y: bounds.bottom},                                 // sw
            {x: bounds.left, y: (bounds.top + bounds.bottom) / 2}              // w
        ];

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#3498DB';
        ctx.lineWidth = 2 / zoom;

        handles.forEach(handle => {
            ctx.fillRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
            ctx.strokeRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
        });

        ctx.restore();
    }
}

/**
 * Circle renderer
 */
export class CircleRenderer extends Renderer {
    static render(ctx, model, zoom) {
        ctx.save();

        ctx.beginPath();
        ctx.arc(model.x, model.y, model.radius, 0, Math.PI * 2);

        if (model.fillColor) {
            ctx.fillStyle = model.fillColor;
            ctx.fill();
        }

        if (model.strokeColor && model.strokeWidth) {
            ctx.strokeStyle = model.strokeColor;
            ctx.lineWidth = model.strokeWidth;
            ctx.stroke();
        }

        ctx.restore();
    }
}

/**
 * Rectangle renderer
 */
export class RectangleRenderer extends Renderer {
    static render(ctx, model, zoom) {
        ctx.save();

        const x = model.x - model.width / 2;
        const y = model.y - model.height / 2;

        if (model.rotation) {
            ctx.translate(model.x, model.y);
            ctx.rotate(model.rotation);
            ctx.translate(-model.x, -model.y);
        }

        ctx.beginPath();
        ctx.rect(x, y, model.width, model.height);

        if (model.fillColor) {
            ctx.fillStyle = model.fillColor;
            ctx.fill();
        }

        if (model.strokeColor && model.strokeWidth) {
            ctx.strokeStyle = model.strokeColor;
            ctx.lineWidth = model.strokeWidth;
            ctx.stroke();
        }

        ctx.restore();
    }
}

/**
 * Line renderer
 */
export class LineRenderer extends Renderer {
    static render(ctx, model, zoom) {
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(model.x1, model.y1);
        ctx.lineTo(model.x2, model.y2);

        ctx.strokeStyle = model.strokeColor || '#000000';
        ctx.lineWidth = model.strokeWidth || 2;
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * Registry of renderers by object type
 */
export class RendererRegistry {
    constructor() {
        this.renderers = new Map();

        // Register built-in renderers
        this.register('circle', CircleRenderer);
        this.register('rectangle', RectangleRenderer);
        this.register('line', LineRenderer);
    }

    /**
     * Register a renderer for an object type
     * @param {string} type - Object type
     * @param {Class} rendererClass - Renderer class (extends Renderer)
     */
    register(type, rendererClass) {
        if (!rendererClass.render) {
            throw new Error(`Renderer for type "${type}" must implement render() method`);
        }
        this.renderers.set(type, rendererClass);
    }

    /**
     * Get renderer for an object type
     * @param {string} type - Object type
     * @returns {Class|null} Renderer class or null if not found
     */
    get(type) {
        return this.renderers.get(type) || null;
    }

    /**
     * Render an object using the appropriate renderer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {BaseObject} model - Object model
     * @param {number} zoom - Zoom level
     * @returns {boolean} True if rendered, false if no renderer found
     */
    render(ctx, model, zoom) {
        if (!model.isVisible) return false;

        const RendererClass = this.get(model.type);
        if (!RendererClass) {
            console.warn(`No renderer registered for type "${model.type}"`);
            return false;
        }

        RendererClass.render(ctx, model, zoom);
        return true;
    }

    /**
     * Render selection UI for an object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {BaseObject} model - Selected object model
     * @param {number} zoom - Zoom level
     * @returns {boolean} True if rendered, false if no renderer found
     */
    renderSelection(ctx, model, zoom) {
        const RendererClass = this.get(model.type);
        if (!RendererClass) return false;

        if (RendererClass.renderSelection) {
            RendererClass.renderSelection(ctx, model, zoom);
        } else {
            // Use base class default selection rendering
            Renderer.renderSelection(ctx, model, zoom);
        }

        return true;
    }

    /**
     * Check if a renderer exists for a type
     * @param {string} type - Object type
     * @returns {boolean}
     */
    has(type) {
        return this.renderers.has(type);
    }

    /**
     * Get all registered types
     * @returns {Array<string>}
     */
    getTypes() {
        return Array.from(this.renderers.keys());
    }
}

// Singleton instance
export const rendererRegistry = new RendererRegistry();
