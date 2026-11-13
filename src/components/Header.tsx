import React, { useRef, useState, useEffect } from 'react';
import { 
  Projector, 
  Mic, 
  MicOff, 
  Sliders, 
  Maximize2, 
  FolderOpen, 
  Save, 
  FilePlus, 
  HelpCircle, 
  Layers, 
  Sparkles,
  RotateCcw,
  RotateCw,
  ExternalLink,
  Eye,
  SlidersHorizontal,
  Box,
  Camera,
  Circle,
  Radio,
  Zap,
  Grid,
  Code,
  Clock,
  Crosshair,
  Gamepad2
} from 'lucide-react';
import { ProjectData } from '../types';
import { 
  createArchitecturalFacadePreset, 
  create3DCubePreset, 
  createCurvedDomePreset,
  createWhiteMeshCalibrationPreset
} from '../services/presetProjects';
import { bpmClock } from '../services/bpmClock';

interface HeaderProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  isUsingMic: boolean;
  onToggleMic: () => void;
  onOpenMidiModal: () => void;
  onOpenHelpModal: () => void;
  onOpenPostFxModal: () => void;
  onLaunchProjector: () => void;
  viewMode: 'editor' | 'preview' | 'split' | '3d_stage';
  setViewMode: (mode: 'editor' | 'preview' | 'split' | '3d_stage') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onTakeSnapshot: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  onToggleRecording: () => void;
  onOpenShaderModal: () => void;
  onOpenTimelineModal: () => void;
  onOpenAutoAlignModal: () => void;
  gamepadConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  setProject,
  isUsingMic,
  onToggleMic,
  onOpenMidiModal,
  onOpenHelpModal,
  onOpenPostFxModal,
  onLaunchProjector,
  viewMode,
  setViewMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onTakeSnapshot,
  isRecording,
  recordingSeconds,
  onToggleRecording,
  onOpenShaderModal,
  onOpenTimelineModal,
  onOpenAutoAlignModal,
  gamepadConnected = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bpm, setBpm] = useState<number>(project.bpm || 124);

  const handleTapTempo = () => {
    const newBpm = bpmClock.tap();
    setBpm(newBpm);
    setProject(p => ({ ...p, bpm: newBpm }));
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}.pmproj.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.scenes && parsed.scenes.length > 0) {
          setProject(parsed);
        } else {
          alert('Invalid projection project file structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNewProject = () => {
    if (confirm('Create a new blank project? Unsaved changes will be cleared.')) {
      setProject({
        version: '1.0.0',
        name: 'Untitled Projection',
        canvasWidth: 1920,
        canvasHeight: 1080,
        fps: 60,
        bpm: 124,
        activeSceneId: 'scene_default',
        masterDimmer: 1.0,
        masterBlackout: false,
        masterSpeed: 1.0,
        scenes: [
          {
            id: 'scene_default',
            name: 'Scene 1: Blank Stage',
            surfaces: [],
            transitionDuration: 1.0,
          },
        ],
      });
    }
  };

  return (
    <header className="h-14 bg-studio-900 border-b border-studio-750 px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* Brand & Project Controls */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-cyan via-accent-purple to-accent-pink flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Projector className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-wider text-slate-100">LUMINA</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[10px] text-studio-400 font-mono leading-none">Projection Mapping Suite</p>
          </div>
        </div>

        <div className="h-5 w-px bg-studio-700 mx-1" />

        {/* Project Name Editor */}
        <input
          type="text"
          value={project.name}
          onChange={(e) => setProject(p => ({ ...p, name: e.target.value }))}
          className="bg-studio-850 hover:bg-studio-800 focus:bg-studio-800 text-xs text-slate-200 px-2.5 py-1 rounded-lg border border-studio-700/60 focus:border-accent-cyan outline-none transition-all w-48 font-semibold"
          title="Click to rename project"
        />

        {/* File Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleNewProject}
            className="p-1.5 hover:bg-studio-800 text-studio-300 hover:text-slate-100 rounded text-xs transition-colors"
            title="New Project"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-studio-800 text-studio-300 hover:text-slate-100 rounded text-xs transition-colors"
            title="Open / Import Project (.json)"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json,.pmproj"
            className="hidden"
          />

          <button
            onClick={handleExport}
            className="p-1.5 hover:bg-studio-800 text-studio-300 hover:text-slate-100 rounded text-xs transition-colors"
            title="Save / Export Project"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          {/* Demos Menu */}
          <div className="relative group ml-1">
            <button
              className="px-2.5 py-1 bg-studio-800 hover:bg-studio-750 text-accent-cyan text-xs font-bold rounded-lg border border-studio-700 flex items-center space-x-1.5 transition-colors"
              title="Load Pre-configured Architecture & 3D Mapping Presets"
            >
              <Sparkles className="w-3 h-3 text-accent-cyan animate-pulse" />
              <span>Demos</span>
            </button>
            <div className="absolute left-0 mt-1 w-64 bg-studio-900 border border-studio-700 rounded-xl shadow-2xl py-1 z-50 hidden group-hover:block backdrop-blur-xl">
              <div className="px-3 py-1.5 text-[10px] font-bold text-studio-400 uppercase tracking-wider border-b border-studio-800">
                Load Preset Template
              </div>
              <button
                onClick={() => setProject(createWhiteMeshCalibrationPreset())}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex flex-col space-y-0.5 border-b border-studio-800/80 bg-studio-850/40"
              >
                <span className="font-bold text-white flex items-center space-x-1">
                  <Grid className="w-3.5 h-3.5 text-white mr-1" />
                  White Mesh Calibration
                </span>
                <span className="text-[11px] text-studio-400">6×6 Warp Mesh & Quad for physical area mapping</span>
              </button>
              <button
                onClick={() => setProject(createArchitecturalFacadePreset())}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex flex-col space-y-0.5"
              >
                <span className="font-bold text-accent-cyan">Architectural Facade</span>
                <span className="text-[11px] text-studio-400">Pillars, triangular pediment, rose dome</span>
              </button>
              <button
                onClick={() => setProject(create3DCubePreset())}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex flex-col space-y-0.5"
              >
                <span className="font-bold text-accent-neon">3D Optical Stage Cube</span>
                <span className="text-[11px] text-studio-400">Isometric corner-pin box projection</span>
              </button>
              <button
                onClick={() => setProject(createCurvedDomePreset())}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex flex-col space-y-0.5"
              >
                <span className="font-bold text-accent-pink">Curved Dome & Edge Blend</span>
                <span className="text-[11px] text-studio-400">Dual-projector soft feathering panorama</span>
              </button>
            </div>
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5 ml-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded text-xs transition-colors ${
              canUndo ? 'hover:bg-studio-800 text-studio-200' : 'text-studio-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded text-xs transition-colors ${
              canRedo ? 'hover:bg-studio-800 text-studio-200' : 'text-studio-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Viewport Mode Switcher (Editor, Live Output, Split, 3D Stage) */}
      <div className="flex items-center bg-studio-950 p-0.5 rounded-xl border border-studio-750">
        <button
          onClick={() => setViewMode('editor')}
          className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all ${
            viewMode === 'editor'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-sm'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Editor Stage: Shows control handles, mesh pins, snapping guides"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setViewMode('preview')}
          className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all ${
            viewMode === 'preview'
              ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/40 shadow-sm'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Clean Output Preview: Without handles or overlays"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Output</span>
        </button>

        <button
          onClick={() => setViewMode('split')}
          className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all ${
            viewMode === 'split'
              ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/40 shadow-sm'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Split View: Editor and Clean Output side-by-side"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>

        <button
          onClick={() => setViewMode('3d_stage')}
          className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all ${
            viewMode === '3d_stage'
              ? 'bg-accent-pink/20 text-accent-pink border border-accent-pink/40 shadow-sm'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Interactive 3D Virtual Projector Stage Simulator"
        >
          <Box className="w-3.5 h-3.5 text-accent-pink" />
          <span>3D Stage</span>
        </button>
      </div>

      {/* Right Action Tools: BPM, Record, Snapshot, Post-FX, Audio, Projector Window */}
      <div className="flex items-center space-x-2">
        {/* Tap Tempo & BPM Clock */}
        <button
          onClick={handleTapTempo}
          className="px-2.5 py-1 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-white font-mono text-xs flex items-center space-x-1.5 transition-all"
          title="Click to TAP TEMPO or lock BPM"
        >
          <Radio className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
          <span>{bpm} BPM</span>
        </button>

        {/* Live GLSL Shader Studio */}
        <button
          onClick={onOpenShaderModal}
          className="px-2.5 py-1 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-accent-purple text-xs font-semibold flex items-center space-x-1.5 transition-all"
          title="Open Live GLSL Fragment Shader Studio"
        >
          <Code className="w-3.5 h-3.5 text-accent-purple" />
          <span>GLSL</span>
        </button>

        {/* Show Timeline Sequencer */}
        <button
          onClick={onOpenTimelineModal}
          className="px-2.5 py-1 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-accent-pink text-xs font-semibold flex items-center space-x-1.5 transition-all"
          title="Open Automated Show Timeline & Keyframe Sequencer"
        >
          <Clock className="w-3.5 h-3.5 text-accent-pink" />
          <span>Timeline</span>
        </button>

        {/* Computer Vision Auto-Alignment */}
        <button
          onClick={onOpenAutoAlignModal}
          className="px-2.5 py-1 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-accent-neon text-xs font-semibold flex items-center space-x-1.5 transition-all"
          title="Computer Vision Camera Auto-Alignment"
        >
          <Crosshair className="w-3.5 h-3.5 text-accent-neon" />
          <span>Auto-Align</span>
        </button>

        {/* Gamepad Controller Indicator */}
        {gamepadConnected && (
          <div
            className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center"
            title="USB / Bluetooth Gamepad Controller Connected"
          >
            <Gamepad2 className="w-4 h-4 animate-pulse" />
          </div>
        )}

        {/* Post-FX Rack Button */}
        <button
          onClick={onOpenPostFxModal}
          className="px-2.5 py-1 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
          title="Open Master Video Glitch & Post-FX Rack"
        >
          <Zap className="w-3.5 h-3.5 text-accent-pink" />
          <span>Post-FX</span>
        </button>

        {/* 4K Snapshot Tool */}
        <button
          onClick={onTakeSnapshot}
          className="p-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-slate-100 transition-colors"
          title="Capture Instant PNG Snapshot"
        >
          <Camera className="w-4 h-4 text-accent-cyan" />
        </button>

        {/* Live Show Video Recorder */}
        <button
          onClick={onToggleRecording}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition-all ${
            isRecording
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-lg shadow-rose-500/20'
              : 'bg-studio-850 hover:bg-studio-800 text-studio-300 border-studio-700'
          }`}
          title={isRecording ? 'Click to Stop and Save Video Recording' : 'Record Live Projection Show to WebM Video'}
        >
          <Circle className={`w-3 h-3 fill-current ${isRecording ? 'text-rose-500' : 'text-studio-400'}`} />
          <span>
            {isRecording
              ? `REC ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}`
              : 'Record'}
          </span>
        </button>

        <div className="h-5 w-px bg-studio-700" />

        {/* Audio Mic Toggle */}
        <button
          onClick={onToggleMic}
          className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-all ${
            isUsingMic
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-studio-850 hover:bg-studio-800 border-studio-700 text-studio-400'
          }`}
          title={isUsingMic ? 'Microphone Active' : 'Enable live Microphone input'}
        >
          {isUsingMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>

        {/* MIDI Controller */}
        <button
          onClick={onOpenMidiModal}
          className="p-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 text-studio-300 hover:text-slate-100 transition-all"
          title="Open MIDI & Macro Setup"
        >
          <Sliders className="w-4 h-4 text-accent-cyan" />
        </button>

        {/* Projector Window Launcher */}
        <button
          onClick={onLaunchProjector}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-studio-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          title="Open Dedicated Full-Screen Projector Output Window"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Projector Window</span>
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelpModal}
          className="p-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300 hover:text-slate-100 transition-colors"
          title="Help & Hotkeys Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
