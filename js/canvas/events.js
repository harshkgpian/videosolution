// js/canvas/events.js
import { elements } from '../config.js';
import { state } from './state.js';
import { renderPage } from './renderer.js';
import { getObjectAtPosition, getHandleAtPosition, isPointOnStroke } from './interactions.js';

const getTransformedCoordinates = (e) => {
    const rect = elements.canvas.getBoundingClientRect();
    const scaleX = elements.canvas.width / rect.width;
    const scaleY = elements.canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
    };
};

const getSmoothedCoordinates = (e) => {
    const rawPoint = getTransformedCoordinates(e);
    const smoothedX = state.lastPoint.x + (rawPoint.x - state.lastPoint.x) * (1 - state.DAMPING_FACTOR);
    const smoothedY = state.lastPoint.y + (rawPoint.y - state.lastPoint.y) * (1 - state.DAMPING_FACTOR);
    state.lastPoint = { x: smoothedX, y: smoothedY };
    return { x: smoothedX, y: smoothedY };
};

const eraseAtPoint = (point) => {
    const pageIndex = state.currentPage - 1;
    let hasChanged = false;
    const eraseSize = parseFloat(state.toolSettings.eraser.size) + 10;
    state.pages[pageIndex].forEach(obj => {
        if (obj.type === 'stroke' && !obj.isErased && isPointOnStroke(point, obj, eraseSize)) {
            obj.isErased = true;
            hasChanged = true;
        }
    });
    if (hasChanged) {
        renderPage();
    }
};

// NEW: Helper to check for click on the crop icon
const isClickOnCropIcon = (point, imageObj) => {
    if (!imageObj) return false;
    const iconSize = 24;
    const iconPadding = 5;
    const iconX = imageObj.x + imageObj.width + iconPadding;
    const iconY = imageObj.y - iconSize - iconPadding;
    return (
        point.x >= iconX &&
        point.x <= iconX + iconSize &&
        point.y >= iconY &&
        point.y <= iconY + iconSize
    );
};

export const onPointerDown = (e) => {
    state.isDrawing = true;
    state.lastPoint = getTransformedCoordinates(e);

    if (state.tool === 'select') {
        // NEW: Check for crop icon click first
        if (isClickOnCropIcon(state.lastPoint, state.selectedObject)) {
            state.cropModeActive = !state.cropModeActive;
            state.isDrawing = false; // Prevent dragging
            renderPage();
            return;
        }

        const handle = state.selectedObject ? getHandleAtPosition(state.lastPoint, state.selectedObject) : null;
        if (handle) {
            state.actionState = 'resizing';
            state.resizeHandle = handle;
        } else {
            const object = getObjectAtPosition(state.lastPoint);
            if (object !== state.selectedObject) {
                state.cropModeActive = false; // Deselecting, so turn off crop mode
            }
            state.selectedObject = object;
            if (object) {
                state.actionState = 'moving';
                state.startDragOffset = { x: state.lastPoint.x - object.x, y: state.lastPoint.y - object.y };
            } else {
                state.actionState = null;
            }
        }
    } else if (state.tool === 'pencil' || state.tool === 'highlighter') { 
        const toolSettings = state.toolSettings[state.tool];
        state.currentStroke = {
            type: 'stroke',
            id: Date.now() + Math.random(),
            points: [state.lastPoint],
            color: toolSettings.color,
            width: parseFloat(toolSettings.size),
            tool: state.tool, 
            isErased: false,
        };
    }
    renderPage();
};

export const onPointerMove = (e) => {
    const isDrawingTool = state.tool === 'pencil' || state.tool === 'highlighter';
    const currentPoint = isDrawingTool ? getSmoothedCoordinates(e) : getTransformedCoordinates(e);
    
    if (state.tool === 'select' && !state.isDrawing) {
        let cursor = '';
        if (isClickOnCropIcon(currentPoint, state.selectedObject)) {
            cursor = 'pointer';
        } else {
            const handle = state.selectedObject ? getHandleAtPosition(currentPoint, state.selectedObject) : null;
            if (handle) {
                if (['tl', 'br'].includes(handle)) cursor = 'nwse-resize';
                else if (['tr', 'bl'].includes(handle)) cursor = 'nesw-resize';
                else if (['tm', 'bm'].includes(handle)) cursor = 'ns-resize';
                else cursor = 'ew-resize';
            } else if (getObjectAtPosition(currentPoint)) {
                cursor = 'move';
            }
        }
        elements.canvas.style.cursor = cursor;
    }

    if (!state.isDrawing) return;

    if (state.tool === 'select' && state.selectedObject) {
        const obj = state.selectedObject;
        if (state.actionState === 'moving') {
            obj.x = currentPoint.x - state.startDragOffset.x;
            obj.y = currentPoint.y - state.startDragOffset.y;
        } else if (state.actionState === 'resizing') {
            // MODIFIED: Handle both resizing and cropping
            const { x, y, width, height, crop, img } = obj;
            const originalRight = x + width;
            const originalBottom = y + height;
            
            // Ratios of the original image to the displayed size.
            const ratioX = crop.width / width;
            const ratioY = crop.height / height;

            // Handle Left
            if (state.resizeHandle.includes('l')) {
                const newX = currentPoint.x;
                const deltaX = x - newX;
                if (state.cropModeActive) {
                    crop.x += deltaX * ratioX;
                    crop.width -= deltaX * ratioX;
                }
                obj.x = newX;
                obj.width += deltaX;
            }
            // Handle Right
            if (state.resizeHandle.includes('r')) {
                const newWidth = currentPoint.x - x;
                const deltaWidth = newWidth - width;
                 if (state.cropModeActive) {
                    crop.width += deltaWidth * ratioX;
                }
                obj.width = newWidth;
            }
            // Handle Top
            if (state.resizeHandle.includes('t')) {
                const newY = currentPoint.y;
                const deltaY = y - newY;
                if (state.cropModeActive) {
                    crop.y += deltaY * ratioY;
                    crop.height -= deltaY * ratioY;
                }
                obj.y = newY;
                obj.height += deltaY;
            }
            // Handle Bottom
            if (state.resizeHandle.includes('b')) {
                const newHeight = currentPoint.y - y;
                const deltaHeight = newHeight - height;
                if (state.cropModeActive) {
                    crop.height += deltaHeight * ratioY;
                }
                obj.height = newHeight;
            }

            if (obj.width < 10) obj.width = 10;
            if (obj.height < 10) obj.height = 10;
        }
    } else if (isDrawingTool && state.currentStroke) {
        state.currentStroke.points.push(currentPoint);
    } else if (state.tool === 'eraser') {
        eraseAtPoint(currentPoint);
    }
    renderPage();
};

export const onPointerUp = () => {
    if (!state.isDrawing) return;
    const isDrawingTool = state.tool === 'pencil' || state.tool === 'highlighter';
    if (isDrawingTool && state.currentStroke && state.currentStroke.points.length > 1) {
        const pageIndex = state.currentPage - 1;
        state.pages[pageIndex].push(state.currentStroke);
    }
    
    state.isDrawing = false;
    state.actionState = null;
    state.resizeHandle = null;
    state.currentStroke = null;
    renderPage();
};