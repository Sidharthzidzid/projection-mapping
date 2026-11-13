import React, { useState, useRef } from 'react';
import { PostFXConfig } from '../types';
import { 
  Sparkles, 
  X, 
  Sliders, 
  Zap, 
  Tv, 
  Eye, 
  Flame, 
  Compass,
  RotateCcw
} from 'lucide-react';

interface PostFxModalProps {
  isOpen: boolean;
  onClose: () => void;
  fx: PostFXConfig;
  onUpdateFx: (updated: PostFXConfig) => void;
}

export const PostFxModal: React.FC<PostFxModalProps> = ({
  isOpen,
  onClose,
  fx,
  onUpdateFx,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [padActive, setPadActive] = useState<boolean>(false);
  const [padPos, setPadPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!isOpen) return null;

  const handlePadInteraction = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setPadPos({ x, y });

    // Modulate RGB Split on X axis (0 to 20px)
    // Modulate Kaleidoscope on Y axis (1, 2, 4, 8)
    const rgbSplit = Math.round(x * 18);
    const folds = y > 0.75 ? 8 : y > 0.45 ? 4 : y > 0.2 ? 2 : 1;

    onUpdateFx({
      ...fx,
      rgbSplit,
      kaleidoscope: folds,
    });
  };

  const handleResetFX = () => {
    onUpdateFx({
      rgbSplit: 0,
      strobe: false,
      strobeSpeed: 4,
      kaleidoscope: 1,
      neonEdges: false,
      scanlines: false,
      invert: false,
    });
    setPadPos({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-4 animate-in fade-in">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-studio-750 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-pink/20 border border-accent-pink/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-pink" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>Master Post-FX & Glitch Processing Rack</span>
              </h2>
              <p className="text-[11px] text-studio-400">Live visual post-processing applied across all projected output</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetFX}
              className="px-2.5 py-1 bg-studio-800 hover:bg-studio-750 rounded-lg text-studio-300 hover:text-white text-xs flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-studio-750 text-studio-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Interactive XY Kaoss Touchpad */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-accent-cyan uppercase tracking-wider flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Live XY Touchpad Controller</span>
              </span>
              <span className="text-studio-400 font-mono">
                X: RGB Glitch • Y: Kaleidoscope
              </span>
            </div>

            <div
              ref={padRef}
              onMouseDown={(e) => {
                setPadActive(true);
                handlePadInteraction(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                if (padActive) handlePadInteraction(e.clientX, e.clientY);
              }}
              onMouseUp={() => setPadActive(false)}
              onMouseLeave={() => setPadActive(false)}
              className="h-44 w-full bg-studio-950 rounded-xl border border-studio-750 relative overflow-hidden cursor-crosshair group shadow-inner"
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2230_1px,transparent_1px),linear-gradient(to_bottom,#1e2230_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

              {/* Glowing XY Puck Cursor */}
              <div
                style={{
                  left: `${padPos.x * 100}%`,
                  top: `${padPos.y * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-accent-cyan bg-accent-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.8)] pointer-events-none flex items-center justify-center transition-transform"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>

              <div className="absolute bottom-2 left-3 text-[10px] text-studio-500 font-mono pointer-events-none">
                DRAG MOUSE TO MODULATE GLITCH
              </div>
            </div>
          </div>

          {/* Individual Effect Sliders & Toggles */}
          <div className="grid grid-cols-2 gap-4">
            {/* RGB Glitch Split */}
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-200">RGB Chromatic Split</span>
                <span className="font-mono text-accent-cyan">{fx.rgbSplit}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={fx.rgbSplit}
                onChange={(e) => onUpdateFx({ ...fx, rgbSplit: parseInt(e.target.value) })}
                className="w-full accent-accent-cyan"
              />
            </div>

            {/* Kaleidoscope Mirroring */}
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-200">Kaleidoscope Mirror</span>
                <span className="font-mono text-accent-purple">{fx.kaleidoscope === 1 ? 'OFF' : `${fx.kaleidoscope}-FOLD`}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 4, 8].map((k) => (
                  <button
                    key={k}
                    onClick={() => onUpdateFx({ ...fx, kaleidoscope: k })}
                    className={`py-1 rounded text-[11px] font-bold border transition-all ${
                      fx.kaleidoscope === k
                        ? 'bg-accent-purple text-white border-accent-purple shadow'
                        : 'bg-studio-800 border-studio-700 text-studio-300'
                    }`}
                  >
                    {k === 1 ? 'Off' : `${k}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* CRT Scanlines */}
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-accent-orange" />
                <span className="font-bold text-slate-200">Retro CRT Scanlines</span>
              </div>
              <input
                type="checkbox"
                checked={fx.scanlines}
                onChange={(e) => onUpdateFx({ ...fx, scanlines: e.target.checked })}
                className="accent-accent-orange cursor-pointer w-4 h-4"
              />
            </div>

            {/* Strobe Flash */}
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-accent-pink" />
                <span className="font-bold text-slate-200">Beat Strobe Flash</span>
              </div>
              <input
                type="checkbox"
                checked={fx.strobe}
                onChange={(e) => onUpdateFx({ ...fx, strobe: e.target.checked })}
                className="accent-accent-pink cursor-pointer w-4 h-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

