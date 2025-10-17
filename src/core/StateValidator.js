/**
 * StateValidator - Defensive state validation and auto-correction
 *
 * Purpose: Catch and fix invalid state combinations before they cause bugs
 *
 * Pattern: Defensive State Validation (from CLAUDE.md Pattern 0.8)
 *
 * Problem Solved: States can become inconsistent, hard to debug
 * Solution: Validate state on every tool switch and event
 *
 * Benefits:
 * - Catches state bugs early
 * - Self-healing (auto-corrects invalid states)
 * - Clear error messages for debugging
 * - Prevents cascading failures
 *
 * Research: Defensive programming, state machine validation
 */

import { InteractionState } from './StateMachine.js';

export class StateValidator {
    /**
     * Create state validator
     * @param {Object} app - Reference to main app instance
     */
    constructor(app) {
        this.app = app;
        this.validationErrors = [];
        this.autoFixCount = 0;
    }

    /**
     * Validate current application state
     * Checks for invalid combinations and auto-corrects them
     *
     * @returns {{valid: boolean, errors: Array<string>, fixes: Array<string>}}
     */
    validate() {
        this.validationErrors = [];
        const fixes = [];

        // Check 1: State machine vs tool consistency
        const stateMachineFix = this.validateStateMachineConsistency();
        if (stateMachineFix) fixes.push(stateMachineFix);

        // Check 2: Selected objects still exist
        const selectionFix = this.validateSelectedObjects();
        if (selectionFix) fixes.push(selectionFix);

        // Check 3: Drag handle consistency
        const dragHandleFix = this.validateDragHandles();
        if (dragHandleFix) fixes.push(dragHandleFix);

        // Check 4: Tool manager state
        const toolFix = this.validateToolState();
        if (toolFix) fixes.push(toolFix);

        // Check 5: Selection box state
        const selectionBoxFix = this.validateSelectionBox();
        if (selectionBoxFix) fixes.push(selectionBoxFix);

        // Check 6: Pan/zoom bounds (prevent infinite pan)
        const panZoomFix = this.validatePanZoom();
        if (panZoomFix) fixes.push(panZoomFix);

        this.autoFixCount += fixes.length;

        return {
            valid: this.validationErrors.length === 0,
            errors: this.validationErrors,
            fixes: fixes
        };
    }

    /**
     * Validate state machine is consistent with current tool
     * @returns {string|null} Fix description if auto-corrected
     * @private
     */
    validateStateMachineConsistency() {
        const state = this.app.stateMachine.state;
        const currentTool = this.app.currentTool;

        // Invalid: Placing synapse but not using synapse tool
        if ((state === InteractionState.PLACING_SYNAPSE_SOURCE ||
             state === InteractionState.PLACING_SYNAPSE_TARGET) &&
            !currentTool.includes('synapse')) {

            this.validationErrors.push(
                `INVALID STATE: State is ${state} but current tool is ${currentTool}`
            );

            // Auto-fix: Reset to IDLE
            this.app.stateMachine.transition(InteractionState.IDLE);
            console.warn('[StateValidator] Auto-fixed: Reset synapse state to IDLE');

            return 'Reset synapse placement state (tool mismatch)';
        }

        // Invalid: DRAWING state but no drawing tool active
        if (state === InteractionState.DRAWING &&
            (currentTool === 'select' || currentTool === 'pan')) {

            this.validationErrors.push(
                `INVALID STATE: State is DRAWING but tool is ${currentTool}`
            );

            this.app.stateMachine.transition(InteractionState.IDLE);
            console.warn('[StateValidator] Auto-fixed: Reset drawing state to IDLE');

            return 'Reset drawing state (no drawing tool active)';
        }

        return null;
    }

    /**
     * Validate selected objects still exist in objects array
     * @returns {string|null} Fix description if auto-corrected
     * @private
     */
    validateSelectedObjects() {
        if (!this.app.selectedObjects || this.app.selectedObjects.length === 0) {
            return null;
        }

        const invalidSelections = this.app.selectedObjects.filter(
            obj => !this.app.objects.includes(obj)
        );

        if (invalidSelections.length > 0) {
            this.validationErrors.push(
                `INVALID STATE: ${invalidSelections.length} selected object(s) no longer exist`
            );

            // Auto-fix: Remove invalid selections
            this.app.selectedObjects = this.app.selectedObjects.filter(
                obj => this.app.objects.includes(obj)
            );

            console.warn('[StateValidator] Auto-fixed: Removed deleted objects from selection');

            return `Removed ${invalidSelections.length} deleted object(s) from selection`;
        }

        return null;
    }

    /**
     * Validate drag handle state
     * @returns {string|null} Fix description if auto-corrected
     * @private
     */
    validateDragHandles() {
        // Drag handle set but not in dragging state
        if (this.app.dragHandle &&
            this.app.stateMachine.state !== InteractionState.DRAGGING_SELECTION &&
            this.app.stateMachine.state !== InteractionState.DRAGGING_GRAPH_POINT) {

            this.validationErrors.push(
                `INVALID STATE: dragHandle set but state is ${this.app.stateMachine.state}`
            );

            // Auto-fix: Clear drag handle
            this.app.dragHandle = null;
            console.warn('[StateValidator] Auto-fixed: Cleared orphaned drag handle');

            return 'Cleared orphaned drag handle';
        }

        // Dragging state but no handle set (for some drag types this is ok)
        if (this.app.stateMachine.state === InteractionState.DRAGGING_SELECTION &&
            !this.app.dragHandle &&
            this.app.selectedObjects.length === 0) {

            this.validationErrors.push(
                `INVALID STATE: DRAGGING_SELECTION but no objects selected`
            );

            // Auto-fix: Reset to IDLE
            this.app.stateMachine.transition(InteractionState.IDLE);
            console.warn('[StateValidator] Auto-fixed: Reset dragging state (no selection)');

            return 'Reset dragging state (nothing to drag)';
        }

        return null;
    }

    /**
     * Validate tool manager state
     * @returns {string|null} Fix description if auto-corrected
     * @private
     */
    validateToolState() {
        if (!this.app.toolManager) return null;

        const currentTool = this.app.toolManager.currentTool;

        // Tool has state but application is idle
        if (currentTool.state &&
            Object.keys(currentTool.state).length > 0 &&
            this.app.stateMachine.state === InteractionState.IDLE) {

            // This might be intentional (tool preparing for next action)
            // Only warn, don't auto-fix
            console.info('[StateValidator] Tool has state while app is IDLE (may be intentional)');
        }

        return null;
    }

    /**
     * Validate selection box state
     * @returns {string|null} Fix description if auto-corrected
     * @private
     */
    validateSelectionBox() {
        const hasSelectionBox = this.app.selectionBoxStart || this.app.selectionBoxEnd;
        const isDrawingBox = this.app.stateMachine.state === InteractionState.DRAWING_SELECTION_BOX;

        // Selection box exists but not in drawing state
        if (hasSelectionBox && !isDrawingBox) {
            this.validationErrors.push(
                `INVALID STATE: Selection box data exists but state is ${this.app.stateMachine.state}`
            );

            // Auto-fix: Clear selection box
            this.app.selectionBoxStart = null;
            this.app.selectionBoxEnd = null;
            console.warn('[StateValidator] Auto-fixed: Cleared orphaned selection box');

            return 'Cleared orphaned selection box data';
        }

        return null;
    }

    /**
     * Validate pan/zoom are within reasonable bounds
     * @returns {string|null} Fix description if auto-corrected
     * @private
     */
    validatePanZoom() {
        const fixes = [];

        // Zoom bounds: 0.1 to 10 (10% to 1000%)
        if (this.app.zoom < 0.1) {
            this.validationErrors.push(`INVALID STATE: Zoom ${this.app.zoom} below minimum 0.1`);
            this.app.zoom = 0.1;
            fixes.push('Reset zoom to minimum (0.1)');
        }

        if (this.app.zoom > 10) {
            this.validationErrors.push(`INVALID STATE: Zoom ${this.app.zoom} above maximum 10`);
            this.app.zoom = 10;
            fixes.push('Reset zoom to maximum (10)');
        }

        // Pan bounds: Prevent infinite pan (max 100,000 pixels from origin)
        const MAX_PAN = 100000;

        if (Math.abs(this.app.panX) > MAX_PAN) {
            this.validationErrors.push(`INVALID STATE: panX ${this.app.panX} exceeds limit`);
            this.app.panX = Math.sign(this.app.panX) * MAX_PAN;
            fixes.push('Reset panX to limit');
        }

        if (Math.abs(this.app.panY) > MAX_PAN) {
            this.validationErrors.push(`INVALID STATE: panY ${this.app.panY} exceeds limit`);
            this.app.panY = Math.sign(this.app.panY) * MAX_PAN;
            fixes.push('Reset panY to limit');
        }

        if (fixes.length > 0) {
            console.warn('[StateValidator] Auto-fixed: Pan/zoom bounds', fixes);
            return fixes.join(', ');
        }

        return null;
    }

    /**
     * Validate and fix state on tool switch
     * This is a key integration point - call before every tool switch
     *
     * @param {string} fromTool - Tool switching from
     * @param {string} toTool - Tool switching to
     * @returns {Object} Validation result
     */
    validateToolSwitch(fromTool, toTool) {
        console.log(`[StateValidator] Validating tool switch: ${fromTool} → ${toTool}`);

        // Run full validation
        const result = this.validate();

        // Additional check: Ensure state will be IDLE after switch (unless special tool)
        if (this.app.stateMachine.state !== InteractionState.IDLE &&
            !toTool.includes('synapse')) {

            console.warn(`[StateValidator] Forcing state to IDLE for tool switch to ${toTool}`);
            this.app.stateMachine.transition(InteractionState.IDLE);
            result.fixes.push('Forced state to IDLE for tool switch');
        }

        if (result.fixes.length > 0) {
            console.log(`[StateValidator] Applied ${result.fixes.length} auto-fixes during tool switch`);
        }

        return result;
    }

    /**
     * Get validation statistics
     * @returns {Object} Stats
     */
    getStats() {
        return {
            totalAutoFixes: this.autoFixCount,
            lastErrors: this.validationErrors
        };
    }

    /**
     * Reset validation statistics
     */
    resetStats() {
        this.autoFixCount = 0;
        this.validationErrors = [];
    }
}
