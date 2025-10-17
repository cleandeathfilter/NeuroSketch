// Minimal reproduction of app.js structure

import { StateMachine, InteractionState } from './src/core/StateMachine.js';
import { ToolManager } from './src/core/ToolManager.js';
import { CircleTool } from './src/tools/CircleTool.js';
import { TextEditor } from './textEditor.js';
import { drawObject } from './canvasRenderer.js';

export const app = {
    canvas: null,
    stateMachine: null,
    
    init() {
        console.log('Init called');
    }
};
