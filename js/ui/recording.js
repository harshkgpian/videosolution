// js/ui/recording.js
import { elements } from '../config.js';
import * as recorder from '../recorder.js';

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
        downloadVideo();
    }, { once: true });
    
    video.addEventListener('error', (e) => {
        console.warn('⚠️ Video metadata loading failed, downloading anyway:', e);
        downloadVideo();
    }, { once: true });
    
    setTimeout(() => {
        if (video.readyState === 0) {
            console.warn('⚠️ Metadata loading timeout, downloading anyway');
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
        sessionStorage.removeItem('predefinedRecordingName');
    } else {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
        defaultName = `recording-${timestamp}`;
    }
    
    const mimeType = blob.type;
    const extension = mimeType.includes('mp4') ? '.mp4' : '.webm';
    
    const filename = defaultName.includes('.') ? defaultName : `${defaultName}${extension}`;
    recordingNameInput.value = filename;
    
    recordingNameModal.style.display = 'flex';
    recordingNameInput.focus();
    recordingNameInput.select();
    
    const cleanup = () => {
        recordingNameModal.style.display = 'none';
        updateRecordingUI();
    };
    
    confirmRecordingSaveBtn.onclick = () => {
        const finalFilename = recordingNameInput.value || recordingNameInput.placeholder;
        downloadVideoWithMetadata(blob, finalFilename);
        cleanup();
    };
    
    cancelRecordingSaveBtn.onclick = cleanup;
};

export const setupRecordingUI = () => {
    elements.recordBtn.addEventListener('click', async () => {
        if (!recorder.isRecording()) {
            try { 
                await recorder.startRecording(); 
            } catch (error) { 
                alert(`Recording failed: ${error.message}`); 
            }
        } else {
            recorder.getIsPaused() ? recorder.resumeRecording() : recorder.pauseRecording();
        }
        updateRecordingUI();
    });
    
    elements.stopBtn.addEventListener('click', async () => {
        try {
            const blob = await recorder.stopRecording();
            if (blob && blob.size > 0) {
                handleRecordingSave(blob);
            } else {
                alert('No recording data was captured. Please try again.');
                updateRecordingUI();
            }
        } catch (error) {
            alert(`Failed to stop recording: ${error.message}`);
            updateRecordingUI();
        }
    });
};