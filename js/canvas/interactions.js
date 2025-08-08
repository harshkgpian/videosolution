// js/canvas/interactions.js
import { getState } from "./state.js";

export const getObjectAtPosition = (point) => {
    const state = getState();
    const pageIndex = state.currentPage - 1;
    const objects = state.pages[pageIndex] || [];
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.type === 'image') {
            if (point.x >= obj.x && point.x <= obj.x + obj.width &&
                point.y >= obj.y && point.y <= obj.y + obj.height) {
                return obj;
            }
        }
    }
    return null;
};

export const getResizeHandles = (imageObj) => {
    const { x, y, width, height } = imageObj;
    return {
        tl: { x: x, y: y }, tr: { x: x + width, y: y },
        bl: { x: x, y: y + height }, br: { x: x + width, y: y + height },
        tm: { x: x + width / 2, y: y }, bm: { x: x + width / 2, y: y + height },
        ml: { x: x, y: y + height / 2 }, mr: { x: x + width, y: y + height / 2 },
    };
};

export const getHandleAtPosition = (point, imageObj) => {
    const handles = getResizeHandles(imageObj);
    const handleSize = 10;
    for (const pos in handles) {
        const handle = handles[pos];
        if (Math.abs(point.x - handle.x) < handleSize / 2 &&
            Math.abs(point.y - handle.y) < handleSize / 2) {
            return pos;
        }
    }
    return null;
};

export const isPointOnStroke = (point, stroke, tolerance = 10) => {
  if (!stroke || !stroke.points || stroke.points.length < 2) return false;
  const effectiveTolerance = Math.max(tolerance, stroke.width / 2 + 5);
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i];
    const p2 = stroke.points[i+1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) continue;
    const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / (dx * dx + dy * dy);
    const closestT = Math.max(0, Math.min(1, t));
    const closestX = p1.x + closestT * dx;
    const closestY = p1.y + closestT * dy;
    const distSq = (point.x - closestX)**2 + (point.y - closestY)**2;
    if (distSq < effectiveTolerance**2) return true;
  }
  return false;
};