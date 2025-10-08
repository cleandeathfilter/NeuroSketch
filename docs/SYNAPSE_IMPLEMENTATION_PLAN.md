# Synaptic Connection Tools - Implementation Plan
**Comprehensive Best-Practice Analysis & Architecture Design**

**Date**: 2025-10-08
**Status**: PRE-IMPLEMENTATION ANALYSIS COMPLETE
**Implementation Phase**: READY TO EXECUTE

---

## 📋 Table of Contents

1. [Codebase Analysis](#codebase-analysis)
2. [Current Architecture Patterns](#current-architecture-patterns)
3. [Synapse Tool Design](#synapse-tool-design)
4. [File Structure](#file-structure)
5. [Scientific Requirements](#scientific-requirements)
6. [Implementation Steps](#implementation-steps)
7. [Testing Strategy](#testing-strategy)
8. [Integration Checklist](#integration-checklist)

---

## 🔍 Codebase Analysis

### Current Project Statistics

```
Total JavaScript Files: 13
Total Lines of Code:    6,445
Main Orchestrator:      app.js (2,981 lines)
Renderer:               canvasRenderer.js (1,148 lines)
Tools:                  11 modular tool files
```

### Technology Stack

- **Pure ES6 Modules** (no bundler, no npm)
- **HTML5 Canvas API** (2D context)
- **CSS-in-HTML** (inline styles, no separate CSS files)
- **Module Pattern**: Import/export ES6 syntax
- **State Management**: Single `app` object with history stack
- **Event Handling**: Canvas-based event listeners

### Key Architectural Decisions

1. ✅ **Modular Tool Pattern**: Each tool is a separate ES6 module
2. ✅ **Separation of Concerns**: Tool logic ≠ Rendering logic
3. ✅ **Stateless Tools**: Tools export pure functions, state managed by app.js
4. ✅ **Convention Over Configuration**: Consistent naming (`startDrawing`, `update`, `finalize`, `render`, `isPointOn/In`)
5. ✅ **Scientific Accuracy First**: Inline JSDoc comments reference research folder

---

## 🏗️ Current Architecture Patterns

### Pattern 1: Tool Module Structure

**Every tool follows this exact pattern:**

```javascript
// toolName.js

/**
 * Tool Name - Description
 *
 * Scientific accuracy notes
 * Source: research references
 */

// 1. START FUNCTION (called on mousedown)
export function startDrawingToolName(x, y, state, config) {
  return {
    type: 'toolName',
    x1: x,
    y1: y,
    x2: x,
    y2: y,
    // ...object properties
  };
}

// 2. UPDATE FUNCTION (called on mousemove while drawing)
export function updateToolName(obj, currentX, currentY) {
  obj.x2 = currentX;
  obj.y2 = currentY;
}

// 3. FINALIZE FUNCTION (called on mouseup)
export function finalizeToolName(obj) {
  // Calculate, adjust, validate
  return obj;
}

// 4. RENDER FUNCTION (called by canvasRenderer.js)
export function renderToolName(ctx, obj, zoom = 1) {
  // Canvas drawing code
}

// 5. HIT DETECTION (called for selection)
export function isPointOnToolName(obj, px, py, tolerance = 10) {
  // Collision detection math
  return boolean;
}
```

### Pattern 2: Object Data Model

**All drawable objects have this structure:**

```javascript
{
  type: 'objectType',        // Identifies object class
  x, y / x1, y1, x2, y2,     // Position data
  width, height,             // Dimensions (if applicable)
  strokeColor,               // Primary color
  strokeWidth,               // Line thickness
  fillColor,                 // Fill color (optional)
  // Type-specific properties
  rotation: 0,               // Rotation in degrees (added via transform)
  // Scientific properties
  showGradient: true,        // Visual enhancements
  // ...
}
```

### Pattern 3: Rendering Integration

**canvasRenderer.js acts as dispatcher:**

```javascript
export function drawObject(ctx, obj, editingObj, zoom, isDarkMode) {
  // Skip if being edited
  if (editingObj && obj === editingObj) return;

  // Handle rotation
  const hasRotation = obj.rotation && obj.rotation !== 0;
  if (hasRotation) {
    ctx.save();
    // Apply rotation transform
  }

  // Type-based dispatch
  if (obj.type === 'circle') drawCircle(ctx, obj, zoom);
  else if (obj.type === 'taperedLine') renderTaperedLine(ctx, obj, zoom);
  // ...add new types here

  if (hasRotation) ctx.restore();
}
```

### Pattern 4: App.js Integration

**State management and event handling:**

```javascript
// app.js

import { startDrawingToolName, updateToolName, finalizeToolName, isPointOnToolName } from './toolNameTool.js';

export const app = {
  currentTool: 'select',
  objects: [],
  isDrawing: false,
  tempObject: null,

  handleMouseDown(e) {
    if (this.currentTool === 'toolName') {
      const {x, y} = this.screenToWorld(e.clientX, e.clientY);
      this.tempObject = startDrawingToolName(x, y, this, config);
      this.isDrawing = true;
    }
  },

  handleMouseMove(e) {
    if (this.isDrawing && this.tempObject) {
      const {x, y} = this.screenToWorld(e.clientX, e.clientY);
      updateToolName(this.tempObject, x, y);
      this.render();
    }
  },

  handleMouseUp(e) {
    if (this.isDrawing && this.tempObject) {
      finalizeToolName(this.tempObject);
      this.objects.push(this.tempObject);
      this.tempObject = null;
      this.isDrawing = false;
      this.saveState(); // Undo/redo
      this.render();
    }
  }
};
```

### Pattern 5: Scientific Accuracy Integration

**Research folder provides exact specifications:**

```javascript
// From research/visual-standards/color-coding.md
const SYNAPSE_COLORS = {
  excitatory: {
    terminal: '#E74C3C',    // Exact hex from research
    vesicles: '#EC7063',
    symbol: '▶',            // Triangle pointing to postsynaptic
  },
  inhibitory: {
    terminal: '#3498DB',    // Exact hex from research
    vesicles: '#5DADE2',
    symbol: '⊣',            // Bar at postsynaptic
  },
  electrical: {
    junction: '#F1C40F',    // Yellow/gold
    symbol: '<>',           // Bidirectional chevrons
  }
};
```

---

## 🔗 Synapse Tool Design

### Design Philosophy

**Synapses are CONNECTIONS, not standalone objects**

This is fundamentally different from existing tools:
- **Existing tools**: Draw shapes at fixed positions (circles, lines, neurons)
- **Synapse tools**: Create relationships between TWO existing objects (neurons)

**Key Design Decision**: Synapses are **connection objects** with:
1. `sourceId` - Reference to source neuron
2. `targetId` - Reference to target neuron
3. `synapseType` - excitatory/inhibitory/electrical
4. `connectionPoints` - Auto-calculated attachment points

### Synapse Object Model

```javascript
{
  type: 'synapse',
  id: 'synapse_' + Date.now(),  // Unique identifier

  // Connection references
  sourceId: 'neuronId1',  // ID of source neuron object
  targetId: 'neuronId2',  // ID of target neuron object

  // Connection points (auto-calculated, stored for performance)
  sourcePoint: { x: 100, y: 200 },  // Attachment point on source
  targetPoint: { x: 300, y: 250 },  // Attachment point on target

  // Synapse properties
  synapseType: 'excitatory',  // 'excitatory', 'inhibitory', 'electrical'
  strength: 1.0,              // 0.1-2.0, affects visual thickness
  neurotransmitter: 'glutamate',  // 'glutamate', 'gaba', 'dopamine', etc.

  // Visual properties (from research/visual-standards/color-coding.md)
  terminalColor: '#E74C3C',
  connectionStyle: 'curved',  // 'straight', 'curved', 'elbow'
  showNeurotransmitter: true,
  showSymbol: true,

  // Routing
  controlPoints: [],  // For curved connections (Bezier)

  // Animation
  signalPosition: 0,  // 0-1, for signal propagation animation
  isAnimating: false
}
```

### Two-Click Interaction Pattern

**New pattern for NeuroSketch:**

```javascript
// synapseTool.js

let synapseToolState = {
  mode: 'awaiting_source',  // 'awaiting_source' | 'awaiting_target' | 'placing'
  sourceNeuron: null,
  sourcePoint: null,
  currentMousePos: null
};

export function startSynapseTool(synapseType) {
  synapseToolState = {
    mode: 'awaiting_source',
    synapseType: synapseType,
    sourceNeuron: null,
    sourcePoint: null
  };
}

export function handleSynapseClick(clickedObject, clickPoint, allObjects) {
  if (synapseToolState.mode === 'awaiting_source') {
    // First click - select source neuron
    if (isNeuronObject(clickedObject)) {
      synapseToolState.sourceNeuron = clickedObject;
      synapseToolState.sourcePoint = findBestAttachmentPoint(clickedObject, clickPoint);
      synapseToolState.mode = 'awaiting_target';
      return null; // No synapse created yet
    }
  } else if (synapseToolState.mode === 'awaiting_target') {
    // Second click - select target neuron
    if (isNeuronObject(clickedObject) && clickedObject !== synapseToolState.sourceNeuron) {
      const targetPoint = findBestAttachmentPoint(clickedObject, clickPoint);
      const synapse = createSynapse(
        synapseToolState.sourceNeuron,
        synapseToolState.sourcePoint,
        clickedObject,
        targetPoint,
        synapseToolState.synapseType
      );

      // Reset state
      synapseToolState = {mode: 'awaiting_source', sourceNeuron: null};
      return synapse; // Return new synapse object
    }
  }
}

export function updateSynapsePreview(currentMouseX, currentMouseY) {
  // Show preview line while selecting target
  if (synapseToolState.mode === 'awaiting_target') {
    synapseToolState.currentMousePos = {x: currentMouseX, y: currentMouseY};
  }
}
```

### Smart Attachment Point Calculation

```javascript
/**
 * Find best attachment point on neuron for synapse
 * Prioritizes: axon terminal (source) → dendrite/soma (target)
 */
function findBestAttachmentPoint(neuronObj, clickPoint) {
  // For source (presynaptic): Prioritize axon terminal
  // For target (postsynaptic): Prioritize dendrites > soma

  if (neuronObj.type === 'myelinatedAxon' || neuronObj.type === 'unmyelinatedAxon') {
    // Return terminal end point (x2, y2)
    return {x: neuronObj.x2, y: neuronObj.y2};
  } else if (neuronObj.type === 'taperedLine' && neuronObj.isDendrite) {
    // Attach to dendrite at clicked location
    return projectPointOntoLine(clickPoint, neuronObj);
  } else if (neuronObj.type === 'circle' || neuronObj.type === 'bipolarSoma') {
    // Soma - attach at perimeter closest to click
    return closestPointOnCircle(clickPoint, neuronObj);
  }

  // Default: use click point
  return clickPoint;
}
```

### Connection Routing Algorithm

```javascript
/**
 * Calculate curved connection path between neurons
 * Avoids straight lines overlapping neurons (looks more realistic)
 */
function calculateConnectionPath(sourcePoint, targetPoint, style, allObjects) {
  if (style === 'straight') {
    return {
      path: [sourcePoint, targetPoint],
      type: 'line'
    };
  } else if (style === 'curved') {
    // Bezier curve with auto-calculated control points
    const midPoint = {
      x: (sourcePoint.x + targetPoint.x) / 2,
      y: (sourcePoint.y + targetPoint.y) / 2
    };

    // Offset perpendicular to connection for curve
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length;
    const perpY = dx / length;

    const controlPoint = {
      x: midPoint.x + perpX * length * 0.2,  // 20% offset
      y: midPoint.y + perpY * length * 0.2
    };

    return {
      path: [sourcePoint, controlPoint, targetPoint],
      type: 'quadratic'
    };
  } else if (style === 'elbow') {
    // Right-angle connection (Manhattan routing)
    const elbowPoint = {
      x: sourcePoint.x,
      y: targetPoint.y
    };
    return {
      path: [sourcePoint, elbowPoint, targetPoint],
      type: 'polyline'
    };
  }
}
```

---

## 📁 File Structure

### New Files to Create

```
NeuroSketch/
├── synapseTool.js                  # Main synapse tool module
├── synapseRenderer.js              # Synapse rendering logic
├── circuitTemplates.js             # Preset circuits (reflex arc, etc.)
├── signalAnimation.js              # Signal propagation animation
└── research/
    └── synapses/
        └── chemical-synapses.md    # Scientific specifications (TO CREATE)
```

### File Size Estimates

Based on existing tool patterns:
- `synapseTool.js`: ~400-500 lines (complex interaction logic)
- `synapseRenderer.js`: ~300-400 lines (multiple synapse types)
- `circuitTemplates.js`: ~200-300 lines (5 preset circuits)
- `signalAnimation.js`: ~150-200 lines (animation system)
- `research/synapses/chemical-synapses.md`: ~600-800 lines (scientific specs)

**Total new code**: ~1,650-2,300 lines

### Integration Points

**Files to modify:**

1. **app.js** (~100 lines added)
   - Import synapse modules
   - Add synapse tool handlers to handleMouseDown/Move/Up
   - Add synapse selection logic
   - Add signal animation update loop

2. **canvasRenderer.js** (~50 lines added)
   - Add synapse rendering dispatch: `else if (obj.type === 'synapse') renderSynapse(...)`
   - Add synapse preview rendering during placement

3. **index.html** (~80 lines added)
   - Add 4 toolbar buttons (excitatory, inhibitory, electrical, pathway)
   - Add "Circuits" menu button to top bar
   - Add properties panel sections for synapse settings
   - Add animation controls (play/pause/reset)

---

## 🔬 Scientific Requirements

### From Research Folder Analysis

**Synapse Colors** (research/visual-standards/color-coding.md:157-198):

```javascript
const SYNAPSE_SPECS = {
  excitatory: {
    terminal: '#E74C3C',      // Red (research line 162)
    vesicles: '#EC7063',      // Lighter red (line 163)
    symbol: '▶',              // Triangle (line 164)
    connection: '#E74C3C',    // Solid line (line 165)
    neurotransmitter: 'Glutamate'
  },
  inhibitory: {
    terminal: '#3498DB',      // Blue (line 172)
    vesicles: '#5DADE2',      // Lighter blue (line 173)
    symbol: '⊣',              // Bar/circle (line 174)
    connection: '#3498DB',    // Solid line (line 175)
    neurotransmitter: 'GABA'
  },
  electrical: {
    junction: '#F1C40F',      // Yellow/gold (line 182)
    symbol: '<>',             // Chevrons (line 183)
    connection: 'dashed',     // Dashed yellow (line 184)
    bidirectional: true
  }
};
```

**Neurotransmitter Types** (to research and add to `research/synapses/chemical-synapses.md`):

1. **Glutamate** (excitatory) - most common in brain
2. **GABA** (inhibitory) - main inhibitory NT
3. **Dopamine** (modulatory) - reward, motor control
4. **Serotonin** (modulatory) - mood, arousal
5. **Acetylcholine** (excitatory at NMJ, modulatory in brain) - motor neurons, attention

### Synapse Visual Standards

**Symbol Placement** (textbook conventions):

- **Excitatory**: Triangle (▶) points TO postsynaptic neuron
- **Inhibitory**: Bar (⊣) or circle (⊙) AT postsynaptic contact
- **Electrical**: Bidirectional chevrons (<>) or lightning bolt (⚡)

**Connection Line Styles**:
- Excitatory: Solid line, arrow head
- Inhibitory: Solid line, bar ending
- Electrical: Dashed line, bidirectional
- Modulatory: Dotted line, curved

---

## 🛠️ Implementation Steps

### Phase 1: Core Synapse Tool (6-8 hours)

**Step 1.1: Create synapseTool.js**

```javascript
/**
 * synapseTool.js - Synaptic Connection Tool
 *
 * Creates connections between neurons with scientifically accurate
 * excitatory, inhibitory, and electrical synapse representations.
 *
 * Interaction: Two-click placement (source → target)
 * Research: research/synapses/chemical-synapses.md
 */

// State machine for two-click interaction
let synapseState = {
  mode: 'idle',  // 'idle' | 'source_selected' | 'placing'
  synapseType: null,
  sourceObj: null,
  sourcePoint: null,
  tempTargetPoint: null
};

// Initialize synapse tool with type
export function initSynapseTool(type) {
  synapseState = {
    mode: 'idle',
    synapseType: type,  // 'excitatory', 'inhibitory', 'electrical'
    sourceObj: null,
    sourcePoint: null
  };
}

// Handle first click (source selection)
export function selectSynapseSource(clickedObj, clickPoint) {
  if (!isValidNeuronComponent(clickedObj)) return false;

  synapseState.sourceObj = clickedObj;
  synapseState.sourcePoint = calculateAttachmentPoint(clickedObj, clickPoint, 'source');
  synapseState.mode = 'source_selected';
  return true;
}

// Handle second click (target selection and synapse creation)
export function selectSynapseTarget(clickedObj, clickPoint) {
  if (!isValidNeuronComponent(clickedObj)) return null;
  if (clickedObj === synapseState.sourceObj) return null;  // Can't connect to self

  const targetPoint = calculateAttachmentPoint(clickedObj, clickPoint, 'target');

  const synapse = {
    type: 'synapse',
    id: 'syn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),

    // References (store object reference, not just ID for performance)
    sourceObj: synapseState.sourceObj,
    targetObj: clickedObj,

    // Attachment points
    sourcePoint: synapseState.sourcePoint,
    targetPoint: targetPoint,

    // Synapse properties
    synapseType: synapseState.synapseType,
    strength: 1.0,
    neurotransmitter: getSynapseNeurotransmitter(synapseState.synapseType),

    // Visual
    ...getSynapseVisualProperties(synapseState.synapseType),
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,

    // Animation
    signalPosition: 0,
    isAnimating: false
  };

  // Reset state
  synapseState = {mode: 'idle', synapseType: null, sourceObj: null};

  return synapse;
}

// Update preview during mouse movement (after source selected)
export function updateSynapsePreview(mouseX, mouseY) {
  if (synapseState.mode === 'source_selected') {
    synapseState.tempTargetPoint = {x: mouseX, y: mouseY};
  }
}

// Get current preview data for rendering
export function getSynapsePreview() {
  if (synapseState.mode === 'source_selected') {
    return {
      sourcePoint: synapseState.sourcePoint,
      targetPoint: synapseState.tempTargetPoint,
      synapseType: synapseState.synapseType
    };
  }
  return null;
}

// Helper: Check if object can be synapse endpoint
function isValidNeuronComponent(obj) {
  const validTypes = [
    'circle',           // Soma
    'bipolarSoma',      // Soma
    'taperedLine',      // Dendrite
    'apicalDendrite',   // Dendrite
    'myelinatedAxon',   // Axon
    'unmyelinatedAxon', // Axon
    'axonHillock'       // Axon initial segment
  ];
  return validTypes.includes(obj.type);
}

// Helper: Calculate best attachment point
function calculateAttachmentPoint(obj, clickPoint, role) {
  // role: 'source' (presynaptic) or 'target' (postsynaptic)

  if (role === 'source') {
    // Presynaptic: attach to axon terminal (end of axon)
    if (obj.type === 'myelinatedAxon' || obj.type === 'unmyelinatedAxon') {
      return {x: obj.x2, y: obj.y2};  // Terminal end
    }
  }

  if (role === 'target') {
    // Postsynaptic: attach to dendrite or soma
    if (obj.type === 'taperedLine' || obj.type === 'apicalDendrite') {
      // Project click onto dendrite line
      return projectPointOntoLine(clickPoint, obj);
    } else if (obj.type === 'circle' || obj.type === 'bipolarSoma') {
      // Closest point on soma perimeter
      return closestPointOnCirclePerimeter(clickPoint, obj);
    }
  }

  // Default: use click point
  return clickPoint;
}

// Helper: Project point onto line segment
function projectPointOntoLine(point, lineObj) {
  const dx = lineObj.x2 - lineObj.x1;
  const dy = lineObj.y2 - lineObj.y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return {x: lineObj.x1, y: lineObj.y1};

  let t = ((point.x - lineObj.x1) * dx + (point.y - lineObj.y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));  // Clamp to [0, 1]

  return {
    x: lineObj.x1 + t * dx,
    y: lineObj.y1 + t * dy
  };
}

// Helper: Get synapse visual properties from research specs
function getSynapseVisualProperties(type) {
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

// Helper: Get default neurotransmitter for synapse type
function getSynapseNeurotransmitter(type) {
  const mapping = {
    excitatory: 'Glutamate',
    inhibitory: 'GABA',
    electrical: null  // No neurotransmitter (direct electrical coupling)
  };
  return mapping[type];
}

// Helper: Closest point on circle perimeter
function closestPointOnCirclePerimeter(point, circleObj) {
  const dx = point.x - circleObj.x;
  const dy = point.y - circleObj.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return {x: circleObj.x + circleObj.radius, y: circleObj.y};

  return {
    x: circleObj.x + (dx / distance) * circleObj.radius,
    y: circleObj.y + (dy / distance) * circleObj.radius
  };
}

// Reset synapse tool
export function resetSynapseTool() {
  synapseState = {mode: 'idle', synapseType: null, sourceObj: null};
}

// Check if synapse tool is active
export function isSynapseToolActive() {
  return synapseState.mode !== 'idle';
}
```

**Step 1.2: Create synapseRenderer.js**

```javascript
/**
 * synapseRenderer.js - Synapse Rendering Module
 *
 * Renders chemical and electrical synapses with textbook-quality visuals
 * Research: research/synapses/chemical-synapses.md
 * Color specs: research/visual-standards/color-coding.md
 */

/**
 * Main synapse rendering function
 */
export function renderSynapse(ctx, synapse, zoom = 1, isDarkMode = false) {
  // Update connection points if neurons have moved
  updateSynapseConnectionPoints(synapse);

  // Calculate connection path
  const path = calculateConnectionPath(
    synapse.sourcePoint,
    synapse.targetPoint,
    synapse.connectionStyle
  );

  // Draw connection line
  drawConnectionLine(ctx, path, synapse, zoom);

  // Draw terminal symbols
  if (synapse.showSymbol) {
    drawSynapseSymbol(ctx, synapse, path, zoom);
  }

  // Draw neurotransmitter label
  if (synapse.showNeurotransmitter && synapse.neurotransmitter) {
    drawNeurotransmitterLabel(ctx, synapse, path, zoom);
  }

  // Draw signal animation
  if (synapse.isAnimating) {
    drawSignalAnimation(ctx, synapse, path, zoom);
  }
}

/**
 * Update synapse connection points if neurons have moved
 */
function updateSynapseConnectionPoints(synapse) {
  // Check if source/target objects still exist
  if (!synapse.sourceObj || !synapse.targetObj) return;

  // Recalculate if neurons have moved
  // (Simple check: if stored points don't match object positions)
  // This could be optimized with dirty flagging, but keeping simple for now

  // For now, assume points are static (neurons moved -> synapse reconnects on next render)
  // More advanced: track object transforms and update attachment points
}

/**
 * Calculate connection path (straight, curved, or elbow)
 */
function calculateConnectionPath(start, end, style) {
  if (style === 'straight') {
    return {
      type: 'line',
      points: [start, end]
    };
  } else if (style === 'curved') {
    // Quadratic Bezier curve
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Offset perpendicular to line for curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length;
    const perpY = dx / length;

    const controlPoint = {
      x: midX + perpX * length * 0.15,  // 15% curve
      y: midY + perpY * length * 0.15
    };

    return {
      type: 'quadratic',
      points: [start, controlPoint, end]
    };
  } else if (style === 'elbow') {
    // Manhattan routing
    const elbowX = start.x;
    const elbowY = end.y;
    return {
      type: 'polyline',
      points: [start, {x: elbowX, y: elbowY}, end]
    };
  }
}

/**
 * Draw connection line
 */
function drawConnectionLine(ctx, path, synapse, zoom) {
  ctx.save();

  // Line style
  ctx.strokeStyle = synapse.connectionColor;
  ctx.lineWidth = (2 * synapse.strength) / zoom;

  if (synapse.lineStyle === 'dashed') {
    ctx.setLineDash([10 / zoom, 5 / zoom]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();

  if (path.type === 'line') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    ctx.lineTo(path.points[1].x, path.points[1].y);
  } else if (path.type === 'quadratic') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    ctx.quadraticCurveTo(
      path.points[1].x, path.points[1].y,
      path.points[2].x, path.points[2].y
    );
  } else if (path.type === 'polyline') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw synapse symbol at target
 */
function drawSynapseSymbol(ctx, synapse, path, zoom) {
  const target = path.points[path.points.length - 1];

  // Calculate direction at target
  let direction;
  if (path.type === 'quadratic') {
    // Direction from control point to target
    const control = path.points[1];
    direction = {
      x: target.x - control.x,
      y: target.y - control.y
    };
  } else {
    // Direction from penultimate to target
    const previous = path.points[path.points.length - 2];
    direction = {
      x: target.x - previous.x,
      y: target.y - previous.y
    };
  }

  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  direction.x /= length;
  direction.y /= length;

  ctx.save();
  ctx.fillStyle = synapse.terminalColor;
  ctx.strokeStyle = synapse.terminalColor;
  ctx.lineWidth = 2 / zoom;

  if (synapse.synapseType === 'excitatory') {
    // Triangle pointing to target
    drawExcitatorySymbol(ctx, target, direction, zoom);
  } else if (synapse.synapseType === 'inhibitory') {
    // Bar perpendicular to connection
    drawInhibitorySymbol(ctx, target, direction, zoom);
  } else if (synapse.synapseType === 'electrical') {
    // Bidirectional chevrons
    drawElectricalSymbol(ctx, target, direction, zoom);
  }

  ctx.restore();
}

/**
 * Draw excitatory triangle symbol (▶)
 */
function drawExcitatorySymbol(ctx, position, direction, zoom) {
  const size = 12 / zoom;
  const perpX = -direction.y;
  const perpY = direction.x;

  ctx.beginPath();
  // Tip
  ctx.moveTo(position.x, position.y);
  // Base left
  ctx.lineTo(
    position.x - direction.x * size + perpX * size * 0.5,
    position.y - direction.y * size + perpY * size * 0.5
  );
  // Base right
  ctx.lineTo(
    position.x - direction.x * size - perpX * size * 0.5,
    position.y - direction.y * size - perpY * size * 0.5
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw inhibitory bar symbol (⊣)
 */
function drawInhibitorySymbol(ctx, position, direction, zoom) {
  const size = 12 / zoom;
  const perpX = -direction.y;
  const perpY = direction.x;

  ctx.beginPath();
  // Bar perpendicular to connection
  ctx.moveTo(
    position.x + perpX * size * 0.6,
    position.y + perpY * size * 0.6
  );
  ctx.lineTo(
    position.x - perpX * size * 0.6,
    position.y - perpY * size * 0.6
  );
  ctx.stroke();

  // Optional: Add small circle at connection point
  ctx.beginPath();
  ctx.arc(position.x, position.y, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw electrical gap junction symbol (<>)
 */
function drawElectricalSymbol(ctx, position, direction, zoom) {
  const size = 10 / zoom;
  const perpX = -direction.y;
  const perpY = direction.x;

  // Left chevron
  ctx.beginPath();
  ctx.moveTo(position.x - direction.x * size * 0.5, position.y - direction.y * size * 0.5);
  ctx.lineTo(position.x + perpX * size * 0.5, position.y + perpY * size * 0.5);
  ctx.lineTo(position.x + direction.x * size * 0.5, position.y + direction.y * size * 0.5);
  ctx.stroke();

  // Right chevron (mirrored)
  ctx.beginPath();
  ctx.moveTo(position.x - direction.x * size * 0.5, position.y - direction.y * size * 0.5);
  ctx.lineTo(position.x - perpX * size * 0.5, position.y - perpY * size * 0.5);
  ctx.lineTo(position.x + direction.x * size * 0.5, position.y + direction.y * size * 0.5);
  ctx.stroke();
}

/**
 * Draw neurotransmitter label
 */
function drawNeurotransmitterLabel(ctx, synapse, path, zoom) {
  const midPoint = calculatePathMidpoint(path);

  ctx.save();
  ctx.font = `${12 / zoom}px Arial`;
  ctx.fillStyle = synapse.connectionColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background for readability
  const text = synapse.neurotransmitter;
  const metrics = ctx.measureText(text);
  const padding = 4 / zoom;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(
    midPoint.x - metrics.width / 2 - padding,
    midPoint.y - 6 / zoom - padding,
    metrics.width + padding * 2,
    12 / zoom + padding * 2
  );

  ctx.fillStyle = synapse.connectionColor;
  ctx.fillText(text, midPoint.x, midPoint.y);

  ctx.restore();
}

/**
 * Calculate midpoint on path (for label placement)
 */
function calculatePathMidpoint(path) {
  if (path.type === 'line') {
    return {
      x: (path.points[0].x + path.points[1].x) / 2,
      y: (path.points[0].y + path.points[1].y) / 2
    };
  } else if (path.type === 'quadratic') {
    // Bezier curve at t=0.5
    const t = 0.5;
    const p0 = path.points[0];
    const p1 = path.points[1];
    const p2 = path.points[2];
    return {
      x: (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x,
      y: (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y
    };
  } else {
    // Polyline: use midpoint of middle segment
    const mid = Math.floor(path.points.length / 2);
    return path.points[mid];
  }
}

/**
 * Draw signal animation (traveling wave)
 */
function drawSignalAnimation(ctx, synapse, path, zoom) {
  // Draw small circle traveling along path
  const position = calculatePointOnPath(path, synapse.signalPosition);

  ctx.save();
  ctx.fillStyle = synapse.connectionColor;
  ctx.globalAlpha = 0.8;

  // Pulsing circle
  const baseRadius = 6 / zoom;
  const pulseRadius = baseRadius * (1 + 0.3 * Math.sin(Date.now() * 0.01));

  ctx.beginPath();
  ctx.arc(position.x, position.y, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(position.x, position.y, pulseRadius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Calculate point on path at parameter t (0-1)
 */
function calculatePointOnPath(path, t) {
  if (path.type === 'line') {
    const p0 = path.points[0];
    const p1 = path.points[1];
    return {
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y)
    };
  } else if (path.type === 'quadratic') {
    const p0 = path.points[0];
    const p1 = path.points[1];
    const p2 = path.points[2];
    return {
      x: (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x,
      y: (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y
    };
  } else {
    // Polyline: interpolate across segments
    const totalLength = calculatePolylineLength(path.points);
    const targetLength = totalLength * t;

    let accumulatedLength = 0;
    for (let i = 0; i < path.points.length - 1; i++) {
      const p0 = path.points[i];
      const p1 = path.points[i + 1];
      const segmentLength = Math.sqrt((p1.x-p0.x)**2 + (p1.y-p0.y)**2);

      if (accumulatedLength + segmentLength >= targetLength) {
        const localT = (targetLength - accumulatedLength) / segmentLength;
        return {
          x: p0.x + localT * (p1.x - p0.x),
          y: p0.y + localT * (p1.y - p0.y)
        };
      }
      accumulatedLength += segmentLength;
    }
    return path.points[path.points.length - 1];
  }
}

/**
 * Calculate total length of polyline
 */
function calculatePolylineLength(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/**
 * Render synapse preview during placement
 */
export function renderSynapsePreview(ctx, sourcePoint, targetPoint, synapseType, zoom) {
  ctx.save();

  const visualProps = {
    excitatory: {color: '#E74C3C'},
    inhibitory: {color: '#3498DB'},
    electrical: {color: '#F1C40F'}
  }[synapseType];

  // Dashed preview line
  ctx.strokeStyle = visualProps.color;
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([8 / zoom, 4 / zoom]);
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  ctx.moveTo(sourcePoint.x, sourcePoint.y);
  ctx.lineTo(targetPoint.x, targetPoint.y);
  ctx.stroke();

  // Source circle
  ctx.fillStyle = visualProps.color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(sourcePoint.x, sourcePoint.y, 6 / zoom, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

---

This implementation plan is comprehensive and follows all best practices observed in the codebase.

**Should I proceed with implementation? Or would you like me to adjust any aspect of the design first?**
