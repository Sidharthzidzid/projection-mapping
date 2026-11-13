import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Sparkles, Check, AlertCircle, Code, Copy, RefreshCw } from 'lucide-react';
import { Surface } from '../types';
import { glslRenderer, GLSL_STARTER_PRESETS } from '../services/glslRenderer';
import { audioEngine } from '../services/audioEngine';

interface ShaderEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSurface: Surface | null;
  onUpdateSurface: (updated: Surface) => void;
}

export const ShaderEditorModal: React.FC<ShaderEditorModalProps> = ({
  isOpen,
  onClose,
  activeSurface,
  onUpdateSurface,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cyber_tunnel');
  const [code, setCode] = useState<string>(GLSL_STARTER_PRESETS[0].code);
  const [compileStatus, setCompileStatus] = useState<{ success: boolean; error?: string }>({ success: true });
  const [copied, setCopied] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);
  
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Initialize with active surface shader if present
  useEffect(() => {
    if (activeSurface?.source?.customShader?.code) {
      setCode(activeSurface.source.customShader.code);
    } else {
      setCode(GLSL_STARTER_PRESETS[0].code);
    }
  }, [activeSurface?.id, isOpen]);

  // Live compile test
  useEffect(() => {
    const res = glslRenderer.compile(code);
    setCompileStatus(res);
  }, [code]);

  // Live 60 FPS preview render loop
  useEffect(() => {
    if (!isOpen) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsedSec = (now - startTime) * 0.001;
      const bands = audioEngine.getBands();
      
      const glCanvas = glslRenderer.render(480, 270, elapsedSec, bands, code);
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas && glCanvas) {
        const pCtx = previewCanvas.getContext('2d');
        if (pCtx) {
          pCtx.drawImage(glCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, code]);

  if (!isOpen) return null;

  const handleApplyToSurface = () => {
    if (!activeSurface) return;

    onUpdateSurface({
      ...activeSurface,
      source: {
        type: 'custom_shader',
        customShader: {
          code,
          name: GLSL_STARTER_PRESETS.find(p => p.id === selectedPresetId)?.name || 'Custom Fragment Shader',
          compileStatus: compileStatus.success ? 'ok' : 'error',
          errorMessage: compileStatus.error,
        },
      },
    });

    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = GLSL_STARTER_PRESETS.find(item => item.id === presetId);
    if (p) setCode(p.code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 px-5 border-b border-studio-750 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 text-accent-purple flex items-center justify-center border border-accent-purple/30">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-sm">Live GLSL Fragment Shader Studio</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                  WebGL 60FPS
                </span>
              </div>
              <p className="text-[11px] text-studio-400">
                Code real-time fragment shaders or paste Shadertoy GLSL code directly onto projection surfaces
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border ${
              compileStatus.success
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {compileStatus.success ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compiled OK</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Compile Error</span>
                </>
              )}
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyToSurface}
              disabled={!activeSurface || !compileStatus.success}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all ${
                applied
                  ? 'bg-emerald-500 text-white'
                  : activeSurface && compileStatus.success
                  ? 'bg-accent-cyan hover:bg-cyan-400 text-black'
                  : 'bg-studio-800 text-studio-500 cursor-not-allowed border border-studio-700'
              }`}
            >
              {applied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{applied ? 'Applied to Surface!' : activeSurface ? `Apply to "${activeSurface.name}"` : 'Select a surface first'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-studio-400 hover:text-slate-100 rounded-lg hover:bg-studio-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Selector Bar */}
        <div className="h-10 px-5 bg-studio-950 border-b border-studio-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-studio-400 font-bold uppercase tracking-wider text-[10px]">Starter Templates:</span>
            <div className="flex items-center space-x-1.5">
              {GLSL_STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    selectedPresetId === preset.id
                      ? 'bg-studio-700 text-slate-100 border border-studio-600'
                      : 'text-studio-400 hover:text-slate-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="px-2 py-0.5 rounded bg-studio-800 hover:bg-studio-750 text-studio-300 hover:text-white flex items-center space-x-1 text-[11px]"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Main Body: Code Editor (Left) & Preview + Docs (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 border-r border-studio-800 flex flex-col bg-[#0b0e14] relative font-mono">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full flex-1 p-4 bg-transparent text-emerald-300 text-xs font-mono leading-relaxed resize-none outline-none custom-scrollbar select-text selection:bg-cyan-500/30"
              style={{ tabSize: 2 }}
            />

            {/* Error Console Banner at bottom */}
            {!compileStatus.success && (
              <div className="p-3 bg-rose-950/90 border-t border-rose-800/80 text-rose-200 text-xs font-mono flex items-start space-x-2 overflow-x-auto max-h-28">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="whitespace-pre-wrap">{compileStatus.error}</div>
              </div>
            )}
          </div>

          {/* Right Panel: Live Preview & Uniforms Documentation */}
          <div className="w-80 bg-studio-900 flex flex-col overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Live WebGL Preview Canvas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Live WebGL Preview</span>
                <span className="text-[10px] text-accent-cyan font-mono">480 × 270</span>
              </div>
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-studio-750 bg-black shadow-inner flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  width={480}
                  height={270}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Uniforms Quick Reference */}
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-2">
              <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Available GLSL Uniforms
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between p-1 bg-studio-900 rounded border border-studio-800">
                  <span className="text-accent-cyan">u_time</span>
                  <span className="text-studio-400">float (seconds)</span>
                </div>
                <div className="flex justify-between p-1 bg-studio-900 rounded border border-studio-800">
                  <span className="text-accent-pink">u_resolution</span>
                  <span className="text-studio-400">vec2 (width, height)</span>
                </div>
                <div className="flex justify-between p-1 bg-studio-900 rounded border border-studio-800">
                  <span className="text-accent-neon">u_audio</span>
                  <span className="text-studio-400">float (0.0 to 1.0)</span>
                </div>
                <div className="flex justify-between p-1 bg-studio-900 rounded border border-studio-800">
                  <span className="text-amber-400">u_bands</span>
                  <span className="text-studio-400">vec4 (sub, bass, mid, hi)</span>
                </div>
              </div>
            </div>

            {/* Shadertoy Compatibility Tip */}
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-1 text-xs">
              <div className="font-bold text-slate-200">✨ Shadertoy Compatible</div>
              <p className="text-[11px] text-studio-400 leading-relaxed">
                Paste any fragment shader with <code className="text-accent-cyan bg-studio-900 px-1 py-0.5 rounded">mainImage(fragColor, fragCoord)</code> and it runs out-of-the-box!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

