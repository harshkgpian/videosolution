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
  // Set default on load
  setCanvasSize(1280, 720);
};

export const getCanvasContext = () => ({ canvas: elements.canvas, ctx: elements.canvas.getContext('2d') });

export const setTool = (toolName) => { 
    state.tool = toolName;
    // MODIFICATION: Deselect object when switching to a non-select tool for clarity.
    if (toolName !== 'select') {
        state.selectedObject = null;
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
        };

        if (!state.pages[pageIndex]) state.pages[pageIndex] = [];
        state.pages[pageIndex].push(newImage);
        
        // MODIFICATION: Revert to the intuitive behavior. After adding an image,
        // we select it and activate the select tool so the user can manipulate it.
        state.selectedObject = newImage;
        setTool('select');
        elements.selectToolBtn.click(); // This is crucial to update the UI correctly.
        
        renderPage();
    };
};

export const deleteSelectedObject = () => {
    if (state.tool === 'select' && state.selectedObject) {
        const pageIndex = state.currentPage - 1;
        state.pages[pageIndex] = state.pages[pageIndex].filter(obj => obj.id !== state.selectedObject.id);
        state.selectedObject = null;
        renderPage();
    }
};

// --- MODIFIED: This function is rewritten to be more robust ---
export const changePage = (direction) => {
  // 1. Deselect any object before changing pages.
  state.selectedObject = null;

  // 2. Update the page number based on the direction.
  if (direction === 'prev' && state.currentPage > 1) {
    state.currentPage--;
  } else if (direction === 'next') {
    state.currentPage++;
    // Ensure the data array exists for the new page.
    const newPageIndex = state.currentPage - 1;
    if (newPageIndex >= state.pages.length) {
      state.pages.push([]);
    }
  }

  // 3. CRUCIAL FIX: Immediately re-render the canvas.
  // This clears the old content and draws the new page's content (or an empty page).
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