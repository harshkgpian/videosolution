// js/ui/canvasEvents.js
import { elements } from '../config.js';
import * as canvas from '../canvas/index.js';
import * as recorder from '../recorder.js';

export const setupCanvasEventListeners = () => {
    const { canvas: canvasEl } = elements;

    const endDrawingAction = () => {
        if (!canvas.getState().isDrawing) return;
        canvas.onPointerUp();
        if (recorder.isRecording() && !recorder.getIsPaused()) {
            recorder.startPinger();
        }

        if (canvas.getEraserButtonPressed() || canvas.getRightMouseDown()) {
            canvas.setEraserButtonPressed(false);
            canvas.setRightMouseDown(false);
            
            const toolToReturnTo = canvas.getPreEraserTool();
            const toolButton = document.getElementById(toolToReturnTo);
            if(toolButton && toolToReturnTo !== 'eraser') {
                toolButton.click();
            } else {
                elements.pencilBtn.click();
            }
        }
    };

    canvasEl.addEventListener('pointerdown', (e) => {
        if (recorder.isRecording()) {
            recorder.stopPinger();
        }
        
        const isEraserTrigger = e.button === 5 || e.button === 2;
        
        if (isEraserTrigger && canvas.getState().tool !== 'eraser') {
            e.preventDefault();
            canvas.setPreEraserTool(canvas.getState().tool);
            if (e.button === 5) canvas.setEraserButtonPressed(true);
            if (e.button === 2) canvas.setRightMouseDown(true);
            elements.eraserBtn.click();
        }
        
        canvas.onPointerDown(e);
    });

    canvasEl.addEventListener('pointermove', canvas.onPointerMove);
    window.addEventListener('pointerup', endDrawingAction);
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
};