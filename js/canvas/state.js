// js/canvas/state.js
export const state = {
  isDrawing: false,
  isRightMouseDown: false,
  isEraserButtonPressed: false, 
  tool: 'pencil', // 'pencil', 'highlighter', 'eraser', 'select'
  preEraserTool: 'pencil', // NEW: Remembers the tool before eraser was activated
  currentPage: 1,
  pages: [[]], 
  backgroundImage: null,
  
  // NEW: Object to store individual settings for each tool
  toolSettings: {
    pencil: {
      size: '2.5',      // Default 'F' size
      color: '#000000', // Default black
    },
    highlighter: {
      size: '12',       // Default 'XT' size
      color: '#facc15', // Default yellow
    },
    eraser: {
      size: '12',       // Default 'XT' size
    },
    select: {} // No settings needed for select
  },

  // State for select tool
  selectedObject: null,
  actionState: null, // null, 'moving', 'resizing'
  resizeHandle: null, 
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