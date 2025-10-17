/**
 * HexagonTool - Creates hexagons
 * Implements Strategy Pattern (from CLAUDE.md)
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class HexagonTool extends Tool {
    constructor() {
        super('hexagon');
        this.state = {
            startX: null,
            startY: null,
            currentRadius: 0
        };
    }

    onMouseDown(worldX, worldY, clickedObj, app) {
        this.state.startX = worldX;
        this.state.startY = worldY;
        this.state.currentRadius = 0;
        return { stateTransition: InteractionState.DRAWING };
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        if (app.stateMachine.state === InteractionState.DRAWING) {
            const dx = worldX - this.state.startX;
            const dy = worldY - this.state.startY;
            this.state.currentRadius = Math.sqrt(dx * dx + dy * dy);
            return { preview: true };
        }
        return {};
    }

    onMouseUp(worldX, worldY, clickedObj, app) {
        if (app.stateMachine.state === InteractionState.DRAWING) {
            const dx = worldX - this.state.startX;
            const dy = worldY - this.state.startY;
            const radius = Math.sqrt(dx * dx + dy * dy);

            if (radius > 5) {
                const hexagon = {
                    type: 'polygon',
                    sides: 6,
                    x: this.state.startX,
                    y: this.state.startY,
                    radius: radius,
                    rotation: 0,
                    strokeColor: '#FFFFFF',  // White for dark mode
                    fillColor: 'transparent',
                    strokeWidth: 2
                };
                
                this.reset();
                return { 
                    object: hexagon, 
                    stateTransition: InteractionState.IDLE 
                };
            }

            this.reset();
            return { stateTransition: InteractionState.IDLE };
        }
        return {};
    }

    renderPreview(ctx, app) {
        if (this.state.currentRadius > 0 && app.stateMachine.state === InteractionState.DRAWING) {
            ctx.save();
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2 / app.zoom;
            ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
            ctx.beginPath();
            
            // Draw hexagon
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = this.state.startX + this.state.currentRadius * Math.cos(angle);
                const y = this.state.startY + this.state.currentRadius * Math.sin(angle);
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

    reset() {
        this.state = {
            startX: null,
            startY: null,
            currentRadius: 0
        };
    }

    getCursor() {
        return 'crosshair';
    }
}
