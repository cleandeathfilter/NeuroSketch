/**
 * DraggableObjectManager.js
 * Manages drag-and-drop for 3D objects in Three.js
 * Based on: https://dev.to/calebmcolin/how-to-interactively-drag-3d-models-in-threejs-5a7h
 */

import * as THREE from 'three';

export class DraggableObjectManager {
    constructor(camera, canvas, controls) {
        this.camera = camera;
        this.canvas = canvas;
        this.controls = controls;
        
        // Raycaster for object detection
        this.raycaster = new THREE.Raycaster();
        
        // Mouse position vectors
        this.clickMouse = new THREE.Vector2();
        this.moveMouse = new THREE.Vector2();
        
        // Currently dragged object
        this.draggingObject = null;
        
        // Plane for drag calculations
        this.plane = new THREE.Plane();
        this.planeNormal = new THREE.Vector3();
        this.planeIntersect = new THREE.Vector3();
        this.offset = new THREE.Vector3();
        
        // Array of draggable objects
        this.draggableObjects = [];
        
        // Bind event handlers
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ DraggableObjectManager initialized');
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown, false);
        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('mouseup', this.onMouseUp, false);
    }
    
    /**
     * Add an object to be draggable
     * Automatically handles Groups (models) and individual Object3Ds
     */
    addDraggable(object) {
        // Mark as draggable
        object.userData.isDraggable = true;
        
        // Add to tracking array
        if (!this.draggableObjects.includes(object)) {
            this.draggableObjects.push(object);
            console.log('➕ Added draggable object:', object.name || object.type);
        }
    }
    
    /**
     * Remove an object from draggable list
     */
    removeDraggable(object) {
        object.userData.isDraggable = false;
        const index = this.draggableObjects.indexOf(object);
        if (index > -1) {
            this.draggableObjects.splice(index, 1);
        }
    }
    
    /**
     * Mouse down handler - select object to drag
     */
    onMouseDown(event) {
        // If already dragging, do nothing
        if (this.draggingObject) return;
        
        // Calculate mouse position in normalized device coordinates
        this.clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.clickMouse, this.camera);
        
        // Check for intersections with draggable objects
        const intersects = this.raycaster.intersectObjects(this.draggableObjects, true);
        
        if (intersects.length > 0) {
            // Get the topmost object (handles Groups)
            let selectedObject = this.getTopMostParent(intersects[0].object);
            
            // Check if it's draggable
            if (selectedObject.userData.isDraggable) {
                this.draggingObject = selectedObject;
                
                // Disable OrbitControls during drag
                if (this.controls) {
                    this.controls.enabled = false;
                }
                
                // Calculate plane for dragging (parallel to camera view)
                this.planeNormal.copy(this.camera.position).normalize();
                this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, this.draggingObject.position);
                
                // Calculate offset from intersection to object center
                if (this.raycaster.ray.intersectPlane(this.plane, this.planeIntersect)) {
                    this.offset.copy(this.planeIntersect).sub(this.draggingObject.position);
                }
                
                // Change cursor
                this.canvas.style.cursor = 'grabbing';
                
                console.log('🖱️ Started dragging:', selectedObject.name || selectedObject.type);
            }
        }
    }
    
    /**
     * Mouse move handler - drag object
     */
    onMouseMove(event) {
        // Update mouse position
        this.moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.moveMouse, this.camera);
        
        // If dragging, move the object
        if (this.draggingObject) {
            // Raycast to drag plane
            if (this.raycaster.ray.intersectPlane(this.plane, this.planeIntersect)) {
                // Calculate new position (intersection point - offset)
                this.draggingObject.position.copy(this.planeIntersect.sub(this.offset));
            }
        } else {
            // If not dragging, check for hover (change cursor)
            const intersects = this.raycaster.intersectObjects(this.draggableObjects, true);
            if (intersects.length > 0) {
                let hoveredObject = this.getTopMostParent(intersects[0].object);
                if (hoveredObject.userData.isDraggable) {
                    this.canvas.style.cursor = 'grab';
                    return;
                }
            }
            this.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Mouse up handler - release object
     */
    onMouseUp(event) {
        if (this.draggingObject) {
            console.log('🖱️ Released object at:', {
                x: this.draggingObject.position.x.toFixed(2),
                y: this.draggingObject.position.y.toFixed(2),
                z: this.draggingObject.position.z.toFixed(2)
            });
            
            this.draggingObject = null;
            
            // Re-enable OrbitControls
            if (this.controls) {
                this.controls.enabled = true;
            }
            
            // Reset cursor
            this.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Get the topmost parent of an object
     * Handles Groups (models with children) by traversing up the hierarchy
     */
    getTopMostParent(object) {
        let current = object;
        
        // Traverse up the parent chain
        while (current.parent && current.parent.type !== 'Scene') {
            current = current.parent;
        }
        
        return current;
    }
    
    /**
     * Clean up event listeners
     */
    dispose() {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        console.log('🗑️ DraggableObjectManager disposed');
    }
}
