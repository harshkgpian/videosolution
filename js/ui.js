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

// --- MODIFIED: This function is fundamentally refactored for a robust fix ---
const setupCanvasEventListeners = () => {
    const { canvas: canvasEl } = elements;

    // This central function finalizes any drawing action and cleans up the state.
    const endDrawingAction = (e) => {
        // Only run this logic if we were actually in a drawing state.
        if (!canvas.getState().isDrawing) return;

        // Finalize the stroke or action. This is the most critical part.
        canvas.onPointerUp(e);

        // Restart the recorder's pinger if it needs to be running.
        if (recorder.isRecording() && !recorder.getIsPaused()) {
            recorder.startPinger();
        }

        // Handle reverting from the temporary eraser tool.
        if (canvas.getEraserButtonPressed()) {
            canvas.setEraserButtonPressed(false);
            elements.pencilBtn.click();
        } else if (canvas.getRightMouseDown()) {
            canvas.setRightMouseDown(false);
            elements.pencilBtn.click();
        }
    };

    // 1. Listener for starting an action on the canvas.
    canvasEl.addEventListener('pointerdown', (e) => {
        // If recording, we must stop the pinger to allow for a new drawing to be rendered.
        if (recorder.isRecording()) {
            recorder.stopPinger();
        }

        // Handle temporary eraser tool via pen buttons or right-click.
        if (e.button === 5) { // Dedicated eraser button on stylus
            e.preventDefault();
            canvas.setEraserButtonPressed(true);
            elements.eraserBtn.click();
        } else if (e.button === 2) { // Right-click / Barrel button
            canvas.setRightMouseDown(true);
            elements.eraserBtn.click();
        }
        
        // Let the canvas module handle the start of the drawing/selection.
        canvas.onPointerDown(e);
    });

    // 2. Listener for movement on the canvas.
    canvasEl.addEventListener('pointermove', canvas.onPointerMove);

    // 3. THE DEFINITIVE FIX: Global listener to catch "lost" pointer events.
    // This is the safety net that fixes the double-click bug. It catches any pointer release
    // that happens *anywhere*, ensuring the drawing state is never stuck.
    window.addEventListener('pointerup', endDrawingAction);

    // Prevent context menu from interfering.
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

const handleRecordingSave = (blob) => {
    const { recordingNameModal, recordingNameInput, confirmRecordingSaveBtn, cancelRecordingSaveBtn } = elements;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    recordingNameInput.value = `recording-${timestamp}.webm`;
    recordingNameModal.style.display = 'flex';
    recordingNameInput.focus();
    recordingNameInput.select();
    const cleanup = () => {
        recordingNameModal.style.display = 'none';
        updateRecordingUI();
    };
    const onConfirm = () => {
        const filename = recordingNameInput.value || recordingNameInput.placeholder;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        cleanup();
    };
    const onCancel = () => cleanup();
    confirmRecordingSaveBtn.onclick = onConfirm;
    cancelRecordingSaveBtn.onclick = onCancel;
};

const setupRecording = () => {
    elements.recordBtn.addEventListener('click', async () => {
        if (!recorder.isRecording()) {
            try { await recorder.startRecording(); } 
            catch (error) { alert(error.message); }
        } else {
            recorder.getIsPaused() ? recorder.resumeRecording() : recorder.pauseRecording();
        }
        updateRecordingUI();
    });
    elements.stopBtn.addEventListener('click', async () => {
        const blob = await recorder.stopRecording();
        if (blob && blob.size > 0) {
            handleRecordingSave(blob);
        } else {
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