/**
 * TextTool - Place text boxes on canvas
 * Migrated to new architecture - wraps existing TextEditor
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class TextTool extends Tool {
    constructor() {
        super('text');
        this.state = {
            preview: null
        };
    }

    onMouseDown(x, y, clickedObj, app) {
        // Create text object at click position
        const textObj = {
            type: 'text',
            x: x,
            y: y,
            text: '',
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textColor: app.isDarkMode ? '#FFFFFF' : '#000000',
            textAlign: 'left',
            lineHeight: 1.5,
            backgroundColor: 'transparent',
            backgroundOpacity: 1,
            hasBorder: false,
            borderColor: app.isDarkMode ? '#FFFFFF' : '#000000',
            borderWidth: 1,
            borderRadius: 0,
            rotation: 0,
            width: 200,
            height: 50
        };
        
        // Store reference to start editing after creation
        this.state.pendingEdit = textObj;
        
        return {
            object: textObj,
            stateTransition: InteractionState.IDLE
        };
    }

    onMouseMove(x, y, app) {
        // Show cursor preview
        this.state.preview = {x, y};
        return { preview: true };
    }

    onMouseUp(x, y, app) {
        this.reset();
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        if (!this.state.preview) return;
        
        const {x, y} = this.state.preview;
        
        ctx.save();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw text cursor/placeholder
        const width = 100;
        const height = 30;
        
        ctx.strokeRect(x, y, width, height);
        
        // Draw "T" icon
        ctx.setLineDash([]);
        ctx.font = `${20 / app.zoom}px Arial`;
        ctx.fillStyle = '#0066FF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', x + width / 2, y + height / 2);
        
        ctx.restore();
    }

    reset() {
        this.state = {
            preview: null
        };
    }

    onDeactivate() {
        this.reset(); // AUTO-CLEANUP!
    }
}
