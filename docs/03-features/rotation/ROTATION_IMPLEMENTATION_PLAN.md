# Rotation Implementation Plan - REFINED ✅

## Current State Analysis ✅

**GOOD NEWS**: Rotation is already 90% implemented in NeuroSketch!

### Already Implemented ✅
1. ✅ **SelectTool rotation detection** - `_isClickingRotateHandle()`
2. ✅ **Rotation calculation** - Uses atan2 for angle calculation
3. ✅ **ROTATING interaction state** - In StateMachine.js
4. ✅ **Rotation application** - Updates `obj.rotation` property
5. ✅ **Canvas rendering** - drawObject() applies rotation transform
6. ✅ **Rotation handle drawing** - Shows curved arrow above objects
7. ✅ **Center calculation** - `getObjectCenter()` for all shapes

### What's Missing/Needs Improvement 🔧

#### 1. Rotation in Radians vs Degrees (INCONSISTENCY)
**Current Code (Line 299):**
```javascript
obj.rotation = this.state.initialRotation + angleDelta;
```
- atan2 returns **radians**
- Canvas rotate() expects **radians**
- But we want to store in **degrees** for user-friendly display
- Current code mixes radians and degrees!

**FIX**: Convert properly between radians and degrees

#### 2. Missing Shift-Key Snap to 15°
No code for snapping rotation to 15° increments when Shift is pressed.

**FIX**: Add snap logic in onMouseMove

#### 3. Missing Properties Panel Rotation Input
No UI input for manually entering rotation angle.

**FIX**: Add rotation input to properties panel

#### 4. Click Detection for Rotated Objects (CRITICAL)
Current `getObjectAt()` doesn't account for rotation - clicking rotated shapes might fail.

**FIX**: Transform click coordinates to object's local space

#### 5. Rotation Normalization
No normalization to 0-360 range (angles can be negative or > 360).

**FIX**: Add normalization

## Implementation Plan

### Phase 1: Fix Rotation Angle Calculation 🔧
**File**: `src/tools/SelectTool.js`
**Lines**: 294-300

**Current (BROKEN):**
```javascript
if (state === InteractionState.ROTATING && this.state.isRotating) {
    const obj = app.selectedObjects[0];
    const center = app.getObjectCenter(obj);
    const currentAngle = Math.atan2(worldY - center.y, worldX - center.x);
    const angleDelta = currentAngle - this.state.rotationStartAngle;
    obj.rotation = this.state.initialRotation + angleDelta;  // ❌ Radians!
    return { preview: true };
}
```

**Fixed (DEGREES):**
```javascript
if (state === InteractionState.ROTATING && this.state.isRotating) {
    const obj = app.selectedObjects[0];
    const center = app.getObjectCenter(obj);
    const currentAngle = Math.atan2(worldY - center.y, worldX - center.x);
    const angleDelta = currentAngle - this.state.rotationStartAngle;
    
    // Convert radians to degrees
    let newRotation = this.state.initialRotation + (angleDelta * 180 / Math.PI);
    
    // Optional: Snap to 15° increments with Shift
    if (app.shiftPressed) {
        newRotation = Math.round(newRotation / 15) * 15;
    }
    
    // Normalize to 0-360
    obj.rotation = ((newRotation % 360) + 360) % 360;
    
    return { preview: true };
}
```

### Phase 2: Ensure Consistent Degree Storage 🔧
**File**: `src/tools/SelectTool.js`
**Line**: 137

**Check initialization:**
```javascript
this.state.initialRotation = obj.rotation || 0;
```
- Assumes `obj.rotation` is in degrees ✅
- canvasRenderer.js converts to radians when rendering ✅

**Verify in canvasRenderer.js (Line 37):**
```javascript
ctx.rotate(obj.rotation * Math.PI / 180); // Converts degrees to radians ✅
```

### Phase 3: Add Properties Panel Rotation Input 🆕
**File**: `index.html`
**Location**: Inside properties panel sections

**Add to regular object properties:**
```html
<!-- Rotation Input (add after position inputs) -->
<div class="propRow" id="rotationInputRow">
    <label>Rotation:</label>
    <input type="number" 
           id="objectRotation" 
           value="0" 
           min="0" 
           max="360" 
           step="1"
           onchange="app.updateObjectDimension('rotation', this.value)">
    <span style="margin-left: 4px;">°</span>
</div>
```

**Update in app.js:**
```javascript
// In updatePropertiesPanel() - show rotation for all objects
rotationInputRow.style.display = 'flex';
document.getElementById('objectRotation').value = Math.round(obj.rotation || 0);
```

**Add to updateObjectDimension():**
```javascript
} else if (prop === 'rotation') {
    // Normalize rotation to 0-360
    obj.rotation = ((numValue % 360) + 360) % 360;
}
```

### Phase 4: Fix Click Detection for Rotated Objects 🆕
**File**: `app.js`
**Function**: `getObjectAt(x, y)`

**Current Logic:**
```javascript
getObjectAt(x, y) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
        const obj = this.objects[i];
        const bounds = this.getObjectBounds(obj);
        
        // Simple bounds check ❌ Doesn't work for rotated objects!
        if (x >= bounds.left && x <= bounds.right && 
            y >= bounds.top && y <= bounds.bottom) {
            return obj;
        }
    }
}
```

**Fixed Logic:**
```javascript
getObjectAt(x, y) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
        const obj = this.objects[i];
        
        // Handle rotated objects by transforming click to local space
        let testX = x;
        let testY = y;
        
        if (obj.rotation && obj.rotation !== 0) {
            const center = this.getObjectCenter(obj);
            const angle = -obj.rotation * Math.PI / 180; // Inverse rotation
            
            // Rotate click point into object's local space
            const dx = x - center.x;
            const dy = y - center.y;
            testX = center.x + dx * Math.cos(angle) - dy * Math.sin(angle);
            testY = center.y + dx * Math.sin(angle) + dy * Math.cos(angle);
        }
        
        // Check bounds with transformed coordinates
        const bounds = this.getObjectBounds(obj);
        if (testX >= bounds.left && testX <= bounds.right &&
            testY >= bounds.top && testY <= bounds.bottom) {
            
            // For polygons/specific shapes, do more precise detection
            if (obj.type === 'freehand') {
                // Existing freehand path detection...
            }
            
            return obj;
        }
    }
    return null;
}
```

### Phase 5: Visual Feedback - Show Angle During Rotation 🆕
**File**: `canvasRenderer.js` or `app.js` render loop

**Add angle indicator:**
```javascript
// In render() - show rotation angle while rotating
if (this.stateMachine.state === InteractionState.ROTATING && 
    this.selectedObjects.length === 1) {
    const obj = this.selectedObjects[0];
    const center = this.getObjectCenter(obj);
    const screen = this.worldToScreen(center.x, center.y);
    
    // Draw angle text
    this.ctx.save();
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = this.isDarkMode ? '#FFFFFF' : '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.round(obj.rotation)}°`, screen.x, screen.y - 30);
    this.ctx.restore();
}
```

## Complete Implementation Checklist

### Critical Fixes 🔧
- [ ] Fix rotation angle calculation (radians → degrees)
- [ ] Add Shift-key snap to 15° increments
- [ ] Add rotation normalization (0-360)
- [ ] Fix click detection for rotated objects

### Enhancements 🆕
- [ ] Add rotation input to properties panel
- [ ] Show angle indicator during rotation
- [ ] Update properties panel to show current rotation
- [ ] Ensure rotation persists in save/load

### Testing 🧪
- [ ] Rotate polygon - smooth rotation
- [ ] Rotate text - readable at all angles
- [ ] Rotate line - pivots around center
- [ ] Shift+rotate - snaps to 15° increments
- [ ] Click rotated object - selects correctly
- [ ] Type rotation in properties - updates object
- [ ] Rotate, save, load - rotation persists
- [ ] Multiple rotations - accumulates correctly
- [ ] Resize after rotation - maintains rotation

## Files to Modify

1. **src/tools/SelectTool.js** (~20 lines modified)
   - Fix rotation calculation (radians to degrees)
   - Add Shift-snap logic
   - Add normalization

2. **app.js** (~50 lines modified)
   - Update `getObjectAt()` for rotated click detection
   - Add rotation to `updateObjectDimension()`
   - Add rotation to `updatePropertiesPanel()`
   - Add angle indicator in render loop

3. **index.html** (~10 lines added)
   - Add rotation input to properties panel

## Estimated Time: 1-2 hours
**Complexity**: EASY (infrastructure exists, just fixing bugs)

## Key Formulas

### Rotation Transform (2D)
```javascript
// Rotate point (px, py) around center (cx, cy) by angle θ (radians)
x' = cx + (px - cx) * cos(θ) - (py - cy) * sin(θ)
y' = cy + (px - cx) * sin(θ) + (py - cy) * cos(θ)
```

### Inverse Rotation (for click detection)
```javascript
// Use negative angle: -θ
angle = -obj.rotation * Math.PI / 180
```

### Angle from Point
```javascript
// Angle from center to point
angle = Math.atan2(y - cy, x - cx) // Returns radians [-π, π]
degrees = angle * 180 / Math.PI    // Convert to degrees
```

### Normalization
```javascript
// Normalize angle to [0, 360)
normalized = ((angle % 360) + 360) % 360
```

## Success Criteria

✅ All shapes (polygons, text, lines, circles) rotate smoothly
✅ Rotation around correct centroid for each shape type
✅ Shift-key snaps to 15° increments
✅ Properties panel shows and accepts rotation input
✅ Clicking rotated objects selects them correctly
✅ Rotation angle displayed during rotation
✅ Rotation persists through save/load
✅ Undo/redo works for rotation

