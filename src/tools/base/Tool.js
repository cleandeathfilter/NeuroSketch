/**
 * Base Tool class - all tools extend this
 * Implements Strategy Pattern
 *
 * Benefits:
 * - Tool state encapsulated (not in app.js)
 * - Auto-cleanup on switch (no forgotten resets)
 * - Easy to add tools (extend Tool class)
 * - Unit testable in isolation
 */

export class Tool {
    constructor(name) {
        this.name = name;
        this.state = {}; // Tool-specific state encapsulated
    }

    // Lifecycle hooks
    onActivate() {
        // Called when tool is selected
        console.log(`Tool activated: ${this.name}`);
    }

    onDeactivate() {
        // Called when switching away (AUTO-CLEANUP!)
        console.log(`Tool deactivated: ${this.name}`);
        this.reset();
    }

    // Event handlers (return { stateTransition?, object?, preview? })
    onMouseDown(worldX, worldY, clickedObj, app) {
        // Override in subclass
        return {};
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        // Override in subclass
        return {};
    }

    onMouseUp(worldX, worldY, clickedObj, app) {
        // Override in subclass
        return {};
    }

    onKeyDown(key, app) {
        // Override in subclass
        return {};
    }

    onKeyUp(key, app) {
        // Override in subclass
        return {};
    }

    // Rendering
    renderPreview(ctx, app) {
        // Draw tool-specific preview
        // Override in subclass
    }

    // Validation
    canAcceptObject(obj) {
        // Override in subclass
        return true; // Accept all by default (universal acceptance)
    }

    // Cleanup
    reset() {
        this.state = {};
    }

    // Serialization for tool state
    getState() {
        return { ...this.state };
    }

    setState(state) {
        this.state = { ...state };
    }

    // Utility methods
    isActive() {
        return true; // Can be overridden for conditional activation
    }

    getCursor() {
        return 'default'; // Override to change cursor
    }
}
