/**
 * BipolarSomaTool - Draw bipolar neuron somas
 * Scientific accuracy: Elliptical soma with processes at poles
 * Found in: Retinal bipolar cells, vestibular ganglion, spiral ganglion
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class BipolarSomaTool extends Tool {
    constructor() {
        super('bipolar-soma');
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
        
        // Bipolar soma: elliptical, processes at poles
        const width = Math.abs(x - this.state.startX) * 2;
        const height = Math.abs(y - this.state.startY) * 2;
        const centerX = (x + this.state.startX) / 2;
        const centerY = (y + this.state.startY) / 2;
        
        this.state.preview = {
            type: 'bipolarSoma',
            x: centerX,
            y: centerY,
            radiusX: width / 2 || 20,
            radiusY: height / 2 || 30,
            strokeColor: app.currentStrokeColor || '#9B59B6',
            fillColor: app.currentFillColor || 'rgba(155, 89, 182, 0.3)',
            strokeWidth: 2,
            // Bipolar neurons have processes at poles
            showProcesses: true
        };
        
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        if (this.state.preview) {
            const soma = { ...this.state.preview };
            
            // Minimum size check
            if (soma.radiusX < 10 || soma.radiusY < 10) {
                this.reset();
                return { stateTransition: InteractionState.IDLE };
            }
            
            this.reset();
            return {
                object: soma,
                stateTransition: InteractionState.IDLE
            };
        }
        
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview) return;
        
        const soma = this.state.preview;
        
        ctx.save();
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        
        // Draw ellipse preview
        ctx.beginPath();
        ctx.ellipse(soma.x, soma.y, soma.radiusX, soma.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
        ctx.fill();
        
        // Show process attachment points
        ctx.setLineDash([]);
        ctx.fillStyle = '#0066FF';
        const processLength = 15;
        
        // Top process
        ctx.beginPath();
        ctx.arc(soma.x, soma.y - soma.radiusY, 3 / app.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(soma.x, soma.y - soma.radiusY);
        ctx.lineTo(soma.x, soma.y - soma.radiusY - processLength);
        ctx.stroke();
        
        // Bottom process
        ctx.beginPath();
        ctx.arc(soma.x, soma.y + soma.radiusY, 3 / app.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(soma.x, soma.y + soma.radiusY);
        ctx.lineTo(soma.x, soma.y + soma.radiusY + processLength);
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
 * Render bipolar soma (for canvasRenderer.js)
 */
export function renderBipolarSoma(ctx, obj, zoom) {
    if (!obj || !obj.x || !obj.y) return;
    
    const radiusX = obj.radiusX || 20;
    const radiusY = obj.radiusY || 30;
    
    ctx.save();
    
    // Draw elliptical soma
    ctx.fillStyle = obj.fillColor || 'rgba(155, 89, 182, 0.3)';
    ctx.strokeStyle = obj.strokeColor || '#9B59B6';
    ctx.lineWidth = (obj.strokeWidth || 2) / zoom;
    
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw nucleus (optional)
    if (obj.showNucleus !== false) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, radiusX * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw process attachment points (characteristic of bipolar neurons)
    if (obj.showProcesses !== false) {
        ctx.fillStyle = obj.strokeColor || '#9B59B6';
        
        // Top process attachment
        ctx.beginPath();
        ctx.arc(obj.x, obj.y - radiusY, 3 / zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Bottom process attachment
        ctx.beginPath();
        ctx.arc(obj.x, obj.y + radiusY, 3 / zoom, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

/**
 * Draw bipolar soma in canvasRenderer (compatibility)
 */
export function drawBipolarSoma(ctx, obj, zoom) {
    renderBipolarSoma(ctx, obj, zoom);
}
