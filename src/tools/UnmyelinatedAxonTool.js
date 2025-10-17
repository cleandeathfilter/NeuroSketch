/**
 * UnmyelinatedAxonTool - Draw unmyelinated axons (C-fibers)
 * Scientific accuracy: Smooth curved paths, no myelin segments
 * Used for: Pain/temperature sensory fibers, postganglionic autonomic
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class UnmyelinatedAxonTool extends Tool {
    constructor() {
        super('unmyelinated-axon');
        this.state = {
            startX: null,
            startY: null,
            controlX: null,
            controlY: null,
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
        
        // Create smooth curved axon
        // Control point is offset perpendicular to line for natural curve
        const dx = x - this.state.startX;
        const dy = y - this.state.startY;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curveAmount = distance * 0.2; // 20% curve
        
        this.state.controlX = (this.state.startX + x) / 2 + Math.cos(perpAngle) * curveAmount;
        this.state.controlY = (this.state.startY + y) / 2 + Math.sin(perpAngle) * curveAmount;
        
        this.state.preview = {
            type: 'unmyelinatedAxon',
            x1: this.state.startX,
            y1: this.state.startY,
            x2: x,
            y2: y,
            controlX: this.state.controlX,
            controlY: this.state.controlY,
            width: 3, // Thin unmyelinated fiber
            strokeColor: app.currentStrokeColor || '#E67E22',
            fillColor: 'transparent'
        };
        
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        if (this.state.preview) {
            const axon = { ...this.state.preview };
            
            // Minimum length check
            const dx = axon.x2 - axon.x1;
            const dy = axon.y2 - axon.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length < 30) {
                this.reset();
                return { stateTransition: InteractionState.IDLE };
            }
            
            this.reset();
            return {
                object: axon,
                stateTransition: InteractionState.IDLE
            };
        }
        
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview) return;
        
        const axon = this.state.preview;
        
        ctx.save();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = (axon.width || 3) / app.zoom;
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw smooth curved preview
        ctx.beginPath();
        ctx.moveTo(axon.x1, axon.y1);
        ctx.quadraticCurveTo(axon.controlX, axon.controlY, axon.x2, axon.y2);
        ctx.stroke();
        
        // Draw control point (debug)
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 102, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(axon.controlX, axon.controlY, 5 / app.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    reset() {
        this.state = {
            startX: null,
            startY: null,
            controlX: null,
            controlY: null,
            preview: null
        };
    }

    onDeactivate() {
        this.reset(); // AUTO-CLEANUP!
    }
}

/**
 * Render unmyelinated axon (for canvasRenderer.js)
 */
export function renderUnmyelinatedAxon(ctx, obj, zoom) {
    if (!obj || !obj.x1 || !obj.y1 || !obj.x2 || !obj.y2) return;
    
    ctx.save();
    ctx.strokeStyle = obj.strokeColor || '#E67E22';
    ctx.lineWidth = (obj.width || 3) / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw smooth curved axon
    ctx.beginPath();
    ctx.moveTo(obj.x1, obj.y1);
    
    if (obj.controlX && obj.controlY) {
        ctx.quadraticCurveTo(obj.controlX, obj.controlY, obj.x2, obj.y2);
    } else {
        // Fallback to straight line
        ctx.lineTo(obj.x2, obj.y2);
    }
    
    ctx.stroke();
    
    ctx.restore();
}
