// js/ui/actions.js
import { elements } from '../config.js';
import * as file from '../fileHandler.js';

export const setupActionButtons = () => {
    elements.savePdfBtn.addEventListener('click', () => file.saveDrawing(false));
};