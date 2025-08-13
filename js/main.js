// js/main.js
import { initCanvas, setBackgroundImage, setCanvasSize } from './canvas/index.js';
import { initUI } from './ui/index.js';
import { urlParams } from './urlParams.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing drawing application...');
  
  // NEW: Wait for the icon font to be loaded before doing anything else.
  // This prevents the crop icon from being invisible on the first load.
  try {
    // We specify the style and weight to ensure the browser loads the correct "solid" icon set.
    await document.fonts.load('900 14px "Font Awesome 6 Free"');
    console.log('✅ Font Awesome loaded successfully.');
  } catch (error) {
    console.error('❌ Could not load Font Awesome font:', error);
  }
  // --- END OF NEW CODE ---

  // Initialize canvas and UI first
  initCanvas();
  initUI();

  try {
    // Process URL parameters first (this might set canvas size)
    await urlParams.processUrlParams();
    
    // Get predefined recording name from URL if available
    const predefinedRecordingName = urlParams.getRecordingName();
    if (predefinedRecordingName) {
      console.log('📝 Predefined recording name:', predefinedRecordingName);
    }

    // Set canvas size (URL params take priority over saved/default)
    const urlCanvasSize = urlParams.getCanvasSize();
    if (urlCanvasSize) {
      console.log(`📐 Setting canvas size from URL: ${urlCanvasSize.width}x${urlCanvasSize.height}`);
      setCanvasSize(urlCanvasSize.width, urlCanvasSize.height);
    } else {
      // Fallback to saved size or default
      const savedWidth = localStorage.getItem('canvasWidth');
      const savedHeight = localStorage.getItem('canvasHeight');

      if (savedWidth && savedHeight) {
        console.log(`📐 Loading saved canvas size: ${savedWidth}x${savedHeight}`);
        setCanvasSize(parseInt(savedWidth, 10), parseInt(savedHeight, 10));
      } else {
        console.log('📐 Using default canvas size: 1280x720');
        setCanvasSize(1280, 720);
      }
    }

    // Handle background image (URL params take priority)
    const urlBackground = urlParams.getParam('background') || urlParams.getParam('bg');
    if (urlBackground) {
      console.log('🖼️ Background loaded from URL parameters');
    } else {
      // Fallback to saved background or default
      const savedBackground = localStorage.getItem('canvasBackground');
      if (savedBackground) {
        console.log('🖼️ Loading saved background...');
        await setBackgroundImage(savedBackground);
      } else {
        console.log('🖼️ Loading default background...');
        await setBackgroundImage('images/background.png');
      }
    }

    console.log('✅ Application initialized successfully');

    const params = urlParams.getParams();
    if (Object.keys(params).length > 0) {
      console.log('🔗 Active URL parameters:', params);
    } else {
      console.log('ℹ️ No URL parameters detected. You can use parameters like:');
      console.log('   ?image=IMAGE_URL&recordingName=MyVideo&width=1920&height=1080');
    }

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    
    console.log('🔄 Falling back to default initialization...');
    setCanvasSize(1280, 720);
    await setBackgroundImage('images/background.png');
  }
});