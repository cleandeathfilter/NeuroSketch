# NeuroSketch - Quick Integration (30 Minutes)

## 🚀 Get the New Architecture Running NOW

This guide gets you from zero to working new architecture in 30 minutes.

---

## ✅ Step 1: Verify Files Exist (2 minutes)

Check these files exist (they were just created):

```bash
src/core/StateMachine.js ✅
src/core/EventEmitter.js ✅
src/core/ToolManager.js ✅
src/core/CommandHistory.js ✅
src/objects/BaseObject.js ✅
src/tools/base/Tool.js ✅
src/tools/SelectTool.js ✅
src/tools/CircleTool.js ✅
src/tools/RectangleTool.js ✅
src/tools/LineTool.js ✅
src/tools/TriangleTool.js ✅
src/tools/HexagonTool.js ✅
src/tools/SynapseTool.js ✅ (already exists)
```

All files created? ✅ Continue to Step 2.

---

## ✅ Step 2: Update app.js Imports (3 minutes)

Open `app.js` and find the imports section (around line 6).

**ADD these imports AFTER the existing SynapseTool import:**

```javascript
// NEW: Import all Tool classes
import { SelectTool } from './src/tools/SelectTool.js';
import { CircleTool } from './src/tools/CircleTool.js';
import { RectangleTool } from './src/tools/RectangleTool.js';
import { LineTool } from './src/tools/LineTool.js';
import { TriangleTool } from './src/tools/TriangleTool.js';
import { HexagonTool } from './src/tools/HexagonTool.js';
```

**Your imports should now look like this:**
```javascript
// Core architecture systems
import { StateMachine, InteractionState } from './src/core/StateMachine.js';
import { ToolManager } from './src/core/ToolManager.js';
import { CommandHistory, AddObjectCommand } from './src/core/CommandHistory.js';
import { SynapseTool } from './src/tools/SynapseTool.js';

// NEW: Tool classes
import { SelectTool } from './src/tools/SelectTool.js';
import { CircleTool } from './src/tools/CircleTool.js';
import { RectangleTool } from './src/tools/RectangleTool.js';
import { LineTool } from './src/tools/LineTool.js';
import { TriangleTool } from './src/tools/TriangleTool.js';
import { HexagonTool } from './src/tools/HexagonTool.js';
```

---

## ✅ Step 3: Register Tools in init() (3 minutes)

Find the `init()` method in app.js (around line 125).

**FIND this section:**
```javascript
// Register tools with new architecture
console.log('Registering tools...');
this.toolManager.register(new SynapseTool('excitatory'));
this.toolManager.register(new SynapseTool('inhibitory'));
this.toolManager.register(new SynapseTool('electrical'));
```

**REPLACE WITH:**
```javascript
// Register tools with new architecture
console.log('Registering tools...');

// Basic shape tools (NEW!)
this.toolManager.register(new SelectTool());
this.toolManager.register(new CircleTool());
this.toolManager.register(new RectangleTool());
this.toolManager.register(new LineTool());
this.toolManager.register(new TriangleTool());
this.toolManager.register(new HexagonTool());

// Synapse tools (existing)
this.toolManager.register(new SynapseTool('synapse-excitatory'));
this.toolManager.register(new SynapseTool('synapse-inhibitory'));
this.toolManager.register(new SynapseTool('synapse-electrical'));

console.log(`✅ Registered ${this.toolManager.getAllTools().length} tools`);
```

---

## ✅ Step 4: Update Tool Button Handler (5 minutes)

Find the tool button click handler (around line 146).

**FIND:**
```javascript
btn.addEventListener('click', (e) => {
    const newTool = btn.dataset.tool;
    console.log('🔧 Tool button clicked:', newTool);

    // Update UI
    document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // CRITICAL FIX: Set tool directly first (defensive programming)
    const oldTool = this.currentTool;
    this.currentTool = newTool;

    // Reset interaction state
    this.resetInteractionState();

    // Try to use new architecture for synapse tools
    try {
        if (newTool.startsWith('synapse-')) {
            this.toolManager.switchTool(newTool);
            this.stateMachine.transition(InteractionState.IDLE);
        }
    } catch (error) {
        console.error('Error in tool manager:', error);
        // Fallback already set above
    }

    console.log(`✅ Tool switched: ${oldTool} → ${this.currentTool}`);
});
```

**REPLACE WITH:**
```javascript
btn.addEventListener('click', (e) => {
    const newTool = btn.dataset.tool;
    console.log('🔧 Tool button clicked:', newTool);

    // Update UI
    document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Reset interaction state
    this.resetInteractionState();

    const oldTool = this.currentTool;
    
    // HYBRID SYSTEM: Try new architecture first, fall back to old
    if (this.toolManager.hasTool(newTool)) {
        console.log(`  Using NEW architecture for: ${newTool}`);
        this.toolManager.switchTool(newTool);
        this.stateMachine.transition(InteractionState.IDLE);
        this.currentTool = newTool;
    } else {
        console.log(`  Using OLD system for: ${newTool}`);
        this.currentTool = newTool;
    }

    console.log(`✅ Tool switched: ${oldTool} → ${this.currentTool}`);
    this.render();
});
```

---

## ✅ Step 5: Add Event Delegation to handleMouseDown (7 minutes)

Find `handleMouseDown()` method (around line 284).

**RIGHT AFTER** the pan handling (spacebar + click), **BEFORE** the "SELECT TOOL" comment, **ADD:**

```javascript
// NEW ARCHITECTURE: Delegate to Tool Manager
if (this.toolManager.hasTool(this.currentTool) && 
    this.stateMachine.state === InteractionState.IDLE) {
    
    const clickedObj = this.getObjectAt(world.x, world.y);
    const result = this.toolManager.handleMouseDown(world.x, world.y, clickedObj, this);
    
    if (result.stateTransition) {
        this.stateMachine.transition(result.stateTransition);
        console.log(`  State: ${this.stateMachine.state}`);
    }
    
    if (result.object) {
        console.log(`  Created: ${result.object.type}`);
        this.objects.push(result.object);
        this.selectedObjects = [result.object];
        this.saveState(); // Add to undo history
        this.updatePropertiesPanel();
        
        // Auto-switch to select tool
        if (this.currentTool !== 'select') {
            this.switchToSelectTool();
        }
    }
    
    this.render();
    return; // Don't fall through to old system
}

// OLD SYSTEM: Continue for non-migrated tools
```

---

## ✅ Step 6: Add Event Delegation to handleMouseMove (5 minutes)

Find `handleMouseMove()` method (around line 556).

**AFTER** pan handling, **BEFORE** any tool-specific logic, **ADD:**

```javascript
// NEW ARCHITECTURE: Delegate during drawing
if (this.toolManager.hasTool(this.currentTool) && 
    this.stateMachine.state === InteractionState.DRAWING) {
    
    const result = this.toolManager.handleMouseMove(world.x, world.y, null, this);
    
    if (result.preview) {
        this.render();
    }
    
    return; // Don't fall through
}

// OLD SYSTEM: Continue
```

---

## ✅ Step 7: Add Event Delegation to handleMouseUp (5 minutes)

Find `handleMouseUp()` method (around line 791).

**AT THE TOP**, **BEFORE** any other logic, **ADD:**

```javascript
// NEW ARCHITECTURE: Delegate
if (this.toolManager.hasTool(this.currentTool) && 
    this.stateMachine.state === InteractionState.DRAWING) {
    
    const clickedObj = this.getObjectAt(world.x, world.y);
    const result = this.toolManager.handleMouseUp(world.x, world.y, clickedObj, this);
    
    if (result.stateTransition) {
        this.stateMachine.transition(result.stateTransition);
    }
    
    if (result.object) {
        console.log(`  Finalized: ${result.object.type}`);
        this.objects.push(result.object);
        this.selectedObjects = [result.object];
        this.saveState();
        this.updatePropertiesPanel();
        
        if (this.currentTool !== 'select') {
            this.switchToSelectTool();
        }
    }
    
    this.resetInteractionState();
    this.render();
    return;
}

// OLD SYSTEM: Continue
```

---

## ✅ Step 8: Add Tool Preview Rendering (3 minutes)

Find the `render()` method (search for "function render()" or "render()").

**BEFORE** the final `ctx.restore()` at the end, **ADD:**

```javascript
// NEW ARCHITECTURE: Render tool previews
if (this.toolManager.getCurrentTool()) {
    this.toolManager.renderPreview(this.ctx, this);
}
```

---

## 🧪 Step 9: TEST! (5 minutes)

1. **Start the app:**
   ```bash
   ./start-server.sh
   # Or open index.html with Live Server
   ```

2. **Open browser console** (F12)

3. **Test Circle Tool:**
   - Click Circle button
   - Console should show: "Using NEW architecture for: circle"
   - Click-drag on canvas
   - Blue dashed circle preview appears
   - Release mouse
   - Solid circle appears and is selected
   - Tool auto-switches to Select
   - ✅ **SUCCESS!**

4. **Test All Migrated Tools:**
   - Rectangle ✅
   - Line ✅
   - Triangle ✅
   - Hexagon ✅
   - Select ✅

5. **Test Non-Migrated Tools:**
   - Ellipse (should still work via old system)
   - Text (should still work via old system)
   - ✅ **Both systems coexist!**

---

## 🎉 SUCCESS!

If all tests pass, you now have:

- ✅ New architecture working
- ✅ 7 tools using new system
- ✅ Old tools still working
- ✅ Hybrid system functional
- ✅ Zero breaking changes

---

## 🐛 Troubleshooting

### "Tool not found" in console
**Fix**: Tool not registered in init(). Go back to Step 3.

### Drawing doesn't appear
**Fix**: Preview rendering not added. Go back to Step 8.

### Object created but can't select
**Fix**: Object not added to this.objects array. Check Step 5.

### Console errors about imports
**Fix**: File paths wrong or files don't exist. Verify Step 1.

---

## 📚 What Next?

### Immediate
- ✅ You're done! System works in hybrid mode.
- ✅ Migrated tools use new architecture.
- ✅ Old tools use old system.

### Optional (Later)
- Migrate remaining 10 tools (1 hour each)
- Remove old boolean flags (once all migrated)
- Implement reactive synapses

See `REFACTOR_COMPLETE_SUMMARY.md` for full roadmap.

---

## ✅ Completion Checklist

- [ ] Step 1: Files verified
- [ ] Step 2: Imports added
- [ ] Step 3: Tools registered
- [ ] Step 4: Button handler updated
- [ ] Step 5: MouseDown delegation added
- [ ] Step 6: MouseMove delegation added
- [ ] Step 7: MouseUp delegation added
- [ ] Step 8: Preview rendering added
- [ ] Step 9: All tests passing

**All checked?** 🎉 **YOU'RE DONE!**

---

*Time to complete: 30 minutes*
*Difficulty: Easy (copy-paste + test)*
*Result: Production-ready hybrid architecture*
