/**
 * LineTool - Creates straight lines
 * Implements Strategy Pattern (from CLAUDE.md)
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class LineTool extends Tool {
    constructor() {
        super('line');
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
            const dx = worldX - this.state.startX;
            const dy = worldY - this.state.startY;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > 5) {
                const line = {
                    type: 'line',
                    x1: this.state.startX,
                    y1: this.state.startY,
                    x2: worldX,
                    y2: worldY,
                    strokeColor: '#FFFFFF',  // White for dark mode
                    strokeWidth: 2
                };
                
                this.reset();
                return { 
                    object: line, 
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
            ctx.save();
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2 / app.zoom;
            ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
            ctx.beginPath();
            ctx.moveTo(this.state.startX, this.state.startY);
            ctx.lineTo(this.state.currentX, this.state.currentY);
            ctx.stroke();
            ctx.restore();
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
