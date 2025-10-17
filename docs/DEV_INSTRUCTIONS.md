# NeuroSketch Developer Instructions
**Quick Reference Guide for Code Navigation and Architecture**

*Last Updated: 2025-10-10*

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [File Structure Map](#file-structure-map)
3. [Architecture Overview](#architecture-overview)
4. [Tools - Complete Reference](#tools---complete-reference)
5. [Graph Presets Location](#graph-presets-location)
6. [Circuit Templates Location](#circuit-templates-location)
7. [Rendering System](#rendering-system)
8. [State Management](#state-management)
9. [Key Functions Reference](#key-functions-reference)
10. [Quick Find: "Where is...?"](#quick-find-where-is)
11. [Adding New Features](#adding-new-features)

---

## Project Overview

**NeuroSketch** is a 2D neuroscience visualization tool built with:
- **Pure HTML5 Canvas** (no frameworks)
- **ES6 Modules** (modern JavaScript)
- **Local-first** (runs entirely in browser)

**Architecture Status**: Phase 9 Complete
- ✅ State Machine Pattern
- ✅ Tool Manager (Strategy Pattern)
- ✅ Command Pattern (Undo/Redo)
- 🚧 Observer Pattern (Phase 2 - planned)
- 🚧 MVC Separation (Phase 3 - planned)

---

## File Structure Map

```
NeuroSketch/
│
├── index.html                          # Main HTML entry point
├── app.js                              # 🎯 MAIN APP ORCHESTRATOR (2000+ lines)
│
├── src/                                # 🆕 NEW ARCHITECTURE (Phase 9+)
│   ├── core/                          # Core systems
│   │   ├── StateMachine.js            # State management (InteractionState enum)
│   │   ├── ToolManager.js             # Tool lifecycle & switching
│   │   └── CommandHistory.js          # Undo/redo commands
│   │
│   └── tools/                         # Tool implementations
│       ├── base/
│       │   └── Tool.js                # Base class for all tools
│       └── SynapseTool.js             # 🆕 First migrated tool (uses new architecture)
│
├── docs/                              # 📚 DOCUMENTATION
│   ├── neurosketchPRP.md              # Product requirements (MUST READ)
│   ├── modelingRESEARCH.md            # Scientific references
│   ├── DEV_INSTRUCTIONS.md            # 👈 THIS FILE
│   └── SYNAPSE_*.md                   # Various implementation guides
│
├── CLAUDE.md                          # 🧠 CRITICAL: Architecture patterns & guidelines
├── implemented.md                     # ✅ Feature completion tracking
│
├── Drawing Tools (OLD - to be migrated):
│   ├── triangleTool.js                # Pyramidal soma shape
│   ├── hexagonTool.js                 # Multipolar soma shape
│   ├── ellipseTool.js                 # Ellipse shape
│   ├── taperedLineTool.js             # Dendrite/axon with taper
│   ├── apicalDendriteTool.js          # Pyramidal neuron apical dendrite
│   ├── unmyelinatedAxonTool.js        # C-fiber style axon
│   ├── myelinatedAxonTool.js          # Saltatory conduction axon
│   ├── axonHillockTool.js             # Axon initial segment
│   └── bipolarSomaTool.js             # Sensory neuron soma
│
├── Graph & Scientific Tools:
│   └── graphTool.js                   # 📊 GRAPH PRESETS (action potentials, EPSP/IPSP)
│
├── Connection Tools:
│   ├── synapseTool.js                 # OLD synapse tool (being replaced by src/tools/SynapseTool.js)
│   └── synapseRenderer.js             # Synapse rendering logic
│
├── Circuit Systems:
│   ├── circuitTemplates.js            # 🔌 CIRCUIT PRESETS (reflex arcs, inhibition, feedback)
│   └── signalAnimation.js             # Signal propagation animation
│
├── Rendering & UI:
│   ├── canvasRenderer.js              # 🎨 MAIN RENDERING DISPATCH (all drawObject calls)
│   └── textEditor.js                  # Text editing functionality
│
└── Server Scripts:
    ├── start-server.sh                # macOS/Linux server launcher
    └── start-server.bat               # Windows server launcher
```

---

## Architecture Overview

### New Architecture (Phase 9 - Production Ready)
**Location**: `src/core/` and `src/tools/`

```javascript
// State Machine Pattern
import { StateMachine, InteractionState } from './src/core/StateMachine.js';

// Tool Manager Pattern
import { ToolManager } from './src/core/ToolManager.js';

// Command Pattern (Undo/Redo)
import { CommandHistory, AddObjectCommand } from './src/core/CommandHistory.js';

// Tool Implementation
import { SynapseTool } from './src/tools/SynapseTool.js';
```

**Key Files**:
1. **`src/core/StateMachine.js`** (125 lines)
   - Defines `InteractionState` enum (IDLE, DRAWING, PANNING, etc.)
   - Validates state transitions
   - Logs state changes for debugging

2. **`src/core/ToolManager.js`** (100 lines)
   - Manages tool registration and switching
   - Calls `onActivate()` and `onDeactivate()` lifecycle hooks
   - Routes events to current tool

3. **`src/core/CommandHistory.js`** (200 lines)
   - Memory-efficient undo/redo (stores commands, not full state)
   - Classes: `AddObjectCommand`, `DeleteObjectCommand`, `MoveObjectCommand`, `ModifyObjectCommand`

4. **`src/tools/base/Tool.js`** (90 lines)
   - Base class for all tools
   - Interface: `onMouseDown()`, `onMouseMove()`, `onMouseUp()`, `renderPreview()`, `reset()`

5. **`src/tools/SynapseTool.js`** (215 lines)
   - **First tool migrated to new architecture**
   - Example of proper tool implementation

### Old Architecture (Being Migrated)
**Location**: Root-level `*Tool.js` files

All tools in root directory follow old pattern:
- Export standalone functions (`startDrawing*`, `update*`, `finalize*`)
- State stored in `app.js` (tightly coupled)
- Manual cleanup required

**Migration Status**: Only `SynapseTool` migrated. Other tools still use old pattern.

---

## Tools - Complete Reference

### Basic Shape Tools (OLD Architecture)
| Tool | File | Keyboard | Description | Lines |
|------|------|----------|-------------|-------|
| Select | `app.js` | `V` | Selection/movement (built-in) | - |
| Circle | `app.js` | `C` | Circle shapes (built-in) | - |
| Rectangle | `app.js` | `R` | Rectangle shapes (built-in) | - |
| Line | `app.js` | `L` | Straight lines (built-in) | - |
| Text | `textEditor.js` | `T` | Text boxes with rich editing | ~500 |
| Freehand | `app.js` | `P` | Bezier curve freehand drawing | ~200 |
| Triangle | `triangleTool.js` | - | Pyramidal soma (3-sided) | ~150 |
| Hexagon | `hexagonTool.js` | - | Multipolar soma (6-sided) | ~150 |
| Ellipse | `ellipseTool.js` | - | Elliptical shapes | ~150 |

### Neuronal Component Tools (OLD Architecture)
| Tool | File | Keyboard | Description | Lines |
|------|------|----------|-------------|-------|
| Tapered Line | `taperedLineTool.js` | `D` | Dendrites (basal) | ~200 |
| Apical Dendrite | `apicalDendriteTool.js` | - | Pyramidal apical dendrite | ~250 |
| Unmyelinated Axon | `unmyelinatedAxonTool.js` | `A` | C-fiber (curved Bezier) | ~250 |
| Myelinated Axon | `myelinatedAxonTool.js` | `M` | Saltatory conduction | ~300 |
| Axon Hillock | `axonHillockTool.js` | `H` | Axon initial segment | ~200 |
| Bipolar Soma | `bipolarSomaTool.js` | - | Sensory neuron ellipse | ~150 |

### Scientific Tools

#### Graph Tool (OLD Architecture)
**File**: `graphTool.js` (363 lines)
**Keyboard**: `G`

**Functions**:
```javascript
startDrawingGraph(x, y)           // Initialize graph placement
finalizeGraph(x, y)                // Create graph object
applyPreset(graph, type, name)     // Apply preset curve
getControlPointAt(graph, x, y)     // Hit detection for control points
updateControlPoint(graph, idx, x, y) // Move control point
```

**Related**:
- Rendering: `canvasRenderer.js` (search for `type === 'graph'`)
- Properties Panel: `index.html` (lines 765-816)

#### Synapse Tools (NEW Architecture - ✅ MIGRATED)
**File**: `src/tools/SynapseTool.js` (215 lines)
**Types**: Excitatory, Inhibitory, Electrical

**Old File** (being phased out): `synapseTool.js`

**Functions** (New Architecture):
```javascript
class SynapseTool extends Tool {
    onMouseDown(x, y, clickedObj)   // Two-click placement
    onMouseMove(x, y)                // Preview line
    renderPreview(ctx)               // Draw preview
    canAcceptObject(obj)             // Validation
}
```

**Rendering**:
- File: `synapseRenderer.js` (300+ lines)
- Functions: `renderSynapse()`, `renderSynapsePreview()`

**Related**:
- Properties Panel: Look for synapse-specific controls in `index.html`
- Smart Attachment: `app.js:1596-1649` (`calculateSynapseAttachmentPoint()`)

---

## Graph Presets Location

**File**: `graphTool.js` (Lines 12-207)

**Constant**: `GRAPH_PRESETS`

### Structure
```javascript
export const GRAPH_PRESETS = {
  actionPotential: {
    standard: { /* Standard AP preset */ },
    fast: { /* Fast-spiking interneuron */ },
    slow: { /* Pyramidal neuron with adaptation */ },
    cardiac: { /* Ventricular myocyte */ }
  },
  synaptic: {
    epsp: { /* Excitatory postsynaptic potential */ },
    ipsp: { /* Inhibitory postsynaptic potential */ }
  }
};
```

### Available Presets

#### Action Potentials (6 total)
1. **Standard** (lines 14-48)
   - Classic Hodgkin-Huxley dynamics
   - Resting: -70mV, Threshold: -55mV, Peak: +40mV
   - Duration: ~5ms
   - 7 curve points (4 anchors + 3 controls)

2. **Fast** (lines 49-83)
   - Fast-spiking interneurons (parvalbumin+)
   - Rapid depolarization, Kv3 channels
   - Duration: ~3ms
   - Use case: Gamma oscillations

3. **Slow** (lines 84-118)
   - Regular-spiking pyramidal neurons
   - Spike frequency adaptation (M-current)
   - Duration: ~10ms
   - Pronounced afterhyperpolarization

4. **Cardiac** (lines 119-153)
   - Ventricular myocyte
   - Plateau phase (L-type Ca2+)
   - Duration: ~300ms
   - Prevents tetanic contraction

#### Synaptic Potentials (2 total)
5. **EPSP** (lines 156-180)
   - Glutamate/AMPA receptors
   - Depolarizing (toward 0mV)
   - Duration: ~20ms

6. **IPSP** (lines 181-205)
   - GABA/GABAA receptors
   - Hyperpolarizing (toward -80mV)
   - Duration: ~20ms

### Each Preset Contains
```javascript
{
  name: "Display name",
  xMin: 0, xMax: 5,              // Axes ranges
  yMin: -90, yMax: 50,
  xLabel: "Time (ms)",
  yLabel: "Membrane Potential (mV)",
  curvePoints: [                  // Bezier control points
    {
      x: 0, y: -70,
      type: 'anchor',             // 'anchor' or 'control'
      label: 'Resting',           // Phase name
      tooltip: 'Scientific explanation...'
    },
    // ... more points
  ],
  thresholdLine: {show: true, value: -55, color: '#E74C3C'},
  restingLine: {show: true, value: -70, color: '#95A5A6'}
}
```

### Tooltips (28 total)
**Location**: Lines 23, 29, 33, 38, 42 (Standard AP), 58, 63, 68, 73, 78 (Fast AP), 93, 98, 103, 108, 113 (Slow AP), 128, 133, 138, 143, 148 (Cardiac AP), 165, 175 (EPSP), 190, 195, 200 (IPSP)

All tooltips are scientifically accurate, referencing:
- Hodgkin-Huxley model
- Ion channel kinetics (Nav, Kv, Cav)
- Neurotransmitter receptors (AMPA, NMDA, GABAA)
- Textbook sources: Kandel, Purves, Bear

---

## Circuit Templates Location

**File**: `circuitTemplates.js` (715 lines)

**Available Templates**: 5 preset neural circuits

### 1. Monosynaptic Reflex Arc
**Function**: `createMonosynapticReflexArc(centerX, centerY)` (lines 31-147)

**Components**:
- Sensory neuron (bipolar soma, unmyelinated axon)
- Motor neuron (circle soma, dendrites, myelinated axon)
- 1 excitatory synapse (glutamate)

**Use Case**: Knee-jerk reflex diagram

**Returns**:
```javascript
{
  neurons: [/* 6 neuron components */],
  synapses: [/* 1 synapse */],
  name: 'Monosynaptic Reflex Arc',
  description: 'Classic knee-jerk reflex...'
}
```

### 2. Polysynaptic Reflex
**Function**: `createPolysynapticReflex(centerX, centerY)` (lines 153-306)

**Components**:
- Sensory neuron
- Interneuron (inhibitory)
- Motor neuron
- 2 synapses (excitatory → interneuron, inhibitory → motor)

**Use Case**: Withdrawal reflex

### 3. Reciprocal Inhibition
**Function**: `createReciprocalInhibition(centerX, centerY)` (lines 312-437)

**Components**:
- Sensory input
- Inhibitory interneuron
- Agonist motor neuron
- Antagonist motor neuron
- 3 synapses

**Use Case**: Antagonistic muscle control

### 4. Feedforward Inhibition
**Function**: `createFeedforwardInhibition(centerX, centerY)` (lines 443-557)

**Components**:
- Input neuron
- Inhibitory interneuron
- Output neuron
- 3 synapses (direct excitation + indirect inhibition)

**Use Case**: Cortical gain control

### 5. Feedback Loop
**Function**: `createFeedbackLoop(centerX, centerY)` (lines 563-677)

**Components**:
- 2 principal neurons
- Inhibitory interneuron
- 3 synapses (recurrent excitation with feedback inhibition)

**Use Case**: Oscillation control

### Utility Functions
```javascript
getAllCircuitTemplates()           // Lines 682-690: Returns all circuits
getCircuitTemplate(circuitType)    // Lines 697-714: Get by name ('monosynaptic', 'polysynaptic', etc.)
```

### Integration
**UI**: `index.html` (lines 470-477) - Circuits dropdown menu
**Insertion**: `app.js` - Search for `insertCircuit(circuitType)` method

---

## Rendering System

**Main File**: `canvasRenderer.js` (1000+ lines)

### Primary Functions

#### `drawObject(ctx, obj, zoom)`
**Lines**: ~50-800 (large switch statement)

Dispatches rendering based on `obj.type`:
```javascript
switch (obj.type) {
  case 'circle':              // Lines ~60-80
  case 'rectangle':           // Lines ~85-105
  case 'triangle':            // Lines ~110-130
  case 'hexagon':             // Lines ~135-155
  case 'ellipse':             // Lines ~160-180
  case 'line':                // Lines ~185-205
  case 'text':                // Lines ~210-250
  case 'freehand':            // Lines ~255-300
  case 'graph':               // Lines ~305-450
  case 'taperedLine':         // Lines ~455-500
  case 'apicalDendrite':      // Lines ~505-550
  case 'unmyelinatedAxon':    // Lines ~555-600
  case 'myelinatedAxon':      // Lines ~605-700
  case 'axonHillock':         // Lines ~705-750
  case 'bipolarSoma':         // Lines ~755-800
  case 'synapse':             // Delegates to synapseRenderer.js
  case 'image':               // Lines ~810-850
}
```

#### `drawSelection(ctx, obj, zoom)`
**Lines**: ~860-920

Draws selection UI:
- Dotted bounding box
- 8 resize handles (corners + edges)
- Rotation handle
- Endpoint handles (for lines/synapses)

#### `drawGraphSelection(ctx, graph, zoom, hoveredPointIndex)`
**Lines**: ~925-1000

Special selection for graphs:
- Control point indicators (blue squares for anchors, red circles for control points)
- Hover effects
- Label displays

### Synapse Rendering
**File**: `synapseRenderer.js` (300+ lines)

**Functions**:
- `renderSynapse(ctx, synapse, zoom, objects)` - Draw completed synapse
- `renderSynapsePreview(ctx, synapse, zoom)` - Draw placement preview

**Connection Styles**:
1. **Curved** (default): Quadratic Bezier
2. **Straight**: Direct line
3. **Elbow**: Manhattan routing (right-angle)

**Synapse Types**:
1. **Excitatory**: Red triangle symbol (`▶`)
2. **Inhibitory**: Blue bar symbol (`⊣`)
3. **Electrical**: Yellow chevron symbol (`<>`)

---

## State Management

### New System (Phase 9)
**File**: `src/core/StateMachine.js`

**States** (`InteractionState` enum):
```javascript
IDLE                          // Default state
DRAWING                       // Drawing shape
PANNING                       // Spacebar + drag
ROTATING                      // Rotating object
DRAGGING_SELECTION            // Moving selected objects
DRAGGING_GRAPH_POINT          // Dragging graph control point
PLACING_SYNAPSE_SOURCE        // First click of synapse
PLACING_SYNAPSE_TARGET        // Second click of synapse
DRAWING_SELECTION_BOX         // Drag-to-select rectangle
DRAGGING_OBJECT               // Dragging single object
```

**Usage** (in `app.js`):
```javascript
// Initialize
this.stateMachine = new StateMachine(InteractionState.IDLE);

// Transition
this.stateMachine.transition(InteractionState.DRAWING);

// Check state
if (this.stateMachine.state === InteractionState.IDLE) { ... }
```

### Old System (Being Phased Out)
**File**: `app.js`

Boolean flags (AVOID - being replaced):
```javascript
this.isDrawing = false;
this.isPanning = false;
this.isPlacingSynapse = false;
// ... 7+ flags = 128 possible states (BAD!)
```

---

## Key Functions Reference

### app.js - Core Methods

#### Selection & Hit Detection
```javascript
getObjectAt(x, y)                           // Lines 991-1005: Bounding box selection
getObjectBounds(obj)                        // Lines 1416-1560: Calculate bounds for any object
getObjectCenter(obj)                        // Lines 1533-1560: Calculate center point
getResizeHandle(world, obj)                 // Lines 1055-1400: Detect resize handle at cursor
```

#### Object Manipulation
```javascript
resizeObject(obj, handle, world, startWorld) // Lines 1651-1900: Resize logic for all object types
calculateSynapseAttachmentPoint(obj, x, y)   // Lines 1596-1649: Smart synapse snapping
```

#### State Management
```javascript
resetInteractionState()                     // Lines 799-809: Reset all boolean flags (OLD system)
switchTool(toolName)                        // Uses ToolManager (NEW system)
```

#### Event Handlers
```javascript
handleMouseDown(e)                          // Lines 280-550: All mouse press logic
handleMouseMove(e)                          // Lines 552-770: All mouse movement
handleMouseUp(e)                            // Lines 772-800: Release & finalization
handleKeyDown(e)                            // Lines 850-990: All keyboard shortcuts
```

#### Canvas Transformations
```javascript
screenToWorld(screenX, screenY)             // Convert screen coords to canvas coords (pan/zoom aware)
worldToScreen(worldX, worldY)               // Convert canvas coords to screen coords
```

#### Save/Load/Export
```javascript
save()                                      // Download .neuro JSON file
load()                                      // Upload .neuro file
export()                                    // Export PNG image
```

### textEditor.js - Text Editing

```javascript
class TextEditor {
  startEditing(textObj)                     // Begin text editing
  finishEditing()                           // Save & exit editing
  handleKeyDown(e)                          // Text input & cursor
  render(ctx)                               // Draw text cursor & selection
}
```

### graphTool.js - Graph Manipulation

```javascript
startDrawingGraph(x, y)                     // Initialize placement
finalizeGraph(x, y)                         // Create graph object
applyPreset(graph, type, name)              // Apply scientific preset
getControlPointAt(graph, x, y)              // Hit detection
updateControlPoint(graph, idx, x, y)        // Move control point
graphToCanvas(graphX, graphY, graph)        // Transform graph space → canvas
canvasToGraph(canvasX, canvasY, graph)      // Transform canvas → graph space
```

### circuitTemplates.js - Circuit Generation

```javascript
createMonosynapticReflexArc(x, y)           // Generate reflex arc
createPolysynapticReflex(x, y)              // Generate polysynaptic circuit
createReciprocalInhibition(x, y)            // Generate antagonist control
createFeedforwardInhibition(x, y)           // Generate gain control
createFeedbackLoop(x, y)                    // Generate oscillation circuit
getAllCircuitTemplates()                    // List all available
getCircuitTemplate(name)                    // Get specific circuit
```

---

## Quick Find: "Where is...?"

### "Where is the toolbar defined?"
**Answer**: `index.html` (lines 482-577)

Buttons use `data-tool` attribute:
```html
<button class="toolBtn" data-tool="select" title="Select/Move">...</button>
```

Tool switching: `app.js` (search for `.toolBtn` click handlers, around line 100-150)

---

### "Where are graph presets?"
**Answer**: `graphTool.js` (lines 12-207)
**Constant**: `GRAPH_PRESETS`
**Count**: 6 presets (4 action potentials + 2 synaptic potentials)

---

### "Where are circuit templates?"
**Answer**: `circuitTemplates.js`
**Count**: 5 circuits
**Functions**: Lines 31-677
**Utility**: Lines 682-714

---

### "Where is object rendering?"
**Answer**: `canvasRenderer.js`
**Main function**: `drawObject(ctx, obj, zoom)` (lines ~50-800)

**Special cases**:
- Synapses: Delegates to `synapseRenderer.js`
- Selection UI: `drawSelection()` (lines ~860-920)
- Graph editing: `drawGraphSelection()` (lines ~925-1000)

---

### "Where is synapse creation?"
**Answer**:
- **NEW**: `src/tools/SynapseTool.js` (215 lines) - ✅ Production ready
- **OLD**: `synapseTool.js` (being phased out)

**Rendering**: `synapseRenderer.js` (300+ lines)
**Smart Attachment**: `app.js:1596-1649`

---

### "Where is undo/redo?"
**Answer**:
- **NEW**: `src/core/CommandHistory.js` (200 lines) - Command Pattern
- **OLD**: `app.js` (search for `this.history`, `this.historyIndex`)

**NEW system** (recommended):
```javascript
const command = new AddObjectCommand(obj);
this.commandHistory.execute(command, this);
```

**OLD system** (being phased out):
```javascript
this.saveState();  // Pushes full object array snapshot
```

---

### "Where are keyboard shortcuts?"
**Answer**: `app.js` - `handleKeyDown(e)` method (lines 850-990)

**Shortcut list display**: `index.html` (lines 825-872)

**Common shortcuts**:
- `T`: Text tool (line ~967)
- `G`: Graph tool (line ~878)
- `P`: Freehand tool (line ~974)
- `D`: Dendrite tool (tapered line)
- `A`: Axon tool (unmyelinated)
- `M`: Myelinated axon
- `H`: Axon hillock
- `S`: Rotate synapse style (line ~994)

---

### "Where is the properties panel?"
**Answer**: `index.html` (lines 584-817)

**Sections**:
- Canvas settings (lines 585-587)
- Zoom controls (lines 588-595)
- Dimensions (lines 597-612)
- Object properties (lines 613-817)
  - General props (lines 640-651)
  - Text props (lines 655-702)
  - Tapered line props (lines 705-729)
  - Graph props (lines 765-816)

**Update handlers**: `app.js` (search for `updateSelectedProp`, `updateObjectDimension`)

---

### "Where is save/load/export?"
**Answer**: `app.js`

**Functions**:
- `save()`: Lines ~1950-1980 (download .neuro JSON)
- `load()`: Lines ~1985-2020 (upload .neuro JSON)
- `export()`: Lines ~2025-2080 (export PNG)

**File format**: `.neuro` = JSON with:
```javascript
{
  objects: [...],        // All canvas objects
  zoom: 1,
  panX: 0, panY: 0,
  showGrid: false,
  version: '1.0'
}
```

---

### "Where is text editing?"
**Answer**: `textEditor.js` (500+ lines)

**Class**: `TextEditor`

**Integration**: `app.js` imports and uses:
```javascript
import { TextEditor } from './textEditor.js';
this.textEditor = new TextEditor(this.canvas);
```

**Double-click to edit**: `app.js` (search for `this.textEditor.startEditing`)

---

### "Where is selection logic?"
**Answer**: `app.js`

**Functions**:
- Click selection: `getObjectAt(x, y)` (lines 991-1005)
- Selection box: `handleMouseDown()` → `handleMouseMove()` (search for `isDrawingSelectionBox`)
- Bounds calculation: `getObjectBounds(obj)` (lines 1416-1560)

**Selection rendering**: `canvasRenderer.js` → `drawSelection()` (lines ~860-920)

---

### "Where are resize handles?"
**Answer**: `app.js`

**Detection**: `getResizeHandle(world, obj)` (lines 1055-1400)
**Resizing**: `resizeObject(obj, handle, world, startWorld)` (lines 1651-1900)

**Handle types**:
- 8-handle system: `nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`
- Endpoint handles: `source`, `target` (for lines/synapses)
- Rotation handle: `rotate`

**Rendering**: `canvasRenderer.js` → `drawSelection()` (lines ~860-920)

---

## Adding New Features

### Adding a New Tool (NEW Architecture - Recommended)

**1. Create tool class**:
```javascript
// src/tools/MyNewTool.js
import { Tool } from './base/Tool.js';

export class MyNewTool extends Tool {
  constructor() {
    super('my-new-tool');
    this.state = {
      // Tool-specific state here
    };
  }

  onMouseDown(x, y, clickedObj, app) {
    // Handle click
    return {
      object: myNewObject,              // Optional: object to add
      stateTransition: InteractionState.DRAWING  // Optional: state change
    };
  }

  onMouseMove(x, y, app) {
    // Handle movement
  }

  onMouseUp(x, y, app) {
    // Handle release
  }

  renderPreview(ctx, app) {
    // Draw preview (if needed)
  }

  reset() {
    this.state = {};
  }

  onDeactivate() {
    this.reset();  // AUTO-CLEANUP!
  }
}
```

**2. Register tool**:
```javascript
// app.js - init() method
import { MyNewTool } from './src/tools/MyNewTool.js';

this.toolManager.register(new MyNewTool());
```

**3. Add toolbar button**:
```html
<!-- index.html -->
<button class="toolBtn" data-tool="my-new-tool" title="My Tool">🔧</button>
```

**4. Add rendering**:
```javascript
// canvasRenderer.js - drawObject() switch
case 'my-new-object':
  // Rendering code
  break;
```

**Time**: ~1 hour (vs 4+ hours with old architecture)

---

### Adding a New Graph Preset

**Location**: `graphTool.js` (lines 12-207)

**1. Add to `GRAPH_PRESETS`**:
```javascript
export const GRAPH_PRESETS = {
  actionPotential: {
    // ... existing presets
    myNewPreset: {
      name: 'My Action Potential',
      xMin: 0, xMax: 5,
      yMin: -90, yMax: 50,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {x: 0, y: -70, type: 'anchor', label: 'Resting', tooltip: 'Scientific explanation...'},
        {x: 0.5, y: -60, type: 'control'},
        {x: 1, y: -55, type: 'anchor', label: 'Threshold', tooltip: 'Explanation...'},
        // ... more points
      ],
      thresholdLine: {show: true, value: -55, color: '#E74C3C'},
      restingLine: {show: true, value: -70, color: '#95A5A6'}
    }
  }
};
```

**2. Add to UI dropdown**:
```html
<!-- index.html - lines ~775-781 -->
<select id="graphPreset" onchange="app.updateGraphPreset(this.value)">
  <option value="standard">Standard</option>
  <option value="fast">Fast</option>
  <option value="slow">Slow</option>
  <option value="cardiac">Cardiac</option>
  <option value="myNewPreset">My Preset</option> <!-- ADD THIS -->
</select>
```

**Time**: ~30 minutes

---

### Adding a New Circuit Template

**Location**: `circuitTemplates.js`

**1. Create generator function**:
```javascript
/**
 * Generate my custom circuit
 * @param {number} centerX - Center X position
 * @param {number} centerY - Center Y position
 */
export function createMyCustomCircuit(centerX = 400, centerY = 300) {
  const neurons = [];
  const synapses = [];

  // Create neurons (use existing object types)
  const neuron1 = {
    type: 'circle',
    x: centerX - 100,
    y: centerY,
    radius: 30,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  neurons.push(neuron1 /*, more neurons... */);

  // Create synapses
  const synapse1 = {
    type: 'synapse',
    id: 'syn_custom_' + Date.now(),
    sourceObj: neuron1,
    targetObj: neuron2,
    sourcePoint: {x: centerX - 70, y: centerY},
    targetPoint: {x: centerX + 70, y: centerY},
    synapseType: 'excitatory',
    strength: 1.0,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    connectionStyle: 'curved',
    showSymbol: true
  };

  synapses.push(synapse1 /*, more synapses... */);

  return {
    neurons: neurons,
    synapses: synapses,
    name: 'My Custom Circuit',
    description: 'Brief scientific description.'
  };
}
```

**2. Add to utility functions**:
```javascript
// Update getAllCircuitTemplates() - lines 682-690
export function getAllCircuitTemplates() {
  return [
    // ... existing
    {name: 'My Custom Circuit', generator: createMyCustomCircuit}
  ];
}

// Update getCircuitTemplate() - lines 697-714
export function getCircuitTemplate(circuitType) {
  const templates = {
    // ... existing
    'mycustom': createMyCustomCircuit
  };
  // ...
}
```

**3. Add to UI dropdown**:
```html
<!-- index.html - lines 472-476 -->
<div id="circuitsMenu" ...>
  <!-- ... existing circuits ... -->
  <button class="circuitOption" onclick="app.insertCircuit('mycustom')">My Custom Circuit</button>
</div>
```

**Time**: ~1-2 hours

---

## Important Files - Priority List

**MUST READ** (Before coding):
1. `CLAUDE.md` - Architecture patterns and mandatory practices
2. `docs/neurosketchPRP.md` - Product requirements
3. `implemented.md` - What's done, what's next

**CORE FILES** (Modify frequently):
1. `app.js` - Main orchestrator
2. `canvasRenderer.js` - All rendering
3. `index.html` - UI structure

**NEW ARCHITECTURE** (Production ready):
1. `src/core/StateMachine.js`
2. `src/core/ToolManager.js`
3. `src/core/CommandHistory.js`
4. `src/tools/SynapseTool.js` (migration example)

**PRESETS & TEMPLATES** (Educational content):
1. `graphTool.js` - 6 scientific graph presets
2. `circuitTemplates.js` - 5 neural circuit templates

**TOOLS** (Old architecture - to be migrated):
1. `triangleTool.js`, `hexagonTool.js`, `ellipseTool.js`
2. `taperedLineTool.js`, `apicalDendriteTool.js`
3. `unmyelinatedAxonTool.js`, `myelinatedAxonTool.js`
4. `axonHillockTool.js`, `bipolarSomaTool.js`

---

## Architecture Patterns (MANDATORY)

**From `CLAUDE.md` - Section 0:**

### Pattern 0.1: State Machine (REQUIRED)
❌ **NEVER**: Boolean flag explosion
✅ **ALWAYS**: Use `StateMachine` and `InteractionState` enum

### Pattern 0.2: Strategy Pattern for Tools (REQUIRED)
❌ **NEVER**: Tool state in app.js
✅ **ALWAYS**: Extend `Tool` base class

### Pattern 0.3: Command Pattern for History (REQUIRED)
❌ **NEVER**: Full state snapshots
✅ **ALWAYS**: Use `CommandHistory` with command objects

### Pattern 0.9: All Objects MUST Be Selectable (REQUIRED)
✅ **EVERY new object type must**:
1. Implement `getObjectBounds(obj)` - Lines 1416-1560 in app.js
2. Implement `getObjectCenter(obj)` - Lines 1533-1560 in app.js
3. Test: Select, Delete, Move, Copy, Resize

**Example (Synapse)**:
```javascript
// app.js:1507-1515
} else if (obj.type === 'synapse') {
    const tolerance = 10;
    return {
        left: Math.min(obj.sourcePoint.x, obj.targetPoint.x) - tolerance,
        right: Math.max(obj.sourcePoint.x, obj.targetPoint.x) + tolerance,
        top: Math.min(obj.sourcePoint.y, obj.targetPoint.y) - tolerance,
        bottom: Math.max(obj.sourcePoint.y, obj.targetPoint.y) + tolerance
    };
}
```

---

## Testing Checklist (For ANY New Feature)

### Basic Object Tests
- [ ] Create object
- [ ] Click to select
- [ ] Delete key removes it
- [ ] Drag to move
- [ ] Ctrl+C / Ctrl+V copies
- [ ] Resize handles appear
- [ ] Undo/Redo works

### Connection Object Tests (synapses, lines)
- [ ] Endpoint handles visible
- [ ] Drag endpoints to reconnect
- [ ] Smart attachment to shapes

### Performance Tests
- [ ] Works with 50+ objects
- [ ] Maintains 60 FPS
- [ ] Export at 4K resolution
- [ ] Save/Load preserves all properties

---

## Debugging Tips

### "Tool is stuck / not resetting"
**Check**: `resetInteractionState()` called in `app.js:799-809`
**Fix**: Ensure tool switching calls `this.toolManager.switchTool(name)` (NEW) or manually resets flags (OLD)

### "Object not selectable"
**Check**: `getObjectBounds(obj)` implemented in `app.js:1416-1560`
**Fix**: Add bounds calculation for your object type

### "Object not rendering"
**Check**: `drawObject()` switch in `canvasRenderer.js:~50-800`
**Fix**: Add case for your object type

### "Synapse not connecting"
**Check**: `calculateSynapseAttachmentPoint()` in `app.js:1596-1649`
**Fix**: Add attachment logic for your object type

### "Graph preset not loading"
**Check**: `GRAPH_PRESETS` structure in `graphTool.js:12-207`
**Fix**: Ensure curvePoints have correct structure (anchor vs control)

### "State machine errors"
**Check**: Console logs from `StateMachine.js` (auto-logs transitions)
**Fix**: Ensure valid state transitions in `InteractionState` enum

---

## Common Code Locations - Cheat Sheet

| What | Where | Lines |
|------|-------|-------|
| **Toolbar buttons** | `index.html` | 482-577 |
| **Properties panel** | `index.html` | 584-817 |
| **Main app init** | `app.js` → `init()` | ~100-120 |
| **Mouse events** | `app.js` | 280-800 |
| **Keyboard shortcuts** | `app.js` → `handleKeyDown()` | 850-990 |
| **Object bounds** | `app.js` → `getObjectBounds()` | 1416-1560 |
| **Resize logic** | `app.js` → `resizeObject()` | 1651-1900 |
| **Rendering dispatch** | `canvasRenderer.js` → `drawObject()` | 50-800 |
| **Selection UI** | `canvasRenderer.js` → `drawSelection()` | 860-920 |
| **Graph presets** | `graphTool.js` → `GRAPH_PRESETS` | 12-207 |
| **Circuit templates** | `circuitTemplates.js` | 31-677 |
| **Synapse rendering** | `synapseRenderer.js` | Entire file |
| **State machine** | `src/core/StateMachine.js` | Entire file |
| **Tool manager** | `src/core/ToolManager.js` | Entire file |
| **Undo/Redo** | `src/core/CommandHistory.js` | Entire file |
| **Tool base class** | `src/tools/base/Tool.js` | Entire file |

---

## Next Steps (Architecture Phases 2-4)

### Phase 2: Observer Pattern + MVC (8-10 hours)
- Objects emit events
- Synapses auto-update when neurons move
- Model/View/Controller separation

### Phase 3: Event Handling Refactor (6-8 hours)
- Remove all early returns
- Switch-based event flow
- Defensive validation

### Phase 4: Migration & Testing (4-6 hours)
- Migrate remaining tools to new architecture
- Comprehensive testing
- Documentation updates

**Total Remaining**: 18-24 hours

---

## Questions?

### "I want to add X feature. Where do I start?"
1. Read `CLAUDE.md` Section 0 (mandatory patterns)
2. Read relevant section of `docs/neurosketchPRP.md`
3. Check `implemented.md` for conflicts
4. Use this guide to find relevant code locations
5. Follow architecture patterns (State Machine, Tool Manager, Command Pattern)

### "I found a bug. How do I fix it?"
1. Check console logs (State Machine auto-logs transitions)
2. Use debugging tips above
3. Reference architecture checklist in `CLAUDE.md:713-731`
4. Test with checklist (Basic Object Tests + Performance Tests)

### "I want to understand the architecture. What do I read?"
**Priority order**:
1. `CLAUDE.md` - Section 0 (Architecture Patterns)
2. This file (`DEV_INSTRUCTIONS.md`)
3. `docs/neurosketchPRP.md` (Product Requirements)
4. `implemented.md` (Current Status)
5. Source files (start with `src/` for new architecture)

---

**Last Updated**: 2025-10-10 by Claude (Anthropic)
**Architecture Phase**: 9 Complete (State Machine, Tool Manager, Command Pattern)
**Production Ready**: ✅ Core systems stable, synapses fully functional
