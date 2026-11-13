import { PostFXConfig } from '../types';

let tempCanvas: HTMLCanvasElement | null = null;

function getTempCanvas(width: number, height: number): HTMLCanvasElement {
  if (!tempCanvas) {
    tempCanvas = document.createElement('canvas');
  }
  if (tempCanvas.width !== width || tempCanvas.height !== height) {
    tempCanvas.width = width;
    tempCanvas.height = height;
  }
  return tempCanvas;
}

/**
 * Applies active real-time Post-Processing FX to a canvas
 */
export function applyPostFX(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fx: PostFXConfig,
  timeMs: number,
  isAudioBeat: boolean = false
) {
  if (!fx) return;

  const hasAnyFX = 
    fx.rgbSplit > 0 || 
    fx.kaleidoscope > 1 || 
    fx.neonEdges || 
    fx.scanlines || 
    fx.strobe || 
    fx.invert;

  if (!hasAnyFX) return;

  const temp = getTempCanvas(width, height);
  const tempCtx = temp.getContext('2d');
  if (!tempCtx) return;

  // 1. Copy current canvas to temp buffer
  tempCtx.clearRect(0, 0, width, height);
  tempCtx.drawImage(ctx.canvas, 0, 0);

  // 2. Kaleidoscope / Mirror Multiplier
  if (fx.kaleidoscope > 1) {
    const folds = fx.kaleidoscope; // 2, 4, or 8
    const halfW = width / 2;
    const halfH = height / 2;

    ctx.save();
    ctx.translate(halfW, halfH);

    for (let i = 0; i < folds; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / folds);
      if (i % 2 === 1) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(temp, -halfW, -halfH, halfW, halfH, 0, 0, halfW, halfH);
      ctx.restore();
    }
    ctx.restore();

    // Re-copy updated canvas to temp
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.drawImage(ctx.canvas, 0, 0);
  }

  // 3. RGB Split / Chromatic Aberration
  if (fx.rgbSplit > 0) {
    const shift = fx.rgbSplit;
    ctx.save();

    // Draw Red Channel Shifted Left
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(temp, -shift, 0);

    // Draw Blue Channel Shifted Right
    ctx.drawImage(temp, shift, 0);

    ctx.restore();
  }

  // 4. CRT Scanlines
  if (fx.scanlines) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    const lineStep = 4;
    for (let y = 0; y < height; y += lineStep) {
      ctx.fillRect(0, y, width, 1.5);
    }
    ctx.restore();
  }

  // 5. Invert Colors
  if (fx.invert) {
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Strobe Flash
  if (fx.strobe) {
    const isFlash = isAudioBeat || (Math.floor(timeMs * 0.015 * fx.strobeSpeed) % 2 === 0);
    if (isFlash) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

