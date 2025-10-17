/**
 * EventEmitter - Observer Pattern Implementation
 *
 * Purpose: Enable objects to emit events that other objects can listen to.
 *          Solves the problem of synapses needing to update when neurons move.
 *
 * Pattern: Observer Pattern (from CLAUDE.md Pattern 0.4)
 *
 * Benefits:
 * - Synapses automatically update when neurons move
 * - Loose coupling (neurons don't know about synapses)
 * - Easy to add new observers (animations, labels, etc.)
 * - Prevents memory leaks with proper cleanup
 *
 * Research: Observer pattern, event-driven architecture for canvas apps
 */

export class EventEmitter {
    constructor() {
        /**
         * Map of event names to arrays of listener callbacks
         * @type {Map<string, Array<Function>>}
         */
        this.listeners = new Map();

        /**
         * Unique ID for this emitter (for debugging)
         * @type {string}
         */
        this.emitterId = `emitter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Register a listener for an event
     * @param {string} event - Event name (e.g., 'moved', 'deleted', 'modified')
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (typeof callback !== 'function') {
            console.error(`EventEmitter.on: callback must be a function for event "${event}"`);
            return () => {}; // Return no-op unsubscribe
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event).push(callback);

        // Return unsubscribe function for convenience
        return () => this.off(event, callback);
    }

    /**
     * Register a one-time listener for an event
     * @param {string} event - Event name
     * @param {Function} callback - Function to call once when event is emitted
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const onceWrapper = (data) => {
            this.off(event, onceWrapper);
            callback(data);
        };

        return this.on(event, onceWrapper);
    }

    /**
     * Remove a listener for an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (!callbacks) return;

        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }

        // Clean up empty arrays
        if (callbacks.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * Remove all listeners for an event, or all events if no event specified
     * @param {string} [event] - Optional event name. If omitted, removes all listeners.
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Emit an event to all registered listeners
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (!callbacks || callbacks.length === 0) {
            return; // No listeners, silent return
        }

        // Call all listeners with the data
        // Use slice() to avoid issues if a listener removes itself during execution
        callbacks.slice().forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in listener for event "${event}":`, error);
            }
        });
    }

    /**
     * Get count of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const callbacks = this.listeners.get(event);
        return callbacks ? callbacks.length : 0;
    }

    /**
     * Get all event names that have listeners
     * @returns {Array<string>} Array of event names
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Destroy this emitter and remove all listeners
     * IMPORTANT: Call this when object is deleted to prevent memory leaks
     */
    destroy() {
        this.removeAllListeners();
    }
}

/**
 * Common event names used throughout NeuroSketch
 * Use these constants to avoid typos
 */
export const Events = {
    // Object lifecycle
    CREATED: 'created',
    DELETED: 'deleted',
    MODIFIED: 'modified',

    // Transformation events
    MOVED: 'moved',
    RESIZED: 'resized',
    ROTATED: 'rotated',

    // Selection events
    SELECTED: 'selected',
    DESELECTED: 'deselected',

    // Property changes
    PROPERTY_CHANGED: 'propertyChanged',

    // Graph-specific events
    CONTROL_POINT_MOVED: 'controlPointMoved',
    PRESET_CHANGED: 'presetChanged',

    // Synapse-specific events
    RECONNECTED: 'reconnected',
    STYLE_CHANGED: 'styleChanged',

    // Animation events
    ANIMATION_START: 'animationStart',
    ANIMATION_END: 'animationEnd',
    ANIMATION_FRAME: 'animationFrame'
};
