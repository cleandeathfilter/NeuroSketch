/**
 * app.js - Main application orchestrator for NeuroSketch
 * Manages canvas, state, selection, and integrates with TextEditor and CanvasRenderer
 */

import { TextEditor } from './textEditor.js';
import { drawObject, drawSelection, drawGraphSelection } from './canvasRenderer.js';
import { startDrawingTriangle, updateTriangle, finalizeTriangle, isPointInTriangle } from './triangleTool.js';
import { startDrawingHexagon, updateHexagon, finalizeHexagon, isPointInHexagon } from './hexagonTool.js';
import { startDrawingEllipse, updateEllipse, finalizeEllipse, isPointInEllipse } from './ellipseTool.js';
import { startDrawingTaperedLine, updateTaperedLine, finalizeTaperedLine, isPointOnTaperedLine } from './taperedLineTool.js';
import { startDrawingUnmyelinatedAxon, updateUnmyelinatedAxon, finalizeUnmyelinatedAxon, isPointOnUnmyelinatedAxon } from './unmyelinatedAxonTool.js';
import { startDrawingMyelinatedAxon, updateMyelinatedAxon, finalizeMyelinatedAxon, isPointOnMyelinatedAxon } from './myelinatedAxonTool.js';
import { startDrawingAxonHillock, updateAxonHillock, finalizeAxonHillock, isPointInAxonHillock, snapToSoma } from './axonHillockTool.js';
import { startDrawingApicalDendrite, updateApicalDendrite, finalizeApicalDendrite, isPointOnApicalDendrite, snapToSomaApex } from './apicalDendriteTool.js';
import { startDrawingBipolarSoma, updateBipolarSoma, finalizeBipolarSoma, isPointInBipolarSoma } from './bipolarSomaTool.js';
import {
    startDrawingGraph,
    finalizeGraph,
    isPointInGraph,
    getControlPointAt,
    updateControlPoint,
    canvasToGraph,
    graphToCanvas,
    GRAPH_PRESETS,
    applyPreset
} from './graphTool.js';

export const app = {
    canvas: null,
    ctx: null,
    textEditor: null,
    objects: [],
    selectedObjects: [],
    currentTool: 'select',
    isDrawing: false,
    isPanning: false,
    spacePressed: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    zoom: 1,
    showGrid: false,
    dragHandle: null,
    isDarkMode: false,
    history: [],
    historyIndex: -1,
    clipboard: null,
    lastClickTime: null,
    isDrawingSelectionBox: false,
    selectionBoxStart: null,
    selectionBoxEnd: null,
    isDraggingGraphControlPoint: false,
    graphControlPointIndex: null,
    hoveredGraphPoint: null,
    tooltipTimeout: null,
    showDimensions: true,
    dimensionUnits: 'px',
    dpiForExport: 96,
    shiftPressed: false,
    ctrlPressed: false,
    altPressed: false,
    isRotating: false,
    rotationStartAngle: 0,
    initialRotation: 0,
    rotationStartDistance: 0,

    init() {
        try {
            console.log('NeuroSketch initializing...');
            this.canvas = document.getElementById('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.textEditor = new TextEditor(this.canvas, this);

            console.log('Canvas:', this.canvas);
            this.resizeCanvas();

            console.log('Adding canvas event listeners...');
            window.addEventListener('resize', () => this.resizeCanvas());
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            document.addEventListener('keyup', (e) => this.handleKeyUp(e));

            console.log('Adding tool button event listeners...');
            const toolButtons = document.querySelectorAll('.toolBtn');
            console.log(`Found ${toolButtons.length} tool buttons`);

            toolButtons.forEach((btn, index) => {
                console.log(`  Setting up button ${index}: ${btn.dataset.tool}`);
                btn.addEventListener('click', (e) => {
                    console.log('Tool clicked:', btn.dataset.tool);
                    document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentTool = btn.dataset.tool;
                    console.log('Current tool set to:', this.currentTool);
                    // CRITICAL: Reset interaction state when changing tools to prevent stuck state
                    this.resetInteractionState();
                });
            });

            console.log('Initializing dimension toggle button...');
            // Initialize dimension toggle button state
            const dimensionsBtn = document.getElementById('dimensionsToggle');
            if (dimensionsBtn) {
                if (this.showDimensions) {
                    dimensionsBtn.classList.add('active');
                    dimensionsBtn.textContent = 'Hide Dimensions';
                }
            } else {
                console.error('dimensionsToggle button not found!');
            }

            console.log('Saving initial state...');
            this.saveState();

            console.log('Rendering initial canvas...');
            this.render();

            console.log('✅ NeuroSketch initialization complete!');
        } catch (error) {
            console.error('❌ ERROR during initialization:', error);
            console.error('Error stack:', error.stack);
        }
    },

    resizeCanvas() {
        // Guard against calling before initialization
        if (!this.canvas) {
            console.warn('resizeCanvas called before canvas initialized');
            return;
        }

        const container = document.getElementById('canvasContainer');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    },

    screenToWorld(x, y) {
        return {
            x: (x - this.panX) / this.zoom,
            y: (y - this.panY) / this.zoom
        };
    },

    worldToScreen(x, y) {
        return {
            x: x * this.zoom + this.panX,
            y: y * this.zoom + this.panY
        };
    },

    applyDimensionSnapping(x, y, snapOrigin = null) {
        // Shift: 10px snap, Ctrl/Cmd: 50px snap
        if (this.shiftPressed || this.ctrlPressed) {
            const snapSize = this.shiftPressed ? 10 : 50;

            if (snapOrigin) {
                // Snap relative to origin (for width/height during drawing)
                const dx = x - snapOrigin.x;
                const dy = y - snapOrigin.y;
                x = snapOrigin.x + Math.round(dx / snapSize) * snapSize;
                y = snapOrigin.y + Math.round(dy / snapSize) * snapSize;
            } else {
                // Absolute snap
                x = Math.round(x / snapSize) * snapSize;
                y = Math.round(y / snapSize) * snapSize;
            }
        }

        // Alt: maintain aspect ratio
        if (this.altPressed && snapOrigin) {
            const dx = Math.abs(x - snapOrigin.x);
            const dy = Math.abs(y - snapOrigin.y);
            const size = Math.max(dx, dy);

            x = snapOrigin.x + (x > snapOrigin.x ? size : -size);
            y = snapOrigin.y + (y > snapOrigin.y ? size : -size);
        }

        return { x, y };
    },

    isEditingInput() {
        // Check if focus is on any input, textarea, or select element
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable
        );
    },

    switchToSelectTool() {
        // Switch to select tool and update UI
        this.currentTool = 'select';
        document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
        const selectBtn = document.querySelector('[data-tool="select"]');
        if (selectBtn) {
            selectBtn.classList.add('active');
        }
        // CRITICAL: Reset interaction state when switching tools
        this.resetInteractionState();
    },

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const world = this.screenToWorld(x, y);

        // If editing text, check if clicking outside the textbox to stop editing
        if (this.textEditor && this.textEditor.isEditing) {
            const editingObj = this.textEditor.getEditingObject();
            if (editingObj) {
                const clickedInside = world.x >= editingObj.x &&
                                     world.x <= editingObj.x + editingObj.width &&
                                     world.y >= editingObj.y &&
                                     world.y <= editingObj.y + editingObj.height;

                if (!clickedInside) {
                    this.textEditor.stopEditing();
                    // Deselect the textbox
                    this.selectedObjects = [];
                    // Continue processing this click normally
                } else {
                    return; // Ignore clicks inside the textbox while editing
                }
            }
        }

        // Pan with spacebar + click
        if (this.spacePressed) {
            this.isPanning = true;
            this.startX = x - this.panX;
            this.startY = y - this.panY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // SELECT TOOL
        if (this.currentTool === 'select') {
            // PRIORITY: Check for textbox resize handles FIRST (defensive fix)
            // Textboxes need special handling to ensure resize works reliably
            if (this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'text') {
                const textObj = this.selectedObjects[0];
                const handleSize = 15 / this.zoom; // Larger hit area for easier clicking

                // Calculate textbox bounds
                const bounds = {
                    left: textObj.x,
                    right: textObj.x + textObj.width,
                    top: textObj.y,
                    bottom: textObj.y + textObj.height
                };

                // Check if click is within textbox bounds (with handle padding)
                const padding = handleSize;
                const clickedInTextboxArea = world.x >= bounds.left - padding &&
                                             world.x <= bounds.right + padding &&
                                             world.y >= bounds.top - padding &&
                                             world.y <= bounds.bottom + padding;

                if (!clickedInTextboxArea) {
                    // Clicked outside textbox - deselect it
                    this.selectedObjects = [];
                    this.lastClickTime = null;
                    this.updatePropertiesPanel();
                    // Fall through to handle the click normally
                } else {
                    // Clicked inside or near textbox - handle it
                    // Check all 8 handles explicitly for textbox
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
                        const dx = Math.abs(world.x - pos.x);
                        const dy = Math.abs(world.y - pos.y);
                        if (dx < handleSize && dy < handleSize) {
                            this.dragHandle = key;
                            this.isDrawing = true;
                            this.startX = world.x;
                            this.startY = world.y;
                            return;
                        }
                    }

                    // Handle was not clicked, check for double-click on textbox body
                    const now = Date.now();
                    const timeSinceLastClick = this.lastClickTime ? (now - this.lastClickTime) : 999;
                    const isDoubleClick = this.lastClickTime && timeSinceLastClick < 300;

                    if (isDoubleClick) {
                        this.textEditor.startEditing(textObj);
                        this.updatePropertiesPanel();
                        this.lastClickTime = null; // Clear to prevent triple-click issues
                        return;
                    }

                    // Single click on textbox body - set up for move
                    this.lastClickTime = now;
                    this.isDrawing = true;
                    this.startX = world.x;
                    this.startY = world.y;
                    textObj._dragOffsetX = world.x - textObj.x;
                    textObj._dragOffsetY = world.y - textObj.y;
                    return; // Don't fall through to general object handler
                }
            }

            // Check for graph control point dragging
            if (this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
                const graph = this.selectedObjects[0];
                const controlPointIndex = getControlPointAt(graph, world.x, world.y, 10 / this.zoom);
                if (controlPointIndex !== -1) {
                    this.isDraggingGraphControlPoint = true;
                    this.graphControlPointIndex = controlPointIndex;
                    this.isDrawing = true;
                    this.startX = world.x;
                    this.startY = world.y;
                    return;
                }
            }

            // Check for rotation handle (skip tapered lines/dendrites and curved paths/axons)
            if (this.selectedObjects.length === 1 &&
                this.selectedObjects[0].type !== 'taperedLine' &&
                this.selectedObjects[0].type !== 'curvedPath') {
                if (this.isClickingRotateHandle(x, y)) {
                    const obj = this.selectedObjects[0];
                    this.isRotating = true;
                    this.isDrawing = true;
                    const center = this.getObjectCenter(obj);
                    this.rotationStartAngle = Math.atan2(world.y - center.y, world.x - center.x);
                    this.initialRotation = obj.rotation || 0;

                    // Store initial distance for proportional rotation
                    const dx = world.x - center.x;
                    const dy = world.y - center.y;
                    this.rotationStartDistance = Math.sqrt(dx * dx + dy * dy);
                    return;
                }
            }

            // Check for resize handles on other objects (skip text, already handled above)
            if (this.selectedObjects.length === 1 && this.selectedObjects[0].type !== 'text') {
                const handle = this.getResizeHandle(x, y);
                if (handle) {
                    this.dragHandle = handle;
                    this.isDrawing = true;
                    this.startX = world.x;
                    this.startY = world.y;
                    return;
                }
            }

            // Check if clicking on an object
            const obj = this.getObjectAt(world.x, world.y);
            if (obj) {
                const now = Date.now();
                const isDoubleClick = this.lastClickTime && (now - this.lastClickTime) < 300 && this.selectedObjects[0] === obj;

                // Handle double-click on text objects to edit
                if (obj.type === 'text' && isDoubleClick) {
                    this.textEditor.startEditing(obj);
                    this.updatePropertiesPanel();
                    this.lastClickTime = null; // Clear to prevent triple-click issues
                    return;
                }

                this.lastClickTime = now;

                if (!this.selectedObjects.includes(obj)) {
                    this.selectedObjects = [obj];
                }
                this.isDrawing = true;
                this.startX = world.x;
                this.startY = world.y;
                // Store initial positions for all selected objects
                this.selectedObjects.forEach(o => {
                    if (o.type === 'taperedLine' || o.type === 'curvedPath' || o.type === 'apicalDendrite' ||
                        o.type === 'myelinatedAxon' || o.type === 'unmyelinatedAxon') {
                        // For line-based objects with x1/y1, store offset from first point
                        o._dragOffsetX = world.x - o.x1;
                        o._dragOffsetY = world.y - o.y1;
                    } else if (o.type === 'freehand') {
                        // For freehand, store offset from first point
                        if (o.points && o.points.length > 0) {
                            o._dragOffsetX = world.x - o.points[0].x;
                            o._dragOffsetY = world.y - o.points[0].y;
                        }
                    } else {
                        o._dragOffsetX = world.x - o.x;
                        o._dragOffsetY = world.y - o.y;
                    }
                });
                this.updatePropertiesPanel();
            } else {
                // Don't deselect if we just finished editing a textbox (defensive protection)
                const hasProtectedTextbox = this.selectedObjects.length === 1 &&
                                           this.selectedObjects[0].type === 'text' &&
                                           this.selectedObjects[0]._justFinishedEditing;

                if (!hasProtectedTextbox) {
                    // Start selection box on empty canvas click
                    this.isDrawingSelectionBox = true;
                    this.selectionBoxStart = {x: world.x, y: world.y};
                    this.selectionBoxEnd = {x: world.x, y: world.y};
                    this.selectedObjects = [];
                    this.lastClickTime = null;
                    this.updatePropertiesPanel();
                }
            }
        } else if (this.currentTool === 'graph') {
            // GRAPH TOOL - Create graph
            startDrawingGraph(world.x, world.y);
            const graphObj = finalizeGraph(world.x, world.y);
            this.objects.push(graphObj);
            this.selectedObjects = [graphObj];
            this.saveState();
            this.updatePropertiesPanel();
            this.render();
            // Auto-switch to select tool
            this.switchToSelectTool();
        } else if (this.currentTool === 'text') {
            // TEXT TOOL - Create textbox
            const textObj = {
                type: 'text',
                x: world.x,
                y: world.y,
                width: 200,
                height: 50,
                text: '',
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none',
                textColor: this.isDarkMode ? '#FFFFFF' : '#000000',
                textAlign: 'left',
                lineHeight: 1.5,
                backgroundColor: 'transparent',
                backgroundOpacity: 1,
                hasBorder: false,
                borderColor: this.isDarkMode ? '#FFFFFF' : '#000000',
                borderWidth: 1,
                borderRadius: 0,
                rotation: 0
            };
            this.objects.push(textObj);
            this.selectedObjects = [textObj];
            this.saveState();
            this.updatePropertiesPanel();
            this.render();
            // Immediately enter edit mode
            setTimeout(() => this.textEditor.startEditing(textObj), 100);
        } else if (this.currentTool === 'freehand') {
            // FREEHAND DRAWING TOOL
            this.freehandPoints = [{x: world.x, y: world.y}];
            this.isDrawing = true;
            this.startX = world.x;
            this.startY = world.y;
        } else {
            // OTHER DRAWING TOOLS (circle, rectangle, line)
            this.isDrawing = true;
            this.startX = world.x;
            this.startY = world.y;
        }

        this.render();
    },

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let world = this.screenToWorld(x, y);

        // Apply dimension snapping if drawing or resizing
        if (this.isDrawing && this.currentTool !== 'select' && this.currentTool !== 'freehand') {
            const snapped = this.applyDimensionSnapping(world.x, world.y, {x: this.startX, y: this.startY});
            world = snapped;
        }

        if (this.isPanning) {
            this.panX = x - this.startX;
            this.panY = y - this.startY;
            this.textEditor.updatePosition();
            this.render();
            return;
        }

        // Track selection box during drag
        if (this.isDrawingSelectionBox) {
            this.selectionBoxEnd = {x: world.x, y: world.y};
            this.render();
            return;
        }

        // Check for graph control point hover (for tooltips)
        if (!this.isDrawing && this.currentTool === 'select' && this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
            const graph = this.selectedObjects[0];
            const pointIndex = getControlPointAt(graph, world.x, world.y, 12 / this.zoom);

            if (pointIndex !== -1 && graph.curvePoints[pointIndex].type === 'anchor' && graph.curvePoints[pointIndex].tooltip) {
                if (this.hoveredGraphPoint !== pointIndex) {
                    this.hoveredGraphPoint = pointIndex;
                    // Delay tooltip appearance slightly
                    clearTimeout(this.tooltipTimeout);
                    this.tooltipTimeout = setTimeout(() => {
                        this.render();
                    }, 300);
                }
            } else if (this.hoveredGraphPoint !== null) {
                this.hoveredGraphPoint = null;
                clearTimeout(this.tooltipTimeout);
                this.render();
            }
        } else if (this.hoveredGraphPoint !== null) {
            this.hoveredGraphPoint = null;
            clearTimeout(this.tooltipTimeout);
            this.render();
        }

        if (!this.isDrawing) {
            if (this.currentTool === 'select' && this.selectedObjects.length === 1) {
                const handle = this.getResizeHandle(x, y);
                if (handle) {
                    if (this.selectedObjects[0].type === 'line') {
                        this.canvas.style.cursor = 'move';
                    } else {
                        this.canvas.style.cursor = handle.includes('n') || handle.includes('s') ?
                            (handle.includes('w') || handle.includes('e') ? 'nwse-resize' : 'ns-resize') :
                            'ew-resize';
                    }
                    return;
                }
            }
            this.canvas.style.cursor = this.spacePressed ? 'grab' : 'default';
            return;
        }

        if (this.currentTool === 'select' && this.selectedObjects.length > 0) {
            if (this.isDraggingGraphControlPoint && this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
                const graph = this.selectedObjects[0];
                const graphPos = canvasToGraph(world.x, world.y, graph);
                updateControlPoint(graph, this.graphControlPointIndex, graphPos.x, graphPos.y);
            } else if (this.isRotating && this.selectedObjects.length === 1) {
                // Handle rotation
                const obj = this.selectedObjects[0];
                const center = this.getObjectCenter(obj);
                const currentAngle = Math.atan2(world.y - center.y, world.x - center.x);
                const angleDiff = (currentAngle - this.rotationStartAngle) * 180 / Math.PI;
                obj.rotation = this.initialRotation + angleDiff;

                // Normalize rotation to 0-360 degrees
                while (obj.rotation < 0) obj.rotation += 360;
                while (obj.rotation >= 360) obj.rotation -= 360;
            } else if (this.dragHandle && this.selectedObjects.length === 1) {
                this.resizeObject(this.selectedObjects[0], world.x, world.y);
            } else {
                // Move all selected objects
                const deltaX = world.x - this.startX;
                const deltaY = world.y - this.startY;
                this.selectedObjects.forEach(obj => {
                    if (obj.type === 'line') {
                        // For lines, move both endpoints
                        obj.x = this.startX + deltaX - obj._dragOffsetX;
                        obj.y = this.startY + deltaY - obj._dragOffsetY;
                        obj.x2 = obj.x + obj._lineWidth;
                        obj.y2 = obj.y + obj._lineHeight;
                    } else if (obj.type === 'taperedLine' || obj.type === 'apicalDendrite' || obj.type === 'myelinatedAxon') {
                        // For line-based objects with x1/y1/x2/y2, move all points
                        const dx = world.x - obj._dragOffsetX - obj.x1;
                        const dy = world.y - obj._dragOffsetY - obj.y1;
                        obj.x1 += dx;
                        obj.y1 += dy;
                        obj.x2 += dx;
                        obj.y2 += dy;
                    } else if (obj.type === 'unmyelinatedAxon') {
                        // For unmyelinated axons with control points, move all points
                        const dx = world.x - obj._dragOffsetX - obj.x1;
                        const dy = world.y - obj._dragOffsetY - obj.y1;
                        obj.x1 += dx;
                        obj.y1 += dy;
                        obj.x2 += dx;
                        obj.y2 += dy;
                        obj.controlX += dx;
                        obj.controlY += dy;
                    } else if (obj.type === 'curvedPath') {
                        // For curved paths, move all points
                        const dx = world.x - obj._dragOffsetX - obj.x1;
                        const dy = world.y - obj._dragOffsetY - obj.y1;
                        obj.x1 += dx;
                        obj.y1 += dy;
                        obj.x2 += dx;
                        obj.y2 += dy;
                        obj.controlX += dx;
                        obj.controlY += dy;
                    } else if (obj.type === 'freehand') {
                        // For freehand paths, move all points
                        if (obj.points && obj.points.length > 0) {
                            const dx = world.x - obj._dragOffsetX - obj.points[0].x;
                            const dy = world.y - obj._dragOffsetY - obj.points[0].y;
                            obj.points.forEach(point => {
                                point.x += dx;
                                point.y += dy;
                            });
                        }
                    } else {
                        // For all other objects including text
                        obj.x = world.x - obj._dragOffsetX;
                        obj.y = world.y - obj._dragOffsetY;
                    }
                });
            }
        } else if (this.currentTool === 'circle') {
            const dx = world.x - this.startX;
            const dy = world.y - this.startY;
            const radius = Math.sqrt(dx * dx + dy * dy);
            this.tempObj = {
                type: 'circle',
                x: this.startX,
                y: this.startY,
                radius: radius,
                fillColor: 'transparent',
                strokeColor: this.isDarkMode ? '#FFFFFF' : '#000000',
                strokeWidth: 2
            };
        } else if (this.currentTool === 'rectangle') {
            this.tempObj = {
                type: 'rectangle',
                x: this.startX,
                y: this.startY,
                width: world.x - this.startX,
                height: world.y - this.startY,
                fillColor: 'transparent',
                strokeColor: this.isDarkMode ? '#FFFFFF' : '#000000',
                strokeWidth: 2
            };
        } else if (this.currentTool === 'line') {
            this.tempObj = {
                type: 'line',
                x: this.startX,
                y: this.startY,
                x2: world.x,
                y2: world.y,
                strokeColor: this.isDarkMode ? '#FFFFFF' : '#000000',
                strokeWidth: 2
            };
        } else if (this.currentTool === 'freehand') {
            // Capture points while drawing
            if (this.freehandPoints && this.freehandPoints.length > 0) {
                // Only add point if it's different from last point (avoid duplicates)
                const lastPoint = this.freehandPoints[this.freehandPoints.length - 1];
                const distance = Math.sqrt(
                    Math.pow(world.x - lastPoint.x, 2) +
                    Math.pow(world.y - lastPoint.y, 2)
                );

                // Add point if moved at least 2 pixels (reduces point density)
                if (distance > 2 / this.zoom) {
                    this.freehandPoints.push({x: world.x, y: world.y});
                }
            }

            // Create temp object for rendering
            this.tempObj = {
                type: 'freehand',
                points: [...this.freehandPoints],
                strokeColor: this.isDarkMode ? '#FFFFFF' : '#000000',
                strokeWidth: 2,
                fillColor: 'transparent',
                closed: false
            };
        } else if (this.currentTool === 'triangle') {
            this.tempObj = startDrawingTriangle(this.startX, this.startY, this, { excitatory: '#E74C3C' });
            updateTriangle(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'hexagon') {
            this.tempObj = startDrawingHexagon(this.startX, this.startY, this, { motorNeuron: '#4A90E2' });
            updateHexagon(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'ellipse') {
            this.tempObj = startDrawingEllipse(this.startX, this.startY, this, { genericNeuron: '#7F8C8D' });
            updateEllipse(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'tapered-line') {
            this.tempObj = startDrawingTaperedLine(this.startX, this.startY, this, { dendriteColor: '#FF8A42' });
            updateTaperedLine(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'unmyelinated-axon') {
            this.tempObj = startDrawingUnmyelinatedAxon(this.startX, this.startY, this, { axonColor: '#A93226' });
            updateUnmyelinatedAxon(this.tempObj, world.x, world.y, 1);
        } else if (this.currentTool === 'myelinated-axon') {
            this.tempObj = startDrawingMyelinatedAxon(this.startX, this.startY, this, {});
            updateMyelinatedAxon(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'axon-hillock') {
            this.tempObj = startDrawingAxonHillock(this.startX, this.startY, this, { hillockColor: '#D98880' });
            updateAxonHillock(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'apical-dendrite') {
            this.tempObj = startDrawingApicalDendrite(this.startX, this.startY, this, { apicalColor: '#E67E22' });
            updateApicalDendrite(this.tempObj, world.x, world.y);
        } else if (this.currentTool === 'bipolar-soma') {
            this.tempObj = startDrawingBipolarSoma(this.startX, this.startY, this, { bipolarColor: '#9B59B6' });
            updateBipolarSoma(this.tempObj, world.x, world.y);
        }

        this.render();
    },

    handleMouseUp(e) {
        // CRITICAL FIX: Always reset state flags to prevent select tool from getting stuck
        // This ensures the select tool works reliably even if actions are interrupted

        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.spacePressed ? 'grab' : 'default';
            return;
        }

        // Finalize selection box
        if (this.isDrawingSelectionBox) {
            const boxBounds = {
                left: Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x),
                right: Math.max(this.selectionBoxStart.x, this.selectionBoxEnd.x),
                top: Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y),
                bottom: Math.max(this.selectionBoxStart.y, this.selectionBoxEnd.y)
            };

            // Find all objects that intersect with selection box
            this.selectedObjects = this.objects.filter(obj =>
                this.rectangleIntersectsObject(boxBounds, obj)
            );

            // Clear selection box state
            this.selectionBoxStart = null;
            this.selectionBoxEnd = null;

            this.updatePropertiesPanel();

            // Reset all interaction states (will be called again at end, but needed here for early return)
            this.resetInteractionState();
            this.render();
            return;
        }

        if (this.isDrawing && this.currentTool !== 'select' && this.currentTool !== 'text' && this.tempObj) {
            // Finalize specific object types
            if (this.tempObj.type === 'line') {
                // Store line dimensions for moving
                this.tempObj._lineWidth = this.tempObj.x2 - this.tempObj.x;
                this.tempObj._lineHeight = this.tempObj.y2 - this.tempObj.y;
            } else if (this.tempObj.type === 'triangle') {
                finalizeTriangle(this.tempObj);
            } else if (this.tempObj.type === 'hexagon') {
                finalizeHexagon(this.tempObj);
            } else if (this.tempObj.type === 'ellipse') {
                finalizeEllipse(this.tempObj);
            } else if (this.tempObj.type === 'taperedLine') {
                finalizeTaperedLine(this.tempObj);
            } else if (this.tempObj.type === 'unmyelinatedAxon') {
                finalizeUnmyelinatedAxon(this.tempObj);
            } else if (this.tempObj.type === 'myelinatedAxon') {
                finalizeMyelinatedAxon(this.tempObj);
            } else if (this.tempObj.type === 'axonHillock') {
                finalizeAxonHillock(this.tempObj);
                // Snap to nearest soma
                const somas = this.objects.filter(o => o.type === 'triangle' || o.type === 'hexagon' || o.type === 'circle');
                snapToSoma(this.tempObj, somas);
            } else if (this.tempObj.type === 'apicalDendrite') {
                finalizeApicalDendrite(this.tempObj);
                // Snap to nearest pyramidal soma apex
                const pyramids = this.objects.filter(o => o.type === 'triangle');
                snapToSomaApex(this.tempObj, pyramids);
            } else if (this.tempObj.type === 'bipolarSoma') {
                finalizeBipolarSoma(this.tempObj);
            } else if (this.tempObj.type === 'freehand') {
                // Freehand path is already finalized, just need to clean up
                // Keep all the captured points
            }

            this.objects.push(this.tempObj);
            this.tempObj = null;
            this.freehandPoints = []; // Clear freehand points
            this.saveState();

            // Auto-switch to select tool after drawing
            this.switchToSelectTool();
        } else if (this.isDrawing && this.currentTool === 'select') {
            this.saveState();
        }

        // CRITICAL FIX: Comprehensive state reset to prevent select tool from getting stuck
        // This ensures ALL interaction state flags are properly cleared after every mouse up
        this.resetInteractionState();
        this.render();
    },

    resetInteractionState() {
        // Centralized method to reset all interaction state flags
        // This prevents the select tool from getting stuck in a "drawing" or "dragging" state
        this.isDrawing = false;
        this.dragHandle = null;
        this.isDraggingGraphControlPoint = false;
        this.graphControlPointIndex = null;
        this.isRotating = false;
        this.isDrawingSelectionBox = false;
        // Note: We don't reset isPanning here as it's handled separately
    },

    handleWheel(e) {
        e.preventDefault();

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Cmd/Ctrl+Scroll for zoom
        if (cmdOrCtrl) {
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.1, Math.min(5, this.zoom * delta));

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.panX = x - (x - this.panX) * (newZoom / this.zoom);
            this.panY = y - (y - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            document.getElementById('zoomSlider').value = this.zoom * 100;
            document.getElementById('zoomValue').textContent = Math.round(this.zoom * 100) + '%';

            this.textEditor.updatePosition();
            this.render();
        }
    },

    handleKeyDown(e) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Track modifier keys for dimension snapping
        this.shiftPressed = e.shiftKey;
        this.ctrlPressed = e.ctrlKey || e.metaKey;
        this.altPressed = e.altKey;

        // Space for panning
        if (e.code === 'Space' && !this.spacePressed) {
            this.spacePressed = true;
            this.canvas.style.cursor = 'grab';
            e.preventDefault();
            return;
        }

        // T key - Switch to triangle tool (pyramidal neuron soma)
        if (e.key === 't' || e.key === 'T') {
            if (!this.textEditor.isEditing && !this.isEditingInput()) {
                e.preventDefault();
                document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
                const triangleBtn = document.querySelector('[data-tool="triangle"]');
                if (triangleBtn) {
                    triangleBtn.classList.add('active');
                    this.currentTool = 'triangle';
                    this.resetInteractionState();
                }
                return;
            }
        }

        // G key - Switch to graph tool
        if (e.key === 'g' || e.key === 'G') {
            if (!this.textEditor.isEditing && !this.isEditingInput()) {
                e.preventDefault();
                document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
                const graphBtn = document.querySelector('[data-tool="graph"]');
                if (graphBtn) {
                    graphBtn.classList.add('active');
                    this.currentTool = 'graph';
                    this.resetInteractionState();
                }
                return;
            }
        }

        // Cmd/Ctrl+S - Save
        if (cmdOrCtrl && e.key === 's') {
            e.preventDefault();
            this.save();
            return;
        }

        // Cmd/Ctrl+E - Export
        if (cmdOrCtrl && e.key === 'e') {
            e.preventDefault();
            this.export();
            return;
        }

        // Cmd/Ctrl+Z - Undo
        if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
            return;
        }

        // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y - Redo
        if ((cmdOrCtrl && e.key === 'z' && e.shiftKey) || (cmdOrCtrl && e.key === 'y')) {
            e.preventDefault();
            this.redo();
            return;
        }

        // Cmd/Ctrl+C - Copy
        if (cmdOrCtrl && e.key === 'c') {
            e.preventDefault();
            this.copy();
            return;
        }

        // Cmd/Ctrl+V - Paste
        if (cmdOrCtrl && e.key === 'v') {
            e.preventDefault();
            this.paste();
            return;
        }

        // Cmd/Ctrl+D - Duplicate
        if (cmdOrCtrl && e.key === 'd') {
            e.preventDefault();
            this.duplicate();
            return;
        }

        // Cmd/Ctrl+A - Select All
        if (cmdOrCtrl && e.key === 'a' && !this.isEditingInput()) {
            e.preventDefault();
            this.selectAll();
            return;
        }

        // Delete or Backspace - Remove selected (macOS uses both)
        if ((e.key === 'Delete' || e.key === 'Backspace') &&
            this.selectedObjects.length > 0 &&
            !this.textEditor.isEditing &&
            !this.isEditingInput()) {
            e.preventDefault();
            this.objects = this.objects.filter(obj => !this.selectedObjects.includes(obj));
            this.selectedObjects = [];
            this.updatePropertiesPanel();
            this.saveState();
            this.render();
            return;
        }

        // Escape - Deselect all
        if (e.key === 'Escape') {
            this.selectedObjects = [];
            this.updatePropertiesPanel();
            this.render();
            return;
        }

        // Tool shortcuts
        if (e.key.toLowerCase() === 't' && !this.textEditor.isEditing && !this.isEditingInput()) {
            document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tool="text"]').classList.add('active');
            this.currentTool = 'text';
            this.resetInteractionState();
            return;
        }
        if (e.key.toLowerCase() === 'p' && !this.textEditor.isEditing && !this.isEditingInput()) {
            document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tool="freehand"]').classList.add('active');
            this.currentTool = 'freehand';
            this.resetInteractionState();
            return;
        }
    },

    handleKeyUp(e) {
        // Track modifier keys for dimension snapping
        this.shiftPressed = e.shiftKey;
        this.ctrlPressed = e.ctrlKey || e.metaKey;
        this.altPressed = e.altKey;

        if (e.code === 'Space') {
            this.spacePressed = false;
            this.canvas.style.cursor = 'default';
        }
    },

    getObjectAt(x, y) {
        // Use bounding box selection for all objects (matches dotted selection box)
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            const bounds = this.getObjectBounds(obj);

            if (!bounds) continue;

            // Simple bounding box check - click anywhere within the dotted box
            if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
                return obj;
            }
        }
        return null;
    },

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    getResizeHandle(sx, sy) {
        if (this.selectedObjects.length !== 1) return null;
        const obj = this.selectedObjects[0];

        const handleSize = 14 / this.zoom;  // Increased from 8 to 14 for better UX

        let bounds;
        if (obj.type === 'circle') {
            bounds = {
                left: obj.x - obj.radius,
                right: obj.x + obj.radius,
                top: obj.y - obj.radius,
                bottom: obj.y + obj.radius
            };
        } else if (obj.type === 'rectangle') {
            bounds = {
                left: Math.min(obj.x, obj.x + obj.width),
                right: Math.max(obj.x, obj.x + obj.width),
                top: Math.min(obj.y, obj.y + obj.height),
                bottom: Math.max(obj.y, obj.y + obj.height)
            };
        } else if (obj.type === 'line') {
            // For lines, create handles at both endpoints
            const world = this.screenToWorld(sx, sy);

            // Check start point
            const dx1 = Math.abs(world.x - obj.x);
            const dy1 = Math.abs(world.y - obj.y);
            if (dx1 < handleSize && dy1 < handleSize) {
                return 'start';
            }

            // Check end point
            const dx2 = Math.abs(world.x - obj.x2);
            const dy2 = Math.abs(world.y - obj.y2);
            if (dx2 < handleSize && dy2 < handleSize) {
                return 'end';
            }

            return null;
        } else if (obj.type === 'triangle') {
            bounds = {
                left: obj.x - obj.width / 2,
                right: obj.x + obj.width / 2,
                top: obj.y - obj.height / 2,
                bottom: obj.y + obj.height / 2
            };
        } else if (obj.type === 'hexagon') {
            bounds = {
                left: obj.x - obj.radius,
                right: obj.x + obj.radius,
                top: obj.y - obj.radius,
                bottom: obj.y + obj.radius
            };
        } else if (obj.type === 'ellipse') {
            bounds = {
                left: obj.x - obj.radiusX,
                right: obj.x + obj.radiusX,
                top: obj.y - obj.radiusY,
                bottom: obj.y + obj.radiusY
            };
        } else if (obj.type === 'triangle') {
            // Triangle needs standard 8-handle resize
            bounds = {
                left: obj.x - obj.width / 2,
                right: obj.x + obj.width / 2,
                top: obj.y - obj.height / 2,
                bottom: obj.y + obj.height / 2
            };
        } else if (obj.type === 'hexagon') {
            // Hexagon needs standard 8-handle resize
            bounds = {
                left: obj.x - obj.radius,
                right: obj.x + obj.radius,
                top: obj.y - obj.radius,
                bottom: obj.y + obj.radius
            };
        } else if (obj.type === 'image') {
            bounds = {
                left: obj.x,
                right: obj.x + obj.width,
                top: obj.y,
                bottom: obj.y + obj.height
            };
        } else if (obj.type === 'graph') {
            bounds = {
                left: obj.x,
                right: obj.x + obj.width,
                top: obj.y,
                bottom: obj.y + obj.height
            };
        } else if (obj.type === 'taperedLine') {
            // For tapered lines, create handles at both endpoints
            const world = this.screenToWorld(sx, sy);

            // Check start point
            const dx1 = Math.abs(world.x - obj.x1);
            const dy1 = Math.abs(world.y - obj.y1);
            if (dx1 < handleSize && dy1 < handleSize) {
                return 'start';
            }

            // Check end point
            const dx2 = Math.abs(world.x - obj.x2);
            const dy2 = Math.abs(world.y - obj.y2);
            if (dx2 < handleSize && dy2 < handleSize) {
                return 'end';
            }

            return null;
        } else if (obj.type === 'curvedPath') {
            // For curved paths, create handles at both endpoints and control point
            const world = this.screenToWorld(sx, sy);

            // Check start point
            const dx1 = Math.abs(world.x - obj.x1);
            const dy1 = Math.abs(world.y - obj.y1);
            if (dx1 < handleSize && dy1 < handleSize) {
                return 'start';
            }

            // Check end point
            const dx2 = Math.abs(world.x - obj.x2);
            const dy2 = Math.abs(world.y - obj.y2);
            if (dx2 < handleSize && dy2 < handleSize) {
                return 'end';
            }

            // Check control point
            const dxc = Math.abs(world.x - obj.controlX);
            const dyc = Math.abs(world.y - obj.controlY);
            if (dxc < handleSize && dyc < handleSize) {
                return 'control';
            }

            return null;
        } else if (obj.type === 'unmyelinatedAxon') {
            // For unmyelinated axons, create handles at start, end, and control point
            const world = this.screenToWorld(sx, sy);

            // Check start point
            const dx1 = Math.abs(world.x - obj.x1);
            const dy1 = Math.abs(world.y - obj.y1);
            if (dx1 < handleSize && dy1 < handleSize) {
                return 'start';
            }

            // Check end point
            const dx2 = Math.abs(world.x - obj.x2);
            const dy2 = Math.abs(world.y - obj.y2);
            if (dx2 < handleSize && dy2 < handleSize) {
                return 'end';
            }

            // Check control point
            const dxc = Math.abs(world.x - obj.controlX);
            const dyc = Math.abs(world.y - obj.controlY);
            if (dxc < handleSize && dyc < handleSize) {
                return 'control';
            }

            return null;
        } else if (obj.type === 'myelinatedAxon') {
            // For myelinated axons, create handles at both endpoints
            const world = this.screenToWorld(sx, sy);

            // Check start point
            const dx1 = Math.abs(world.x - obj.x1);
            const dy1 = Math.abs(world.y - obj.y1);
            if (dx1 < handleSize && dy1 < handleSize) {
                return 'start';
            }

            // Check end point
            const dx2 = Math.abs(world.x - obj.x2);
            const dy2 = Math.abs(world.y - obj.y2);
            if (dx2 < handleSize && dy2 < handleSize) {
                return 'end';
            }

            return null;
        } else if (obj.type === 'axonHillock') {
            // For axon hillocks, create handle at base only
            const world = this.screenToWorld(sx, sy);

            const dx = Math.abs(world.x - obj.x);
            const dy = Math.abs(world.y - obj.y);
            if (dx < handleSize && dy < handleSize) {
                return 'base';
            }

            return null;
        } else if (obj.type === 'apicalDendrite') {
            // For apical dendrites, create handles at both endpoints
            const world = this.screenToWorld(sx, sy);

            // Check start point
            const dx1 = Math.abs(world.x - obj.x1);
            const dy1 = Math.abs(world.y - obj.y1);
            if (dx1 < handleSize && dy1 < handleSize) {
                return 'start';
            }

            // Check end point
            const dx2 = Math.abs(world.x - obj.x2);
            const dy2 = Math.abs(world.y - obj.y2);
            if (dx2 < handleSize && dy2 < handleSize) {
                return 'end';
            }

            return null;
        } else if (obj.type === 'bipolarSoma') {
            // For bipolar somas, use standard 8 corner/edge handles
            const hw = obj.width / 2;
            const hh = obj.height / 2;
            const maxDim = Math.max(hw, hh);
            bounds = {
                left: obj.x - maxDim,
                right: obj.x + maxDim,
                top: obj.y - maxDim,
                bottom: obj.y + maxDim
            };
        } else if (obj.type === 'freehand') {
            // For freehand, use bounding box from all points
            const freehandBounds = this.getFreehandBounds(obj);
            if (freehandBounds) {
                bounds = freehandBounds;
            }
        }

        // If we don't have bounds set yet, object type not supported for standard handles
        if (!bounds) {
            return null;
        }

        const world = this.screenToWorld(sx, sy);
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
            const dx = Math.abs(world.x - pos.x);
            const dy = Math.abs(world.y - pos.y);
            if (dx < handleSize && dy < handleSize) {
                return key;
            }
        }
        return null;
    },

    isClickingRotateHandle(sx, sy) {
        if (this.selectedObjects.length !== 1) return false;
        const obj = this.selectedObjects[0];
        const world = this.screenToWorld(sx, sy);

        // Calculate bounds to find rotation handle position
        let bounds = this.getObjectBounds(obj);
        if (!bounds) return false;

        // Use same distance calculation as rendering
        const objectHeight = bounds.bottom - bounds.top;
        const minDistance = 40 / this.zoom;
        const handleDistance = Math.max(minDistance, objectHeight * 0.3);

        const centerX = (bounds.left + bounds.right) / 2;
        const rotateHandleY = bounds.top - handleDistance;
        const handleSize = 12 / this.zoom;

        // Check if click is near rotation handle
        const dx = Math.abs(world.x - centerX);
        const dy = Math.abs(world.y - rotateHandleY);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < handleSize;
    },

    getObjectBounds(obj) {
        if (obj.type === 'circle') {
            return {
                left: obj.x - obj.radius,
                right: obj.x + obj.radius,
                top: obj.y - obj.radius,
                bottom: obj.y + obj.radius
            };
        } else if (obj.type === 'rectangle' || obj.type === 'text' || obj.type === 'image' || obj.type === 'graph') {
            return {
                left: Math.min(obj.x, obj.x + obj.width),
                right: Math.max(obj.x, obj.x + obj.width),
                top: Math.min(obj.y, obj.y + obj.height),
                bottom: Math.max(obj.y, obj.y + obj.height)
            };
        } else if (obj.type === 'line' || obj.type === 'taperedLine') {
            return {
                left: Math.min(obj.x, obj.x2 || obj.x),
                right: Math.max(obj.x, obj.x2 || obj.x),
                top: Math.min(obj.y, obj.y2 || obj.y),
                bottom: Math.max(obj.y, obj.y2 || obj.y)
            };
        } else if (obj.type === 'triangle') {
            return {
                left: obj.x - obj.width / 2,
                right: obj.x + obj.width / 2,
                top: obj.y - obj.height / 2,
                bottom: obj.y + obj.height / 2
            };
        } else if (obj.type === 'hexagon') {
            return {
                left: obj.x - obj.radius,
                right: obj.x + obj.radius,
                top: obj.y - obj.radius,
                bottom: obj.y + obj.radius
            };
        } else if (obj.type === 'ellipse') {
            return {
                left: obj.x - obj.radiusX,
                right: obj.x + obj.radiusX,
                top: obj.y - obj.radiusY,
                bottom: obj.y + obj.radiusY
            };
        } else if (obj.type === 'unmyelinatedAxon') {
            return {
                left: Math.min(obj.x1, obj.x2, obj.controlX) - obj.strokeWidth,
                right: Math.max(obj.x1, obj.x2, obj.controlX) + obj.strokeWidth,
                top: Math.min(obj.y1, obj.y2, obj.controlY) - obj.strokeWidth,
                bottom: Math.max(obj.y1, obj.y2, obj.controlY) + obj.strokeWidth
            };
        } else if (obj.type === 'myelinatedAxon') {
            return {
                left: Math.min(obj.x1, obj.x2) - obj.myelinWidth / 2,
                right: Math.max(obj.x1, obj.x2) + obj.myelinWidth / 2,
                top: Math.min(obj.y1, obj.y2) - obj.myelinWidth / 2,
                bottom: Math.max(obj.y1, obj.y2) + obj.myelinWidth / 2
            };
        } else if (obj.type === 'axonHillock') {
            const cos = Math.cos(obj.angle);
            const sin = Math.sin(obj.angle);
            const endX = obj.x + obj.length * cos;
            const endY = obj.y + obj.length * sin;
            const maxWidth = Math.max(obj.baseWidth, obj.tipWidth);
            return {
                left: Math.min(obj.x, endX) - maxWidth,
                right: Math.max(obj.x, endX) + maxWidth,
                top: Math.min(obj.y, endY) - maxWidth,
                bottom: Math.max(obj.y, endY) + maxWidth
            };
        } else if (obj.type === 'apicalDendrite') {
            return {
                left: Math.min(obj.x1, obj.x2) - obj.baseWidth / 2,
                right: Math.max(obj.x1, obj.x2) + obj.baseWidth / 2,
                top: Math.min(obj.y1, obj.y2) - obj.baseWidth / 2,
                bottom: Math.max(obj.x1, obj.x2) + obj.baseWidth / 2
            };
        } else if (obj.type === 'bipolarSoma') {
            const hw = obj.width / 2;
            const hh = obj.height / 2;
            const maxDim = Math.max(hw, hh);
            return {
                left: obj.x - maxDim,
                right: obj.x + maxDim,
                top: obj.y - maxDim,
                bottom: obj.y + maxDim
            };
        } else if (obj.type === 'freehand') {
            const bounds = this.getFreehandBounds(obj);
            return {
                left: bounds.x,
                right: bounds.x + bounds.width,
                top: bounds.y,
                bottom: bounds.y + bounds.height
            };
        }
        return null;
    },

    getObjectCenter(obj) {
        if (obj.type === 'circle') {
            return { x: obj.x, y: obj.y };
        } else if (obj.type === 'line' || obj.type === 'taperedLine' || obj.type === 'myelinatedAxon' || obj.type === 'apicalDendrite') {
            return {
                x: (obj.x + (obj.x2 || obj.x1 || obj.x)) / 2,
                y: (obj.y + (obj.y2 || obj.y1 || obj.y)) / 2
            };
        } else if (obj.type === 'unmyelinatedAxon') {
            // Center is the midpoint of start and end
            return {
                x: (obj.x1 + obj.x2) / 2,
                y: (obj.y1 + obj.y2) / 2
            };
        } else if (obj.type === 'axonHillock') {
            const cos = Math.cos(obj.angle);
            const sin = Math.sin(obj.angle);
            const endX = obj.x + obj.length * cos;
            const endY = obj.y + obj.length * sin;
            return {
                x: (obj.x + endX) / 2,
                y: (obj.y + endY) / 2
            };
        } else if (obj.type === 'bipolarSoma') {
            return { x: obj.x, y: obj.y };
        } else if (obj.type === 'freehand') {
            const bounds = this.getFreehandBounds(obj);
            return {
                x: bounds.x + bounds.width / 2,
                y: bounds.y + bounds.height / 2
            };
        } else {
            return {
                x: obj.x + (obj.width || 0) / 2,
                y: obj.y + (obj.height || 0) / 2
            };
        }
    },

    resizeObject(obj, wx, wy) {
        // Apply dimension snapping during resize
        const snapped = this.applyDimensionSnapping(wx, wy, {x: obj.x, y: obj.y});
        wx = snapped.x;
        wy = snapped.y;

        if (obj.type === 'circle') {
            const dx = wx - obj.x;
            const dy = wy - obj.y;
            obj.radius = Math.sqrt(dx * dx + dy * dy);
        } else if (obj.type === 'rectangle') {
            const handle = this.dragHandle;
            if (handle.includes('w')) {
                obj.width += obj.x - wx;
                obj.x = wx;
            }
            if (handle.includes('e')) {
                obj.width = wx - obj.x;
            }
            if (handle.includes('n')) {
                obj.height += obj.y - wy;
                obj.y = wy;
            }
            if (handle.includes('s')) {
                obj.height = wy - obj.y;
            }
        } else if (obj.type === 'text') {
            // Text objects can be manually resized (exactly like rectangles)
            const handle = this.dragHandle;

            // Disable auto-resize when manually resizing
            obj.manualResize = true;

            // Resize using same logic as rectangles
            if (handle.includes('w')) {
                obj.width += obj.x - wx;
                obj.x = wx;
            }
            if (handle.includes('e')) {
                obj.width = wx - obj.x;
            }
            if (handle.includes('n')) {
                obj.height += obj.y - wy;
                obj.y = wy;
            }
            if (handle.includes('s')) {
                obj.height = wy - obj.y;
            }

            // Ensure minimum size
            obj.width = Math.max(obj.width, 50);
            obj.height = Math.max(obj.height, 20);

            // Update textarea if currently editing
            if (this.textEditor.isEditing && this.textEditor.getEditingObject() === obj) {
                this.textEditor.positionTextarea();
            }
        } else if (obj.type === 'line') {
            // Change orientation by moving endpoints
            if (this.dragHandle === 'start') {
                obj.x = wx;
                obj.y = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            }
            // Update stored dimensions
            obj._lineWidth = obj.x2 - obj.x;
            obj._lineHeight = obj.y2 - obj.y;
        } else if (obj.type === 'triangle') {
            const handle = this.dragHandle;
            const dx = wx - obj.x;
            const dy = wy - obj.y;

            if (handle.includes('e') || handle.includes('w')) {
                obj.width = Math.abs(dx) * 2;
            }
            if (handle.includes('n') || handle.includes('s')) {
                obj.height = Math.abs(dy) * 2;
            }
            // Maintain minimum size
            obj.width = Math.max(obj.width, 20);
            obj.height = Math.max(obj.height, 20);
        } else if (obj.type === 'hexagon') {
            const dx = wx - obj.x;
            const dy = wy - obj.y;
            obj.radius = Math.sqrt(dx * dx + dy * dy);
            obj.radius = Math.max(obj.radius, 15);
        } else if (obj.type === 'ellipse') {
            const handle = this.dragHandle;

            if (handle.includes('e') || handle.includes('w')) {
                obj.radiusX = Math.abs(wx - obj.x);
            }
            if (handle.includes('n') || handle.includes('s')) {
                obj.radiusY = Math.abs(wy - obj.y);
            }
            // Maintain minimum size
            obj.radiusX = Math.max(obj.radiusX, 10);
            obj.radiusY = Math.max(obj.radiusY, 10);
        } else if (obj.type === 'taperedLine') {
            // Move endpoints
            if (this.dragHandle === 'start') {
                obj.x1 = wx;
                obj.y1 = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            }
        } else if (obj.type === 'curvedPath') {
            // Move endpoints or control point
            if (this.dragHandle === 'start') {
                obj.x1 = wx;
                obj.y1 = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            } else if (this.dragHandle === 'control') {
                obj.controlX = wx;
                obj.controlY = wy;
            }
        } else if (obj.type === 'image') {
            const handle = this.dragHandle;

            // Resize image while maintaining aspect ratio option
            if (handle.includes('w')) {
                const newWidth = obj.width + (obj.x - wx);
                obj.x = wx;
                obj.width = Math.max(newWidth, 20);
            }
            if (handle.includes('e')) {
                obj.width = Math.max(wx - obj.x, 20);
            }
            if (handle.includes('n')) {
                const newHeight = obj.height + (obj.y - wy);
                obj.y = wy;
                obj.height = Math.max(newHeight, 20);
            }
            if (handle.includes('s')) {
                obj.height = Math.max(wy - obj.y, 20);
            }
        } else if (obj.type === 'graph') {
            const handle = this.dragHandle;

            // Resize graph container
            if (handle.includes('w')) {
                const newWidth = obj.width + (obj.x - wx);
                obj.x = wx;
                obj.width = Math.max(newWidth, 200);
            }
            if (handle.includes('e')) {
                obj.width = Math.max(wx - obj.x, 200);
            }
            if (handle.includes('n')) {
                const newHeight = obj.height + (obj.y - wy);
                obj.y = wy;
                obj.height = Math.max(newHeight, 150);
            }
            if (handle.includes('s')) {
                obj.height = Math.max(wy - obj.y, 150);
            }
        } else if (obj.type === 'unmyelinatedAxon') {
            // Move endpoints or control point
            if (this.dragHandle === 'start') {
                obj.x1 = wx;
                obj.y1 = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            } else if (this.dragHandle === 'control') {
                obj.controlX = wx;
                obj.controlY = wy;
            }
        } else if (obj.type === 'myelinatedAxon') {
            // Move endpoints
            if (this.dragHandle === 'start') {
                obj.x1 = wx;
                obj.y1 = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            }
        } else if (obj.type === 'apicalDendrite') {
            // Move endpoints
            if (this.dragHandle === 'start') {
                obj.x1 = wx;
                obj.y1 = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            }
        } else if (obj.type === 'axonHillock') {
            // Resize by adjusting length when dragging base
            if (this.dragHandle === 'base') {
                const dx = wx - obj.x;
                const dy = wy - obj.y;
                obj.x = wx;
                obj.y = wy;
                // Adjust length to maintain endpoint position
                const cos = Math.cos(obj.angle);
                const sin = Math.sin(obj.angle);
                obj.length = Math.max(20, obj.length - (dx * cos + dy * sin));
            }
        } else if (obj.type === 'bipolarSoma') {
            // Resize like ellipse
            const handle = this.dragHandle;

            if (handle.includes('e') || handle.includes('w')) {
                obj.width = Math.abs(wx - obj.x) * 2;
            }
            if (handle.includes('n') || handle.includes('s')) {
                obj.height = Math.abs(wy - obj.y) * 2;
            }
            // Ensure height > width (bipolar somas are elongated)
            obj.width = Math.max(obj.width, 15);
            obj.height = Math.max(obj.height, 20);
        } else if (obj.type === 'freehand') {
            const handle = this.dragHandle;

            // Get original bounds
            const oldBounds = this.getFreehandBounds(obj);
            if (!oldBounds) return;

            const oldWidth = oldBounds.right - oldBounds.left;
            const oldHeight = oldBounds.bottom - oldBounds.top;

            // Calculate new bounds based on handle
            let newLeft = oldBounds.left;
            let newTop = oldBounds.top;
            let newRight = oldBounds.right;
            let newBottom = oldBounds.bottom;

            if (handle.includes('w')) newLeft = wx;
            if (handle.includes('e')) newRight = wx;
            if (handle.includes('n')) newTop = wy;
            if (handle.includes('s')) newBottom = wy;

            const newWidth = newRight - newLeft;
            const newHeight = newBottom - newTop;

            // Minimum size constraints
            if (Math.abs(newWidth) < 20 || Math.abs(newHeight) < 20) return;

            // Calculate scale factors
            const scaleX = newWidth / oldWidth;
            const scaleY = newHeight / oldHeight;

            // Scale all points proportionally
            obj.points.forEach(point => {
                const relativeX = point.x - oldBounds.left;
                const relativeY = point.y - oldBounds.top;
                point.x = newLeft + relativeX * scaleX;
                point.y = newTop + relativeY * scaleY;
            });
        }
    },

    autoResizeTextbox(obj) {
        // Don't auto-resize if user manually resized the box
        if (obj.manualResize) {
            return;
        }

        if (!obj.text) {
            // Set minimum size for empty textboxes
            obj.width = Math.max(obj.width, 100);
            obj.height = Math.max(obj.height, 30);
            return;
        }

        this.ctx.save();

        // Use actual font size for measurement
        const fontSize = obj.fontSize;
        this.ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${fontSize}px ${obj.fontFamily}`;

        const lines = obj.text.split('\n');
        const lineHeight = fontSize * obj.lineHeight;
        const padding = 10; // 5px on each side

        // Calculate required width (longest line)
        let maxWidth = 0;
        lines.forEach(line => {
            if (line.trim() === '') {
                // Empty line still takes some space
                const spaceMetrics = this.ctx.measureText(' ');
                maxWidth = Math.max(maxWidth, spaceMetrics.width);
            } else {
                const metrics = this.ctx.measureText(line);
                maxWidth = Math.max(maxWidth, metrics.width);
            }
        });

        // Calculate required height
        const textHeight = lines.length * lineHeight;

        // Update textbox dimensions with minimum sizes
        obj.width = Math.max(maxWidth + padding, 50);
        obj.height = Math.max(textHeight + padding, 30);

        this.ctx.restore();
    },

    saveState() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        // Save current state
        this.history.push(JSON.parse(JSON.stringify(this.objects)));
        this.historyIndex++;
        // Limit history to 50 states
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    },

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.objects = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.selectedObjects = [];
            this.updatePropertiesPanel();
            this.render();
        }
    },

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.objects = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.selectedObjects = [];
            this.updatePropertiesPanel();
            this.render();
        }
    },

    copy() {
        if (this.selectedObjects.length > 0) {
            this.clipboard = JSON.parse(JSON.stringify(this.selectedObjects));
        }
    },

    paste() {
        if (this.clipboard && this.clipboard.length > 0) {
            this.selectedObjects = [];
            this.clipboard.forEach(obj => {
                const newObj = JSON.parse(JSON.stringify(obj));
                newObj.x += 20;
                newObj.y += 20;
                if (newObj.type === 'line') {
                    newObj.x2 += 20;
                    newObj.y2 += 20;
                }
                this.objects.push(newObj);
                this.selectedObjects.push(newObj);
            });
            this.clipboard = JSON.parse(JSON.stringify(this.selectedObjects));
            this.saveState();
            this.updatePropertiesPanel();
            this.render();
        }
    },

    duplicate() {
        if (this.selectedObjects.length > 0) {
            const newObjects = [];
            this.selectedObjects.forEach(obj => {
                const newObj = JSON.parse(JSON.stringify(obj));
                newObj.x += 20;
                newObj.y += 20;
                if (newObj.type === 'line') {
                    newObj.x2 += 20;
                    newObj.y2 += 20;
                    newObj._lineWidth = newObj.x2 - newObj.x;
                    newObj._lineHeight = newObj.y2 - newObj.y;
                } else if (newObj.type === 'freehand') {
                    // Move all points for freehand
                    if (newObj.points) {
                        newObj.points.forEach(point => {
                            point.x += 20;
                            point.y += 20;
                        });
                    }
                } else if (newObj.type === 'graph') {
                    // Deep copy graph data structures
                    newObj.curvePoints = JSON.parse(JSON.stringify(newObj.curvePoints));
                    newObj.thresholdLine = {...newObj.thresholdLine};
                    newObj.restingLine = {...newObj.restingLine};
                    newObj.annotations = [...newObj.annotations];
                }
                this.objects.push(newObj);
                newObjects.push(newObj);
            });
            this.selectedObjects = newObjects;
            this.saveState();
            this.updatePropertiesPanel();
            this.render();
        }
    },

    selectAll() {
        this.selectedObjects = [...this.objects];
        this.updatePropertiesPanel();
        this.render();
    },

    getFreehandBounds(obj) {
        if (!obj.points || obj.points.length === 0) return null;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        obj.points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });

        return {left: minX, right: maxX, top: minY, bottom: maxY};
    },

    rectangleIntersectsObject(boxBounds, obj) {
        // Helper: Check if two rectangles overlap
        const rectOverlap = (r1, r2) => {
            return !(r1.right < r2.left ||
                     r1.left > r2.right ||
                     r1.bottom < r2.top ||
                     r1.top > r2.bottom);
        };

        if (obj.type === 'circle') {
            // Check if circle intersects with box
            const closestX = Math.max(boxBounds.left, Math.min(obj.x, boxBounds.right));
            const closestY = Math.max(boxBounds.top, Math.min(obj.y, boxBounds.bottom));
            const distanceX = obj.x - closestX;
            const distanceY = obj.y - closestY;
            const distanceSquared = distanceX * distanceX + distanceY * distanceY;
            return distanceSquared <= (obj.radius * obj.radius);
        } else if (obj.type === 'rectangle') {
            const objBounds = {
                left: Math.min(obj.x, obj.x + obj.width),
                right: Math.max(obj.x, obj.x + obj.width),
                top: Math.min(obj.y, obj.y + obj.height),
                bottom: Math.max(obj.y, obj.y + obj.height)
            };
            return rectOverlap(boxBounds, objBounds);
        } else if (obj.type === 'line') {
            // Check if either endpoint is in box or if line intersects box
            const p1Inside = obj.x >= boxBounds.left && obj.x <= boxBounds.right &&
                           obj.y >= boxBounds.top && obj.y <= boxBounds.bottom;
            const p2Inside = obj.x2 >= boxBounds.left && obj.x2 <= boxBounds.right &&
                           obj.y2 >= boxBounds.top && obj.y2 <= boxBounds.bottom;
            return p1Inside || p2Inside;
        } else if (obj.type === 'text') {
            const objBounds = {
                left: obj.x,
                right: obj.x + obj.width,
                top: obj.y,
                bottom: obj.y + obj.height
            };
            return rectOverlap(boxBounds, objBounds);
        } else if (obj.type === 'triangle' || obj.type === 'hexagon' || obj.type === 'ellipse') {
            // Use bounding box for these shapes
            const objBounds = {
                left: obj.x - obj.size,
                right: obj.x + obj.size,
                top: obj.y - obj.size,
                bottom: obj.y + obj.size
            };
            return rectOverlap(boxBounds, objBounds);
        } else if (obj.type === 'taperedLine' || obj.type === 'curvedPath') {
            // Check if either endpoint is in box
            const p1Inside = obj.x1 >= boxBounds.left && obj.x1 <= boxBounds.right &&
                           obj.y1 >= boxBounds.top && obj.y1 <= boxBounds.bottom;
            const p2Inside = obj.x2 >= boxBounds.left && obj.x2 <= boxBounds.right &&
                           obj.y2 >= boxBounds.top && obj.y2 <= boxBounds.bottom;
            return p1Inside || p2Inside;
        } else if (obj.type === 'freehand') {
            // Check if any point is inside the box
            if (obj.points && obj.points.length > 0) {
                return obj.points.some(point =>
                    point.x >= boxBounds.left && point.x <= boxBounds.right &&
                    point.y >= boxBounds.top && point.y <= boxBounds.bottom
                );
            }
            return false;
        } else if (obj.type === 'image') {
            const objBounds = {
                left: obj.x,
                right: obj.x + obj.width,
                top: obj.y,
                bottom: obj.y + obj.height
            };
            return rectOverlap(boxBounds, objBounds);
        }
        return false;
    },

    render() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.ctx.fillStyle = this.isDarkMode ? '#000000' : '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        if (this.showGrid) {
            this.ctx.strokeStyle = this.isDarkMode ? '#333333' : '#E0E0E0';
            this.ctx.lineWidth = 1;
            const gridSize = 20;
            const startX = Math.floor(-this.panX / this.zoom / gridSize) * gridSize;
            const startY = Math.floor(-this.panY / this.zoom / gridSize) * gridSize;
            const endX = startX + this.canvas.width / this.zoom + gridSize;
            const endY = startY + this.canvas.height / this.zoom + gridSize;

            for (let x = startX; x < endX; x += gridSize) {
                const sx = this.worldToScreen(x, 0).x;
                this.ctx.beginPath();
                this.ctx.moveTo(sx, 0);
                this.ctx.lineTo(sx, this.canvas.height);
                this.ctx.stroke();
            }
            for (let y = startY; y < endY; y += gridSize) {
                const sy = this.worldToScreen(0, y).y;
                this.ctx.beginPath();
                this.ctx.moveTo(0, sy);
                this.ctx.lineTo(this.canvas.width, sy);
                this.ctx.stroke();
            }
        }

        // Apply transform
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // Get currently editing object
        const editingObj = this.textEditor.getEditingObject();

        // Draw objects (skip the one being edited)
        this.objects.forEach(obj => {
            drawObject(this.ctx, obj, editingObj, this.zoom, this.isDarkMode);
        });

        // Draw temp object
        if (this.tempObj) {
            drawObject(this.ctx, this.tempObj, editingObj, this.zoom, this.isDarkMode);

            // Show dimensions while drawing
            if (this.isDrawing && this.tempObj.type !== 'freehand') {
                let width, height;
                if (this.tempObj.type === 'line' || this.tempObj.type === 'taperedLine') {
                    width = this.tempObj.x2 - this.tempObj.x;
                    height = this.tempObj.y2 - this.tempObj.y;
                } else if (this.tempObj.type === 'circle') {
                    width = this.tempObj.radius * 2;
                    height = this.tempObj.radius * 2;
                } else {
                    width = this.tempObj.width || 0;
                    height = this.tempObj.height || 0;
                }

                this.drawDimensionLabel(this.tempObj.x, this.tempObj.y, width, height, this.tempObj.type);
            }
        }

        // Draw selection (skip objects being edited)
        this.selectedObjects.forEach(obj => {
            if (obj !== editingObj) {
                drawSelection(this.ctx, obj, this.zoom, this.isDarkMode);
                // Draw graph control points if selected
                if (obj.type === 'graph') {
                    drawGraphSelection(this.ctx, obj, this.zoom);
                }

                // Show dimensions while resizing
                if (this.dragHandle && this.dragHandle.length > 0) {
                    let width, height;
                    if (obj.type === 'line' || obj.type === 'taperedLine') {
                        width = obj.x2 - obj.x;
                        height = obj.y2 - obj.y;
                    } else if (obj.type === 'circle') {
                        width = obj.radius * 2;
                        height = obj.radius * 2;
                    } else if (obj.type === 'freehand') {
                        const bounds = getFreehandBounds(obj);
                        width = bounds.width;
                        height = bounds.height;
                    } else {
                        width = obj.width || 0;
                        height = obj.height || 0;
                    }

                    this.drawDimensionLabel(obj.x, obj.y, width, height, obj.type);
                }
            }
        });

        // Draw selection box if active
        if (this.isDrawingSelectionBox && this.selectionBoxStart && this.selectionBoxEnd) {
            const x1 = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const y1 = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
            const x2 = Math.max(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const y2 = Math.max(this.selectionBoxStart.y, this.selectionBoxEnd.y);
            const width = x2 - x1;
            const height = y2 - y1;

            this.ctx.save();
            this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
            this.ctx.strokeStyle = '#3498DB';
            this.ctx.lineWidth = 2 / this.zoom;
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
            this.ctx.fillRect(x1, y1, width, height);
            this.ctx.strokeRect(x1, y1, width, height);
            this.ctx.restore();
        }

        // Draw tooltip if hovering over graph control point
        if (this.hoveredGraphPoint !== null && this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
            const graph = this.selectedObjects[0];
            const point = graph.curvePoints[this.hoveredGraphPoint];

            if (point && point.tooltip) {
                // graphToCanvas is already imported at top of file
                const canvasPos = graphToCanvas(point.x, point.y, graph);
                this.drawTooltip(canvasPos.x, canvasPos.y, point.tooltip);
            }
        }

        this.ctx.restore();
    },

    drawTooltip(x, y, text) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for tooltip

        // Convert world coordinates to screen coordinates
        const screenX = (x * this.zoom) + this.panX;
        const screenY = (y * this.zoom) + this.panY;

        // Tooltip styling
        const padding = 12;
        const maxWidth = 350;
        const lineHeight = 18;
        this.ctx.font = '13px Arial';

        // Word wrap the tooltip text
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);

            if (metrics.width > maxWidth - padding * 2) {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        // Calculate tooltip dimensions
        const tooltipWidth = Math.min(maxWidth, Math.max(...lines.map(line => this.ctx.measureText(line).width)) + padding * 2);
        const tooltipHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip (above and to the right of point, or below if too high)
        let tooltipX = screenX + 15;
        let tooltipY = screenY - tooltipHeight - 10;

        // Keep tooltip on screen
        if (tooltipX + tooltipWidth > this.canvas.width) {
            tooltipX = screenX - tooltipWidth - 15;
        }
        if (tooltipY < 0) {
            tooltipY = screenY + 25;
        }

        // Draw tooltip background
        this.ctx.fillStyle = this.isDarkMode ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = this.isDarkMode ? '#666' : '#CCC';
        this.ctx.lineWidth = 1;

        // Rounded rectangle
        const radius = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(tooltipX + radius, tooltipY);
        this.ctx.lineTo(tooltipX + tooltipWidth - radius, tooltipY);
        this.ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + radius);
        this.ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - radius);
        this.ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - radius, tooltipY + tooltipHeight);
        this.ctx.lineTo(tooltipX + radius, tooltipY + tooltipHeight);
        this.ctx.quadraticCurveTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - radius);
        this.ctx.lineTo(tooltipX, tooltipY + radius);
        this.ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + radius, tooltipY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw tooltip text
        this.ctx.fillStyle = this.isDarkMode ? '#FFF' : '#000';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        lines.forEach((line, i) => {
            this.ctx.fillText(line, tooltipX + padding, tooltipY + padding + i * lineHeight);
        });

        this.ctx.restore();
    },

    drawDimensionLabel(x, y, width, height, objectType) {
        if (!this.showDimensions) return;

        const ctx = this.ctx;
        const zoom = this.zoom;

        // Calculate dimension text based on object type
        let dimensionText;
        if (objectType === 'line' || objectType === 'taperedLine') {
            const length = Math.sqrt(width * width + height * height);
            const angle = Math.atan2(height, width) * 180 / Math.PI;
            dimensionText = `${length.toFixed(0)}px @ ${angle.toFixed(0)}°`;
        } else {
            dimensionText = `${Math.abs(width).toFixed(0)} × ${Math.abs(height).toFixed(0)}`;
        }

        // Unit conversion if not in pixels
        if (this.dimensionUnits !== 'px') {
            const factor = this.getUnitConversionFactor();
            if (objectType === 'line' || objectType === 'taperedLine') {
                const length = Math.sqrt(width * width + height * height);
                dimensionText = `${(length * factor).toFixed(2)}${this.dimensionUnits}`;
            } else {
                dimensionText = `${(Math.abs(width) * factor).toFixed(2)} × ${(Math.abs(height) * factor).toFixed(2)} ${this.dimensionUnits}`;
            }
        }

        ctx.save();

        // Position the label slightly above and to the right of the object
        const labelX = x + width / 2;
        const labelY = y - 20 / zoom;

        // Measure text for background
        ctx.font = `${12 / zoom}px Arial`;
        const metrics = ctx.measureText(dimensionText);
        const padding = 4 / zoom;
        const labelWidth = metrics.width + padding * 2;
        const labelHeight = 16 / zoom;

        // Draw semi-transparent background
        ctx.fillStyle = this.isDarkMode ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);

        // Draw border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);

        // Draw text
        ctx.fillStyle = this.isDarkMode ? '#fff' : '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dimensionText, labelX, labelY);

        ctx.restore();
    },

    getUnitConversionFactor() {
        // Convert pixels to other units based on DPI
        const pixelsPerInch = this.dpiForExport;
        switch (this.dimensionUnits) {
            case 'mm':
                return 25.4 / pixelsPerInch;
            case 'cm':
                return 2.54 / pixelsPerInch;
            case 'in':
                return 1 / pixelsPerInch;
            default:
                return 1; // pixels
        }
    },

    updatePropertiesPanel() {
        const propsContent = document.getElementById('propsContent');
        const textPropsContent = document.getElementById('textPropsContent');
        const taperedLinePropsContent = document.getElementById('taperedLinePropsContent');
        const curvedPathPropsContent = document.getElementById('curvedPathPropsContent');
        const imagePropsContent = document.getElementById('imagePropsContent');
        const graphPropsContent = document.getElementById('graphPropsContent');
        const propsInfo = document.getElementById('propsInfo');

        if (this.selectedObjects.length === 1) {
            const obj = this.selectedObjects[0];

            if (obj.type === 'graph') {
                // Show graph properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'none';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'block';
                propsInfo.style.display = 'none';

                // Update graph property values
                document.getElementById('graphWidth').value = obj.width;
                document.getElementById('graphHeight').value = obj.height;
                document.getElementById('graphLineColor').value = obj.lineColor;
                document.getElementById('graphLineWidth').value = obj.lineWidth;
                document.getElementById('graphType').value = obj.graphType;
                document.getElementById('graphBackground').value = obj.backgroundColor;

                // Update preset options based on graph type
                const presetSelect = document.getElementById('graphPreset');
                presetSelect.innerHTML = '';
                const presets = GRAPH_PRESETS[obj.graphType];
                for (const [key, preset] of Object.entries(presets)) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = preset.name;
                    presetSelect.appendChild(option);
                }
                presetSelect.value = obj.presetName || Object.keys(presets)[0];

                // Update toggle buttons
                const gridBtn = document.getElementById('graphGridToggle');
                if (gridBtn) gridBtn.textContent = obj.showGrid ? 'Enabled' : 'Disabled';
                const labelsBtn = document.getElementById('graphLabelsToggle');
                if (labelsBtn) labelsBtn.textContent = obj.showLabels ? 'Enabled' : 'Disabled';

            } else if (obj.type === 'text') {
                // Show text properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'block';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                propsInfo.style.display = 'none';

                // Update text property values
                document.getElementById('fontFamily').value = obj.fontFamily;
                document.getElementById('fontSize').value = obj.fontSize;
                document.getElementById('textColor').value = obj.textColor;
                document.getElementById('textAlign').value = obj.textAlign;
                document.getElementById('lineHeight').value = obj.lineHeight;
                document.getElementById('lineHeightValue').textContent = obj.lineHeight;
                document.getElementById('backgroundColor').value = obj.backgroundColor === 'transparent' ? '#ffffff' : obj.backgroundColor;

                // Update style buttons
                document.getElementById('boldBtn').classList.toggle('active', obj.fontWeight === 'bold');
                document.getElementById('italicBtn').classList.toggle('active', obj.fontStyle === 'italic');
                document.getElementById('underlineBtn').classList.toggle('active', obj.textDecoration === 'underline');

                // Update border button
                const borderBtn = document.getElementById('borderToggle');
                borderBtn.classList.toggle('active', obj.hasBorder);
                borderBtn.textContent = obj.hasBorder ? 'Disable Border' : 'Enable Border';

            } else if (obj.type === 'taperedLine') {
                // Show tapered line properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'none';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'block';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                propsInfo.style.display = 'none';

                // Update tapered line property values
                if (document.getElementById('baseWidth')) {
                    document.getElementById('baseWidth').value = obj.baseWidth || 6;
                }
                if (document.getElementById('tipWidth')) {
                    document.getElementById('tipWidth').value = obj.tipWidth || 2;
                }
                if (document.getElementById('taperedLineColor')) {
                    document.getElementById('taperedLineColor').value = obj.strokeColor || '#FF8A42';
                }
                if (document.getElementById('processType')) {
                    document.getElementById('processType').value = obj.isDendrite ? 'dendrite' : 'axon';
                }

                // Update gradient toggle
                const gradientBtn = document.getElementById('gradientToggle');
                if (gradientBtn) {
                    gradientBtn.classList.toggle('active', obj.showGradient);
                    gradientBtn.textContent = obj.showGradient ? 'Enabled' : 'Disabled';
                }

            } else if (obj.type === 'curvedPath') {
                // Show curved path properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'none';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'block';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                propsInfo.style.display = 'none';

                // Update curved path property values
                if (document.getElementById('curvedPathWidth')) {
                    document.getElementById('curvedPathWidth').value = obj.strokeWidth || 3;
                }
                if (document.getElementById('curvedPathColor')) {
                    document.getElementById('curvedPathColor').value = obj.strokeColor || '#A93226';
                }

            } else if (obj.type === 'image') {
                // Show image properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'none';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'block';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                propsInfo.style.display = 'none';

                // Update image property values
                if (document.getElementById('imageOpacity')) {
                    document.getElementById('imageOpacity').value = obj.opacity || 1.0;
                    document.getElementById('imageOpacityValue').textContent = Math.round((obj.opacity || 1.0) * 100) + '%';
                }
                if (document.getElementById('imageOriginalSize')) {
                    document.getElementById('imageOriginalSize').textContent =
                        `${obj.originalWidth} × ${obj.originalHeight}px`;
                }

            } else {
                // Show regular properties
                propsContent.style.display = 'block';
                textPropsContent.style.display = 'none';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                propsInfo.style.display = 'none';

                // Show/hide dimension inputs based on object type
                const dimensionInputRow = document.getElementById('dimensionInputRow');
                const dimensionInputRow2 = document.getElementById('dimensionInputRow2');
                const radiusInputRow = document.getElementById('radiusInputRow');
                const positionInputRow = document.getElementById('positionInputRow');
                const rotationInputRow = document.getElementById('rotationInputRow');

                // Show rotation for all objects
                rotationInputRow.style.display = 'flex';
                document.getElementById('objectRotation').value = Math.round(obj.rotation || 0);

                if (obj.type === 'circle') {
                    // Show radius for circles
                    dimensionInputRow.style.display = 'none';
                    dimensionInputRow2.style.display = 'none';
                    radiusInputRow.style.display = 'flex';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectRadius').value = Math.round(obj.radius);
                    document.getElementById('objectX').value = Math.round(obj.x);
                    document.getElementById('objectY').value = Math.round(obj.y);
                } else if (obj.type === 'line' || obj.type === 'taperedLine') {
                    // Show position only for lines
                    dimensionInputRow.style.display = 'none';
                    dimensionInputRow2.style.display = 'none';
                    radiusInputRow.style.display = 'none';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectX').value = Math.round(obj.x);
                    document.getElementById('objectY').value = Math.round(obj.y);
                } else if (obj.type === 'rectangle' || obj.type === 'triangle' ||
                           obj.type === 'hexagon' || obj.type === 'ellipse') {
                    // Show width and height for rectangles and shapes
                    dimensionInputRow.style.display = 'flex';
                    dimensionInputRow2.style.display = 'flex';
                    radiusInputRow.style.display = 'none';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectWidth').value = Math.round(obj.width);
                    document.getElementById('objectHeight').value = Math.round(obj.height);
                    document.getElementById('objectX').value = Math.round(obj.x);
                    document.getElementById('objectY').value = Math.round(obj.y);
                } else if (obj.type === 'freehand') {
                    // Show width and height calculated from bounds
                    const bounds = this.getFreehandBounds(obj);
                    dimensionInputRow.style.display = 'flex';
                    dimensionInputRow2.style.display = 'flex';
                    radiusInputRow.style.display = 'none';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectWidth').value = Math.round(bounds.width);
                    document.getElementById('objectHeight').value = Math.round(bounds.height);
                    document.getElementById('objectX').value = Math.round(bounds.x);
                    document.getElementById('objectY').value = Math.round(bounds.y);
                } else {
                    // Hide all dimension inputs for unsupported types
                    dimensionInputRow.style.display = 'none';
                    dimensionInputRow2.style.display = 'none';
                    radiusInputRow.style.display = 'none';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectX').value = Math.round(obj.x);
                    document.getElementById('objectY').value = Math.round(obj.y);
                }

                if (obj.fillColor !== undefined) {
                    document.getElementById('fillColor').value = obj.fillColor === 'transparent' ? '#000000' : obj.fillColor;
                }
                if (obj.strokeColor !== undefined) {
                    document.getElementById('strokeColor').value = obj.strokeColor;
                }
                if (obj.strokeWidth !== undefined) {
                    document.getElementById('strokeWidth').value = obj.strokeWidth;
                }
            }
        } else {
            propsContent.style.display = 'none';
            textPropsContent.style.display = 'none';
            if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
            if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
            if (imagePropsContent) imagePropsContent.style.display = 'none';
            if (graphPropsContent) graphPropsContent.style.display = 'none';
            propsInfo.style.display = 'block';
        }
    },

    updateSelectedProp(prop, value) {
        if (this.selectedObjects.length !== 1) return;
        const obj = this.selectedObjects[0];

        if (prop === 'fillColor' || prop === 'strokeColor' || prop === 'textColor' || prop === 'backgroundColor' || prop === 'borderColor') {
            obj[prop] = value;
        } else if (prop === 'strokeWidth' || prop === 'fontSize' || prop === 'lineHeight' || prop === 'borderWidth' || prop === 'borderRadius' || prop === 'opacity') {
            obj[prop] = parseFloat(value);
            if (prop === 'lineHeight') {
                document.getElementById('lineHeightValue').textContent = value;
            } else if (prop === 'opacity') {
                document.getElementById('imageOpacityValue').textContent = Math.round(parseFloat(value) * 100) + '%';
            }
            // Auto-resize text objects when font properties change
            if (obj.type === 'text' && (prop === 'fontSize' || prop === 'lineHeight')) {
                this.autoResizeTextbox(obj);
            }
        } else if (prop === 'fontFamily' || prop === 'textAlign') {
            obj[prop] = value;
            // Auto-resize text objects when font family changes
            if (obj.type === 'text' && prop === 'fontFamily') {
                this.autoResizeTextbox(obj);
            }
        }

        this.saveState();
        this.render();
    },

    updateObjectDimension(prop, value) {
        if (this.selectedObjects.length !== 1) return;
        const obj = this.selectedObjects[0];
        const numValue = parseFloat(value);

        if (isNaN(numValue)) return;

        if (prop === 'width') {
            if (obj.type === 'rectangle' || obj.type === 'text' || obj.type === 'triangle' ||
                obj.type === 'hexagon' || obj.type === 'ellipse' || obj.type === 'graph') {
                obj.width = Math.max(numValue, 1);
            } else if (obj.type === 'freehand') {
                // Scale freehand proportionally
                const bounds = this.getFreehandBounds(obj);
                const scaleX = numValue / bounds.width;
                obj.points = obj.points.map(p => ({
                    x: bounds.x + (p.x - bounds.x) * scaleX,
                    y: p.y
                }));
            }
        } else if (prop === 'height') {
            if (obj.type === 'rectangle' || obj.type === 'text' || obj.type === 'triangle' ||
                obj.type === 'hexagon' || obj.type === 'ellipse' || obj.type === 'graph') {
                obj.height = Math.max(numValue, 1);
            } else if (obj.type === 'freehand') {
                // Scale freehand proportionally
                const bounds = this.getFreehandBounds(obj);
                const scaleY = numValue / bounds.height;
                obj.points = obj.points.map(p => ({
                    x: p.x,
                    y: bounds.y + (p.y - bounds.y) * scaleY
                }));
            }
        } else if (prop === 'radius') {
            if (obj.type === 'circle') {
                obj.radius = Math.max(numValue, 1);
            }
        } else if (prop === 'x') {
            obj.x = numValue;
        } else if (prop === 'y') {
            obj.y = numValue;
        } else if (prop === 'rotation') {
            // Normalize rotation to 0-360 degrees
            obj.rotation = numValue % 360;
            if (obj.rotation < 0) obj.rotation += 360;
        }

        this.saveState();
        this.render();
        this.updatePropertiesPanel();
    },

    toggleTextStyle(style) {
        if (this.selectedObjects.length !== 1 || this.selectedObjects[0].type !== 'text') return;
        const obj = this.selectedObjects[0];

        if (style === 'bold') {
            obj.fontWeight = obj.fontWeight === 'bold' ? 'normal' : 'bold';
        } else if (style === 'italic') {
            obj.fontStyle = obj.fontStyle === 'italic' ? 'normal' : 'italic';
        } else if (style === 'underline') {
            obj.textDecoration = obj.textDecoration === 'underline' ? 'none' : 'underline';
        }

        // Auto-resize after style change (bold/italic can affect text width)
        this.autoResizeTextbox(obj);

        this.updatePropertiesPanel();
        this.saveState();
        this.render();
    },

    toggleTextBorder() {
        if (this.selectedObjects.length !== 1 || this.selectedObjects[0].type !== 'text') return;
        const obj = this.selectedObjects[0];

        obj.hasBorder = !obj.hasBorder;

        this.updatePropertiesPanel();
        this.saveState();
        this.render();
    },

    // Generic property toggle
    toggleProp(prop) {
        if (this.selectedObjects.length !== 1) return;
        const obj = this.selectedObjects[0];

        obj[prop] = !obj[prop];

        // Update button text
        const btn = document.getElementById('gradientToggle');
        if (btn && prop === 'showGradient') {
            btn.textContent = obj[prop] ? 'Enabled' : 'Disabled';
        }

        this.saveState();
        this.render();
    },

    toggleNeuronProp(prop) {
        if (this.selectedObjects.length !== 1 || this.selectedObjects[0].type !== 'neuron') return;
        const obj = this.selectedObjects[0];

        obj[prop] = !obj[prop];

        this.updatePropertiesPanel();
        this.saveState();
        this.render();
    },

    updateGraphType(graphType) {
        if (this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
            const graph = this.selectedObjects[0];
            const presets = GRAPH_PRESETS[graphType];
            if (presets) {
                const firstPresetName = Object.keys(presets)[0];
                applyPreset(graph, graphType, firstPresetName);
                this.updatePropertiesPanel();
                this.render();
                this.saveState();
            }
        }
    },

    updateGraphPreset(presetName) {
        if (this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
            const graph = this.selectedObjects[0];
            applyPreset(graph, graph.graphType, presetName);
            this.render();
            this.saveState();
        }
    },

    toggleGraphProp(propName) {
        if (this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'graph') {
            const graph = this.selectedObjects[0];
            graph[propName] = !graph[propName];
            const btn = document.getElementById(`graph${propName.charAt(0).toUpperCase() + propName.slice(1)}Toggle`);
            if (btn) btn.textContent = graph[propName] ? 'Enabled' : 'Disabled';
            this.render();
            this.saveState();
        }
    },

    toggleGrid() {
        this.showGrid = !this.showGrid;
        const btn = document.getElementById('gridToggle');
        btn.classList.toggle('active');
        btn.textContent = this.showGrid ? 'Hide Grid' : 'Show Grid';
        this.render();
    },

    toggleDimensions() {
        this.showDimensions = !this.showDimensions;
        const btn = document.getElementById('dimensionsToggle');
        btn.classList.toggle('active');
        btn.textContent = this.showDimensions ? 'Hide Dimensions' : 'Show Dimensions';
        this.render();
    },

    setDimensionUnits(units) {
        this.dimensionUnits = units;
        this.render();
    },

    setDimensionDPI(dpi) {
        this.dpiForExport = parseInt(dpi) || 96;
        this.render();
    },

    toggleShortcuts() {
        const list = document.getElementById('shortcutsList');
        const arrow = document.getElementById('shortcutArrow');

        if (list.style.display === 'none' || list.style.display === '') {
            list.style.display = 'block';
            arrow.style.transform = 'rotate(180deg)';
        } else {
            list.style.display = 'none';
            arrow.style.transform = 'rotate(0deg)';
        }
    },

    setZoom(value) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const newZoom = value / 100;
        this.panX = centerX - (centerX - this.panX) * (newZoom / this.zoom);
        this.panY = centerY - (centerY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;

        document.getElementById('zoomValue').textContent = Math.round(this.zoom * 100) + '%';
        this.textEditor.updatePosition();
        this.render();
    },

    togglePanel() {
        const panel = document.getElementById('rightPanel');
        const btn = document.getElementById('collapseBtn');
        panel.classList.toggle('collapsed');
        btn.classList.toggle('collapsed');
        btn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';

        // Resize canvas after panel animation completes
        // Listen for transition end to ensure canvas resizes when panel width changes
        const handleTransitionEnd = (e) => {
            if (e.propertyName === 'width') {
                this.resizeCanvas();
                if (this.textEditor) {
                    this.textEditor.updatePosition();
                }
                panel.removeEventListener('transitionend', handleTransitionEnd);
            }
        };
        panel.addEventListener('transitionend', handleTransitionEnd);

        // Fallback in case transition doesn't fire
        setTimeout(() => {
            this.resizeCanvas();
            if (this.textEditor) {
                this.textEditor.updatePosition();
            }
        }, 350);
    },

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const body = document.body;
        const btn = document.getElementById('themeToggle');

        if (this.isDarkMode) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            btn.textContent = 'Light Mode';
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            btn.textContent = 'Dark Mode';
        }

        this.render();
    },

    newCanvas() {
        if (this.objects.length > 0) {
            if (!confirm('Clear canvas? All objects will be deleted.')) return;
        }
        this.objects = [];
        this.selectedObjects = [];
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.history = [];
        this.historyIndex = -1;
        document.getElementById('zoomSlider').value = 100;
        document.getElementById('zoomValue').textContent = '100%';
        this.saveState();
        this.updatePropertiesPanel();
        this.render();
    },

    save() {
        const data = {
            objects: this.objects,
            panX: this.panX,
            panY: this.panY,
            zoom: this.zoom,
            isDarkMode: this.isDarkMode
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'neurosketch_' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    load() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.objects = data.objects || [];

                    // Restore image elements from base64 data
                    this.objects.forEach(obj => {
                        if (obj.type === 'image' && obj.src && !obj.imageElement) {
                            const img = new Image();
                            img.onload = () => {
                                obj.imageElement = img;
                                this.render();
                            };
                            img.src = obj.src;
                        }
                    });

                    this.panX = data.panX || 0;
                    this.panY = data.panY || 0;
                    this.zoom = data.zoom || 1;
                    this.selectedObjects = [];
                    this.history = [];
                    this.historyIndex = -1;

                    if (data.isDarkMode !== undefined && data.isDarkMode !== this.isDarkMode) {
                        this.toggleTheme();
                    }

                    document.getElementById('zoomSlider').value = this.zoom * 100;
                    document.getElementById('zoomValue').textContent = Math.round(this.zoom * 100) + '%';
                    this.saveState();
                    this.updatePropertiesPanel();
                    this.render();
                } catch (err) {
                    alert('Error loading file: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    export() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        this.objects.forEach(obj => {
            if (obj.type === 'circle') {
                minX = Math.min(minX, obj.x - obj.radius);
                maxX = Math.max(maxX, obj.x + obj.radius);
                minY = Math.min(minY, obj.y - obj.radius);
                maxY = Math.max(maxY, obj.y + obj.radius);
            } else if (obj.type === 'rectangle') {
                minX = Math.min(minX, obj.x, obj.x + obj.width);
                maxX = Math.max(maxX, obj.x, obj.x + obj.width);
                minY = Math.min(minY, obj.y, obj.y + obj.height);
                maxY = Math.max(maxY, obj.y, obj.y + obj.height);
            } else if (obj.type === 'line') {
                minX = Math.min(minX, obj.x, obj.x2);
                maxX = Math.max(maxX, obj.x, obj.x2);
                minY = Math.min(minY, obj.y, obj.y2);
                maxY = Math.max(maxY, obj.y, obj.y2);
            } else if (obj.type === 'text') {
                minX = Math.min(minX, obj.x);
                maxX = Math.max(maxX, obj.x + obj.width);
                minY = Math.min(minY, obj.y);
                maxY = Math.max(maxY, obj.y + obj.height);
            } else if (obj.type === 'freehand') {
                // Calculate bounds from all points
                if (obj.points && obj.points.length > 0) {
                    obj.points.forEach(point => {
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);
                        minY = Math.min(minY, point.y);
                        maxY = Math.max(maxY, point.y);
                    });
                }
            }
        });

        if (!isFinite(minX)) {
            alert('No objects to export!');
            return;
        }

        const padding = 20;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const exportCtx = exportCanvas.getContext('2d');

        exportCtx.fillStyle = this.isDarkMode ? '#000000' : '#FFFFFF';
        exportCtx.fillRect(0, 0, width, height);

        exportCtx.translate(-minX + padding, -minY + padding);

        this.objects.forEach(obj => {
            drawObject(exportCtx, obj, null, 1, this.isDarkMode);
        });

        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'neurosketch_export_' + Date.now() + '.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    },

    importImage() {
        // Trigger file input
        document.getElementById('imageInput').click();
    },

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match('image/(png|jpeg|jpg)')) {
            alert('Please select a PNG or JPEG image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create image object at center of viewport
                const centerX = -this.panX / this.zoom + (this.canvas.width / 2) / this.zoom;
                const centerY = -this.panY / this.zoom + (this.canvas.height / 2) / this.zoom;

                // Calculate display size (max 400px width/height while maintaining aspect ratio)
                let width = img.width;
                let height = img.height;
                const maxSize = 400;

                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                const imageObj = {
                    type: 'image',
                    x: centerX - width / 2,
                    y: centerY - height / 2,
                    width: width,
                    height: height,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    src: e.target.result, // Base64 data URL
                    opacity: 1.0,
                    imageElement: img // Store loaded image
                };

                this.objects.push(imageObj);
                this.selectedObjects = [imageObj];
                this.saveState();
                this.updatePropertiesPanel();

                // Auto-switch to select tool so user can immediately move/resize the image
                this.switchToSelectTool();

                this.render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Clear input so same file can be selected again
        event.target.value = '';
    }
};