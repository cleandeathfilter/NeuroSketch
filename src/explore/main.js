/**
 * main.js - Initialize 3D Brain Viewer
 * Entry point for NeuroSketch Explore mode
 */

import { BrainViewer } from './BrainViewer.js';

let brainViewer = null;

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🧠 NeuroSketch Explore initializing...');
    
    try {
        // Get canvas element
        const canvas = document.getElementById('brain-canvas');
        
        // Create brain viewer
        brainViewer = new BrainViewer(canvas);
        
        // Load brain model
        await brainViewer.loadBrain('/models/MVP-brain.glb');
        
        console.log('✅ Brain viewer initialized successfully!');
        
        // Hide loading indicator
        document.getElementById('loading').classList.add('hidden');
        
        // Make viewer globally available for controls
        window.brainViewer = brainViewer;
        
    } catch (error) {
        console.error('❌ Failed to initialize brain viewer:', error);
        document.getElementById('loading').innerHTML = `
            <p style="color: #ff6b6b;">Failed to load brain model</p>
            <p style="font-size: 12px; margin-top: 10px;">Error: ${error.message}</p>
        `;
    }
});

// Global control functions (called from HTML buttons)
window.resetBrain = () => {
    if (brainViewer) {
        brainViewer.resetPosition();
        console.log('🔄 Brain position reset');
    }
};

window.toggleWireframe = () => {
    if (brainViewer) {
        brainViewer.toggleWireframe();
        console.log('📐 Wireframe toggled');
    }
};

window.toggleLock = () => {
    if (brainViewer) {
        brainViewer.toggleLock();
    }
};

window.debugDrag = () => {
    if (brainViewer) {
        brainViewer.debugDragSystem();
    }
};

// Handle window resize
window.addEventListener('resize', () => {
    if (brainViewer) {
        brainViewer.onWindowResize();
    }
});
