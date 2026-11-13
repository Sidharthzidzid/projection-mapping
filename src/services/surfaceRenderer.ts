import { Surface, AudioBands } from '../types';
import { drawSubdividedQuad, drawMeshGrid, applyEdgeBlendToCanvas, getColorFilterString } from './homography';
import { proceduralGenerators } from './shaderRepository';
import { renderTestPattern } from './testPatterns';
import { glslRenderer } from './glslRenderer';

// Offscreen buffers to avoid garbage collection and ensure 60fps performance
const offscreenCanvasMap = new Map<string, HTMLCanvasElement>();
const videoElementMap = new Map<string, HTMLVideoElement>();
const imageElementMap = new Map<string, HTMLImageElement>();
let cameraStream: MediaStream | null = null;
let cameraVideoEl: HTMLVideoElement | null = null;
let screenStream: MediaStream | null = null;
let screenVideoEl: HTMLVideoElement | null = null;

function getOrCreateOffscreenCanvas(id: string, width: number = 800, height: number = 450): HTMLCanvasElement {
  let canvas = offscreenCanvasMap.get(id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    offscreenCanvasMap.set(id, canvas);
  }
  return canvas;
}

export async function requestCameraStream(deviceId?: string): Promise<HTMLVideoElement | null> {
  try {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (!cameraVideoEl) {
      cameraVideoEl = document.createElement('video');
      cameraVideoEl.muted = true;
      cameraVideoEl.playsInline = true;
      cameraVideoEl.autoplay = true;
    }
    cameraVideoEl.srcObject = cameraStream;
    await cameraVideoEl.play();
    return cameraVideoEl;
  } catch (err) {
    console.warn('Failed to access camera:', err);
    return null;
  }
}

export async function requestScreenStream(): Promise<HTMLVideoElement | null> {
  try {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
    }
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor' },
      audio: false,
    });
    if (!screenVideoEl) {
      screenVideoEl = document.createElement('video');
      screenVideoEl.muted = true;
      screenVideoEl.playsInline = true;
      screenVideoEl.autoplay = true;
    }
    screenVideoEl.srcObject = screenStream;
    await screenVideoEl.play();
    return screenVideoEl;
  } catch (err) {
    console.warn('Failed to capture screen:', err);
    return null;
  }
}

export function getOrCreateVideo(url: string, loop: boolean = true, playbackRate: number = 1.0): HTMLVideoElement {
  let video = videoElementMap.get(url);
  if (!video) {
    video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = url;
    video.loop = loop;
    video.playbackRate = playbackRate;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
    videoElementMap.set(url, video);
  }
  return video;
}

export function getOrCreateImage(url: string): HTMLImageElement {
  let img = imageElementMap.get(url);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    imageElementMap.set(url, img);
  }
  return img;
}

/**
 * Renders the texture content for a surface onto an offscreen canvas
 */
export function renderSurfaceContent(
  surface: Surface,
  timeMs: number,
  audio: AudioBands
): HTMLCanvasElement {
  const texW = 800;
  const texH = 450;
  const offscreen = getOrCreateOffscreenCanvas(surface.id, texW, texH);
  const ctx = offscreen.getContext('2d', { alpha: true });
  if (!ctx) return offscreen;

  const filterStr = getColorFilterString(surface.colorAdjustments);
  if (filterStr !== 'none') {
    ctx.filter = filterStr;
  } else {
    ctx.filter = 'none';
  }

  const src = surface.source;

  switch (src.type) {
    case 'shader': {
      const shaderCfg = src.shader || {
        preset: 'cyberpunk_grid',
        speed: 1.0,
        scale: 1.0,
        intensity: 1.0,
        color1: '#00f0ff',
        color2: '#ff007f',
        audioReactive: true,
      };
      const gen = proceduralGenerators[shaderCfg.preset] || proceduralGenerators.cyberpunk_grid;
      gen.render(ctx, texW, texH, timeMs, shaderCfg, audio);
      break;
    }

    case 'custom_shader': {
      const code = src.customShader?.code || `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          gl_FragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
        }
      `;
      const glCanvas = glslRenderer.render(texW, texH, timeMs * 0.001, audio, code);
      if (glCanvas) {
        ctx.drawImage(glCanvas, 0, 0, texW, texH);
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, texW, texH);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ GLSL Shader Compilation Error', texW / 2, texH / 2 - 10);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Open Shader Editor in toolbar to review code', texW / 2, texH / 2 + 15);
      }
      break;
    }

    case 'stream': {
      if (src.streamUrl) {
        const streamVid = getOrCreateVideo(src.streamUrl, true, 1.0);
        if (streamVid.readyState >= 2) {
          ctx.drawImage(streamVid, 0, 0, texW, texH);
        } else {
          ctx.fillStyle = '#06101e';
          ctx.fillRect(0, 0, texW, texH);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('📡 CONNECTING TO LIVE NETWORK STREAM...', texW / 2, texH / 2);
        }
      }
      break;
    }

    case 'testpattern': {
      renderTestPattern(ctx, texW, texH, src.testPattern || 'grid');
      break;
    }

    case 'video': {
      if (src.url) {
        const video = getOrCreateVideo(src.url, src.loop, src.playbackRate);
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, texW, texH);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, texW, texH);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Loading Video Source...', texW / 2, texH / 2);
        }
      }
      break;
    }

    case 'image': {
      if (src.url) {
        const img = getOrCreateImage(src.url);
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, texW, texH);
        }
      }
      break;
    }

    case 'camera': {
      if (cameraVideoEl && cameraVideoEl.readyState >= 2) {
        ctx.drawImage(cameraVideoEl, 0, 0, texW, texH);
      } else {
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, texW, texH);
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('● LIVE WEBCAM / USB CAPTURE', texW / 2, texH / 2 - 15);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Click "Start Camera" in media panel to stream live video', texW / 2, texH / 2 + 15);
      }
      break;
    }

    case 'screen': {
      if (screenVideoEl && screenVideoEl.readyState >= 2) {
        ctx.drawImage(screenVideoEl, 0, 0, texW, texH);
      } else {
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, texW, texH);
        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🖥 SCREEN / WINDOW CAPTURE', texW / 2, texH / 2 - 15);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Click "Select Window" in media panel to capture external apps', texW / 2, texH / 2 + 15);
      }
      break;
    }

    case 'text': {
      const cfg = src.text || {
        content: 'LUMINA MAPPING',
        fontFamily: 'JetBrains Mono',
        fontSize: 48,
        textColor: '#ffffff',
        glowColor: '#00f0ff',
        glowIntensity: 20,
        animation: 'pulse',
        countdownMinutes: 5,
      };

      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, texW, texH);

      let text = cfg.content;
      if (cfg.animation === 'clock') {
        const now = new Date();
        text = now.toLocaleTimeString();
      } else if (cfg.animation === 'countdown') {
        const totalSec = Math.max(0, Math.floor(cfg.countdownMinutes * 60 - (timeMs * 0.001) % (cfg.countdownMinutes * 60)));
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        text = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      ctx.font = `bold ${cfg.fontSize}px "${cfg.fontFamily}", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let x = texW / 2;
      const y = texH / 2;

      if (cfg.animation === 'marquee') {
        x = (texW + 200 - (timeMs * 0.15) % (texW + 500));
      }

      let glow = cfg.glowIntensity;
      if (cfg.animation === 'pulse') {
        glow = cfg.glowIntensity * (1 + Math.sin(timeMs * 0.005) * 0.4);
      }

      ctx.shadowColor = cfg.glowColor;
      ctx.shadowBlur = glow;
      ctx.fillStyle = cfg.textColor;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      break;
    }
  }

  // Apply tint overlay if configured
  if (surface.colorAdjustments.tint) {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = surface.colorAdjustments.tint;
    ctx.fillRect(0, 0, texW, texH);
    ctx.restore();
  }

  // Apply Edge Blending feathering
  if (surface.edgeBlend && surface.edgeBlend.enabled) {
    applyEdgeBlendToCanvas(ctx, texW, texH, surface.edgeBlend);
  }

  ctx.filter = 'none';
  return offscreen;
}

/**
 * Main draw call that projects the warped surface onto the target canvas
 */
export function drawSurface(
  ctx: CanvasRenderingContext2D,
  surface: Surface,
  timeMs: number,
  audio: AudioBands,
  masterDimmer: number = 1.0,
  masterBlackout: boolean = false
) {
  if (!surface.visible || masterBlackout) return;

  const contentCanvas = renderSurfaceContent(surface, timeMs, audio);
  const texW = contentCanvas.width;
  const texH = contentCanvas.height;

  ctx.save();
  ctx.globalAlpha = surface.opacity * masterDimmer;
  ctx.globalCompositeOperation = surface.blendMode || 'source-over';

  if (surface.feather && surface.feather > 0) {
    ctx.filter = `blur(${surface.feather}px)`;
  }

  switch (surface.type) {
    case 'quad': {
      if (surface.points && surface.points.length >= 4) {
        const quad = surface.points.slice(0, 4) as [import('../types').Point, import('../types').Point, import('../types').Point, import('../types').Point];
        drawSubdividedQuad(ctx, contentCanvas, texW, texH, quad, 4, surface.edgeBowing);
      }
      break;
    }

    case 'mesh': {
      if (surface.meshGrid && surface.meshGrid.points) {
        drawMeshGrid(ctx, contentCanvas, texW, texH, surface.meshGrid);
      } else if (surface.points && surface.points.length >= 4) {
        const quad = surface.points.slice(0, 4) as [import('../types').Point, import('../types').Point, import('../types').Point, import('../types').Point];
        drawSubdividedQuad(ctx, contentCanvas, texW, texH, quad, 4, surface.edgeBowing);
      }
      break;
    }

    case 'polygon': {
      const poly = surface.polygonPoints || surface.points;
      if (poly && poly.length >= 3) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
        ctx.clip();

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of poly) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
        const w = maxX - minX || 100;
        const h = maxY - minY || 100;
        ctx.drawImage(contentCanvas, minX, minY, w, h);
        ctx.restore();
      }
      break;
    }

    case 'circle': {
      const c = surface.circleParams || {
        cx: surface.points[0]?.x || 400,
        cy: surface.points[0]?.y || 300,
        rx: 150,
        ry: 150,
        rotation: 0,
      };

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(c.cx, c.cy, c.rx, c.ry, c.rotation, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(contentCanvas, c.cx - c.rx, c.cy - c.ry, c.rx * 2, c.ry * 2);
      ctx.restore();
      break;
    }
  }

  ctx.restore();
}
