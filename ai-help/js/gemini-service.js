// js/gemini-service.js

// --- Private Helper Functions ---

// Utility to convert a file to a Base64 string
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Get only the Base64 part
        reader.onerror = (error) => reject(error);
    });
}

// Builds the request payload for the Gemini API
async function buildRequestBody(prompt, file) {
    const textPart = { text: prompt };
    let parts = [textPart];

    if (file) {
        if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are supported.');
        }
        const base64Data = await fileToBase64(file);
        const imagePart = {
            inline_data: {
                mime_type: file.type,
                data: base64Data,
            },
        };
        parts.unshift(imagePart); // Add image before the text prompt
    }

    return { contents: [{ parts }] };
}


// --- Public API Function ---

/**
 * Sends a request to the Gemini API and returns the generated content.
 * @param {string} apiKey - The user's Gemini API key.
 * @param {string} model - The selected model name (e.g., 'gemini-2.5-pro').
 * @param {string} prompt - The text prompt.
 * @param {File} [file] - An optional image file.
 * @returns {Promise<string>} The text response from the API.
 */
export async function generateContent(apiKey, model, prompt, file) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    try {
        const requestBody = await buildRequestBody(prompt, file);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Process and return the final text
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                return candidate.content.parts[0].text;
            }
        } else if (data.promptFeedback) {
            return `**Request blocked.**\n\nReason: ${data.promptFeedback.blockReason}`;
        }
        
        return 'No content generated. The response was empty.';

    } catch (error) {
        console.error('Gemini API Service Error:', error);
        // Re-throw the error so the UI can catch it and display it to the user
        throw error; 
    }
}