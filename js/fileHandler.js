// js/fileHandler.js
import { elements } from './config.js';
// MODIFIED: Corrected the import path to point to the new canvas module
import { getState, getCanvasContext, renderPage, renderPageForExport } from './canvas/index.js';

let fileHandle = null;

// Save drawing as a PDF
export const saveDrawing = async (forceSaveAs = false) => {
  const { jsPDF } = window.jspdf;
  const { canvas } = getCanvasContext();
  const state = getState();
  const totalPages = Math.max(state.pages.length, 1);

  const performSave = async (fileName) => {
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage([canvas.width, canvas.height]);
      
      renderPageForExport(i);
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    }
    
    renderPage(); // Restore current page view

    try {
      if ('showSaveFilePicker' in window && (!fileHandle || forceSaveAs)) {
        fileHandle = await window.showSaveFileFilePicker({
          suggestedName: fileName,
          types: [{ description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } }],
        });
      }
      
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(pdf.output('blob'));
        await writable.close();
      } else {
        pdf.save(fileName);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Save failed:", err);
        alert("File save failed. See console for details.");
      }
      fileHandle = null;
    }
  };

  elements.filenameInput.value = fileHandle ? fileHandle.name : 'drawing.pdf';
  elements.filenameModal.style.display = 'flex';
  elements.filenameInput.focus();
  elements.filenameInput.select();

  return new Promise((resolve) => {
    const confirmHandler = () => {
      cleanup();
      const fileName = elements.filenameInput.value || 'drawing.pdf';
      performSave(fileName).then(() => resolve(true));
    };

    const cancelHandler = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      elements.filenameModal.style.display = 'none';
      elements.confirmSaveBtn.removeEventListener('click', confirmHandler);
      elements.cancelSaveBtn.removeEventListener('click', cancelHandler);
    };

    elements.confirmSaveBtn.addEventListener('click', confirmHandler, { once: true });
    elements.cancelSaveBtn.addEventListener('click', cancelHandler, { once: true });
  });
};