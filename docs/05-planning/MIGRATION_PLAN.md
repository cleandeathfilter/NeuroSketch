# COMPLETE ARCHITECTURE MIGRATION PLAN

## Phase 1: Identify All Old Code Sections (RESEARCH)

### A. Old Tool Handlers in handleMouseDown
- Line 396-578: Old select tool logic
- Line 579-650: Old graph, text, freehand, circle, rectangle, line, triangle, hexagon tools

### B. Old Tool Handlers in handleMouseMove  
- Line 689-850: Old drag/resize/rotate logic
- Line 697-705: Old synapse preview

### C. Old Tool Handlers in handleMouseUp
- Line 943-1020: Old selection box finalization
- Line 1021-1100: Old resize/rotate cleanup

### D. Boolean Flags to Delete
- this.isDrawing
- this.isDragging  
- this.isPlacingSynapse
- this.isDrawingSelectionBox
- this.isDraggingGraphControlPoint
- this.isRotating
- this.dragHandle (used by old system)

### E. Helper Functions Used by Old System
- Need to identify which are ONLY used by old code vs shared

## Phase 2: Verify ToolManager Has ALL Tools

Check that EVERY tool in old code has a Tool class:
- [ ] SelectTool - YES (just completed)
- [ ] CircleTool - YES
- [ ] RectangleTool - YES
- [ ] LineTool - YES
- [ ] TriangleTool - YES
- [ ] HexagonTool - YES
- [ ] FreehandTool - YES (need to verify)
- [ ] TextTool - YES (need to verify)
- [ ] GraphTool - YES
- [ ] All neuronal tools - YES
- [ ] All synapse tools - YES

## Phase 3: Safe Deletion Strategy

1. Comment out old code first (don't delete)
2. Test everything works
3. Then permanently delete
4. Commit changes

## Phase 4: Boolean Flag Cleanup

Search for all uses of boolean flags and replace with state machine checks.

## Phase 5: Final Verification

Test EVERY tool:
- Creation
- Selection  
- Movement
- Resize
- Rotation
- Delete
- Copy/Paste
- Undo/Redo
