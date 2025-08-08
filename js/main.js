// js/main.js
import { initCanvas, setBackgroundImage, setCanvasSize } from './canvas/index.js';
import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  initCanvas();
  initUI();

  const savedWidth = localStorage.getItem('canvasWidth');
  const savedHeight = localStorage.getItem('canvasHeight');

  if (savedWidth && savedHeight) {
    console.log(`Loading saved canvas size: ${savedWidth}x${savedHeight}`);
    setCanvasSize(parseInt(savedWidth, 10), parseInt(savedHeight, 10));
  } else {
    console.log('No saved size, using default 1280x720.');
    setCanvasSize(1280, 720);
  }

  const savedBackground = localStorage.getItem('canvasBackground');
  if (savedBackground) {
    console.log('Found saved background, loading...');
    await setBackgroundImage(savedBackground);
  } else {
    console.log('No saved background, loading default...');
    await setBackgroundImage('images/background.png');
  }
});