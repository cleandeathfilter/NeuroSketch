/**
 * BrainViewer.js - 3D Brain Viewer with Proper Drag System
 * Uses DraggableObjectManager for drag-and-drop functionality
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DraggableObjectManager } from './DraggableObjectManager.js';

export class BrainViewer {
    constructor(canvas) {
        this.canvas = canvas;
        
        // State
        this.isLocked = false;
        this.brainModel = null;
        this.wireframeMode = false;
        this.dragManager = null;
        
        // Initialize Three.js scene
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        
        // Initialize drag manager AFTER controls
        this.initDragManager();
        
        // Start render loop
        this.animate();
        
        console.log('✅ BrainViewer initialized');
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
    }
    
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }
    
    initControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
        this.controls.zoomSpeed = 2.0;
        this.controls.target.set(1, 0, 0);
        this.controls.update();
    }
    
    initDragManager() {
        // Create drag manager with camera, canvas, and controls
        this.dragManager = new DraggableObjectManager(
            this.camera,
            this.canvas,
            this.controls
        );
    }
    
    async loadBrain(modelPath) {
        console.log('📦 Loading brain model from:', modelPath);
        
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                modelPath,
                (gltf) => {
                    this.brainModel = gltf.scene;
                    this.brainModel.name = 'Brain';
                    this.brainModel.position.set(1, 0, 0);
                    
                    // Add to scene
                    this.scene.add(this.brainModel);
                    
                    // Make brain draggable
                    this.dragManager.addDraggable(this.brainModel);
                    
                    // Update rotation center
                    this.controls.target.copy(this.brainModel.position);
                    this.controls.update();
                    
                    // Show lock button
                    this.showLockButton();
                    
                    console.log('✅ Brain model loaded and made draggable');
                    resolve(this.brainModel);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`Loading: ${percent.toFixed(0)}%`);
                },
                (error) => {
                    console.error('❌ Error loading brain:', error);
                    reject(error);
                }
            );
        });
    }
    
    showLockButton() {
        const lockBtn = document.getElementById('lock-btn');
        if (lockBtn) {
            lockBtn.classList.remove('hidden');
            lockBtn.addEventListener('click', () => this.toggleLock());
        }
    }
    
    updateLockButtonPosition() {
        if (!this.brainModel) return;
        
        // Project brain position to screen coordinates
        const vector = this.brainModel.position.clone();
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
        
        const lockBtn = document.getElementById('lock-btn');
        if (lockBtn) {
            lockBtn.style.left = (x + 50) + 'px';
            lockBtn.style.top = (y - 15) + 'px';
        }
    }
    
    toggleLock() {
        this.isLocked = !this.isLocked;
        
        const lockBtn = document.getElementById('lock-btn');
        const unlockedIcon = document.getElementById('lock-icon-unlocked');
        const lockedIcon = document.getElementById('lock-icon-locked');
        
        if (this.isLocked) {
            // Disable both drag and rotation
            this.controls.enabled = false;
            if (this.brainModel) {
                this.dragManager.removeDraggable(this.brainModel);
            }
            
            if (lockBtn) lockBtn.classList.add('locked');
            if (unlockedIcon) unlockedIcon.classList.add('hidden');
            if (lockedIcon) lockedIcon.classList.remove('hidden');
            
            console.log('🔒 Brain locked (drag and rotation disabled)');
        } else {
            // Enable both drag and rotation
            this.controls.enabled = true;
            if (this.brainModel) {
                this.dragManager.addDraggable(this.brainModel);
            }
            
            if (lockBtn) lockBtn.classList.remove('locked');
            if (unlockedIcon) unlockedIcon.classList.remove('hidden');
            if (lockedIcon) lockedIcon.classList.add('hidden');
            
            console.log('🔓 Brain unlocked (drag and rotation enabled)');
        }
    }
    
    resetPosition() {
        if (!this.brainModel) return;
        
        if (this.isLocked) this.toggleLock();
        
        this.brainModel.position.set(1, 0, 0);
        this.brainModel.rotation.set(0, 0, 0);
        
        this.camera.position.set(1, 1, 8);
        this.controls.target.set(1, 0, 0);
        this.controls.update();
        
        console.log('🔄 Brain position reset');
    }
    
    toggleWireframe() {
        if (!this.brainModel) return;
        
        this.wireframeMode = !this.wireframeMode;
        this.brainModel.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = this.wireframeMode;
            }
        });
        
        console.log('📐 Wireframe mode:', this.wireframeMode ? 'ON' : 'OFF');
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updateLockButtonPosition();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update lock button position
        if (this.brainModel) {
            this.updateLockButtonPosition();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Debug helper
    debugDragSystem() {
        console.log('🔍 DRAG SYSTEM DEBUG:', {
            brainExists: !!this.brainModel,
            brainPosition: this.brainModel?.position,
            isDraggable: this.brainModel?.userData.isDraggable,
            isLocked: this.isLocked,
            orbitControlsEnabled: this.controls.enabled,
            dragManagerExists: !!this.dragManager,
            draggableObjectsCount: this.dragManager?.draggableObjects.length
        });
    }
}
