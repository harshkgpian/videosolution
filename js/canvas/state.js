// js/canvas/state.js
export const state = {
  isDrawing: false,
  isRightMouseDown: false,
  isEraserButtonPressed: false,
  tool: 'pencil', // 'pencil', 'highlighter', 'eraser', 'select'
  preEraserTool: 'pencil', 
  currentPage: 1,
  pages: [[]], 
  backgroundImage: null,
  
  toolSettings: {
    pencil: { size: '2.5', color: '#000000' },
    highlighter: { size: '7', color: '#facc15' },
    eraser: { size: '12' },
    select: {}
  },

  // State for select tool
  selectedObject: null,
  actionState: null, // null, 'moving', 'resizing'
  resizeHandle: null, 
  startDragOffset: { x: 0, y: 0 },
  cropModeActive: false, // NEW: Tracks if we are in crop mode

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
  state.cropModeActive = false; // NEW: Reset crop mode as well
}