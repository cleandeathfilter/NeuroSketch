/**
 * synapseTool.js - Synaptic Connection Tool
 *
 * Creates connections between neurons with scientifically accurate
 * excitatory, inhibitory, and electrical synapse representations.
 *
 * Interaction Pattern: Two-click placement (source → target)
 * 1. Click source neuron (presynaptic)
 * 2. Click target neuron (postsynaptic)
 * 3. Synapse created with automatic attachment point calculation
 *
 * Scientific Accuracy:
 * - Excitatory synapses: Glutamate, red (#E74C3C), triangle symbol
 * - Inhibitory synapses: GABA, blue (#3498DB), bar symbol
 * - Electrical synapses: Gap junctions, yellow (#F1C40F), bidirectional
 *
 * Research: research/synapses/chemical-synapses.md
 * Color specs: research/visual-standards/color-coding.md:157-198
 */

// State machine for two-click interaction
let synapseState = {
  mode: 'idle',           // 'idle' | 'source_selected' | 'placing'
  synapseType: null,      // 'excitatory' | 'inhibitory' | 'electrical'
  sourceObj: null,        // Reference to source neuron object
  sourcePoint: null,      // {x, y} attachment point on source
  tempTargetPoint: null   // {x, y} temporary mouse position
};

/**
 * Initialize synapse tool with specific type
 * Called when user clicks synapse toolbar button
 */
export function initSynapseTool(type) {
  synapseState = {
    mode: 'idle',
    synapseType: type,  // 'excitatory', 'inhibitory', 'electrical'
    sourceObj: null,
    sourcePoint: null,
    tempTargetPoint: null
  };
  return synapseState;
}

/**
 * Handle click for synapse placement
 * Returns synapse object if completed, null otherwise
 */
export function handleSynapseClick(clickedObj, clickPoint, allObjects) {
  if (synapseState.mode === 'idle' || synapseState.mode === 'source_selected') {
    // First click or selecting source
    if (!clickedObj || !isValidNeuronComponent(clickedObj)) {
      // Clicked empty space, reset if already selecting
      if (synapseState.mode === 'source_selected') {
        resetSynapseTool();
      }
      return null;
    }

    if (synapseState.mode === 'idle') {
      // First click - select source neuron
      synapseState.sourceObj = clickedObj;
      synapseState.sourcePoint = calculateAttachmentPoint(clickedObj, clickPoint, 'source');
      synapseState.mode = 'source_selected';
      return null; // No synapse created yet
    } else {
      // Second click - select target neuron
      if (clickedObj === synapseState.sourceObj) {
        // Can't connect to self, reset
        resetSynapseTool();
        return null;
      }

      const targetPoint = calculateAttachmentPoint(clickedObj, clickPoint, 'target');
      const synapse = createSynapse(
        synapseState.sourceObj,
        synapseState.sourcePoint,
        clickedObj,
        targetPoint,
        synapseState.synapseType
      );

      // Reset state but keep tool active
      synapseState.sourceObj = null;
      synapseState.sourcePoint = null;
      synapseState.mode = 'idle';

      return synapse; // Return new synapse object
    }
  }

  return null;
}

/**
 * Update synapse preview during mouse movement
 * Called on mousemove when synapse tool is active
 */
export function updateSynapsePreview(mouseX, mouseY) {
  if (synapseState.mode === 'source_selected') {
    synapseState.tempTargetPoint = {x: mouseX, y: mouseY};
  }
}

/**
 * Get current preview data for rendering
 * Returns null if no preview to show
 */
export function getSynapsePreview() {
  if (synapseState.mode === 'source_selected' && synapseState.sourcePoint && synapseState.tempTargetPoint) {
    return {
      sourcePoint: synapseState.sourcePoint,
      targetPoint: synapseState.tempTargetPoint,
      synapseType: synapseState.synapseType
    };
  }
  return null;
}

/**
 * Create synapse object
 */
function createSynapse(sourceObj, sourcePoint, targetObj, targetPoint, synapseType) {
  const visualProps = getSynapseVisualProperties(synapseType);

  return {
    type: 'synapse',
    id: 'syn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),

    // Connection references
    sourceObj: sourceObj,    // Direct object reference
    targetObj: targetObj,

    // Attachment points (world coordinates)
    sourcePoint: {x: sourcePoint.x, y: sourcePoint.y},
    targetPoint: {x: targetPoint.x, y: targetPoint.y},

    // Synapse properties
    synapseType: synapseType,
    strength: 1.0,           // 0.1-2.0, affects visual thickness
    neurotransmitter: getSynapseNeurotransmitter(synapseType),

    // Visual properties (from research specs)
    terminalColor: visualProps.terminalColor,
    vesicleColor: visualProps.vesicleColor,
    connectionColor: visualProps.connectionColor,
    symbol: visualProps.symbol,
    lineStyle: visualProps.lineStyle,

    // User-controllable visual settings
    connectionStyle: 'curved',  // 'straight', 'curved', 'elbow'
    showSymbol: true,
    showNeurotransmitter: false,

    // Animation
    signalPosition: 0,       // 0-1, position along path
    isAnimating: false
  };
}

/**
 * Check if object can be synapse endpoint
 */
function isValidNeuronComponent(obj) {
  const validTypes = [
    'circle',           // Soma
    'bipolarSoma',      // Bipolar soma
    'taperedLine',      // Dendrite
    'apicalDendrite',   // Apical dendrite (pyramidal)
    'myelinatedAxon',   // Myelinated axon
    'unmyelinatedAxon', // Unmyelinated axon
    'axonHillock'       // Axon initial segment
  ];
  return obj && validTypes.includes(obj.type);
}

/**
 * Calculate best attachment point on neuron
 * role: 'source' (presynaptic) or 'target' (postsynaptic)
 */
function calculateAttachmentPoint(obj, clickPoint, role) {
  if (role === 'source') {
    // Presynaptic: prioritize axon terminal (end of axon)
    if (obj.type === 'myelinatedAxon' || obj.type === 'unmyelinatedAxon') {
      return {x: obj.x2, y: obj.y2};  // Terminal end
    } else if (obj.type === 'axonHillock') {
      // Attach at base of hillock (where it connects to axon)
      return {x: obj.x2, y: obj.y2};
    }
  }

  if (role === 'target') {
    // Postsynaptic: prioritize dendrites, then soma
    if (obj.type === 'taperedLine' || obj.type === 'apicalDendrite') {
      // Project click onto dendrite line
      return projectPointOntoLine(clickPoint, obj);
    } else if (obj.type === 'circle') {
      // Closest point on soma perimeter
      return closestPointOnCirclePerimeter(clickPoint, obj);
    } else if (obj.type === 'bipolarSoma') {
      // Bipolar soma: attach at top or bottom pole
      const topDist = Math.hypot(clickPoint.x - obj.x, clickPoint.y - (obj.y - obj.height / 2));
      const bottomDist = Math.hypot(clickPoint.x - obj.x, clickPoint.y - (obj.y + obj.height / 2));
      if (topDist < bottomDist) {
        return {x: obj.x, y: obj.y - obj.height / 2};
      } else {
        return {x: obj.x, y: obj.y + obj.height / 2};
      }
    }
  }

  // Default: use click point (for generic attachments)
  if (obj.type === 'circle') {
    return closestPointOnCirclePerimeter(clickPoint, obj);
  } else if (obj.type === 'taperedLine' || obj.type === 'apicalDendrite') {
    return projectPointOntoLine(clickPoint, obj);
  }

  return {x: clickPoint.x, y: clickPoint.y};
}

/**
 * Project point onto line segment (for dendrite attachment)
 */
function projectPointOntoLine(point, lineObj) {
  const dx = lineObj.x2 - lineObj.x1;
  const dy = lineObj.y2 - lineObj.y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return {x: lineObj.x1, y: lineObj.y1};

  // Calculate parameter t along line
  let t = ((point.x - lineObj.x1) * dx + (point.y - lineObj.y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));  // Clamp to [0, 1]

  return {
    x: lineObj.x1 + t * dx,
    y: lineObj.y1 + t * dy
  };
}

/**
 * Get closest point on circle perimeter (for soma attachment)
 */
function closestPointOnCirclePerimeter(point, circleObj) {
  const dx = point.x - circleObj.x;
  const dy = point.y - circleObj.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    // Point at center, return arbitrary point on perimeter
    return {x: circleObj.x + circleObj.radius, y: circleObj.y};
  }

  // Normalize and scale to radius
  return {
    x: circleObj.x + (dx / distance) * circleObj.radius,
    y: circleObj.y + (dy / distance) * circleObj.radius
  };
}

/**
 * Get synapse visual properties from research specs
 * Source: research/visual-standards/color-coding.md:157-198
 */
function getSynapseVisualProperties(type) {
  const specs = {
    excitatory: {
      terminalColor: '#E74C3C',    // Alizarin crimson (line 162)
      vesicleColor: '#EC7063',     // Lighter red (line 163)
      connectionColor: '#E74C3C',  // Red solid line (line 165)
      symbol: '▶',                 // Triangle (line 164)
      lineStyle: 'solid'
    },
    inhibitory: {
      terminalColor: '#3498DB',    // Dodger blue (line 172)
      vesicleColor: '#5DADE2',     // Lighter blue (line 173)
      connectionColor: '#3498DB',  // Blue solid line (line 175)
      symbol: '⊣',                 // Bar/circle (line 174)
      lineStyle: 'solid'
    },
    electrical: {
      terminalColor: '#F1C40F',    // Sun yellow/gold (line 182)
      vesicleColor: null,          // No vesicles (gap junction)
      connectionColor: '#F1C40F',  // Yellow (line 184)
      symbol: '<>',                // Chevrons (line 183)
      lineStyle: 'dashed'          // Dashed line (line 184)
    }
  };
  return specs[type] || specs.excitatory;
}

/**
 * Get default neurotransmitter for synapse type
 */
function getSynapseNeurotransmitter(type) {
  const mapping = {
    excitatory: 'Glutamate',
    inhibitory: 'GABA',
    electrical: null  // No neurotransmitter (electrical coupling)
  };
  return mapping[type];
}

/**
 * Reset synapse tool state
 */
export function resetSynapseTool() {
  synapseState = {
    mode: 'idle',
    synapseType: synapseState.synapseType,  // Keep type for continuous use
    sourceObj: null,
    sourcePoint: null,
    tempTargetPoint: null
  };
}

/**
 * Check if synapse tool is active
 */
export function isSynapseToolActive() {
  return synapseState.synapseType !== null;
}

/**
 * Check if waiting for target selection (for cursor visual feedback)
 */
export function isAwaitingTarget() {
  return synapseState.mode === 'source_selected';
}

/**
 * Get current synapse type
 */
export function getCurrentSynapseType() {
  return synapseState.synapseType;
}

/**
 * Check if point is on synapse connection (for selection)
 */
export function isPointOnSynapse(synapse, px, py, tolerance = 10) {
  // Update attachment points if neurons moved
  updateSynapseAttachmentPoints(synapse);

  const start = synapse.sourcePoint;
  const end = synapse.targetPoint;

  if (synapse.connectionStyle === 'straight') {
    return isPointNearLine(px, py, start, end, tolerance);
  } else if (synapse.connectionStyle === 'curved') {
    return isPointNearQuadraticCurve(px, py, start, end, tolerance);
  } else if (synapse.connectionStyle === 'elbow') {
    return isPointNearElbow(px, py, start, end, tolerance);
  }

  return false;
}

/**
 * Update synapse attachment points if neurons moved
 */
export function updateSynapseAttachmentPoints(synapse) {
  // Check if source/target objects still exist
  if (!synapse.sourceObj || !synapse.targetObj) return;

  // For now, attachment points are static
  // TODO: Implement dynamic reattachment if neurons move
  // This would require tracking neuron transforms and recalculating attachment points
}

/**
 * Check if point is near straight line
 */
function isPointNearLine(px, py, start, end, tolerance) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return false;

  // Project point onto line
  let t = ((px - start.x) * dx + (py - start.y) * dy) / (length * length);
  t = Math.max(0, Math.min(1, t));

  // Closest point on line
  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;

  // Distance to closest point
  const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

  return distance <= tolerance;
}

/**
 * Check if point is near quadratic Bezier curve
 */
function isPointNearQuadraticCurve(px, py, start, end, tolerance) {
  // Calculate control point (same as renderer)
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return isPointNearLine(px, py, start, end, tolerance);

  const perpX = -dy / length;
  const perpY = dx / length;

  const controlX = midX + perpX * length * 0.15;
  const controlY = midY + perpY * length * 0.15;

  // Sample curve at multiple points
  for (let t = 0; t <= 1; t += 0.05) {
    const x = (1-t)*(1-t)*start.x + 2*(1-t)*t*controlX + t*t*end.x;
    const y = (1-t)*(1-t)*start.y + 2*(1-t)*t*controlY + t*t*end.y;

    const distance = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
    if (distance <= tolerance) return true;
  }

  return false;
}

/**
 * Check if point is near elbow connection
 */
function isPointNearElbow(px, py, start, end, tolerance) {
  const elbowX = start.x;
  const elbowY = end.y;

  // Check first segment (start to elbow)
  if (isPointNearLine(px, py, start, {x: elbowX, y: elbowY}, tolerance)) return true;

  // Check second segment (elbow to end)
  if (isPointNearLine(px, py, {x: elbowX, y: elbowY}, end, tolerance)) return true;

  return false;
}
