// js/ui/pages.js
import { elements } from '../config.js';
import * as canvas from '../canvas/index.js';
import * as recorder from '../recorder.js';

export const updatePageInfo = () => {
    const { currentPage, pages } = canvas.getState();
    const totalPages = Math.max(pages.length, 1);
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage >= 200;
};

export const setupPageControls = () => {
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