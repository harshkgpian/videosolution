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
        { btn: elements.eraserBtn, name: 'eraser', cursorClass: 'cursor-eraser' },
    ];
    const cursorClasses = tools.map(t => t.cursorClass);

    tools.forEach(tool => {
        tool.btn.addEventListener('click', () => {
            canvas.setTool(tool.name);

            // MODIFICATION: Explicitly clear any inline cursor style left over by the select tool.
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
    canvasEl.addEventListener('pointerdown', (e) => {
        if (recorder.isRecording()) recorder.stopPinger();
        if (e.button === 2) {
            canvas.setRightMouseDown(true);
            elements.eraserBtn.click();
        }
        canvas.onPointerDown(e);
    });
    canvasEl.addEventListener('pointermove', canvas.onPointerMove);
    const onPointerUpOrOut = (e) => {
        if (recorder.isRecording() && !recorder.getIsPaused()) recorder.startPinger();
        if (canvas.getRightMouseDown()) {
            canvas.setRightMouseDown(false);
            elements.pencilBtn.click();
        }
        canvas.onPointerUp(e);
    };
    canvasEl.addEventListener('pointerup', onPointerUpOrOut);
    canvasEl.addEventListener('pointerleave', () => { if (!canvas.getState().isDrawing) canvas.renderPage(); });
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
};

const setupActionButtons = () => {
    elements.savePdfBtn.addEventListener('click', () => file.saveDrawing(false));
};

// MODIFIED: This function now handles the three visual states for recording
const updateRecordingUI = () => {
    const { recordBtn, stopBtn } = elements;
    const recordText = recordBtn.querySelector('span');
    const recordIcon = recordBtn.querySelector('i');

    if (!recorder.isRecording()) {
        // State: STOPPED
        recordBtn.classList.remove('recording', 'paused'); // Remove all recording classes
        recordIcon.className = 'fa-solid fa-microphone';
        recordText.textContent = 'Record';
        recordBtn.title = 'Start Recording';
        stopBtn.style.display = 'none';
    } else {
        // State: RECORDING or PAUSED
        stopBtn.style.display = 'flex';
            if (recorder.getIsPaused()) {
            // State: PAUSED
            recordBtn.classList.remove('recording'); // Remove red pulse
            recordBtn.classList.add('paused');      // Add white style
            recordIcon.className = 'fa-solid fa-play';
            recordText.textContent = 'R';
            recordBtn.title = 'Resume Recording';
        } else {
            // State: ACTIVELY RECORDING
            recordBtn.classList.remove('paused');   // Remove white style
            recordBtn.classList.add('recording');   // Add red pulse
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
    elements.prevPageBtn.addEventListener('click', () => { canvas.changePage('prev'); updatePageInfo(); });
    elements.nextPageBtn.addEventListener('click', () => { canvas.changePage('next'); updatePageInfo(); });
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
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        const isCtrl = e.ctrlKey || e.metaKey;
        if (!isCtrl) {
            switch (e.key.toLowerCase()) {
                case 'p': e.preventDefault(); elements.pencilBtn.click(); break;
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