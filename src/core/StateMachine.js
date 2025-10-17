/**
 * Finite State Machine for canvas interactions
 * Replaces 7+ boolean flags with single enum
 *
 * Benefits:
 * - Single source of truth (1 enum vs 7 booleans)
 * - Validated transitions (prevents invalid states)
 * - Auto-logging (debugging made easy)
 * - Event listeners (other components can react)
 */

export const InteractionState = Object.freeze({
    IDLE: 'IDLE',
    DRAWING: 'DRAWING',
    PANNING: 'PANNING',
    ROTATING: 'ROTATING',
    DRAGGING_SELECTION: 'DRAGGING_SELECTION',
    DRAGGING_GRAPH_POINT: 'DRAGGING_GRAPH_POINT',
    PLACING_SYNAPSE_SOURCE: 'PLACING_SYNAPSE_SOURCE',
    PLACING_SYNAPSE_TARGET: 'PLACING_SYNAPSE_TARGET',
    DRAWING_SELECTION_BOX: 'DRAWING_SELECTION_BOX',
    DRAGGING_OBJECT: 'DRAGGING_OBJECT'
});

export class StateMachine {
    constructor(initialState = InteractionState.IDLE) {
        this.state = initialState;
        this.listeners = new Map();
        this.history = []; // For debugging
    }

    transition(newState, data = {}) {
        const oldState = this.state;

        // Validate transition
        if (!this.isValidTransition(oldState, newState)) {
            console.error(`Invalid transition: ${oldState} → ${newState}`);
            return false;
        }

        this.state = newState;
        this.history.push({ from: oldState, to: newState, timestamp: Date.now(), data });

        // Log for debugging
        console.log(`State: ${oldState} → ${newState}`, data);

        // Notify listeners
        this.emit('transition', { oldState, newState, data });

        return true;
    }

    isValidTransition(from, to) {
        // Define valid transitions (prevents invalid states)
        const validTransitions = {
            [InteractionState.IDLE]: [
                InteractionState.DRAWING,
                InteractionState.PANNING,
                InteractionState.ROTATING,
                InteractionState.DRAGGING_SELECTION,
                InteractionState.PLACING_SYNAPSE_SOURCE,
                InteractionState.DRAWING_SELECTION_BOX,
                InteractionState.DRAGGING_OBJECT
            ],
            [InteractionState.DRAWING]: [
                InteractionState.IDLE
            ],
            [InteractionState.PANNING]: [
                InteractionState.IDLE
            ],
            [InteractionState.ROTATING]: [
                InteractionState.IDLE
            ],
            [InteractionState.DRAGGING_SELECTION]: [
                InteractionState.IDLE
            ],
            [InteractionState.DRAGGING_OBJECT]: [
                InteractionState.IDLE
            ],
            [InteractionState.DRAGGING_GRAPH_POINT]: [
                InteractionState.IDLE
            ],
            [InteractionState.PLACING_SYNAPSE_SOURCE]: [
                InteractionState.PLACING_SYNAPSE_TARGET,
                InteractionState.IDLE // Cancel
            ],
            [InteractionState.PLACING_SYNAPSE_TARGET]: [
                InteractionState.IDLE // Complete or cancel
            ],
            [InteractionState.DRAWING_SELECTION_BOX]: [
                InteractionState.IDLE
            ]
        };

        return validTransitions[from]?.includes(to) || to === InteractionState.IDLE;
    }

    reset() {
        this.transition(InteractionState.IDLE);
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(data));
        }
    }

    getHistory() {
        return this.history;
    }

    getCurrentState() {
        return this.state;
    }

    isInState(state) {
        return this.state === state;
    }
}
