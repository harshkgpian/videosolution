// js/ui/keyboard.js
import { elements } from '../config.js';
import * as canvas from '../canvas/index.js';
import * as file from '../fileHandler.js';

export const setupKeyboardShortcuts = () => {
    // Paste from clipboard
    document.addEventListener('paste', async (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        e.preventDefault();
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const reader = new FileReader();
                    reader.onload = (event) => canvas.addImage(event.target.result);
                    reader.readAsDataURL(blob);
                    break; 
                }
            }
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        const isCtrl = e.ctrlKey || e.metaKey;

        if (!isCtrl) {
            switch (e.key.toLowerCase()) {
                case 'p': e.preventDefault(); elements.pencilBtn.click(); break;
                case 'h': e.preventDefault(); elements.highlighterBtn.click(); break;
                case 'e': e.preventDefault(); elements.eraserBtn.click(); break;
                case 'v': e.preventDefault(); elements.selectToolBtn.click(); break;
                case 'delete': case 'backspace': e.preventDefault(); canvas.deleteSelectedObject(); break;
            }
        } else if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            file.saveDrawing(e.shiftKey);
        }
    });
};