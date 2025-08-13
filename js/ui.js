// js/ui.js
import { elements } from './config.js';
import * as canvas from './canvas/index.js';
import * as file from './fileHandler.js';
import * as recorder from './recorder.js';
import { urlParams } from './urlParams.js';

const updatePageInfo = () => {
    const { currentPage, pages } = canvas.getState();
    const totalPages = Math.max(pages.length, 1);
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage >= 200;
};

// MODIFIED: Complete rewrite of tool button logic to handle individual settings
const setupToolButtons = () => {
    const tools = [
        { btn: elements.selectToolBtn, name: 'select', cursorClass: 'cursor-default' },
        { btn: elements.pencilBtn, name: 'pencil', cursorClass: 'cursor-dot' },
        { btn: elements.highlighterBtn, name: 'highlighter', cursorClass: 'cursor-highlighter' },
        { btn: elements.eraserBtn, name: 'eraser', cursorClass: 'cursor-eraser' },
    ];
    const cursorClasses = tools.map(t => t.cursorClass);

    const switchTool = (newToolName) => {
        const state = canvas.getState();
        const oldToolName = state.tool;

        // 1. Save settings for the tool we are switching FROM
        if (oldToolName === 'pencil' || oldToolName === 'highlighter') {
            state.toolSettings[oldToolName].size = elements.sizeSelect.value;
            state.toolSettings[oldToolName].color = elements.colorSelect.value;
        } else if (oldToolName === 'eraser') {
            state.toolSettings[oldToolName].size = elements.sizeSelect.value;
        }

        // 2. Set the new tool
        canvas.setTool(newToolName);

        // 3. Load settings for the new tool and update the UI
        const newSettings = state.toolSettings[newToolName];
        if (newSettings) {
            if (newSettings.size) {
                elements.sizeSelect.value = newSettings.size;
            }
            if (newSettings.color) {
                elements.colorSelect.value = newSettings.color;
                elements.colorSelect.disabled = false;
            } else {
                // Disable color picker for tools that don't use it (like eraser)
                elements.colorSelect.disabled = true;
            }
        }
        
        // 4. Update UI styles (cursor and active button)
        const activeTool = tools.find(t => t.name === newToolName);
        if (activeTool) {
            elements.canvas.style.cursor = '';
            elements.canvas.classList.remove(...cursorClasses);
            elements.canvas.classList.add(activeTool.cursorClass);
            tools.forEach(t => t.btn.classList.remove('active'));
            activeTool.btn.classList.add('active');
        }
    };

    tools.forEach(tool => {
        tool.btn.addEventListener('click', () => switchTool(tool.name));
    });
};


// MODIFIED: Updated to remember the previous tool before activating the eraser
const setupCanvasEventListeners = () => {
    const { canvas: canvasEl } = elements;

    const endDrawingAction = (e) => {
        if (!canvas.getState().isDrawing) return;
        canvas.onPointerUp(e);
        if (recorder.isRecording() && !recorder.getIsPaused()) {
            recorder.startPinger();
        }

        // If the eraser was triggered by stylus button, switch back to the PREVIOUS tool
        if (canvas.getEraserButtonPressed() || canvas.getRightMouseDown()) {
            canvas.setEraserButtonPressed(false);
            canvas.setRightMouseDown(false);
            
            const toolToReturnTo = canvas.getPreEraserTool();
            // Find the button for the tool and click it to restore its state
            const toolButton = document.getElementById(toolToReturnTo);
            if(toolButton && toolToReturnTo !== 'eraser') {
                toolButton.click();
            } else {
                elements.pencilBtn.click(); // Fallback to pencil
            }
        }
    };

    canvasEl.addEventListener('pointerdown', (e) => {
        if (recorder.isRecording()) {
            recorder.stopPinger();
        }
        
        const isEraserTrigger = e.button === 5 || e.button === 2; // button 5 is stylus eraser
        
        if (isEraserTrigger && canvas.getState().tool !== 'eraser') {
            e.preventDefault();
            // Remember the current tool before switching to eraser
            canvas.setPreEraserTool(canvas.getState().tool);
            if (e.button === 5) canvas.setEraserButtonPressed(true);
            if (e.button === 2) canvas.setRightMouseDown(true);
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

const downloadVideoWithMetadata = (blob, filename) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    const url = URL.createObjectURL(blob);
    video.src = url;
    
    const downloadVideo = () => {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };
    
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
    
    setTimeout(() => {
        if (video.readyState === 0) {
            console.warn('⚠️ Metadata loading timeout, downloading video anyway');
            downloadVideo();
        }
    }, 5000);
    
    video.load();
};

const handleRecordingSave = (blob) => {
    const { recordingNameModal, recordingNameInput, confirmRecordingSaveBtn, cancelRecordingSaveBtn } = elements;
    
    const predefinedName = sessionStorage.getItem('predefinedRecordingName');
    let defaultName;
    
    if (predefinedName) {
        defaultName = predefinedName;
        console.log('📝 Using predefined recording name from URL:', predefinedName);
        sessionStorage.removeItem('predefinedRecordingName');
    } else {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
        defaultName = `recording-${timestamp}`;
    }
    
    const mimeType = blob.type;
    let extension = '.webm'; 
    if (mimeType.includes('mp4')) {
        extension = '.mp4';
    } else if (mimeType.includes('webm')) {
        extension = '.webm';
    }
    
    const filename = defaultName.includes('.') ? defaultName : `${defaultName}${extension}`;
    recordingNameInput.value = filename;
    
    recordingNameModal.style.display = 'flex';
    recordingNameInput.focus();
    recordingNameInput.select();
    
    const cleanup = () => {
        recordingNameModal.style.display = 'none';
        updateRecordingUI();
    };
    
    const onConfirm = () => {
        const finalFilename = recordingNameInput.value || recordingNameInput.placeholder;
        console.log(`📹 Saving recording: ${finalFilename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
        
        downloadVideoWithMetadata(blob, finalFilename);
        cleanup();
    };
    
    const onCancel = () => {
        console.log('❌ Recording discarded by user');
        cleanup();
    };
    
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

export const generateShareableUrl = (options = {}) => {
    return urlParams.generateUrl(options);
};

export const showCurrentUrl = () => {
    const currentUrl = window.location.href;
    console.log('🔗 Current URL:', currentUrl);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl).then(() => {
            console.log('📋 URL copied to clipboard');
        }).catch(err => {
            console.log('Failed to copy URL:', err);
        });
    }
    
    return currentUrl;
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
    // This will now correctly load the default pencil settings into the UI
    elements.pencilBtn.click();
};