// js/canvas/renderer.js
import { elements } from '../config.js';
import { getState } from './state.js';
import { getResizeHandles } from './interactions.js';

const { canvas } = elements;
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const drawStroke = (stroke) => {
  if (!stroke || stroke.points.length < 2) return;

  const isHighlighter = stroke.tool === 'highlighter';

  // --- Set rendering properties based on the tool ---
  ctx.globalCompositeOperation = isHighlighter ? 'multiply' : 'source-over';
  ctx.lineWidth = isHighlighter ? stroke.width * 3 : stroke.width;
  ctx.lineCap = isHighlighter ? 'butt' : 'round'; // Flat tip for highlighter
  ctx.lineJoin = 'round';

  let strokeColor = stroke.color;
  if (isHighlighter) {
    // Convert hex color to rgba for transparency
    const r = parseInt(stroke.color.slice(1, 3), 16);
    const g = parseInt(stroke.color.slice(3, 5), 16);
    const b = parseInt(stroke.color.slice(5, 7), 16);
    strokeColor = `rgba(${r}, ${g}, ${b}, 0.4)`; // 40% opacity for a nice effect
  }
  ctx.strokeStyle = strokeColor;
  
  // --- Drawing logic ---
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length - 1; i++) {
    const midPoint = {
      x: (stroke.points[i].x + stroke.points[i + 1].x) / 2,
      y: (stroke.points[i].y + stroke.points[i + 1].y) / 2,
    };
    ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, midPoint.x, midPoint.y);
  }
  ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
  ctx.stroke();
};

const drawImage = (imageObj) => {
    if (imageObj.img && imageObj.img.complete) {
        ctx.drawImage(imageObj.img, imageObj.x, imageObj.y, imageObj.width, imageObj.height);
    }
};

const drawSelectionBox = (obj) => {
    if (obj.type !== 'image') return;
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.9)';
    ctx.lineWidth = 1.5 / (window.devicePixelRatio || 1);
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    ctx.setLineDash([]);
    const handleSize = 8;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.9)';
    ctx.lineWidth = 1;
    const handles = getResizeHandles(obj);
    for (const pos in handles) {
        const handle = handles[pos];
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    }
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const renderPage = () => {
  const state = getState();
  // Store current state to restore it later
  const originalCompositeOp = ctx.globalCompositeOperation;
  
  clearCanvas();
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.backgroundImage) {
    ctx.drawImage(state.backgroundImage, 0, 0, canvas.width, canvas.height);
  }
  
  const pageIndex = state.currentPage - 1;
  if (state.pages[pageIndex]) {
    state.pages[pageIndex].forEach(obj => {
        if (obj.type === 'stroke' && !obj.isErased) {
            drawStroke(obj);
        } else if (obj.type === 'image') {
            drawImage(obj);
        }
    });
  }

  if (state.selectedObject) {
      drawSelectionBox(state.selectedObject);
  }

  if (state.isDrawing && state.currentStroke) {
      drawStroke(state.currentStroke);
  }

  // Restore the composite operation to default to avoid side-effects on other UI elements
  ctx.globalCompositeOperation = originalCompositeOp;
};

export const renderPageForExport = (pageIndex) => {
  const state = getState();
  const originalCompositeOp = ctx.globalCompositeOperation;

  clearCanvas();
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (state.backgroundImage) {
    ctx.drawImage(state.backgroundImage, 0, 0, canvas.width, canvas.height);
  }
  if (state.pages[pageIndex]) {
    state.pages[pageIndex].forEach(obj => {
      if (obj.type === 'stroke' && !obj.isErased) drawStroke(obj);
      else if (obj.type === 'image') drawImage(obj);
    });
  }

  ctx.globalCompositeOperation = originalCompositeOp;
};