/**
 * Tool Manager - manages all drawing tools
 * Implements Strategy Pattern for tools
 *
 * Benefits:
 * - Tool state encapsulated (not in app.js)
 * - Auto-cleanup on switch (no forgotten resets)
 * - Easy to add tools (just register)
 * - Delegates events to current tool
 */

export class ToolManager {
    constructor() {
        this.tools = new Map();
        this.currentTool = null;
    }

    register(tool) {
        this.tools.set(tool.name, tool);
        console.log(`Tool registered: ${tool.name}`);
    }

    switchTool(toolName) {
        const newTool = this.tools.get(toolName);
        if (!newTool) {
            console.error(`Tool not found: ${toolName}`);
            return false;
        }

        // Deactivate current tool (AUTO-CLEANUP!)
        if (this.currentTool) {
            this.currentTool.onDeactivate();
        }

        // Activate new tool
        this.currentTool = newTool;
        this.currentTool.onActivate();

        console.log(`Switched to tool: ${toolName}`);
        return true;
    }

    getCurrentTool() {
        return this.currentTool;
    }

    getCurrentToolName() {
        return this.currentTool?.name || null;
    }

    // Delegate events to current tool
    handleMouseDown(worldX, worldY, clickedObj, app) {
        if (!this.currentTool) {
            console.warn('No tool active');
            return {};
        }
        return this.currentTool.onMouseDown(worldX, worldY, clickedObj, app) || {};
    }

    handleMouseMove(worldX, worldY, clickedObj, app) {
        if (!this.currentTool) {
            return {};
        }
        return this.currentTool.onMouseMove(worldX, worldY, clickedObj, app) || {};
    }

    handleMouseUp(worldX, worldY, clickedObj, app) {
        if (!this.currentTool) {
            return {};
        }
        return this.currentTool.onMouseUp(worldX, worldY, clickedObj, app) || {};
    }

    handleKeyDown(key, app) {
        if (!this.currentTool) {
            return {};
        }
        return this.currentTool.onKeyDown(key, app) || {};
    }

    handleKeyUp(key, app) {
        if (!this.currentTool) {
            return {};
        }
        return this.currentTool.onKeyUp(key, app) || {};
    }

    renderPreview(ctx, app) {
        if (this.currentTool) {
            this.currentTool.renderPreview(ctx, app);
        }
    }

    // Utility methods
    hasTool(toolName) {
        return this.tools.has(toolName);
    }

    getAllTools() {
        return Array.from(this.tools.values());
    }

    getAllToolNames() {
        return Array.from(this.tools.keys());
    }
}
