# Synapse Tools Integration Guide
**Complete step-by-step integration instructions**

**Status**: Ready for integration
**Estimated Time**: 2-3 hours for complete integration
**Risk Level**: Low (modular additions, no breaking changes)

---

## 📁 Files Created (Complete ✅)

### New Modules
- ✅ `synapseTool.js` (488 lines) - Two-click synapse placement logic
- ✅ `synapseRenderer.js` (626 lines) - Synapse rendering with all visual styles
- ✅ `signalAnimation.js` (277 lines) - Signal propagation animation system
- ✅ `circuitTemplates.js` (607 lines) - 5 preset neural circuits

### Modified Files
- ✅ `canvasRenderer.js` - Added synapse rendering import and dispatch

### To Create
- ⏳ Integration code for `app.js` (detailed below)
- ⏳ Integration code for `index.html` (detailed below)
- ⏳ `research/synapses/chemical-synapses.md` (scientific documentation)

---

## 🔧 Integration Part 1: app.js

### Step 1.1: Add Imports (at top of file, after existing imports)

```javascript
// ADD THESE IMPORTS after line 27 (after graphTool imports)
import {
    initSynapseTool,
    handleSynapseClick,
    updateSynapsePreview,
    getSynapsePreview,
    resetSynapseTool,
    isSynapseToolActive,
    isAwaitingTarget,
    getCurrentSynapseType,
    isPointOnSynapse
} from './synapseTool.js';
import { renderSynapsePreview } from './synapseRenderer.js';
import {
    animateSynapse,
    animateCircuit,
    pauseAnimation,
    resumeAnimation,
    resetAnimation,
    setAnimationSpeed,
    isAnimationPlaying
} from './signalAnimation.js';
import {
    createMonosynapticReflexArc,
    createPolysynapticReflex,
    createReciprocalInhibition,
    createFeedforwardInhibition,
    createFeedbackLoop,
    getAllCircuitTemplates
} from './circuitTemplates.js';
```

### Step 1.2: Add Synapse Tool State (inside `app` object, ~line 67)

```javascript
// ADD THESE PROPERTIES to the app object (after line 67, before rotationStartDistance)
currentSynapseType: null,        // 'excitatory', 'inhibitory', 'electrical', or null
isSynapseTool: false,            // Whether synapse tool is active
tempSynapse: null,               // Temporary synapse during placement
isAnimatingSignals: false,       // Whether signal animation is playing
```

### Step 1.3: Modify handleMouseDown (find this function, ~line 450)

ADD this code at the beginning of the function (after the screenToWorld conversion):

```javascript
handleMouseDown(e) {
    if (this.isEditingInput()) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const {x, y} = this.screenToWorld(screenX, screenY);

    // ===== ADD THIS SYNAPSE TOOL HANDLING =====
    // Handle synapse tool clicks
    if (isSynapseToolActive()) {
        // Find clicked object
        let clickedObj = null;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (this.isPointInObject(obj, x, y)) {
                clickedObj = obj;
                break;
            }
        }

        // Handle synapse click (returns synapse object if completed)
        const synapse = handleSynapseClick(clickedObj, {x, y}, this.objects);

        if (synapse) {
            // Synapse created - add to objects
            this.objects.push(synapse);
            this.saveState();
            this.render();
        } else {
            // First click or invalid click - just render to show preview
            this.render();
        }

        return; // Don't handle other tools
    }
    // ===== END SYNAPSE TOOL HANDLING =====

    // ... rest of existing handleMouseDown code continues here
```

### Step 1.4: Modify handleMouseMove (find this function, ~line 650)

ADD this code at the beginning (after screenToWorld conversion):

```javascript
handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const {x, y} = this.screenToWorld(screenX, screenY);

    // ===== ADD THIS SYNAPSE PREVIEW HANDLING =====
    // Update synapse preview if synapse tool is active
    if (isSynapseToolActive() && isAwaitingTarget()) {
        updateSynapsePreview(x, y);
        this.render();
        return;
    }
    // ===== END SYNAPSE PREVIEW HANDLING =====

    // ... rest of existing handleMouseMove code continues
```

### Step 1.5: Modify render() function (find this function, ~line 1200)

ADD this code after drawing all objects, before drawing selection boxes:

```javascript
render() {
    // ... existing code for clearing canvas, drawing grid, etc.

    // Draw all objects
    this.objects.forEach(obj => {
        drawObject(this.ctx, obj, this.textEditor.editingObj, this.zoom, this.isDarkMode);
    });

    // ===== ADD THIS SYNAPSE PREVIEW RENDERING =====
    // Draw synapse preview if placing synapse
    const synapsePreview = getSynapsePreview();
    if (synapsePreview) {
        renderSynapsePreview(
            this.ctx,
            synapsePreview.sourcePoint,
            synapsePreview.targetPoint,
            synapsePreview.synapseType,
            this.zoom
        );
    }
    // ===== END SYNAPSE PREVIEW RENDERING =====

    // ... rest of existing render code (selection boxes, etc.)
}
```

### Step 1.6: Add Tool Button Click Handlers (find toolButtons.forEach, ~line 92)

ADD synapse tool handlers in the tool button click event (modify the existing click handler):

```javascript
toolButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        console.log('Tool clicked:', btn.dataset.tool);
        document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;

        // ===== ADD THIS SYNAPSE TOOL INITIALIZATION =====
        // Initialize synapse tool if synapse button clicked
        if (btn.dataset.tool === 'excitatory' ||
            btn.dataset.tool === 'inhibitory' ||
            btn.dataset.tool === 'electrical') {
            initSynapseTool(btn.dataset.tool);
            this.isSynapseTool = true;
        } else {
            // Not a synapse tool - reset synapse state
            resetSynapseTool();
            this.isSynapseTool = false;
        }
        // ===== END SYNAPSE TOOL INITIALIZATION =====

        this.resetInteractionState();
    });
});
```

### Step 1.7: Add Synapse Selection Support (modify isPointInObject, ~line 800)

ADD this case to the isPointInObject function:

```javascript
isPointInObject(obj, x, y) {
    // ... existing type checks (circle, rectangle, line, etc.)

    // ===== ADD THIS SYNAPSE SELECTION =====
    else if (obj.type === 'synapse') {
        return isPointOnSynapse(obj, x, y, 10);
    }
    // ===== END SYNAPSE SELECTION =====

    return false;
}
```

### Step 1.8: Add Animation Controls (add new functions at end of app object)

```javascript
// ===== ADD THESE NEW FUNCTIONS TO APP OBJECT =====

// Start signal animation on selected synapses
startSignalAnimation() {
    const selectedSynapses = this.selectedObjects.filter(obj => obj.type === 'synapse');
    if (selectedSynapses.length > 0) {
        selectedSynapses.forEach(synapse => {
            animateSynapse(synapse, 1500); // 1.5 second duration
        });
        this.isAnimatingSignals = true;

        // Render loop for animation
        const animate = () => {
            this.render();
            if (isAnimationPlaying()) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimatingSignals = false;
            }
        };
        animate();
    }
},

// Pause animation
pauseSignalAnimation() {
    pauseAnimation();
},

// Resume animation
resumeSignalAnimation() {
    resumeAnimation();

    // Restart render loop
    const animate = () => {
        this.render();
        if (isAnimationPlaying()) {
            requestAnimationFrame(animate);
        }
    };
    animate();
},

// Reset animation
resetSignalAnimation() {
    resetAnimation();
    this.render();
},

// Insert circuit template
insertCircuitTemplate(templateName) {
    let circuit = null;

    switch(templateName) {
        case 'Monosynaptic Reflex Arc':
            circuit = createMonosynapticReflexArc(400, 300);
            break;
        case 'Polysynaptic Reflex':
            circuit = createPolysynapticReflex(400, 300);
            break;
        case 'Reciprocal Inhibition':
            circuit = createReciprocalInhibition(400, 300);
            break;
        case 'Feedforward Inhibition':
            circuit = createFeedforwardInhibition(400, 300);
            break;
        case 'Feedback Loop':
            circuit = createFeedbackLoop(400, 300);
            break;
    }

    if (circuit) {
        // Add all neurons
        circuit.neurons.forEach(neuron => {
            this.objects.push(neuron);
        });

        // Add all synapses
        circuit.synapses.forEach(synapse => {
            this.objects.push(synapse);
        });

        this.saveState();
        this.render();
    }
}

// ===== END NEW FUNCTIONS =====
```

---

## 🎨 Integration Part 2: index.html

### Step 2.1: Add Synapse Toolbar Buttons (in #toolbar section, after existing tool buttons)

Find the toolbar section (~line 900) and ADD these buttons:

```html
<!-- ADD SEPARATOR -->
<div style="width: 44px; height: 2px; background: var(--border-color); margin: 5px 0;"></div>

<!-- SYNAPSE TOOLS -->
<button class="toolBtn" data-tool="excitatory" title="Excitatory Synapse (Glutamate)">
    <span style="color: #E74C3C;">▶</span>
</button>

<button class="toolBtn" data-tool="inhibitory" title="Inhibitory Synapse (GABA)">
    <span style="color: #3498DB;">⊣</span>
</button>

<button class="toolBtn" data-tool="electrical" title="Electrical Synapse (Gap Junction)">
    <span style="color: #F1C40F;"><></span>
</button>
```

### Step 2.2: Add Circuits Menu Button (in #topBar, after existing buttons)

Find the top bar (~line 50) and ADD:

```html
<button class="topBtn" id="circuitsMenu" title="Insert Circuit Templates">Circuits ▼</button>

<!-- Circuits dropdown (initially hidden) -->
<div id="circuitsDropdown" style="display: none; position: absolute; top: 50px; right: 20px; background: white; border: 2px solid black; padding: 10px; z-index: 1000;">
    <div class="circuitOption" data-circuit="Monosynaptic Reflex Arc">Monosynaptic Reflex Arc</div>
    <div class="circuitOption" data-circuit="Polysynaptic Reflex">Polysynaptic Reflex</div>
    <div class="circuitOption" data-circuit="Reciprocal Inhibition">Reciprocal Inhibition</div>
    <div class="circuitOption" data-circuit="Feedforward Inhibition">Feedforward Inhibition</div>
    <div class="circuitOption" data-circuit="Feedback Loop">Feedback Loop</div>
</div>
```

### Step 2.3: Add Circuits Menu Styles (in <style> section)

```css
/* ADD THIS CSS */
.circuitOption {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #ccc;
    font-size: 14px;
}

.circuitOption:hover {
    background: #f0f0f0;
}

.circuitOption:last-child {
    border-bottom: none;
}
```

### Step 2.4: Add Circuits Menu JavaScript (in <script> section, after app.init())

```javascript
// ===== ADD THIS CIRCUITS MENU LOGIC =====
// Circuits menu toggle
const circuitsMenuBtn = document.getElementById('circuitsMenu');
const circuitsDropdown = document.getElementById('circuitsDropdown');

if (circuitsMenuBtn && circuitsDropdown) {
    circuitsMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        circuitsDropdown.style.display = circuitsDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        circuitsDropdown.style.display = 'none';
    });

    // Handle circuit selection
    const circuitOptions = document.querySelectorAll('.circuitOption');
    circuitOptions.forEach(option => {
        option.addEventListener('click', () => {
            const templateName = option.dataset.circuit;
            app.insertCircuitTemplate(templateName);
            circuitsDropdown.style.display = 'none';
        });
    });
}
// ===== END CIRCUITS MENU LOGIC =====
```

### Step 2.5: Add Animation Controls (optional, in properties panel)

ADD these controls to the properties panel (when synapse is selected):

```html
<!-- ADD TO PROPERTIES PANEL -->
<div id="synapseAnimationControls" style="display: none;">
    <h3>Animation Controls</h3>
    <button id="playAnimation" class="propertyBtn">▶ Play Signal</button>
    <button id="pauseAnimation" class="propertyBtn">⏸ Pause</button>
    <button id="resetAnimation" class="propertyBtn">⏹ Reset</button>

    <label>Speed:</label>
    <select id="animationSpeed">
        <option value="0.5">0.5x</option>
        <option value="1" selected>1x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
    </select>
</div>
```

ADD event listeners:

```javascript
// ===== ADD ANIMATION CONTROL EVENT LISTENERS =====
const playAnimBtn = document.getElementById('playAnimation');
const pauseAnimBtn = document.getElementById('pauseAnimation');
const resetAnimBtn = document.getElementById('resetAnimation');
const animSpeedSelect = document.getElementById('animationSpeed');

if (playAnimBtn) playAnimBtn.addEventListener('click', () => app.startSignalAnimation());
if (pauseAnimBtn) pauseAnimBtn.addEventListener('click', () => app.pauseSignalAnimation());
if (resetAnimBtn) resetAnimBtn.addEventListener('click', () => app.resetSignalAnimation());
if (animSpeedSelect) animSpeedSelect.addEventListener('change', (e) => {
    setAnimationSpeed(parseFloat(e.target.value));
});
// ===== END ANIMATION CONTROLS =====
```

---

## 📚 Integration Part 3: Research Documentation

Create `research/synapses/chemical-synapses.md` (see separate document below)

---

## ✅ Integration Checklist

### Before Integration
- [ ] Backup current `app.js`
- [ ] Backup current `index.html`
- [ ] Backup current `canvasRenderer.js` (already updated ✅)

### app.js Integration
- [ ] Add synapse tool imports (Step 1.1)
- [ ] Add synapse state properties (Step 1.2)
- [ ] Modify handleMouseDown (Step 1.3)
- [ ] Modify handleMouseMove (Step 1.4)
- [ ] Modify render() (Step 1.5)
- [ ] Update tool button handlers (Step 1.6)
- [ ] Add synapse selection (Step 1.7)
- [ ] Add animation control functions (Step 1.8)

### index.html Integration
- [ ] Add synapse toolbar buttons (Step 2.1)
- [ ] Add circuits menu (Step 2.2)
- [ ] Add CSS styles (Step 2.3)
- [ ] Add circuits menu JavaScript (Step 2.4)
- [ ] Add animation controls (Step 2.5 - optional)

### Testing
- [ ] Test excitatory synapse creation
- [ ] Test inhibitory synapse creation
- [ ] Test electrical synapse creation
- [ ] Test circuit templates (all 5)
- [ ] Test signal animation
- [ ] Test synapse selection
- [ ] Test synapse with save/load
- [ ] Test synapse with undo/redo

---

## 🐛 Troubleshooting

### Issue: "Cannot find module synapseTool.js"
**Solution**: Ensure all 4 new files are in the root directory with correct spelling

### Issue: Synapse preview not showing
**Solution**: Check that `getSynapsePreview()` is being called in render() function

### Issue: Clicking doesn't create synapse
**Solution**: Verify synapse tool is active - check toolbar button has 'active' class

### Issue: Synapse renders but animation doesn't work
**Solution**: Ensure `requestAnimationFrame` loop is running in `startSignalAnimation()`

### Issue: Circuit template doesn't appear
**Solution**: Check console for errors - verify circuit template functions are imported

---

## 📊 Integration Summary

**New Lines of Code**:
- synapseTool.js: 488 lines
- synapseRenderer.js: 626 lines
- signalAnimation.js: 277 lines
- circuitTemplates.js: 607 lines
- **Total New**: ~2,000 lines

**Modified Files**:
- canvasRenderer.js: +2 lines (import + dispatch)
- app.js: ~150 lines added (estimated)
- index.html: ~80 lines added (estimated)
- **Total Integration**: ~230 lines

**Grand Total**: ~2,230 lines of new, scientifically accurate synapse functionality

---

## 🚀 Next Steps After Integration

1. **Test All Features** - Use checklist above
2. **Create Example Circuits** - Save as templates
3. **Document Usage** - Update README.md
4. **Create Tutorial** - Video or written guide
5. **Performance Test** - Try 20+ synapses, verify 60 FPS

---

**Integration Status**: Ready to integrate
**Estimated Integration Time**: 2-3 hours
**Risk Level**: Low (all modular additions)
**Testing Required**: Medium (new interaction patterns)
