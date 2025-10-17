/**
 * Synapse Tool - creates synaptic connections between neurons
 * Extends base Tool class (Strategy Pattern)
 *
 * Interaction: Two-click placement
 * 1. Click source neuron (presynaptic)
 * 2. Click target neuron (postsynaptic)
 * 3. Synapse created automatically
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';
import { renderSynapsePreview } from '../../synapseRenderer.js';

export class SynapseTool extends Tool {
    constructor(synapseType) {
        super(`synapse-${synapseType}`);
        this.state = {
            synapseType: synapseType, // 'excitatory', 'inhibitory', 'electrical'
            sourceObj: null,
            sourcePoint: null,
            tempTargetPoint: null
        };
    }

    onActivate() {
        super.onActivate();
        // Reset state when tool is activated
        this.reset();
    }

    onMouseDown(worldX, worldY, clickedObj, app) {
        if (!this.state.sourceObj) {
            // First click - select source neuron
            if (clickedObj && this.canAcceptObject(clickedObj)) {
                this.state.sourceObj = clickedObj;
                this.state.sourcePoint = this.calculateAttachmentPoint(clickedObj, worldX, worldY, 'source');

                return {
                    stateTransition: InteractionState.PLACING_SYNAPSE_SOURCE
                };
            }
            // Clicked empty space, do nothing
            return {};
        } else {
            // Second click - select target neuron
            if (clickedObj && this.canAcceptObject(clickedObj)) {
                if (clickedObj === this.state.sourceObj) {
                    // Can't connect to self, reset
                    this.reset();
                    return {
                        stateTransition: InteractionState.IDLE
                    };
                }

                // Create synapse
                const targetPoint = this.calculateAttachmentPoint(clickedObj, worldX, worldY, 'target');
                const synapse = this.createSynapse(
                    this.state.sourceObj,
                    this.state.sourcePoint,
                    clickedObj,
                    targetPoint
                );

                // Reset tool state but keep tool active
                this.reset();

                return {
                    object: synapse,
                    stateTransition: InteractionState.IDLE
                };
            } else {
                // Clicked empty space or invalid object, cancel
                this.reset();
                return {
                    stateTransition: InteractionState.IDLE
                };
            }
        }
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        if (this.state.sourceObj) {
            // Update preview target point
            this.state.tempTargetPoint = { x: worldX, y: worldY };
        }
        return {};
    }

    renderPreview(ctx, app) {
        if (this.state.sourceObj && this.state.sourcePoint && this.state.tempTargetPoint) {
            renderSynapsePreview(
                ctx,
                this.state.sourcePoint,
                this.state.tempTargetPoint,
                this.state.synapseType,
                app.zoom
            );
        }
    }

    canAcceptObject(obj) {
        // Universal acceptance - accept all objects except text/image
        const excludedTypes = ['text', 'image'];
        return obj && !excludedTypes.includes(obj.type);
    }

    reset() {
        this.state = {
            synapseType: this.state.synapseType, // Keep type
            sourceObj: null,
            sourcePoint: null,
            tempTargetPoint: null
        };
    }

    getCursor() {
        return this.state.sourceObj ? 'crosshair' : 'default';
    }

    // Helper methods
    calculateAttachmentPoint(obj, clickX, clickY, role) {
        // Simple implementation - use click point for now
        // TODO: Implement smart attachment based on object type
        if (obj.type === 'circle') {
            // Attach to perimeter
            const dx = clickX - obj.x;
            const dy = clickY - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) {
                return { x: obj.x + obj.radius, y: obj.y };
            }
            return {
                x: obj.x + (dx / distance) * obj.radius,
                y: obj.y + (dy / distance) * obj.radius
            };
        }

        // Default: use click point
        return { x: clickX, y: clickY };
    }

    createSynapse(sourceObj, sourcePoint, targetObj, targetPoint) {
        const visualProps = this.getSynapseVisualProperties(this.state.synapseType);

        return {
            type: 'synapse',
            id: 'syn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),

            // Connection references
            sourceObj: sourceObj,
            targetObj: targetObj,

            // Attachment points (world coordinates)
            sourcePoint: { x: sourcePoint.x, y: sourcePoint.y },
            targetPoint: { x: targetPoint.x, y: targetPoint.y },

            // Synapse properties
            synapseType: this.state.synapseType,
            strength: 1.0,
            neurotransmitter: this.getSynapseNeurotransmitter(this.state.synapseType),

            // Visual properties
            terminalColor: visualProps.terminalColor,
            vesicleColor: visualProps.vesicleColor,
            connectionColor: visualProps.connectionColor,
            symbol: visualProps.symbol,
            lineStyle: visualProps.lineStyle,

            // User-controllable settings
            connectionStyle: 'curved',
            showSymbol: true,
            showNeurotransmitter: false,

            // Animation
            signalPosition: 0,
            isAnimating: false
        };
    }

    getSynapseVisualProperties(type) {
        const specs = {
            excitatory: {
                terminalColor: '#E74C3C',
                vesicleColor: '#EC7063',
                connectionColor: '#E74C3C',
                symbol: '▶',
                lineStyle: 'solid'
            },
            inhibitory: {
                terminalColor: '#3498DB',
                vesicleColor: '#5DADE2',
                connectionColor: '#3498DB',
                symbol: '⊣',
                lineStyle: 'solid'
            },
            electrical: {
                terminalColor: '#F1C40F',
                vesicleColor: null,
                connectionColor: '#F1C40F',
                symbol: '<>',
                lineStyle: 'dashed'
            }
        };
        return specs[type] || specs.excitatory;
    }

    getSynapseNeurotransmitter(type) {
        const mapping = {
            excitatory: 'Glutamate',
            inhibitory: 'GABA',
            electrical: null
        };
        return mapping[type];
    }
}
