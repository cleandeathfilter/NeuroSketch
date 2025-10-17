/**
 * GraphTool - Place scientific graphs (action potentials, EPSPs, IPSPs)
 * Migrated to new architecture - wraps existing graph functions
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';
import { GRAPH_PRESETS } from '../../graphTool.js';

export class GraphTool extends Tool {
    constructor() {
        super('graph');
        this.state = {
            preview: null
        };
    }

    onMouseDown(x, y, clickedObj, app) {
        // Create default action potential graph at click position
        const defaultWidth = 300;
        const defaultHeight = 200;
        
        const graph = {
            type: 'graph',
            x: x,
            y: y,
            width: defaultWidth,
            height: defaultHeight,
            xMin: 0,
            xMax: 5,
            yMin: -90,
            yMax: 50,
            xLabel: 'Time (ms)',
            yLabel: 'Membrane Potential (mV)',
            curvePoints: GRAPH_PRESETS.actionPotential.standard.curvePoints || [],
            thresholdLine: {show: true, value: -55, color: '#E74C3C'},
            restingLine: {show: true, value: -70, color: '#95A5A6'},
            showGrid: true,
            showAxes: true,
            strokeColor: '#FFFFFF'  // White for dark mode,
            fillColor: 'transparent',
            preset: 'standard'
        };
        
        return {
            object: graph,
            stateTransition: InteractionState.IDLE
        };
    }

    onMouseMove(x, y, app) {
        // Show graph placement preview
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
        const width = 300;
        const height = 200;
        
        ctx.save();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2 / app.zoom;
        ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
        
        // Draw graph outline
        ctx.strokeRect(x, y, width, height);
        
        // Draw axes preview
        ctx.setLineDash([]);
        ctx.beginPath();
        // Y-axis
        ctx.moveTo(x + 40, y + 10);
        ctx.lineTo(x + 40, y + height - 30);
        // X-axis
        ctx.lineTo(x + width - 10, y + height - 30);
        ctx.stroke();
        
        // Draw sample curve
        ctx.beginPath();
        ctx.moveTo(x + 40, y + height - 30);
        ctx.lineTo(x + 80, y + height - 30);
        ctx.lineTo(x + 100, y + 30);
        ctx.lineTo(x + 140, y + height - 50);
        ctx.lineTo(x + 200, y + height - 40);
        ctx.stroke();
        
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
