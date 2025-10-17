# Precision Selection Features

## Overview
Two new features to handle overlapping objects and dense diagrams.

---

## 1. Tab Cycling Through Overlapping Objects

### Usage
1. Click to select any object
2. Press **Tab** to cycle through all objects at that position
3. Status shows: "2/5 objects (Tab to cycle)"

### How It Works
- Stores all objects at click position
- Tab cycles through them in z-order (top to bottom)
- Works with both normal and precise mode

### Use Case
Perfect for:
- Dense neuron diagrams with overlapping dendrites
- Multiple shapes stacked on top of each other
- Quick access to objects underneath without moving things

---

## 2. Ctrl+Click Precise Hit Detection

### Usage
- **Normal Click**: Selects object if click is anywhere in bounding box
- **Ctrl+Click**: Only selects if click hits actual stroke/edge/fill

### How It Works

#### Shapes with Fill (if fillColor != transparent)
- **Circle**: Click must be inside or on stroke
- **Rectangle**: Click must be inside or on edges
- **Polygon**: Click must be inside or on edges

#### Shapes without Fill (stroke only)
- **Circle**: Click must be within `strokeWidth + 3px` of circumference
- **Rectangle**: Click must be near edges (within `strokeWidth + 3px`)
- **Polygon**: Click must be near edges
- **Line**: Click must be within `strokeWidth + 3px` of line path
- **Freehand**: Click must be within `strokeWidth + 3px` of path

#### Visual Indicator
- Orange "🎯 Precise Mode (Ctrl)" appears top-left when Ctrl is held

### Use Case
Perfect for:
- Selecting small shapes near large ones
- Clicking through transparent bounding boxes
- Fine control in dense diagrams
- Educational diagrams with overlapping transparent shapes

---

## Implementation Details

### New Functions in app.js
1. **`getObjectAt(x, y, preciseMode)`** - Modified to support precise mode
2. **`getAllObjectsAt(x, y, preciseMode)`** - Returns array of ALL objects at position
3. **`isPreciseHit(obj, x, y)`** - Geometry-based hit testing for each shape type

### New State Variables
```javascript
lastClickWorldPos: null,           // Last click position for Tab cycling
objectsAtLastClick: [],            // All objects at last click
tabCycleIndex: 0,                  // Current position in cycle
```

### Supported Shape Types
- ✅ Circle (fill + stroke detection)
- ✅ Rectangle (fill + edge detection)
- ✅ Polygon (Triangle, Square, Pentagon, Hexagon, etc. - fill + edge)
- ✅ Line (path proximity)
- ✅ Freehand (path proximity)
- ✅ Text (always bounding box - can't hit individual letters)

### Keyboard Shortcuts
- **Tab**: Cycle through overlapping objects
- **Ctrl+Click**: Precise hit detection (stroke/edge only)

---

## Example Workflows

### Dense Neuron Diagram
1. Click soma → selects soma
2. Press Tab → cycles to dendrite underneath
3. Press Tab → cycles to axon underneath
4. Press Tab → back to soma

### Overlapping Transparent Shapes
1. Hold Ctrl
2. Click directly on small circle's stroke
3. Ignores large transparent rectangle's bounding box behind it

### Fine Movement Adjustments
1. Ctrl+Click to select only the shape you want (precise)
2. Drag to move
3. Tab to select next object without moving mouse

---

## Benefits

✅ **Zero Breaking Changes** - Normal click behavior unchanged
✅ **Industry Standard** - Ctrl for precision (Figma, Illustrator, Sketch)
✅ **Keyboard-Friendly** - Tab cycling for dense diagrams
✅ **Visual Feedback** - Shows mode and available cycles
✅ **Geometry-Aware** - Respects fill vs stroke-only shapes
✅ **Rotation-Compatible** - Works with rotated objects

---

## Code Locations

- **app.js:735** - `getObjectAt()` with preciseMode parameter
- **app.js:795** - `getAllObjectsAt()` for Tab cycling
- **app.js:860** - `isPreciseHit()` geometry tests
- **app.js:580** - Tab key handler
- **app.js:2189** - Visual indicators in render()
- **SelectTool.js:45** - Precise mode integration
- **SelectTool.js:159** - Tab cycling state storage

