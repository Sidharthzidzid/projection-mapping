import { Point } from '../types';

export interface CornerDetectionResult {
  success: boolean;
  corners: [Point, Point, Point, Point]; // TL, TR, BR, BL
  confidence: number;
}

/**
 * Lightweight, zero-dependency Computer Vision engine for auto-aligning projection quads.
 * Performs adaptive thresholding and centroid-based corner contour sorting.
 */
export function detectQuadCornersFromVideo(
  video: HTMLVideoElement,
  targetWidth: number = 1920,
  targetHeight: number = 1080
): CornerDetectionResult {
  const canvas = document.createElement('canvas');
  const w = 320;
  const h = 180;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || video.readyState < 2) {
    return {
      success: false,
      corners: [
        { x: 200, y: 150 },
        { x: targetWidth - 200, y: 150 },
        { x: targetWidth - 200, y: targetHeight - 150 },
        { x: 200, y: targetHeight - 150 },
      ],
      confidence: 0,
    };
  }

  ctx.drawImage(video, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Calculate luminance and compute bright threshold
  const brightPoints: Point[] = [];
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Bright threshold (projection hotspot / white calibration tag)
      if (lum > 140) {
        brightPoints.push({ x, y });
        sumX += x;
        sumY += y;
      }
    }
  }

  if (brightPoints.length < 20) {
    // Fallback to default proportions if camera cannot find bright target
    return {
      success: false,
      corners: [
        { x: 200, y: 150 },
        { x: targetWidth - 200, y: 150 },
        { x: targetWidth - 200, y: targetHeight - 150 },
        { x: 200, y: targetHeight - 150 },
      ],
      confidence: 0.1,
    };
  }

  const cx = sumX / brightPoints.length;
  const cy = sumY / brightPoints.length;

  // 2. Find extreme corner points in 4 quadrants relative to centroid
  let bestTL: Point = { x: 0, y: 0 };
  let bestTR: Point = { x: w, y: 0 };
  let bestBR: Point = { x: w, y: h };
  let bestBL: Point = { x: 0, y: h };

  let maxDistTL = -1;
  let maxDistTR = -1;
  let maxDistBR = -1;
  let maxDistBL = -1;

  for (const p of brightPoints) {
    const distSq = (p.x - cx) ** 2 + (p.y - cy) ** 2;

    if (p.x <= cx && p.y <= cy) {
      if (distSq > maxDistTL) {
        maxDistTL = distSq;
        bestTL = p;
      }
    } else if (p.x > cx && p.y <= cy) {
      if (distSq > maxDistTR) {
        maxDistTR = distSq;
        bestTR = p;
      }
    } else if (p.x > cx && p.y > cy) {
      if (distSq > maxDistBR) {
        maxDistBR = distSq;
        bestBR = p;
      }
    } else if (p.x <= cx && p.y > cy) {
      if (distSq > maxDistBL) {
        maxDistBL = distSq;
        bestBL = p;
      }
    }
  }

  // Scale back to canvas target coordinates
  const scaleX = targetWidth / w;
  const scaleY = targetHeight / h;

  const corners: [Point, Point, Point, Point] = [
    { x: Math.round(bestTL.x * scaleX), y: Math.round(bestTL.y * scaleY) },
    { x: Math.round(bestTR.x * scaleX), y: Math.round(bestTR.y * scaleY) },
    { x: Math.round(bestBR.x * scaleX), y: Math.round(bestBR.y * scaleY) },
    { x: Math.round(bestBL.x * scaleX), y: Math.round(bestBL.y * scaleY) },
  ];

  return {
    success: true,
    corners,
    confidence: Math.min(1.0, brightPoints.length / 500),
  };
}

