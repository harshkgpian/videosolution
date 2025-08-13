// js/ui/brush.js
import { elements } from '../config.js';
import * as canvas from '../canvas/index.js';

export const setupBrushControls = () => {
    const updateCurrentToolSettings = () => {
        const state = canvas.getState();
        const currentTool = state.tool;

        if (state.toolSettings[currentTool]) {
            if (state.toolSettings[currentTool].hasOwnProperty('size')) {
                state.toolSettings[currentTool].size = elements.sizeSelect.value;
            }
            if (state.toolSettings[currentTool].hasOwnProperty('color')) {
                state.toolSettings[currentTool].color = elements.colorSelect.value;
            }
        }
    };

    elements.sizeSelect.addEventListener('change', updateCurrentToolSettings);
    elements.colorSelect.addEventListener('change', updateCurrentToolSettings);
};