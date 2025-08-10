// js/canvas/state.js
export const state = {
  isDrawing: false,
  isRightMouseDown: false,
  isEraserButtonPressed: false, // NEW: Tracks if the stylus eraser button is down
  tool: 'pencil', // 'pencil', 'eraser', 'select'
  currentPage: 1,
  pages: [[]], // e.g., [[{type: 'stroke', ...}, {type: 'image', ...}]]
  backgroundImage: null,
  
  // State for select tool
  selectedObject: null,
  actionState: null, // null, 'moving', 'resizing'
  resizeHandle: null, // e.g., 'tl', 'br', 'tm', etc.
  startDragOffset: { x: 0, y: 0 },

  // Stroke-specific state
  currentStroke: null,
  lastPoint: { x: 0, y: 0 },
  DAMPING_FACTOR: 0.5,
};

export const getState = () => state;

export function resetState() {
  state.currentPage = 1;
  state.pages = [[]];
  state.selectedObject = null;
  state.currentStroke = null;
  state.isDrawing = false;
  state.isRightMouseDown = false;
  state.isEraserButtonPressed = false;
}