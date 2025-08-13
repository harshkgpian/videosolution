// js/ui/tools.js
import { elements } from '../config.js';
import * as canvas from '../canvas/index.js';

export const setupToolButtons = () => {
    const tools = [
        { btn: elements.selectToolBtn, name: 'select', cursorClass: 'cursor-default' },
        { btn: elements.pencilBtn, name: 'pencil', cursorClass: 'cursor-dot' },
        { btn: elements.highlighterBtn, name: 'highlighter', cursorClass: 'cursor-highlighter' },
        { btn: elements.eraserBtn, name: 'eraser', cursorClass: 'cursor-eraser' },
    ];
    const cursorClasses = tools.map(t => t.cursorClass);

    const switchTool = (newToolName) => {
        const state = canvas.getState();
        const oldToolName = state.tool;

        // Save settings for the tool we are switching FROM
        if (oldToolName === 'pencil' || oldToolName === 'highlighter') {
            state.toolSettings[oldToolName].size = elements.sizeSelect.value;
            state.toolSettings[oldToolName].color = elements.colorSelect.value;
        } else if (oldToolName === 'eraser') {
            state.toolSettings[oldToolName].size = elements.sizeSelect.value;
        }

        // Set the new tool
        canvas.setTool(newToolName);

        // Load settings for the new tool and update the UI
        const newSettings = state.toolSettings[newToolName];
        if (newSettings) {
            if (newSettings.size) {
                elements.sizeSelect.value = newSettings.size;
            }
            if (newSettings.color) {
                elements.colorSelect.value = newSettings.color;
                elements.colorSelect.disabled = false;
            } else {
                elements.colorSelect.disabled = true;
            }
        }
        
        // Update UI styles (cursor and active button)
        const activeTool = tools.find(t => t.name === newToolName);
        if (activeTool) {
            elements.canvas.style.cursor = '';
            elements.canvas.classList.remove(...cursorClasses);
            elements.canvas.classList.add(activeTool.cursorClass);
            tools.forEach(t => t.btn.classList.remove('active'));
            activeTool.btn.classList.add('active');
        }
    };

    tools.forEach(tool => {
        tool.btn.addEventListener('click', () => switchTool(tool.name));
    });
};