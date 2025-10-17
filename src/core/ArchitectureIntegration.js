/**
 * ArchitectureIntegration - Bridge between old and new architecture
 *
 * Purpose: Allow new architecture to coexist with old code during migration
 *
 * Strategy:
 * - EventController wraps existing event handlers
 * - StateValidator runs automatically
 * - EventEmitter available for new objects
 * - RendererRegistry available for new renderers
 * - Old code continues to work unchanged
 *
 * This is a TEMPORARY integration layer during migration.
 * Once all tools are migrated, this can be removed.
 */

import { StateMachine, InteractionState } from './StateMachine.js';
import { ToolManager } from './ToolManager.js';
import { CommandHistory } from './CommandHistory.js';
import { StateValidator } from './StateValidator.js';
import { EventController } from './EventController.js';

/**
 * Initialize all new architecture systems and integrate with app
 * Call this from app.init()
 *
 * @param {Object} app - Main app instance
 */
export function initializeArchitecture(app) {
    console.log('[Architecture] Initializing new architecture systems...');

    // 1. State Machine (already initialized in app.js)
    if (!app.stateMachine) {
        app.stateMachine = new StateMachine(InteractionState.IDLE);
        console.log('[Architecture] ✅ StateMachine initialized');
    }

    // 2. Tool Manager (already initialized in app.js)
    if (!app.toolManager) {
        app.toolManager = new ToolManager();
        console.log('[Architecture] ✅ ToolManager initialized');
    }

    // 3. Command History (already initialized in app.js)
    if (!app.commandHistory) {
        app.commandHistory = new CommandHistory();
        console.log('[Architecture] ✅ CommandHistory initialized');
    }

    // 4. State Validator (NEW)
    app.stateValidator = new StateValidator(app);
    console.log('[Architecture] ✅ StateValidator initialized');

    // 5. Event Controller (NEW)
    app.eventController = new EventController(app);
    console.log('[Architecture] ✅ EventController initialized');

    console.log('[Architecture] All systems initialized successfully');

    return {
        stateMachine: app.stateMachine,
        toolManager: app.toolManager,
        commandHistory: app.commandHistory,
        stateValidator: app.stateValidator,
        eventController: app.eventController
    };
}

/**
 * Enhanced tool switching with validation
 * Replaces manual tool switching in app.js
 *
 * @param {Object} app - Main app instance
 * @param {string} newTool - Tool to switch to
 */
export function switchToolWithValidation(app, newTool) {
    const oldTool = app.currentTool;

    console.log(`[Architecture] Switching tool: ${oldTool} → ${newTool}`);

    // DEFENSIVE: Validate state before switch
    const validation = app.stateValidator.validateToolSwitch(oldTool, newTool);

    if (validation.fixes.length > 0) {
        console.warn(`[Architecture] Auto-fixed ${validation.fixes.length} issues during tool switch`);
    }

    // Switch tool
    if (newTool.startsWith('synapse-')) {
        // NEW architecture (synapse tools migrated)
        app.toolManager.switchTool(newTool);
    } else {
        // OLD architecture (other tools not yet migrated)
        // Manual reset of old flags
        app.resetInteractionState();
    }

    app.currentTool = newTool;

    // Reset to IDLE state
    app.stateMachine.transition(InteractionState.IDLE);

    console.log(`[Architecture] Tool switched to: ${newTool}, State: ${app.stateMachine.state}`);
}

/**
 * Wrap old mousedown handler with new EventController
 * FALLBACK: If EventController fails, use old code
 *
 * @param {Object} app - Main app instance
 * @param {MouseEvent} event - Mouse event
 */
export function handleMouseDownEnhanced(app, event) {
    try {
        // TRY: Use new EventController
        if (app.eventController && app.stateMachine) {
            const result = app.eventController.handleMouseDown(event);
            return result;
        }
    } catch (error) {
        console.error('[Architecture] EventController error, falling back to old handler:', error);
    }

    // FALLBACK: Use old mouse down logic
    return null; // Old handler will continue
}

/**
 * Wrap old mousemove handler with new EventController
 *
 * @param {Object} app - Main app instance
 * @param {MouseEvent} event - Mouse event
 */
export function handleMouseMoveEnhanced(app, event) {
    try {
        if (app.eventController && app.stateMachine) {
            const result = app.eventController.handleMouseMove(event);
            return result;
        }
    } catch (error) {
        console.error('[Architecture] EventController error in mousemove:', error);
    }

    return null;
}

/**
 * Wrap old mouseup handler with new EventController
 *
 * @param {Object} app - Main app instance
 * @param {MouseEvent} event - Mouse event
 */
export function handleMouseUpEnhanced(app, event) {
    try {
        if (app.eventController && app.stateMachine) {
            const result = app.eventController.handleMouseUp(event);
            return result;
        }
    } catch (error) {
        console.error('[Architecture] EventController error in mouseup:', error);
    }

    return null;
}

/**
 * Validate state periodically (call from render loop or requestAnimationFrame)
 * This provides continuous defensive validation
 *
 * @param {Object} app - Main app instance
 * @param {boolean} autoFix - Whether to auto-fix errors (default: true)
 */
export function validateStateLoop(app, autoFix = true) {
    if (!app.stateValidator) return;

    // Only validate every 60 frames (1 second at 60fps) to avoid overhead
    if (!app._validationFrame) app._validationFrame = 0;
    app._validationFrame++;

    if (app._validationFrame % 60 === 0) {
        const validation = app.stateValidator.validate();

        if (!validation.valid && autoFix) {
            console.warn('[Architecture] State validation found issues:', validation.errors);
            console.log('[Architecture] Auto-fixes applied:', validation.fixes);
        }
    }
}

/**
 * Get architecture status report
 * Useful for debugging
 *
 * @param {Object} app - Main app instance
 * @returns {Object} Status report
 */
export function getArchitectureStatus(app) {
    return {
        stateMachine: {
            initialized: !!app.stateMachine,
            currentState: app.stateMachine?.state || 'N/A',
            history: app.stateMachine?.history?.slice(-5) || []
        },
        toolManager: {
            initialized: !!app.toolManager,
            currentTool: app.toolManager?.currentTool?.name || app.currentTool,
            registeredTools: app.toolManager?.tools ? Object.keys(app.toolManager.tools) : []
        },
        commandHistory: {
            initialized: !!app.commandHistory,
            undoStackSize: app.commandHistory?.undoStack?.length || 0,
            redoStackSize: app.commandHistory?.redoStack?.length || 0
        },
        stateValidator: {
            initialized: !!app.stateValidator,
            autoFixCount: app.stateValidator?.autoFixCount || 0,
            lastErrors: app.stateValidator?.validationErrors || []
        },
        eventController: {
            initialized: !!app.eventController
        },
        compatibility: {
            oldSystemsPresent: !!(app.isDrawing !== undefined && app.isPanning !== undefined),
            newSystemsActive: !!(app.stateMachine && app.toolManager && app.eventController)
        }
    };
}

/**
 * Migration health check
 * Call this to verify architecture is working correctly
 *
 * @param {Object} app - Main app instance
 * @returns {{healthy: boolean, issues: Array<string>}}
 */
export function checkArchitectureHealth(app) {
    const issues = [];

    // Check all systems initialized
    if (!app.stateMachine) issues.push('StateMachine not initialized');
    if (!app.toolManager) issues.push('ToolManager not initialized');
    if (!app.commandHistory) issues.push('CommandHistory not initialized');
    if (!app.stateValidator) issues.push('StateValidator not initialized');
    if (!app.eventController) issues.push('EventController not initialized');

    // Check state consistency
    if (app.stateMachine && app.stateValidator) {
        const validation = app.stateValidator.validate();
        if (!validation.valid) {
            issues.push(...validation.errors);
        }
    }

    // Check tool registration
    if (app.toolManager) {
        const synapseTools = ['synapse-excitatory', 'synapse-inhibitory', 'synapse-electrical'];
        synapseTools.forEach(toolName => {
            if (!app.toolManager.tools[toolName]) {
                issues.push(`${toolName} not registered`);
            }
        });
    }

    return {
        healthy: issues.length === 0,
        issues
    };
}

/**
 * Debug helper: Log current architecture state
 *
 * @param {Object} app - Main app instance
 */
export function logArchitectureState(app) {
    console.group('[Architecture] Current State');
    console.log('Status:', getArchitectureStatus(app));
    console.log('Health:', checkArchitectureHealth(app));
    console.groupEnd();
}
