/**
 * app.js - Main application orchestrator for NeuroSketch
 * Manages canvas, state, selection, and integrates with TextEditor and CanvasRenderer
 */

// NEW: Core architecture systems
import { StateMachine, InteractionState } from './src/core/StateMachine.js';
import { ToolManager } from './src/core/ToolManager.js';
import { CommandHistory, AddObjectCommand } from './src/core/CommandHistory.js';
// SynapseTool removed - will rebuild later
import { StateValidator } from './src/core/StateValidator.js';
import {
    initializeArchitecture,
    switchToolWithValidation,
    validateStateLoop,
    getArchitectureStatus
} from './src/core/ArchitectureIntegration.js';

// NEW: Import all Tool classes
// CORE TOOLS - Working perfectly
import { SelectTool } from './src/tools/SelectTool.js';
import { CircleTool } from './src/tools/CircleTool.js';
import { RectangleTool } from './src/tools/RectangleTool.js';
import { LineTool } from './src/tools/LineTool.js';
import { TriangleTool } from './src/tools/TriangleTool.js';
import { SquareTool } from './src/tools/SquareTool.js';
import { PentagonTool } from './src/tools/PentagonTool.js';
import { HexagonTool } from './src/tools/HexagonTool.js';
import { HeptagonTool } from './src/tools/HeptagonTool.js';
import { OctagonTool } from './src/tools/OctagonTool.js';
import { NonagonTool } from './src/tools/NonagonTool.js';
import { DecagonTool } from './src/tools/DecagonTool.js';
import { TextTool } from './src/tools/TextTool.js';
import { FreehandTool } from './src/tools/FreehandTool.js';

import { TextEditor } from './textEditor.js';
import { drawObject, drawSelection, drawGraphSelection } from './canvasRenderer.js';
import { renderSynapse, renderSynapsePreview } from './synapseRenderer.js';
import * as signalAnimation from './signalAnimation.js';
// Circuit templates removed - will rebuild later

export const app = {
    canvas: null,
    ctx: null,
    textEditor: null,
    objects: [],
    selectedObjects: [],

    // NEW: Core architecture systems
    stateMachine: null,
    toolManager: null,
    commandHistory: null,

    // OLD: Keep for backward compatibility during transition
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
    isDarkMode: true,
    history: [],
    historyIndex: -1,
    clipboard: null,
    lastClickTime: null,
    isDrawingSelectionBox: false,
    selectionBoxStart: null,
    selectionBoxEnd: null,
    isDraggingGraphControlPoint: false,
    graphControlPointIndex: null,
    
    // Tab cycling through overlapping objects
    lastClickWorldPos: null,
    objectsAtLastClick: [],
    tabCycleIndex: 0,
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
    // Synapse tool state (OLD - will be removed after migration)
    currentSynapseType: 'excitatory',
    isPlacingSynapse: false,
    synapsePreview: null,
    // Animation state
    isAnimating: false,
    animationSpeed: 1.0,

    init() {
        try {
            console.log('NeuroSketch initializing...');
            this.canvas = document.getElementById('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.textEditor = new TextEditor(this.canvas, this);

            // NEW: Initialize core architecture systems
            console.log('Initializing core architecture systems...');
            this.stateMachine = new StateMachine(InteractionState.IDLE);
            this.toolManager = new ToolManager();
            this.commandHistory = new CommandHistory();

            // Initialize integration layer (StateValidator, etc.)
            initializeArchitecture(this);

            // Boolean flags removed - state machine is now the single source of truth
            // No sync needed - all code uses stateMachine.state directly

            // Register tools with new architecture
            console.log('Registering tools...');
            
            // CORE TOOLS ONLY - Working perfectly
            this.toolManager.register(new SelectTool());
            this.toolManager.register(new CircleTool());
            this.toolManager.register(new RectangleTool());
            this.toolManager.register(new LineTool());
            this.toolManager.register(new TriangleTool());
            this.toolManager.register(new SquareTool());
            this.toolManager.register(new PentagonTool());
            this.toolManager.register(new HexagonTool());
            this.toolManager.register(new HeptagonTool());
            this.toolManager.register(new OctagonTool());
            this.toolManager.register(new NonagonTool());
            this.toolManager.register(new DecagonTool());
            this.toolManager.register(new TextTool());
            this.toolManager.register(new FreehandTool());
            
            console.log(`✅ Registered ${this.toolManager.getAllTools().length} core tools - All working perfectly!`);

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
                    const newTool = btn.dataset.tool;
                    if (!newTool) return; // Skip buttons without tool (like image import)
                    
                    console.log('🔧 Tool button clicked:', newTool);

                    // Check if this is a category button - toggle dropdown instead of switching tool
                    const category = btn.closest('.toolCategory');
                    if (category) {
                        e.stopPropagation();
                        this.toggleToolDropdown(category);
                        return;
                    }

                    // Update UI
                    document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const oldTool = this.currentTool;
                    
                    // CRITICAL: Set tool FIRST, then reset state
                    this.currentTool = newTool;
                    
                    // Reset interaction state (safe to call after tool is set)
                    this.resetInteractionState();
                    
                    // HYBRID SYSTEM: If tool is in new architecture, use ToolManager
                    if (this.toolManager.hasTool(newTool)) {
                        console.log(`  ✨ NEW architecture: ${newTool}`);
                        this.toolManager.switchTool(newTool);
                        this.stateMachine.transition(InteractionState.IDLE);
                    } else {
                        console.log(`  📦 OLD system: ${newTool}`);
                    }

                    console.log(`✅ Tool switched: ${oldTool} → ${this.currentTool}, State: ${this.stateMachine.state}`);
                    this.render();
                });
            });

            // Setup dropdown menu items
            console.log('Setting up dropdown menu items...');
            const dropdownItems = document.querySelectorAll('.dropdownItem');
            dropdownItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tool = item.dataset.tool;
                    const category = item.closest('.toolCategory');
                    
                    // Update category button to show selected tool
                    if (category) {
                        const categoryBtn = category.querySelector('.toolBtn');
                        const icon = item.querySelector('.icon').cloneNode(true);
                        categoryBtn.innerHTML = '';
                        categoryBtn.appendChild(icon);
                        const indicator = document.createElement('div');
                        indicator.className = 'dropdown-indicator';
                        categoryBtn.appendChild(indicator);
                        categoryBtn.dataset.tool = tool;
                        
                        // Store last-used tool for this category
                        const categoryName = category.dataset.category;
                        localStorage.setItem(`neurosketch-lastTool-${categoryName}`, tool);
                    }
                    
                    // Switch to the selected tool
                    this.switchTool(tool);
                    
                    // Close dropdown
                    this.closeAllDropdowns();
                });
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.toolCategory')) {
                    this.closeAllDropdowns();
                }
            });

            // Restore last-used tool for each category from localStorage
            console.log('Restoring last-used tools from localStorage...');
            document.querySelectorAll('.toolCategory').forEach(category => {
                const categoryName = category.dataset.category;
                const lastTool = localStorage.getItem(`neurosketch-lastTool-${categoryName}`);
                
                if (lastTool) {
                    const dropdownItem = category.querySelector(`.dropdownItem[data-tool="${lastTool}"]`);
                    if (dropdownItem) {
                        const categoryBtn = category.querySelector('.toolBtn');
                        const icon = dropdownItem.querySelector('.icon').cloneNode(true);
                        categoryBtn.innerHTML = '';
                        categoryBtn.appendChild(icon);
                        const indicator = document.createElement('div');
                        indicator.className = 'dropdown-indicator';
                        categoryBtn.appendChild(indicator);
                        categoryBtn.dataset.tool = lastTool;
                        console.log(`  Restored ${categoryName}: ${lastTool}`);
                    }
                }
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
        
        // CRITICAL: Also tell ToolManager to switch tools!
        if (this.toolManager.hasTool('select')) {
            this.toolManager.switchTool('select');
            this.stateMachine.transition(InteractionState.IDLE);
        }
        
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

        console.log(`🖱️ MouseDown - Tool: ${this.currentTool}, State: ${this.stateMachine.state}, World: (${Math.round(world.x)}, ${Math.round(world.y)})`);

        // Pan with spacebar + click (MUST be before tool delegation)
        if (this.spacePressed) {
            this.isPanning = true;
            this.startX = x - this.panX;
            this.startY = y - this.panY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

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

        // NEW ARCHITECTURE: Delegate to Tool Manager
        if (this.toolManager.hasTool(this.currentTool)) {
            // Tool is in new architecture - use it exclusively
            // Use precise mode if Ctrl is pressed
            const preciseMode = this.ctrlPressed;
            const clickedObj = this.getObjectAt(world.x, world.y, preciseMode);
            const result = this.toolManager.handleMouseDown(world.x, world.y, clickedObj, this);
            
            if (result && result.stateTransition) {
                this.stateMachine.transition(result.stateTransition);
            }
            
            // Some tools create objects immediately in onMouseDown (text, graph, etc.)
            if (result && result.object) {
                console.log(`✅ Created ${result.object.type} (immediate)`);
                this.objects.push(result.object);
                this.selectedObjects = [result.object];
                this.saveState();
                this.updatePropertiesPanel();
                
                // Start editing text immediately
                if (result.object.type === 'text') {
                    setTimeout(() => this.textEditor.startEditing(result.object), 100);
                }
                
                if (this.currentTool !== 'select') {
                    this.switchToSelectTool();
                }
            }
            
            this.render();
            return; // CRITICAL: Don't fall through to old system
        }

        // ALL TOOLS NOW USE NEW ARCHITECTURE
        // No old tool code remains - everything goes through ToolManager
        
        console.error('⚠️ Tool not registered in ToolManager:', this.currentTool);

        this.render();
    },

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let world = this.screenToWorld(x, y);

        // Panning with spacebar
        if (this.isPanning) {
            this.panX = x - this.startX;
            this.panY = y - this.startY;
            this.textEditor.updatePosition();
            this.render();
            return;
        }

        // NEW ARCHITECTURE: Delegate to ToolManager (all tools, all states)
        if (this.toolManager.hasTool(this.currentTool) && 
            this.stateMachine.state !== InteractionState.IDLE) {
            
            const result = this.toolManager.handleMouseMove(world.x, world.y, null, this);
            
            if (result && result.preview) {
                this.render();
            }
            
            return; // Don't fall through
        }

        this.render();
    },

    handleMouseUp(e) {
        // CRITICAL FIX: Always reset state flags to prevent select tool from getting stuck
        // This ensures the select tool works reliably even if actions are interrupted

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const world = this.screenToWorld(x, y);

        // Handle panning release BEFORE tool delegation
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.spacePressed ? 'grab' : 'default';
            return;
        }

        // NEW ARCHITECTURE: Delegate to ToolManager (all tools, all states)
        if (this.toolManager.hasTool(this.currentTool)) {
            const clickedObj = this.getObjectAt(world.x, world.y);
            const result = this.toolManager.handleMouseUp(world.x, world.y, clickedObj, this);
            
            if (result && result.stateTransition) {
                this.stateMachine.transition(result.stateTransition);
            }
            
            if (result && result.object) {
                console.log(`✅ Created ${result.object.type}`, result.object);
                this.objects.push(result.object);
                console.log(`   Total objects now: ${this.objects.length}`);
                this.selectedObjects = [result.object];
                this.saveState();
                this.updatePropertiesPanel();
                
                // Start editing text immediately
                if (result.object.type === 'text') {
                    setTimeout(() => this.textEditor.startEditing(result.object), 100);
                }
                
                if (this.currentTool !== 'select') {
                    this.switchToSelectTool();
                }
            } else {
                console.log(`⚠️ No object returned from ${this.currentTool}`, result);
            }
            
            this.render();
            return;
        }


        // CRITICAL FIX: Comprehensive state reset to prevent select tool from getting stuck
        // This ensures ALL interaction state flags are properly cleared after every mouse up
        this.resetInteractionState();
        this.render();
    },

    resetInteractionState() {
        // Reset active tool state
        if (this.toolManager && this.toolManager.activeTool) {
            this.toolManager.activeTool.reset();
        }
        // State machine handles all state - no boolean flags to reset
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

        // Tab - Cycle through overlapping objects
        if (e.key === 'Tab' && !this.textEditor.isEditing && !this.isEditingInput()) {
            e.preventDefault();
            
            // Only works if we have a last click position and objects there
            if (this.lastClickWorldPos && this.objectsAtLastClick.length > 1) {
                // Cycle to next object
                this.tabCycleIndex = (this.tabCycleIndex + 1) % this.objectsAtLastClick.length;
                const newSelection = this.objectsAtLastClick[this.tabCycleIndex];
                
                this.selectedObjects = [newSelection];
                this.updatePropertiesPanel();
                this.render();
                
                console.log(`🔄 Tab cycle: ${this.tabCycleIndex + 1} of ${this.objectsAtLastClick.length} (${newSelection.type})`);
            } else if (this.selectedObjects.length === 1) {
                // Get objects at the selected object's center
                const obj = this.selectedObjects[0];
                const center = this.getObjectCenter(obj);
                this.objectsAtLastClick = this.getAllObjectsAt(center.x, center.y, false);
                
                if (this.objectsAtLastClick.length > 1) {
                    this.lastClickWorldPos = center;
                    this.tabCycleIndex = this.objectsAtLastClick.indexOf(obj);
                    
                    // Cycle to next
                    this.tabCycleIndex = (this.tabCycleIndex + 1) % this.objectsAtLastClick.length;
                    const newSelection = this.objectsAtLastClick[this.tabCycleIndex];
                    
                    this.selectedObjects = [newSelection];
                    this.updatePropertiesPanel();
                    this.render();
                    
                    console.log(`🔄 Tab cycle: ${this.tabCycleIndex + 1} of ${this.objectsAtLastClick.length} (${newSelection.type})`);
                }
            }
            return;
        }

        // Tool keyboard shortcuts (only when not editing text)
        if (!this.textEditor.isEditing && !this.isEditingInput() && !cmdOrCtrl) {
            const toolShortcuts = {
                'v': 'select',
                'r': 'rectangle',
                'c': 'circle',
                'l': 'line',
                '3': 'triangle',
                '4': 'square',
                '5': 'pentagon',
                '6': 'hexagon',
                '7': 'heptagon',
                '8': 'octagon',
                '9': 'nonagon',
                '0': 'decagon',
                'f': 'freehand',
                't': 'text'
            };
            
            const tool = toolShortcuts[e.key.toLowerCase()];
            if (tool) {
                e.preventDefault();
                this.switchTool(tool);
                return;
            }
        }

        // S key - Cycle synapse connection style (curved → straight → elbow)
        if (e.key === 's' && !cmdOrCtrl && !this.textEditor.isEditing && !this.isEditingInput()) {
            if (this.selectedObjects.length === 1 && this.selectedObjects[0].type === 'synapse') {
                e.preventDefault();
                const synapse = this.selectedObjects[0];
                const styles = ['curved', 'straight', 'elbow'];
                const currentIndex = styles.indexOf(synapse.connectionStyle);
                const nextIndex = (currentIndex + 1) % styles.length;
                synapse.connectionStyle = styles[nextIndex];
                console.log(`Synapse style: ${synapse.connectionStyle}`);
                this.saveState();
                this.render();
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

    getObjectAt(x, y, preciseMode = false) {
        // preciseMode: Ctrl+Click - only hit actual strokes/fills, not bounding boxes
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            if (preciseMode) {
                if (this.isPreciseHit(obj, x, y)) {
                    return obj;
                }
            } else {
                // Normal mode: bounding box selection
                const bounds = this.getObjectBounds(obj);
                if (!bounds) continue;

                // Handle rotated objects by transforming click to local space
                let testX = x;
                let testY = y;
                
                if (obj.rotation && obj.rotation !== 0) {
                    const center = this.getObjectCenter(obj);
                    const angle = -obj.rotation * Math.PI / 180; // Inverse rotation
                    
                    // Rotate click point into object's local space
                    const dx = x - center.x;
                    const dy = y - center.y;
                    testX = center.x + dx * Math.cos(angle) - dy * Math.sin(angle);
                    testY = center.y + dx * Math.sin(angle) + dy * Math.cos(angle);
                }

                // Special handling for freehand - check if click is near the path
                if (obj.type === 'freehand') {
                    if (!obj.points || obj.points.length < 2) continue;
                    
                    // First check bounding box
                    if (testX < bounds.left || testX > bounds.right || testY < bounds.top || testY > bounds.bottom) {
                        continue;
                    }
                    
                    // Then check distance to path segments
                    const tolerance = (obj.strokeWidth || 2) + 5; // Click tolerance around stroke
                    let nearPath = false;
                    
                    for (let j = 0; j < obj.points.length - 1; j++) {
                        const p1 = obj.points[j];
                        const p2 = obj.points[j + 1];
                        const dist = this.pointToLineDistance(testX, testY, p1.x, p1.y, p2.x, p2.y);
                        if (dist < tolerance) {
                            nearPath = true;
                            break;
                        }
                    }
                    
                    if (nearPath) {
                        return obj;
                    }
                } else {
                    // Simple bounding box check for other objects - click anywhere within the dotted box
                    if (testX >= bounds.left && testX <= bounds.right && testY >= bounds.top && testY <= bounds.bottom) {
                        return obj;
                    }
                }
            }
        }
        return null;
    },

    getAllObjectsAt(x, y, preciseMode = false) {
        // Returns ALL objects at this position (for Tab cycling)
        const objects = [];
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            if (preciseMode) {
                if (this.isPreciseHit(obj, x, y)) {
                    objects.push(obj);
                }
            } else {
                // Normal mode: bounding box selection
                const bounds = this.getObjectBounds(obj);
                if (!bounds) continue;

                // Handle rotated objects by transforming click to local space
                let testX = x;
                let testY = y;
                
                if (obj.rotation && obj.rotation !== 0) {
                    const center = this.getObjectCenter(obj);
                    const angle = -obj.rotation * Math.PI / 180;
                    const dx = x - center.x;
                    const dy = y - center.y;
                    testX = center.x + dx * Math.cos(angle) - dy * Math.sin(angle);
                    testY = center.y + dx * Math.sin(angle) + dy * Math.cos(angle);
                }

                if (obj.type === 'freehand') {
                    if (!obj.points || obj.points.length < 2) continue;
                    if (testX < bounds.left || testX > bounds.right || testY < bounds.top || testY > bounds.bottom) {
                        continue;
                    }
                    const tolerance = (obj.strokeWidth || 2) + 5;
                    for (let j = 0; j < obj.points.length - 1; j++) {
                        const p1 = obj.points[j];
                        const p2 = obj.points[j + 1];
                        const dist = this.pointToLineDistance(testX, testY, p1.x, p1.y, p2.x, p2.y);
                        if (dist < tolerance) {
                            objects.push(obj);
                            break;
                        }
                    }
                } else {
                    if (testX >= bounds.left && testX <= bounds.right && testY >= bounds.top && testY <= bounds.bottom) {
                        objects.push(obj);
                    }
                }
            }
        }
        return objects;
    },

    isPreciseHit(obj, x, y) {
        // Precise hit detection - only hit actual strokes/edges/fills
        const tolerance = (obj.strokeWidth || 2) + 3; // Small tolerance for strokes
        
        // Handle rotation
        let testX = x;
        let testY = y;
        if (obj.rotation && obj.rotation !== 0) {
            const center = this.getObjectCenter(obj);
            const angle = -obj.rotation * Math.PI / 180;
            const dx = x - center.x;
            const dy = y - center.y;
            testX = center.x + dx * Math.cos(angle) - dy * Math.sin(angle);
            testY = center.y + dx * Math.sin(angle) + dy * Math.cos(angle);
        }
        
        switch (obj.type) {
            case 'circle': {
                const dist = Math.sqrt((testX - obj.x) ** 2 + (testY - obj.y) ** 2);
                const hasFill = obj.fillColor && obj.fillColor !== 'transparent';
                if (hasFill && dist <= obj.radius) return true; // Inside fill
                // Check stroke
                return Math.abs(dist - obj.radius) <= tolerance;
            }
            
            case 'rectangle': {
                const left = obj.x - obj.width / 2;
                const right = obj.x + obj.width / 2;
                const top = obj.y - obj.height / 2;
                const bottom = obj.y + obj.height / 2;
                
                const hasFill = obj.fillColor && obj.fillColor !== 'transparent';
                if (hasFill && testX >= left && testX <= right && testY >= top && testY <= bottom) {
                    return true; // Inside fill
                }
                
                // Check edges
                if (testX >= left - tolerance && testX <= right + tolerance &&
                    testY >= top - tolerance && testY <= bottom + tolerance) {
                    // Near perimeter?
                    const nearLeft = Math.abs(testX - left) <= tolerance;
                    const nearRight = Math.abs(testX - right) <= tolerance;
                    const nearTop = Math.abs(testY - top) <= tolerance;
                    const nearBottom = Math.abs(testY - bottom) <= tolerance;
                    return nearLeft || nearRight || nearTop || nearBottom;
                }
                return false;
            }
            
            case 'line': {
                const dist = this.pointToLineDistance(testX, testY, obj.x, obj.y, obj.x2, obj.y2);
                return dist <= tolerance;
            }
            
            case 'polygon': {
                const hasFill = obj.fillColor && obj.fillColor !== 'transparent';
                
                // Generate polygon points
                const points = [];
                for (let i = 0; i < obj.sides; i++) {
                    const angle = (i * 2 * Math.PI / obj.sides) - Math.PI / 2;
                    points.push({
                        x: obj.x + obj.radius * Math.cos(angle),
                        y: obj.y + obj.radius * Math.sin(angle)
                    });
                }
                
                // Check if inside polygon (for fill)
                if (hasFill) {
                    let inside = false;
                    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                        const xi = points[i].x, yi = points[i].y;
                        const xj = points[j].x, yj = points[j].y;
                        const intersect = ((yi > testY) !== (yj > testY)) &&
                            (testX < (xj - xi) * (testY - yi) / (yj - yi) + xi);
                        if (intersect) inside = !inside;
                    }
                    if (inside) return true;
                }
                
                // Check edges
                for (let i = 0; i < points.length; i++) {
                    const p1 = points[i];
                    const p2 = points[(i + 1) % points.length];
                    const dist = this.pointToLineDistance(testX, testY, p1.x, p1.y, p2.x, p2.y);
                    if (dist <= tolerance) return true;
                }
                return false;
            }
            
            case 'freehand': {
                if (!obj.points || obj.points.length < 2) return false;
                for (let j = 0; j < obj.points.length - 1; j++) {
                    const p1 = obj.points[j];
                    const p2 = obj.points[j + 1];
                    const dist = this.pointToLineDistance(testX, testY, p1.x, p1.y, p2.x, p2.y);
                    if (dist <= tolerance) return true;
                }
                return false;
            }
            
            case 'text': {
                // Text is always bounding box (can't hit individual letters precisely)
                return testX >= obj.x && testX <= obj.x + obj.width &&
                       testY >= obj.y && testY <= obj.y + obj.height;
            }
            
            default:
                return false;
        }
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

            // Support both {x, y, x2, y2} (old) and {x1, y1, x2, y2} (new)
            const x1 = obj.x1 !== undefined ? obj.x1 : obj.x;
            const y1 = obj.y1 !== undefined ? obj.y1 : obj.y;

            // Check start point
            const dx1 = Math.abs(world.x - x1);
            const dy1 = Math.abs(world.y - y1);
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
        } else if (obj.type === 'hexagon' || obj.type === 'polygon') {
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
        } else if (obj.type === 'synapse') {
            // For synapses, create handles at source and target points for reconnection
            const world = this.screenToWorld(sx, sy);

            // Check source point
            const dxSource = Math.abs(world.x - obj.sourcePoint.x);
            const dySource = Math.abs(world.y - obj.sourcePoint.y);
            if (dxSource < handleSize && dySource < handleSize) {
                return 'source';
            }

            // Check target point
            const dxTarget = Math.abs(world.x - obj.targetPoint.x);
            const dyTarget = Math.abs(world.y - obj.targetPoint.y);
            if (dxTarget < handleSize && dyTarget < handleSize) {
                return 'target';
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
            // Support both {x, y, x2, y2} (old) and {x1, y1, x2, y2} (new)
            const x1 = obj.x1 !== undefined ? obj.x1 : obj.x;
            const y1 = obj.y1 !== undefined ? obj.y1 : obj.y;
            return {
                left: Math.min(x1, obj.x2 || x1),
                right: Math.max(x1, obj.x2 || x1),
                top: Math.min(y1, obj.y2 || y1),
                bottom: Math.max(y1, obj.y2 || y1)
            };
        } else if (obj.type === 'triangle') {
            return {
                left: obj.x - obj.width / 2,
                right: obj.x + obj.width / 2,
                top: obj.y - obj.height / 2,
                bottom: obj.y + obj.height / 2
            };
        } else if (obj.type === 'hexagon' || obj.type === 'polygon') {
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
            return bounds; // Already returns {left, right, top, bottom}
        } else if (obj.type === 'synapse') {
            // Synapse bounds based on source and target points
            const tolerance = 10; //Clickable area around synapse line
            return {
                left: Math.min(obj.sourcePoint.x, obj.targetPoint.x) - tolerance,
                right: Math.max(obj.sourcePoint.x, obj.targetPoint.x) + tolerance,
                top: Math.min(obj.sourcePoint.y, obj.targetPoint.y) - tolerance,
                bottom: Math.max(obj.sourcePoint.y, obj.targetPoint.y) + tolerance
            };
        }
        return null;
    },

    getObjectCenter(obj) {
        if (obj.type === 'circle') {
            return { x: obj.x, y: obj.y };
        } else if (obj.type === 'line' || obj.type === 'taperedLine' || obj.type === 'myelinatedAxon' || obj.type === 'apicalDendrite') {
            // Support both {x, y, x2, y2} (old) and {x1, y1, x2, y2} (new)
            const x1 = obj.x1 !== undefined ? obj.x1 : obj.x;
            const y1 = obj.y1 !== undefined ? obj.y1 : obj.y;
            return {
                x: (x1 + obj.x2) / 2,
                y: (y1 + obj.y2) / 2
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
        } else if (obj.type === 'synapse') {
            // Center of synapse is midpoint of source and target
            return {
                x: (obj.sourcePoint.x + obj.targetPoint.x) / 2,
                y: (obj.sourcePoint.y + obj.targetPoint.y) / 2
            };
        } else {
            return {
                x: obj.x + (obj.width || 0) / 2,
                y: obj.y + (obj.height || 0) / 2
            };
        }
    },

    calculateSynapseAttachmentPoint(obj, clickX, clickY, role) {
        // Calculate smart attachment point based on object type
        // role: 'source' (presynaptic) or 'target' (postsynaptic)

        if (obj.type === 'circle') {
            // Attach to closest point on perimeter
            const dx = clickX - obj.x;
            const dy = clickY - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) {
                return { x: obj.x + obj.radius, y: obj.y };
            }
            return {
                x: obj.x + (dx / distance) * obj.radius,
                y: obj.y + (dy / distance) * obj.radius
            };
        } else if (obj.type === 'rectangle' || obj.type === 'text') {
            // Attach to closest edge
            const bounds = this.getObjectBounds(obj);
            // Find closest edge and return point on that edge
            const centerX = (bounds.left + bounds.right) / 2;
            const centerY = (bounds.top + bounds.bottom) / 2;
            const dx = clickX - centerX;
            const dy = clickY - centerY;

            // Determine which edge is closest
            if (Math.abs(dx / (bounds.right - bounds.left)) > Math.abs(dy / (bounds.bottom - bounds.top))) {
                // Left or right edge
                return {
                    x: dx > 0 ? bounds.right : bounds.left,
                    y: clickY
                };
            } else {
                // Top or bottom edge
                return {
                    x: clickX,
                    y: dy > 0 ? bounds.bottom : bounds.top
                };
            }
        } else if (obj.type === 'line' || obj.type === 'taperedLine' || obj.type === 'myelinatedAxon') {
            // Attach to nearest endpoint
            const dist1 = Math.hypot(clickX - (obj.x || obj.x1), clickY - (obj.y || obj.y1));
            const dist2 = Math.hypot(clickX - (obj.x2 || obj.x), clickY - (obj.y2 || obj.y));

            if (dist1 < dist2) {
                return { x: obj.x || obj.x1, y: obj.y || obj.y1 };
            } else {
                return { x: obj.x2 || obj.x, y: obj.y2 || obj.y };
            }
        }

        // Default: use click point
        return { x: clickX, y: clickY };
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
                obj.x1 = wx;
                obj.y1 = wy;
            } else if (this.dragHandle === 'end') {
                obj.x2 = wx;
                obj.y2 = wy;
            }
            // Update stored dimensions
            obj._lineWidth = obj.x2 - obj.x1;
            obj._lineHeight = obj.y2 - obj.y1;
        } else if (obj.type === 'triangle' || obj.type === 'hexagon' || obj.type === 'polygon') {
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
        } else if (obj.type === 'synapse') {
            // Move endpoints and check for reconnection
            if (this.dragHandle === 'source') {
                obj.sourcePoint.x = wx;
                obj.sourcePoint.y = wy;

                // Check if endpoint is over a valid object for reconnection
                const targetObj = this.getObjectAt(wx, wy);
                if (targetObj && targetObj !== obj && targetObj.type !== 'synapse') {
                    // Reconnect to new object
                    obj.sourceObj = targetObj;
                    // Recalculate attachment point based on object type
                    obj.sourcePoint = this.calculateSynapseAttachmentPoint(targetObj, wx, wy, 'source');
                }
            } else if (this.dragHandle === 'target') {
                obj.targetPoint.x = wx;
                obj.targetPoint.y = wy;

                // Check if endpoint is over a valid object for reconnection
                const targetObj = this.getObjectAt(wx, wy);
                if (targetObj && targetObj !== obj && targetObj.type !== 'synapse') {
                    // Reconnect to new object
                    obj.targetObj = targetObj;
                    // Recalculate attachment point based on object type
                    obj.targetPoint = this.calculateSynapseAttachmentPoint(targetObj, wx, wy, 'target');
                }
            }
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
        // NEW: Continuous defensive state validation (runs every 60 frames)
        validateStateLoop(this);

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

        // Tools handle their own preview rendering via renderPreview()

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

        // NEW ARCHITECTURE: All tools render their own previews
        if (this.toolManager.getCurrentTool()) {
            this.toolManager.renderPreview(this.ctx, this);
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

        // NEW ARCHITECTURE: Render tool previews
        if (this.toolManager.getCurrentTool()) {
            this.toolManager.renderPreview(this.ctx, this);
        }

        // Show rotation angle indicator while rotating
        if (this.stateMachine.state === InteractionState.ROTATING && 
            this.selectedObjects.length === 1) {
            const obj = this.selectedObjects[0];
            const center = this.getObjectCenter(obj);
            
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for text
            
            const screenPos = this.worldToScreen(center.x, center.y);
            
            // Draw rotation angle
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = this.isDarkMode ? '#FFFFFF' : '#000000';
            this.ctx.strokeStyle = this.isDarkMode ? '#000000' : '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const angleText = `${Math.round(obj.rotation || 0)}°`;
            this.ctx.strokeText(angleText, screenPos.x, screenPos.y - 40);
            this.ctx.fillText(angleText, screenPos.x, screenPos.y - 40);
            
            this.ctx.restore();
        }

        // Show "Precise Mode" indicator when Ctrl is held (only in select tool)
        if (this.ctrlPressed && this.currentTool === 'select') {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for UI text
            
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#FF6B35'; // Orange for visibility
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            const text = '🎯 Precise Mode (Ctrl)';
            this.ctx.fillText(text, 10, 10);
            
            this.ctx.restore();
        }

        // Show Tab cycling info if objects are overlapping
        if (this.objectsAtLastClick.length > 1 && this.selectedObjects.length === 1) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = this.isDarkMode ? '#AAAAAA' : '#666666';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            const text = `${this.tabCycleIndex + 1}/${this.objectsAtLastClick.length} objects (Tab to cycle)`;
            this.ctx.fillText(text, 10, this.ctrlPressed ? 32 : 10);
            
            this.ctx.restore();
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
                const freehandPropsContent = document.getElementById('freehandPropsContent');
                if (freehandPropsContent) freehandPropsContent.style.display = 'none';
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

            } else if (obj.type === 'freehand') {
                // Show freehand properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'none';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                const freehandPropsContent = document.getElementById('freehandPropsContent');
                if (freehandPropsContent) freehandPropsContent.style.display = 'block';
                propsInfo.style.display = 'none';

                // Update freehand property values
                if (document.getElementById('freehandStrokeWidth')) {
                    document.getElementById('freehandStrokeWidth').value = obj.strokeWidth || 2;
                }
                if (document.getElementById('freehandStrokeColor')) {
                    document.getElementById('freehandStrokeColor').value = obj.strokeColor || '#000000';
                }
                if (document.getElementById('freehandLineStyle')) {
                    document.getElementById('freehandLineStyle').value = obj.lineStyle || 'solid';
                }

            } else if (obj.type === 'text') {
                // Show text properties
                propsContent.style.display = 'none';
                textPropsContent.style.display = 'block';
                if (taperedLinePropsContent) taperedLinePropsContent.style.display = 'none';
                if (curvedPathPropsContent) curvedPathPropsContent.style.display = 'none';
                if (imagePropsContent) imagePropsContent.style.display = 'none';
                if (graphPropsContent) graphPropsContent.style.display = 'none';
                const freehandPropsContent2 = document.getElementById('freehandPropsContent');
                if (freehandPropsContent2) freehandPropsContent2.style.display = 'none';
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
                const freehandPropsContent3 = document.getElementById('freehandPropsContent');
                if (freehandPropsContent3) freehandPropsContent3.style.display = 'none';
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
                const freehandPropsContent4 = document.getElementById('freehandPropsContent');
                if (freehandPropsContent4) freehandPropsContent4.style.display = 'none';
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
                const freehandPropsContent5 = document.getElementById('freehandPropsContent');
                if (freehandPropsContent5) freehandPropsContent5.style.display = 'none';
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
                const freehandPropsContent6 = document.getElementById('freehandPropsContent');
                if (freehandPropsContent6) freehandPropsContent6.style.display = 'none';
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
                } else if (obj.type === 'rectangle' || obj.type === 'ellipse') {
                    // Show width and height for rectangles and ellipse
                    dimensionInputRow.style.display = 'flex';
                    dimensionInputRow2.style.display = 'flex';
                    radiusInputRow.style.display = 'none';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectWidth').value = Math.round(obj.width);
                    document.getElementById('objectHeight').value = Math.round(obj.height);
                    document.getElementById('objectX').value = Math.round(obj.x);
                    document.getElementById('objectY').value = Math.round(obj.y);
                } else if (obj.type === 'triangle' || obj.type === 'hexagon' || obj.type === 'polygon') {
                    // Show radius for polygons
                    dimensionInputRow.style.display = 'none';
                    dimensionInputRow2.style.display = 'none';
                    radiusInputRow.style.display = 'flex';
                    positionInputRow.style.display = 'flex';
                    document.getElementById('objectRadius').value = Math.round(obj.radius);
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
                    document.getElementById('fillColor').value = obj.fillColor === 'transparent' ? '#FFFFFF' : obj.fillColor;
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
            const freehandPropsContent7 = document.getElementById('freehandPropsContent');
            if (freehandPropsContent7) freehandPropsContent7.style.display = 'none';
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
        } else if (prop === 'lineStyle') {
            // Freehand line style
            obj[prop] = value;
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
            if (obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'hexagon' || obj.type === 'polygon') {
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

    // Circuit functions removed - will rebuild later

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

    toggleToolDropdown(category) {
        const isOpen = category.classList.contains('open');
        
        // Close all dropdowns first
        this.closeAllDropdowns();
        
        // Open this one if it wasn't already open
        if (!isOpen) {
            category.classList.add('open');
        }
    },

    closeAllDropdowns() {
        document.querySelectorAll('.toolCategory').forEach(cat => {
            cat.classList.remove('open');
        });
    },

    switchTool(toolName) {
        console.log('🔧 Switching to tool:', toolName);
        
        // Update UI - make the tool active
        document.querySelectorAll('.toolBtn').forEach(b => b.classList.remove('active'));
        const toolBtn = document.querySelector(`.toolBtn[data-tool="${toolName}"]`);
        if (toolBtn) {
            toolBtn.classList.add('active');
        }

        const oldTool = this.currentTool;
        
        // CRITICAL: Set tool FIRST, then reset state
        this.currentTool = toolName;
        
        // Reset interaction state
        this.resetInteractionState();
        
        // Use ToolManager if tool is registered
        if (this.toolManager.hasTool(toolName)) {
            console.log(`  ✨ NEW architecture: ${toolName}`);
            this.toolManager.switchTool(toolName);
            this.stateMachine.transition(InteractionState.IDLE);
        } else {
            console.log(`  📦 OLD system: ${toolName}`);
        }

        console.log(`✅ Tool switched: ${oldTool} → ${this.currentTool}, State: ${this.stateMachine.state}`);
        this.render();
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