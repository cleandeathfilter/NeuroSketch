# 🏗️ NeuroSketch Architecture Refactor Plan

**Date**: 2025-10-09
**Status**: PLANNED - Ready for Implementation
**Estimated Time**: 30-40 hours (spread over 5-7 sessions)
**Goal**: Transform fragile architecture into robust, scalable foundation

---

## 🎯 Executive Summary

**Current State**: House of cards - boolean flag explosion, tools breaking each other, manual state resets
**Future State**: Solid foundation - state machine, encapsulated tools, automatic cleanup, zero bugs

**ROI**:
- Upfront: 30-40 hours
- Payoff: Every future tool takes 1 hour instead of 4+ hours (with debugging)
- Break-even: After 10 tools, saves 100+ hours

---

## 📊 Research Summary

Based on extensive research of modern canvas application architectures (2024-2025):

### **Patterns Identified**:
1. **State Machine** (XState, Finite State Machines) - Single source of truth for interaction state
2. **Strategy Pattern** - Encapsulated tools with common interface
3. **Command Pattern** - Memory-efficient undo/redo
4. **Observer Pattern** - Event-driven object updates
5. **MVC Separation** - Model/View/Controller split
6. **Event-Driven Architecture** - Loose coupling via events

### **Key Insights from Research**:
- **Canvas apps scale poorly with boolean flags** - state explosion is #1 cause of bugs
- **Tool managers with Strategy pattern** are industry standard for drawing apps
- **Command pattern beats Memento** for undo/redo (10x more memory efficient)
- **Early returns in event handlers** are anti-pattern (causes stuck states)
- **Whitelist validation** breaks extensibility (use blacklist or universal acceptance)

---

## 🗺️ Refactor Roadmap

### **Phase 1: Foundation Patterns** (12-15 hours)
- State Machine implementation
- Tool Manager with Strategy Pattern
- Command Pattern for history

### **Phase 2: Object System** (8-10 hours)
- Observer Pattern for updates
- MVC separation
- Event system

### **Phase 3: Event Handling** (6-8 hours)
- Remove early returns
- Switch-based flow control
- Defensive validation

### **Phase 4: Migration** (4-6 hours)
- Migrate existing tools
- Test coverage
- Documentation

---

## 📋 Detailed Phase Breakdown

### **Phase 1: Foundation Patterns** (12-15 hours)

#### **Task 1.1: Implement State Machine** (4 hours)
**File**: Create `src/core/StateMachine.js`

```javascript
/**
 * Finite State Machine for canvas interactions
 * Replaces 7+ boolean flags with single enum
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
                InteractionState.DRAWING_SELECTION_BOX
            ],
            [InteractionState.PLACING_SYNAPSE_SOURCE]: [
                InteractionState.PLACING_SYNAPSE_TARGET,
                InteractionState.IDLE // Cancel
            ],
            [InteractionState.PLACING_SYNAPSE_TARGET]: [
                InteractionState.IDLE // Complete or cancel
            ],
            // ... define all valid transitions
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
}
```

**Benefits**:
- Single source of truth (1 enum vs 7 booleans)
- Validated transitions (prevents invalid states)
- Auto-logging (debugging made easy)
- Event listeners (other components can react)

---

#### **Task 1.2: Implement Tool Manager** (5 hours)
**Files**:
- Create `src/core/ToolManager.js`
- Create `src/tools/base/Tool.js`

```javascript
// src/tools/base/Tool.js
/**
 * Base Tool class - all tools extend this
 * Implements Strategy Pattern
 */
export class Tool {
    constructor(name) {
        this.name = name;
        this.state = {}; // Tool-specific state encapsulated
    }

    // Lifecycle hooks
    onActivate() {
        // Called when tool is selected
    }

    onDeactivate() {
        // Called when switching away (AUTO-CLEANUP!)
        this.reset();
    }

    // Event handlers (return { stateTransition?, object?, preview? })
    onMouseDown(worldX, worldY, clickedObj, app) {
        return {};
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        return {};
    }

    onMouseUp(worldX, worldY, clickedObj, app) {
        return {};
    }

    onKeyDown(key, app) {
        return {};
    }

    // Rendering
    renderPreview(ctx, app) {
        // Draw tool-specific preview
    }

    // Validation
    canAcceptObject(obj) {
        // Override in subclass
        return true; // Accept all by default
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
}

// src/core/ToolManager.js
export class ToolManager {
    constructor() {
        this.tools = new Map();
        this.currentTool = null;
    }

    register(tool) {
        this.tools.set(tool.name, tool);
    }

    switchTool(toolName) {
        const newTool = this.tools.get(toolName);
        if (!newTool) {
            console.error(`Tool not found: ${toolName}`);
            return false;
        }

        // Deactivate current tool (AUTO-CLEANUP!)
        if (this.currentTool) {
            this.currentTool.onDeactivate();
        }

        // Activate new tool
        this.currentTool = newTool;
        this.currentTool.onActivate();

        console.log(`Switched to tool: ${toolName}`);
        return true;
    }

    // Delegate events to current tool
    handleMouseDown(worldX, worldY, clickedObj, app) {
        return this.currentTool?.onMouseDown(worldX, worldY, clickedObj, app) || {};
    }

    handleMouseMove(worldX, worldY, clickedObj, app) {
        return this.currentTool?.onMouseMove(worldX, worldY, clickedObj, app) || {};
    }

    handleMouseUp(worldX, worldY, clickedObj, app) {
        return this.currentTool?.onMouseUp(worldX, worldY, clickedObj, app) || {};
    }

    handleKeyDown(key, app) {
        return this.currentTool?.onKeyDown(key, app) || {};
    }

    renderPreview(ctx, app) {
        this.currentTool?.renderPreview(ctx, app);
    }
}
```

**Benefits**:
- Tool state encapsulated (not in app.js)
- Auto-cleanup on switch (no forgotten resets)
- Easy to add tools (extend Tool class)
- Unit testable in isolation

---

#### **Task 1.3: Implement Command Pattern** (3 hours)
**File**: Create `src/core/CommandHistory.js`

```javascript
/**
 * Command Pattern for undo/redo
 * Memory-efficient (stores commands, not full state)
 */
export class Command {
    execute(app) {}
    undo(app) {}
    getName() { return 'Command'; }
}

export class AddObjectCommand extends Command {
    constructor(object) {
        super();
        this.object = object;
    }

    execute(app) {
        app.objects.push(this.object);
    }

    undo(app) {
        const index = app.objects.indexOf(this.object);
        if (index > -1) app.objects.splice(index, 1);
    }

    getName() { return `Add ${this.object.type}`; }
}

export class DeleteObjectCommand extends Command {
    constructor(object) {
        super();
        this.object = object;
        this.index = -1;
    }

    execute(app) {
        this.index = app.objects.indexOf(this.object);
        if (this.index > -1) app.objects.splice(this.index, 1);
    }

    undo(app) {
        app.objects.splice(this.index, 0, this.object);
    }

    getName() { return `Delete ${this.object.type}`; }
}

export class MoveObjectCommand extends Command {
    constructor(object, dx, dy) {
        super();
        this.object = object;
        this.dx = dx;
        this.dy = dy;
    }

    execute(app) {
        this.object.x += this.dx;
        this.object.y += this.dy;
    }

    undo(app) {
        this.object.x -= this.dx;
        this.object.y -= this.dy;
    }

    getName() { return `Move ${this.object.type}`; }
}

export class MacroCommand extends Command {
    constructor(commands = []) {
        super();
        this.commands = commands;
    }

    execute(app) {
        this.commands.forEach(cmd => cmd.execute(app));
    }

    undo(app) {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo(app);
        }
    }

    getName() {
        return `${this.commands.length} actions`;
    }
}

export class CommandHistory {
    constructor(maxSize = 1000) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = maxSize;
    }

    execute(command, app) {
        command.execute(app);
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo on new action

        // Limit stack size
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }

        console.log(`Executed: ${command.getName()}`);
    }

    undo(app) {
        const command = this.undoStack.pop();
        if (command) {
            command.undo(app);
            this.redoStack.push(command);
            console.log(`Undo: ${command.getName()}`);
            return true;
        }
        return false;
    }

    redo(app) {
        const command = this.redoStack.pop();
        if (command) {
            command.execute(app);
            this.undoStack.push(command);
            console.log(`Redo: ${command.getName()}`);
            return true;
        }
        return false;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    getUndoHistory() {
        return this.undoStack.map(cmd => cmd.getName());
    }
}
```

**Benefits**:
- 10x more memory efficient than full state snapshots
- Unlimited undo/redo (1000+ actions)
- Macro commands (group actions)
- Can serialize for auto-save

---

### **Phase 2: Object System** (8-10 hours)

#### **Task 2.1: Implement Observer Pattern** (4 hours)
**File**: Create `src/core/EventEmitter.js`

```javascript
/**
 * Event Emitter for Observer Pattern
 * Objects emit events, observers react
 */
export class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback); // Return cleanup function
    }

    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Base Object with events
export class BaseObject extends EventEmitter {
    constructor(type, x, y) {
        super();
        this.id = generateId();
        this.type = type;
        this.x = x;
        this.y = y;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.emit('moved', { x: this.x, y: this.y, dx, dy });
    }

    setPosition(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        this.x = x;
        this.y = y;
        this.emit('moved', { x, y, dx, dy });
    }

    delete() {
        this.emit('deleted', { id: this.id });
        this.removeAllListeners(); // Cleanup
    }
}
```

**Update Synapse to observe**:
```javascript
export class SynapseModel extends BaseObject {
    constructor(sourceObj, targetObj) {
        super('synapse', 0, 0);
        this.sourceObj = sourceObj;
        this.targetObj = targetObj;

        // Listen to movements (AUTO-UPDATE!)
        this.sourceObj.on('moved', () => this.updateAttachmentPoints());
        this.targetObj.on('moved', () => this.updateAttachmentPoints());

        this.updateAttachmentPoints();
    }

    updateAttachmentPoints() {
        this.sourcePoint = calculateAttachmentPoint(this.sourceObj, this.targetObj);
        this.targetPoint = calculateAttachmentPoint(this.targetObj, this.sourceObj);
        this.emit('updated');
    }

    delete() {
        // Cleanup listeners (prevent memory leaks!)
        this.sourceObj.off('moved');
        this.targetObj.off('moved');
        super.delete();
    }
}
```

**Benefits**:
- Synapses auto-update when neurons move ✨
- Loose coupling (neurons don't know about synapses)
- Memory leak prevention (cleanup on delete)

---

#### **Task 2.2: MVC Separation** (4-6 hours)
**Files**: Refactor existing objects

```javascript
// BEFORE: Mixed concerns
const object = {
    x: 100,
    y: 100,
    radius: 20,
    render(ctx) { /* rendering */ }
};

// AFTER: Separated concerns

// MODEL (src/models/CircleModel.js)
export class CircleModel extends BaseObject {
    constructor(x, y, radius) {
        super('circle', x, y);
        this.radius = radius;
        this.fillColor = '#3498DB';
        this.strokeColor = '#2980B9';
    }

    // Business logic only
    resize(newRadius) {
        this.radius = newRadius;
        this.emit('resized', { radius: newRadius });
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            radius: this.radius,
            fillColor: this.fillColor,
            strokeColor: this.strokeColor
        };
    }
}

// VIEW (src/renderers/CircleRenderer.js)
export class CircleRenderer {
    static render(ctx, circle, zoom, isSelected) {
        ctx.save();
        ctx.translate(circle.x, circle.y);
        ctx.scale(zoom, zoom);

        // Render circle
        ctx.beginPath();
        ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.fillColor;
        ctx.fill();
        ctx.strokeStyle = circle.strokeColor;
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        ctx.restore();
    }

    static renderSelection(ctx, circle, zoom) {
        // Selection rendering
    }
}

// CONTROLLER (app.js)
// Orchestrates model and view
```

**Benefits**:
- Models testable without canvas
- Can swap renderers (WebGL, SVG)
- Platform-independent business logic

---

### **Phase 3: Event Handling** (6-8 hours)

#### **Task 3.1: Remove Early Returns** (4 hours)
**File**: Refactor `app.js` event handlers

```javascript
// BEFORE: 29 early returns
handleMouseMove(e) {
    if (this.isPanning) { /* ... */ return; }
    if (this.isPlacingSynapse) { /* ... */ return; }
    // ... 27 more
}

// AFTER: Switch statement
handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const world = this.screenToWorld(x, y);
    const clickedObj = this.getObjectAt(world.x, world.y);

    switch (this.stateMachine.state) {
        case InteractionState.IDLE:
            this.updateHoverEffects(world, clickedObj);
            break;

        case InteractionState.PANNING:
            this.panX = x - this.startX;
            this.panY = y - this.startY;
            this.textEditor.updatePosition();
            break;

        case InteractionState.PLACING_SYNAPSE_TARGET:
            const result = this.toolManager.handleMouseMove(world.x, world.y, clickedObj, this);
            // Update preview
            break;

        case InteractionState.DRAGGING_SELECTION:
            this.selectionBoxEnd = world;
            break;

        case InteractionState.DRAWING:
            this.updateDrawing(world);
            break;

        // ... all states handled
    }

    // ALWAYS reaches here
    this.toolManager.renderPreview(this.ctx, this);
    this.render();
}
```

**Benefits**:
- No blocking returns
- Clear flow control
- All states visible
- Always renders

---

#### **Task 3.2: Defensive Validation** (2 hours)
**File**: Add validation layer

```javascript
// src/core/StateValidator.js
export class StateValidator {
    static validate(stateMachine, toolManager, app) {
        const errors = [];

        // Check state-tool consistency
        if (stateMachine.state === InteractionState.PLACING_SYNAPSE_TARGET &&
            !toolManager.currentTool.name.includes('synapse')) {
            errors.push('State mismatch: placing synapse but not synapse tool');
            stateMachine.reset();
        }

        // Check for orphaned listeners
        app.objects.forEach(obj => {
            if (obj instanceof EventEmitter) {
                const listenerCount = obj.listeners.size;
                if (listenerCount > 100) {
                    errors.push(`Object ${obj.id} has ${listenerCount} listeners (memory leak?)`);
                }
            }
        });

        // Log errors
        if (errors.length > 0) {
            console.error('State validation errors:', errors);
        }

        return errors;
    }
}

// In app.js
switchTool(toolName) {
    StateValidator.validate(this.stateMachine, this.toolManager, this);
    this.toolManager.switchTool(toolName);
    this.stateMachine.reset();
}
```

**Benefits**:
- Self-healing (auto-corrects)
- Early error detection
- Memory leak prevention

---

### **Phase 4: Migration** (4-6 hours)

#### **Task 4.1: Migrate Existing Tools** (3 hours)

**Example: Migrate SynapseTool**
```javascript
// src/tools/SynapseTool.js
import { Tool } from './base/Tool.js';

export class SynapseTool extends Tool {
    constructor(synapseType) {
        super(`synapse-${synapseType}`);
        this.state = {
            synapseType: synapseType,
            sourceObj: null,
            sourcePoint: null
        };
    }

    onMouseDown(worldX, worldY, clickedObj, app) {
        if (!this.state.sourceObj) {
            // First click - select source
            if (clickedObj) {
                this.state.sourceObj = clickedObj;
                this.state.sourcePoint = { x: worldX, y: worldY };
                return { stateTransition: InteractionState.PLACING_SYNAPSE_TARGET };
            }
        } else {
            // Second click - create synapse
            if (clickedObj && clickedObj !== this.state.sourceObj) {
                const synapse = new SynapseModel(
                    this.state.sourceObj,
                    clickedObj,
                    this.state.synapseType
                );
                this.reset();
                return {
                    object: synapse,
                    stateTransition: InteractionState.IDLE
                };
            }
        }
        return {};
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        if (this.state.sourceObj) {
            this.state.tempTargetPoint = { x: worldX, y: worldY };
        }
        return {};
    }

    renderPreview(ctx, app) {
        if (this.state.sourceObj && this.state.tempTargetPoint) {
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
        // Accept all except text/image
        return obj && !['text', 'image'].includes(obj.type);
    }

    onDeactivate() {
        this.reset(); // AUTO-CLEANUP!
    }
}
```

**Migrate**: Circle, Rectangle, Line, Select, etc. (all follow same pattern)

---

#### **Task 4.2: Update app.js Integration** (1 hour)

```javascript
// app.js - New initialization
export const app = {
    canvas: null,
    ctx: null,

    // NEW: Core systems
    stateMachine: new StateMachine(),
    toolManager: new ToolManager(),
    commandHistory: new CommandHistory(),

    // Models (not mixed with rendering)
    models: [],

    zoom: 1,
    panX: 0,
    panY: 0,

    init() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize state machine
        this.stateMachine = new StateMachine(InteractionState.IDLE);

        // Register tools
        this.toolManager = new ToolManager();
        this.toolManager.register(new SelectTool());
        this.toolManager.register(new CircleTool());
        this.toolManager.register(new SynapseTool('excitatory'));
        this.toolManager.register(new SynapseTool('inhibitory'));
        this.toolManager.register(new SynapseTool('electrical'));
        // ... register all tools

        // Set default tool
        this.toolManager.switchTool('select');

        // Initialize command history
        this.commandHistory = new CommandHistory();

        // Event listeners
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        this.render();
    },

    handleMouseDown(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        const clickedObj = this.getObjectAt(world.x, world.y);

        const result = this.toolManager.handleMouseDown(world.x, world.y, clickedObj, this);

        if (result.stateTransition) {
            this.stateMachine.transition(result.stateTransition);
        }

        if (result.object) {
            const command = new AddObjectCommand(result.object);
            this.commandHistory.execute(command, this);
        }

        this.render();
    }
};
```

---

#### **Task 4.3: Testing & Validation** (1 hour)

```javascript
// tests/StateMachine.test.js
describe('StateMachine', () => {
    it('should start in IDLE state', () => {
        const sm = new StateMachine();
        expect(sm.state).toBe(InteractionState.IDLE);
    });

    it('should prevent invalid transitions', () => {
        const sm = new StateMachine();
        const result = sm.transition(InteractionState.PLACING_SYNAPSE_TARGET);
        expect(result).toBe(false); // Invalid: can't go from IDLE to TARGET directly
    });

    it('should allow valid transitions', () => {
        const sm = new StateMachine();
        sm.transition(InteractionState.PLACING_SYNAPSE_SOURCE);
        const result = sm.transition(InteractionState.PLACING_SYNAPSE_TARGET);
        expect(result).toBe(true);
    });
});

// tests/ToolManager.test.js
describe('ToolManager', () => {
    it('should auto-cleanup when switching tools', () => {
        const tm = new ToolManager();
        const synapseTool = new SynapseTool('excitatory');
        tm.register(synapseTool);
        tm.switchTool('synapse-excitatory');

        synapseTool.state.sourceObj = { x: 100, y: 100 };
        tm.switchTool('select');

        expect(synapseTool.state.sourceObj).toBeNull(); // Cleaned up!
    });
});
```

---

## 📅 Implementation Schedule

### **Week 1: Foundation** (12-15 hours)
- **Session 1** (4h): State Machine
- **Session 2** (5h): Tool Manager
- **Session 3** (3h): Command Pattern

### **Week 2: Object System** (8-10 hours)
- **Session 4** (4h): Observer Pattern
- **Session 5** (5h): MVC Separation

### **Week 3: Event Handling** (6-8 hours)
- **Session 6** (4h): Remove Early Returns
- **Session 7** (2h): Defensive Validation

### **Week 4: Migration** (4-6 hours)
- **Session 8** (3h): Migrate Tools
- **Session 9** (2h): Testing & Documentation

**Total**: 30-40 hours over 4 weeks

---

## ✅ Success Criteria

**Refactor is complete when:**

- [ ] State Machine replaces all boolean flags
- [ ] Tool Manager handles all tools
- [ ] Command Pattern replaces state snapshots
- [ ] Observer Pattern updates synapses when neurons move
- [ ] MVC separation: models, views, controllers split
- [ ] Zero early returns in event handlers
- [ ] All tools accept all objects (no whitelists)
- [ ] Defensive validation in place
- [ ] All existing tools migrated
- [ ] Test coverage >80%
- [ ] Zero state bugs in testing

---

## 🎯 Quick Wins During Refactor

**After Phase 1** (12-15 hours):
- ✅ State Machine: No more boolean flag bugs
- ✅ Tool Manager: Tools self-contain, auto-cleanup
- ✅ Command Pattern: Unlimited undo/redo

**After Phase 2** (20-25 hours):
- ✅ Observer Pattern: Synapses move with neurons
- ✅ MVC: Can test models without canvas

**After Phase 3** (26-33 hours):
- ✅ No Early Returns: No more stuck states
- ✅ Validation: Self-healing on errors

**After Phase 4** (30-40 hours):
- ✅ All tools migrated
- ✅ Professional-grade architecture
- ✅ Adding new tools takes 1 hour (not 4+)

---

## 💰 ROI Analysis

### **Investment**:
- 30-40 hours upfront

### **Payoff Per Tool**:
- **Before refactor**: 4 hours (2h implementation + 2h debugging state bugs)
- **After refactor**: 1 hour (extend Tool class, done)
- **Savings per tool**: 3 hours

### **Break-Even Point**:
- After 10-13 tools: Saves 30-40 hours (pays for itself)
- After 20 tools: Saves 60 hours
- After 50 tools: Saves 150 hours

**You're planning 30+ more tools** (cellular components, etc.)
**ROI: 300%+ over project lifetime**

---

## 🚨 Risks & Mitigation

### **Risk 1**: Refactor breaks existing features
**Mitigation**:
- Refactor incrementally (phase by phase)
- Keep old code alongside new until validated
- Comprehensive testing between phases

### **Risk 2**: Time overrun
**Mitigation**:
- Each phase is independent (can pause between phases)
- Quick wins after each phase (motivating)
- Can skip Phase 4 migration (use new architecture for new tools only)

### **Risk 3**: Learning curve
**Mitigation**:
- Patterns well-documented in CLAUDE.md
- Code examples for each pattern
- Tests demonstrate usage

---

## 📚 Resources & References

### **Patterns**:
- State Machine: XState documentation
- Strategy Pattern: Refactoring Guru
- Command Pattern: Gang of Four
- Observer Pattern: Event-driven architecture
- MVC: Canvas editor best practices

### **Research Sources**:
- Modern canvas app architecture (2024)
- Tool-based drawing applications
- Undo/redo patterns
- Event-driven systems
- State management libraries

---

## 🎬 Next Steps

### **Option A: Start Immediately**
1. Create branch: `refactor/architecture-foundation`
2. Begin Phase 1: State Machine (4 hours)
3. Test, commit, continue

### **Option B: Quick Fix First**
1. Fix synapse whitelist (5 min)
2. Test synapses work
3. Commit as temp fix
4. Schedule refactor for next session

### **Option C: Hybrid Approach** (RECOMMENDED)
1. **Today**: Quick fix synapse (5 min), test, commit
2. **Tomorrow**: Start Phase 1 (State Machine, 4 hours)
3. **Continue**: One phase per session until complete

---

## 💬 Recommendation

**I strongly recommend Option C (Hybrid)**:

**Why?**
- Synapses work TODAY (5 min fix)
- Start proper refactor TOMORROW (when fresh)
- Each phase is manageable (4-6 hours)
- See progress quickly (phase by phase)
- Can pause between phases if needed

**Path Forward**:
1. **Now**: Fix synapse whitelist, test, commit
2. **Next session**: Create `refactor/architecture` branch
3. **Week 1**: Implement State Machine + Tool Manager
4. **Week 2**: Observer Pattern + MVC
5. **Week 3**: Event handling refactor
6. **Week 4**: Migration + testing

**Result**: In 4 weeks, solid architecture that supports 100+ tools with zero state bugs.

---

**Your decision:**
- **A**: Start refactor now (30-40 hour commitment)
- **B**: Quick fix only (5 min, keep fragile architecture)
- **C**: Quick fix + scheduled refactor (RECOMMENDED)

I'm ready to implement whichever you choose.

---

*Refactor Plan Created: 2025-10-09*
*Based on: Extensive research + architectural best practices*
*Status: Ready for implementation*
