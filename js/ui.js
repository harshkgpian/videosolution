// js/ui.js
import { elements } from './config.js';
import * as canvas from './canvas/index.js';
import * as file from './fileHandler.js';
import * as recorder from './recorder.js';

const updatePageInfo = () => {
    const { currentPage, pages } = canvas.getState();
    const totalPages = Math.max(pages.length, 1);
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage >= 200;
};

const setupToolButtons = () => {
    const tools = [
        { btn: elements.selectToolBtn, name: 'select', cursorClass: 'cursor-default' },
        { btn: elements.pencilBtn, name: 'pencil', cursorClass: 'cursor-dot' },
        { btn: elements.highlighterBtn, name: 'highlighter', cursorClass: 'cursor-highlighter' },
        { btn: elements.eraserBtn, name: 'eraser', cursorClass: 'cursor-eraser' },
    ];
    const cursorClasses = tools.map(t => t.cursorClass);

    tools.forEach(tool => {
        tool.btn.addEventListener('click', () => {
            canvas.setTool(tool.name);
            elements.canvas.style.cursor = '';
            elements.canvas.classList.remove(...cursorClasses);
            elements.canvas.classList.add(tool.cursorClass);
            tools.forEach(t => t.btn.classList.remove('active'));
            tool.btn.classList.add('active');
        });
    });
};

const setupCanvasEventListeners = () => {
    const { canvas: canvasEl } = elements;

    const endDrawingAction = (e) => {
        if (!canvas.getState().isDrawing) return;
        canvas.onPointerUp(e);
        if (recorder.isRecording() && !recorder.getIsPaused()) {
            recorder.startPinger();
        }
        if (canvas.getEraserButtonPressed()) {
            canvas.setEraserButtonPressed(false);
            elements.pencilBtn.click();
        } else if (canvas.getRightMouseDown()) {
            canvas.setRightMouseDown(false);
            elements.pencilBtn.click();
        }
    };

    canvasEl.addEventListener('pointerdown', (e) => {
        if (recorder.isRecording()) {
            recorder.stopPinger();
        }
        if (e.button === 5) {
            e.preventDefault();
            canvas.setEraserButtonPressed(true);
            elements.eraserBtn.click();
        } else if (e.button === 2) {
            canvas.setRightMouseDown(true);
            elements.eraserBtn.click();
        }
        canvas.onPointerDown(e);
    });

    canvasEl.addEventListener('pointermove', canvas.onPointerMove);
    window.addEventListener('pointerup', endDrawingAction);
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
};

const setupActionButtons = () => {
    elements.savePdfBtn.addEventListener('click', () => file.saveDrawing(false));
};

const updateRecordingUI = () => {
    const { recordBtn, stopBtn } = elements;
    const recordText = recordBtn.querySelector('span');
    const recordIcon = recordBtn.querySelector('i');

    if (!recorder.isRecording()) {
        recordBtn.classList.remove('recording', 'paused');
        recordIcon.className = 'fa-solid fa-microphone';
        recordText.textContent = 'Record';
        recordBtn.title = 'Start Recording';
        stopBtn.style.display = 'none';
    } else {
        stopBtn.style.display = 'flex';
        if (recorder.getIsPaused()) {
            recordBtn.classList.remove('recording');
            recordBtn.classList.add('paused');
            recordIcon.className = 'fa-solid fa-play';
            recordText.textContent = 'R';
            recordBtn.title = 'Resume Recording';
        } else {
            recordBtn.classList.remove('paused');
            recordBtn.classList.add('recording');
            recordIcon.className = 'fa-solid fa-pause';
            recordText.textContent = 'P';
            recordBtn.title = 'Pause Recording';
        }
    }
};

// Enhanced function to create downloadable video with proper metadata
const downloadVideoWithMetadata = (blob, filename) => {
    // Create a video element to test the blob
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    const url = URL.createObjectURL(blob);
    video.src = url;
    
    const downloadVideo = () => {
        // Create download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup after a short delay
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };
    
    // Try to load metadata first
    video.addEventListener('loadedmetadata', () => {
        console.log(`✅ Video metadata loaded successfully:`);
        console.log(`   Duration: ${video.duration} seconds`);
        console.log(`   Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
        console.log(`   File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        downloadVideo();
    }, { once: true });
    
    video.addEventListener('error', (e) => {
        console.warn('⚠️ Video metadata loading failed, but downloading anyway:', e);
        downloadVideo();
    }, { once: true });
    
    // Fallback: if metadata doesn't load within 5 seconds, download anyway
    setTimeout(() => {
        if (video.readyState === 0) {
            console.warn('⚠️ Metadata loading timeout, downloading video anyway');
            downloadVideo();
        }
    }, 5000);
    
    // Try to load the video
    video.load();
};

const handleRecordingSave = (blob) => {
    const { recordingNameModal, recordingNameInput, confirmRecordingSaveBtn, cancelRecordingSaveBtn } = elements;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    
    // Determine file extension based on blob type
    const mimeType = blob.type;
    let extension = '.webm'; // default
    if (mimeType.includes('mp4')) {
        extension = '.mp4';
    } else if (mimeType.includes('webm')) {
        extension = '.webm';
    }
    
    recordingNameInput.value = `recording-${timestamp}${extension}`;
    recordingNameModal.style.display = 'flex';
    recordingNameInput.focus();
    recordingNameInput.select();
    
    const cleanup = () => {
        recordingNameModal.style.display = 'none';
        updateRecordingUI();
    };
    
    const onConfirm = () => {
        const filename = recordingNameInput.value || recordingNameInput.placeholder;
        console.log(`📹 Saving recording: ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // Use enhanced download function
        downloadVideoWithMetadata(blob, filename);
        cleanup();
    };
    
    const onCancel = () => {
        console.log('❌ Recording discarded by user');
        cleanup();
    };
    
    // Remove old event listeners and add new ones
    confirmRecordingSaveBtn.onclick = onConfirm;
    cancelRecordingSaveBtn.onclick = onCancel;
};

const setupRecording = () => {
    elements.recordBtn.addEventListener('click', async () => {
        if (!recorder.isRecording()) {
            try { 
                console.log('🎬 Starting recording...');
                await recorder.startRecording(); 
                console.log('✅ Recording started successfully');
            } catch (error) { 
                console.error('❌ Recording start failed:', error);
                alert(`Recording failed: ${error.message}`); 
            }
        } else {
            if (recorder.getIsPaused()) {
                console.log('▶️ Resuming recording...');
                recorder.resumeRecording();
            } else {
                console.log('⏸️ Pausing recording...');
                recorder.pauseRecording();
            }
        }
        updateRecordingUI();
    });
    
    elements.stopBtn.addEventListener('click', async () => {
        console.log('⏹️ Stopping recording...');
        
        try {
            const blob = await recorder.stopRecording();
            
            if (blob && blob.size > 0) {
                console.log(`✅ Recording stopped successfully: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
                handleRecordingSave(blob);
            } else {
                console.warn('⚠️ No recording data available');
                alert('No recording data was captured. Please try again.');
                updateRecordingUI();
            }
        } catch (error) {
            console.error('❌ Error stopping recording:', error);
            alert(`Failed to stop recording: ${error.message}`);
            updateRecordingUI();
        }
    });
};

const setupImageControls = () => {
    elements.addImageBtn.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => canvas.addImage(event.target.result);
        reader.readAsDataURL(file);
        e.target.value = '';
    });
};

const setupBackgroundControls = () => {
    elements.addBackgroundBtn.addEventListener('click', () => elements.backgroundInput.click());
    elements.backgroundInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            localStorage.setItem('canvasBackground', event.target.result);
            canvas.setBackgroundImage(event.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
    elements.removeBackgroundBtn.addEventListener('click', () => {
        localStorage.removeItem('canvasBackground');
        canvas.removeBackgroundImage();
    });
};

const setupPageControls = () => {
    const handlePageChange = (direction) => {
        if (recorder.isRecording()) {
            recorder.stopPinger();
        }
        canvas.changePage(direction);
        updatePageInfo();
        if (recorder.isRecording() && !recorder.getIsPaused()) {
            recorder.startPinger();
        }
    };
    elements.prevPageBtn.addEventListener('click', () => handlePageChange('prev'));
    elements.nextPageBtn.addEventListener('click', () => handlePageChange('next'));
};

const setupCanvasSizeModal = () => {
    elements.customCanvasBtn.addEventListener('click', () => {
        const { width, height } = canvas.getCanvasContext().canvas;
        elements.canvasWidthInput.value = width;
        elements.canvasHeightInput.value = height;
        elements.canvasSizeModal.style.display = 'flex';
    });
    elements.cancelCanvasSizeBtn.addEventListener('click', () => { elements.canvasSizeModal.style.display = 'none'; });
    elements.confirmCanvasSizeBtn.addEventListener('click', () => {
        const newWidth = parseInt(elements.canvasWidthInput.value, 10);
        const newHeight = parseInt(elements.canvasHeightInput.value, 10);
        if (newWidth && newHeight) {
            canvas.setCanvasSize(newWidth, newHeight);
        }
        elements.canvasSizeModal.style.display = 'none';
    });
    elements.setBrowserSizeBtn.addEventListener('click', () => {
      canvas.adjustCanvasToBrowserSize();
      elements.canvasSizeModal.style.display = 'none';
    });
};

const setupKeyboardShortcuts = () => {
    document.addEventListener('paste', async (e) => {
        e.preventDefault();
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            return;
        }
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        canvas.addImage(event.target.result);
                    };
                    reader.readAsDataURL(blob);
                    break; 
                }
            }
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        const isCtrl = e.ctrlKey || e.metaKey;
        if (!isCtrl) {
            switch (e.key.toLowerCase()) {
                case 'p': e.preventDefault(); elements.pencilBtn.click(); break;
                case 'h': e.preventDefault(); elements.highlighterBtn.click(); break;
                case 'e': e.preventDefault(); elements.eraserBtn.click(); break;
                case 'v': e.preventDefault(); elements.selectToolBtn.click(); break;
                case 'delete': case 'backspace': e.preventDefault(); canvas.deleteSelectedObject(); break;
            }
        }
        if (isCtrl && e.key.toLowerCase() === 's') {
            e.preventDefault();
            file.saveDrawing(e.shiftKey);
        }
    });
};

export const initUI = () => {
    setupToolButtons();
    setupCanvasEventListeners(); 
    setupActionButtons();
    setupRecording();
    setupImageControls();
    setupBackgroundControls();
    setupPageControls();
    setupCanvasSizeModal();
    setupKeyboardShortcuts();
    updatePageInfo();
    elements.pencilBtn.click();
};