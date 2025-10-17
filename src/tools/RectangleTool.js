/**
 * RectangleTool - Creates rectangles
 * Implements Strategy Pattern (from CLAUDE.md)
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class RectangleTool extends Tool {
    constructor() {
        super('rectangle');
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
                const rect = {
                    type: 'rectangle',
                    x: Math.min(this.state.startX, worldX),
                    y: Math.min(this.state.startY, worldY),
                    width: width,
                    height: height,
                    strokeColor: '#FFFFFF',  // White for dark mode
                    fillColor: 'transparent',
                    strokeWidth: 2
                };
                
                this.reset();
                return { 
                    object: rect, 
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
            
            const width = this.state.currentX - this.state.startX;
            const height = this.state.currentY - this.state.startY;
            
            ctx.strokeRect(this.state.startX, this.state.startY, width, height);
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
