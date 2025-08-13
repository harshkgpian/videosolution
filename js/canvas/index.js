// js/canvas/index.js
import { elements } from '../config.js';
import { state, resetState, getState } from './state.js';
import { renderPage, renderPageForExport } from './renderer.js';
import * as events from './events.js';

// --- PUBLIC API ---
export { onPointerDown, onPointerMove, onPointerUp } from './events.js';
export { renderPage, renderPageForExport };
export { getState };

export const initCanvas = () => {
  resetState();
  setCanvasSize(1280, 720);
};

export const getCanvasContext = () => ({ canvas: elements.canvas, ctx: elements.canvas.getContext('2d') });

export const setTool = (toolName) => { 
    state.tool = toolName;
    if (toolName !== 'select') {
        state.selectedObject = null;
        state.cropModeActive = false; // NEW: Deactivate crop mode when switching tools
        renderPage();
    }
};

export const addImage = (imageDataUrl) => {
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
        const pageIndex = state.currentPage - 1;
        const canvasWidth = elements.canvas.width;
        const canvasHeight = elements.canvas.height;
        const padding = 50;
        const maxWidth = canvasWidth - padding * 2;
        const maxHeight = canvasHeight - padding * 2;

        let newWidth = img.width;
        let newHeight = img.height;
        
        if (newWidth > maxWidth || newHeight > maxHeight) {
            const ratio = Math.min(maxWidth / newWidth, maxHeight / newHeight);
            newWidth *= ratio;
            newHeight *= ratio;
        }

        const newImage = {
            type: 'image', id: Date.now(), src: imageDataUrl,
            x: (canvasWidth - newWidth) / 2, 
            y: (canvasHeight - newHeight) / 2, 
            width: newWidth, 
            height: newHeight,
            img,
            // NEW: Add crop information. Initially, it's the full image.
            crop: {
              x: 0,
              y: 0,
              width: img.naturalWidth,
              height: img.naturalHeight,
            }
        };

        if (!state.pages[pageIndex]) state.pages[pageIndex] = [];
        state.pages[pageIndex].push(newImage);
        state.selectedObject = newImage;
        setTool('select');
        elements.selectToolBtn.click();
        renderPage();
    };
};

export const deleteSelectedObject = () => {
    if (state.tool === 'select' && state.selectedObject) {
        const pageIndex = state.currentPage - 1;
        state.pages[pageIndex] = state.pages[pageIndex].filter(obj => obj.id !== state.selectedObject.id);
        state.selectedObject = null;
        state.cropModeActive = false; // NEW: Deactivate crop mode on delete
        renderPage();
    }
};

export const changePage = (direction) => {
  state.selectedObject = null;
  state.cropModeActive = false; // NEW: Deactivate crop mode on page change
  if (direction === 'prev' && state.currentPage > 1) {
    state.currentPage--;
  } else if (direction === 'next') {
    state.currentPage++;
    const newPageIndex = state.currentPage - 1;
    if (newPageIndex >= state.pages.length) {
      state.pages.push([]);
    }
  }
  renderPage();
};

export const setBackgroundImage = async (imageDataUrl) => {
  if (!imageDataUrl) { state.backgroundImage = null; renderPage(); return; }
  try {
      const img = new Image();
      img.src = imageDataUrl;
      await img.decode(); 
      state.backgroundImage = img;
      renderPage();
  } catch (error) { console.error(error); state.backgroundImage = null; }
};

export const removeBackgroundImage = () => { state.backgroundImage = null; renderPage(); };

export const setCanvasSize = (width, height) => {
  elements.canvas.width = width;
  elements.canvas.height = height;
  elements.canvas.style.aspectRatio = `${width} / ${height}`;
  localStorage.setItem('canvasWidth', width);
  localStorage.setItem('canvasHeight', height);
  resetState();
  renderPage();
};

export const adjustCanvasToBrowserSize = () => {
  const mainContent = document.querySelector('.main-content');
  const rect = mainContent.getBoundingClientRect();
  setCanvasSize(rect.width, rect.height);
};

export const setRightMouseDown = (isDown) => { state.isRightMouseDown = isDown; };
export const getRightMouseDown = () => state.isRightMouseDown;

export const setEraserButtonPressed = (isDown) => { state.isEraserButtonPressed = isDown; };
export const getEraserButtonPressed = () => state.isEraserButtonPressed;

export const setPreEraserTool = (tool) => { state.preEraserTool = tool; };
export const getPreEraserTool = () => state.preEraserTool;