// js/ui/index.js
import { elements } from '../config.js';
import { urlParams } from '../urlParams.js';
import { setupToolButtons } from './tools.js';
import { setupBrushControls } from './brush.js';
import { setupCanvasEventListeners } from './canvasEvents.js';
import { setupActionButtons } from './actions.js';
import { setupRecordingUI } from './recording.js';
import { setupObjectControls } from './objects.js';
import { setupPageControls, updatePageInfo } from './pages.js';
import { setupCanvasSizeModal } from './modals.js';
import { setupKeyboardShortcuts } from './keyboard.js';

// Re-export utility functions that might be used elsewhere
export const generateShareableUrl = (options = {}) => {
    return urlParams.generateUrl(options);
};

export const showCurrentUrl = () => {
    const currentUrl = window.location.href;
    console.log('🔗 Current URL:', currentUrl);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl).then(() => {
            console.log('📋 URL copied to clipboard');
        }).catch(err => {
            console.log('Failed to copy URL:', err);
        });
    }
    
    return currentUrl;
};

// The main initialization function for the entire UI
export const initUI = () => {
    setupToolButtons();
    setupBrushControls();
    setupCanvasEventListeners(); 
    setupActionButtons();
    setupRecordingUI();
    setupObjectControls();
    setupPageControls();
    setupCanvasSizeModal();
    setupKeyboardShortcuts();
    
    // Initial UI state updates
    updatePageInfo();
    elements.pencilBtn.click(); // Set pencil as the default active tool
};