import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Camera, 
  Monitor, 
  Type, 
  Grid, 
  Upload,
  Play,
  Activity,
  Plus,
  Check,
  Zap,
  Radio,
  Code
} from 'lucide-react';
import { Surface, SourceConfig, ShaderPreset, TestPatternType } from '../types';
import { proceduralGenerators } from '../services/shaderRepository';
import { requestCameraStream, requestScreenStream } from '../services/surfaceRenderer';

interface MediaBinProps {
  activeSurface: Surface | null;
  onApplySource: (source: SourceConfig) => void;
  onAddSurfaceWithSource: (source: SourceConfig) => void;
}

export const MediaBin: React.FC<MediaBinProps> = ({
  activeSurface,
  onApplySource,
  onAddSurfaceWithSource,
}) => {
  const [activeTab, setActiveTab] = useState<'shaders' | 'testpatterns' | 'live' | 'text' | 'files'>('shaders');
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [customText, setCustomText] = useState('LUMINA PRO');
  const [textAnim, setTextAnim] = useState<'pulse' | 'marquee' | 'clock' | 'countdown'>('pulse');
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [justAppliedKey, setJustAppliedKey] = useState<string | null>(null);

  const handleStartCamera = async () => {
    const video = await requestCameraStream();
    if (video) {
      setCameraActive(true);
      const source: SourceConfig = { type: 'camera' };
      if (activeSurface) onApplySource(source);
      else onAddSurfaceWithSource(source);
    }
  };

  const handleStartScreen = async () => {
    const video = await requestScreenStream();
    if (video) {
      setScreenActive(true);
      const source: SourceConfig = { type: 'screen' };
      if (activeSurface) onApplySource(source);
      else onAddSurfaceWithSource(source);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    const source: SourceConfig = {
      type: isVideo ? 'video' : 'image',
      url,
      name: file.name,
      loop: true,
      playbackRate: 1.0,
      aspectRatioMode: 'fill',
    };

    if (activeSurface) onApplySource(source);
    else onAddSurfaceWithSource(source);
    e.target.value = '';
  };

  const handleSelectShader = (preset: ShaderPreset) => {
    const colors: Record<ShaderPreset, [string, string]> = {
      cyberpunk_grid: ['#00f0ff', '#ff007f'],
      audio_waves: ['#00f0ff', '#ff007f'],
      liquid_plasma: ['#ff007f', '#00f0ff'],
      matrix_rain: ['#39ff14', '#00f0ff'],
      pulsing_polyhedra: ['#00f0ff', '#ff007f'],
      sacred_mandala: ['#ffaa00', '#00f0ff'],
      strobe: ['#00f0ff', '#ff007f'],
    };

    const source: SourceConfig = {
      type: 'shader',
      shader: {
        preset,
        speed: 1.0,
        scale: 1.0,
        intensity: 1.0,
        color1: colors[preset][0],
        color2: colors[preset][1],
        audioReactive: true,
      },
    };

    if (activeSurface) onApplySource(source);
    else onAddSurfaceWithSource(source);

    setJustAppliedKey(preset);
    setTimeout(() => setJustAppliedKey(null), 1200);
  };

  const handleSelectTestPattern = (testPattern: TestPatternType) => {
    const source: SourceConfig = {
      type: 'testpattern',
      testPattern,
    };
    if (activeSurface) onApplySource(source);
    else onAddSurfaceWithSource(source);
    setJustAppliedKey(testPattern);
    setTimeout(() => setJustAppliedKey(null), 1200);
  };

  const handleApplyText = () => {
    const source: SourceConfig = {
      type: 'text',
      text: {
        content: customText,
        fontFamily: 'JetBrains Mono',
        fontSize: 48,
        textColor: '#ffffff',
        glowColor: '#00f0ff',
        glowIntensity: 20,
        animation: textAnim,
        countdownMinutes: 5,
      },
    };
    if (activeSurface) onApplySource(source);
    else onAddSurfaceWithSource(source);
  };

  return (
    <div className="w-80 bg-studio-900 border-r border-studio-750 flex flex-col h-full select-none text-xs">
      {/* Media Bin Header with beginner guidance */}
      <div className="p-3 border-b border-studio-750 flex items-center justify-between bg-studio-850">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-accent-cyan" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Media Generator Bin</span>
        </div>
        {activeSurface ? (
          <span className="text-[10px] bg-accent-cyan/15 text-accent-cyan font-semibold px-2 py-0.5 rounded border border-accent-cyan/30 truncate max-w-[120px]">
            Target: {activeSurface.name}
          </span>
        ) : (
          <span className="text-[10px] text-studio-400 font-medium">Click to create</span>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 p-1 bg-studio-950 border-b border-studio-800 gap-0.5">
        <button
          onClick={() => setActiveTab('shaders')}
          className={`py-1.5 flex flex-col items-center justify-center rounded transition-all ${
            activeTab === 'shaders'
              ? 'bg-studio-800 text-accent-cyan font-semibold shadow'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Generative Animated Visuals"
        >
          <Sparkles className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Gen FX</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`py-1.5 flex flex-col items-center justify-center rounded transition-all ${
            activeTab === 'live'
              ? 'bg-studio-800 text-accent-neon font-semibold shadow'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Live Video: Webcam & Screen Capture"
        >
          <Camera className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Live Feeds</span>
        </button>

        <button
          onClick={() => setActiveTab('testpatterns')}
          className={`py-1.5 flex flex-col items-center justify-center rounded transition-all ${
            activeTab === 'testpatterns'
              ? 'bg-studio-800 text-accent-orange font-semibold shadow'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Calibration Alignment Test Cards"
        >
          <Grid className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Test Cards</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`py-1.5 flex flex-col items-center justify-center rounded transition-all ${
            activeTab === 'text'
              ? 'bg-studio-800 text-accent-purple font-semibold shadow'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Live Titles, Clock & Countdown"
        >
          <Type className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Text FX</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`py-1.5 flex flex-col items-center justify-center rounded transition-all ${
            activeTab === 'files'
              ? 'bg-studio-800 text-accent-pink font-semibold shadow'
              : 'text-studio-400 hover:text-slate-200'
          }`}
          title="Upload Video or Image files"
        >
          <Upload className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px]">Upload</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* SHADERS TAB */}
        {activeTab === 'shaders' && (
          <div className="space-y-2.5">
            <div className="text-[10px] uppercase font-bold text-studio-400 tracking-wider flex items-center justify-between">
              <span>Real-Time Animations (60 FPS)</span>
              <span className="text-accent-cyan font-mono">1-Click Apply</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(proceduralGenerators).map(([key, gen]) => {
                const presetKey = key as ShaderPreset;
                const isJustApplied = justAppliedKey === presetKey;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectShader(presetKey)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all group ${
                      isJustApplied
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-studio-850 hover:bg-studio-800 border-studio-750 hover:border-accent-cyan/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-studio-950 border border-studio-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {isJustApplied ? (
                          <Check className="w-5 h-5 text-emerald-400 animate-bounce" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-accent-cyan" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 group-hover:text-accent-cyan transition-colors">
                          {gen.name}
                        </div>
                        <div className="text-[10px] text-studio-400">Audio Reactive • GPU Accelerated</div>
                      </div>
                    </div>

                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-studio-800 group-hover:bg-accent-cyan group-hover:text-studio-950 font-semibold transition-all">
                      Apply
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LIVE FEEDS TAB */}
        {activeTab === 'live' && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold text-studio-400 tracking-wider">
              Live Video Feeds
            </div>

            <div className="p-3.5 bg-studio-850 rounded-xl border border-studio-750 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-accent-cyan" />
                  <span className="font-bold text-slate-200">Webcam / USB Capture</span>
                </div>
                {cameraActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-studio-400">
                Stream your webcam or external HDMI capture card directly onto mapped surfaces.
              </p>
              <button
                onClick={handleStartCamera}
                className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  cameraActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-studio-800 hover:bg-studio-750 text-slate-200 border border-studio-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{cameraActive ? 'Camera Live' : 'Start Camera'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-studio-850 rounded-xl border border-studio-750 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-accent-neon" />
                  <span className="font-bold text-slate-200">Screen / App Capture</span>
                </div>
                {screenActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-studio-400">
                Capture any window, browser tab, or DJ visualizer software in real time.
              </p>
              <button
                onClick={handleStartScreen}
                className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  screenActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-studio-800 hover:bg-studio-750 text-slate-200 border border-studio-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>{screenActive ? 'Screen Stream Live' : 'Select Window'}</span>
              </button>
            </div>

            {/* Network / WebRTC IP Stream */}
            <div className="p-3.5 bg-studio-850 rounded-xl border border-studio-750 space-y-2">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-accent-pink" />
                <span className="font-bold text-slate-200">Network / IP Live Stream</span>
              </div>
              <p className="text-[11px] text-studio-400">
                Connect remote WebRTC, HTTP, or HLS network video streams from OBS, cameras, or phones.
              </p>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="https://... stream URL"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full bg-studio-900 border border-studio-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none focus:border-accent-pink"
                />
                <button
                  onClick={() => {
                    if (!streamUrl.trim()) return;
                    const source: SourceConfig = { type: 'stream', streamUrl: streamUrl.trim() };
                    if (activeSurface) onApplySource(source);
                    else onAddSurfaceWithSource(source);
                    setJustAppliedKey('stream');
                    setTimeout(() => setJustAppliedKey(null), 1500);
                  }}
                  className="w-full py-1.5 rounded-lg font-bold text-xs bg-studio-800 hover:bg-studio-750 text-accent-pink border border-studio-700 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{justAppliedKey === 'stream' ? '✓ Stream Applied!' : 'Connect Network Stream'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEST PATTERNS TAB */}
        {activeTab === 'testpatterns' && (
          <div className="space-y-2.5">
            <div className="text-[10px] uppercase font-bold text-studio-400 tracking-wider">
              Projector Calibration Patterns
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'white_mesh', name: 'White Mapping Mesh', desc: 'High-contrast area calibration' },
                  { id: 'smpte', name: 'SMPTE Bars', desc: 'Color accuracy & PLUGE' },
                  { id: 'grid', name: 'Alignment Grid', desc: 'Geometry & keystone' },
                  { id: 'circles', name: 'Concentric Rings', desc: 'Aspect & focus' },
                  { id: 'checkerboard', name: 'Checkerboard', desc: 'Sharpness test' },
                  { id: 'gradient', name: 'Grayscale Steps', desc: 'Gamma & contrast' },
                  { id: 'alignment', name: 'Resolution Card', desc: 'Corner pixel numbers' },
                ] as const
              ).map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => handleSelectTestPattern(pattern.id)}
                  className="p-2.5 bg-studio-850 hover:bg-studio-800 border border-studio-750 hover:border-accent-orange/60 rounded-xl text-left transition-all group flex flex-col justify-between h-20"
                >
                  <div className="font-bold text-slate-200 group-hover:text-accent-orange transition-colors">
                    {pattern.name}
                  </div>
                  <div className="text-[10px] text-studio-400 leading-tight">
                    {pattern.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold text-studio-400 tracking-wider">
              Titles & Dynamic Clock
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-studio-400 block mb-1">Text Message</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-studio-850 border border-studio-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-accent-cyan font-medium"
                  placeholder="Enter text..."
                />
              </div>

              <div>
                <label className="text-[11px] text-studio-400 block mb-1">Animation Style</label>
                <select
                  value={textAnim}
                  onChange={(e) => setTextAnim(e.target.value as any)}
                  className="w-full bg-studio-850 border border-studio-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-accent-cyan"
                >
                  <option value="pulse">Neon Glow Pulse</option>
                  <option value="marquee">Scrolling Marquee</option>
                  <option value="clock">Live Real-Time Clock</option>
                  <option value="countdown">Stage 5-Min Countdown</option>
                </select>
              </div>

              <button
                onClick={handleApplyText}
                className="w-full py-2 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/40 text-accent-purple font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5"
              >
                <Type className="w-4 h-4" />
                <span>Apply Text Banner</span>
              </button>
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold text-studio-400 tracking-wider">
              Upload Video or Image
            </div>

            <label className="border-2 border-dashed border-studio-700 hover:border-accent-cyan/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-studio-850/50 hover:bg-studio-850 transition-all group">
              <Upload className="w-7 h-7 text-studio-400 group-hover:text-accent-cyan mb-2 transition-colors" />
              <span className="font-bold text-slate-200 text-xs">Drop media or click to browse</span>
              <span className="text-[10px] text-studio-400 mt-1">MP4, WebM, PNG, JPG, SVG</span>
              <input
                type="file"
                onChange={handleFileUpload}
                accept="video/*,image/*"
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
