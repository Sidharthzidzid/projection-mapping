import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Crosshair, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Surface, Point } from '../types';
import { detectQuadCornersFromVideo, CornerDetectionResult } from '../services/cvAutoAlign';

interface AutoAlignModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSurface: Surface | null;
  onUpdateSurface: (updated: Surface) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const AutoAlignModal: React.FC<AutoAlignModalProps> = ({
  isOpen,
  onClose,
  activeSurface,
  onUpdateSurface,
  canvasWidth,
  canvasHeight,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detection, setDetection] = useState<CornerDetectionResult | null>(null);
  const [applied, setApplied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);

  // Start webcam when opened
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg('Webcam access was denied or no camera device was found.');
        setCameraActive(false);
      }
    };

    startWebcam();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  const handleDetectCorners = () => {
    if (!videoRef.current) return;
    const res = detectQuadCornersFromVideo(videoRef.current, canvasWidth, canvasHeight);
    setDetection(res);

    // Draw overlay on canvas
    const canvas = canvasOverlayRef.current;
    if (canvas && videoRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const [tl, tr, br, bl] = res.corners;
        const scaleX = canvas.width / canvasWidth;
        const scaleY = canvas.height / canvasHeight;

        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tl.x * scaleX, tl.y * scaleY);
        ctx.lineTo(tr.x * scaleX, tr.y * scaleY);
        ctx.lineTo(br.x * scaleX, br.y * scaleY);
        ctx.lineTo(bl.x * scaleX, bl.y * scaleY);
        ctx.closePath();
        ctx.stroke();

        // Corner circles
        const pts = [tl, tr, br, bl];
        const labels = ['TL', 'TR', 'BR', 'BL'];
        pts.forEach((p, idx) => {
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(p.x * scaleX, p.y * scaleY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(labels[idx], p.x * scaleX + 8, p.y * scaleY - 6);
        });
      }
    }
  };

  const handleApplyCorners = () => {
    if (!activeSurface || !detection) return;

    onUpdateSurface({
      ...activeSurface,
      points: [...detection.corners],
    });

    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-5 border-b border-studio-750 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent-neon/20 text-accent-neon flex items-center justify-center border border-accent-neon/30">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-sm">Camera Computer Vision Auto-Alignment</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent-neon/15 text-accent-neon border border-accent-neon/30">
                  AI CV Engine
                </span>
              </div>
              <p className="text-[11px] text-studio-400">
                Point camera at physical stage to automatically detect bright projection borders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-studio-400 hover:text-slate-100 rounded-lg hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video & Camera Stage */}
        <div className="p-5 space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-studio-750 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasOverlayRef}
              width={640}
              height={360}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {!cameraActive && !errorMsg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-studio-950/80 text-studio-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-accent-cyan" />
                <span className="text-xs">Initializing Stage Camera...</span>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-studio-950/90 text-rose-400 p-4 text-center space-y-2">
                <AlertCircle className="w-8 h-8" />
                <div className="text-xs font-semibold">{errorMsg}</div>
                <div className="text-[11px] text-studio-400">
                  Please enable camera permissions in your browser or plug in a USB webcam.
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleDetectCorners}
              disabled={!cameraActive}
              className="px-4 py-2 bg-studio-800 hover:bg-studio-750 border border-studio-700 text-slate-100 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-accent-neon" />
              <span>Detect Physical Projection Area</span>
            </button>

            <button
              onClick={handleApplyCorners}
              disabled={!detection || !activeSurface}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg transition-all ${
                applied
                  ? 'bg-emerald-500 text-white'
                  : detection && activeSurface
                  ? 'bg-accent-neon hover:bg-lime-400 text-black'
                  : 'bg-studio-800 text-studio-500 border border-studio-750 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {applied
                  ? 'Corners Applied to Quad!'
                  : activeSurface
                  ? `Snap Quad to Camera ("${activeSurface.name}")`
                  : 'Select a quad surface first'}
              </span>
            </button>
          </div>

          {/* Tips */}
          <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 text-[11px] text-studio-400 leading-relaxed">
            <strong className="text-slate-200">Pro Tip:</strong> Project the <strong>White Mapping Mesh</strong> (<kbd className="bg-studio-800 px-1 py-0.5 rounded text-white">T</kbd>) onto your physical object. The camera will immediately lock onto the bright rectangular contours and snap the four corners perfectly.
          </div>
        </div>
      </div>
    </div>
  );
};

