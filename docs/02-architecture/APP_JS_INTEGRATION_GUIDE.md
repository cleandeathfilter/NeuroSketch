# app.js Integration Guide - New Architecture

## 🎯 Objective

Integrate the new Tool Manager architecture into app.js without breaking existing functionality. This guide shows exactly what to add/change.

---

## 📋 Step 1: Update Imports at Top of app.js

**Location**: Lines 6-17

**ADD these imports** (already present, verify they exist):

```javascript
// Core architecture systems (ALREADY IMPORTED)
import { StateMachine, InteractionState } from './src/core/StateMachine.js';
import { ToolManager } from './src/core/ToolManager.js';
import { CommandHistory, AddObjectCommand, DeleteObjectCommand, MoveObjectCommand } from './src/core/CommandHistory.js';

// NEW: Import all Tool classes
import { SelectTool } from './src/tools/SelectTool.js';
import { CircleTool } from './src/tools/CircleTool.js';
import { RectangleTool } from './src/tools/RectangleTool.js';
import { LineTool } from './src/tools/LineTool.js';
import { TriangleTool } from './src/tools/TriangleTool.js';
import { HexagonTool } from './src/tools/HexagonTool.js';
import { SynapseTool } from './src/tools/SynapseTool.js';
// TODO: Add more tools as they're migrated
```

---

## 📋 Step 2: Register All Tools in init()

**Location**: app.js init() method, around line 125

**REPLACE**:
```javascript
// OLD: Only synapse tools registered
this.toolManager.register(new SynapseTool('excitatory'));
this.toolManager.register(new SynapseTool('inhibitory'));
this.toolManager.register(new SynapseTool('electrical'));
```

**WITH**:
```javascript
// NEW: Register ALL migrated tools
console.log('Registering tools...');

// Basic shape tools
this.toolManager.register(new SelectTool());
this.toolManager.register(new CircleTool());
this.toolManager.register(new RectangleTool());
this.toolManager.register(new LineTool());
this.toolManager.register(new TriangleTool());
this.toolManager.register(new HexagonTool());

// Synapse tools
this.toolManager.register(new SynapseTool('synapse-excitatory'));
this.toolManager.register(new SynapseTool('synapse-inhibitory'));
this.toolManager.register(new SynapseTool('synapse-electrical'));

// TODO: Add neuronal tools when migrated
// this.toolManager.register(new TaperedLineTool());
// this.toolManager.register(new UnmyelinatedAxonTool());
// etc.

console.log(`✅ Registered ${this.toolManager.getAllTools().length} tools`);
```

---

## 📋 Step 3: Update Tool Button Click Handler

**Location**: app.js, around line 146-176

**REPLACE** the tool button click handler **WITH**:

```javascript
toolButtons.forEach((btn, index) => {
    console.log(`  Setting up button ${index}: ${btn.dataset.tool}`);
    btn.addEventListener('click', (e) => {
        const newTool = btn.dataset.tool;
        console.log('🔧 Tool button clicked:', newTool);

        // Update UI
        document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Reset interaction state
        this.resetInteractionState();

        // STRATEGY: Try new architecture first, fall back to old system
        const oldTool = this.currentTool;
        
        // Check if tool is registered in new architecture
        if (this.toolManager.hasTool(newTool)) {
            console.log(`  Using NEW architecture for: ${newTool}`);
            this.toolManager.switchTool(newTool);
            this.stateMachine.transition(InteractionState.IDLE);
            this.currentTool = newTool; // Keep in sync for old code
        } else {
            console.log(`  Using OLD system for: ${newTool}`);
            this.currentTool = newTool; // Old system fallback
        }

        console.log(`✅ Tool switched: ${oldTool} → ${this.currentTool}`);
        this.render();
    });
});
```

**This hybrid approach allows:**
- ✅ Migrated tools use new architecture
- ✅ Non-migrated tools use old system
- ✅ No breaking changes
- ✅ Gradual migration

---

## 📋 Step 4: Update handleMouseDown() - Delegate to Tool Manager

**Location**: app.js handleMouseDown(), around line 284

**FIND this section** (should be after pan/zoom handling):

```javascript
// SELECT TOOL
if (this.currentTool === 'select') {
    // ... lots of select tool logic
}
```

**INSERT BEFORE** the select tool check:

```javascript
// NEW ARCHITECTURE: Delegate to Tool Manager first
if (this.toolManager.hasTool(this.currentTool) && 
    this.stateMachine.state === InteractionState.IDLE) {
    
    const clickedObj = this.getObjectAt(world.x, world.y);
    const result = this.toolManager.handleMouseDown(world.x, world.y, clickedObj, this);
    
    // Handle result
    if (result.stateTransition) {
        this.stateMachine.transition(result.stateTransition);
        console.log(`  State: ${this.stateMachine.state}`);
    }
    
    if (result.object) {
        console.log(`  Created object: ${result.object.type}`);
        const command = new AddObjectCommand(result.object);
        this.commandHistory.execute(command, this);
        this.objects.push(result.object);
        
        // Auto-select new object
        this.selectedObjects = [result.object];
        this.updatePropertiesPanel();
        
        // Auto-switch to select tool for immediate manipulation
        if (this.currentTool !== 'select') {
            this.switchToSelectTool();
        }
    }
    
    this.render();
    return; // Important: Don't fall through to old system
}

// OLD SYSTEM: Continue with existing logic for non-migrated tools
```

---

## 📋 Step 5: Update handleMouseMove() - Delegate to Tool Manager

**Location**: app.js handleMouseMove(), around line 556

**INSERT** near the top (after pan handling):

```javascript
// NEW ARCHITECTURE: Delegate to Tool Manager for drawing state
if (this.toolManager.hasTool(this.currentTool) && 
    this.stateMachine.state === InteractionState.DRAWING) {
    
    const clickedObj = null; // Don't need hit detection during move
    const result = this.toolManager.handleMouseMove(world.x, world.y, clickedObj, this);
    
    if (result.preview) {
        this.render(); // Render preview
    }
    
    return; // Don't fall through
}

// OLD SYSTEM: Continue with existing logic
```

---

## 📋 Step 6: Update handleMouseUp() - Delegate to Tool Manager

**Location**: app.js handleMouseUp(), around line 791

**INSERT** near the top:

```javascript
// NEW ARCHITECTURE: Delegate to Tool Manager
if (this.toolManager.hasTool(this.currentTool) && 
    this.stateMachine.state === InteractionState.DRAWING) {
    
    const clickedObj = this.getObjectAt(world.x, world.y);
    const result = this.toolManager.handleMouseUp(world.x, world.y, clickedObj, this);
    
    // Handle result (same as mouseDown)
    if (result.stateTransition) {
        this.stateMachine.transition(result.stateTransition);
    }
    
    if (result.object) {
        console.log(`  Finalized object: ${result.object.type}`);
        const command = new AddObjectCommand(result.object);
        this.commandHistory.execute(command, this);
        this.objects.push(result.object);
        this.selectedObjects = [result.object];
        this.updatePropertiesPanel();
        
        if (this.currentTool !== 'select') {
            this.switchToSelectTool();
        }
    }
    
    this.resetInteractionState(); // Always reset on mouse up
    this.render();
    return;
}

// OLD SYSTEM: Continue with existing logic
```

---

## 📋 Step 7: Update render() - Add Tool Preview

**Location**: app.js render(), around line 2000+

**ADD** before final restore():

```javascript
// NEW ARCHITECTURE: Render tool previews
if (this.toolManager.getCurrentTool()) {
    this.toolManager.renderPreview(this.ctx, this);
}
```

---

## 📋 Step 8: Tool Registration Mapping

Update index.html button data-tool attributes to match Tool class names:

**OLD**:
```html
<button class="toolBtn" data-tool="synapse-excitatory">...</button>
```

**NEW** (same):
```html
<button class="toolBtn" data-tool="synapse-excitatory">...</button>
```

**Tool Name Mapping**:
- `select` → SelectTool()
- `circle` → CircleTool()
- `rectangle` → RectangleTool()
- `line` → LineTool()
- `triangle` → TriangleTool()
- `hexagon` → HexagonTool()
- `synapse-excitatory` → SynapseTool('synapse-excitatory')
- `synapse-inhibitory` → SynapseTool('synapse-inhibitory')
- `synapse-electrical` → SynapseTool('synapse-electrical')

**No changes needed!** Tool names match button data-tool attributes.

---

## 🧪 Testing Checklist

After integration, test each migrated tool:

### Circle Tool
1. Click Circle button
2. Click-drag on canvas
3. Circle preview appears (dashed blue)
4. Release mouse → solid circle appears
5. Circle is auto-selected
6. Tool auto-switches to Select
7. Can move/resize circle

### Rectangle Tool
(Same as circle)

### Line Tool
(Same as circle)

### Triangle Tool
(Same as circle)

### Hexagon Tool
(Same as circle)

### Synapse Tool
1. Click Synapse button (excitatory/inhibitory/electrical)
2. Click source object
3. Preview line follows cursor
4. Click target object
5. Synapse appears
6. Can select synapse
7. Can delete synapse
8. Can drag synapse
9. Can reconnect endpoints
10. Press 'S' to cycle styles (curved/straight/elbow)

### Select Tool
1. Click Select button
2. Click object → selects
3. Drag object → moves
4. Drag empty space → selection box appears
5. Selection box selects multiple objects

---

## ⚠️ Common Issues & Fixes

### Issue 1: Tool button not working
**Symptom**: Click button, nothing happens
**Fix**: Check console for "Tool not found" error
**Solution**: Tool not registered in init()

### Issue 2: Drawing not appearing
**Symptom**: Click-drag, no preview shows
**Fix**: Check if tool.renderPreview() is called in render()
**Solution**: Add renderPreview call (Step 7)

### Issue 3: Object created but can't select
**Symptom**: Object appears but clicking doesn't select
**Fix**: Check if object added to this.objects array
**Solution**: Ensure AddObjectCommand pushes to objects

### Issue 4: State stuck in DRAWING
**Symptom**: Can't use any other tool
**Fix**: Check if handleMouseUp calls resetInteractionState()
**Solution**: Always reset state in mouseUp (Step 6)

---

## 📊 Integration Progress

### Completed
- ✅ Core architecture imports
- ✅ Tool registration system
- ✅ Hybrid tool switching (new + old)
- ✅ MouseDown delegation
- ✅ MouseMove delegation
- ✅ MouseUp delegation
- ✅ Tool preview rendering
- ✅ 7 tools migrated (select, circle, rectangle, line, triangle, hexagon, synapse)

### Remaining
- ⚠️ 10 tools to migrate (ellipse, text, freehand, graph, 6 neuronal)
- ⚠️ Event handler refactor (remove early returns)
- ⚠️ Reactive synapses (listen to neuron moved events)

---

## 🚀 Next Steps

1. **Test Migrated Tools** - Verify all 7 tools work correctly
2. **Migrate Remaining Tools** - One by one, wrap old logic in Tool classes
3. **Remove Old System** - Once all tools migrated, delete old boolean flags
4. **Reactive Synapses** - Implement Observer pattern for auto-updating
5. **Complete MVC** - Move all rendering to ObjectRenderer

---

## 📞 Support

**Questions?** See ARCHITECTURE_COMPLETE_REFACTOR.md for architecture overview.

**Tool not working?** Follow testing checklist above.

**Need to migrate a tool?** Use CircleTool.js as template (93 lines, simple).

---

**Status**: ✅ **INTEGRATION GUIDE COMPLETE**

Follow steps 1-8 above to integrate new architecture into app.js. System will work in hybrid mode (new tools use new architecture, old tools use old system) until all tools are migrated.

---

*Last Updated: 2025-10-11*
