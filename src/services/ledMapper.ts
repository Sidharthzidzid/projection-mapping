import { LedStrip, Point } from '../types';

export interface DmxFixtureOutput {
  universe: number;
  startChannel: number;
  channels: number[]; // R, G, B, R, G, B...
}

/**
 * Draws virtual LED Pixel Strips on top of the stage and samples RGB colors
 */
export function drawLedStrips(
  ctx: CanvasRenderingContext2D,
  strips: LedStrip[],
  sourceCanvas: HTMLCanvasElement
): DmxFixtureOutput[] {
  if (!strips || strips.length === 0) return [];

  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const outputs: DmxFixtureOutput[] = [];

  ctx.save();

  for (const strip of strips) {
    if (!strip.enabled) continue;

    const channels: number[] = [];
    const count = Math.max(4, strip.pixelCount);
    const dx = (strip.end.x - strip.start.x) / (count - 1);
    const dy = (strip.end.y - strip.start.y) / (count - 1);

    // Draw backing strip bar
    ctx.strokeStyle = 'rgba(20, 24, 35, 0.9)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(strip.start.x, strip.start.y);
    ctx.lineTo(strip.end.x, strip.end.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sample pixels and draw glowing LEDs
    for (let i = 0; i < count; i++) {
      const px = Math.round(strip.start.x + dx * i);
      const py = Math.round(strip.start.y + dy * i);

      let r = 0, g = 240, b = 255;
      if (sourceCtx && px >= 0 && px < sourceCanvas.width && py >= 0 && py < sourceCanvas.height) {
        try {
          const pixel = sourceCtx.getImageData(px, py, 1, 1).data;
          r = pixel[0];
          g = pixel[1];
          b = pixel[2];
        } catch {
          // ignore boundary errors
        }
      }

      channels.push(r, g, b);

      // Draw LED pixel glow
      const colorStr = `rgb(${r}, ${g}, ${b})`;
      ctx.fillStyle = colorStr;
      ctx.shadowColor = colorStr;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw Strip Label & DMX info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `${strip.name} [U${strip.universe}:CH${strip.startChannel}-${strip.startChannel + count * 3 - 1}]`,
      strip.start.x,
      strip.start.y - 12
    );

    outputs.push({
      universe: strip.universe,
      startChannel: strip.startChannel,
      channels,
    });
  }

  ctx.restore();
  return outputs;
}

