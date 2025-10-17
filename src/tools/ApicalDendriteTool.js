/**
 * ApicalDendriteTool - Draw apical dendrites for pyramidal neurons
 * Scientific accuracy: Thick primary dendrite extending from apex
 * Characteristic of Layer 5 pyramidal neurons in cortex
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class ApicalDendriteTool extends Tool {
    constructor() {
        super('apical-dendrite');
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
        
        // Apical dendrite: thick at base, tapers, extends toward pia
        this.state.preview = {
            type: 'apicalDendrite',
            x1: this.state.startX,
            y1: this.state.startY,
            x2: x,
            y2: y,
            baseWidth: 15, // Thick primary dendrite
            tipWidth: 3,   // Tapers toward pia
            strokeColor: app.currentStrokeColor || '#9B59B6',
            fillColor: app.currentFillColor || '#9B59B6',
            // Apical dendrites often have branching (simplified here)
            hasBranches: true
        };
        
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        if (this.state.preview) {
            const dendrite = { ...this.state.preview };
            
            const dx = dendrite.x2 - dendrite.x1;
            const dy = dendrite.y2 - dendrite.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length < 40) {
                // Too short for apical dendrite
                this.reset();
                return { stateTransition: InteractionState.IDLE };
            }
            
            this.reset();
            return {
                object: dendrite,
                stateTransition: InteractionState.IDLE
            };
        }
        
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview) return;
        
        const dend = this.state.preview;
        
        ctx.save();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw preview with taper
        const dx = dend.x2 - dend.x1;
        const dy = dend.y2 - dend.y1;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        
        ctx.beginPath();
        ctx.moveTo(
            dend.x1 + Math.cos(perpAngle) * dend.baseWidth / 2,
            dend.y1 + Math.sin(perpAngle) * dend.baseWidth / 2
        );
        ctx.lineTo(
            dend.x1 - Math.cos(perpAngle) * dend.baseWidth / 2,
            dend.y1 - Math.sin(perpAngle) * dend.baseWidth / 2
        );
        ctx.lineTo(
            dend.x2 - Math.cos(perpAngle) * dend.tipWidth / 2,
            dend.y2 - Math.sin(perpAngle) * dend.tipWidth / 2
        );
        ctx.lineTo(
            dend.x2 + Math.cos(perpAngle) * dend.tipWidth / 2,
            dend.y2 + Math.sin(perpAngle) * dend.tipWidth / 2
        );
        ctx.closePath();
        ctx.stroke();
        
        // Fill with transparency
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
 * Render apical dendrite (for canvasRenderer.js)
 */
export function renderApicalDendrite(ctx, obj, zoom) {
    if (!obj || !obj.x1 || !obj.y1 || !obj.x2 || !obj.y2) return;
    
    const dx = obj.x2 - obj.x1;
    const dy = obj.y2 - obj.y1;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    
    const baseWidth = obj.baseWidth || 15;
    const tipWidth = obj.tipWidth || 3;
    
    ctx.save();
    ctx.fillStyle = obj.fillColor || '#9B59B6';
    ctx.strokeStyle = obj.strokeColor || '#8E44AD';
    ctx.lineWidth = 1 / zoom;
    
    // Draw main trunk (tapered)
    ctx.beginPath();
    ctx.moveTo(
        obj.x1 + Math.cos(perpAngle) * baseWidth / 2,
        obj.y1 + Math.sin(perpAngle) * baseWidth / 2
    );
    ctx.lineTo(
        obj.x1 - Math.cos(perpAngle) * baseWidth / 2,
        obj.y1 - Math.sin(perpAngle) * baseWidth / 2
    );
    ctx.lineTo(
        obj.x2 - Math.cos(perpAngle) * tipWidth / 2,
        obj.y2 - Math.sin(perpAngle) * tipWidth / 2
    );
    ctx.lineTo(
        obj.x2 + Math.cos(perpAngle) * tipWidth / 2,
        obj.y2 + Math.sin(perpAngle) * tipWidth / 2
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add small branches (simplified representation)
    if (obj.hasBranches) {
        const length = Math.sqrt(dx * dx + dy * dy);
        const numBranches = Math.min(3, Math.floor(length / 60));
        
        ctx.strokeStyle = obj.strokeColor || '#8E44AD';
        ctx.lineWidth = 2 / zoom;
        ctx.lineCap = 'round';
        
        for (let i = 1; i <= numBranches; i++) {
            const t = i / (numBranches + 1);
            const branchX = obj.x1 + dx * t;
            const branchY = obj.y1 + dy * t;
            const branchLength = 20 - (i * 5); // Shorter branches toward tip
            
            // Left branch
            ctx.beginPath();
            ctx.moveTo(branchX, branchY);
            ctx.lineTo(
                branchX + Math.cos(perpAngle + 0.5) * branchLength,
                branchY + Math.sin(perpAngle + 0.5) * branchLength
            );
            ctx.stroke();
            
            // Right branch
            ctx.beginPath();
            ctx.moveTo(branchX, branchY);
            ctx.lineTo(
                branchX + Math.cos(perpAngle - 0.5) * branchLength,
                branchY + Math.sin(perpAngle - 0.5) * branchLength
            );
            ctx.stroke();
        }
    }
    
    ctx.restore();
}
