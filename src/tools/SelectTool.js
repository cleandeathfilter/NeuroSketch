/**
 * SelectTool - COMPLETE Selection and Manipulation Tool
 * Handles: selection, drag, resize, rotate, multi-select, double-click editing
 * 
 * This is the FULL implementation with ALL features from the old system.
 */

import { Tool } from './base/Tool.js';
import { InteractionState } from '../core/StateMachine.js';

export class SelectTool extends Tool {
    constructor() {
        super('select');
        this.state = {
            // Selection box state
            selectionBoxStart: null,
            selectionBoxEnd: null,
            
            // Drag state
            dragStartWorld: null,
            dragHandle: null,  // Which resize handle is being dragged
            objectInitialStates: [],  // Store initial object state before drag
            
            // Rotation state
            isRotating: false,
            rotationStartAngle: null,
            initialRotation: null,
            rotationStartDistance: null,
            
            // Graph control point state
            isDraggingGraphControlPoint: false,
            graphControlPointIndex: null,
            
            // Double-click tracking
            lastClickTime: null,
            lastClickedObject: null
        };
    }

    onActivate() {
        super.onActivate();
        this.reset();
    }

    onMouseDown(worldX, worldY, clickedObj, app) {
        const screenPos = app.worldToScreen(worldX, worldY);
        
        // Use precise hit detection if Ctrl is pressed
        const preciseMode = app.ctrlPressed;
        if (preciseMode && !clickedObj) {
            // Re-check with precise mode
            clickedObj = app.getObjectAt(worldX, worldY, true);
        }
        
        // === TEXT OBJECT SPECIAL HANDLING ===
        if (app.selectedObjects.length === 1 && app.selectedObjects[0].type === 'text') {
            const textObj = app.selectedObjects[0];
            const handleSize = 15 / app.zoom;
            
            const bounds = {
                left: textObj.x,
                right: textObj.x + textObj.width,
                top: textObj.y,
                bottom: textObj.y + textObj.height
            };
            
            const padding = handleSize;
            const clickedInTextboxArea = worldX >= bounds.left - padding &&
                                         worldX <= bounds.right + padding &&
                                         worldY >= bounds.top - padding &&
                                         worldY <= bounds.bottom + padding;
            
            if (!clickedInTextboxArea) {
                // Clicked outside - deselect
                app.selectedObjects = [];
                app.updatePropertiesPanel();
            } else {
                // Check for resize handles
                const handles = {
                    nw: {x: bounds.left, y: bounds.top},
                    ne: {x: bounds.right, y: bounds.top},
                    sw: {x: bounds.left, y: bounds.bottom},
                    se: {x: bounds.right, y: bounds.bottom},
                    n: {x: (bounds.left + bounds.right) / 2, y: bounds.top},
                    s: {x: (bounds.left + bounds.right) / 2, y: bounds.bottom},
                    w: {x: bounds.left, y: (bounds.top + bounds.bottom) / 2},
                    e: {x: bounds.right, y: (bounds.top + bounds.bottom) / 2}
                };
                
                for (let [key, pos] of Object.entries(handles)) {
                    const dx = Math.abs(worldX - pos.x);
                    const dy = Math.abs(worldY - pos.y);
                    if (dx < handleSize && dy < handleSize) {
                        // Resize handle clicked
                        this.state.dragHandle = key;
                        this.state.dragStartWorld = {x: worldX, y: worldY};
                        return { stateTransition: InteractionState.DRAGGING_SELECTION };
                    }
                }
                
                // Check for double-click to edit
                const now = Date.now();
                const timeSinceLastClick = this.state.lastClickTime ? (now - this.state.lastClickTime) : 999;
                const isDoubleClick = timeSinceLastClick < 300 && this.state.lastClickedObject === textObj;
                
                if (isDoubleClick) {
                    app.textEditor.startEditing(textObj);
                    app.updatePropertiesPanel();
                    this.state.lastClickTime = null;
                    return { stateTransition: InteractionState.IDLE };
                }
                
                // Single click - set up for move
                this.state.lastClickTime = now;
                this.state.lastClickedObject = textObj;
                this.state.dragStartWorld = {x: worldX, y: worldY};
                this._storeInitialPositions(app);
                return { stateTransition: InteractionState.DRAGGING_OBJECT };
            }
        }
        
        // === GRAPH CONTROL POINT DRAGGING ===
        if (app.selectedObjects.length === 1 && app.selectedObjects[0].type === 'graph') {
            const graph = app.selectedObjects[0];
            const controlPointIndex = this._getGraphControlPointAt(graph, worldX, worldY, 10 / app.zoom);
            if (controlPointIndex !== -1) {
                this.state.isDraggingGraphControlPoint = true;
                this.state.graphControlPointIndex = controlPointIndex;
                this.state.dragStartWorld = {x: worldX, y: worldY};
                return { stateTransition: InteractionState.DRAGGING_GRAPH_POINT };
            }
        }
        
        // === ROTATION HANDLE ===
        if (app.selectedObjects.length === 1 &&
            app.selectedObjects[0].type !== 'taperedLine' &&
            app.selectedObjects[0].type !== 'curvedPath') {
            
            if (this._isClickingRotateHandle(app, screenPos.x, screenPos.y)) {
                const obj = app.selectedObjects[0];
                this.state.isRotating = true;
                const center = app.getObjectCenter(obj);
                this.state.rotationStartAngle = Math.atan2(worldY - center.y, worldX - center.x);
                this.state.initialRotation = obj.rotation || 0;
                
                const dx = worldX - center.x;
                const dy = worldY - center.y;
                this.state.rotationStartDistance = Math.sqrt(dx * dx + dy * dy);
                this.state.dragStartWorld = {x: worldX, y: worldY};
                
                return { stateTransition: InteractionState.ROTATING };
            }
        }
        
        // === RESIZE HANDLES (non-text objects) ===
        if (app.selectedObjects.length === 1 && app.selectedObjects[0].type !== 'text') {
            const handle = app.getResizeHandle(screenPos.x, screenPos.y);
            if (handle) {
                console.log(`🔧 Resize handle clicked: ${handle}`);
                this.state.dragHandle = handle;
                this.state.dragStartWorld = {x: worldX, y: worldY};
                return { stateTransition: InteractionState.DRAGGING_SELECTION };
            }
        }
        
        // === OBJECT SELECTION ===
        if (clickedObj) {
            const now = Date.now();
            const isDoubleClick = this.state.lastClickTime && 
                                 (now - this.state.lastClickTime) < 300 && 
                                 this.state.lastClickedObject === clickedObj;
            
            // Handle double-click on text to edit
            if (clickedObj.type === 'text' && isDoubleClick) {
                app.textEditor.startEditing(clickedObj);
                app.updatePropertiesPanel();
                this.state.lastClickTime = null;
                return { stateTransition: InteractionState.IDLE };
            }
            
            this.state.lastClickTime = now;
            this.state.lastClickedObject = clickedObj;
            
            // Store click position and all objects at this location for Tab cycling
            app.lastClickWorldPos = {x: worldX, y: worldY};
            app.objectsAtLastClick = app.getAllObjectsAt(worldX, worldY, preciseMode);
            app.tabCycleIndex = app.objectsAtLastClick.indexOf(clickedObj);
            
            // Add to selection
            if (!app.selectedObjects.includes(clickedObj)) {
                if (!app.shiftPressed) {
                    app.selectedObjects = [];
                }
                app.selectedObjects.push(clickedObj);
            }
            
            // Set up drag - store initial positions
            this.state.dragStartWorld = {x: worldX, y: worldY};
            this._storeInitialPositions(app);
            app.updatePropertiesPanel();
            
            return { stateTransition: InteractionState.DRAGGING_OBJECT };
        } else {
            // === EMPTY SPACE - SELECTION BOX ===
            // Check for protected textbox (just finished editing)
            const hasProtectedTextbox = app.selectedObjects.length === 1 &&
                                       app.selectedObjects[0].type === 'text' &&
                                       app.selectedObjects[0]._justFinishedEditing;
            
            if (!hasProtectedTextbox) {
                if (!app.shiftPressed) {
                    app.selectedObjects = [];
                }
                this.state.selectionBoxStart = {x: worldX, y: worldY};
                this.state.selectionBoxEnd = {x: worldX, y: worldY};
                this.state.lastClickTime = null;
                app.updatePropertiesPanel();
                
                return { stateTransition: InteractionState.DRAWING_SELECTION_BOX };
            }
        }
        
        return { stateTransition: InteractionState.IDLE };
    }

    onMouseMove(worldX, worldY, clickedObj, app) {
        const state = app.stateMachine.state;
        
        // === SELECTION BOX ===
        if (state === InteractionState.DRAWING_SELECTION_BOX) {
            this.state.selectionBoxEnd = {x: worldX, y: worldY};
            return { preview: true };
        }
        
        // === DRAGGING OBJECT ===
        if (state === InteractionState.DRAGGING_OBJECT) {
            const dx = worldX - this.state.dragStartWorld.x;
            const dy = worldY - this.state.dragStartWorld.y;
            
            app.selectedObjects.forEach((obj, index) => {
                const initial = this.state.objectInitialStates[index];
                if (!initial) return;
                
                if (obj.type === 'line') {
                    obj.x1 = initial.x1 + dx;
                    obj.y1 = initial.y1 + dy;
                    obj.x2 = initial.x2 + dx;
                    obj.y2 = initial.y2 + dy;
                } else if (obj.type === 'taperedLine' || obj.type === 'apicalDendrite' || 
                           obj.type === 'myelinatedAxon' || obj.type === 'axonHillock' || 
                           obj.type === 'bipolarSoma') {
                    obj.x1 = initial.x1 + dx;
                    obj.y1 = initial.y1 + dy;
                    obj.x2 = initial.x2 + dx;
                    obj.y2 = initial.y2 + dy;
                } else if (obj.type === 'unmyelinatedAxon') {
                    obj.x1 = initial.x1 + dx;
                    obj.y1 = initial.y1 + dy;
                    obj.x2 = initial.x2 + dx;
                    obj.y2 = initial.y2 + dy;
                    obj.controlX = initial.controlX + dx;
                    obj.controlY = initial.controlY + dy;
                } else if (obj.type === 'curvedPath') {
                    obj.x1 = initial.x1 + dx;
                    obj.y1 = initial.y1 + dy;
                    obj.x2 = initial.x2 + dx;
                    obj.y2 = initial.y2 + dy;
                    if (initial.controlX !== undefined) {
                        obj.controlX = initial.controlX + dx;
                        obj.controlY = initial.controlY + dy;
                    }
                } else if (obj.type === 'freehand') {
                    if (obj.points && initial.points) {
                        obj.points.forEach((point, i) => {
                            point.x = initial.points[i].x + dx;
                            point.y = initial.points[i].y + dy;
                        });
                    }
                } else if (obj.type === 'synapse') {
                    obj.sourcePoint.x = initial.sourcePoint.x + dx;
                    obj.sourcePoint.y = initial.sourcePoint.y + dy;
                    obj.targetPoint.x = initial.targetPoint.x + dx;
                    obj.targetPoint.y = initial.targetPoint.y + dy;
                } else {
                    // Standard objects (x, y)
                    obj.x = initial.x + dx;
                    obj.y = initial.y + dy;
                }
            });
            return { preview: true };
        }
        
        // === RESIZING ===
        if (state === InteractionState.DRAGGING_SELECTION && this.state.dragHandle) {
            console.log(`📏 Resizing with handle: ${this.state.dragHandle}`);
            if (app.selectedObjects.length === 1) {
                const obj = app.selectedObjects[0];
                // CRITICAL: resizeObject expects this.dragHandle to be set on app
                app.dragHandle = this.state.dragHandle;
                app.resizeObject(obj, worldX, worldY);
            }
            return { preview: true };
        }
        
        // === ROTATING ===
        if (state === InteractionState.ROTATING && this.state.isRotating) {
            const obj = app.selectedObjects[0];
            const center = app.getObjectCenter(obj);
            const currentAngle = Math.atan2(worldY - center.y, worldX - center.x);
            const angleDelta = currentAngle - this.state.rotationStartAngle;
            
            // Convert radians to degrees
            let newRotation = this.state.initialRotation + (angleDelta * 180 / Math.PI);
            
            // Optional: Snap to 15° increments with Shift
            if (app.shiftPressed) {
                newRotation = Math.round(newRotation / 15) * 15;
            }
            
            // Normalize to 0-360
            obj.rotation = ((newRotation % 360) + 360) % 360;
            
            return { preview: true };
        }
        
        // === GRAPH CONTROL POINT ===
        if (state === InteractionState.DRAGGING_GRAPH_POINT && this.state.isDraggingGraphControlPoint) {
            const graph = app.selectedObjects[0];
            if (graph.curvePoints && this.state.graphControlPointIndex < graph.curvePoints.length) {
                const point = graph.curvePoints[this.state.graphControlPointIndex];
                
                // Convert world to graph coordinates
                const graphX = ((worldX - graph.x) / graph.width) * (graph.xMax - graph.xMin) + graph.xMin;
                const graphY = ((graph.y + graph.height - worldY) / graph.height) * (graph.yMax - graph.yMin) + graph.yMin;
                
                point.x = graphX;
                point.y = graphY;
            }
            return { preview: true };
        }
        
        return {};
    }

    onMouseUp(worldX, worldY, clickedObj, app) {
        const state = app.stateMachine.state;
        
        // === SELECTION BOX ===
        if (state === InteractionState.DRAWING_SELECTION_BOX) {
            const start = this.state.selectionBoxStart;
            const end = this.state.selectionBoxEnd;
            
            const left = Math.min(start.x, end.x);
            const right = Math.max(start.x, end.x);
            const top = Math.min(start.y, end.y);
            const bottom = Math.max(start.y, end.y);
            
            // Select all intersecting objects
            app.objects.forEach(obj => {
                const bounds = app.getObjectBounds(obj);
                if (bounds) {
                    const intersects = !(bounds.right < left || bounds.left > right || 
                                       bounds.bottom < top || bounds.top > bottom);
                    if (intersects && !app.selectedObjects.includes(obj)) {
                        app.selectedObjects.push(obj);
                    }
                }
            });
            
            this.state.selectionBoxStart = null;
            this.state.selectionBoxEnd = null;
            app.updatePropertiesPanel();
            
            return { stateTransition: InteractionState.IDLE };
        }
        
        // === SAVE STATE AFTER MANIPULATION ===
        if (state === InteractionState.DRAGGING_OBJECT || 
            state === InteractionState.DRAGGING_SELECTION || 
            state === InteractionState.ROTATING ||
            state === InteractionState.DRAGGING_GRAPH_POINT) {
            
            app.saveState();
            app.updatePropertiesPanel();
            
            // Clear drag state
            this.state.dragHandle = null;
            app.dragHandle = null;  // CRITICAL: Clear app's dragHandle too
            this.state.isRotating = false;
            this.state.isDraggingGraphControlPoint = false;
            this.state.graphControlPointIndex = null;
            this.state.objectInitialStates = [];  // CRITICAL: Clear stored positions
            
            return { stateTransition: InteractionState.IDLE };
        }
        
        return { stateTransition: InteractionState.IDLE };
    }

    renderPreview(ctx, app) {
        // Render selection box
        if (this.state.selectionBoxStart && this.state.selectionBoxEnd) {
            const start = this.state.selectionBoxStart;
            const end = this.state.selectionBoxEnd;
            
            ctx.save();
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 1 / app.zoom;
            ctx.setLineDash([5 / app.zoom, 5 / app.zoom]);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
            
            const width = end.x - start.x;
            const height = end.y - start.y;
            
            ctx.fillRect(start.x, start.y, width, height);
            ctx.strokeRect(start.x, start.y, width, height);
            ctx.restore();
        }
    }

    reset() {
        this.state = {
            selectionBoxStart: null,
            selectionBoxEnd: null,
            dragStartWorld: null,
            dragHandle: null,
            objectInitialStates: [],
            isRotating: false,
            rotationStartAngle: null,
            initialRotation: null,
            rotationStartDistance: null,
            isDraggingGraphControlPoint: false,
            graphControlPointIndex: null,
            lastClickTime: null,
            lastClickedObject: null
        };
    }

    getCursor() {
        return 'default';
    }

    // === HELPER METHODS ===
    
    _storeInitialPositions(app) {
        this.state.objectInitialStates = app.selectedObjects.map(obj => {
            if (obj.type === 'freehand') {
                return {
                    points: obj.points.map(p => ({x: p.x, y: p.y}))
                };
            } else if (obj.type === 'synapse') {
                return {
                    sourcePoint: {x: obj.sourcePoint.x, y: obj.sourcePoint.y},
                    targetPoint: {x: obj.targetPoint.x, y: obj.targetPoint.y}
                };
            } else if (obj.type === 'line' || obj.type === 'taperedLine' || 
                       obj.type === 'apicalDendrite' || obj.type === 'myelinatedAxon' ||
                       obj.type === 'unmyelinatedAxon' || obj.type === 'curvedPath' ||
                       obj.type === 'axonHillock' || obj.type === 'bipolarSoma') {
                const state = {
                    x1: obj.x1,
                    y1: obj.y1,
                    x2: obj.x2,
                    y2: obj.y2
                };
                if (obj.controlX !== undefined) {
                    state.controlX = obj.controlX;
                    state.controlY = obj.controlY;
                }
                return state;
            } else {
                return {
                    x: obj.x,
                    y: obj.y
                };
            }
        });
    }
    
    _isClickingRotateHandle(app, screenX, screenY) {
        if (app.selectedObjects.length !== 1) return false;
        
        const obj = app.selectedObjects[0];
        const center = app.getObjectCenter(obj);
        const bounds = app.getObjectBounds(obj);
        
        if (!center || !bounds) return false;
        
        const screenCenter = app.worldToScreen(center.x, center.y);
        const screenTop = app.worldToScreen(center.x, bounds.top);
        
        const handleX = screenCenter.x;
        const handleY = screenTop.y - 20;
        
        const dist = Math.sqrt((screenX - handleX) ** 2 + (screenY - handleY) ** 2);
        return dist < 10;
    }
    
    _getGraphControlPointAt(graph, worldX, worldY, tolerance) {
        if (!graph.curvePoints) return -1;
        
        for (let i = 0; i < graph.curvePoints.length; i++) {
            const point = graph.curvePoints[i];
            
            // Convert graph coordinates to world coordinates
            const worldPointX = graph.x + ((point.x - graph.xMin) / (graph.xMax - graph.xMin)) * graph.width;
            const worldPointY = graph.y + graph.height - ((point.y - graph.yMin) / (graph.yMax - graph.yMin)) * graph.height;
            
            const dx = worldX - worldPointX;
            const dy = worldY - worldPointY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < tolerance) {
                return i;
            }
        }
        
        return -1;
    }
}
