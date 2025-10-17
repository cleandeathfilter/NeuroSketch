/**
 * FreehandTool - Draw freehand curves with smooth Bezier interpolation
 * Supports: thickness, color, solid/dotted/dashed lines
 * Migrated to new architecture from app.js
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class FreehandTool extends Tool {
    constructor() {
        super('freehand');
        this.state = {
            points: [],
            preview: null,
            // Configurable drawing properties
            strokeWidth: 2,
            strokeColor: '#FFFFFF',  // White for dark mode
            lineStyle: 'solid' // 'solid', 'dotted', 'dashed'
        };
    }

    onMouseDown(worldX, worldY, clickedObj, app) {
        // Start collecting points
        this.state.points = [{x: worldX, y: worldY}];
        
        return {
            stateTransition: InteractionState.DRAWING
        };
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        if (this.state.points.length === 0) return {};
        
        // Add point to path (with smoothing to avoid too many points)
        const lastPoint = this.state.points[this.state.points.length - 1];
        const dx = worldX - lastPoint.x;
        const dy = worldY - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only add point if moved at least 3 pixels (prevents too many points)
        if (distance > 3 / app.zoom) {
            this.state.points.push({x: worldX, y: worldY});
        }
        
        // Create preview object
        this.state.preview = {
            type: 'freehand',
            points: [...this.state.points],
            strokeColor: this.state.strokeColor,
            strokeWidth: this.state.strokeWidth,
            lineStyle: this.state.lineStyle,
            fillColor: 'transparent'
        };
        
        return { preview: true };
    }

    onMouseUp(worldX, worldY, clickedObj, app) {
        if (this.state.points.length > 1) {
            // Finalize freehand object
            const freehand = {
                type: 'freehand',
                points: this.state.points,
                strokeColor: this.state.strokeColor,
                strokeWidth: this.state.strokeWidth,
                lineStyle: this.state.lineStyle,
                fillColor: 'transparent'
            };
            
            this.reset();
            
            return {
                object: freehand,
                stateTransition: InteractionState.IDLE
            };
        }
        
        // Not enough points, cancel
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview || this.state.points.length < 2) return;
        
        const points = this.state.points;
        
        ctx.save();
        ctx.strokeStyle = this.state.strokeColor;
        ctx.lineWidth = this.state.strokeWidth / app.zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Apply line style
        if (this.state.lineStyle === 'dotted') {
            ctx.setLineDash([2 / app.zoom, 5 / app.zoom]);
        } else if (this.state.lineStyle === 'dashed') {
            ctx.setLineDash([10 / app.zoom, 5 / app.zoom]);
        }
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        // Draw smooth curve through points using quadratic Bezier
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        
        // Draw final segment
        if (points.length > 1) {
            const lastIdx = points.length - 1;
            ctx.lineTo(points[lastIdx].x, points[lastIdx].y);
        }
        
        ctx.stroke();
        ctx.restore();
    }

    reset() {
        this.state.points = [];
        this.state.preview = null;
        // Keep drawing settings (don't reset strokeWidth, strokeColor, lineStyle)
    }

    onDeactivate() {
        this.reset(); // AUTO-CLEANUP!
    }

    // Public API for changing tool settings
    setStrokeWidth(width) {
        this.state.strokeWidth = Math.max(1, Math.min(50, width)); // Clamp 1-50px
    }

    setStrokeColor(color) {
        this.state.strokeColor = color;
    }

    setLineStyle(style) {
        // Valid styles: 'solid', 'dotted', 'dashed'
        if (['solid', 'dotted', 'dashed'].includes(style)) {
            this.state.lineStyle = style;
        }
    }

    // Getters for UI controls
    getStrokeWidth() {
        return this.state.strokeWidth;
    }

    getStrokeColor() {
        return this.state.strokeColor;
    }

    getLineStyle() {
        return this.state.lineStyle;
    }

    getCursor() {
        return 'crosshair';
    }
}
