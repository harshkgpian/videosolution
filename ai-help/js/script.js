// js/script.js

import { SCRIPT_PROMPT_TEMPLATE } from './prompt.js';
import { generateContent } from './gemini-service.js';

// --- DOM Element References ---
const apiKeyInput = document.getElementById('api-key');
const modelSelect = document.getElementById('model-select');
const questionInput = document.getElementById('question-input');
const solutionInput = document.getElementById('solution-input');
const imageUpload = document.getElementById('image-upload');
const fileNameDisplay = document.getElementById('file-name');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const submitBtn = document.getElementById('submit-btn');
const responseCard = document.getElementById('response-card');
const responseContent = document.getElementById('response-content');
const loader = document.querySelector('.loader');
const btnText = document.querySelector('.btn-text');

// --- State for pasted image ---
let pastedFile = null;

// --- UI Functions ---

function toggleLoading(isLoading) {
    loader.classList.toggle('hidden', !isLoading);
    btnText.classList.toggle('hidden', isLoading);
    submitBtn.disabled = isLoading;
}

function displayResponse(text) {
    responseContent.innerHTML = marked.parse(text);
    if (window.MathJax) {
        MathJax.typesetPromise([responseContent]).catch((err) => console.error('MathJax Error:', err));
    }
    responseCard.classList.remove('hidden');
}

function displayError(error) {
    responseContent.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${error.message}</p>`;
    responseCard.classList.remove('hidden');
}

// --- Event Handlers ---

async function handleSubmit() {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const questionText = questionInput.value.trim();
    const solutionText = solutionInput.value.trim();
    
    // Use the pasted file if it exists, otherwise use the uploaded file
    const file = pastedFile || imageUpload.files[0];

    // --- Validation ---
    if (!apiKey) {
        alert('Please enter your Gemini API Key.');
        return;
    }
    if (!questionText || !solutionText) {
        alert('Please provide both a Question and a Solution.');
        return;
    }
    
    localStorage.setItem('geminiApiKey', apiKey);
    toggleLoading(true);

    try {
        let finalPrompt = SCRIPT_PROMPT_TEMPLATE.replace('[---PASTE THE FULL QUESTION TEXT HERE---]', questionText);
        finalPrompt = finalPrompt.replace('[---PASTE THE DETAILED, STEP-BY-STEP SOLUTION HERE.---]', solutionText);

        const resultText = await generateContent(apiKey, model, finalPrompt, file);
        displayResponse(resultText);

    } catch (error) {
        displayError(error);
    } finally {
        toggleLoading(false);
    }
}

function handleFileChange() {
    pastedFile = null; // Clear any pasted file
    const file = imageUpload.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = 'No file chosen';
        imagePreviewContainer.classList.add('hidden');
    }
}

/**
 * Handles the paste event for the entire document.
 * @param {ClipboardEvent} event The paste event.
 */
function handlePaste(event) {
    // Check if the clipboard data is available and has items
    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) {
        console.log("Clipboard API did not return any items.");
        return;
    }
    
    console.log(`Paste event detected. Found ${clipboardItems.length} clipboard item(s).`);

    // Find the first item that is an image
    const imageItem = Array.from(clipboardItems).find(item => item.type.startsWith('image/'));

    if (imageItem) {
        console.log("Found an image item in the clipboard:", imageItem);
        
        // Prevent the browser from doing its default paste action (like pasting text)
        event.preventDefault();

        // Get the image as a File object
        const imageFile = imageItem.getAsFile();
        if (imageFile) {
            console.log("Successfully converted clipboard item to a File object:", imageFile);
            pastedFile = imageFile; // Store the file to be used on submit

            // Clear the manual file input to avoid confusion
            imageUpload.value = ''; 

            // Update UI to show the pasted image preview
            fileNameDisplay.textContent = 'pasted_image.png'; // Use a generic name
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
                console.log("Image preview has been updated.");
            };
            reader.readAsDataURL(pastedFile);
        } else {
            console.error("Could not get the image as a file from the clipboard item.");
        }
    } else {
        console.log("No image found in the clipboard. The paste action was ignored.");
    }
}


// --- Initialization ---

function initialize() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Attach event listeners
    submitBtn.addEventListener('click', handleSubmit);
    imageUpload.addEventListener('change', handleFileChange);
    // Listen for paste events on the entire document
    document.addEventListener('paste', handlePaste); 
}

initialize();