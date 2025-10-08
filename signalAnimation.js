/**
 * signalAnimation.js - Signal Propagation Animation System
 *
 * Animates action potential signals traveling through synapses in neural circuits.
 * Provides smooth 60 FPS animation using requestAnimationFrame.
 *
 * Features:
 * - Single synapse animation
 * - Circuit-wide animation (cascading through multiple synapses)
 * - Playback controls (play, pause, reset, speed)
 * - Synchronization with graph animations (future integration)
 *
 * Animation Duration: 1-2 seconds per synapse (user-configurable)
 */

// Animation state
let animationState = {
  isPlaying: false,
  animatedSynapses: [],      // Array of {synapse, startTime, duration}
  startTime: null,
  animationFrameId: null,
  speed: 1.0,                 // Speed multiplier (0.25x to 2x)
  loopEnabled: false
};

/**
 * Start animating a single synapse
 * @param {Object} synapse - Synapse object to animate
 * @param {number} duration - Animation duration in milliseconds (default: 1500ms)
 */
export function animateSynapse(synapse, duration = 1500) {
  if (!synapse || synapse.type !== 'synapse') return;

  synapse.isAnimating = true;
  synapse.signalPosition = 0;

  animationState.animatedSynapses.push({
    synapse: synapse,
    startTime: Date.now(),
    duration: duration
  });

  // Start animation loop if not already running
  if (!animationState.isPlaying) {
    startAnimationLoop();
  }
}

/**
 * Start animating multiple synapses in sequence (circuit animation)
 * @param {Array} synapses - Array of synapses to animate
 * @param {number} delayBetween - Delay between each synapse activation (ms)
 * @param {number} duration - Duration per synapse (ms)
 */
export function animateCircuit(synapses, delayBetween = 500, duration = 1500) {
  if (!synapses || synapses.length === 0) return;

  const now = Date.now();

  synapses.forEach((synapse, index) => {
    if (synapse.type !== 'synapse') return;

    synapse.isAnimating = true;
    synapse.signalPosition = 0;

    animationState.animatedSynapses.push({
      synapse: synapse,
      startTime: now + (index * delayBetween),
      duration: duration
    });
  });

  // Start animation loop
  if (!animationState.isPlaying) {
    startAnimationLoop();
  }
}

/**
 * Start the animation loop (using requestAnimationFrame for 60 FPS)
 */
function startAnimationLoop() {
  animationState.isPlaying = true;
  animationState.startTime = Date.now();
  updateAnimation();
}

/**
 * Animation update loop (called ~60 times per second)
 */
function updateAnimation() {
  if (!animationState.isPlaying) return;

  const now = Date.now();

  // Update each animated synapse
  animationState.animatedSynapses = animationState.animatedSynapses.filter(item => {
    const elapsed = (now - item.startTime) * animationState.speed;
    const progress = elapsed / item.duration;

    if (progress >= 1.0) {
      // Animation complete
      item.synapse.signalPosition = 1.0;
      item.synapse.isAnimating = false;

      // Trigger postsynaptic neuron highlight (future feature)
      // highlightPostsynapticNeuron(item.synapse.targetObj);

      return false; // Remove from animated list
    } else if (progress >= 0) {
      // Update signal position (0 to 1)
      item.synapse.signalPosition = progress;
      return true; // Keep in animated list
    } else {
      // Not started yet (scheduled for future)
      item.synapse.signalPosition = 0;
      return true;
    }
  });

  // Continue loop if there are active animations
  if (animationState.animatedSynapses.length > 0) {
    animationState.animationFrameId = requestAnimationFrame(updateAnimation);
  } else {
    // All animations complete
    stopAnimationLoop();

    // Loop if enabled
    if (animationState.loopEnabled) {
      // Restart after brief pause
      setTimeout(() => {
        if (animationState.loopEnabled) {
          // TODO: Re-trigger last animation sequence
        }
      }, 1000);
    }
  }
}

/**
 * Stop the animation loop
 */
function stopAnimationLoop() {
  animationState.isPlaying = false;
  if (animationState.animationFrameId) {
    cancelAnimationFrame(animationState.animationFrameId);
    animationState.animationFrameId = null;
  }
}

/**
 * Pause animation
 */
export function pauseAnimation() {
  animationState.isPlaying = false;
  if (animationState.animationFrameId) {
    cancelAnimationFrame(animationState.animationFrameId);
    animationState.animationFrameId = null;
  }
}

/**
 * Resume animation
 */
export function resumeAnimation() {
  if (animationState.animatedSynapses.length > 0 && !animationState.isPlaying) {
    // Adjust start times to account for pause duration
    const pauseDuration = Date.now() - (animationState.startTime || Date.now());
    animationState.animatedSynapses.forEach(item => {
      item.startTime += pauseDuration;
    });

    startAnimationLoop();
  }
}

/**
 * Reset animation (stop and clear all signals)
 */
export function resetAnimation() {
  stopAnimationLoop();

  // Clear all synapse animations
  animationState.animatedSynapses.forEach(item => {
    item.synapse.isAnimating = false;
    item.synapse.signalPosition = 0;
  });

  animationState.animatedSynapses = [];
}

/**
 * Set animation speed
 * @param {number} speed - Speed multiplier (0.25 to 2.0)
 */
export function setAnimationSpeed(speed) {
  animationState.speed = Math.max(0.25, Math.min(2.0, speed));
}

/**
 * Get current animation speed
 */
export function getAnimationSpeed() {
  return animationState.speed;
}

/**
 * Set loop mode
 * @param {boolean} enabled - Whether to loop animations
 */
export function setLoopEnabled(enabled) {
  animationState.loopEnabled = enabled;
}

/**
 * Check if animation is playing
 */
export function isAnimationPlaying() {
  return animationState.isPlaying;
}

/**
 * Get animation state (for UI updates)
 */
export function getAnimationState() {
  return {
    isPlaying: animationState.isPlaying,
    speed: animationState.speed,
    loopEnabled: animationState.loopEnabled,
    activeSynapseCount: animationState.animatedSynapses.length
  };
}

/**
 * Animate signal propagation through a chain of connected synapses
 * Automatically detects connections and cascades the signal
 * @param {Object} startNeuron - Starting neuron object
 * @param {Array} allSynapses - Array of all synapses in the scene
 * @param {Array} allNeurons - Array of all neuron objects
 */
export function animateSignalPropagation(startNeuron, allSynapses, allNeurons) {
  // Find synapses starting from this neuron
  const synapsesToAnimate = [];
  const visited = new Set();

  function findConnectedSynapses(neuron, depth = 0, delay = 0) {
    if (depth > 10) return; // Prevent infinite loops
    if (visited.has(neuron)) return;
    visited.add(neuron);

    // Find synapses where this neuron is the source
    allSynapses.forEach(synapse => {
      if (synapse.sourceObj === neuron && !visited.has(synapse)) {
        visited.add(synapse);
        synapsesToAnimate.push({
          synapse: synapse,
          delay: delay
        });

        // Recursively find next synapses
        if (synapse.targetObj) {
          findConnectedSynapses(synapse.targetObj, depth + 1, delay + 500);
        }
      }
    });
  }

  findConnectedSynapses(startNeuron);

  // Animate found synapses
  if (synapsesToAnimate.length > 0) {
    const now = Date.now();
    synapsesToAnimate.forEach(item => {
      item.synapse.isAnimating = true;
      item.synapse.signalPosition = 0;

      animationState.animatedSynapses.push({
        synapse: item.synapse,
        startTime: now + item.delay,
        duration: 1500
      });
    });

    if (!animationState.isPlaying) {
      startAnimationLoop();
    }
  }
}

/**
 * Highlight postsynaptic neuron when signal arrives (future feature)
 * @param {Object} neuronObj - Neuron to highlight
 */
function highlightPostsynapticNeuron(neuronObj) {
  // TODO: Implement neuron flash/glow effect
  // Could add temporary highlight property to neuron object
  // Renderer would check for this and add glow effect
}

/**
 * Update function to be called from app.js render loop
 * Ensures smooth animation rendering
 */
export function updateAnimationFrame() {
  // This function is called from app.js to ensure render happens
  // The actual animation update is handled by requestAnimationFrame
  // But we can use this for any per-frame setup if needed
}

/**
 * Clean up animation state (call when clearing canvas or loading new project)
 */
export function cleanupAnimations() {
  resetAnimation();
  animationState = {
    isPlaying: false,
    animatedSynapses: [],
    startTime: null,
    animationFrameId: null,
    speed: 1.0,
    loopEnabled: false
  };
}
