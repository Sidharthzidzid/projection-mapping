import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Surface, Point, PostFXConfig, LedStrip, MeshGrid } from '../types';
import { drawSurface } from '../services/surfaceRenderer';
import { audioEngine } from '../services/audioEngine';
import { applyPostFX } from '../services/postFxRenderer';
import { drawLedStrips } from '../services/ledMapper';
import { Virtual3DStage } from './Virtual3DStage';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Magnet, 
  Grid as GridIcon,
  Crosshair,
  Move
} from 'lucide-react';

interface CanvasStageProps {
  surfaces: Surface[];
  activeSurfaceId: string | null;
  onSelectSurface: (id: string) => void;
  onUpdateSurface: (updated: Surface) => void;
  masterDimmer: number;
  masterBlackout: boolean;
  viewMode: 'editor' | 'preview' | 'split' | '3d_stage';
  canvasWidth?: number;
  canvasHeight?: number;
  postFX?: PostFXConfig;
  ledStrips?: LedStrip[];
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

interface DragState {
  type: 'handle' | 'shape';
  surfaceId: string;
  handleType?: 'quad' | 'mesh' | 'poly' | 'circle_center' | 'circle_radius';
  index?: number;
  meshRow?: number;
  meshCol?: number;
  startPos: Point;
  initialPoints: Point[];
  initialMeshGrid?: MeshGrid;
  initialCircleParams?: { cx: number; cy: number; rx: number; ry: number; rotation: number };
}

/**
 * High-performance Ray-casting Point-In-Polygon test
 */
function isPointInPolygon(pt: Point, poly: Point[]): boolean {
  if (!poly || poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  surfaces,
  activeSurfaceId,
  onSelectSurface,
  onUpdateSurface,
  masterDimmer,
  masterBlackout,
  viewMode,
  canvasWidth = 1920,
  canvasHeight = 1080,
  postFX,
  ledStrips = [],
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // References to keep the RAF loop independent from React re-renders
  const surfacesRef = useRef(surfaces);
  surfacesRef.current = surfaces;
  const activeSurfaceIdRef = useRef(activeSurfaceId);
  activeSurfaceIdRef.current = activeSurfaceId;
  const masterDimmerRef = useRef(masterDimmer);
  masterDimmerRef.current = masterDimmer;
  const masterBlackoutRef = useRef(masterBlackout);
  masterBlackoutRef.current = masterBlackout;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const postFxRef = useRef(postFX);
  postFxRef.current = postFX;
  const ledStripsRef = useRef(ledStrips);
  ledStripsRef.current = ledStrips;

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(0.55);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 40 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Unified Drag State for both whole shape moving and individual corner warping
  const [dragState, setDragState] = useState<DragState | null>(null);

  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showBeginnerTips, setShowBeginnerTips] = useState<boolean>(true);
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  const [fps, setFps] = useState<number>(60);

  const isSpaceDownRef = useRef<boolean>(false);
  const activeSurface = surfaces.find(s => s.id === activeSurfaceId);

  useEffect(() => {
    if (editorCanvasRef.current && onCanvasReady) {
      onCanvasReady(editorCanvasRef.current);
    }
  }, [onCanvasReady]);

  // Auto-fit canvas to viewport
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 100 || clientHeight <= 100) return;
    const padding = 50;
    const scaleX = (clientWidth - padding) / canvasWidth;
    const scaleY = (clientHeight - padding) / canvasHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.0);
    setZoom(newZoom);
    setPan({
      x: Math.max(10, (clientWidth - canvasWidth * newZoom) / 2),
      y: Math.max(10, (clientHeight - canvasHeight * newZoom) / 2),
    });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const timer = setTimeout(fitToScreen, 100);
    window.addEventListener('resize', fitToScreen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitToScreen);
    };
  }, [fitToScreen]);

  // Spacebar pan tracking
  useEffect(() => {
    const handleSpaceDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        isSpaceDownRef.current = true;
      }
    };
    const handleSpaceUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDownRef.current = false;
      }
    };
    window.addEventListener('keydown', handleSpaceDown);
    window.addEventListener('keyup', handleSpaceUp);
    return () => {
      window.removeEventListener('keydown', handleSpaceDown);
      window.removeEventListener('keyup', handleSpaceUp);
    };
  }, []);

  const screenToCanvas = useCallback((clientX: number, clientY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const sx = clientX - rect.left - pan.x;
    const sy = clientY - rect.top - pan.y;
    return {
      x: sx / zoom,
      y: sy / zoom,
    };
  }, [pan, zoom]);

  // 60 FPS Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastFpsUpdate = performance.now();
    let frameCount = 0;

    const render = (time: number) => {
      frameCount++;
      if (time - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = time;
      }

      const currentAudio = audioEngine.update(time);
      const currentSurfaces = surfacesRef.current;
      const currentActiveId = activeSurfaceIdRef.current;
      const currentDimmer = masterDimmerRef.current;
      const currentBlackout = masterBlackoutRef.current;
      const currentMode = viewModeRef.current;
      const currentFx = postFxRef.current;
      const currentStrips = ledStripsRef.current;

      // 1. Draw Editor Canvas
      if (editorCanvasRef.current) {
        const ctx = editorCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);

          ctx.fillStyle = '#0a0b10';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          if (showGridOverlay && currentMode === 'editor') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const step = 60;
            for (let x = 0; x < canvasWidth; x += step) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvasHeight);
              ctx.stroke();
            }
            for (let y = 0; y < canvasHeight; y += step) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvasWidth, y);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Draw active surfaces
          for (const surf of currentSurfaces) {
            drawSurface(ctx, surf, time, currentAudio, currentDimmer, currentBlackout);
          }

          // Apply Post-Processing Video FX
          if (currentFx && !currentBlackout) {
            applyPostFX(ctx, canvasWidth, canvasHeight, currentFx, time, currentAudio.beat);
          }

          // Draw Virtual LED Pixel Strips
          if (currentStrips && currentStrips.length > 0 && !currentBlackout) {
            drawLedStrips(ctx, currentStrips, editorCanvasRef.current);
          }

          // Draw control handles and move grips
          if (currentMode === 'editor' && !currentBlackout) {
            drawEditorOverlays(ctx, currentSurfaces, currentActiveId);
          }
        }
      }

      // 2. Draw Clean Preview Canvas
      if (previewCanvasRef.current && (currentMode === 'preview' || currentMode === 'split')) {
        const ctx = previewCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          for (const surf of currentSurfaces) {
            drawSurface(ctx, surf, time, currentAudio, currentDimmer, currentBlackout);
          }

          if (currentFx && !currentBlackout) {
            applyPostFX(ctx, canvasWidth, canvasHeight, currentFx, time, currentAudio.beat);
          }

          if (currentStrips && currentStrips.length > 0 && !currentBlackout) {
            drawLedStrips(ctx, currentStrips, previewCanvasRef.current);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasWidth, canvasHeight, showGridOverlay]);

  const drawEditorOverlays = (
    ctx: CanvasRenderingContext2D,
    surfs: Surface[],
    selectedId: string | null
  ) => {
    ctx.save();

    for (const surf of surfs) {
      if (!surf.visible) continue;
      const isSelected = surf.id === selectedId;

      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.3)';

      // Calculate Center of Surface
      let sumX = 0, sumY = 0;
      surf.points.forEach(p => { sumX += p.x; sumY += p.y; });
      const centerPt = {
        x: sumX / (surf.points.length || 1),
        y: sumY / (surf.points.length || 1),
      };

      if (surf.type === 'quad' && surf.points.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(surf.points[0].x, surf.points[0].y);
        ctx.lineTo(surf.points[1].x, surf.points[1].y);
        ctx.lineTo(surf.points[2].x, surf.points[2].y);
        ctx.lineTo(surf.points[3].x, surf.points[3].y);
        ctx.closePath();
        ctx.stroke();

        if (isSelected) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(surf.points[0].x, surf.points[0].y);
          ctx.lineTo(surf.points[2].x, surf.points[2].y);
          ctx.moveTo(surf.points[1].x, surf.points[1].y);
          ctx.lineTo(surf.points[3].x, surf.points[3].y);
          ctx.stroke();

          // Surface Name Badge on Top-Left
          const tl = surf.points[0];
          ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
          ctx.fillRect(tl.x - 2, tl.y - 28, 140, 22);
          ctx.fillStyle = '#0a0b10';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`★ ${surf.name}`, tl.x + 6, tl.y - 12);

          // Dedicated Center Move Handle
          if (!surf.locked) {
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(10, 11, 16, 0.85)';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerPt.x, centerPt.y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw Move Cross Icon
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(centerPt.x - 12, centerPt.y);
            ctx.lineTo(centerPt.x + 12, centerPt.y);
            ctx.moveTo(centerPt.x, centerPt.y - 12);
            ctx.lineTo(centerPt.x, centerPt.y + 12);
            ctx.stroke();

            ctx.fillStyle = '#00f0ff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MOVE', centerPt.x, centerPt.y + 16);
          }
        }

        // Draw Corner Pin Handles
        if (isSelected && !surf.locked) {
          const cornerLabels = ['TL', 'TR', 'BR', 'BL'];
          surf.points.forEach((p, idx) => {
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.fillStyle = idx === 0 ? '#ff007f' : '#00f0ff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = idx === 0 ? '#ffffff' : '#000000';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cornerLabels[idx], p.x, p.y);
          });
        }
      } else if (surf.type === 'mesh' && surf.meshGrid) {
        const grid = surf.meshGrid;
        for (let r = 0; r < grid.rows; r++) {
          ctx.beginPath();
          ctx.moveTo(grid.points[r][0].x, grid.points[r][0].y);
          for (let c = 1; c < grid.cols; c++) {
            ctx.lineTo(grid.points[r][c].x, grid.points[r][c].y);
          }
          ctx.stroke();
        }
        for (let c = 0; c < grid.cols; c++) {
          ctx.beginPath();
          ctx.moveTo(grid.points[0][c].x, grid.points[0][c].y);
          for (let r = 1; r < grid.rows; r++) {
            ctx.lineTo(grid.points[r][c].x, grid.points[r][c].y);
          }
          ctx.stroke();
        }

        if (isSelected && !surf.locked) {
          // Center Move Handle
          ctx.fillStyle = 'rgba(10, 11, 16, 0.85)';
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerPt.x, centerPt.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(centerPt.x - 10, centerPt.y);
          ctx.lineTo(centerPt.x + 10, centerPt.y);
          ctx.moveTo(centerPt.x, centerPt.y - 10);
          ctx.lineTo(centerPt.x, centerPt.y + 10);
          ctx.stroke();

          for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
              const p = grid.points[r][c];
              const isCorner = (r === 0 || r === grid.rows - 1) && (c === 0 || c === grid.cols - 1);
              ctx.shadowColor = isCorner ? '#39ff14' : '#00f0ff';
              ctx.shadowBlur = 8;
              ctx.fillStyle = isCorner ? '#39ff14' : '#00f0ff';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(p.x, p.y, isCorner ? 10 : 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }
        }
      } else if (surf.type === 'polygon') {
        const poly = surf.polygonPoints || surf.points;
        if (poly && poly.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(poly[0].x, poly[0].y);
          for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(poly[i].x, poly[i].y);
          }
          ctx.closePath();
          ctx.stroke();

          if (isSelected && !surf.locked) {
            // Center Move Handle
            ctx.fillStyle = 'rgba(10, 11, 16, 0.85)';
            ctx.strokeStyle = '#b026ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerPt.x, centerPt.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#b026ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(centerPt.x - 10, centerPt.y);
            ctx.lineTo(centerPt.x + 10, centerPt.y);
            ctx.moveTo(centerPt.x, centerPt.y - 10);
            ctx.lineTo(centerPt.x, centerPt.y + 10);
            ctx.stroke();

            poly.forEach((p, idx) => {
              ctx.fillStyle = '#b026ff';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${idx + 1}`, p.x, p.y);
            });
          }
        }
      } else if (surf.type === 'circle') {
        const c = surf.circleParams || {
          cx: surf.points[0]?.x || 400,
          cy: surf.points[0]?.y || 300,
          rx: 150,
          ry: 150,
          rotation: 0,
        };
        ctx.beginPath();
        ctx.ellipse(c.cx, c.cy, c.rx, c.ry, c.rotation, 0, Math.PI * 2);
        ctx.stroke();

        if (isSelected && !surf.locked) {
          ctx.fillStyle = '#ffaa00';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const rxHandle = { x: c.cx + c.rx, y: c.cy };
          ctx.fillStyle = '#ff007f';
          ctx.beginPath();
          ctx.arc(rxHandle.x, rxHandle.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  };

  const handleResetSurface = () => {
    if (!activeSurface) return;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const w = 600;
    const h = 400;

    const resetPoints = [
      { x: cx - w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];

    onUpdateSurface({
      ...activeSurface,
      points: resetPoints,
      circleParams: activeSurface.type === 'circle' ? { cx, cy, rx: 200, ry: 200, rotation: 0 } : undefined,
    });
  };

  const handleCenterSurface = () => {
    if (!activeSurface) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of activeSurface.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const currentCx = (minX + maxX) / 2;
    const currentCy = (minY + maxY) / 2;
    const dx = canvasWidth / 2 - currentCx;
    const dy = canvasHeight / 2 - currentCy;

    onUpdateSurface({
      ...activeSurface,
      points: activeSurface.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Pan with middle click or spacebar
    if (e.button === 1 || isSpaceDownRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setCursorStyle('grabbing');
      return;
    }

    if (e.button !== 0) return; // Left click only

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const hitRadius = 26 / zoom; // Generous 26px handle click radius

    // 2. Check if clicking on active surface CORNER HANDLES first
    if (activeSurface && !activeSurface.locked) {
      if (activeSurface.type === 'quad') {
        for (let i = 0; i < activeSurface.points.length; i++) {
          const p = activeSurface.points[i];
          if (Math.hypot(p.x - canvasPos.x, p.y - canvasPos.y) <= hitRadius) {
            setDragState({
              type: 'handle',
              surfaceId: activeSurface.id,
              handleType: 'quad',
              index: i,
              startPos: canvasPos,
              initialPoints: activeSurface.points.map(pt => ({ ...pt })),
            });
            setCursorStyle('crosshair');
            return;
          }
        }
      } else if (activeSurface.type === 'mesh' && activeSurface.meshGrid) {
        const grid = activeSurface.meshGrid;
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const p = grid.points[r][c];
            if (Math.hypot(p.x - canvasPos.x, p.y - canvasPos.y) <= hitRadius) {
              setDragState({
                type: 'handle',
                surfaceId: activeSurface.id,
                handleType: 'mesh',
                meshRow: r,
                meshCol: c,
                startPos: canvasPos,
                initialPoints: activeSurface.points.map(pt => ({ ...pt })),
                initialMeshGrid: JSON.parse(JSON.stringify(grid)),
              });
              setCursorStyle('crosshair');
              return;
            }
          }
        }
      } else if (activeSurface.type === 'polygon') {
        const poly = activeSurface.polygonPoints || activeSurface.points;
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i];
          if (Math.hypot(p.x - canvasPos.x, p.y - canvasPos.y) <= hitRadius) {
            setDragState({
              type: 'handle',
              surfaceId: activeSurface.id,
              handleType: 'poly',
              index: i,
              startPos: canvasPos,
              initialPoints: poly.map(pt => ({ ...pt })),
            });
            setCursorStyle('crosshair');
            return;
          }
        }
      } else if (activeSurface.type === 'circle' && activeSurface.circleParams) {
        const c = activeSurface.circleParams;
        if (Math.hypot(c.cx + c.rx - canvasPos.x, c.cy - canvasPos.y) <= hitRadius) {
          setDragState({
            type: 'handle',
            surfaceId: activeSurface.id,
            handleType: 'circle_radius',
            startPos: canvasPos,
            initialPoints: activeSurface.points.map(pt => ({ ...pt })),
            initialCircleParams: { ...c },
          });
          setCursorStyle('crosshair');
          return;
        }
      }
    }

    // 3. Check if clicking INSIDE ANY SURFACE BODY (to select AND drag the entire shape!)
    for (let i = surfaces.length - 1; i >= 0; i--) {
      const s = surfaces[i];
      if (!s.visible) continue;

      let isInside = false;
      if (s.type === 'circle' && s.circleParams) {
        isInside = Math.hypot(canvasPos.x - s.circleParams.cx, canvasPos.y - s.circleParams.cy) <= s.circleParams.rx;
      } else if (s.type === 'mesh' && s.meshGrid) {
        const g = s.meshGrid;
        const outerPoly = [
          g.points[0][0],
          g.points[0][g.cols - 1],
          g.points[g.rows - 1][g.cols - 1],
          g.points[g.rows - 1][0],
        ];
        isInside = isPointInPolygon(canvasPos, outerPoly);
      } else {
        const poly = s.polygonPoints || s.points;
        if (poly && poly.length >= 3) {
          isInside = isPointInPolygon(canvasPos, poly);
        }
      }

      // Also allow clicking within bounding box padding
      if (!isInside) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of s.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
        if (
          canvasPos.x >= minX && canvasPos.x <= maxX &&
          canvasPos.y >= minY && canvasPos.y <= maxY
        ) {
          isInside = true;
        }
      }

      if (isInside) {
        onSelectSurface(s.id);
        if (!s.locked) {
          setDragState({
            type: 'shape',
            surfaceId: s.id,
            startPos: canvasPos,
            initialPoints: s.points.map(p => ({ ...p })),
            initialMeshGrid: s.meshGrid ? JSON.parse(JSON.stringify(s.meshGrid)) : undefined,
            initialCircleParams: s.circleParams ? { ...s.circleParams } : undefined,
          });
          setCursorStyle('grabbing');
        }
        return;
      }
    }

    // 4. Clicked outside: start canvas panning
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setCursorStyle('grabbing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setCursorPos({ x: Math.round(canvasPos.x), y: Math.round(canvasPos.y) });

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!dragState) {
      // Dynamic hover cursor detection
      let hovered = 'default';
      const hitRadius = 24 / zoom;

      if (activeSurface && !activeSurface.locked) {
        for (const p of activeSurface.points) {
          if (Math.hypot(p.x - canvasPos.x, p.y - canvasPos.y) <= hitRadius) {
            hovered = 'crosshair';
            break;
          }
        }
      }

      if (hovered === 'default') {
        for (const s of surfaces) {
          if (!s.visible) continue;
          let inside = false;
          if (s.type === 'circle' && s.circleParams) {
            inside = Math.hypot(canvasPos.x - s.circleParams.cx, canvasPos.y - s.circleParams.cy) <= s.circleParams.rx;
          } else {
            const poly = s.polygonPoints || s.points;
            if (poly && poly.length >= 3) inside = isPointInPolygon(canvasPos, poly);
          }
          if (inside) {
            hovered = 'move';
            break;
          }
        }
      }

      setCursorStyle(hovered);
      return;
    }

    const currentSurface = surfaces.find(s => s.id === dragState.surfaceId);
    if (!currentSurface) return;

    // A. Dragging the ENTIRE Shape
    if (dragState.type === 'shape') {
      let dx = canvasPos.x - dragState.startPos.x;
      let dy = canvasPos.y - dragState.startPos.y;

      if (snapToGrid) {
        const snap = 20;
        dx = Math.round(dx / snap) * snap;
        dy = Math.round(dy / snap) * snap;
      }

      const updatedPoints = dragState.initialPoints.map(p => ({
        x: p.x + dx,
        y: p.y + dy,
      }));

      let updatedMesh = undefined;
      if (dragState.initialMeshGrid) {
        updatedMesh = {
          ...dragState.initialMeshGrid,
          points: dragState.initialMeshGrid.points.map(row =>
            row.map(pt => ({ x: pt.x + dx, y: pt.y + dy }))
          ),
        };
      }

      let updatedCircle = undefined;
      if (dragState.initialCircleParams) {
        updatedCircle = {
          ...dragState.initialCircleParams,
          cx: dragState.initialCircleParams.cx + dx,
          cy: dragState.initialCircleParams.cy + dy,
        };
      }

      onUpdateSurface({
        ...currentSurface,
        points: updatedPoints,
        polygonPoints: currentSurface.type === 'polygon' ? updatedPoints : undefined,
        meshGrid: updatedMesh,
        circleParams: updatedCircle,
      });
    } 
    // B. Dragging an individual Corner / Control Handle
    else if (dragState.type === 'handle') {
      let targetX = canvasPos.x;
      let targetY = canvasPos.y;

      if (snapToGrid) {
        const snap = 20;
        targetX = Math.round(targetX / snap) * snap;
        targetY = Math.round(targetY / snap) * snap;
      }

      if (dragState.handleType === 'quad') {
        const newPoints = [...currentSurface.points];
        newPoints[dragState.index!] = { x: targetX, y: targetY };
        onUpdateSurface({
          ...currentSurface,
          points: newPoints,
        });
      } else if (dragState.handleType === 'mesh' && currentSurface.meshGrid) {
        const newGrid = {
          ...currentSurface.meshGrid,
          points: currentSurface.meshGrid.points.map((row, rIdx) =>
            row.map((pt, cIdx) => {
              if (rIdx === dragState.meshRow && cIdx === dragState.meshCol) {
                return { x: targetX, y: targetY };
              }
              return pt;
            })
          ),
        };
        onUpdateSurface({
          ...currentSurface,
          meshGrid: newGrid,
        });
      } else if (dragState.handleType === 'poly') {
        const poly = [...(currentSurface.polygonPoints || currentSurface.points)];
        poly[dragState.index!] = { x: targetX, y: targetY };
        onUpdateSurface({
          ...currentSurface,
          polygonPoints: poly,
          points: poly,
        });
      } else if (dragState.handleType === 'circle_radius' && currentSurface.circleParams) {
        const dx = Math.abs(targetX - currentSurface.circleParams.cx);
        onUpdateSurface({
          ...currentSurface,
          circleParams: {
            ...currentSurface.circleParams,
            rx: Math.max(30, dx),
            ry: Math.max(30, dx),
          },
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
    setCursorStyle('default');
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 2.5);
    setZoom(newZoom);
  };

  if (viewMode === '3d_stage') {
    return <Virtual3DStage sourceCanvasRef={editorCanvasRef} />;
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: cursorStyle }}
      className="relative flex-1 h-full bg-studio-950 overflow-hidden select-none"
    >
      {/* Beginner Guide Banner */}
      {showBeginnerTips && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-studio-900/95 border border-accent-cyan/40 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl flex items-center space-x-3 text-xs text-slate-200 animate-in fade-in slide-in-from-top-2">
          <div className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center font-bold text-xs">
            💡
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-accent-cyan">How to Drag:</span>
            <span>Click & drag <strong>inside any shape</strong> (or the central MOVE grip) to move it. Drag the <strong>corner circles</strong> (TL, TR, BR, BL) to warp!</span>
          </div>
          <button
            onClick={() => setShowBeginnerTips(false)}
            className="text-[11px] text-studio-400 hover:text-white px-2 py-0.5 rounded bg-studio-800"
          >
            Got it
          </button>
        </div>
      )}

      {/* Floating Viewport Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-studio-900/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-studio-700 shadow-xl space-x-1.5 text-xs">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.2, 2.5))}
          className="p-1 hover:bg-studio-800 rounded text-studio-300 hover:text-slate-100"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] text-accent-cyan px-1 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.max(z * 0.8, 0.2))}
          className="p-1 hover:bg-studio-800 rounded text-studio-300 hover:text-slate-100"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-studio-750" />

        <button
          onClick={fitToScreen}
          className="p-1 hover:bg-studio-800 rounded text-studio-300 hover:text-slate-100"
          title="Fit Canvas to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-studio-750" />

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-1 rounded flex items-center space-x-1 px-1.5 transition-colors ${
            snapToGrid
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
              : 'hover:bg-studio-800 text-studio-400'
          }`}
          title="Toggle Grid Snapping"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="text-[10px]">Snap</span>
        </button>

        <button
          onClick={() => setShowGridOverlay(!showGridOverlay)}
          className={`p-1 rounded flex items-center space-x-1 px-1.5 transition-colors ${
            showGridOverlay
              ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/40'
              : 'hover:bg-studio-800 text-studio-400'
          }`}
          title="Toggle Grid Overlay"
        >
          <GridIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Surface Quick Actions Bar */}
      {activeSurface && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center bg-studio-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-studio-700 shadow-xl space-x-2 text-xs">
          <span className="text-studio-400 text-[11px] font-medium mr-1">Surface:</span>
          <span className="font-bold text-accent-cyan text-[11px] truncate max-w-[120px]">{activeSurface.name}</span>

          <div className="h-4 w-px bg-studio-750" />

          <button
            onClick={handleResetSurface}
            className="px-2 py-1 bg-studio-800 hover:bg-studio-750 rounded text-studio-200 hover:text-accent-cyan text-[11px] flex items-center space-x-1 transition-all"
            title="Reset surface corners to clean rectangle"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Shape</span>
          </button>

          <button
            onClick={handleCenterSurface}
            className="px-2 py-1 bg-studio-800 hover:bg-studio-750 rounded text-studio-200 hover:text-accent-cyan text-[11px] flex items-center space-x-1 transition-all"
            title="Move surface to center of stage"
          >
            <Crosshair className="w-3 h-3" />
            <span>Center</span>
          </button>
        </div>
      )}

      {/* Coordinate HUD */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-3 bg-studio-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-studio-700 shadow-xl font-mono text-[11px] text-studio-300">
        <div className="flex items-center space-x-1.5">
          <Crosshair className="w-3 h-3 text-accent-cyan" />
          <span>
            X: <strong className="text-slate-100">{cursorPos.x}</strong> Y: <strong className="text-slate-100">{cursorPos.y}</strong>
          </span>
        </div>
        <div className="h-3 w-px bg-studio-700" />
        <span className={`font-semibold ${fps >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {fps} FPS
        </span>
      </div>

      {/* Canvas World Container (Direct instant transform without lagged CSS transition) */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: canvasWidth,
          height: canvasHeight,
        }}
        className="relative shadow-2xl border-2 border-studio-700"
      >
        <div className="absolute inset-0 border border-accent-cyan/20 pointer-events-none z-10" />

        <canvas
          ref={editorCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute inset-0 block bg-black"
        />

        {viewMode === 'preview' && (
          <canvas
            ref={previewCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="absolute inset-0 block bg-black"
          />
        )}
      </div>
    </div>
  );
};
