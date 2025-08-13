// js/canvas/renderer.js
import { elements } from '../config.js';
import { getState } from './state.js';
import { getResizeHandles } from './interactions.js';

const { canvas } = elements;
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const drawStroke = (stroke) => {
  if (!stroke || stroke.points.length < 2) return;

  const isHighlighter = stroke.tool === 'highlighter';

  ctx.globalCompositeOperation = isHighlighter ? 'multiply' : 'source-over';
  ctx.lineWidth = isHighlighter ? stroke.width * 3 : stroke.width;
  ctx.lineCap = isHighlighter ? 'butt' : 'round';
  ctx.lineJoin = 'round';

  let strokeColor = stroke.color;
  if (isHighlighter) {
    const r = parseInt(stroke.color.slice(1, 3), 16);
    const g = parseInt(stroke.color.slice(3, 5), 16);
    const b = parseInt(stroke.color.slice(5, 7), 16);
    strokeColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
  }
  ctx.strokeStyle = strokeColor;
  
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
    // MODIFIED: Use the 9-argument drawImage to render the cropped portion
    if (imageObj.img && imageObj.img.complete) {
        ctx.drawImage(
            imageObj.img,
            imageObj.crop.x,
            imageObj.crop.y,
            imageObj.crop.width,
            imageObj.crop.height,
            imageObj.x,
            imageObj.y,
            imageObj.width,
            imageObj.height
        );
    }
};

const drawSelectionBox = (obj) => {
    if (obj.type !== 'image') return;
    const state = getState();

    // Draw semi-transparent overlay on cropped areas when in crop mode
    if (state.cropModeActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        // Outer rectangle (the whole canvas)
        ctx.rect(0, 0, canvas.width, canvas.height);
        // Inner rectangle (the visible part of the image), counter-clockwise to create a "hole"
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x, obj.y + obj.height);
        ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
        ctx.lineTo(obj.x + obj.width, obj.y);
        ctx.closePath();
        ctx.fill();
    }

    // Draw selection border
    ctx.strokeStyle = state.cropModeActive ? '#f59e0b' : 'rgba(37, 99, 235, 0.9)'; // Orange for crop, blue for resize
    ctx.lineWidth = 1.5 / (window.devicePixelRatio || 1);
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    ctx.setLineDash([]);
    
    // Draw resize/crop handles
    const handleSize = 8;
    ctx.fillStyle = 'white';
    ctx.lineWidth = 1;
    const handles = getResizeHandles(obj);
    for (const pos in handles) {
        const handle = handles[pos];
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    }

    // NEW: Draw the crop icon toggle
    const iconSize = 24;
    const iconPadding = 5;
    const iconX = obj.x + obj.width + iconPadding;
    const iconY = obj.y - iconSize - iconPadding;
    ctx.fillStyle = state.cropModeActive ? '#f59e0b' : '#fff';
    ctx.strokeStyle = state.cropModeActive ? '#fff' : '#4b5563';
    ctx.lineWidth = 1.5;
    ctx.fillRect(iconX, iconY, iconSize, iconSize);
    ctx.strokeRect(iconX, iconY, iconSize, iconSize);

    // Draw the crop symbol from Font Awesome (unicode)
    ctx.font = "14px 'Font Awesome 6 Free'";
    ctx.fillStyle = state.cropModeActive ? '#fff' : '#4b5563';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uf125', iconX + iconSize / 2, iconY + iconSize / 2); // \uf125 is the 'crop' icon unicode
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const renderPage = () => {
  const state = getState();
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