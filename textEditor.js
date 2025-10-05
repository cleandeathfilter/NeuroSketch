/**
 * TextEditor.js - Modular text editing overlay system for NeuroSketch
 * Handles creating and managing the textarea overlay for smooth text editing
 */

export class TextEditor {
    constructor(canvas, app) {
        this.canvas = canvas;
        this.app = app;
        this.textarea = null;
        this.editingObject = null;
        this.isEditing = false;
        this.resizeTimeout = null;
        this.justStartedEditing = false; // Flag to prevent immediate blur
    }

    /**
     * Start editing a text object
     * @param {Object} textObj - The text object to edit
     */
    startEditing(textObj) {
        if (this.isEditing) {
            this.stopEditing();
        }

        this.editingObject = textObj;
        this.isEditing = true;
        this.justStartedEditing = true; // Set flag to prevent immediate blur

        // Create textarea overlay
        this.createTextarea();
        this.positionTextarea();
        this.styleTextarea();
        this.setupEventListeners();

        // Load existing text
        this.textarea.value = textObj.text || '';

        // Focus and select all - delay slightly to avoid blur from double-click
        setTimeout(() => {
            if (this.textarea) {
                this.textarea.focus();
                this.textarea.select();
                // Clear the flag after a short delay
                setTimeout(() => {
                    this.justStartedEditing = false;
                }, 200);
            }
        }, 10);

        // Trigger re-render to hide the canvas text
        this.app.render();
    }

    /**
     * Stop editing and commit changes
     */
    stopEditing() {
        if (!this.isEditing || !this.textarea) {
            return;
        }

        // Check if we were using the text tool (not select tool editing existing text)
        const wasUsingTextTool = this.app.currentTool === 'text';

        // Keep reference to the object being edited
        const textObject = this.editingObject;

        // Save text to object
        if (this.editingObject) {
            this.editingObject.text = this.textarea.value;

            // Auto-resize the textbox
            this.app.autoResizeTextbox(this.editingObject);
        }

        // Cleanup - IMPORTANT: Set isEditing to false BEFORE removing textarea
        // to prevent blur event from triggering stopEditing again
        this.isEditing = false;
        this.removeTextarea();
        this.editingObject = null;

        // Save state for undo/redo
        this.app.saveState();

        // Auto-switch to select tool if we were using text tool
        if (wasUsingTextTool) {
            this.app.switchToSelectTool();
        }

        // ALWAYS keep the textbox selected so user can immediately resize/move it
        // (whether we were using text tool or editing from select tool)
        if (textObject) {
            this.app.selectedObjects = [textObject];
            this.app.updatePropertiesPanel();

            // Mark that we just finished editing (defensive protection)
            textObject._justFinishedEditing = true;
            setTimeout(() => {
                if (textObject) {
                    delete textObject._justFinishedEditing;
                }
            }, 500); // Protected for 500ms after editing
        }

        // Re-render canvas
        this.app.render();
    }

    /**
     * Create the textarea element
     */
    createTextarea() {
        this.textarea = document.createElement('textarea');
        this.textarea.style.position = 'absolute';
        this.textarea.style.zIndex = '1000';
        this.textarea.style.resize = 'none';
        this.textarea.style.outline = 'none';
        this.textarea.style.overflow = 'auto'; // Allow scrolling if content exceeds
        this.textarea.style.margin = '0';
        this.textarea.style.boxSizing = 'border-box';
        this.textarea.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        this.textarea.style.whiteSpace = 'pre-wrap'; // Preserve whitespace like Word
        this.textarea.style.wordWrap = 'break-word'; // Break long words

        document.body.appendChild(this.textarea);
    }

    /**
     * Position the textarea over the text object
     */
    positionTextarea() {
        if (!this.textarea || !this.editingObject) return;

        const rect = this.canvas.getBoundingClientRect();
        const screen = this.app.worldToScreen(this.editingObject.x, this.editingObject.y);

        this.textarea.style.left = (rect.left + screen.x) + 'px';
        this.textarea.style.top = (rect.top + screen.y) + 'px';
        this.textarea.style.width = (this.editingObject.width * this.app.zoom) + 'px';
        this.textarea.style.height = (this.editingObject.height * this.app.zoom) + 'px';
    }

    /**
     * Style the textarea to match the text object properties
     */
    styleTextarea() {
        if (!this.textarea || !this.editingObject) return;

        const obj = this.editingObject;
        const zoom = this.app.zoom;

        this.textarea.style.fontSize = (obj.fontSize * zoom) + 'px';
        this.textarea.style.fontFamily = obj.fontFamily;
        this.textarea.style.fontWeight = obj.fontWeight;
        this.textarea.style.fontStyle = obj.fontStyle;
        this.textarea.style.textDecoration = obj.textDecoration;
        this.textarea.style.color = obj.textColor;
        this.textarea.style.textAlign = obj.textAlign;
        this.textarea.style.lineHeight = obj.lineHeight;
        this.textarea.style.padding = (5 * zoom) + 'px'; // Match canvas padding
        this.textarea.style.boxSizing = 'border-box'; // Include padding in width/height

        // Background and border
        if (obj.backgroundColor === 'transparent') {
            this.textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Slight white for visibility
        } else {
            this.textarea.style.backgroundColor = obj.backgroundColor;
            this.textarea.style.opacity = obj.backgroundOpacity || 1;
        }

        if (obj.hasBorder) {
            this.textarea.style.border = `${obj.borderWidth * zoom}px solid ${obj.borderColor}`;
            this.textarea.style.borderRadius = (obj.borderRadius * zoom) + 'px';
        } else {
            this.textarea.style.border = `2px dashed #3498DB`; // Dashed border for editing state
            this.textarea.style.borderRadius = '0px';
        }
    }

    /**
     * Setup event listeners for the textarea
     */
    setupEventListeners() {
        if (!this.textarea) return;

        // Handle blur (click outside)
        this.textarea.addEventListener('blur', () => {
            // Ignore blur if we just started editing (prevents double-click blur)
            if (this.justStartedEditing) {
                return;
            }
            // Check immediately if still editing (before delay)
            if (!this.isEditing) {
                return; // Already stopped editing, don't call stopEditing again
            }
            // Delay slightly to prevent immediate blur on double-click
            setTimeout(() => {
                if (this.isEditing) {
                    this.stopEditing();
                }
            }, 100);
        });

        // Handle escape and enter keys
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation(); // Prevent event from reaching app handlers
                this.stopEditing();
                return;
            }

            // Enter key without Shift finalizes editing
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation(); // Prevent event from reaching app handlers
                this.stopEditing();
                return;
            }

            // Prevent app shortcuts while editing
            e.stopPropagation();
        });

        // Handle input for real-time updates
        this.textarea.addEventListener('input', () => {
            if (this.editingObject) {
                this.editingObject.text = this.textarea.value;

                // Auto-resize textbox as you type (only if not manually resized)
                if (!this.editingObject.manualResize) {
                    this.app.autoResizeTextbox(this.editingObject);

                    // Update textarea size to match immediately
                    this.textarea.style.width = (this.editingObject.width * this.app.zoom) + 'px';
                    this.textarea.style.height = (this.editingObject.height * this.app.zoom) + 'px';
                }

                // Re-render canvas to show updated size
                this.app.render();
            }
        });
    }

    /**
     * Remove the textarea from DOM
     */
    removeTextarea() {
        if (this.textarea && this.textarea.parentNode) {
            this.textarea.parentNode.removeChild(this.textarea);
        }
        this.textarea = null;
    }

    /**
     * Update textarea position when canvas is panned or zoomed
     */
    updatePosition() {
        if (this.isEditing && this.textarea && this.editingObject) {
            this.positionTextarea();
            this.styleTextarea(); // Re-style for zoom changes
        }
    }

    /**
     * Check if currently editing
     */
    getEditingObject() {
        return this.isEditing ? this.editingObject : null;
    }

    /**
     * Clean up on destroy
     */
    destroy() {
        if (this.isEditing) {
            this.stopEditing();
        }
    }
}