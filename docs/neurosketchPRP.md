# Product Requirements Prompt (PRP) for NeuroSketch

## Core Product Identity

**Product Name:** NeuroSketch

**Product Type:** Local 2D neuroscience visualization and diagramming software

**Primary Purpose:** Create educational diagrams and animations of brain processes for YouTube and YouTube Shorts content

**Target User:** Content creator (neuroscience educator) who needs to quickly produce professional-quality diagrams explaining neurons, circuits, action potentials, and brain anatomy

**Deployment:** Single-page web application that runs entirely locally in browser (no server required)

---

## Technical Architecture

### Technology Stack
- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6 modules)
- **Canvas:** HTML5 Canvas API for rendering
- **Storage:** Browser localStorage for auto-save, JSON file export/import for projects
- **Dependencies:** Minimal - only CDN libraries (no npm/build process)
- **File Structure:** Modular ES6 modules organized by feature (see folder structure document)

### Allowed External Libraries (CDN only)
- None required for core functionality
- SVG manipulation libraries may be added if needed
- Chart/graph libraries should be custom-built for precise control

### Performance Requirements
- 60 FPS canvas rendering at all zoom levels
- Handle 50+ neurons, 100+ connections without lag
- Smooth pan/zoom operations
- Export high-resolution images (up to 4K) without browser crash
- Load/save projects under 2 seconds for typical project size

---

## Core Feature Requirements

### 1. Canvas System
**Must Have:**
- Infinite canvas with pan (spacebar + drag) and zoom (mouse wheel)
- Zoom range: 10% to 500%
- Optional grid overlay (toggleable, 20px squares)
- Three-layer system: background, main drawing, annotations
- White or light gray background (user preference)
- Rulers showing pixel measurements (toggleable)

**Visual Requirements:**
- Clean, uncluttered workspace
- Smooth rendering at all zoom levels
- Clear visual feedback for all interactions

---

### 2. User Interface Layout

#### Top Menu Bar (50px height)
- Application title: "NeuroSketch"
- File menu: New, Save, Load, Export
- Edit menu: Undo, Redo, Copy, Paste, Delete
- View menu: Zoom controls, Grid toggle, Show/Hide panels
- Help menu: Shortcuts, Documentation

#### Left Toolbar (60px width, vertical)
**Tool Categories:**
1. Selection & Basic Tools
   - Select/Move tool
   - Circle tool
   - Rectangle tool  
   - Line tool
   - Text tool

2. Neuron Tools
   - Simple neuron
   - Pyramidal neuron
   - Detailed neuron with organelles
   - Neuron presets dropdown

3. Connection Tools
   - Excitatory synapse
   - Inhibitory synapse
   - Electrical synapse

4. Graph Tool
   - Insert graph/chart

5. Anatomy Library
   - Brain region templates

**Visual Style:**
- Icon-based buttons (SVG or Unicode symbols)
- Selected tool highlighted
- Tooltips on hover
- Visual separators between categories

#### Right Properties Panel (280px width, collapsible)
**Dynamic Content Based on Selection:**
- When neuron selected: soma size, dendrite count, axon length, myelination, colors
- When synapse selected: type, strength, neurotransmitter
- When graph selected: axis ranges, curve type, annotations
- When anatomy selected: region name, color, labels
- When nothing selected: canvas settings, grid, background

#### Bottom Timeline Panel (toggleable, 120px height)
- Keyframe-based animation timeline
- Playback controls
- Duration settings
- Only visible when animation mode active

---

### 3. Neuron System

#### Neuron Components
**Anatomical Parts:**
- Soma (cell body): circular, adjustable diameter 20-80px
- Dendrites: 2-8 branching structures, tapering toward ends
- Axon: single projection, can be curved, adjustable length
- Axon terminals: small branches at end
- Myelin sheath: optional segmented white/gray bands on axon

#### Neuron Presets (Quick Insert)
1. **Motor Neuron:** Large soma (60px), long axon, 3-4 short dendrites, myelinated
2. **Pyramidal Neuron:** Triangular soma, prominent apical dendrite, basal dendrites
3. **Purkinje Cell:** Small soma, extensive highly-branched dendritic tree
4. **Interneuron:** Small soma (25px), highly branched, short processes

#### Detail Levels
- **Simple:** Outline only (default)
- **Basic:** Shows nucleus and membrane
- **Detailed:** Shows major organelles (nucleus, mitochondria, ER, Golgi)
- **Full:** All organelles with labels

#### Organelles (for Detailed view)
- Nucleus (30-40% of soma, double membrane)
- Rough ER (wavy parallel lines with dots)
- Smooth ER (wavy parallel lines)
- Golgi apparatus (stacked curves)
- Mitochondria (ovals with cristae)
- Vesicles (small circles, clusterable)
- Ion channels (insertable markers: Na⁺, K⁺, Ca²⁺, Cl⁻)
- Na⁺/K⁺ pumps

**Visual Style:**
- Clean, textbook-quality diagrams
- Similar to Kandel, Purves, or Bear neuroscience textbook illustrations
- Scientifically accurate proportions
- Professional color schemes (default: grayscale with color-coding option)

---

### 4. Graph System

#### Graph Types
1. **Action Potential**
   - X-axis: Time (0-5ms default, customizable)
   - Y-axis: Membrane potential (-90mV to +40mV)
   - Standard curve shape with phases
   - Threshold line (-55mV, red dashed)
   - Resting potential line (-70mV, gray dashed)

2. **Synaptic Potentials (EPSP/IPSP)**
   - Smaller amplitude changes
   - Slower time course
   - Multiple traces overlayable

3. **Concentration Gradients**
   - Show ion concentration differences
   - Inside vs outside cell
   - Color-coded by ion type

4. **Custom Graph**
   - User-defined axes and data points

#### Graph Features
- **Interactive Curve Editor:** Drag control points to modify shape
- **Preset Curves:** Standard, Fast, Slow, Cardiac action potentials
- **Annotations:** Phase labels (depolarization, repolarization, etc.)
- **Ion Channel Indicators:** Arrows showing Na⁺ influx, K⁺ efflux
- **Customizable Styling:** Line color, thickness, grid on/off
- **Size Range:** 200-600px width/height

**Visual Requirements:**
- Publication-quality graphics
- Clear axis labels with units
- Legend for multiple traces
- Optional background transparency

---

### 5. Synapse & Circuit System

#### Synapse Types
1. **Excitatory:** Green/orange, triangle arrowhead, glutamate default
2. **Inhibitory:** Red/blue, perpendicular bar ending, GABA default
3. **Electrical:** Yellow, double-headed arrow, gap junction symbol

#### Connection Behavior
- Click source neuron, then target neuron to create
- Automatic smart routing around obstacles
- Snaps to axon terminal → dendrite/soma
- Updates dynamically when neurons are moved
- Adjustable strength (affects visual thickness)

#### Neurotransmitter Options
- Glutamate (excitatory)
- GABA (inhibitory)
- Dopamine
- Serotonin
- Acetylcholine
- Norepinephrine
- Show as text label or icon (toggleable)

#### Circuit Presets (Auto-generate)
1. **Monosynaptic Reflex:** Sensory neuron → motor neuron
2. **Polysynaptic Reflex:** Sensory → interneuron → motor
3. **Reciprocal Inhibition:** Agonist/antagonist muscle control
4. **Feedforward Inhibition:** Input → excitatory + inhibitory paths
5. **Feedback Loop:** Recurrent connection

#### Signal Animation
- "Animate Signal" button initiates propagation
- Action potential wave travels along connections (1-2 seconds)
- Synapses briefly highlight when signal arrives
- Speed adjustable (0.5x to 2x)
- Play/pause/reset controls

---

### 6. Brain Anatomy System

#### Region Library (Organized by Category)

**Forebrain:**
- Cerebral cortex (folded surface, lobes distinguishable)
- Hippocampus (seahorse curve)
- Amygdala (almond shape)
- Basal ganglia (clustered nuclei)
- Thalamus (egg shape)
- Hypothalamus (smaller, below thalamus)

**Midbrain:**
- Superior/inferior colliculi
- Substantia nigra

**Hindbrain:**
- Cerebellum (distinct folding pattern)
- Pons (bulge)
- Medulla (tapering)

**Spinal Cord:**
- Segments (cervical, thoracic, lumbar, sacral)
- Gray matter (butterfly shape in cross-section)
- White matter (surrounding)

#### Cross-Section Templates
- Coronal (frontal slice)
- Sagittal (side view)
- Horizontal (top-down)

#### Features
- Drag from library to canvas
- Auto-scale and suggest positioning
- Connection points for pathways between regions
- Color-coding by function (motor=red, sensory=blue, cognitive=green, limbic=purple)
- Show/hide region labels
- Major white matter tracts (corpus callosum, etc.)

**Visual Style:**
- Simplified 2D shapes (not realistic 3D)
- Clear, recognizable outlines
- Textbook diagram aesthetic
- Grayscale or color-coded options

---

### 7. Animation System

#### Timeline Features
- Keyframe-based (similar to video editors)
- Drag keyframes to adjust timing
- Properties animatable: position, opacity, color, size, rotation
- Duration: 1-60 seconds
- Frame rate: 60 FPS export

#### Animation Types
1. **Signal Propagation:** Shows action potential traveling through circuits
2. **Zoom Focus:** Camera zooms into specific element
3. **Build-up Sequence:** Elements appear one-by-one with fade-in
4. **Highlight Pulse:** Selected elements glow/pulse
5. **Process Flow:** Step-by-step with arrows and highlights

#### Preset Animations
- "Action Potential Sequence": Neuron depolarization + synchronized graph
- "Synaptic Transmission": Vesicle release, neurotransmitter diffusion
- "Circuit Activation": Signal flows through multi-neuron path
- "Brain Pathway": Highlight anatomical pathway progression

#### Playback Controls
- Play/Pause button
- Speed control (0.25x, 0.5x, 1x, 1.5x, 2x)
- Loop toggle
- Frame-by-frame step (← →)
- Preview window

---

### 8. Export System

#### Export Formats
1. **PNG:** Rasterized image
   - Resolution presets: 1080p, 1440p, 4K, custom
   - Quality slider (compression level)
   
2. **SVG:** Vector format for editing in Illustrator/Inkscape

3. **PNG Sequence:** Frame-by-frame for animations

4. **JSON:** Project file (.neuro extension)

5. **Copy to Clipboard:** Quick copy for pasting into documents

#### Export Settings
**Aspect Ratio Presets:**
- YouTube (16:9)
- YouTube Shorts/TikTok (9:16)
- Square (1:1)
- Instagram Story (9:16)
- Custom dimensions

**Options:**
- Include/exclude: grid, labels, selection handles
- Background: transparent, white, custom color
- Resolution multiplier: 1x, 2x, 4x
- Safe zones guide for mobile viewing

#### YouTube-Specific Features
- Text overlay system (appears at keyframes)
- Annotation arrows that point to elements
- Safe zone guides (for mobile/desktop viewing)

---

### 9. File Management

#### Save/Load System
- **Save:** Download .neuro JSON file
- **Load:** Upload .neuro file to restore complete state
- **Auto-save:** Local browser storage every 30 seconds (with recovery on crash)
- **Recent Projects:** Dropdown showing last 5 opened projects

#### Project File Contents (JSON)
- All canvas objects (neurons, graphs, anatomy, connections)
- Object properties (positions, colors, sizes, labels, layers)
- Canvas state (zoom level, pan position, grid visibility)
- Animation keyframes
- Project metadata (name, creation date, description, author)

#### Project Templates
1. "Blank Canvas"
2. "Action Potential Demo" (neuron + graph pre-positioned)
3. "Reflex Arc Circuit" (complete sensory-motor setup)
4. "Synaptic Transmission" (detailed synapse with vesicles)
5. "Brain Anatomy Overview" (major structures in correct positions)

---

### 10. Keyboard Shortcuts

**File Operations:**
- Ctrl/Cmd + S: Save
- Ctrl/Cmd + O: Open
- Ctrl/Cmd + E: Export
- Ctrl/Cmd + N: New project

**Editing:**
- Ctrl/Cmd + Z: Undo
- Ctrl/Cmd + Y / Shift+Z: Redo
- Ctrl/Cmd + C: Copy
- Ctrl/Cmd + V: Paste
- Ctrl/Cmd + D: Duplicate
- Ctrl/Cmd + A: Select all
- Delete/Backspace: Remove selected
- Escape: Deselect all

**View:**
- Spacebar + Drag: Pan canvas
- Ctrl/Cmd + Scroll: Zoom
- Ctrl/Cmd + 0: Reset zoom to 100%
- Ctrl/Cmd + 1: Fit all to view
- G: Toggle grid

**Tools:**
- V: Select tool
- C: Circle tool
- R: Rectangle tool
- L: Line tool
- T: Text tool
- N: Neuron tool

**Object Manipulation:**
- Ctrl/Cmd + G: Group objects
- Ctrl/Cmd + Shift + G: Ungroup
- Ctrl/Cmd + ]: Bring forward
- Ctrl/Cmd + [: Send backward

---

## Visual Design System

### Color Palette
**UI Colors:**
- Primary: #2C3E50 (dark blue-gray) - toolbars, menus
- Secondary: #34495E (medium gray) - hover states
- Accent: #3498DB (bright blue) - selected tools, active states
- Background: #ECF0F1 (light gray) - canvas default
- Text: #2C3E50 (dark) on light, #ECF0F1 (light) on dark

**Neuroscience Colors (defaults):**
- Excitatory neurons/synapses: #E74C3C (red) or #F39C12 (orange)
- Inhibitory neurons/synapses: #3498DB (blue)
- Electrical synapses: #F1C40F (yellow)
- Action potential curve: #000000 (black)
- Threshold/important lines: #E74C3C (red)
- Anatomical regions: pastel colors (user can customize)

### Typography
- **UI Font:** System default (San Francisco, Segoe UI, Roboto)
- **Diagram Labels:** Arial or Helvetica (clear, scientific)
- **Font Sizes:**
  - UI: 14px regular text, 12px small labels
  - Diagram labels: 16px default, adjustable 10-24px
  - Headers: 18px bold

### Spacing & Layout
- **Toolbar icons:** 40x40px with 10px padding
- **Panel padding:** 16px
- **Element spacing:** 12px between UI components
- **Canvas margins:** None (full bleed)

### Visual Feedback
- **Hover:** Slight brightness increase, subtle shadow
- **Active/Selected:** Blue outline (2px), accent color
- **Disabled:** 50% opacity, no hover effect
- **Loading:** Subtle spinner or progress bar

---

## User Experience Requirements

### Onboarding
- First-time users see 30-second tutorial overlay
- Skip button available
- Highlights key tools: neuron, graph, export
- Example project available to explore

### Tooltips
- Every toolbar button shows tooltip on hover (500ms delay)
- Format: "Tool Name (Shortcut)" + brief description
- Example: "Neuron Tool (N) - Draw customizable neurons"

### Context Menus
- Right-click any object: shows relevant actions
  - Duplicate
  - Delete
  - Bring to Front / Send to Back
  - Properties
  - Copy/Paste
  
### Error Handling
- **File load errors:** "Unable to load project. File may be corrupted."
- **Export errors:** "Export failed. Try reducing resolution or file size."
- **Auto-save failures:** "Auto-save failed. Please manually save your work."
- All errors include: clear message + suggested action

### Performance Feedback
- Show loading spinner for operations >500ms
- Progress bar for exports >2 seconds
- "Saving..." indicator during save operations

---

## Accessibility Requirements

### Keyboard Navigation
- Tab through all UI elements
- Arrow keys to move selected objects (1px per press, 10px with Shift)
- Enter to confirm, Escape to cancel

### Screen Reader Support
- ARIA labels on all interactive elements
- Alt text for all icons
- Semantic HTML structure

### Visual Accessibility
- High contrast mode toggle
- Minimum contrast ratio: 4.5:1 for text
- Color not the only indicator (use shapes/patterns too)
- Adjustable UI font size

---

## Browser Compatibility

### Required Support
- **Chrome/Edge:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions

### Features by Browser
- Canvas API: All modern browsers
- ES6 Modules: All modern browsers
- localStorage: All modern browsers
- File download: All modern browsers

### Graceful Degradation
- If localStorage unavailable: warn user, disable auto-save
- If Canvas unsupported: show error message
- Minimum screen resolution: 1280x720

---

## Security & Privacy

### Data Storage
- All data stored locally (browser localStorage + downloaded files)
- No server communication
- No analytics or tracking
- No user accounts or authentication

### File Safety
- Only load .neuro JSON files
- Validate JSON structure before parsing
- Sanitize user inputs (text labels, file names)
- No executable code in saved projects

---

## Future Enhancement Considerations (Not in Initial Version)

### Possible Phase 2 Features
- 3D neuron rendering (optional mode)
- Collaborative editing (multi-user)
- Cloud save/sync
- Plugin system for custom tools
- Video export (not just frames)
- Advanced electrophysiology simulation
- Integration with actual neuroscience data formats
- Mobile/tablet touch support
- AI-assisted diagram generation

### Extensibility Design
- Modular architecture allows feature additions
- Plugin API for custom tools (future)
- Import/export system extensible to new formats
- Template system allows community contributions

---

## Testing & Quality Criteria

### Functional Testing
- All tools work as described
- Save/load preserves all data
- Export produces correct output
- Animations play smoothly
- Undo/redo works for all actions

### Usability Testing
- New user can create basic diagram in <5 minutes
- User can create action potential demo in <10 minutes
- User can export YouTube-ready image in <2 minutes
- Keyboard shortcuts feel natural

### Performance Testing
- 60 FPS with 50 neurons on screen
- Zoom/pan remains smooth at all scales
- Export 4K image in <5 seconds
- Load typical project in <2 seconds
- Auto-save doesn't cause UI freeze

---

## Success Metrics

### Primary Goals
1. User can create professional neuroscience diagrams quickly
2. Exported content is YouTube-ready without further editing
3. Application runs smoothly on standard laptops
4. Learning curve is minimal for basic features

### Concrete Targets
- Create reflex arc circuit: <10 minutes
- Create action potential with neuron: <8 minutes
- Export HD image: <30 seconds
- Application loads: <3 seconds

---

## Development Priorities

### Phase 1 (MVP - Prompts 1-3)
- Core canvas system
- Basic neuron drawing
- Action potential graphs
- Simple export (PNG)

### Phase 2 (Prompts 4-6)
- Synapses and circuits
- Detailed cell components
- Anatomy templates

### Phase 3 (Prompts 7-9)
- Animation system
- Advanced export options
- Polish and optimization

---

## Constraints & Limitations

### Technical Constraints
- **No backend:** Everything client-side
- **No build process:** Raw HTML/CSS/JS only
- **CDN only:** No npm packages
- **Browser storage:** Limited to ~5-10MB localStorage
- **Single file option:** Must work as standalone HTML

### Scope Limitations
- **2D only:** No 3D rendering
- **Static or keyframe animation:** No physics simulation
- **Diagram focus:** Not a full neuroscience simulator
- **Local only:** No collaboration features

### Educational Focus
- Priority: Clear, accurate diagrams for teaching
- Not for: Research-grade simulations or data visualization
- Target audience: Content creators, not researchers

---

## Context for AI Development

### When Modifying/Extending NeuroSketch:

1. **Always maintain:**
   - Local-first architecture
   - Single-file HTML compatibility option
   - Clean, modular code structure
   - Scientific accuracy in visualizations

2. **When adding features:**
   - Check if it fits the educational content creation use case
   - Ensure it doesn't compromise performance
   - Keep UI simple and uncluttered
   - Maintain visual consistency with existing design

3. **When debugging:**
   - Test with 50+ neurons to ensure performance
   - Verify save/load works with new features
   - Check export quality at all resolutions
   - Test keyboard shortcuts don't conflict

4. **Code style:**
   - ES6 modules with clear imports/exports
   - Descriptive variable names
   - Comments for complex logic
   - Consistent formatting (2-space indent)

5. **User experience priority:**
   - Speed and responsiveness over feature richness
   - Clear error messages over silent failures
   - Intuitive defaults over extensive customization
   - Educational clarity over technical complexity

---

**End of Product Requirements Prompt**

---

## Usage Instructions for This PRP

**For AI assistants working on NeuroSketch:**

Include this PRP at the start of any development session by saying:
> "I'm working on NeuroSketch. Here are the complete product requirements: [paste PRP]. Please keep these requirements in mind for all modifications."

**For specific tasks:**
- **Adding a feature:** "Based on the NeuroSketch PRP, add [feature] ensuring it follows the design system and technical architecture."
- **Fixing a bug:** "The [component] isn't working as specified in the PRP. Debug and fix while maintaining requirements."
- **Optimizing:** "Improve performance of [feature] while staying within the PRP constraints."

This PRP serves as the **single source of truth** for all NeuroSketch development decisions.