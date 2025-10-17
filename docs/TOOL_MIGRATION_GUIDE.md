# Tool Migration Guide - Architecture Refactor Phase 2-4

**Quick Reference for Migrating Old Tools to New Architecture**

## NEW vs OLD Architecture

**OLD** (❌): Tools as functions, state in app.js, manual cleanup
**NEW** (✅): Tools as classes, encapsulated state, auto-cleanup

## Example: Triangle Tool

**OLD** (`triangleTool.js`):
```javascript
export function startDrawingTriangle(x, y) { ... }
export function updateTriangle(x, y) { ... }
export function finalizeTriangle() { ... }
```

**NEW** (`src/tools/TriangleTool.js`):
```javascript
export class TriangleTool extends Tool {
    onMouseDown(x, y) { return {object, stateTransition} }
    onMouseMove(x, y) { ... }
    onMouseUp(x, y) { return {object, stateTransition} }
    renderPreview(ctx) { ... }
    onDeactivate() { this.reset() } // AUTO-CLEANUP!
}
```

## Key Benefits
- State encapsulated in tool
- Auto-cleanup on switch
- Zero boolean flags
- 1 hour per tool (vs 4+ hours)
