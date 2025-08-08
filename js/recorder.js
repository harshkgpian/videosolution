// js/recorder.js
import { getCanvasContext } from './canvas/index.js';
import * as waveform from './waveform.js';

let mediaRecorder;
let recordedChunks = [];
let audioStream;
let videoStream;
let isPaused = false;

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
        const frameRate = 30;
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

// DELETED: The old downloadVideo function is removed.

export const startRecording = async () => {
  if (isRecording()) return;
  recordedChunks = []; // Clear chunks from previous recordings

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const { canvas } = getCanvasContext();
    videoStream = canvas.captureStream(60);
    const combinedStream = new MediaStream([...videoStream.getTracks(), ...audioStream.getTracks()]);

    waveform.init(audioStream);
    waveform.start();

    const options = { 
      mimeType: 'video/webm; codecs=vp9,opus',
      videoBitsPerSecond: 8000000,
      audioBitsPerSecond: 128000,
    };
    
    mediaRecorder = new MediaRecorder(combinedStream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    // The onstop event will now resolve the promise in stopRecording()
    
    mediaRecorder.start();
    isPaused = false;
    pinger.start();
    console.log('Recording started.');
  } catch (err) {
    console.error("Could not start recording:", err);
    if (audioStream) audioStream.getTracks().forEach(track => track.stop());
    throw new Error('Microphone access was denied. Cannot record audio.');
  }
};

export const pauseRecording = () => {
    if (!isRecording() || isPaused) return;
    mediaRecorder.pause();
    isPaused = true;
    pinger.stop();
    console.log('Recording paused.');
};

export const resumeRecording = () => {
    if (!isRecording() || !isPaused) return;
    mediaRecorder.resume();
    isPaused = false;
    pinger.start();
    console.log('Recording resumed.');
};

// MODIFIED: This function now returns a Promise with the video blob
export const stopRecording = () => {
  if (!isRecording()) return Promise.resolve(null);

  return new Promise((resolve) => {
    // Set the onstop event handler to resolve the promise
    mediaRecorder.onstop = () => {
      pinger.stop();
      waveform.stop();
      if (audioStream) audioStream.getTracks().forEach(track => track.stop());
      if (videoStream) videoStream.getTracks().forEach(track => track.stop());
      isPaused = false;
      console.log('Recording stopped. Data compiled.');
      
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      resolve(blob);
    };

    // Trigger the onstop event
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
};