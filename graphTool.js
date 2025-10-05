/**
 * Graph Tool for NeuroSketch
 *
 * Purpose: Create interactive scientific graphs for action potentials, synaptic potentials,
 *          and other neuroscience visualizations with editable Bezier curves.
 *
 * Dependencies: None (pure Canvas implementation)
 * Used by: app.js, canvasRenderer.js
 */

// Graph presets with scientifically accurate values
export const GRAPH_PRESETS = {
  actionPotential: {
    standard: {
      name: 'Standard Action Potential',
      xMin: 0, xMax: 5,
      yMin: -90, yMax: 50,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {
          x: 0, y: -70, type: 'anchor', label: 'Resting',
          tooltip: 'Resting Potential (-70mV): The neuron maintains this negative voltage through Na+/K+ pumps (3 Na+ out, 2 K+ in) and leak channels. The membrane is polarized due to high K+ permeability and impermeability to intracellular proteins.'
        },
        {x: 0.8, y: -65, type: 'control'},
        {
          x: 1.2, y: -55, type: 'anchor', label: 'Threshold',
          tooltip: 'Threshold (-55mV): The critical voltage where voltage-gated Na+ channels open rapidly. At this point, depolarization becomes self-sustaining as Na+ influx triggers more channels to open (positive feedback loop).'
        },
        {x: 1.35, y: 10, type: 'control'},
        {
          x: 1.5, y: 40, type: 'anchor', label: 'Peak',
          tooltip: 'Peak (+40mV): Maximum depolarization reached when Na+ channels are fully open. The membrane potential approaches the Na+ equilibrium potential (+60mV). Na+ channels then inactivate, ending the rising phase.'
        },
        {x: 1.7, y: 0, type: 'control'},
        {
          x: 2.2, y: -80, type: 'anchor', label: 'Hyperpolarization',
          tooltip: 'Hyperpolarization (-80mV): Membrane potential becomes more negative than resting due to delayed K+ channel closure. The membrane potential temporarily approaches the K+ equilibrium potential (-90mV) before returning to rest.'
        },
        {x: 3, y: -75, type: 'control'},
        {
          x: 4, y: -70, type: 'anchor', label: 'Return',
          tooltip: 'Return to Rest: K+ channels close and the Na+/K+ pump restores ion gradients. The neuron returns to resting potential and is ready to fire again. Absolute refractory period ends.'
        }
      ],
      thresholdLine: {show: true, value: -55, color: '#E74C3C'},
      restingLine: {show: true, value: -70, color: '#95A5A6'}
    },
    fast: {
      name: 'Fast Action Potential',
      xMin: 0, xMax: 3,
      yMin: -90, yMax: 50,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {
          x: 0, y: -70, type: 'anchor', label: 'Resting',
          tooltip: 'Fast Neuron Resting (-70mV): Same resting mechanisms but with higher density of Na+ channels, enabling rapid depolarization when stimulated.'
        },
        {x: 0.4, y: -60, type: 'control'},
        {
          x: 0.7, y: -55, type: 'anchor', label: 'Threshold',
          tooltip: 'Rapid Threshold Crossing: Fast-spiking interneurons (like parvalbumin+ cells) have clustered Na+ channels that open nearly simultaneously, producing extremely steep depolarization.'
        },
        {x: 0.85, y: 20, type: 'control'},
        {
          x: 1.0, y: 40, type: 'anchor', label: 'Peak',
          tooltip: 'Fast Peak: Rapid Na+ influx due to high channel density. These neurons are found in cortical inhibitory circuits requiring precise timing (e.g., basket cells).'
        },
        {x: 1.2, y: -10, type: 'control'},
        {
          x: 1.5, y: -80, type: 'anchor', label: 'Repolarization',
          tooltip: 'Rapid Repolarization: High density of Kv3 potassium channels enables fast recovery, allowing firing rates >200 Hz. Critical for temporal precision in auditory and visual processing.'
        },
        {x: 2, y: -75, type: 'control'},
        {
          x: 2.5, y: -70, type: 'anchor', label: 'Ready',
          tooltip: 'Quick Recovery: Short refractory period allows these neurons to fire at very high frequencies, essential for gamma oscillations (30-80 Hz) in cortical circuits.'
        }
      ],
      thresholdLine: {show: true, value: -55, color: '#E74C3C'},
      restingLine: {show: true, value: -70, color: '#95A5A6'}
    },
    slow: {
      name: 'Slow Action Potential',
      xMin: 0, xMax: 10,
      yMin: -90, yMax: 50,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {
          x: 0, y: -70, type: 'anchor', label: 'Resting',
          tooltip: 'Regular Spiking Resting (-70mV): Pyramidal neurons maintain resting potential with lower Na+ channel density compared to fast-spiking cells. M-current (Kv7 channels) contributes to stable resting state.'
        },
        {x: 2, y: -63, type: 'control'},
        {
          x: 3, y: -55, type: 'anchor', label: 'Threshold',
          tooltip: 'Gradual Threshold: Lower density of voltage-gated Na+ channels results in slower depolarization rate. Regular spiking pyramidal neurons show spike frequency adaptation due to Ca2+-activated K+ channels.'
        },
        {x: 3.5, y: 0, type: 'control'},
        {
          x: 4, y: 35, type: 'anchor', label: 'Peak',
          tooltip: 'Modest Peak (+35mV): Lower peak compared to fast neurons reflects reduced Na+ channel density. The broader spike allows more Ca2+ entry through voltage-gated Ca2+ channels, important for synaptic plasticity.'
        },
        {x: 4.5, y: 10, type: 'control'},
        {
          x: 6, y: -80, type: 'anchor', label: 'AHP',
          tooltip: 'Afterhyperpolarization (-80mV): Pronounced AHP due to Ca2+-activated K+ channels (SK and BK) and M-current. This limits firing frequency and produces spike frequency adaptation characteristic of pyramidal cells.'
        },
        {x: 7.5, y: -75, type: 'control'},
        {
          x: 9, y: -70, type: 'anchor', label: 'Recovery',
          tooltip: 'Slow Recovery: Gradual return to rest as Ca2+-activated K+ channels close and intracellular Ca2+ is sequestered. The prolonged AHP prevents high-frequency firing, typical of cortical layer 5 pyramidal neurons.'
        }
      ],
      thresholdLine: {show: true, value: -55, color: '#E74C3C'},
      restingLine: {show: true, value: -70, color: '#95A5A6'}
    },
    cardiac: {
      name: 'Cardiac Action Potential',
      xMin: 0, xMax: 300,
      yMin: -90, yMax: 50,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {
          x: 0, y: -90, type: 'anchor', label: 'Resting',
          tooltip: 'Cardiac Resting (-90mV): Ventricular myocytes maintain hyperpolarized resting potential via inward rectifier K+ channels (IK1). This prevents premature depolarization and ensures coordinated contraction.'
        },
        {x: 2, y: -50, type: 'control'},
        {
          x: 5, y: 30, type: 'anchor', label: 'Phase 0',
          tooltip: 'Phase 0 Overshoot (+30mV): Rapid depolarization from voltage-gated Na+ channels (Nav1.5). The fast upstroke ensures rapid cell-to-cell propagation through gap junctions, synchronizing ventricular contraction.'
        },
        {x: 15, y: 20, type: 'control'},
        {
          x: 50, y: 10, type: 'anchor', label: 'Phase 2',
          tooltip: 'Phase 2 Plateau (+10mV): Unique to cardiac cells, this sustained depolarization results from L-type Ca2+ channel influx balanced by delayed rectifier K+ efflux. Ca2+ entry triggers Ca2+-induced Ca2+ release for contraction.'
        },
        {x: 150, y: 5, type: 'control'},
        {
          x: 200, y: 0, type: 'anchor', label: 'Plateau End',
          tooltip: 'Late Plateau (0mV): Ca2+ channels inactivate while K+ efflux continues. The prolonged plateau (200-400ms) prevents tetanic contraction, ensuring the ventricle relaxes and refills between beats.'
        },
        {x: 220, y: -50, type: 'control'},
        {
          x: 250, y: -90, type: 'anchor', label: 'Phase 3',
          tooltip: 'Phase 3 Repolarization (-90mV): Delayed rectifier K+ channels (IKr, IKs) drive rapid repolarization back to resting. The long refractory period prevents arrhythmias and ensures unidirectional propagation.'
        }
      ],
      thresholdLine: {show: true, value: -70, color: '#E74C3C'},
      restingLine: {show: true, value: -90, color: '#95A5A6'}
    }
  },
  synaptic: {
    epsp: {
      name: 'EPSP (Excitatory)',
      xMin: 0, xMax: 20,
      yMin: -70, yMax: -50,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {
          x: 0, y: -70, type: 'anchor', label: 'Rest',
          tooltip: 'Pre-synaptic Rest (-70mV): Postsynaptic neuron at resting potential before glutamate release. AMPA and NMDA receptors are closed, awaiting neurotransmitter binding.'
        },
        {x: 2, y: -68, type: 'control'},
        {
          x: 5, y: -55, type: 'anchor', label: 'Peak',
          tooltip: 'EPSP Peak (-55mV): Glutamate binds AMPA receptors, opening non-selective cation channels (Na+/K+/Ca2+). Depolarization toward 0mV reversal potential brings membrane closer to action potential threshold, increasing firing probability.'
        },
        {x: 10, y: -62, type: 'control'},
        {
          x: 18, y: -70, type: 'anchor', label: 'Decay',
          tooltip: 'EPSP Decay: Glutamate is cleared by transporters and AMPA channels close. Multiple EPSPs can summate temporally (same synapse) or spatially (different synapses) to reach threshold for action potential generation.'
        }
      ],
      thresholdLine: {show: false},
      restingLine: {show: true, value: -70, color: '#95A5A6'}
    },
    ipsp: {
      name: 'IPSP (Inhibitory)',
      xMin: 0, xMax: 20,
      yMin: -80, yMax: -65,
      xLabel: 'Time (ms)',
      yLabel: 'Membrane Potential (mV)',
      curvePoints: [
        {
          x: 0, y: -70, type: 'anchor', label: 'Rest',
          tooltip: 'Pre-inhibition Rest (-70mV): Postsynaptic neuron at resting potential before GABA or glycine release. GABAA and glycine receptors are closed.'
        },
        {x: 2, y: -72, type: 'control'},
        {
          x: 5, y: -78, type: 'anchor', label: 'Trough',
          tooltip: 'IPSP Trough (-78mV): GABA binds GABAA receptors, opening Cl- channels. Cl- influx (or K+ efflux via GABAB) hyperpolarizes membrane toward Cl- reversal (-80mV), moving away from threshold and reducing excitability.'
        },
        {x: 10, y: -73, type: 'control'},
        {
          x: 18, y: -70, type: 'anchor', label: 'Recovery',
          tooltip: 'IPSP Recovery: GABA is cleared and Cl- channels close. IPSPs provide shunting inhibition, increasing the amount of excitatory input needed to trigger action potentials. Critical for gain control and preventing runaway excitation.'
        }
      ],
      thresholdLine: {show: false},
      restingLine: {show: true, value: -70, color: '#95A5A6'}
    }
  }
};

// Create default graph object
export function createDefaultGraph(x, y) {
  const preset = GRAPH_PRESETS.actionPotential.standard;

  return {
    type: 'graph',
    x: x,
    y: y,
    width: 400,
    height: 300,

    graphType: 'actionPotential',
    presetName: 'standard',

    // Axes configuration
    xMin: preset.xMin,
    xMax: preset.xMax,
    xLabel: preset.xLabel,
    yMin: preset.yMin,
    yMax: preset.yMax,
    yLabel: preset.yLabel,

    // Curve data (deep copy to allow independent editing)
    curvePoints: JSON.parse(JSON.stringify(preset.curvePoints)),

    // Reference lines
    thresholdLine: {...preset.thresholdLine},
    restingLine: {...preset.restingLine},

    // Visual settings
    showGrid: true,
    showLabels: true,
    showAxes: true,
    lineColor: '#2C3E50',
    lineWidth: 3,
    backgroundColor: 'white',

    // Annotations
    annotations: []
  };
}

// Apply preset to existing graph
export function applyPreset(graph, graphType, presetName) {
  const preset = GRAPH_PRESETS[graphType]?.[presetName];
  if (!preset) return;

  graph.graphType = graphType;
  graph.presetName = presetName;
  graph.xMin = preset.xMin;
  graph.xMax = preset.xMax;
  graph.xLabel = preset.xLabel;
  graph.yMin = preset.yMin;
  graph.yMax = preset.yMax;
  graph.yLabel = preset.yLabel;
  graph.curvePoints = JSON.parse(JSON.stringify(preset.curvePoints));
  graph.thresholdLine = {...preset.thresholdLine};
  graph.restingLine = {...preset.restingLine};
}

// Graph tool state
let isDrawingGraph = false;
let graphStartPos = null;

// Start drawing graph
export function startDrawingGraph(x, y) {
  isDrawingGraph = true;
  graphStartPos = {x, y};
  return null; // Return null during initial placement
}

// Update graph (not used for placement, but kept for consistency)
export function updateGraph(currentX, currentY, tempGraph) {
  return tempGraph;
}

// Finalize graph placement
export function finalizeGraph(x, y) {
  if (!isDrawingGraph || !graphStartPos) return null;

  const graph = createDefaultGraph(graphStartPos.x, graphStartPos.y);

  isDrawingGraph = false;
  graphStartPos = null;

  return graph;
}

// Reset graph tool state
export function resetGraphTool() {
  isDrawingGraph = false;
  graphStartPos = null;
}

// Transform graph space coordinates to canvas space
export function graphToCanvas(graphX, graphY, graph) {
  const scaleX = graph.width / (graph.xMax - graph.xMin);
  const scaleY = graph.height / (graph.yMax - graph.yMin);

  const canvasX = graph.x + (graphX - graph.xMin) * scaleX;
  const canvasY = graph.y + graph.height - (graphY - graph.yMin) * scaleY;

  return {x: canvasX, y: canvasY};
}

// Transform canvas space coordinates to graph space
export function canvasToGraph(canvasX, canvasY, graph) {
  const scaleX = graph.width / (graph.xMax - graph.xMin);
  const scaleY = graph.height / (graph.yMax - graph.yMin);

  const graphX = graph.xMin + (canvasX - graph.x) / scaleX;
  const graphY = graph.yMin + (graph.height - (canvasY - graph.y)) / scaleY;

  return {x: graphX, y: graphY};
}

// Check if point is inside graph bounds
export function isPointInGraph(x, y, graph) {
  return x >= graph.x &&
         x <= graph.x + graph.width &&
         y >= graph.y &&
         y <= graph.y + graph.height;
}

// Get control point at canvas position
export function getControlPointAt(graph, canvasX, canvasY, hitRadius = 8) {
  if (!graph.curvePoints) return -1;

  for (let i = 0; i < graph.curvePoints.length; i++) {
    const point = graph.curvePoints[i];
    const canvasPos = graphToCanvas(point.x, point.y, graph);

    const dx = canvasX - canvasPos.x;
    const dy = canvasY - canvasPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= hitRadius) {
      return i; // Return index directly
    }
  }

  return -1; // Return -1 if not found
}

// Update control point position
export function updateControlPoint(graph, pointIndex, newGraphX, newGraphY) {
  if (pointIndex < 0 || pointIndex >= graph.curvePoints.length) return;

  // Clamp to graph bounds
  const clampedX = Math.max(graph.xMin, Math.min(graph.xMax, newGraphX));
  const clampedY = Math.max(graph.yMin, Math.min(graph.yMax, newGraphY));

  graph.curvePoints[pointIndex].x = clampedX;
  graph.curvePoints[pointIndex].y = clampedY;
}
