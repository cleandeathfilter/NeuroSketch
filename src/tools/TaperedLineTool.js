/**
 * TaperedLineTool - Draw tapered lines for dendrites
 * Scientific accuracy: Dendrites taper from soma toward terminals
 * Based on Kandel et al., Purves neuroscience textbooks
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class TaperedLineTool extends Tool {
    constructor() {
        super('tapered-line');
        this.state = {
            startX: null,
            startY: null,
            preview: null
        };
    }

    onMouseDown(x, y, clickedObj, app) {
        this.state.startX = x;
        this.state.startY = y;
        
        return {
            stateTransition: InteractionState.DRAWING
        };
    }

    onMouseMove(x, y, app) {
        if (this.state.startX === null) return {};
        
        // Create tapered line preview
        this.state.preview = {
            type: 'taperedLine',
            x1: this.state.startX,
            y1: this.state.startY,
            x2: x,
            y2: y,
            startWidth: 12, // Dendrite base width
            endWidth: 2,    // Dendrite tip width (tapers)
            strokeColor: app.currentStrokeColor || '#8E44AD',
            fillColor: app.currentFillColor || '#8E44AD'
        };
        
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        if (this.state.preview) {
            const taperedLine = { ...this.state.preview };
            
            // Ensure minimum length for scientific accuracy
            const dx = taperedLine.x2 - taperedLine.x1;
            const dy = taperedLine.y2 - taperedLine.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length < 20) {
                // Too short, cancel
                this.reset();
                return { stateTransition: InteractionState.IDLE };
            }
            
            this.reset();
            return {
                object: taperedLine,
                stateTransition: InteractionState.IDLE
            };
        }
        
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview) return;
        
        const line = this.state.preview;
        
        ctx.save();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw preview line
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        
        // Draw taper visualization
        const dx = line.x2 - line.x1;
        const dy = line.y2 - line.y1;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 102, 255, 0.2)';
        ctx.beginPath();
        
        // Start width
        ctx.moveTo(
            line.x1 + Math.cos(perpAngle) * line.startWidth / 2,
            line.y1 + Math.sin(perpAngle) * line.startWidth / 2
        );
        ctx.lineTo(
            line.x1 - Math.cos(perpAngle) * line.startWidth / 2,
            line.y1 - Math.sin(perpAngle) * line.startWidth / 2
        );
        
        // End width (tapered)
        ctx.lineTo(
            line.x2 - Math.cos(perpAngle) * line.endWidth / 2,
            line.y2 - Math.sin(perpAngle) * line.endWidth / 2
        );
        ctx.lineTo(
            line.x2 + Math.cos(perpAngle) * line.endWidth / 2,
            line.y2 + Math.sin(perpAngle) * line.endWidth / 2
        );
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    reset() {
        this.state = {
            startX: null,
            startY: null,
            preview: null
        };
    }

    onDeactivate() {
        this.reset(); // AUTO-CLEANUP!
    }
}

/**
 * Render tapered line (for canvasRenderer.js)
 * Scientific accuracy: Smooth taper from base to tip
 */
export function renderTaperedLine(ctx, obj, zoom) {
    if (!obj || !obj.x1 || !obj.y1 || !obj.x2 || !obj.y2) return;
    
    const dx = obj.x2 - obj.x1;
    const dy = obj.y2 - obj.y1;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    
    const startWidth = obj.startWidth || 12;
    const endWidth = obj.endWidth || 2;
    
    ctx.save();
    ctx.fillStyle = obj.fillColor || '#8E44AD';
    ctx.strokeStyle = obj.strokeColor || '#6C3483';
    ctx.lineWidth = 1 / zoom;
    
    // Draw tapered shape
    ctx.beginPath();
    
    // Start end (wide)
    ctx.moveTo(
        obj.x1 + Math.cos(perpAngle) * startWidth / 2,
        obj.y1 + Math.sin(perpAngle) * startWidth / 2
    );
    ctx.lineTo(
        obj.x1 - Math.cos(perpAngle) * startWidth / 2,
        obj.y1 - Math.sin(perpAngle) * startWidth / 2
    );
    
    // End (narrow - tapered)
    ctx.lineTo(
        obj.x2 - Math.cos(perpAngle) * endWidth / 2,
        obj.y2 - Math.sin(perpAngle) * endWidth / 2
    );
    ctx.lineTo(
        obj.x2 + Math.cos(perpAngle) * endWidth / 2,
        obj.y2 + Math.sin(perpAngle) * endWidth / 2
    );
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}
