# OLD CODE SECTIONS TO DELETE

## In handleMouseDown (starting line 341)

### Old Select Tool (lines ~396-578)
Starts: `if (this.currentTool === 'select') {`
Ends: Before `} else if (this.currentTool === 'graph')`

### Old Drawing Tools (lines ~579-650)
- graph tool: 579-590
- text tool: 590-622  
- freehand tool: 622-628
- synapse tools: 628-650
- circle: Part of old drawing logic
- rectangle: Part of old drawing logic
- line: Part of old drawing logic
- triangle: Part of old drawing logic
- hexagon: Part of old drawing logic

## In handleMouseMove (starting line 656)

### Old drag/resize/rotate (lines ~689-850)
Includes:
- Selection box tracking
- Synapse preview
- Object dragging with old delta logic
- Resize handling
- Rotate handling
- Drawing tool previews

## In handleMouseUp (starting line 904)

### Old finalization logic (lines ~943-1100)
- Selection box finalization
- Drawing completion
- State cleanup

## Boolean Flags (throughout app.js)

Properties to DELETE from app object:
- this.isDrawing
- this.isDragging
- this.isDraggingObject  
- this.isPlacingSynapse
- this.isDrawingSelectionBox
- this.isDraggingGraphControlPoint
- this.graphControlPointIndex
- this.isRotating
- this.dragHandle
- this.startX (used by old system)
- this.startY (used by old system)
- this.selectionBoxStart
- this.selectionBoxEnd

## Shared Functions to KEEP

These are used by BOTH old and new systems:
- getObjectAt()
- getObjectBounds()
- getObjectCenter()
- getResizeHandle()
- resizeObject()
- updatePropertiesPanel()
- saveState()
- render()
- screenToWorld()
- worldToScreen()
