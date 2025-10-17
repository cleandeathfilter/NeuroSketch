/**
 * BrainViewer.js - Main 3D brain visualization controller
 * Handles Three.js scene, camera, lighting, controls, and brain model
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class BrainViewer {
    constructor(canvas) {
        this.canvas = canvas;
        
        // State
        this.isLocked = false;
        this.isDraggingHandle = false;
        this.brainModel = null;
        this.dragHandle = null;
        this.wireframeMode = false;
        
        // Initialize Three.js scene
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.initDragHandle();
        this.initRaycaster();
        
        // Start render loop
        this.animate();
        
        console.log('✅ BrainViewer initialized');
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Pure black
    }
    
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            50, // FOV
            window.innerWidth / window.innerHeight, // Aspect
            0.1, // Near
            1000 // Far
        );
        
        // Position camera further back to view brain (centered to right side)
        this.camera.position.set(1, 1, 8);
        this.camera.lookAt(1, 0, 0);
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    
    initLights() {
        // Ambient light (soft overall illumination)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (main light source)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
        
        // Fill light (from opposite side)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }
    
    initControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false; // Disable panning (we use drag handle)
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
        
        // Faster zoom speed
        this.controls.zoomSpeed = 2.0;
        
        // Set target to center-right (where brain will be)
        this.controls.target.set(1, 0, 0);
        this.controls.update();
    }
    
    initDragHandle() {
        // Create drag handle as a solid cube (easier to click than wireframe)
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });
        
        this.dragHandle = new THREE.Mesh(geometry, material);
        this.dragHandle.name = 'dragHandle';
        
        // Add wireframe outline for visibility
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        this.dragHandle.add(wireframe);
        
        // Position will be updated when brain loads (underneath brain)
        this.dragHandle.visible = false; // Hidden until brain loads
        
        this.scene.add(this.dragHandle);
    }
    
    initRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this.intersection = new THREE.Vector3();
        this.dragOffset = new THREE.Vector3();
        this.dragStartPos = new THREE.Vector3();
        
        // Mouse event listeners for drag handle
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }
    
    async loadBrain(modelPath) {
        console.log('📦 Loading brain model from:', modelPath);
        
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                modelPath,
                (gltf) => {
                    this.brainModel = gltf.scene;
                    
                    // Position brain center-right (avatar space on left)
                    this.brainModel.position.set(1, 0, 0);
                    
                    // Scale if needed (adjust based on your model)
                    this.brainModel.scale.set(1, 1, 1);
                    
                    this.scene.add(this.brainModel);
                    
                    // Position drag handle underneath brain
                    this.updateDragHandlePosition();
                    this.dragHandle.visible = true;
                    
                    // Set OrbitControls target to brain position (rotation follows brain!)
                    this.controls.target.copy(this.brainModel.position);
                    this.controls.update();
                    
                    // Show lock button
                    this.showLockButton();
                    
                    console.log('✅ Brain model loaded successfully');
                    resolve(this.brainModel);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`Loading: ${percent.toFixed(0)}%`);
                },
                (error) => {
                    console.error('❌ Error loading brain model:', error);
                    reject(error);
                }
            );
        });
    }
    
    updateDragHandlePosition() {
        if (!this.brainModel || !this.dragHandle) return;
        
        // Calculate bounding box of brain
        const box = new THREE.Box3().setFromObject(this.brainModel);
        const min = box.min;
        
        // Position drag handle below brain
        this.dragHandle.position.set(
            this.brainModel.position.x,
            min.y - 0.5, // Slightly below brain
            this.brainModel.position.z
        );
    }
    
    showLockButton() {
        const lockBtn = document.getElementById('lock-btn');
        lockBtn.classList.remove('hidden');
        
        // Position lock button in 2D screen space (to the right of drag handle)
        this.updateLockButtonPosition();
        
        // Add click handler
        lockBtn.addEventListener('click', () => this.toggleLock());
    }
    
    updateLockButtonPosition() {
        if (!this.dragHandle) return;
        
        // Convert 3D drag handle position to 2D screen position
        const vector = this.dragHandle.position.clone();
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
        
        const lockBtn = document.getElementById('lock-btn');
        lockBtn.style.left = (x + 40) + 'px'; // 40px to the right of handle
        lockBtn.style.top = (y - 15) + 'px';  // Centered vertically
    }
    
    onMouseDown(event) {
        if (this.isLocked) return;
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycast to check if drag handle was clicked
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.dragHandle, true);
        
        if (intersects.length > 0) {
            // Clicked on drag handle - start dragging
            this.isDraggingHandle = true;
            this.controls.enabled = false; // Disable rotation while dragging
            document.body.classList.add('dragging');
            
            // Store mouse start position for XY movement calculation
            this.dragStartMouse = { x: event.clientX, y: event.clientY };
            this.dragStartPos.copy(this.brainModel.position);
            
            console.log('🖱️ Drag handle grabbed - XY movement only');
        }
    }
    
    onMouseMove(event) {
        if (!this.isDraggingHandle || this.isLocked) return;
        
        // Calculate mouse delta (how far mouse moved)
        const deltaX = event.clientX - this.dragStartMouse.x;
        const deltaY = event.clientY - this.dragStartMouse.y;
        
        // Convert screen space movement to world space (XY only, Z stays same!)
        // Increased sensitivity for better control
        const movementScale = 0.005;
        
        const newX = this.dragStartPos.x + (deltaX * movementScale);
        const newY = this.dragStartPos.y - (deltaY * movementScale);
        
        this.brainModel.position.x = newX;
        this.brainModel.position.y = newY;
        // Z position unchanged - controlled by zoom only
        
        // Update drag handle and rotation center
        this.updateDragHandlePosition();
        this.controls.target.set(newX, newY, this.brainModel.position.z);
        this.controls.update();
    }
    
    onMouseUp(event) {
        if (this.isDraggingHandle) {
            this.isDraggingHandle = false;
            this.controls.enabled = true; // Re-enable rotation
            document.body.classList.remove('dragging');
            
            // Ensure OrbitControls target is locked to brain position
            if (this.brainModel) {
                this.controls.target.copy(this.brainModel.position);
                this.controls.update();
            }
            
            console.log('🖱️ Drag handle released - rotation centered on brain');
        }
    }
    
    toggleLock() {
        this.isLocked = !this.isLocked;
        this.controls.enabled = !this.isLocked;
        
        const lockBtn = document.getElementById('lock-btn');
        const unlockedIcon = document.getElementById('lock-icon-unlocked');
        const lockedIcon = document.getElementById('lock-icon-locked');
        
        if (this.isLocked) {
            lockBtn.classList.add('locked');
            unlockedIcon.classList.add('hidden');
            lockedIcon.classList.remove('hidden');
            console.log('🔒 Brain locked');
        } else {
            lockBtn.classList.remove('locked');
            unlockedIcon.classList.remove('hidden');
            lockedIcon.classList.add('hidden');
            console.log('🔓 Brain unlocked');
        }
    }
    
    resetPosition() {
        if (!this.brainModel) return;
        
        // Unlock if locked
        if (this.isLocked) {
            this.toggleLock();
        }
        
        // Reset brain position to center-right
        this.brainModel.position.set(1, 0, 0);
        this.brainModel.rotation.set(0, 0, 0);
        
        // Update drag handle
        this.updateDragHandlePosition();
        
        // Reset camera
        this.camera.position.set(1, 1, 8);
        this.controls.target.set(1, 0, 0);
        this.controls.update();
    }
    
    toggleWireframe() {
        if (!this.brainModel) return;
        
        this.wireframeMode = !this.wireframeMode;
        
        this.brainModel.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = this.wireframeMode;
            }
        });
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update lock button position
        this.updateLockButtonPosition();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update lock button position (follows brain if moving)
        if (this.dragHandle.visible) {
            this.updateLockButtonPosition();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}
