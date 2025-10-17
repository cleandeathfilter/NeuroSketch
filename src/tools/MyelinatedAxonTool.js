/**
 * MyelinatedAxonTool - Draw myelinated axons with Nodes of Ranvier
 * Scientific accuracy: Myelin segments with nodes for saltatory conduction
 * Based on Hodgkin-Huxley, Kandel neuroscience
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class MyelinatedAxonTool extends Tool {
    constructor() {
        super('myelinated-axon');
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
        
        const dx = x - this.state.startX;
        const dy = y - this.state.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate number of myelin segments
        // Each segment ~100-200 μm in reality, scale to screen
        const segmentLength = 50; // pixels
        const nodeLength = 5;     // pixels (Nodes of Ranvier)
        const numSegments = Math.max(1, Math.floor(length / (segmentLength + nodeLength)));
        
        this.state.preview = {
            type: 'myelinatedAxon',
            x1: this.state.startX,
            y1: this.state.startY,
            x2: x,
            y2: y,
            width: 8, // Wider for myelin sheath
            axonWidth: 3, // Actual axon diameter
            segmentLength,
            nodeLength,
            numSegments,
            myelinColor: '#FFFFFF', // White myelin
            axonColor: app.currentStrokeColor || '#E67E22',
            strokeColor: '#2C3E50'
        };
        
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        if (this.state.preview) {
            const axon = { ...this.state.preview };
            
            const dx = axon.x2 - axon.x1;
            const dy = axon.y2 - axon.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length < 60) {
                // Too short for myelination
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
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw preview line
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        ctx.beginPath();
        ctx.moveTo(axon.x1, axon.y1);
        ctx.lineTo(axon.x2, axon.y2);
        ctx.stroke();
        
        // Show segments preview
        ctx.setLineDash([]);
        const dx = axon.x2 - axon.x1;
        const dy = axon.y2 - axon.y1;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        ctx.translate(axon.x1, axon.y1);
        ctx.rotate(angle);
        
        // Draw simplified segment preview
        const segmentSpacing = length / (axon.numSegments || 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 102, 255, 0.5)';
        ctx.lineWidth = 1 / app.zoom;
        
        for (let i = 0; i < (axon.numSegments || 1); i++) {
            const x = i * segmentSpacing;
            const w = (axon.segmentLength || 45);
            
            ctx.fillRect(x, -(axon.width || 8) / 2, w, axon.width || 8);
            ctx.strokeRect(x, -(axon.width || 8) / 2, w, axon.width || 8);
        }
        
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
 * Render myelinated axon (for canvasRenderer.js)
 * Scientific accuracy: Alternating myelin segments and Nodes of Ranvier
 */
export function renderMyelinatedAxon(ctx, obj, zoom) {
    if (!obj || !obj.x1 || !obj.y1 || !obj.x2 || !obj.y2) return;
    
    const dx = obj.x2 - obj.x1;
    const dy = obj.y2 - obj.y1;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    ctx.save();
    ctx.translate(obj.x1, obj.y1);
    ctx.rotate(angle);
    
    const segmentLength = obj.segmentLength || 50;
    const nodeLength = obj.nodeLength || 5;
    const width = obj.width || 8;
    const axonWidth = obj.axonWidth || 3;
    const numSegments = obj.numSegments || Math.floor(length / (segmentLength + nodeLength));
    
    // Draw continuous axon (the actual nerve fiber)
    ctx.strokeStyle = obj.axonColor || '#E67E22';
    ctx.lineWidth = axonWidth / zoom;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    
    // Draw myelin segments
    ctx.fillStyle = obj.myelinColor || '#FFFFFF';
    ctx.strokeStyle = obj.strokeColor || '#2C3E50';
    ctx.lineWidth = 1 / zoom;
    
    let x = 0;
    for (let i = 0; i < numSegments; i++) {
        // Myelin segment
        ctx.fillRect(x, -width / 2, segmentLength, width);
        ctx.strokeRect(x, -width / 2, segmentLength, width);
        
        x += segmentLength;
        
        // Node of Ranvier (gap between segments)
        // Draw as thin exposed axon
        if (i < numSegments - 1) {
            ctx.fillStyle = obj.axonColor || '#E67E22';
            ctx.fillRect(x, -axonWidth / 2, nodeLength, axonWidth);
            ctx.fillStyle = obj.myelinColor || '#FFFFFF';
        }
        
        x += nodeLength;
    }
    
    ctx.restore();
}
