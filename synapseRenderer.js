/**
 * synapseRenderer.js - Synapse Rendering Module
 *
 * Renders chemical and electrical synapses with textbook-quality visuals
 * following neuroscience diagram conventions.
 *
 * Features:
 * - Excitatory synapses: Red with triangle symbol
 * - Inhibitory synapses: Blue with bar symbol
 * - Electrical synapses: Yellow with chevron symbol
 * - Curved/straight/elbow connection routing
 * - Signal propagation animation
 * - Neurotransmitter labels
 *
 * Research: research/synapses/chemical-synapses.md
 * Color specs: research/visual-standards/color-coding.md:157-198
 */

/**
 * Main synapse rendering function
 * Called by canvasRenderer.js for each synapse object
 */
export function renderSynapse(ctx, synapse, zoom = 1, isDarkMode = false) {
  // Update connection points if neurons have moved
  // (Currently static, but hook for future dynamic updates)
  updateSynapseConnectionPoints(synapse);

  // Calculate connection path
  const path = calculateConnectionPath(
    synapse.sourcePoint,
    synapse.targetPoint,
    synapse.connectionStyle
  );

  // Draw connection line
  drawConnectionLine(ctx, path, synapse, zoom);

  // Draw terminal symbols
  if (synapse.showSymbol) {
    drawSynapseSymbol(ctx, synapse, path, zoom);
  }

  // Draw neurotransmitter label
  if (synapse.showNeurotransmitter && synapse.neurotransmitter) {
    drawNeurotransmitterLabel(ctx, synapse, path, zoom);
  }

  // Draw signal animation
  if (synapse.isAnimating && synapse.signalPosition >= 0 && synapse.signalPosition <= 1) {
    drawSignalAnimation(ctx, synapse, path, zoom);
  }
}

/**
 * Update synapse connection points if neurons have moved
 * TODO: Implement dynamic reattachment
 */
function updateSynapseConnectionPoints(synapse) {
  // Check if source/target objects still exist
  if (!synapse.sourceObj || !synapse.targetObj) return;

  // For now, attachment points are static
  // Future: Track neuron transforms and recalculate attachment points
  // This would enable "stretchy" synapses that stay connected when neurons move
}

/**
 * Calculate connection path based on style
 * Returns path object with type and points
 */
function calculateConnectionPath(start, end, style) {
  if (style === 'straight') {
    return {
      type: 'line',
      points: [start, end]
    };
  } else if (style === 'curved') {
    // Quadratic Bezier curve with perpendicular offset
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Calculate perpendicular offset for curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      // Degenerate case: start and end are same point
      return {type: 'line', points: [start, end]};
    }

    const perpX = -dy / length;
    const perpY = dx / length;

    // Control point offset 15% of line length
    const controlPoint = {
      x: midX + perpX * length * 0.15,
      y: midY + perpY * length * 0.15
    };

    return {
      type: 'quadratic',
      points: [start, controlPoint, end]
    };
  } else if (style === 'elbow') {
    // Manhattan routing (right-angle connection)
    const elbowPoint = {
      x: start.x,
      y: end.y
    };
    return {
      type: 'polyline',
      points: [start, elbowPoint, end]
    };
  }

  // Default: straight line
  return {type: 'line', points: [start, end]};
}

/**
 * Draw connection line
 */
function drawConnectionLine(ctx, path, synapse, zoom) {
  ctx.save();

  // Line style
  ctx.strokeStyle = synapse.connectionColor;
  ctx.lineWidth = (2 * synapse.strength) / zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dashed for electrical synapses
  if (synapse.lineStyle === 'dashed') {
    ctx.setLineDash([10 / zoom, 5 / zoom]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();

  if (path.type === 'line') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    ctx.lineTo(path.points[1].x, path.points[1].y);
  } else if (path.type === 'quadratic') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    ctx.quadraticCurveTo(
      path.points[1].x, path.points[1].y,  // Control point
      path.points[2].x, path.points[2].y   // End point
    );
  } else if (path.type === 'polyline') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw synapse symbol at target (postsynaptic)
 */
function drawSynapseSymbol(ctx, synapse, path, zoom) {
  const target = path.points[path.points.length - 1];

  // Calculate direction vector at target
  let direction;
  if (path.type === 'quadratic') {
    // Direction from control point to target
    const control = path.points[1];
    direction = {
      x: target.x - control.x,
      y: target.y - control.y
    };
  } else {
    // Direction from penultimate point to target
    const previous = path.points[path.points.length - 2];
    direction = {
      x: target.x - previous.x,
      y: target.y - previous.y
    };
  }

  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (length === 0) return; // Degenerate case

  direction.x /= length;
  direction.y /= length;

  ctx.save();
  ctx.fillStyle = synapse.terminalColor;
  ctx.strokeStyle = synapse.terminalColor;
  ctx.lineWidth = 2 / zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (synapse.synapseType === 'excitatory') {
    // Triangle pointing to target
    drawExcitatorySymbol(ctx, target, direction, zoom);
  } else if (synapse.synapseType === 'inhibitory') {
    // Bar perpendicular to connection
    drawInhibitorySymbol(ctx, target, direction, zoom);
  } else if (synapse.synapseType === 'electrical') {
    // Bidirectional chevrons
    drawElectricalSymbol(ctx, target, direction, zoom);
  }

  ctx.restore();
}

/**
 * Draw excitatory triangle symbol (▶)
 * Source: research/visual-standards/color-coding.md:164
 */
function drawExcitatorySymbol(ctx, position, direction, zoom) {
  const size = 12 / zoom;
  const perpX = -direction.y;
  const perpY = direction.x;

  ctx.beginPath();
  // Tip (at target point)
  ctx.moveTo(position.x, position.y);
  // Base left
  ctx.lineTo(
    position.x - direction.x * size + perpX * size * 0.5,
    position.y - direction.y * size + perpY * size * 0.5
  );
  // Base right
  ctx.lineTo(
    position.x - direction.x * size - perpX * size * 0.5,
    position.y - direction.y * size - perpY * size * 0.5
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw inhibitory bar symbol (⊣)
 * Source: research/visual-standards/color-coding.md:174
 */
function drawInhibitorySymbol(ctx, position, direction, zoom) {
  const size = 12 / zoom;
  const perpX = -direction.y;
  const perpY = direction.x;

  // Bar perpendicular to connection
  ctx.beginPath();
  ctx.moveTo(
    position.x + perpX * size * 0.6,
    position.y + perpY * size * 0.6
  );
  ctx.lineTo(
    position.x - perpX * size * 0.6,
    position.y - perpY * size * 0.6
  );
  ctx.stroke();

  // Small circle at connection point
  ctx.beginPath();
  ctx.arc(position.x, position.y, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw electrical gap junction symbol (<>)
 * Source: research/visual-standards/color-coding.md:183
 */
function drawElectricalSymbol(ctx, position, direction, zoom) {
  const size = 10 / zoom;
  const perpX = -direction.y;
  const perpY = direction.x;

  // Left chevron (<)
  ctx.beginPath();
  ctx.moveTo(
    position.x - direction.x * size * 0.5,
    position.y - direction.y * size * 0.5
  );
  ctx.lineTo(
    position.x - direction.x * size * 0.5 + perpX * size * 0.5,
    position.y - direction.y * size * 0.5 + perpY * size * 0.5
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    position.x - direction.x * size * 0.5,
    position.y - direction.y * size * 0.5
  );
  ctx.lineTo(
    position.x - direction.x * size * 0.5 - perpX * size * 0.5,
    position.y - direction.y * size * 0.5 - perpY * size * 0.5
  );
  ctx.stroke();

  // Right chevron (>)
  ctx.beginPath();
  ctx.moveTo(
    position.x + direction.x * size * 0.5,
    position.y + direction.y * size * 0.5
  );
  ctx.lineTo(
    position.x + direction.x * size * 0.5 + perpX * size * 0.5,
    position.y + direction.y * size * 0.5 + perpY * size * 0.5
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(
    position.x + direction.x * size * 0.5,
    position.y + direction.y * size * 0.5
  );
  ctx.lineTo(
    position.x + direction.x * size * 0.5 - perpX * size * 0.5,
    position.y + direction.y * size * 0.5 - perpY * size * 0.5
  );
  ctx.stroke();
}

/**
 * Draw neurotransmitter label at midpoint
 */
function drawNeurotransmitterLabel(ctx, synapse, path, zoom) {
  const midPoint = calculatePathMidpoint(path);

  ctx.save();
  ctx.font = `${12 / zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = synapse.neurotransmitter;
  const metrics = ctx.measureText(text);
  const padding = 4 / zoom;

  // Background for readability
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(
    midPoint.x - metrics.width / 2 - padding,
    midPoint.y - 6 / zoom - padding,
    metrics.width + padding * 2,
    12 / zoom + padding * 2
  );

  // Border
  ctx.strokeStyle = synapse.connectionColor;
  ctx.lineWidth = 1 / zoom;
  ctx.strokeRect(
    midPoint.x - metrics.width / 2 - padding,
    midPoint.y - 6 / zoom - padding,
    metrics.width + padding * 2,
    12 / zoom + padding * 2
  );

  // Text
  ctx.fillStyle = synapse.connectionColor;
  ctx.fillText(text, midPoint.x, midPoint.y);

  ctx.restore();
}

/**
 * Calculate midpoint on path (for label placement)
 */
function calculatePathMidpoint(path) {
  if (path.type === 'line') {
    return {
      x: (path.points[0].x + path.points[1].x) / 2,
      y: (path.points[0].y + path.points[1].y) / 2
    };
  } else if (path.type === 'quadratic') {
    // Bezier curve at t=0.5
    const t = 0.5;
    const p0 = path.points[0];
    const p1 = path.points[1];
    const p2 = path.points[2];
    return {
      x: (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x,
      y: (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y
    };
  } else if (path.type === 'polyline') {
    // Polyline: use midpoint of middle segment
    const mid = Math.floor(path.points.length / 2);
    return path.points[mid];
  }

  return path.points[0];
}

/**
 * Draw signal animation (traveling wave)
 */
function drawSignalAnimation(ctx, synapse, path, zoom) {
  // Calculate position on path at t = signalPosition
  const position = calculatePointOnPath(path, synapse.signalPosition);

  ctx.save();
  ctx.fillStyle = synapse.connectionColor;
  ctx.strokeStyle = synapse.connectionColor;

  // Pulsing circle (signal)
  const baseRadius = 6 / zoom;
  const pulsePhase = (Date.now() * 0.01) % (Math.PI * 2);
  const pulseRadius = baseRadius * (1 + 0.3 * Math.sin(pulsePhase));

  // Main signal circle
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(position.x, position.y, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(position.x, position.y, pulseRadius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Trailing glow (fade behind signal)
  if (synapse.signalPosition > 0.1) {
    const trailPos = calculatePointOnPath(path, synapse.signalPosition - 0.05);
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(trailPos.x, trailPos.y, pulseRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Calculate point on path at parameter t (0-1)
 */
function calculatePointOnPath(path, t) {
  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));

  if (path.type === 'line') {
    const p0 = path.points[0];
    const p1 = path.points[1];
    return {
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y)
    };
  } else if (path.type === 'quadratic') {
    // Quadratic Bezier curve formula
    const p0 = path.points[0];
    const p1 = path.points[1];
    const p2 = path.points[2];
    return {
      x: (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x,
      y: (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y
    };
  } else if (path.type === 'polyline') {
    // Interpolate across polyline segments
    const totalLength = calculatePolylineLength(path.points);
    const targetLength = totalLength * t;

    let accumulatedLength = 0;
    for (let i = 0; i < path.points.length - 1; i++) {
      const p0 = path.points[i];
      const p1 = path.points[i + 1];
      const segmentLength = Math.sqrt((p1.x-p0.x)**2 + (p1.y-p0.y)**2);

      if (accumulatedLength + segmentLength >= targetLength) {
        const localT = (targetLength - accumulatedLength) / segmentLength;
        return {
          x: p0.x + localT * (p1.x - p0.x),
          y: p0.y + localT * (p1.y - p0.y)
        };
      }
      accumulatedLength += segmentLength;
    }
    return path.points[path.points.length - 1];
  }

  return path.points[0];
}

/**
 * Calculate total length of polyline
 */
function calculatePolylineLength(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/**
 * Render synapse preview during placement (dashed line from source to mouse)
 * Called during synapse tool source_selected mode
 */
export function renderSynapsePreview(ctx, sourcePoint, targetPoint, synapseType, zoom) {
  ctx.save();

  const visualProps = {
    excitatory: {color: '#E74C3C'},
    inhibitory: {color: '#3498DB'},
    electrical: {color: '#F1C40F'}
  }[synapseType] || {color: '#E74C3C'};

  // Dashed preview line
  ctx.strokeStyle = visualProps.color;
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([8 / zoom, 4 / zoom]);
  ctx.globalAlpha = 0.6;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(sourcePoint.x, sourcePoint.y);
  ctx.lineTo(targetPoint.x, targetPoint.y);
  ctx.stroke();

  // Source indicator (filled circle)
  ctx.setLineDash([]);
  ctx.fillStyle = visualProps.color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(sourcePoint.x, sourcePoint.y, 6 / zoom, 0, Math.PI * 2);
  ctx.fill();

  // Source glow
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(sourcePoint.x, sourcePoint.y, 10 / zoom, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Render hover highlight on synapse (for selection feedback)
 */
export function renderSynapseHighlight(ctx, synapse, zoom) {
  const path = calculateConnectionPath(
    synapse.sourcePoint,
    synapse.targetPoint,
    synapse.connectionStyle
  );

  ctx.save();
  ctx.strokeStyle = '#F39C12';  // Orange highlight
  ctx.lineWidth = (4 * synapse.strength) / zoom;
  ctx.globalAlpha = 0.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);

  ctx.beginPath();
  if (path.type === 'line') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    ctx.lineTo(path.points[1].x, path.points[1].y);
  } else if (path.type === 'quadratic') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    ctx.quadraticCurveTo(
      path.points[1].x, path.points[1].y,
      path.points[2].x, path.points[2].y
    );
  } else if (path.type === 'polyline') {
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
  }
  ctx.stroke();

  ctx.restore();
}
