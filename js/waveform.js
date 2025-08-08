// js/waveform.js
import { elements } from './config.js';

let audioContext;
let analyser;
let source;
let dataArray;
let animationFrameId;

const { waveformCanvas } = elements;
const ctx = waveformCanvas.getContext('2d');

/**
 * Initializes the Web Audio API components.
 * @param {MediaStream} stream The audio stream from the microphone.
 */
export const init = (stream) => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // Smaller size for better performance/simpler waveform

  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
};

/**
 * The drawing loop that visualizes the waveform.
 */
const draw = () => {
  animationFrameId = requestAnimationFrame(draw);

  analyser.getByteTimeDomainData(dataArray);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#64748b'; // A calm, greyish-blue
  ctx.beginPath();

  const sliceWidth = waveformCanvas.width * 1.0 / analyser.frequencyBinCount;
  let x = 0;

  for (let i = 0; i < analyser.frequencyBinCount; i++) {
    const v = dataArray[i] / 128.0; // Normalize to 0-2 range
    const y = v * waveformCanvas.height / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
  ctx.stroke();
};

/**
 * Starts displaying the waveform.
 */
export const start = () => {
  waveformCanvas.style.display = 'block';
  draw();
};

/**
 * Stops displaying the waveform and cleans up.
 */
export const stop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
  waveformCanvas.style.display = 'none';
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
};