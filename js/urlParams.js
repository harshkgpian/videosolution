// js/urlParams.js
import * as canvas from './canvas/index.js';

export class URLParamsHandler {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
    }

    // Get all URL parameters
    getParams() {
        const params = {};
        for (const [key, value] of this.params.entries()) {
            params[key] = value;
        }
        return params;
    }

    // Get a specific parameter
    getParam(key) {
        return this.params.get(key);
    }

    // Set recording name from URL parameter
    getRecordingName() {
        return this.getParam('recordingName') || this.getParam('recording') || this.getParam('name');
    }

    // Get image URL from parameter
    getImageUrl() {
        return this.getParam('image') || this.getParam('img') || this.getParam('background') || this.getParam('bg');
    }

    // Get canvas size from parameters
    getCanvasSize() {
        const width = this.getParam('width') || this.getParam('w');
        const height = this.getParam('height') || this.getParam('h');
        
        if (width && height) {
            return {
                width: parseInt(width, 10),
                height: parseInt(height, 10)
            };
        }
        return null;
    }

    // Load image from URL (supports both direct URLs and data URLs)
    async loadImageFromUrl(imageUrl) {
        return new Promise((resolve, reject) => {
            // Check if it's a data URL
            if (imageUrl.startsWith('data:image/')) {
                canvas.addImage(imageUrl);
                resolve(imageUrl);
                return;
            }

            // For external URLs, we need to convert to data URL due to CORS
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    // Create canvas to convert image to data URL
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    tempCtx.drawImage(img, 0, 0);
                    
                    const dataUrl = tempCanvas.toDataURL('image/png');
                    canvas.addImage(dataUrl);
                    resolve(dataUrl);
                } catch (error) {
                    console.error('Error converting image to data URL:', error);
                    reject(error);
                }
            };

            img.onerror = () => {
                console.error('Failed to load image from URL:', imageUrl);
                reject(new Error('Failed to load image'));
            };

            img.src = imageUrl;
        });
    }

    // Load background image from URL
    async loadBackgroundFromUrl(imageUrl) {
        return new Promise((resolve, reject) => {
            if (imageUrl.startsWith('data:image/')) {
                canvas.setBackgroundImage(imageUrl);
                localStorage.setItem('canvasBackground', imageUrl);
                resolve(imageUrl);
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    tempCtx.drawImage(img, 0, 0);
                    
                    const dataUrl = tempCanvas.toDataURL('image/png');
                    canvas.setBackgroundImage(dataUrl);
                    localStorage.setItem('canvasBackground', dataUrl);
                    resolve(dataUrl);
                } catch (error) {
                    console.error('Error converting background image to data URL:', error);
                    reject(error);
                }
            };

            img.onerror = () => {
                console.error('Failed to load background image from URL:', imageUrl);
                reject(new Error('Failed to load background image'));
            };

            img.src = imageUrl;
        });
    }

    // Process all URL parameters
    async processUrlParams() {
        const params = this.getParams();
        console.log('URL Parameters detected:', params);

        try {
            // Set canvas size if specified
            const size = this.getCanvasSize();
            if (size) {
                console.log(`Setting canvas size from URL: ${size.width}x${size.height}`);
                canvas.setCanvasSize(size.width, size.height);
            }

            // Load background image if specified
            const bgImageUrl = this.getParam('background') || this.getParam('bg');
            if (bgImageUrl) {
                console.log('Loading background image from URL:', bgImageUrl);
                try {
                    await this.loadBackgroundFromUrl(decodeURIComponent(bgImageUrl));
                    console.log('✅ Background image loaded successfully');
                } catch (error) {
                    console.error('❌ Failed to load background image:', error);
                }
            }

            // Load regular image if specified
            const imageUrl = this.getParam('image') || this.getParam('img');
            if (imageUrl) {
                console.log('Loading image from URL:', imageUrl);
                try {
                    await this.loadImageFromUrl(decodeURIComponent(imageUrl));
                    console.log('✅ Image loaded successfully');
                } catch (error) {
                    console.error('❌ Failed to load image:', error);
                }
            }

            // Store recording name for later use
            const recordingName = this.getRecordingName();
            if (recordingName) {
                console.log('Recording name from URL:', recordingName);
                // Store in sessionStorage so it can be used when recording stops
                sessionStorage.setItem('predefinedRecordingName', decodeURIComponent(recordingName));
            }

        } catch (error) {
            console.error('Error processing URL parameters:', error);
        }
    }

    // Generate a URL with current state
    generateUrl(options = {}) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();

        // Add canvas size
        if (options.includeCanvasSize) {
            const { canvas: canvasEl } = canvas.getCanvasContext();
            params.set('width', canvasEl.width);
            params.set('height', canvasEl.height);
        }

        // Add recording name
        if (options.recordingName) {
            params.set('recordingName', encodeURIComponent(options.recordingName));
        }

        // Add image URL (if provided)
        if (options.imageUrl) {
            params.set('image', encodeURIComponent(options.imageUrl));
        }

        // Add background URL (if provided)
        if (options.backgroundUrl) {
            params.set('background', encodeURIComponent(options.backgroundUrl));
        }

        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }
}

// Export a singleton instance
export const urlParams = new URLParamsHandler();