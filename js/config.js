// js/config.js

export const elements = {
  // Canvas
  canvas: document.getElementById("drawingCanvas"),

  // Toolbar
  selectToolBtn: document.getElementById('selectTool'),
  pencilBtn: document.getElementById('pencil'),
  eraserBtn: document.getElementById('eraser'),
  sizeSelect: document.getElementById('size'),
  colorSelect: document.getElementById('color'),
  
  // Object Controls
  addImageBtn: document.getElementById('addImageBtn'),
  imageInput: document.getElementById('imageInput'),
  addBackgroundBtn: document.getElementById('addBackgroundBtn'),
  backgroundInput: document.getElementById('backgroundInput'),
  removeBackgroundBtn: document.getElementById('removeBackgroundBtn'),

  // Recording
  recordBtn: document.getElementById('recordBtn'),
  stopBtn: document.getElementById('stopBtn'),
  waveformCanvas: document.getElementById('waveformCanvas'),
  
  // File Operations
  savePdfBtn: document.getElementById('savePdf'),

  // Page Controls
  prevPageBtn: document.getElementById('prevPage'),
  nextPageBtn: document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
  
  // Canvas Size Modal
  customCanvasBtn: document.getElementById('customCanvasBtn'),
  canvasSizeModal: document.getElementById('canvasSizeModal'),
  cancelCanvasSizeBtn: document.getElementById('cancelCanvasSize'),
  confirmCanvasSizeBtn: document.getElementById('confirmCanvasSize'),
  canvasWidthInput: document.getElementById('canvasWidth'),
  canvasHeightInput: document.getElementById('canvasHeight'),
  setBrowserSizeBtn: document.getElementById('setBrowserSize'),

  // Filename Modal
  filenameModal: document.getElementById('filenameModal'),
  filenameInput: document.getElementById('filenameInput'),
  cancelSaveBtn: document.getElementById('cancelSave'),
  confirmSaveBtn: document.getElementById('confirmSave'),

  // NEW: Recording Save Modal
  recordingNameModal: document.getElementById('recordingNameModal'),
  recordingNameInput: document.getElementById('recordingNameInput'),
  confirmRecordingSaveBtn: document.getElementById('confirmRecordingSave'),
  cancelRecordingSaveBtn: document.getElementById('cancelRecordingSave'),
};