/**
 * BaseObject - Model class for all canvas objects
 *
 * Purpose: Pure data representation of canvas objects (no rendering logic)
 *
 * Pattern: MVC Pattern (from CLAUDE.md Pattern 0.5)
 *
 * Benefits:
 * - Models can be unit tested without canvas
 * - Renderers can be swapped (WebGL, SVG, etc.)
 * - Business logic is platform-independent
 * - Easy to implement headless mode for testing
 * - Clear separation of concerns
 *
 * Research: MVC pattern for canvas editors
 */

import { EventEmitter, Events } from '../core/EventEmitter.js';

export class BaseObject extends EventEmitter {
    /**
     * Create a new canvas object
     * @param {string} type - Object type (circle, rectangle, neuron, etc.)
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    constructor(type, x, y) {
        super();

        /**
         * Unique identifier
         * @type {string}
         */
        this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        /**
         * Object type
         * @type {string}
         */
        this.type = type;

        /**
         * X position (world coordinates)
         * @type {number}
         */
        this.x = x || 0;

        /**
         * Y position (world coordinates)
         * @type {number}
         */
        this.y = y || 0;

        /**
         * Rotation angle in radians
         * @type {number}
         */
        this.rotation = 0;

        /**
         * Selection state
         * @type {boolean}
         */
        this.isSelected = false;

        /**
         * Visibility state
         * @type {boolean}
         */
        this.isVisible = true;

        /**
         * Layer/z-index
         * @type {number}
         */
        this.zIndex = 0;

        /**
         * Metadata (user-defined properties)
         * @type {Object}
         */
        this.metadata = {};

        /**
         * Creation timestamp
         * @type {number}
         */
        this.createdAt = Date.now();

        /**
         * Last modified timestamp
         * @type {number}
         */
        this.modifiedAt = Date.now();
    }

    /**
     * Move object by delta
     * @param {number} dx - Delta X
     * @param {number} dy - Delta Y
     */
    move(dx, dy) {
        const oldX = this.x;
        const oldY = this.y;

        this.x += dx;
        this.y += dy;
        this.modifiedAt = Date.now();

        this.emit(Events.MOVED, {
            object: this,
            oldX,
            oldY,
            newX: this.x,
            newY: this.y,
            dx,
            dy
        });

        this.emit(Events.MODIFIED, { object: this });
    }

    /**
     * Set absolute position
     * @param {number} x - New X position
     * @param {number} y - New Y position
     */
    setPosition(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        this.move(dx, dy);
    }

    /**
     * Rotate object
     * @param {number} deltaAngle - Rotation delta in radians
     */
    rotate(deltaAngle) {
        const oldRotation = this.rotation;

        this.rotation += deltaAngle;
        // Normalize to 0-2π range
        this.rotation = this.rotation % (Math.PI * 2);
        if (this.rotation < 0) this.rotation += Math.PI * 2;

        this.modifiedAt = Date.now();

        this.emit(Events.ROTATED, {
            object: this,
            oldRotation,
            newRotation: this.rotation,
            deltaAngle
        });

        this.emit(Events.MODIFIED, { object: this });
    }

    /**
     * Set rotation to absolute angle
     * @param {number} angle - Angle in radians
     */
    setRotation(angle) {
        const delta = angle - this.rotation;
        this.rotate(delta);
    }

    /**
     * Set selection state
     * @param {boolean} selected - Whether object is selected
     */
    setSelected(selected) {
        if (this.isSelected === selected) return;

        this.isSelected = selected;

        this.emit(selected ? Events.SELECTED : Events.DESELECTED, { object: this });
    }

    /**
     * Set visibility state
     * @param {boolean} visible - Whether object is visible
     */
    setVisible(visible) {
        if (this.isVisible === visible) return;

        this.isVisible = visible;
        this.emit(Events.PROPERTY_CHANGED, { object: this, property: 'isVisible', value: visible });
        this.emit(Events.MODIFIED, { object: this });
    }

    /**
     * Update a property and emit change event
     * @param {string} property - Property name
     * @param {*} value - New value
     */
    setProperty(property, value) {
        if (this[property] === value) return;

        const oldValue = this[property];
        this[property] = value;
        this.modifiedAt = Date.now();

        this.emit(Events.PROPERTY_CHANGED, {
            object: this,
            property,
            oldValue,
            newValue: value
        });

        this.emit(Events.MODIFIED, { object: this });
    }

    /**
     * Get bounding box for this object
     * ABSTRACT METHOD - Must be implemented by subclasses
     * @returns {{left: number, right: number, top: number, bottom: number}}
     */
    getBounds() {
        throw new Error(`getBounds() not implemented for ${this.type}`);
    }

    /**
     * Get center point for this object
     * ABSTRACT METHOD - Must be implemented by subclasses
     * @returns {{x: number, y: number}}
     */
    getCenter() {
        throw new Error(`getCenter() not implemented for ${this.type}`);
    }

    /**
     * Check if a point is inside this object
     * Default implementation uses bounding box
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    containsPoint(x, y) {
        const bounds = this.getBounds();
        return x >= bounds.left && x <= bounds.right &&
               y >= bounds.top && y <= bounds.bottom;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            isVisible: this.isVisible,
            zIndex: this.zIndex,
            metadata: this.metadata,
            createdAt: this.createdAt,
            modifiedAt: this.modifiedAt
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} json - JSON object
     * @returns {BaseObject}
     */
    static fromJSON(json) {
        const obj = new BaseObject(json.type, json.x, json.y);
        obj.id = json.id;
        obj.rotation = json.rotation || 0;
        obj.isVisible = json.isVisible !== undefined ? json.isVisible : true;
        obj.zIndex = json.zIndex || 0;
        obj.metadata = json.metadata || {};
        obj.createdAt = json.createdAt || Date.now();
        obj.modifiedAt = json.modifiedAt || Date.now();
        return obj;
    }

    /**
     * Clone this object
     * @returns {BaseObject}
     */
    clone() {
        const json = this.toJSON();
        // Generate new ID for clone
        delete json.id;
        json.createdAt = Date.now();
        json.modifiedAt = Date.now();
        return BaseObject.fromJSON(json);
    }

    /**
     * Destroy this object and clean up listeners
     * IMPORTANT: Always call this when deleting an object
     */
    destroy() {
        this.emit(Events.DELETED, { object: this });
        super.destroy(); // Clean up all event listeners
    }
}
