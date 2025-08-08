// js/canvas/events.js
import { elements } from '../config.js';
import { state } from './state.js';
import { renderPage } from './renderer.js';
import { getObjectAtPosition, getHandleAtPosition, isPointOnStroke } from './interactions.js';

// REMOVED: No more need for undo callback

const getTransformedCoordinates = (e) => {
    const rect = elements.canvas.getBoundingClientRect();
    // NEW: Calculate coordinates based on the scaled canvas
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
    state.pages[pageIndex].forEach(obj => {
        if (obj.type === 'stroke' && !obj.isErased && isPointOnStroke(point, obj)) {
            obj.isErased = true;
            hasChanged = true;
        }
    });
    if (hasChanged) {
        renderPage();
    }
};

export const onPointerDown = (e) => {
    state.isDrawing = true;
    state.lastPoint = getTransformedCoordinates(e); // Use transformed coords

    if (state.tool === 'select') {
        const handle = state.selectedObject ? getHandleAtPosition(state.lastPoint, state.selectedObject) : null;
        if (handle) {
            state.actionState = 'resizing';
            state.resizeHandle = handle;
        } else {
            const object = getObjectAtPosition(state.lastPoint);
            state.selectedObject = object;
            if (object) {
                state.actionState = 'moving';
                state.startDragOffset = { x: state.lastPoint.x - object.x, y: state.lastPoint.y - object.y };
            } else {
                state.actionState = null;
            }
        }
    } else if (state.tool === 'pencil') {
        state.currentStroke = {
            type: 'stroke', id: Date.now() + Math.random(),
            points: [state.lastPoint], color: elements.colorSelect.value,
            width: parseInt(elements.sizeSelect.value, 10), isErased: false,
        };
    }
    renderPage();
};

export const onPointerMove = (e) => {
    const currentPoint = state.tool === 'pencil' ? getSmoothedCoordinates(e) : getTransformedCoordinates(e);
    
    if (state.tool === 'select' && !state.isDrawing) {
        const handle = state.selectedObject ? getHandleAtPosition(currentPoint, state.selectedObject) : null;
        if (handle) {
            if (['tl', 'br'].includes(handle)) elements.canvas.style.cursor = 'nwse-resize';
            else if (['tr', 'bl'].includes(handle)) elements.canvas.style.cursor = 'nesw-resize';
            else if (['tm', 'bm'].includes(handle)) elements.canvas.style.cursor = 'ns-resize';
            else elements.canvas.style.cursor = 'ew-resize';
        } else {
            elements.canvas.style.cursor = getObjectAtPosition(currentPoint) ? 'move' : 'default';
        }
    }

    if (!state.isDrawing) return;

    if (state.tool === 'select' && state.selectedObject) {
        const obj = state.selectedObject;
        if (state.actionState === 'moving') {
            obj.x = currentPoint.x - state.startDragOffset.x;
            obj.y = currentPoint.y - state.startDragOffset.y;
        } else if (state.actionState === 'resizing') {
            const { x, y, width, height } = obj;
            const originalRight = x + width, originalBottom = y + height;
            if (state.resizeHandle.includes('l')) { obj.width = originalRight - currentPoint.x; obj.x = currentPoint.x; }
            if (state.resizeHandle.includes('r')) { obj.width = currentPoint.x - x; }
            if (state.resizeHandle.includes('t')) { obj.height = originalBottom - currentPoint.y; obj.y = currentPoint.y; }
            if (state.resizeHandle.includes('b')) { obj.height = currentPoint.y - y; }
            if (obj.width < 10) obj.width = 10;
            if (obj.height < 10) obj.height = 10;
        }
    } else if (state.tool === 'pencil' && state.currentStroke) {
        state.currentStroke.points.push(currentPoint);
    } else if (state.tool === 'eraser') {
        eraseAtPoint(currentPoint);
    }
    renderPage();
};

export const onPointerUp = () => {
    if (!state.isDrawing) return;
    if (state.tool === 'pencil' && state.currentStroke && state.currentStroke.points.length > 1) {
        const pageIndex = state.currentPage - 1;
        state.pages[pageIndex].push(state.currentStroke);
    }
    
    state.isDrawing = false;
    state.actionState = null;
    state.resizeHandle = null;
    state.currentStroke = null;
    renderPage();
};