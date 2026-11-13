import React, { useState, useEffect, useRef } from 'react';
import { 
  ProjectData, 
  Scene, 
  AudioBands 
} from '../types';
import { audioEngine } from '../services/audioEngine';
import { 
  Plus, 
  Trash2, 
  Power
} from 'lucide-react';

interface SceneBarProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  masterDimmer: number;
  setMasterDimmer: (val: number) => void;
  masterBlackout: boolean;
  setMasterBlackout: (val: boolean) => void;
}

export const SceneBar: React.FC<SceneBarProps> = ({
  project,
  setProject,
  activeSceneId,
  onSelectScene,
  masterDimmer,
  setMasterDimmer,
  masterBlackout,
  setMasterBlackout,
}) => {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const vuCanvasRef = useRef<HTMLCanvasElement>(null);

  // Lightweight 30 FPS VU meter render loop directly on a canvas (zero React state overhead!)
  useEffect(() => {
    let animId: number;
    const canvas = vuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastDraw = 0;

    const drawVU = (time: number) => {
      // Limit to 30 FPS for battery & CPU efficiency
      if (time - lastDraw >= 32) {
        lastDraw = time;
        const bands = audioEngine.bands;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 4 frequency bars: Sub-Bass, Bass, Mid, High
        const barW = 5;
        const gap = 3;
        const h = canvas.height - 4;

        // Sub-Bass (Purple)
        ctx.fillStyle = '#b026ff';
        const h0 = Math.max(2, bands.subBass * h);
        ctx.fillRect(0, canvas.height - h0, barW, h0);

        // Bass (Cyan)
        ctx.fillStyle = '#00f0ff';
        const h1 = Math.max(2, bands.bass * h);
        ctx.fillRect(barW + gap, canvas.height - h1, barW, h1);

        // Mid (Neon)
        ctx.fillStyle = '#39ff14';
        const h2 = Math.max(2, bands.mid * h);
        ctx.fillRect((barW + gap) * 2, canvas.height - h2, barW, h2);

        // High (Orange)
        ctx.fillStyle = '#ffaa00';
        const h3 = Math.max(2, bands.high * h);
        ctx.fillRect((barW + gap) * 3, canvas.height - h3, barW, h3);

        // Beat pulse dot
        if (bands.beat) {
          ctx.fillStyle = '#ff007f';
          ctx.beginPath();
          ctx.arc(36, 12, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(drawVU);
    };

    animId = requestAnimationFrame(drawVU);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleAddScene = () => {
    const currentScene = project.scenes.find(s => s.id === activeSceneId) || project.scenes[0];
    const newId = `scene_${Date.now()}`;
    const newScene: Scene = {
      id: newId,
      name: `Scene ${project.scenes.length + 1}`,
      surfaces: JSON.parse(JSON.stringify(currentScene.surfaces)),
      transitionDuration: 1.5,
    };

    setProject(p => ({
      ...p,
      scenes: [...p.scenes, newScene],
      activeSceneId: newId,
    }));
  };

  const handleDeleteScene = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.scenes.length <= 1) {
      alert('Cannot delete the only scene.');
      return;
    }
    const remaining = project.scenes.filter(s => s.id !== id);
    setProject(p => ({
      ...p,
      scenes: remaining,
      activeSceneId: id === activeSceneId ? remaining[0].id : p.activeSceneId,
    }));
  };

  return (
    <div className="h-18 bg-studio-900 border-t border-studio-750 px-4 py-2 flex items-center justify-between z-30 select-none text-xs">
      {/* Scenes / Cues Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar flex-1 mr-4">
        <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-studio-400 uppercase tracking-wider mr-2">
          <span>Scenes</span>
        </div>

        {project.scenes.map((scene, idx) => {
          const isActive = scene.id === activeSceneId;
          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 cursor-pointer border transition-all min-w-[130px] group ${
                isActive
                  ? 'bg-accent-cyan/15 border-accent-cyan/60 text-slate-100 shadow-md shadow-cyan-500/10'
                  : 'bg-studio-850 hover:bg-studio-800 border-studio-700/80 text-studio-300'
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                isActive ? 'bg-accent-cyan text-studio-950' : 'bg-studio-800 text-studio-400'
              }`}>
                {idx + 1}
              </div>

              <div className="flex-1 truncate">
                {editingSceneId === scene.id ? (
                  <input
                    type="text"
                    value={scene.name}
                    autoFocus
                    onBlur={() => setEditingSceneId(null)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProject(p => ({
                        ...p,
                        scenes: p.scenes.map(s => s.id === scene.id ? { ...s, name: val } : s),
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingSceneId(null);
                    }}
                    className="bg-studio-950 text-xs text-white px-1 py-0.5 rounded outline-none border border-accent-cyan w-full"
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingSceneId(scene.id)}
                    className="font-medium text-xs truncate"
                    title="Double-click to rename"
                  >
                    {scene.name}
                  </div>
                )}
                <div className="text-[10px] text-studio-500 font-mono">
                  {scene.surfaces.length} surfaces
                </div>
              </div>

              {project.scenes.length > 1 && (
                <button
                  onClick={(e) => handleDeleteScene(scene.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-studio-500 transition-opacity p-0.5"
                  title="Delete scene"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleAddScene}
          className="p-2 rounded-lg bg-studio-850 hover:bg-studio-800 border border-studio-700 hover:border-accent-cyan/50 text-studio-300 hover:text-accent-cyan transition-all flex items-center space-x-1"
          title="Add Scene Cue (+)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium pr-1">New Cue</span>
        </button>
      </div>

      {/* Right Controls: Audio Spectrum, Master Dimmer, Master Blackout */}
      <div className="flex items-center space-x-4 pl-4 border-l border-studio-750">
        {/* Real-time Hardware Audio VU Canvas (Zero React Re-render Lag!) */}
        <div className="flex flex-col items-center space-y-0.5">
          <canvas
            ref={vuCanvasRef}
            width={44}
            height={22}
            className="w-11 h-5.5 block rounded bg-studio-950 border border-studio-800"
            title="Real-time Audio Frequency Spectrum"
          />
          <span className="text-[8px] font-mono text-studio-400">AUDIO VU</span>
        </div>

        {/* Master Dimmer Slider */}
        <div className="flex flex-col space-y-0.5 w-28">
          <div className="flex justify-between text-[10px] text-studio-400">
            <span>DIMMER</span>
            <span className="font-mono text-accent-cyan">{Math.round(masterDimmer * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterDimmer}
            onChange={(e) => setMasterDimmer(parseFloat(e.target.value))}
            className="accent-accent-cyan cursor-pointer h-1.5"
            title="Master Projector Dimmer"
          />
        </div>

        {/* Instant Blackout Toggle Button */}
        <button
          onClick={() => setMasterBlackout(!masterBlackout)}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 border transition-all shadow-md ${
            masterBlackout
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/30 animate-pulse'
              : 'bg-studio-850 hover:bg-studio-800 text-studio-300 border-studio-700'
          }`}
          title="Instant Blackout Mode (HotKey: B)"
        >
          <Power className="w-3.5 h-3.5" />
          <span>BLACKOUT</span>
        </button>
      </div>
    </div>
  );
};
