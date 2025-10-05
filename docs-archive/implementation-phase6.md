# NeuroSketch Phase 6 - Implementation Plan
## Dimension Tracking & Cellular Components Module

### Status: 📋 PLANNING PHASE - Not Yet Implemented

---

## Overview

This document outlines the implementation plan for two major feature enhancements to NeuroSketch:

1. **Dimension Tracking System** - Real-time display of object dimensions (similar to Microsoft Word)
2. **Cellular Components Module** - Scientifically accurate cell membrane, receptors, and voltage-gated channels

These features will transform NeuroSketch from a diagram tool into a **comprehensive cellular neuroscience education platform**, enabling precise sizing control and detailed molecular-level visualization of neural mechanisms.

---

## Part A: Dimension Tracking System

### Motivation

**Problem**: Users currently have no way to know the exact pixel dimensions of shapes while drawing or resizing, making it difficult to:
- Create consistently sized objects
- Match specific dimension requirements
- Align objects precisely
- Maintain proportions across diagrams

**Solution**: Implement Microsoft Word-style dimension display that shows real-time width × height measurements during drawing and resizing operations.

**Educational Value**:
- Precise control for publication-quality diagrams
- Consistent sizing across educational materials
- Professional workflow for content creators

---

### Feature 1: Real-Time Dimension Display

#### Visual Design

**During Drawing/Resizing**:
```
┌─────────────────┐
│                 │  ← Object being drawn/resized
│                 │
└─────────────────┘

     250 × 180      ← Floating dimension label
```

**Positioning Options**:
1. **Below object** (default) - Best for most cases
2. **Above object** - If below would go off-screen
3. **Inside object** - For very large objects (>400px)

**Styling**:
- Semi-transparent background (rgba(0,0,0,0.75))
- White text, bold, 12px font
- Small padding (4px × 8px)
- Rounded corners (3px radius)
- Slight shadow for depth

#### Implementation Components

**1. State Variables** (app.js):
```javascript
showDimensions: true,  // User can toggle in settings
dimensionUnits: 'px',   // Future: support 'px', 'mm', 'cm', 'in'
```

**2. Dimension Calculation Logic**:

For each object type, calculate bounding box:
- **Rectangle**: width × height (direct)
- **Circle**: diameter × diameter (2r × 2r)
- **Ellipse**: width × height (2rx × 2ry)
- **Triangle/Hexagon**: bounding box dimensions
- **Line**: length and angle (e.g., "250px @ 45°")
- **Text**: width × height (actual rendered bounds)
- **Freehand**: bounding box dimensions
- **Graph**: width × height (container size)
- **Image**: width × height (current size)

**3. Render Function** (app.js):
```javascript
drawDimensionLabel(ctx, x, y, width, height, objectType) {
    // Format: "250 × 180" for most objects
    // Format: "250px @ 45°" for lines
    // Auto-position to avoid going off-screen
    // Scale with zoom level
}
```

**4. Display Triggers**:
- ✅ While drawing new shapes (mouse down + drag)
- ✅ While resizing existing shapes (handle dragging)
- ✅ While rotating objects (show angle)
- ❌ NOT shown during normal selection (too cluttered)

#### User Controls

**Settings Panel Addition**:
```html
<div class="panelSection">
    <h3>Dimension Display</h3>
    <button class="toggleBtn" onclick="app.toggleDimensions()">
        Show During Draw/Resize
    </button>
    <div class="propRow">
        <label>Units:</label>
        <select id="dimensionUnits">
            <option value="px">Pixels (px)</option>
            <option value="cm">Centimeters (cm)</option>
            <option value="mm">Millimeters (mm)</option>
            <option value="in">Inches (in)</option>
        </select>
    </div>
    <div class="propRow">
        <label>DPI for Export:</label>
        <input type="number" value="96" min="72" max="300" step="24">
        <span style="font-size:10px">For print conversions</span>
    </div>
</div>
```

**Keyboard Shortcuts**:
- `Shift+D`: Toggle dimension display on/off
- `Shift+U`: Cycle through units (px → mm → cm → in)

---

### Feature 2: Static Dimension Display in Properties Panel

**Enhancement to Properties Panel**:

For selected objects, always show dimensions:

```html
<div class="panelSection" id="dimensionInfo">
    <h3>Dimensions</h3>
    <div class="propRow">
        <label>Width:</label>
        <input type="number" id="objWidth" step="1">
        <span>px</span>
    </div>
    <div class="propRow">
        <label>Height:</label>
        <input type="number" id="objHeight" step="1">
        <span>px</span>
    </div>
    <div class="propRow" id="objAngle" style="display:none;">
        <label>Angle:</label>
        <input type="number" id="objRotation" step="1" min="0" max="360">
        <span>°</span>
    </div>
    <div class="propRow">
        <label>Position:</label>
        <span id="objPosition">X: 100, Y: 200</span>
    </div>
</div>
```

**Features**:
- ✅ Direct input to set exact dimensions
- ✅ Maintains aspect ratio (optional lock button)
- ✅ Shows position (X, Y coordinates)
- ✅ Shows rotation angle for rotatable objects
- ✅ Updates in real-time during manipulation

---

### Feature 3: Dimension Constraints & Snap

**Dimension Snapping**:
- Hold `Shift` while resizing: Snap to 10px increments
- Hold `Ctrl/Cmd`: Snap to 50px increments
- Hold `Alt`: Maintain aspect ratio

**Dimension Presets** (Quick size buttons):
```javascript
dimensionPresets: {
    small: {width: 100, height: 100},
    medium: {width: 200, height: 200},
    large: {width: 400, height: 400},
    banner: {width: 800, height: 200},
    square: {width: 300, height: 300}
}
```

**Grid Snap Integration**:
- If grid is enabled, snap dimensions to grid size
- Visual feedback when snapping occurs

---

### Implementation Files

**Files to Modify**:
1. **app.js** (~150 lines added):
   - `drawDimensionLabel()` function
   - Dimension calculation for each object type
   - Toggle dimension display
   - Dimension input handlers in properties panel
   - Snapping logic

2. **index.html** (~80 lines added):
   - Dimension display settings in Canvas section
   - Dimension info in Properties panel
   - Unit selector dropdown

3. **canvasRenderer.js** (~40 lines added):
   - Helper functions for bounding box calculations
   - Dimension label rendering utilities

**Estimated Code**: ~270 lines
**Complexity**: ⭐⭐⭐☆☆ (3/5 - Moderate)
**Development Time**: 4-6 hours

---

## Part B: Cellular Components Module

### Motivation

**Problem**: NeuroSketch currently lacks molecular-level components needed to explain action potential mechanisms, making it impossible to illustrate:
- Ion channel structure and function
- Receptor types and locations
- Membrane composition
- Channel gating mechanisms
- Receptor activation

**Solution**: Create a comprehensive library of scientifically accurate cellular components that can be placed, customized, and animated to explain neural mechanisms.

**Educational Value**:
- Bridge the gap between molecular and cellular neuroscience
- Explain HOW action potentials work at the channel level
- Visualize receptor pharmacology
- Create molecular mechanism diagrams

---

### Component Library Overview

**Four Major Categories**:

1. **Cell Membrane** - The phospholipid bilayer foundation
2. **Voltage-Gated Channels** - Channels that respond to voltage changes
3. **Ligand-Gated Receptors** - Channels activated by neurotransmitters
4. **Other Membrane Proteins** - Pumps, exchangers, transporters

---

### Category 1: Cell Membrane Components

#### 1.1 Phospholipid Bilayer

**Visual Representation**:
```
Hydrophilic heads (circles)
    ○ ○ ○ ○ ○ ○ ○ ○
    | | | | | | | |  ← Hydrophobic tails (lines)
    | | | | | | | |
    ○ ○ ○ ○ ○ ○ ○ ○
Hydrophilic heads
```

**Object Properties**:
- Width: Adjustable (default 400px)
- Height: Fixed ~40px (represents 7-8nm bilayer)
- Phospholipid spacing: Configurable (default 12px)
- Colors:
  - Heads: Orange (#FFA726) or Blue (#42A5F5) - alternate
  - Tails: Gray (#757575)

**Preset Types**:
- **Straight membrane**: Horizontal line
- **Curved membrane**: Follows bezier curve
- **Cell outline**: Circular/elliptical membrane
- **Synapse**: Two membranes facing each other (synaptic cleft)

**Implementation**:
- Tool name: `membraneTool.js`
- Draw mode: Click-drag to create straight, double-click for curved
- Properties: Curvature, thickness, phospholipid density

#### 1.2 Cholesterol Molecules

**Visual**: Small diamond shapes embedded in bilayer
**Function**: Membrane fluidity regulation
**Placement**: Scattered between phospholipids
**Color**: Yellow (#FFEB3B)

---

### Category 2: Voltage-Gated Ion Channels

#### 2.1 Voltage-Gated Sodium Channel (Nav)

**Structure**:
```
  Extracellular
      ___
     |   |  ← Activation gate (m gate)
     |   |
     |XXX|  ← Inactivation ball (h gate)
     |___|
  Intracellular
```

**Visual Design**:
- Height: 60px (spans membrane)
- Width: 20px
- 4 subunits visible (I-IV domains)
- Color: Red (#E74C3C) - excitatory
- States:
  - **Closed (resting)**: Gate shown closed
  - **Open (activated)**: Gate open, Na+ ions flowing
  - **Inactivated**: Ball blocks pore

**Labels**:
- "Nav1.1" - Brain sodium channels
- "Nav1.5" - Cardiac sodium channels
- "Nav1.6" - Nodes of Ranvier
- "Nav1.7" - Pain neurons (TTX-sensitive)

**Properties Panel**:
- Subtype selector (Nav1.1 - Nav1.9)
- State selector (closed/open/inactivated)
- Show ion flow toggle
- Label position

**Animation Support** (Future Phase):
- Transition: closed → open → inactivated
- Ion flow particles (Na+ shown as + symbols)
- Timing: Opens at -55mV, inactivates after 1ms

#### 2.2 Voltage-Gated Potassium Channel (Kv)

**Structure**:
```
  Extracellular
      ___
     |   |
     |   |  ← Activation gate
     |   |
     |___|
  Intracellular
```

**Visual Design**:
- Height: 60px
- Width: 18px
- Tetramer (4 subunits around central pore)
- Color: Blue (#3498DB) - inhibitory/repolarizing
- States:
  - **Closed**: Gate closed
  - **Open**: Gate open, K+ efflux

**Channel Subtypes**:
- **Kv1 (delayed rectifier)**: Standard repolarization
- **Kv3**: Fast-spiking neurons
- **Kv7 (KCNQ, M-current)**: Slow adaptation
- **Kv4 (A-type)**: Fast transient K+ current

**Properties**:
- Subtype selector
- State selector
- Activation kinetics (fast/slow)
- Show selectivity filter

#### 2.3 Voltage-Gated Calcium Channel (Cav)

**Visual Design**:
- Height: 60px
- Width: 20px
- Color: Green (#27AE60) - Ca2+ signaling
- States: Closed/Open

**Channel Subtypes**:
- **Cav1 (L-type)**: Long-lasting, cardiac plateau
- **Cav2 (P/Q, N-type)**: Presynaptic neurotransmitter release
- **Cav3 (T-type)**: Transient, low-threshold

**Functional Annotation**:
- Show Ca2+ influx (green arrows/particles)
- Link to intracellular Ca2+ stores
- Trigger zone for neurotransmitter release

---

### Category 3: Ligand-Gated Receptors

#### 3.1 Ionotropic Glutamate Receptors

**3.1.1 AMPA Receptor**

**Structure**:
```
  Glutamate binding sites (2)
      ↓     ↓
      _____|_____
     |           |
     |  [Na+/K+] |  ← Non-selective cation pore
     |___________|
```

**Visual Design**:
- Height: 55px
- Width: 30px
- Tetramer structure (4 subunits)
- Color: Orange (#F39C12) - excitatory
- States:
  - **Closed**: No glutamate bound
  - **Open**: Glutamate bound, pore open

**Properties**:
- Subunit composition (GluA1-4)
- Desensitization state
- TARP auxiliary subunits
- Show glutamate molecules binding

**3.1.2 NMDA Receptor**

**Visual Design**:
- Height: 60px
- Width: 32px
- Color: Red-orange (#E67E22)
- **Unique feature**: Mg2+ block shown as plug

**Voltage-Dependent Properties**:
- At rest: Mg2+ blocks pore (shown)
- Depolarized: Mg2+ expelled, Ca2+ flows

**Properties**:
- Subunit composition (GluN1, GluN2A-D)
- Mg2+ block state
- Show Ca2+ permeability
- Glycine co-agonist site

#### 3.2 GABAergic Receptors

**3.2.1 GABAA Receptor**

**Structure**:
```
  GABA binding sites (2)
      ↓     ↓
      _____|_____
     |           |
     |   [Cl-]   |  ← Chloride-selective pore
     |___________|
  Benzodiazepine site
```

**Visual Design**:
- Height: 55px
- Width: 35px
- Pentamer (5 subunits: 2α, 2β, 1γ)
- Color: Blue (#2980B9) - inhibitory
- States: Closed/Open

**Pharmacology Features**:
- GABA binding sites (marked)
- Benzodiazepine binding site (marked)
- Barbiturate site
- Show Cl- influx arrows

**Properties**:
- Subunit composition (α1-6, β1-3, γ1-3)
- Show modulator sites
- Desensitization state

**3.2.2 GABAB Receptor**

**Visual Design**:
- Height: 50px
- Width: 25px
- G-protein coupled (show G-protein)
- Color: Dark blue (#1A5490)
- Slower kinetics (annotated)

**Mechanism**:
- GABA binding
- G-protein activation
- GIRK channel modulation (shown with arrow)

#### 3.3 Nicotinic Acetylcholine Receptor (nAChR)

**Structure**:
```
  ACh binding sites (2)
      ↓     ↓
      _____|_____
     |           |
     |  [Na+/K+] |
     |___________|
```

**Visual Design**:
- Height: 55px
- Width: 32px
- Pentamer (5 subunits)
- Color: Purple (#8E44AD) - excitatory
- States: Closed/Open/Desensitized

**Subtypes**:
- **Muscle-type**: (α1)2β1γδ
- **Neuronal-type**: Various combinations of α2-10, β2-4

---

### Category 4: Other Membrane Proteins

#### 4.1 Na+/K+ ATPase Pump

**Structure**:
```
      ATP
       ↓
    _______
   |   P   |  ← Phosphorylation site
   |  3Na+ |  ← 3 sodium out
   |_______|
   |  2K+  |  ← 2 potassium in
   |_______|
```

**Visual Design**:
- Height: 65px
- Width: 35px
- Color: Gray (#7F8C8D) - housekeeping
- Shows ATP binding site
- Arrows indicate ion movement direction

**States**:
- E1: Na+ binding (intracellular)
- E1-P: Phosphorylated, Na+ released (extracellular)
- E2-P: K+ binding (extracellular)
- E2: K+ released (intracellular)

**Properties**:
- Show 3:2 stoichiometry
- Cycle through states
- Energy consumption (ATP → ADP)

#### 4.2 Na+/Ca2+ Exchanger (NCX)

**Visual Design**:
- Height: 50px
- Width: 25px
- Color: Teal (#16A085)
- Bidirectional arrows (3Na+ in, 1Ca2+ out)

**Function**: Remove Ca2+ after action potential

#### 4.3 Leak Channels

**Visual Design**:
- Height: 45px
- Width: 12px
- Color: Light gray (#BDC3C7)
- Always open (no gates)

**Types**:
- K+ leak (TWIK, TREK, TASK)
- Cl- leak

---

### Cellular Component Tool Architecture

#### Tool Structure

**New Tool**: `cellularComponentsTool.js`

**Component Organization**:
```javascript
export const CELLULAR_COMPONENTS = {
    membranes: {
        phospholipidBilayer: {...},
        cholesterol: {...},
        synapticCleft: {...}
    },
    voltageGated: {
        sodiumChannel: {
            nav1_1: {...},
            nav1_5: {...},
            nav1_6: {...}
        },
        potassiumChannel: {
            kv1: {...},
            kv3: {...},
            kv7: {...}
        },
        calciumChannel: {
            lType: {...},
            nType: {...},
            tType: {...}
        }
    },
    ligandGated: {
        glutamate: {
            ampa: {...},
            nmda: {...},
            kainate: {...}
        },
        gaba: {
            gabaA: {...},
            gabaB: {...}
        },
        acetylcholine: {
            nicotinic: {...},
            muscarinic: {...}
        }
    },
    transporters: {
        naKPump: {...},
        naCaExchanger: {...},
        glutamateTransporter: {...},
        gabaTransporter: {...}
    }
};
```

#### Toolbar Organization

**New Toolbar Section**: "Cellular Components"

Visual grouping:
```
[Membrane] [Na+ Channel] [K+ Channel] [Receptor] [Pump]
    ||||        [||]          [||]       <-->      ⟳
```

**Expandable Menu**:
- Click main button: Show component category menu
- Hover over category: Show subtypes
- Click subtype: Select for placement

#### Component Placement Workflow

**Step 1**: Select component from toolbar
**Step 2**: Click on canvas to place
**Step 3**: Component appears with default state
**Step 4**: Customize in properties panel

**Smart Placement**:
- If membrane exists: Snap to membrane
- Auto-orient perpendicular to membrane
- Distribute evenly if multiple placed

---

### Component Properties Panel

**Unified Component Panel**:

```html
<div id="componentPropsContent" style="display: none;">
    <div class="propRow">
        <label>Component Type:</label>
        <span id="componentType">Voltage-Gated Na+ Channel</span>
    </div>

    <div class="propRow">
        <label>Subtype:</label>
        <select id="componentSubtype">
            <!-- Populated based on component type -->
        </select>
    </div>

    <div class="propRow">
        <label>State:</label>
        <select id="componentState">
            <option value="closed">Closed</option>
            <option value="open">Open</option>
            <option value="inactivated">Inactivated</option>
        </select>
    </div>

    <div class="propRow">
        <label>Show Ion Flow:</label>
        <button class="toggleBtn" onclick="app.toggleComponentProp('showIonFlow')">
            Enabled
        </button>
    </div>

    <div class="propRow">
        <label>Show Labels:</label>
        <button class="toggleBtn" onclick="app.toggleComponentProp('showLabels')">
            Enabled
        </button>
    </div>

    <div class="propRow">
        <label>Label Text:</label>
        <input type="text" id="componentLabel" placeholder="e.g., Nav1.6">
    </div>

    <div class="propRow">
        <label>Rotation:</label>
        <input type="number" id="componentRotation" min="0" max="360" step="45">
        <span>°</span>
    </div>
</div>
```

---

### Component Rendering System

**New Renderer**: `cellularComponentRenderer.js`

**Rendering Functions**:
```javascript
// Main dispatcher
export function renderCellularComponent(ctx, component, zoom, isDarkMode) {
    if (component.category === 'membrane') {
        renderMembrane(ctx, component, zoom);
    } else if (component.category === 'voltageGated') {
        renderVoltageGatedChannel(ctx, component, zoom);
    } else if (component.category === 'ligandGated') {
        renderLigandGatedReceptor(ctx, component, zoom);
    } else if (component.category === 'transporter') {
        renderTransporter(ctx, component, zoom);
    }
}

// Specialized renderers
function renderVoltageGatedChannel(ctx, component, zoom) {
    // Draw channel body
    // Draw gates based on state
    // Draw ion flow if enabled
    // Draw labels
    // Draw selection handles if selected
}

function renderMembrane(ctx, membrane, zoom) {
    // Draw phospholipid heads (circles)
    // Draw hydrophobic tails (lines)
    // Alternate colors for visual clarity
    // Support curved membranes (bezier paths)
}

function renderIonFlow(ctx, channel, zoom) {
    // Draw animated arrows/particles
    // Color-coded by ion type:
    //   Na+ = red
    //   K+ = blue
    //   Ca2+ = green
    //   Cl- = purple
}
```

---

### Scientific Accuracy Requirements

#### Ion Channel Structure

**Voltage-Gated Sodium Channel**:
- 4 homologous domains (I-IV)
- 6 transmembrane segments per domain (S1-S6)
- S4 voltage sensor (show + charges)
- Inactivation gate (ball-and-chain model)
- Selectivity filter (DEKA motif)

**Voltage-Gated Potassium Channel**:
- Tetramer (4 identical subunits)
- 6 transmembrane segments per subunit
- S4 voltage sensor
- Selectivity filter (TVGYG signature)

**References**:
- Hodgkin & Huxley (1952) - Original channel model
- Hille, B. (2001) - *Ion Channels of Excitable Membranes*
- Catterall, W. A. (2000) - Voltage-gated Na+ channel structure
- MacKinnon, R. (2003) - K+ channel crystal structure (Nobel Prize)

#### Receptor Pharmacology

**AMPA Receptors**:
- GluA1-4 subunits
- Fast desensitization (~10ms)
- Non-selective cation pore (Na+/K+)
- Auxiliary subunits (TARPs)

**NMDA Receptors**:
- GluN1 + GluN2(A-D) or GluN3 subunits
- Mg2+ block at resting potential
- High Ca2+ permeability
- Slow kinetics (100s of ms)
- Requires glycine co-agonist

**GABAA Receptors**:
- Pentameric (typically 2α, 2β, 1γ)
- Cl- selective pore
- Fast inhibition (~10-50ms)
- Benzodiazepine modulation site

**References**:
- Traynelis et al. (2010) - Glutamate receptor pharmacology
- Olsen & Sieghart (2008) - GABAA receptor structure
- Changeux & Edelstein (2005) - Nicotinic receptor

---

### Interaction & Animation Features

#### Static Mode (Phase 1)

**Initial Implementation**:
- Place components on canvas
- Adjust states manually (closed/open/inactivated)
- Show static ion flow arrows
- Label components

#### Interactive Mode (Future Phase 2)

**Potential Features**:
- Click channel to cycle through states
- Drag voltage slider to open/close voltage-gated channels
- Add neurotransmitter to activate receptors
- Show real-time ion flow animation

#### Animation Mode (Future Phase 3)

**Action Potential Propagation**:
1. Membrane at rest (-70mV)
2. Stimulus reaches threshold
3. Na+ channels open sequentially
4. Depolarization wave propagates
5. K+ channels open (repolarization)
6. Na+ channels inactivate
7. Return to rest

**Synaptic Transmission**:
1. Action potential reaches presynapse
2. Ca2+ channels open
3. Vesicle fusion
4. Neurotransmitter release
5. Receptor activation
6. Ion flow
7. EPSP/IPSP generation

---

### Implementation Phases

#### Phase 1: Foundation (Core Components)
**Estimated Time**: 12-16 hours
**Files to Create**:
- `cellularComponentsTool.js` (~400 lines)
- `cellularComponentRenderer.js` (~600 lines)
- `cellularComponentData.js` (~300 lines) - Component definitions

**Files to Modify**:
- `index.html` (+100 lines) - Toolbar section, properties panel
- `app.js` (+200 lines) - Tool integration, event handlers
- `canvasRenderer.js` (+50 lines) - Component render dispatch

**Components to Implement**:
- ✅ Phospholipid bilayer (straight)
- ✅ Voltage-gated Na+ channel (3 states)
- ✅ Voltage-gated K+ channel (2 states)
- ✅ AMPA receptor (2 states)
- ✅ GABAA receptor (2 states)
- ✅ Na+/K+ pump

**Total Code**: ~1,650 lines

#### Phase 2: Extended Library
**Estimated Time**: 8-12 hours
**Components to Add**:
- ✅ Voltage-gated Ca2+ channels (all types)
- ✅ Additional K+ channel subtypes (Kv3, Kv7, etc.)
- ✅ NMDA receptors
- ✅ Nicotinic receptors
- ✅ Curved membranes
- ✅ Additional transporters

**Total Code**: ~800 lines

#### Phase 3: Advanced Features
**Estimated Time**: 10-15 hours
**Features**:
- ✅ Ion flow animations
- ✅ State transitions (click to cycle)
- ✅ Component tooltips (mechanism explanations)
- ✅ Smart snapping to membranes
- ✅ Component groups (e.g., "complete synapse")

**Total Code**: ~600 lines

---

### User Workflow Examples

#### Example 1: Creating Action Potential Diagram

**Steps**:
1. Draw phospholipid bilayer (400px wide)
2. Place voltage-gated Na+ channel (state: closed)
3. Place voltage-gated K+ channel (state: closed)
4. Place Na+/K+ pump
5. Add graph showing action potential
6. Link graph phases to channel states (annotations)

**Result**: Complete molecular-level explanation of action potential

#### Example 2: Creating Synapse Diagram

**Steps**:
1. Draw two facing membranes (synaptic cleft)
2. Add voltage-gated Ca2+ channel (presynaptic)
3. Add AMPA receptors (postsynaptic)
4. Add neurotransmitter vesicles
5. Add annotations explaining steps

**Result**: Molecular view of synaptic transmission

---

### Component Library Size

**Total Components Planned**:

**Category 1: Membranes** (3 types)
- Phospholipid bilayer (straight, curved, circular)
- Cholesterol
- Synaptic cleft

**Category 2: Voltage-Gated Channels** (15 subtypes)
- Na+ channels: Nav1.1-1.9 (9 types)
- K+ channels: Kv1, Kv3, Kv4, Kv7, BK, SK (6 types)
- Ca2+ channels: L-type, N-type, P/Q-type, R-type, T-type (5 types)

**Category 3: Ligand-Gated Receptors** (12 subtypes)
- Glutamate: AMPA, NMDA, Kainate (3 types)
- GABA: GABAA (multiple subunit combos), GABAB (4 types)
- Acetylcholine: nAChR (muscle, neuronal), mAChR (3 types)
- Glycine: Glycine receptor (1 type)
- Serotonin: 5-HT3 (1 type)

**Category 4: Transporters & Pumps** (8 types)
- Na+/K+ ATPase
- Na+/Ca2+ exchanger
- Glutamate transporters (EAAT)
- GABA transporters (GAT)
- Glycine transporters (GlyT)
- Na+/H+ exchanger
- Cl-/HCO3- exchanger
- H+ ATPase

**Total**: ~41 distinct components

**Realistic Phase 1**: 6 core components
**Phase 2**: +12 additional components (18 total)
**Phase 3**: +23 remaining components (41 total)

---

### Visual Style Guidelines

#### Component Design Principles

1. **Scientifically Accurate Topology**:
   - Correct number of transmembrane segments
   - Proper orientation (extra/intracellular)
   - Accurate subunit stoichiometry

2. **Educational Clarity**:
   - Simplified but recognizable
   - Color-coded by function
   - Clear state indicators (open/closed gates)

3. **Textbook Aesthetic**:
   - Clean lines, professional appearance
   - Similar to Kandel, Purves, Bear illustrations
   - Appropriate for publication

4. **Consistency**:
   - Uniform membrane thickness (40px)
   - Consistent channel heights (50-65px)
   - Standardized color palette

#### Color Palette

**Ion Channels**:
- Na+ channels: Red (#E74C3C)
- K+ channels: Blue (#3498DB)
- Ca2+ channels: Green (#27AE60)
- Cl- channels: Purple (#9B59B6)

**Receptors**:
- Glutamate (excitatory): Orange (#F39C12)
- GABA (inhibitory): Blue (#2980B9)
- Acetylcholine: Purple (#8E44AD)
- Glycine: Cyan (#17A2B8)

**Structural**:
- Membrane phospholipids: Orange/Blue alternating
- Membrane interior: Light gray (#ECEFF1)
- Transporters: Gray/Teal (#7F8C8D / #16A085)

**Ions** (for flow visualization):
- Na+: Red circles with +
- K+: Blue circles with +
- Ca2+: Green circles with ++
- Cl-: Purple circles with -

---

## Integration with Existing NeuroSketch Features

### Component + Graph Integration

**Use Case**: Explain action potential at molecular level

**Workflow**:
1. Place cellular components (Na+ channel, K+ channel, pump)
2. Place action potential graph
3. Add annotations linking graph phases to channel states
4. Use freehand arrows to show causal relationships

**Visual**:
```
[Graph: Action Potential]
         |
         | (annotation arrows)
         ↓
[Na+ Channel] [K+ Channel] [Na+/K+ Pump]
     ↓             ↓              ↓
[Phospholipid Bilayer Membrane]
```

### Component + Neuron Integration

**Use Case**: Show channel distribution on neuron

**Workflow**:
1. Draw neuron using existing tools
2. Place Na+ channels at axon hillock (high density)
3. Place K+ channels along axon
4. Place Ca2+ channels at axon terminal
5. Place receptors on dendrites

**Educational Value**: Spatial distribution of channels

### Component + Animation (Future)

**Use Case**: Action potential propagation along axon

**Workflow**:
1. Draw axon with components placed
2. Create timeline animation
3. Keyframe channel state changes
4. Keyframe ion flow
5. Export as animation frames

---

## Technical Architecture

### Data Structure

**Component Object**:
```javascript
{
    type: 'cellularComponent',
    category: 'voltageGated',  // membrane, voltageGated, ligandGated, transporter
    subtype: 'sodiumChannel',
    variant: 'nav1_6',
    x: 200,
    y: 300,
    width: 20,
    height: 60,
    rotation: 90,  // degrees (0 = horizontal, 90 = vertical)
    state: 'closed',  // closed, open, inactivated
    showIonFlow: true,
    showLabels: true,
    labelText: 'Nav1.6',
    labelPosition: 'top',  // top, bottom, left, right
    attachedToMembrane: 'membrane_001',  // Link to membrane object
    pharmacology: {
        blocker: null,  // e.g., 'TTX', 'Lidocaine'
        modulator: null  // e.g., 'Veratridine'
    }
}
```

### Membrane Attachment System

**Smart Snapping**:
- When dragging component near membrane (within 10px)
- Snap component to membrane surface
- Auto-orient perpendicular to membrane
- Lock to membrane (moves with membrane)

**Implementation**:
```javascript
function snapToNearestMembrane(component, membranes, snapDistance = 10) {
    for (const membrane of membranes) {
        const distance = distanceToMembrane(component, membrane);
        if (distance < snapDistance) {
            attachToMembrane(component, membrane);
            return true;
        }
    }
    return false;
}
```

### Serialization & Export

**Save Format**:
- All components saved in `.neuro` project file
- Component state preserved
- Membrane attachments maintained
- PNG export includes components at current state

**Backward Compatibility**:
- Projects without cellular components load normally
- Legacy projects can add cellular components

---

## Performance Considerations

### Rendering Optimization

**Challenge**: Many small components could slow rendering

**Solutions**:
1. **Culling**: Don't render off-screen components
2. **LOD (Level of Detail)**: Simplify components when zoomed out
3. **Component Caching**: Pre-render component shapes to off-screen canvas
4. **Dirty Region**: Only re-render when components change

**Target**: Maintain 60 FPS with 50+ components

### Memory Management

**Component Assets**:
- Store component definitions once (shared across instances)
- Each instance only stores state, position, rotation
- Minimal memory footprint per component

---

## User Testing & Validation

### Target Users

**Educators**:
- Create molecular mechanism diagrams
- Explain channel function in lectures
- Generate publication figures

**Students**:
- Study channel structure
- Understand state transitions
- Visualize ion flow

**Content Creators**:
- YouTube neuroscience videos
- Educational animations
- Tutorial content

### Success Metrics

**Usability**:
- Can create complete action potential diagram in <15 minutes
- Component placement feels intuitive
- State changes are clear and obvious

**Educational Value**:
- Students can identify channel types
- Diagrams accurately represent mechanisms
- Sufficient detail without overwhelming

**Technical Quality**:
- 60 FPS performance with 50+ components
- Clean, professional rendering
- Export quality suitable for publication

---

## Documentation Requirements

### Component Library Documentation

**For Each Component**:
- Scientific name and common name
- Structure description (subunits, domains)
- Function and role in neuroscience
- States and transitions
- Pharmacology (blockers, modulators)
- References to literature

**Example**:
```markdown
## Voltage-Gated Sodium Channel (Nav1.6)

**Scientific Name**: SCN8A
**Location**: Nodes of Ranvier, axon initial segment
**Function**: Rapid depolarization during action potential
**Structure**: 4 homologous domains (I-IV), 24 transmembrane segments total

**States**:
- Closed (resting): <-55mV
- Open (activated): -55 to +40mV, ~1ms duration
- Inactivated: +40mV to rest, ~5ms duration

**Pharmacology**:
- Blockers: TTX (tetrodotoxin), lidocaine, carbamazepine
- Modulators: Veratridine (keeps channels open)

**References**:
- Catterall, W.A. (2000). Nature Reviews Neuroscience
```

### User Guide Additions

**New Sections**:
- "Working with Cellular Components"
- "Creating Molecular Mechanism Diagrams"
- "Component States and Transitions"
- "Attaching Components to Membranes"

---

## Summary

### Total Implementation Scope

**Part A: Dimension Tracking**
- Estimated Code: ~270 lines
- Development Time: 4-6 hours
- Complexity: ⭐⭐⭐☆☆ (3/5)

**Part B: Cellular Components (Phase 1)**
- Estimated Code: ~1,650 lines
- Development Time: 12-16 hours
- Complexity: ⭐⭐⭐⭐☆ (4/5)

**Combined Total**:
- Code: ~1,920 lines
- Time: 16-22 hours
- Complexity: ⭐⭐⭐⭐☆ (4/5)

### Implementation Priority

**Recommended Order**:
1. **Dimension Tracking** (Part A) - Quick win, immediate value
2. **Cellular Components Foundation** (Part B Phase 1) - Core 6 components
3. **Extended Component Library** (Part B Phase 2) - Additional 12 components
4. **Advanced Features** (Part B Phase 3) - Animations, interactions

### Value Proposition

**For Educators**:
- Complete molecular-to-cellular neuroscience tool
- Publication-quality diagrams with precise dimensions
- Scientifically accurate representations

**For Students**:
- Visual learning of channel structure and function
- Interactive exploration of states
- Clear connection between molecules and electrical activity

**For NeuroSketch**:
- Unique positioning as molecular neuroscience tool
- No competition in this specific niche
- Expands market beyond basic diagramming

---

*Last Updated: 2025-10-02*
*Status: 📋 PLANNING PHASE - Awaiting Approval for Implementation*
*Next Step: Review plan and prioritize features for implementation*
