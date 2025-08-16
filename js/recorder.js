// js/recorder.js
import { getCanvasContext } from './canvas/index.js';
import * as waveform from './waveform.js';

let mediaRecorder;
let recordedChunks = [];
let audioStream;
let videoStream;
let isPaused = false;
let startTime = null;
let pausedDuration = 0;
let lastPauseTime = null;
let recordingTimer = null;

const pinger = {
    snapshot: null,
    intervalId: null,
    async start() {
        if (this.intervalId) return;
        const { canvas, ctx } = getCanvasContext();
        if (!canvas || !ctx) return;
        const img = new Image();
        img.src = canvas.toDataURL();
        await new Promise(resolve => { img.onload = resolve; });
        this.snapshot = img;
        const frameRate = 90;
        this.intervalId = setInterval(() => {
            if (this.snapshot) {
                ctx.drawImage(this.snapshot, 0, 0, canvas.width, canvas.height);
            }
        }, 1000 / frameRate);
    },
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.snapshot = null;
        }
    }
};

export const startPinger = () => pinger.start();
export const stopPinger = () => pinger.stop();

export const isRecording = () => mediaRecorder && mediaRecorder.state !== 'inactive';
export const getIsPaused = () => isPaused;

const handleDataAvailable = (event) => {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  }
};

// Get supported MIME type
const getSupportedMimeType = () => {
  const possibleTypes = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm'
  ];
  
  for (const type of possibleTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using MIME type:', type);
      return type;
    }
  }
  
  console.warn('No preferred MIME type supported, using default');
  return '';
};

// Create a blob with proper duration metadata
const createBlobWithDuration = (chunks, mimeType, durationSeconds) => {
  const blob = new Blob(chunks, { type: mimeType });
  
  // Add duration metadata to the blob object (this helps some players)
  if (durationSeconds > 0) {
    blob.duration = durationSeconds;
    
    // Create a custom blob with additional properties
    const enhancedBlob = new Blob([blob], { type: mimeType });
    enhancedBlob.duration = durationSeconds;
    
    // Add a custom property that can be read by video elements
    Object.defineProperty(enhancedBlob, 'mozSlice', {
      value: function(start, end, contentType) {
        const slice = blob.slice(start, end, contentType);
        slice.duration = durationSeconds;
        return slice;
      }
    });
    
    return enhancedBlob;
  }
  
  return blob;
};

export const startRecording = async () => {
  if (isRecording()) return;
  
  // Reset recording state
  recordedChunks = [];
  pausedDuration = 0;
  startTime = Date.now();

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }, 
      video: false 
    });
    
    const { canvas } = getCanvasContext();
    videoStream = canvas.captureStream(30); // Use 30fps for better compatibility
    
    const combinedStream = new MediaStream([
      ...videoStream.getTracks(), 
      ...audioStream.getTracks()
    ]);

    waveform.init(audioStream);
    waveform.start();

    const mimeType = getSupportedMimeType();
    const options = {
      mimeType,
      videoBitsPerSecond: 2500000, // Reduced bitrate for better compatibility
      audioBitsPerSecond: 128000,
    };
    
    // Remove mimeType if empty (let browser choose)
    if (!mimeType) {
      delete options.mimeType;
    }
    
    mediaRecorder = new MediaRecorder(combinedStream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    
    // Start recording with regular data intervals
    mediaRecorder.start(50); // Request data every 100ms for smooth recording
    isPaused = false;
    
    pinger.start();
    console.log('Recording started with options:', options);
    
  } catch (err) {
    console.error("Could not start recording:", err);
    if (audioStream) audioStream.getTracks().forEach(track => track.stop());
    if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    throw new Error('Recording failed: ' + (err.message || 'Unknown error'));
  }
};

export const pauseRecording = () => {
    if (!isRecording() || isPaused) return;
    
    mediaRecorder.pause();
    isPaused = true;
    lastPauseTime = Date.now();
    pinger.stop();
    console.log('Recording paused.');
};

export const resumeRecording = () => {
    if (!isRecording() || !isPaused) return;
    
    mediaRecorder.resume();
    isPaused = false;
    
    if (lastPauseTime) {
        pausedDuration += Date.now() - lastPauseTime;
        lastPauseTime = null;
    }
    
    pinger.start();
    console.log('Recording resumed.');
};

export const stopRecording = () => {
  if (!isRecording()) return Promise.resolve(null);

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      pinger.stop();
      waveform.stop();
      
      // Clean up streams
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }
      
      // Calculate recording duration
      const endTime = Date.now();
      let actualDuration = 0;
      if (startTime) {
        actualDuration = (endTime - startTime - pausedDuration) / 1000;
      }
      
      isPaused = false;
      console.log(`Recording stopped. Duration: ${actualDuration.toFixed(2)} seconds, Chunks: ${recordedChunks.length}, Total size: ${recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0)} bytes`);
      
      if (recordedChunks.length === 0) {
        console.warn('No recording chunks available');
        resolve(null);
        return;
      }
      
      // Create blob with duration metadata
      const mimeType = recordedChunks[0].type || 'video/webm';
      const blob = createBlobWithDuration(recordedChunks, mimeType, actualDuration);
      
      // Reset for next recording
      recordedChunks = [];
      startTime = null;
      pausedDuration = 0;
      
      resolve(blob);
    };

    // Stop recording
    if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
      mediaRecorder.stop();
    } else {
      // If already stopped, resolve immediately
      resolve(null);
    }
  });
};