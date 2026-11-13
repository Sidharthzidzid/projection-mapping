import React from 'react';
import { X, HelpCircle, Monitor, Projector, Keyboard, Layers, Sliders, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-4 animate-in fade-in">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-studio-750 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">LUMINA PRO — Quick Start & Operator Guide</h2>
              <p className="text-[11px] text-studio-400">Master modern projection mapping workflows in 6 steps</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-studio-750 text-studio-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          {/* Dual-Screen Physical Projector Setup */}
          <div className="p-4 bg-studio-850 rounded-xl border border-studio-750 space-y-3">
            <div className="flex items-center space-x-2 text-accent-cyan font-bold text-sm">
              <Projector className="w-4 h-4" />
              <span>How to Output to a Physical Video Projector</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-studio-900 rounded-lg border border-studio-800 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-accent-cyan/20 text-accent-cyan font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="font-semibold text-slate-200">Connect Projector</div>
                <p className="text-[11px] text-studio-400">
                  Connect projector via HDMI/DP/USB-C. In Windows display settings, select <strong>"Extend Desktop"</strong> (not duplicate).
                </p>
              </div>

              <div className="p-3 bg-studio-900 rounded-lg border border-studio-800 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-accent-neon/20 text-accent-neon font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="font-semibold text-slate-200">Launch Output</div>
                <p className="text-[11px] text-studio-400">
                  Click <strong>"Launch Projector Output"</strong> in the top bar. A dedicated window will open. Drag it onto your projector screen.
                </p>
              </div>

              <div className="p-3 bg-studio-900 rounded-lg border border-studio-800 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="font-semibold text-slate-200">Fullscreen (F)</div>
                <p className="text-[11px] text-studio-400">
                  Press <strong>F</strong> or double-click the projector window for borderless fullscreen. Changes in the editor sync at 60 FPS!
                </p>
              </div>
            </div>
          </div>

          {/* Warping Tools Overview */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-accent-neon" />
              <span>Projection Mapping Geometry Engines</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-studio-850 rounded-lg border border-studio-750 space-y-1">
                <div className="font-semibold text-accent-cyan flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded bg-accent-cyan" />
                  <span>Quad Corner Pinning</span>
                </div>
                <p className="text-[11px] text-studio-400">
                  True projective homography distortion. Drag any of the 4 corner handles to align visuals to flat rectangular surfaces, walls, screens, and billboards at extreme angles.
                </p>
              </div>

              <div className="p-3 bg-studio-850 rounded-lg border border-studio-750 space-y-1">
                <div className="font-semibold text-accent-neon flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded bg-accent-neon" />
                  <span>Bézier Curved Mesh Grid</span>
                </div>
                <p className="text-[11px] text-studio-400">
                  NxM control point mesh (2x2 up to 5x5) for warping images onto curved architectural pillars, domes, spheres, and drapery without optical distortion.
                </p>
              </div>

              <div className="p-3 bg-studio-850 rounded-lg border border-studio-750 space-y-1">
                <div className="font-semibold text-accent-purple flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded bg-accent-purple" />
                  <span>Polygon Mask Slices</span>
                </div>
                <p className="text-[11px] text-studio-400">
                  Arbitrary n-gon geometry for triangular pediments, roof gables, arches, and custom geometric architectural cutouts.
                </p>
              </div>

              <div className="p-3 bg-studio-850 rounded-lg border border-studio-750 space-y-1">
                <div className="font-semibold text-accent-orange flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded bg-accent-orange" />
                  <span>Multi-Projector Edge Blending</span>
                </div>
                <p className="text-[11px] text-studio-400">
                  Configurable soft edge overlap with gamma curves (default 2.2) on left, right, top, and bottom edges to seamlessly blend multiple physical projectors together into one massive canvas.
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Table */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <Keyboard className="w-4 h-4 text-accent-pink" />
              <span>Keyboard Shortcuts & Hotkeys</span>
            </div>

            <div className="border border-studio-750 rounded-lg overflow-hidden bg-studio-850">
              <div className="grid grid-cols-2 divide-y divide-studio-800">
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Space + Drag / Middle Click</span>
                  <span className="font-mono text-slate-200">Pan Canvas</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Scroll Wheel</span>
                  <span className="font-mono text-slate-200">Zoom In / Out</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Arrow Keys</span>
                  <span className="font-mono text-slate-200">Nudge selected point by 1px</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Shift + Arrow Keys</span>
                  <span className="font-mono text-slate-200">Nudge by 10px (Fast)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Alt + Arrow Keys</span>
                  <span className="font-mono text-slate-200">Nudge by 0.2px (Sub-pixel calibration)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">B</span>
                  <span className="font-mono text-rose-400">Toggle Master Blackout</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">F</span>
                  <span className="font-mono text-slate-200">Toggle Borderless Fullscreen</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">T</span>
                  <span className="font-mono text-slate-200">Toggle Calibration Test Grid</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Ctrl + Z / Ctrl + Y</span>
                  <span className="font-mono text-slate-200">Undo / Redo</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">1 - 9</span>
                  <span className="font-mono text-accent-cyan">Switch Scene Cue</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Gamepad Left Stick / D-Pad</span>
                  <span className="font-mono text-amber-400">Nudge Active Surface</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Gamepad RT Trigger</span>
                  <span className="font-mono text-amber-400">Master Dimmer 0 - 100%</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Gamepad A / B / X / Y</span>
                  <span className="font-mono text-amber-400">Trigger Scene Cues 1 - 4</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Gamepad LB / RB</span>
                  <span className="font-mono text-amber-400">Previous / Next Surface</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-studio-400">Gamepad Start</span>
                  <span className="font-mono text-rose-400">Instant Master Blackout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

