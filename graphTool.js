// Compatibility wrapper for canvasRenderer.js
// Exports rendering functions and presets for scientific graphs

export const GRAPH_PRESETS = {
    actionPotential: {
        standard: {
            curvePoints: [
                {x: 0, y: -70, label: 'Resting'},
                {x: 1, y: -55, label: 'Threshold'},
                {x: 1.5, y: 40, label: 'Peak'},
                {x: 2.5, y: -80, label: 'Hyperpolarization'},
                {x: 4, y: -70, label: 'Return'}
            ]
        },
        fast: {
            curvePoints: [
                {x: 0, y: -70},
                {x: 0.5, y: -55},
                {x: 0.8, y: 40},
                {x: 1.5, y: -80},
                {x: 2.5, y: -70}
            ]
        },
        slow: {
            curvePoints: [
                {x: 0, y: -70},
                {x: 2, y: -55},
                {x: 3, y: 40},
                {x: 5, y: -80},
                {x: 7, y: -70}
            ]
        },
        cardiac: {
            curvePoints: [
                {x: 0, y: -70},
                {x: 1, y: -55},
                {x: 1.5, y: 40},
                {x: 3, y: 20},
                {x: 4, y: -80},
                {x: 5, y: -70}
            ]
        }
    },
    synapticPotential: {
        epsp: {
            curvePoints: [
                {x: 0, y: -70},
                {x: 1, y: -60},
                {x: 2, y: -65},
                {x: 3, y: -70}
            ]
        },
        ipsp: {
            curvePoints: [
                {x: 0, y: -70},
                {x: 1, y: -80},
                {x: 2, y: -75},
                {x: 3, y: -70}
            ]
        }
    }
};

export function graphToCanvas(graph, zoom) {
    // Convert graph world coordinates to canvas coordinates
    // This is a helper used by canvasRenderer during graph rendering
    return {
        x: graph.x,
        y: graph.y,
        width: graph.width,
        height: graph.height,
        points: graph.points,
        type: graph.graphType,
        preset: graph.preset
    };
}
