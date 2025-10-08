/**
 * circuitTemplates.js - Preset Neural Circuit Templates
 *
 * Provides scientifically accurate preset neural circuits for educational diagrams.
 * Each template auto-generates neurons and synapses in correct configurations.
 *
 * Templates:
 * 1. Monosynaptic reflex arc (sensory → motor)
 * 2. Polysynaptic reflex (sensory → interneuron → motor)
 * 3. Reciprocal inhibition circuit
 * 4. Feedforward inhibition
 * 5. Feedback loop
 *
 * Scientific Accuracy:
 * - Correct neuron types for each circuit element
 * - Appropriate synapse types (excitatory/inhibitory)
 * - Realistic spacing and layout
 *
 * Research: research/circuits/circuit-motifs.md (to be created)
 */

/**
 * Generate monosynaptic reflex arc
 * Classic knee-jerk reflex: sensory neuron → motor neuron (1 synapse)
 *
 * Components:
 * - Sensory neuron (DRG, pseudounipolar)
 * - Motor neuron (large soma, long axon)
 * - 1 excitatory synapse (glutamate)
 */
export function createMonosynapticReflexArc(centerX = 400, centerY = 300) {
  const neurons = [];
  const synapses = [];

  // Sensory neuron (left)
  const sensoryNeuron = {
    type: 'bipolarSoma',
    x: centerX - 200,
    y: centerY,
    width: 30,
    height: 50,
    fillColor: '#E74C3C',      // Red (excitatory)
    strokeColor: '#C0392B',
    strokeWidth: 2,
    label: 'Sensory Neuron'
  };

  // Sensory axon
  const sensoryAxon = {
    type: 'unmyelinatedAxon',
    x1: centerX - 185,
    y1: centerY,
    x2: centerX - 50,
    y2: centerY,
    axonWidth: 4,
    strokeColor: '#E74C3C'
  };

  // Motor neuron soma (right)
  const motorNeuron = {
    type: 'circle',
    x: centerX + 100,
    y: centerY,
    radius: 40,
    fillColor: '#27AE60',      // Green (cholinergic)
    strokeColor: '#229954',
    strokeWidth: 2,
    label: 'Motor Neuron'
  };

  // Motor neuron dendrites (basal)
  const motorDendrite1 = {
    type: 'taperedLine',
    x1: centerX + 60,
    y1: centerY - 30,
    x2: centerX - 20,
    y2: centerY - 80,
    baseWidth: 6,
    tipWidth: 2,
    strokeColor: '#27AE60',
    isDendrite: true,
    showSpines: false
  };

  const motorDendrite2 = {
    type: 'taperedLine',
    x1: centerX + 60,
    y1: centerY + 30,
    x2: centerX - 20,
    y2: centerY + 80,
    baseWidth: 6,
    tipWidth: 2,
    strokeColor: '#27AE60',
    isDendrite: true,
    showSpines: false
  };

  // Motor axon
  const motorAxon = {
    type: 'myelinatedAxon',
    x1: centerX + 140,
    y1: centerY,
    x2: centerX + 350,
    y2: centerY,
    axonWidth: 3,
    myelinWidth: 6,
    internodeLength: 60,
    nodeWidth: 2,
    myelinColor: '#F5F5DC',
    axonColor: '#A93226',
    strokeColor: '#8B7355',
    showNodes: true
  };

  neurons.push(sensoryNeuron, sensoryAxon, motorNeuron, motorDendrite1, motorDendrite2, motorAxon);

  // Excitatory synapse (sensory → motor)
  const synapse = {
    type: 'synapse',
    id: 'syn_reflex_' + Date.now(),
    sourceObj: sensoryAxon,
    targetObj: motorDendrite1,
    sourcePoint: {x: centerX - 50, y: centerY},
    targetPoint: {x: centerX + 20, y: centerY - 60},
    synapseType: 'excitatory',
    strength: 1.2,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  synapses.push(synapse);

  return {
    neurons: neurons,
    synapses: synapses,
    name: 'Monosynaptic Reflex Arc',
    description: 'Classic knee-jerk reflex with one synapse between sensory and motor neurons.'
  };
}

/**
 * Generate polysynaptic reflex
 * Sensory → interneuron → motor (2 synapses)
 */
export function createPolysynapticReflex(centerX = 400, centerY = 300) {
  const neurons = [];
  const synapses = [];

  // Sensory neuron (left)
  const sensoryNeuron = {
    type: 'circle',
    x: centerX - 250,
    y: centerY,
    radius: 30,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  const sensoryAxon = {
    type: 'unmyelinatedAxon',
    x1: centerX - 220,
    y1: centerY,
    x2: centerX - 100,
    y2: centerY,
    axonWidth: 4,
    strokeColor: '#E74C3C'
  };

  // Interneuron (center)
  const interneuron = {
    type: 'circle',
    x: centerX,
    y: centerY,
    radius: 25,
    fillColor: '#3498DB',      // Blue (inhibitory interneuron)
    strokeColor: '#2980B9',
    strokeWidth: 2
  };

  const interneuronDendrites = {
    type: 'taperedLine',
    x1: centerX - 20,
    y1: centerY - 15,
    x2: centerX - 80,
    y2: centerY - 60,
    baseWidth: 5,
    tipWidth: 2,
    strokeColor: '#3498DB',
    isDendrite: true,
    showSpines: false
  };

  const interneuronAxon = {
    type: 'unmyelinatedAxon',
    x1: centerX + 25,
    y1: centerY,
    x2: centerX + 120,
    y2: centerY,
    axonWidth: 3,
    strokeColor: '#3498DB'
  };

  // Motor neuron (right)
  const motorNeuron = {
    type: 'circle',
    x: centerX + 200,
    y: centerY,
    radius: 40,
    fillColor: '#27AE60',
    strokeColor: '#229954',
    strokeWidth: 2
  };

  const motorDendrite = {
    type: 'taperedLine',
    x1: centerX + 165,
    y1: centerY - 25,
    x2: centerX + 100,
    y2: centerY - 70,
    baseWidth: 6,
    tipWidth: 2,
    strokeColor: '#27AE60',
    isDendrite: true,
    showSpines: false
  };

  const motorAxon = {
    type: 'myelinatedAxon',
    x1: centerX + 240,
    y1: centerY,
    x2: centerX + 400,
    y2: centerY,
    axonWidth: 3,
    myelinWidth: 6,
    internodeLength: 60,
    nodeWidth: 2,
    myelinColor: '#F5F5DC',
    axonColor: '#A93226',
    strokeColor: '#8B7355',
    showNodes: true
  };

  neurons.push(sensoryNeuron, sensoryAxon, interneuron, interneuronDendrites, interneuronAxon, motorNeuron, motorDendrite, motorAxon);

  // Synapse 1: Sensory → Interneuron (excitatory)
  const synapse1 = {
    type: 'synapse',
    id: 'syn_poly1_' + Date.now(),
    sourceObj: sensoryAxon,
    targetObj: interneuronDendrites,
    sourcePoint: {x: centerX - 100, y: centerY},
    targetPoint: {x: centerX - 50, y: centerY - 40},
    synapseType: 'excitatory',
    strength: 1.0,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Synapse 2: Interneuron → Motor (inhibitory)
  const synapse2 = {
    type: 'synapse',
    id: 'syn_poly2_' + Date.now(),
    sourceObj: interneuronAxon,
    targetObj: motorDendrite,
    sourcePoint: {x: centerX + 120, y: centerY},
    targetPoint: {x: centerX + 135, y: centerY - 50},
    synapseType: 'inhibitory',
    strength: 1.0,
    neurotransmitter: 'GABA',
    terminalColor: '#3498DB',
    connectionColor: '#3498DB',
    symbol: '⊣',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  synapses.push(synapse1, synapse2);

  return {
    neurons: neurons,
    synapses: synapses,
    name: 'Polysynaptic Reflex',
    description: 'Withdrawal reflex with interneuron mediation (2 synapses).'
  };
}

/**
 * Generate reciprocal inhibition circuit
 * Classic antagonistic muscle control
 */
export function createReciprocalInhibition(centerX = 400, centerY = 300) {
  const neurons = [];
  const synapses = [];

  // Sensory input (top)
  const sensory = {
    type: 'circle',
    x: centerX,
    y: centerY - 150,
    radius: 30,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  // Inhibitory interneuron (center)
  const interneuron = {
    type: 'circle',
    x: centerX - 120,
    y: centerY,
    radius: 25,
    fillColor: '#3498DB',
    strokeColor: '#2980B9',
    strokeWidth: 2
  };

  // Agonist motor neuron (bottom right)
  const agonist = {
    type: 'circle',
    x: centerX + 120,
    y: centerY + 100,
    radius: 40,
    fillColor: '#27AE60',
    strokeColor: '#229954',
    strokeWidth: 2
  };

  // Antagonist motor neuron (bottom left)
  const antagonist = {
    type: 'circle',
    x: centerX - 120,
    y: centerY + 100,
    radius: 40,
    fillColor: '#27AE60',
    strokeColor: '#229954',
    strokeWidth: 2
  };

  neurons.push(sensory, interneuron, agonist, antagonist);

  // Synapses
  // Sensory → Agonist (excitatory)
  const syn1 = {
    type: 'synapse',
    id: 'syn_recip1_' + Date.now(),
    sourceObj: sensory,
    targetObj: agonist,
    sourcePoint: {x: centerX, y: centerY - 120},
    targetPoint: {x: centerX + 100, y: centerY + 65},
    synapseType: 'excitatory',
    strength: 1.2,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Sensory → Interneuron (excitatory)
  const syn2 = {
    type: 'synapse',
    id: 'syn_recip2_' + Date.now(),
    sourceObj: sensory,
    targetObj: interneuron,
    sourcePoint: {x: centerX, y: centerY - 120},
    targetPoint: {x: centerX - 100, y: centerY - 20},
    synapseType: 'excitatory',
    strength: 1.0,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Interneuron → Antagonist (inhibitory)
  const syn3 = {
    type: 'synapse',
    id: 'syn_recip3_' + Date.now(),
    sourceObj: interneuron,
    targetObj: antagonist,
    sourcePoint: {x: centerX - 120, y: centerY + 25},
    targetPoint: {x: centerX - 120, y: centerY + 60},
    synapseType: 'inhibitory',
    strength: 1.2,
    neurotransmitter: 'GABA',
    terminalColor: '#3498DB',
    connectionColor: '#3498DB',
    symbol: '⊣',
    lineStyle: 'solid',
    connectionStyle: 'straight',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  synapses.push(syn1, syn2, syn3);

  return {
    neurons: neurons,
    synapses: synapses,
    name: 'Reciprocal Inhibition',
    description: 'Antagonistic muscle control: agonist activated, antagonist inhibited.'
  };
}

/**
 * Generate feedforward inhibition circuit
 * Common cortical motif for gain control
 */
export function createFeedforwardInhibition(centerX = 400, centerY = 300) {
  const neurons = [];
  const synapses = [];

  // Input neuron (left)
  const input = {
    type: 'circle',
    x: centerX - 200,
    y: centerY,
    radius: 35,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  // Inhibitory interneuron (top center)
  const interneuron = {
    type: 'circle',
    x: centerX - 50,
    y: centerY - 100,
    radius: 25,
    fillColor: '#3498DB',
    strokeColor: '#2980B9',
    strokeWidth: 2
  };

  // Output neuron (right)
  const output = {
    type: 'circle',
    x: centerX + 100,
    y: centerY,
    radius: 35,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  neurons.push(input, interneuron, output);

  // Synapses
  // Input → Output (excitatory, direct)
  const syn1 = {
    type: 'synapse',
    id: 'syn_ff1_' + Date.now(),
    sourceObj: input,
    targetObj: output,
    sourcePoint: {x: centerX - 165, y: centerY},
    targetPoint: {x: centerX + 65, y: centerY},
    synapseType: 'excitatory',
    strength: 1.5,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'straight',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Input → Interneuron (excitatory)
  const syn2 = {
    type: 'synapse',
    id: 'syn_ff2_' + Date.now(),
    sourceObj: input,
    targetObj: interneuron,
    sourcePoint: {x: centerX - 175, y: centerY - 25},
    targetPoint: {x: centerX - 70, y: centerY - 80},
    synapseType: 'excitatory',
    strength: 1.0,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Interneuron → Output (inhibitory)
  const syn3 = {
    type: 'synapse',
    id: 'syn_ff3_' + Date.now(),
    sourceObj: interneuron,
    targetObj: output,
    sourcePoint: {x: centerX - 30, y: centerY - 80},
    targetPoint: {x: centerX + 80, y: centerY - 25},
    synapseType: 'inhibitory',
    strength: 1.2,
    neurotransmitter: 'GABA',
    terminalColor: '#3498DB',
    connectionColor: '#3498DB',
    symbol: '⊣',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  synapses.push(syn1, syn2, syn3);

  return {
    neurons: neurons,
    synapses: synapses,
    name: 'Feedforward Inhibition',
    description: 'Input excites output directly and inhibits it via interneuron (gain control).'
  };
}

/**
 * Generate feedback loop circuit
 * Recurrent excitation with inhibitory control
 */
export function createFeedbackLoop(centerX = 400, centerY = 300) {
  const neurons = [];
  const synapses = [];

  // Principal neuron 1 (left)
  const neuron1 = {
    type: 'circle',
    x: centerX - 100,
    y: centerY,
    radius: 35,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  // Principal neuron 2 (right)
  const neuron2 = {
    type: 'circle',
    x: centerX + 100,
    y: centerY,
    radius: 35,
    fillColor: '#E74C3C',
    strokeColor: '#C0392B',
    strokeWidth: 2
  };

  // Inhibitory feedback interneuron (bottom)
  const interneuron = {
    type: 'circle',
    x: centerX,
    y: centerY + 120,
    radius: 25,
    fillColor: '#3498DB',
    strokeColor: '#2980B9',
    strokeWidth: 2
  };

  neurons.push(neuron1, neuron2, interneuron);

  // Synapses
  // Neuron 1 → Neuron 2 (excitatory forward)
  const syn1 = {
    type: 'synapse',
    id: 'syn_fb1_' + Date.now(),
    sourceObj: neuron1,
    targetObj: neuron2,
    sourcePoint: {x: centerX - 65, y: centerY},
    targetPoint: {x: centerX + 65, y: centerY},
    synapseType: 'excitatory',
    strength: 1.2,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'straight',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Neuron 2 → Interneuron (excitatory)
  const syn2 = {
    type: 'synapse',
    id: 'syn_fb2_' + Date.now(),
    sourceObj: neuron2,
    targetObj: interneuron,
    sourcePoint: {x: centerX + 80, y: centerY + 30},
    targetPoint: {x: centerX + 20, y: centerY + 100},
    synapseType: 'excitatory',
    strength: 1.0,
    neurotransmitter: 'Glutamate',
    terminalColor: '#E74C3C',
    connectionColor: '#E74C3C',
    symbol: '▶',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  // Interneuron → Neuron 1 (inhibitory feedback)
  const syn3 = {
    type: 'synapse',
    id: 'syn_fb3_' + Date.now(),
    sourceObj: interneuron,
    targetObj: neuron1,
    sourcePoint: {x: centerX - 20, y: centerY + 100},
    targetPoint: {x: centerX - 80, y: centerY + 30},
    synapseType: 'inhibitory',
    strength: 1.2,
    neurotransmitter: 'GABA',
    terminalColor: '#3498DB',
    connectionColor: '#3498DB',
    symbol: '⊣',
    lineStyle: 'solid',
    connectionStyle: 'curved',
    showSymbol: true,
    showNeurotransmitter: false,
    signalPosition: 0,
    isAnimating: false
  };

  synapses.push(syn1, syn2, syn3);

  return {
    neurons: neurons,
    synapses: synapses,
    name: 'Feedback Loop',
    description: 'Recurrent excitation with inhibitory feedback for oscillation control.'
  };
}

/**
 * Get all available circuit templates
 */
export function getAllCircuitTemplates() {
  return [
    {name: 'Monosynaptic Reflex Arc', generator: createMonosynapticReflexArc},
    {name: 'Polysynaptic Reflex', generator: createPolysynapticReflex},
    {name: 'Reciprocal Inhibition', generator: createReciprocalInhibition},
    {name: 'Feedforward Inhibition', generator: createFeedforwardInhibition},
    {name: 'Feedback Loop', generator: createFeedbackLoop}
  ];
}
