# CLAUDE.md - NeuroSketch Cognitive Operating System

This document provides a comprehensive framework of cognitive tools, protocol shells, reasoning templates, and workflows for developing NeuroSketch. Load this file in your project root to enhance Claude's capabilities for neuroscience visualization software development.

**Project Context:** NeuroSketch is a local 2D neuroscience visualization tool for creating educational diagrams and animations. See `neurosketchPRP.md` for complete product requirements.

## 1. Core Meta-Cognitive Framework

### NeuroSketch Context Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "NeuroSketch Development Schema",
  "description": "Standardized format for NeuroSketch development tasks",
  "type": "object",
  "properties": {
    "feature": {
      "type": "object",
      "properties": {
        "category": {
          "type": "string",
          "enum": ["canvas", "neuron", "graph", "circuit", "anatomy", "animation", "export", "ui"]
        },
        "requirements": {
          "type": "object",
          "description": "Requirements from neurosketchPRP.md"
        },
        "dependencies": {
          "type": "array",
          "description": "Other features this depends on"
        }
      }
    },
    "implementation": {
      "type": "object",
      "properties": {
        "affected_files": {
          "type": "array",
          "description": "Files to create or modify"
        },
        "scientific_accuracy": {
          "type": "string",
          "description": "Neuroscience accuracy requirements"
        },
        "visual_style": {
          "type": "string",
          "description": "Textbook-quality diagram requirements"
        }
      }
    },
    "validation": {
      "type": "object",
      "properties": {
        "functionality": {
          "type": "array",
          "description": "Feature works as specified"
        },
        "performance": {
          "type": "string",
          "description": "60 FPS, handles 50+ neurons"
        },
        "educational_clarity": {
          "type": "string",
          "description": "Clear for educational content creation"
        }
      }
    }
  }
}
```

### Reasoning Protocols

```
/reasoning.neurosketch{
    intent="Apply systematic reasoning to NeuroSketch development with scientific accuracy",
    input={
        task="<development_task>",
        prp_section="<relevant_PRP_section>",
        scientific_requirements="<neuroscience_accuracy_needs>"
    },
    process=[
        /understand{action="Review PRP requirements and neuroscience context"},
        /validate{action="Ensure scientific accuracy of approach"},
        /design{action="Plan implementation following modular architecture"},
        /implement{action="Code following ES6 module structure"},
        /verify{action="Test functionality, performance, and visual quality"},
        /document{action="Add clear comments for future modifications"}
    ],
    output={
        implementation="Working feature code",
        validation="Performance and accuracy verification",
        integration="How it fits in modular structure"
    }
}
```

```
/thinking.visual_design{
    intent="Apply extended thinking to visual and UX design decisions for educational clarity",
    input={
        component="<ui_or_diagram_component>",
        audience="<neuroscience_educators>",
        constraints="<technical_and_design_constraints>"
    },
    process=[
        /analyze{action="Consider educational effectiveness and visual clarity"},
        /compare{action="Reference textbook diagram standards (Kandel, Purves, Bear)"},
        /evaluate{action="Assess usability for content creation workflow"},
        /optimize{action="Balance scientific accuracy with simplicity"},
        /validate{action="Ensure meets YouTube content creation needs"}
    ],
    output={
        design="Visual design specification",
        rationale="Educational and UX reasoning",
        implementation_notes="CSS/Canvas rendering approach"
    }
}
```

### Self-Improvement Protocol

```
/self.reflect.neurosketch{
    intent="Continuously improve NeuroSketch implementations through reflection",
    input={
        implementation="<feature_implementation>",
        prp_requirements="<relevant_PRP_criteria>"
    },
    process=[
        /assess{
            scientific_accuracy="Verify neuroscience correctness",
            performance="Check 60 FPS, 50+ neurons handling",
            usability="Evaluate educational content workflow",
            code_quality="Review modular structure adherence"
        },
        /identify{
            strengths="Note well-implemented aspects",
            gaps="Recognize missing PRP requirements",
            improvements="Identify optimization opportunities"
        },
        /enhance{
            implementation="Apply targeted improvements",
            documentation="Update inline documentation"
        }
    ],
    output={
        evaluation="Assessment against PRP",
        improved_implementation="Enhanced version",
        lessons="Insights for future features"
    }
}
```

## 2. NeuroSketch Development Workflows

### Feature Implementation Workflow (Modular Structure)

```
/workflow.neurosketch_feature{
    intent="Implement NeuroSketch features following modular ES6 architecture",
    input={
        feature="<feature_from_prompts_1-9>",
        prp_section="<relevant_PRP_requirements>",
        folder_structure="<target_folders>"
    },
    process=[
        /review_prp{
            action="Read relevant neurosketchPRP.md sections",
            instruction="Understand all requirements before coding"
        },
        /plan_modules{
            action="Identify which files/modules to create or modify",
            instruction="Follow folder structure: src/core, src/ui, src/objects, src/modules, etc."
        },
        /implement_modular{
            action="Create ES6 modules with proper imports/exports",
            instruction="One module per file, clear separation of concerns"
        },
        /verify_scientific{
            action="Validate neuroscience accuracy",
            instruction="Check against textbook standards (Kandel, Purves, Bear)"
        },
        /test_performance{
            action="Test with 50+ neurons, verify 60 FPS",
            instruction="Ensure smooth pan/zoom at all scales"
        },
        /integrate{
            action="Import into main.js and wire up UI",
            instruction="Ensure proper integration with existing features"
        }
    ],
    output={
        modules="Created/modified ES6 module files",
        integration="Updated imports in main.js",
        verification="Performance and accuracy validation"
    }
}
```

### Canvas Object Creation Workflow

```
/workflow.canvas_object{
    intent="Create new canvas objects (neurons, graphs, anatomy) following NeuroSketch patterns",
    input={
        object_type="<neuron|graph|synapse|anatomy>",
        properties="<object_properties>",
        interactions="<user_interactions>"
    },
    process=[
        /extend_base{
            action="Extend BaseObject class from src/objects/base-object.js",
            instruction="Inherit standard object behavior (select, move, resize, rotate)"
        },
        /implement_render{
            action="Implement render() method for Canvas API drawing",
            instruction="Use scientifically accurate proportions and textbook visual style"
        },
        /add_properties{
            action="Create properties panel UI in src/ui/properties-panel.js",
            instruction="Allow customization: size, color, labels, etc."
        },
        /handle_interactions{
            action="Implement mouse/keyboard handlers",
            instruction="Support click, drag, double-click, resize, rotate"
        },
        /save_load{
            action="Add serialization methods toJSON() and fromJSON()",
            instruction="Ensure objects save/load correctly in .neuro files"
        }
    ],
    output={
        object_class="New object class in src/objects/",
        renderer="Rendering logic (possibly in src/modules/)",
        properties_ui="Properties panel integration",
        serialization="Save/load compatibility"
    }
}
```

### Visual Design Iteration Workflow

```
/workflow.visual_iteration{
    intent="Iteratively refine visual components to meet textbook diagram quality",
    input={
        component="<neuron|graph|anatomy|ui_element>",
        reference="<textbook_style_description>"
    },
    process=[
        /research{
            action="Review neuroscience textbook diagram standards",
            instruction="Reference Kandel, Purves, Bear illustration styles"
        },
        /implement_initial{
            action="Create first version focusing on scientific accuracy",
            instruction="Correct proportions, clear labeling"
        },
        /visual_review{
            action="Assess against educational clarity criteria",
            instruction="Would this work in a YouTube video? Is it clear at thumbnail size?"
        },
        /refine_styling{
            action="Improve visual polish",
            instruction="Clean lines, appropriate colors, good contrast"
        },
        /test_scales{
            action="Test at different zoom levels and export resolutions",
            instruction="Verify clarity at 1080p, 1440p, 4K"
        }
    ],
    output={
        visual_component="Polished, textbook-quality rendering",
        style_documentation="CSS/Canvas drawing code with comments",
        export_verification="Tested at YouTube content resolutions"
    }
}
```

### Animation Implementation Workflow

```
/workflow.animation{
    intent="Create smooth, educational animations for neural processes",
    input={
        animation_type="<signal_propagation|zoom_focus|build_up|process_flow>",
        duration="<animation_duration>",
        objects="<objects_to_animate>"
    },
    process=[
        /design_timeline{
            action="Plan keyframes and timing",
            instruction="Design for educational clarity, not just visual appeal"
        },
        /implement_animator{
            action="Create animation logic in src/modules/animation/",
            instruction="Use requestAnimationFrame for 60 FPS"
        },
        /add_controls{
            action="Implement timeline UI in src/ui/",
            instruction="Play, pause, speed control, loop"
        },
        /optimize_performance{
            action="Ensure smooth playback with many objects",
            instruction="Test with 50+ neurons, maintain 60 FPS"
        },
        /export_frames{
            action="Implement PNG sequence export",
            instruction="Support YouTube/Shorts aspect ratios"
        }
    ],
    output={
        animation_system="Working animation with timeline",
        performance="60 FPS validation",
        export_capability="Frame sequence export for video editing"
    }
}
```

## 3. Code Analysis & Generation Tools

### NeuroSketch Code Analysis Protocol

```
/code.analyze.neurosketch{
    intent="Analyze NeuroSketch code for modularity, performance, and scientific accuracy",
    input={
        code="<code_to_analyze>",
        module_type="<core|ui|objects|modules|export|file|utils>"
    },
    process=[
        /parse{
            structure="Verify ES6 module structure and imports",
            patterns="Check adherence to NeuroSketch patterns",
            dependencies="Map module dependencies"
        },
        /evaluate{
            modularity="Assess separation of concerns",
            performance="Check Canvas rendering efficiency",
            scientific_accuracy="Verify neuroscience correctness",
            prp_compliance="Ensure meets PRP requirements"
        },
        /summarize{
            purpose="Describe module's role in NeuroSketch",
            interactions="Document interactions with other modules",
            improvements="Suggest optimizations"
        }
    ],
    output={
        analysis="Module analysis report",
        compliance="PRP requirement checklist",
        recommendations="Improvement suggestions"
    }
}
```

### Scientific Accuracy Validation Protocol

```
/validate.scientific_accuracy{
    intent="Ensure neuroscience visualizations are scientifically accurate",
    input={
        visualization="<neuron|circuit|graph|anatomy>",
        reference="<textbook_or_literature_source>"
    },
    process=[
        /compare{
            proportions="Check anatomical proportions",
            labels="Verify correct terminology",
            relationships="Validate spatial relationships"
        },
        /verify{
            physiology="Confirm physiological accuracy (e.g., action potential shape)",
            connectivity="Validate circuit connections",
            scale="Check relative size relationships"
        },
        /document{
            sources="Note reference sources used",
            assumptions="Document any simplifications",
            limitations="Note educational simplifications"
        }
    ],
    output={
        validation="Scientific accuracy assessment",
        corrections="Required corrections",
        documentation="Source references and rationale"
    }
}
```

### Canvas Performance Optimization Protocol

```
/optimize.canvas_performance{
    intent="Ensure 60 FPS rendering with 50+ neurons and 100+ connections",
    input={
        rendering_code="<canvas_rendering_code>",
        object_count="<typical_object_count>"
    },
    process=[
        /profile{
            bottlenecks="Identify rendering bottlenecks",
            frame_time="Measure frame rendering time",
            memory="Check memory usage patterns"
        },
        /optimize{
            dirty_regions="Implement dirty region tracking",
            object_culling="Skip offscreen object rendering",
            path_caching="Cache complex paths (neurons, anatomy)",
            layer_separation="Separate static and dynamic layers"
        },
        /validate{
            fps="Confirm 60 FPS with heavy load",
            zoom_smooth="Verify smooth zoom/pan",
            interaction="Test responsive interactions"
        }
    ],
    output={
        optimized_code="Performance-improved rendering",
        benchmarks="Performance measurements",
        recommendations="Further optimization suggestions"
    }
}
```

## 4. Testing & Validation Frameworks

### NeuroSketch Feature Testing Protocol

```
/test.neurosketch_feature{
    intent="Comprehensively test NeuroSketch features against PRP requirements",
    input={
        feature="<implemented_feature>",
        prp_requirements="<PRP_section>"
    },
    process=[
        /test_functionality{
            basic="Test core feature functionality",
            edge_cases="Test boundary conditions (min/max values)",
            interactions="Test with other features"
        },
        /test_performance{
            load="Test with 50+ neurons, 100+ connections",
            fps="Verify 60 FPS during interactions",
            export="Test export at 4K resolution"
        },
        /test_usability{
            workflow="Test educational content creation workflow",
            shortcuts="Verify keyboard shortcuts",
            tooltips="Check tooltip clarity"
        },
        /test_persistence{
            save="Test saving to .neuro JSON",
            load="Test loading and restoration",
            export="Test PNG/SVG export"
        }
    ],
    output={
        test_results="Pass/fail for each test category",
        issues="Identified problems",
        recommendations="Suggested fixes"
    }
}
```

### Visual Quality Assurance Protocol

```
/test.visual_quality{
    intent="Ensure diagrams meet textbook quality standards",
    input={
        visualization="<rendered_diagram>",
        export_resolution="<1080p|1440p|4K>"
    },
    process=[
        /assess_clarity{
            readability="Check label legibility at export size",
            contrast="Verify sufficient color contrast",
            detail="Ensure appropriate detail level"
        },
        /assess_accuracy{
            proportions="Validate anatomical proportions",
            style="Compare to textbook diagram standards",
            labeling="Check terminology correctness"
        },
        /assess_youtube{
            thumbnail="Test thumbnail visibility (small size)",
            mobile="Check mobile viewing clarity",
            shorts="Verify 9:16 aspect ratio suitability"
        }
    ],
    output={
        quality_report="Visual quality assessment",
        issues="Visual problems identified",
        recommendations="Visual improvement suggestions"
    }
}
```

## 5. NeuroSketch-Specific Conventions

### File Organization
```
neurosketch/
├── index.html                   # Main entry point
├── neurosketchPRP.md            # Product requirements (REFERENCE ALWAYS)
├── CLAUDE.md                    # This file
├── README.md                    # Project documentation
│
├── src/
│   ├── main.js                  # Application initialization
│   ├── config.js                # Global configuration
│   ├── core/                    # Core functionality (canvas, state, events, layers)
│   ├── ui/                      # UI components (toolbar, properties, menu, dialogs)
│   ├── tools/                   # Drawing tools (select, neuron, connection, graph)
│   ├── objects/                 # Canvas objects (neuron, synapse, graph, anatomy)
│   ├── modules/                 # Feature modules (neurons/, graphs/, circuits/, anatomy/, animation/)
│   ├── export/                  # Export functionality (PNG, SVG, sequence)
│   ├── file/                    # File management (save, load, templates)
│   └── utils/                   # Utility functions (math, geometry, collision, color)
│
├── assets/
│   ├── icons/                   # UI icons (SVG)
│   └── templates/               # Visual templates (neurons, circuits, anatomy)
│
├── styles/
│   ├── main.css                 # Main styles
│   └── themes/                  # Theme files (light.css, dark.css)
│
└── examples/                    # Example .neuro projects
```

### Code Style
- **ES6 Modules**: Always use import/export, never global scope
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Indentation**: 2 spaces (consistent with web standards)
- **Comments**: JSDoc for public functions, inline for complex logic
- **Scientific Terms**: Use correct neuroscience terminology (soma not cell body, axon not nerve fiber)
- **Constants**: UPPER_SNAKE_CASE in config.js

### Canvas Rendering Guidelines
```javascript
// Good: Efficient rendering with proper transforms
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);
// Draw relative to 0,0
ctx.restore();

// Good: Use paths for complex shapes
const path = new Path2D();
path.moveTo(x1, y1);
path.lineTo(x2, y2);
ctx.stroke(path);

// Avoid: Redrawing everything every frame
// Instead: Track dirty regions and redraw selectively
```

### Neuroscience Accuracy Standards
- **Neuron proportions**: Soma 20-80px, dendrites taper toward tips, axon typically longer
- **Action potential**: Threshold at -55mV, peak at +40mV, resting at -70mV
- **Synapses**: Excitatory (glutamate, triangle), Inhibitory (GABA, bar), Electrical (gap junction)
- **Anatomy**: Simplified but recognizable (hippocampus seahorse shape, cerebellum folded)
- **Colors**: Follow conventions (excitatory=red/orange, inhibitory=blue, electrical=yellow)

### Performance Requirements
- **60 FPS**: Maintain during pan, zoom, animation
- **50+ neurons**: Handle without lag
- **100+ connections**: Smooth rendering and updates
- **Export**: 4K images in <5 seconds
- **Load**: Typical project <2 seconds

### Module Communication Pattern
```javascript
// src/objects/neuron.js
export class Neuron extends BaseObject {
  constructor(x, y, options) {
    super(x, y);
    this.type = options.type || 'motor';
    // ...
  }
  
  render(ctx) {
    NeuronRenderer.render(ctx, this);
  }
  
  toJSON() {
    return { type: this.type, x: this.x, y: this.y, ... };
  }
}

// src/modules/neurons/neuron-renderer.js
export class NeuronRenderer {
  static render(ctx, neuron) {
    // Rendering logic separate from object data
  }
}
```

## 6. Development Phase Protocols

### Phase 1: Foundation (Prompts 1-3)

```
/phase1.foundation{
    intent="Establish core NeuroSketch infrastructure",
    scope=[
        "Canvas system with pan/zoom",
        "UI layout (toolbar, properties, menu)",
        "Basic shapes and text tools",
        "Neuron drawing tools",
        "Action potential graphs",
        "Basic PNG export"
    ],
    focus=[
        "Clean, modular architecture",
        "Smooth 60 FPS rendering",
        "Intuitive UI/UX",
        "Scientific accuracy foundations"
    ],
    validation=[
        "Can create and manipulate neurons",
        "Can draw action potential graphs",
        "Can export to PNG",
        "Performance meets 60 FPS requirement"
    ]
}
```

### Phase 2: Connectivity (Prompts 4-6)

```
/phase2.connectivity{
    intent="Add synapses, circuits, and detailed cellular components",
    scope=[
        "Synapse drawing tools",
        "Circuit presets and signal animation",
        "Organelles and cell detail levels",
        "Brain anatomy templates"
    ],
    focus=[
        "Dynamic connection routing",
        "Educational circuit animations",
        "Scientifically accurate organelles",
        "Simplified but recognizable anatomy"
    ],
    validation=[
        "Can create complete reflex arc circuit",
        "Connections update when neurons move",
        "Signal animation plays smoothly",
        "Anatomy regions are recognizable"
    ]
}
```

### Phase 3: Polish (Prompts 7-9)

```
/phase3.polish{
    intent="Complete export, animation, and UX refinements",
    scope=[
        "Animation system with timeline",
        "Advanced export (SVG, sequences, multiple resolutions)",
        "Save/load with project templates",
        "Keyboard shortcuts and help system",
        "Performance optimization"
    ],
    focus=[
        "YouTube content creation workflow",
        "Professional export quality",
        "Intuitive keyboard shortcuts",
        "Comprehensive help/onboarding"
    ],
    validation=[
        "Can create and export animations",
        "Exports work for YouTube/Shorts",
        "Projects save/load reliably",
        "All keyboard shortcuts functional",
        "Performance maintained with complexity"
    ]
}
```

## 7. Educational Content Creation Protocols

### Diagram Creation Workflow

```
/workflow.create_diagram{
    intent="Optimize workflow for creating educational neuroscience diagrams",
    input={
        topic="<neuroscience_concept>",
        target="<youtube|shorts|instagram>"
    },
    process=[
        /plan{
            concept="Define key concept to illustrate",
            elements="List required elements (neurons, graphs, labels)",
            layout="Sketch rough layout"
        },
        /build{
            neurons="Add and position neurons",
            connections="Create synapses",
            graphs="Add relevant graphs",
            labels="Add clear text annotations"
        },
        /refine{
            visual="Adjust colors, sizes for clarity",
            layout="Optimize spacing and composition",
            labels="Ensure readability at export size"
        },
        /export{
            resolution="Select appropriate resolution",
            aspect_ratio="Choose YouTube (16:9) or Shorts (9:16)",
            format="Export as PNG or animation frames"
        }
    ],
    success_criteria=[
        "Diagram created in <10 minutes",
        "Concept clearly illustrated",
        "Export ready for video editing",
        "Readable at thumbnail size"
    ]
}
```

### Animation Creation for Explanation

```
/workflow.create_animation{
    intent="Create animated explanations of neural processes",
    input={
        process="<action_potential|synaptic_transmission|circuit_activation>",
        duration="<5-30_seconds>"
    },
    process=[
        /setup{
            static="Create static diagram of process",
            keyframes="Identify key moments to animate"
        },
        /animate{
            signal="Add signal propagation animation",
            sync="Synchronize neuron and graph animations",
            timing="Adjust timing for educational pacing"
        },
        /export{
            frames="Export PNG sequence at 60 FPS",
            aspect="Choose YouTube or Shorts format",
            format="Prepare for video editing software"
        }
    ],
    success_criteria=[
        "Process clearly illustrated through motion",
        "Smooth 60 FPS playback",
        "Timing appropriate for narration",
        "Export ready for video production"
    ]
}
```

## 8. PRP Compliance Protocol

```
/protocol.prp_compliance{
    intent="Ensure all implementations strictly follow neurosketchPRP.md requirements",
    input={
        feature="<feature_being_implemented>",
        prp_section="<relevant_PRP_section>"
    },
    process=[
        /review{
            requirements="Read complete PRP section thoroughly",
            constraints="Note all technical constraints",
            success_criteria="Identify validation requirements"
        },
        /implement{
            follow="Implement exactly as specified in PRP",
            document="Note any deviations with rationale",
            validate="Check against PRP checklist continuously"
        },
        /verify{
            functionality="Test all required features",
            performance="Validate performance requirements",
            visual="Confirm visual design standards",
            usability="Test educational workflow"
        }
    ],
    output={
        implementation="PRP-compliant feature",
        checklist="PRP requirement checklist (all items checked)",
        documentation="Implementation notes and any deviations"
    },
    critical_rule="ALWAYS reference neurosketchPRP.md before and during implementation"
}
```

## 9. Quick Reference Commands

### Development Commands
```bash
# Open with live server (install Live Server VS Code extension)
# Then right-click index.html → "Open with Live Server"

# Serve locally (if using Python)
python -m http.server 8000

# Serve locally (if using Node.js)
npx serve .
```

### Module Template
```javascript
// src/modules/[category]/[feature].js

/**
 * [Feature Name]
 * 
 * Purpose: [Brief description]
 * Dependencies: [List imported modules]
 * Used by: [List modules that import this]
 */

import { BaseObject } from '../../objects/base-object.js';

export class [FeatureName] {
  constructor(options = {}) {
    // Initialize
  }
  
  // Public methods
  
  // Private methods (prefix with _)
}
```

### Testing Checklist Template
```
Feature: [Feature Name]
PRP Section: [Reference]

Functionality Tests:
[ ] Core feature works
[ ] Edge cases handled
[ ] Integrates with existing features
[ ] Properties panel updates correctly

Performance Tests:
[ ] 60 FPS maintained
[ ] Works with 50+ neurons
[ ] Smooth pan/zoom
[ ] Export completes in <5 seconds

Visual Quality Tests:
[ ] Scientifically accurate
[ ] Textbook-quality appearance
[ ] Readable at export resolutions
[ ] Appropriate for YouTube content

Usability Tests:
[ ] Intuitive interaction
[ ] Keyboard shortcuts work
[ ] Tooltips helpful
[ ] Supports content creation workflow

Persistence Tests:
[ ] Saves to .neuro JSON correctly
[ ] Loads without errors
[ ] Exports to PNG/SVG successfully
```

## 10. Key Reminders for Claude

**ALWAYS:**
1. Reference `neurosketchPRP.md` before implementing any feature
2. Follow ES6 module structure with proper imports/exports
3. Verify scientific accuracy against neuroscience textbook standards
4. Test performance with 50+ neurons for 60 FPS
5. Ensure visual quality meets textbook diagram standards
6. Optimize for educational content creation workflow
7. Maintain clean, modular code architecture
8. Document scientific rationale for visual choices
9. Test exports at YouTube/Shorts resolutions
10. Validate against PRP success criteria

**NEVER:**
1. Use global variables (use modules instead)
2. Sacrifice scientific accuracy for visual appeal
3. Implement features not specified in PRP (without discussing first)
4. Create tightly coupled modules (keep separation of concerns)
5. Ignore performance requirements (60 FPS is critical)
6. Add external dependencies without justification (CDN-only, minimal dependencies)
7. Use browser storage APIs (localStorage/sessionStorage) - not supported in artifacts
8. Forget to implement save/load serialization for new objects
9. Skip keyboard shortcut implementation
10. Compromise educational clarity for technical complexity

**PROJECT PRIORITY:**
Educational clarity and content creation workflow efficiency are the TOP priorities, followed by scientific accuracy, then visual polish, then advanced features.

---

## Usage Instructions

1. **Load at project start**: Reference this file and `neurosketchPRP.md` in every NeuroSketch development session
2. **Follow protocols**: Use the workflow protocols for consistent, high-quality implementations
3. **Maintain modularity**: Strictly follow the folder structure and ES6 module patterns
4. **Validate continuously**: Check implementations against PRP requirements throughout development
5. **Optimize performance**: Always test with heavy loads (50+ neurons) and verify 60 FPS
6. **Ensure scientific accuracy**: Reference neuroscience textbooks for visual and physiological correctness

This cognitive framework ensures NeuroSketch development remains focused, consistent, and aligned with the goal of creating an excellent tool for neuroscience education content creation.