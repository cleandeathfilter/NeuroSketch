/**
 * Myelinated Axon Tool - For drawing axons with myelin sheath and nodes of Ranvier
 *
 * Scientifically accurate myelinated axon morphology:
 * - Segmented structure: alternating myelinated internodes and nodes of Ranvier
 * - Internodes: 40-100px long, white/cream colored (myelin sheath)
 * - Nodes of Ranvier: 1-2px gaps exposing axon (unmyelinated segments)
 * - Constant diameter throughout (4-6px for myelinated axons)
 * - Enables saltatory conduction (100+ m/s vs 0.5-2 m/s unmyelinated)
 *
 * Myelin structure:
 * - Formed by oligodendrocytes (CNS) or Schwann cells (PNS)
 * - Each internode = 1 oligodendrocyte wrapping
 * - Nodes have high Na+ channel density for AP regeneration
 *
 * Source: Neuroscience textbooks (Kandel, Purves, Bear)
 * Research: Nodes of Ranvier are ~1μm wide gaps between 0.2-1mm internodes
 */

export function startDrawingMyelinatedAxon(x, y, state, config) {
  return {
    type: 'myelinatedAxon',
    x1: x,
    y1: y,
    x2: x,
    y2: y,
    axonWidth: 3, // Core axon diameter
    myelinWidth: 6, // Myelin sheath thickness (includes axon)
    internodeLength: 60, // Length of myelinated segments (px)
    nodeWidth: 2, // Width of nodes of Ranvier (px)
    myelinColor: '#F5F5DC', // Beige/cream (myelin is white matter)
    axonColor: '#A93226', // Dark red (exposed axon at nodes)
    strokeColor: '#8B7355', // Brown outline
    strokeWidth: 1,
    showNodes: true // Toggle node visibility
  };
}

export function updateMyelinatedAxon(axon, currentX, currentY) {
  axon.x2 = currentX;
  axon.y2 = currentY;
}

export function finalizeMyelinatedAxon(axon) {
  // Calculate total length
  const dx = axon.x2 - axon.x1;
  const dy = axon.y2 - axon.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Ensure minimum length for at least 2 internodes
  if (length < axon.internodeLength * 2) {
    axon.internodeLength = length / 3; // Fit 2 internodes + 1 node
  }

  // Auto-adjust internode length for even distribution
  const numInternodes = Math.floor(length / (axon.internodeLength + axon.nodeWidth));
  if (numInternodes > 0) {
    const totalNodeWidth = (numInternodes - 1) * axon.nodeWidth;
    axon.internodeLength = (length - totalNodeWidth) / numInternodes;
  }

  return axon;
}

/**
 * Render myelinated axon with segmented myelin pattern
 */
export function renderMyelinatedAxon(ctx, axon, zoom = 1) {
  ctx.save();

  const dx = axon.x2 - axon.x1;
  const dy = axon.y2 - axon.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    ctx.restore();
    return;
  }

  // Unit vector along axon
  const ux = dx / length;
  const uy = dy / length;

  // Perpendicular vector for width
  const px = -uy;
  const py = ux;

  // Calculate segment positions
  const segmentLength = axon.internodeLength + axon.nodeWidth;
  const numSegments = Math.ceil(length / segmentLength);

  let currentPos = 0;

  for (let i = 0; i < numSegments; i++) {
    // Internode (myelinated segment)
    const internodeStart = currentPos;
    const internodeEnd = Math.min(currentPos + axon.internodeLength, length);

    if (internodeEnd > internodeStart) {
      const startX = axon.x1 + ux * internodeStart;
      const startY = axon.y1 + uy * internodeStart;
      const endX = axon.x1 + ux * internodeEnd;
      const endY = axon.y1 + uy * internodeEnd;

      // Draw myelin sheath (thick white segment)
      const myelinHalfWidth = (axon.myelinWidth / 2) / zoom;

      ctx.fillStyle = axon.myelinColor;
      ctx.strokeStyle = axon.strokeColor;
      ctx.lineWidth = axon.strokeWidth / zoom;

      ctx.beginPath();
      ctx.moveTo(startX + px * myelinHalfWidth, startY + py * myelinHalfWidth);
      ctx.lineTo(endX + px * myelinHalfWidth, endY + py * myelinHalfWidth);
      ctx.lineTo(endX - px * myelinHalfWidth, endY - py * myelinHalfWidth);
      ctx.lineTo(startX - px * myelinHalfWidth, startY - py * myelinHalfWidth);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      currentPos = internodeEnd;
    }

    // Node of Ranvier (unmyelinated gap)
    if (currentPos < length && axon.showNodes) {
      const nodeStart = currentPos;
      const nodeEnd = Math.min(currentPos + axon.nodeWidth, length);

      if (nodeEnd > nodeStart) {
        const startX = axon.x1 + ux * nodeStart;
        const startY = axon.y1 + uy * nodeStart;
        const endX = axon.x1 + ux * nodeEnd;
        const endY = axon.y1 + uy * nodeEnd;

        // Draw exposed axon at node (thin red segment)
        const axonHalfWidth = (axon.axonWidth / 2) / zoom;

        ctx.fillStyle = axon.axonColor;

        ctx.beginPath();
        ctx.moveTo(startX + px * axonHalfWidth, startY + py * axonHalfWidth);
        ctx.lineTo(endX + px * axonHalfWidth, endY + py * axonHalfWidth);
        ctx.lineTo(endX - px * axonHalfWidth, endY - py * axonHalfWidth);
        ctx.lineTo(startX - px * axonHalfWidth, startY - py * axonHalfWidth);
        ctx.closePath();
        ctx.fill();

        currentPos = nodeEnd;
      }
    }
  }

  ctx.restore();
}

/**
 * Check if point is near myelinated axon
 */
export function isPointOnMyelinatedAxon(axon, px, py, tolerance = 10) {
  const dx = axon.x2 - axon.x1;
  const dy = axon.y2 - axon.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return false;

  // Project point onto axon line
  const t = Math.max(0, Math.min(1,
    ((px - axon.x1) * dx + (py - axon.y1) * dy) / (length * length)
  ));

  // Closest point on axon
  const closestX = axon.x1 + t * dx;
  const closestY = axon.y1 + t * dy;

  // Distance to closest point
  const distance = Math.sqrt(
    Math.pow(px - closestX, 2) + Math.pow(py - closestY, 2)
  );

  return distance <= (axon.myelinWidth / 2 + tolerance);
}

/**
 * Get internode and node positions for editing/snapping
 */
export function getSegmentPositions(axon) {
  const dx = axon.x2 - axon.x1;
  const dy = axon.y2 - axon.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return { internodes: [], nodes: [] };

  const ux = dx / length;
  const uy = dy / length;

  const segmentLength = axon.internodeLength + axon.nodeWidth;
  const numSegments = Math.ceil(length / segmentLength);

  const internodes = [];
  const nodes = [];
  let currentPos = 0;

  for (let i = 0; i < numSegments; i++) {
    // Internode
    const internodeStart = currentPos;
    const internodeEnd = Math.min(currentPos + axon.internodeLength, length);

    if (internodeEnd > internodeStart) {
      internodes.push({
        start: { x: axon.x1 + ux * internodeStart, y: axon.y1 + uy * internodeStart },
        end: { x: axon.x1 + ux * internodeEnd, y: axon.y1 + uy * internodeEnd }
      });
      currentPos = internodeEnd;
    }

    // Node
    if (currentPos < length) {
      const nodeStart = currentPos;
      const nodeEnd = Math.min(currentPos + axon.nodeWidth, length);

      if (nodeEnd > nodeStart) {
        nodes.push({
          start: { x: axon.x1 + ux * nodeStart, y: axon.y1 + uy * nodeStart },
          end: { x: axon.x1 + ux * nodeEnd, y: axon.y1 + uy * nodeEnd }
        });
        currentPos = nodeEnd;
      }
    }
  }

  return { internodes, nodes };
}
