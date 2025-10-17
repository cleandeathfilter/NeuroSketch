/**
 * EventController - Central event routing with state machine integration
 *
 * Purpose: Route all user input events through state machine with NO early returns
 *
 * Pattern: NO EARLY RETURNS (from CLAUDE.md Pattern 0.6)
 *
 * Problem Solved: Early returns cause stuck states where clicks/moves are ignored
 * Solution: Switch statement on state machine, every branch completes
 *
 * Benefits:
 * - Clear control flow (one path per state)
 * - No early returns blocking execution
 * - Always reaches end of function (render, cleanup, etc.)
 * - Easy to see all states at a glance
 * - Cannot forget to handle a state
 *
 * Research: Anti-pattern analysis, guard clauses vs switch statements
 */

import { InteractionState } from './StateMachine.js';

export class EventController {
    /**
     * Create event controller
     * @param {Object} app - Reference to main app instance
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Handle mouse down event
     * NO EARLY RETURNS - Uses switch statement on state
     *
     * @param {MouseEvent} event - Mouse event
     * @returns {Object} Action result { shouldRender: boolean, stateChange: string|null }
     */
    handleMouseDown(event) {
        // DEFENSIVE: Always calculate world coordinates first
        const world = this.app.screenToWorld(event.clientX, event.clientY);
        const clickedObj = this.app.getObjectAt(world.x, world.y);

        // Result object (no early returns, build this instead)
        const result = {
            shouldRender: false,
            stateChange: null,
            newObject: null
        };

        // SWITCH on state (NO early returns!)
        switch (this.app.stateMachine.state) {
            case InteractionState.IDLE:
                // Check for special keys (panning, tool switching)
                if (this.app.spacePressed) {
                    result.stateChange = InteractionState.PANNING;
                    this.app.startX = world.x;
                    this.app.startY = world.y;
                    result.shouldRender = false;
                } else if (this.app.currentTool !== 'select') {
                    // Delegate to tool manager
                    const toolResult = this.app.toolManager.handleMouseDown(
                        world.x,
                        world.y,
                        clickedObj,
                        this.app
                    );

                    if (toolResult.object) {
                        result.newObject = toolResult.object;
                        result.shouldRender = true;
                    }

                    if (toolResult.stateTransition) {
                        result.stateChange = toolResult.stateTransition;
                    }
                } else {
                    // Select tool: Check for handle, object, or selection box
                    const handle = this.app.getResizeHandle(world, this.app.selectedObjects[0]);

                    if (handle) {
                        result.stateChange = InteractionState.DRAGGING_SELECTION;
                        this.app.dragHandle = handle;
                        this.app.startX = world.x;
                        this.app.startY = world.y;
                    } else if (clickedObj) {
                        // Select object
                        if (!this.app.selectedObjects.includes(clickedObj)) {
                            if (!event.shiftKey) {
                                this.app.selectedObjects = [];
                            }
                            this.app.selectedObjects.push(clickedObj);
                        }
                        result.stateChange = InteractionState.DRAGGING_SELECTION;
                        this.app.startX = world.x;
                        this.app.startY = world.y;
                        result.shouldRender = true;
                    } else {
                        // Start selection box
                        result.stateChange = InteractionState.DRAWING_SELECTION_BOX;
                        this.app.selectionBoxStart = { x: world.x, y: world.y };
                        this.app.selectionBoxEnd = { x: world.x, y: world.y };
                        result.shouldRender = true;
                    }
                }
                break;

            case InteractionState.PANNING:
                // Panning is already active, ignore additional clicks
                break;

            case InteractionState.DRAWING:
                // Already drawing, ignore
                break;

            case InteractionState.DRAGGING_SELECTION:
                // Already dragging, ignore
                break;

            case InteractionState.PLACING_SYNAPSE_SOURCE:
                // Handle synapse placement via tool manager
                const synapseResult = this.app.toolManager.handleMouseDown(
                    world.x,
                    world.y,
                    clickedObj,
                    this.app
                );

                if (synapseResult.object) {
                    result.newObject = synapseResult.object;
                    result.shouldRender = true;
                }

                if (synapseResult.stateTransition) {
                    result.stateChange = synapseResult.stateTransition;
                }
                break;

            case InteractionState.PLACING_SYNAPSE_TARGET:
                // Handle second synapse click via tool manager
                const targetResult = this.app.toolManager.handleMouseDown(
                    world.x,
                    world.y,
                    clickedObj,
                    this.app
                );

                if (targetResult.object) {
                    result.newObject = targetResult.object;
                    result.shouldRender = true;
                }

                if (targetResult.stateChange) {
                    result.stateChange = targetResult.stateTransition;
                }
                break;

            default:
                console.warn(`Unhandled state in handleMouseDown: ${this.app.stateMachine.state}`);
                // Defensive: Reset to IDLE if unknown state
                result.stateChange = InteractionState.IDLE;
                break;
        }

        // ALWAYS REACHES HERE (no early returns!)
        // Apply state change if needed
        if (result.stateChange) {
            this.app.stateMachine.transition(result.stateChange);
        }

        // Add new object if created
        if (result.newObject) {
            this.app.objects.push(result.newObject);
            this.app.saveState();
        }

        // Render if needed
        if (result.shouldRender) {
            this.app.render();
        }

        return result;
    }

    /**
     * Handle mouse move event
     * NO EARLY RETURNS - Uses switch statement on state
     *
     * @param {MouseEvent} event - Mouse event
     * @returns {Object} Action result
     */
    handleMouseMove(event) {
        const world = this.app.screenToWorld(event.clientX, event.clientY);

        const result = {
            shouldRender: false,
            cursorStyle: 'default'
        };

        // SWITCH on state (NO early returns!)
        switch (this.app.stateMachine.state) {
            case InteractionState.IDLE:
                // Update hover effects
                const hoveredObj = this.app.getObjectAt(world.x, world.y);
                if (hoveredObj) {
                    result.cursorStyle = 'pointer';
                }

                // Check for resize handle hover
                if (this.app.selectedObjects.length === 1) {
                    const handle = this.app.getResizeHandle(world, this.app.selectedObjects[0]);
                    if (handle) {
                        result.cursorStyle = this.getHandleCursor(handle);
                    }
                }
                break;

            case InteractionState.PANNING:
                const dx = world.x - this.app.startX;
                const dy = world.y - this.app.startY;
                this.app.panX += dx;
                this.app.panY += dy;
                this.app.startX = world.x;
                this.app.startY = world.y;
                result.shouldRender = true;
                result.cursorStyle = 'grabbing';
                break;

            case InteractionState.DRAGGING_SELECTION:
                // Move selected objects
                const deltaX = world.x - this.app.startX;
                const deltaY = world.y - this.app.startY;

                this.app.selectedObjects.forEach(obj => {
                    this.app.moveObject(obj, deltaX, deltaY);
                });

                this.app.startX = world.x;
                this.app.startY = world.y;
                result.shouldRender = true;
                result.cursorStyle = 'move';
                break;

            case InteractionState.DRAWING_SELECTION_BOX:
                this.app.selectionBoxEnd = { x: world.x, y: world.y };
                result.shouldRender = true;
                result.cursorStyle = 'crosshair';
                break;

            case InteractionState.PLACING_SYNAPSE_TARGET:
                // Update synapse preview
                this.app.toolManager.handleMouseMove(world.x, world.y, this.app);
                result.shouldRender = true;
                result.cursorStyle = 'crosshair';
                break;

            case InteractionState.DRAWING:
                // Delegate to tool
                this.app.toolManager.handleMouseMove(world.x, world.y, this.app);
                result.shouldRender = true;
                break;

            default:
                console.warn(`Unhandled state in handleMouseMove: ${this.app.stateMachine.state}`);
                break;
        }

        // ALWAYS REACHES HERE
        this.app.canvas.style.cursor = result.cursorStyle;

        if (result.shouldRender) {
            this.app.render();
        }

        return result;
    }

    /**
     * Handle mouse up event
     * NO EARLY RETURNS - Uses switch statement on state
     *
     * @param {MouseEvent} event - Mouse event
     * @returns {Object} Action result
     */
    handleMouseUp(event) {
        const world = this.app.screenToWorld(event.clientX, event.clientY);

        const result = {
            shouldRender: false,
            stateChange: null
        };

        // SWITCH on state (NO early returns!)
        switch (this.app.stateMachine.state) {
            case InteractionState.PANNING:
                result.stateChange = InteractionState.IDLE;
                result.shouldRender = true;
                break;

            case InteractionState.DRAGGING_SELECTION:
                // Finalize drag
                this.app.saveState();
                result.stateChange = InteractionState.IDLE;
                result.shouldRender = true;
                break;

            case InteractionState.DRAWING_SELECTION_BOX:
                // Finalize selection box
                this.finalizeSelectionBox();
                result.stateChange = InteractionState.IDLE;
                result.shouldRender = true;
                break;

            case InteractionState.DRAWING:
                // Finalize drawing via tool
                const toolResult = this.app.toolManager.handleMouseUp(world.x, world.y, this.app);

                if (toolResult.object) {
                    this.app.objects.push(toolResult.object);
                    this.app.saveState();
                }

                result.stateChange = InteractionState.IDLE;
                result.shouldRender = true;
                break;

            case InteractionState.IDLE:
                // Mouse up while idle, ignore
                break;

            default:
                console.warn(`Unhandled state in handleMouseUp: ${this.app.stateMachine.state}`);
                result.stateChange = InteractionState.IDLE;
                break;
        }

        // ALWAYS REACHES HERE
        if (result.stateChange) {
            this.app.stateMachine.transition(result.stateChange);
        }

        if (result.shouldRender) {
            this.app.render();
        }

        // DEFENSIVE: Always reset drag handle
        this.app.dragHandle = null;

        return result;
    }

    /**
     * Finalize selection box and select intersecting objects
     * @private
     */
    finalizeSelectionBox() {
        if (!this.app.selectionBoxStart || !this.app.selectionBoxEnd) return;

        const boxLeft = Math.min(this.app.selectionBoxStart.x, this.app.selectionBoxEnd.x);
        const boxRight = Math.max(this.app.selectionBoxStart.x, this.app.selectionBoxEnd.x);
        const boxTop = Math.min(this.app.selectionBoxStart.y, this.app.selectionBoxEnd.y);
        const boxBottom = Math.max(this.app.selectionBoxStart.y, this.app.selectionBoxEnd.y);

        this.app.selectedObjects = this.app.objects.filter(obj => {
            const bounds = this.app.getObjectBounds(obj);
            if (!bounds) return false;

            // Check if bounds intersect selection box
            return !(bounds.right < boxLeft ||
                     bounds.left > boxRight ||
                     bounds.bottom < boxTop ||
                     bounds.top > boxBottom);
        });

        // Clear selection box
        this.app.selectionBoxStart = null;
        this.app.selectionBoxEnd = null;
    }

    /**
     * Get cursor style for resize handle
     * @param {string} handle - Handle identifier
     * @returns {string} CSS cursor style
     * @private
     */
    getHandleCursor(handle) {
        const cursorMap = {
            'nw': 'nwse-resize',
            'n': 'ns-resize',
            'ne': 'nesw-resize',
            'e': 'ew-resize',
            'se': 'nwse-resize',
            's': 'ns-resize',
            'sw': 'nesw-resize',
            'w': 'ew-resize',
            'rotate': 'grab'
        };

        return cursorMap[handle] || 'default';
    }
}
