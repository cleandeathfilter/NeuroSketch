/**
 * TriangleTool - Creates triangles
 * Implements Strategy Pattern (from CLAUDE.md)
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class TriangleTool extends Tool {
    constructor() {
        super('triangle');
        this.state = {
            startX: null,
            startY: null,
            currentX: null,
            currentY: null
        };
    }

    onMouseDown(worldX, worldY, clickedObj, app) {
        this.state.startX = worldX;
        this.state.startY = worldY;
        this.state.currentX = worldX;
        this.state.currentY = worldY;
        return { stateTransition: InteractionState.DRAWING };
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        if (app.stateMachine.state === InteractionState.DRAWING) {
            this.state.currentX = worldX;
            this.state.currentY = worldY;
            return { preview: true };
        }
        return {};
    }

    onMouseUp(worldX, worldY, clickedObj, app) {
        if (app.stateMachine.state === InteractionState.DRAWING) {
            const width = Math.abs(worldX - this.state.startX);
            const height = Math.abs(worldY - this.state.startY);

            if (width > 5 && height > 5) {
                const centerX = (this.state.startX + worldX) / 2;
                const centerY = (this.state.startY + worldY) / 2;
                const radius = Math.sqrt(width * width + height * height) / 2;
                
                const triangle = {
                    type: 'polygon',
                    sides: 3,
                    x: centerX,
                    y: centerY,
                    radius: radius,
                    rotation: 0,
                    strokeColor: '#FFFFFF',  // White for dark mode
                    fillColor: 'transparent',
                    strokeWidth: 2
                };
                
                this.reset();
                return { 
                    object: triangle, 
                    stateTransition: InteractionState.IDLE 
                };
            }

            this.reset();
            return { stateTransition: InteractionState.IDLE };
        }
        return {};
    }

    renderPreview(ctx, app) {
        if (this.state.startX && this.state.currentX && app.stateMachine.state === InteractionState.DRAWING) {
            const dx = this.state.currentX - this.state.startX;
            const dy = this.state.currentY - this.state.startY;
            const centerX = this.state.startX + dx / 2;
            const centerY = this.state.startY + dy / 2;
            const radius = Math.sqrt(dx * dx + dy * dy) / 2;
            
            if (radius > 1) {
                ctx.save();
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 2 / app.zoom;
                ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
                ctx.beginPath();
                
                // Draw triangle (3 sides)
                for (let i = 0; i < 3; i++) {
                    const angle = (2 * Math.PI / 3) * i - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    reset() {
        this.state = {
            startX: null,
            startY: null,
            currentX: null,
            currentY: null
        };
    }

    getCursor() {
        return 'crosshair';
    }
}
