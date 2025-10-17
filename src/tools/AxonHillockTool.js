/**
 * AxonHillockTool - Draw axon initial segment (axon hillock)
 * Scientific accuracy: Where action potentials are initiated
 * High density of Na+ channels, critical for spike generation
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class AxonHillockTool extends Tool {
    constructor() {
        super('axon-hillock');
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
        
        // Axon hillock: cone-shaped, widens from axon to soma
        this.state.preview = {
            type: 'axonHillock',
            x1: this.state.startX,  // Narrow end (toward axon)
            y1: this.state.startY,
            x2: x,                   // Wide end (at soma)
            y2: y,
            narrowWidth: 3,          // Initial segment
            wideWidth: 12,           // Attachment to soma
            strokeColor: app.currentStrokeColor || '#3498DB',
            fillColor: app.currentFillColor || 'rgba(52, 152, 219, 0.3)'
        };
        
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        if (this.state.preview) {
            const hillock = { ...this.state.preview };
            
            const dx = hillock.x2 - hillock.x1;
            const dy = hillock.y2 - hillock.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length < 20) {
                // Too short
                this.reset();
                return { stateTransition: InteractionState.IDLE };
            }
            
            this.reset();
            return {
                object: hillock,
                stateTransition: InteractionState.IDLE
            };
        }
        
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview) return;
        
        const hillock = this.state.preview;
        
        ctx.save();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw cone shape preview
        const dx = hillock.x2 - hillock.x1;
        const dy = hillock.y2 - hillock.y1;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        
        ctx.beginPath();
        // Narrow end
        ctx.moveTo(
            hillock.x1 + Math.cos(perpAngle) * hillock.narrowWidth / 2,
            hillock.y1 + Math.sin(perpAngle) * hillock.narrowWidth / 2
        );
        ctx.lineTo(
            hillock.x1 - Math.cos(perpAngle) * hillock.narrowWidth / 2,
            hillock.y1 - Math.sin(perpAngle) * hillock.narrowWidth / 2
        );
        // Wide end
        ctx.lineTo(
            hillock.x2 - Math.cos(perpAngle) * hillock.wideWidth / 2,
            hillock.y2 - Math.sin(perpAngle) * hillock.wideWidth / 2
        );
        ctx.lineTo(
            hillock.x2 + Math.cos(perpAngle) * hillock.wideWidth / 2,
            hillock.y2 + Math.sin(perpAngle) * hillock.wideWidth / 2
        );
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 102, 255, 0.2)';
        ctx.fill();
        
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
 * Render axon hillock (for canvasRenderer.js)
 */
export function renderAxonHillock(ctx, obj, zoom) {
    if (!obj || !obj.x1 || !obj.y1 || !obj.x2 || !obj.y2) return;
    
    const dx = obj.x2 - obj.x1;
    const dy = obj.y2 - obj.y1;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    
    const narrowWidth = obj.narrowWidth || 3;
    const wideWidth = obj.wideWidth || 12;
    
    ctx.save();
    ctx.fillStyle = obj.fillColor || 'rgba(52, 152, 219, 0.3)';
    ctx.strokeStyle = obj.strokeColor || '#3498DB';
    ctx.lineWidth = 2 / zoom;
    
    // Draw cone shape
    ctx.beginPath();
    ctx.moveTo(
        obj.x1 + Math.cos(perpAngle) * narrowWidth / 2,
        obj.y1 + Math.sin(perpAngle) * narrowWidth / 2
    );
    ctx.lineTo(
        obj.x1 - Math.cos(perpAngle) * narrowWidth / 2,
        obj.y1 - Math.sin(perpAngle) * narrowWidth / 2
    );
    ctx.lineTo(
        obj.x2 - Math.cos(perpAngle) * wideWidth / 2,
        obj.y2 - Math.sin(perpAngle) * wideWidth / 2
    );
    ctx.lineTo(
        obj.x2 + Math.cos(perpAngle) * wideWidth / 2,
        obj.y2 + Math.sin(perpAngle) * wideWidth / 2
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw striation lines (high Na+ channel density indicator)
    ctx.strokeStyle = obj.strokeColor || '#3498DB';
    ctx.lineWidth = 1 / zoom;
    ctx.globalAlpha = 0.5;
    
    const numLines = 5;
    for (let i = 1; i < numLines; i++) {
        const t = i / numLines;
        const lineX = obj.x1 + dx * t;
        const lineY = obj.y1 + dy * t;
        const lineWidth = narrowWidth + (wideWidth - narrowWidth) * t;
        
        ctx.beginPath();
        ctx.moveTo(
            lineX + Math.cos(perpAngle) * lineWidth / 2,
            lineY + Math.sin(perpAngle) * lineWidth / 2
        );
        ctx.lineTo(
            lineX - Math.cos(perpAngle) * lineWidth / 2,
            lineY - Math.sin(perpAngle) * lineWidth / 2
        );
        ctx.stroke();
    }
    
    ctx.restore();
}
