import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Grid, 
  Sliders, 
  Compass, 
  Maximize, 
  RotateCcw,
  Crosshair,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Surface, SurfaceType, BlendMode, ShaderPreset } from '../types';
import { createInitialMeshGrid } from '../services/homography';

interface InspectorProps {
  surfaces: Surface[];
  activeSurfaceId: string | null;
  onSelectSurface: (id: string) => void;
  onAddSurface: (type: SurfaceType) => void;
  onDeleteSurface: (id: string) => void;
  onDuplicateSurface: (id: string) => void;
  onUpdateSurface: (updated: Surface) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  surfaces,
  activeSurfaceId,
  onSelectSurface,
  onAddSurface,
  onDeleteSurface,
  onDuplicateSurface,
  onUpdateSurface,
}) => {
  const [isEasyMode, setIsEasyMode] = useState<boolean>(true);
  const activeSurface = surfaces.find(s => s.id === activeSurfaceId);

  const handleUpdate = <K extends keyof Surface>(key: K, value: Surface[K]) => {
    if (!activeSurface) return;
    onUpdateSurface({
      ...activeSurface,
      [key]: value,
    });
  };

  const handleUpdateColor = (key: keyof Surface['colorAdjustments'], value: any) => {
    if (!activeSurface) return;
    onUpdateSurface({
      ...activeSurface,
      colorAdjustments: {
        ...activeSurface.colorAdjustments,
        [key]: value,
      },
    });
  };

  const handleUpdateEdgeBlend = (key: keyof Surface['edgeBlend'], value: any) => {
    if (!activeSurface) return;
    onUpdateSurface({
      ...activeSurface,
      edgeBlend: {
        ...activeSurface.edgeBlend,
        [key]: value,
      },
    });
  };

  const handleUpdateShader = (key: string, value: any) => {
    if (!activeSurface || !activeSurface.source.shader) return;
    onUpdateSurface({
      ...activeSurface,
      source: {
        ...activeSurface.source,
        shader: {
          ...activeSurface.source.shader,
          [key]: value,
        },
      },
    });
  };

  const handleMeshGridResize = (rows: number, cols: number) => {
    if (!activeSurface) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const pts = activeSurface.points;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const newMesh = createInitialMeshGrid(
      { x: minX, y: minY, width: maxX - minX || 400, height: maxY - minY || 300 },
      rows,
      cols
    );
    onUpdateSurface({
      ...activeSurface,
      type: 'mesh',
      meshGrid: newMesh,
    });
  };

  const handleUpdateEdgeBowing = (edge: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    if (!activeSurface) return;
    const current = activeSurface.edgeBowing || { top: 0, right: 0, bottom: 0, left: 0 };
    onUpdateSurface({
      ...activeSurface,
      edgeBowing: {
        ...current,
        [edge]: val,
      },
    });
  };

  const handleResetShape = () => {
    if (!activeSurface) return;
    const cx = 960;
    const cy = 540;
    const w = 500;
    const h = 320;
    onUpdateSurface({
      ...activeSurface,
      points: [
        { x: cx - w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy + h / 2 },
        { x: cx - w / 2, y: cy + h / 2 },
      ],
      circleParams: activeSurface.type === 'circle' ? { cx, cy, rx: 180, ry: 180, rotation: 0 } : undefined,
    });
  };

  return (
    <div className="w-84 bg-studio-900 border-l border-studio-750 flex flex-col h-full select-none text-xs">
      {/* Mode Switcher Banner: Easy vs Pro */}
      <div className="p-2.5 bg-studio-950 border-b border-studio-800 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-studio-400 tracking-wider">Interface Mode</span>
        <button
          onClick={() => setIsEasyMode(!isEasyMode)}
          className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
            isEasyMode
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-accent-purple/20 text-accent-purple border border-accent-purple/40'
          }`}
          title="Toggle between Beginner Friendly Easy Mode and Advanced Pro Controls"
        >
          {isEasyMode ? <ToggleLeft className="w-4 h-4 text-emerald-400" /> : <ToggleRight className="w-4 h-4 text-accent-purple" />}
          <span>{isEasyMode ? 'Beginner Mode' : 'Pro Studio Mode'}</span>
        </button>
      </div>

      {/* Surfaces / Layers List Section */}
      <div className="h-56 border-b border-studio-750 flex flex-col">
        <div className="p-3 border-b border-studio-800 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Surfaces ({surfaces.length})
            </span>
          </div>

          {/* Add Surface Menu */}
          <div className="relative group">
            <button
              className="px-2.5 py-1 bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-all"
              title="Add New Surface"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Surface</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-studio-900 border border-studio-750 rounded-xl shadow-2xl py-1 z-50 hidden group-hover:block backdrop-blur-xl">
              <button
                onClick={() => onAddSurface('quad')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex items-center space-x-2"
              >
                <div className="w-3 h-3 border-2 border-accent-cyan rounded-sm" />
                <span>Quad Corner Pin (Flat)</span>
              </button>
              <button
                onClick={() => onAddSurface('mesh')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex items-center space-x-2"
              >
                <Grid className="w-3.5 h-3.5 text-accent-neon" />
                <span>Curved Mesh (Pillars)</span>
              </button>
              <button
                onClick={() => onAddSurface('polygon')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex items-center space-x-2"
              >
                <Compass className="w-3.5 h-3.5 text-accent-purple" />
                <span>Polygon Mask (Triangles)</span>
              </button>
              <button
                onClick={() => onAddSurface('circle')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-studio-800 text-slate-200 flex items-center space-x-2"
              >
                <div className="w-3 h-3 rounded-full border-2 border-accent-pink" />
                <span>Circular / Dome Mask</span>
              </button>
            </div>
          </div>
        </div>

        {/* Surface List Items */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
          {surfaces.map((surface, idx) => {
            const isSelected = surface.id === activeSurfaceId;
            return (
              <div
                key={surface.id}
                onClick={() => onSelectSurface(surface.id)}
                className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-accent-cyan/15 border border-accent-cyan/50 text-slate-100 shadow-sm'
                    : 'bg-studio-850 hover:bg-studio-800 border border-transparent text-studio-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-[10px] text-studio-500 font-mono w-4">#{idx + 1}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        surface.type === 'quad'
                          ? '#00f0ff'
                          : surface.type === 'mesh'
                          ? '#39ff14'
                          : surface.type === 'polygon'
                          ? '#b026ff'
                          : '#ff007f',
                    }}
                  />
                  <span className="font-semibold truncate text-xs">{surface.name}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSurface({ ...surface, visible: !surface.visible });
                    }}
                    className="p-1 hover:text-slate-100 text-studio-400"
                    title={surface.visible ? 'Hide surface' : 'Show surface'}
                  >
                    {surface.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-rose-400" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSurface({ ...surface, locked: !surface.locked });
                    }}
                    className="p-1 hover:text-slate-100 text-studio-400"
                    title={surface.locked ? 'Unlock surface' : 'Lock surface position'}
                  >
                    {surface.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSurface(surface.id);
                    }}
                    className="p-1 hover:text-slate-100 text-studio-400"
                    title="Duplicate surface"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSurface(surface.id);
                    }}
                    className="p-1 hover:text-rose-400 text-studio-400"
                    title="Delete surface"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Surface Properties Inspector */}
      {activeSurface ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Surface Identification */}
          <div>
            <label className="text-[10px] uppercase font-bold text-studio-400 block mb-1">Surface Label</label>
            <input
              type="text"
              value={activeSurface.name}
              onChange={(e) => handleUpdate('name', e.target.value)}
              className="w-full bg-studio-850 border border-studio-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-accent-cyan font-bold"
            />
          </div>

          {/* Quick Shape Fix Tools (Beginner Friendly!) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResetShape}
              className="py-1.5 px-2 bg-studio-850 hover:bg-studio-800 border border-studio-700 rounded-lg font-semibold text-studio-200 hover:text-accent-cyan flex items-center justify-center space-x-1.5 transition-all"
              title="Reset corners if they get tangled"
            >
              <RotateCcw className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Reset Shape</span>
            </button>
            <button
              onClick={() => {
                const cx = 960;
                const cy = 540;
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (const p of activeSurface.points) {
                  minX = Math.min(minX, p.x);
                  minY = Math.min(minY, p.y);
                  maxX = Math.max(maxX, p.x);
                  maxY = Math.max(maxY, p.y);
                }
                const dx = cx - (minX + maxX) / 2;
                const dy = cy - (minY + maxY) / 2;
                onUpdateSurface({
                  ...activeSurface,
                  points: activeSurface.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
                });
              }}
              className="py-1.5 px-2 bg-studio-850 hover:bg-studio-800 border border-studio-700 rounded-lg font-semibold text-studio-200 hover:text-accent-cyan flex items-center justify-center space-x-1.5 transition-all"
              title="Center on screen"
            >
              <Crosshair className="w-3.5 h-3.5 text-accent-neon" />
              <span>Center Stage</span>
            </button>
          </div>

          {/* Quick White Mesh Toggle for mapping calibration */}
          <button
            onClick={() => {
              const isWhiteMesh = activeSurface.source.type === 'testpattern' && activeSurface.source.testPattern === 'white_mesh';
              if (isWhiteMesh) {
                onUpdateSurface({
                  ...activeSurface,
                  source: {
                    type: 'shader',
                    shader: {
                      preset: 'cyberpunk_grid',
                      speed: 1.0,
                      scale: 1.0,
                      intensity: 1.0,
                      color1: '#00f0ff',
                      color2: '#ff007f',
                      audioReactive: true,
                    },
                  },
                });
              } else {
                onUpdateSurface({
                  ...activeSurface,
                  source: {
                    type: 'testpattern',
                    testPattern: 'white_mesh',
                  },
                });
              }
            }}
            className={`w-full py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 border transition-all ${
              activeSurface.source.type === 'testpattern' && activeSurface.source.testPattern === 'white_mesh'
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-studio-850 hover:bg-studio-800 text-white border-studio-700 hover:border-white'
            }`}
            title="Toggle high-contrast white alignment grid to map the physical area"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>
              {activeSurface.source.type === 'testpattern' && activeSurface.source.testPattern === 'white_mesh'
                ? '✓ White Mesh Active (Click to switch to Visuals)'
                : 'Project White Mesh Calibration Grid'}
            </span>
          </button>

          {/* Opacity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-studio-400">Surface Opacity</span>
              <span className="font-mono text-accent-cyan font-bold text-xs">{Math.round(activeSurface.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activeSurface.opacity}
              onChange={(e) => handleUpdate('opacity', parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          {/* Shader Speed & Colors (if shader source active) */}
          {activeSurface.source.shader && (
            <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">Animation Controls</span>
                <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between text-studio-400">
                    <span>Speed</span>
                    <span className="font-mono font-bold text-accent-cyan">{activeSurface.source.shader.speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={activeSurface.source.shader.speed}
                    onChange={(e) => handleUpdateShader('speed', parseFloat(e.target.value))}
                    className="w-full accent-accent-cyan cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-studio-400 block mb-1">Color 1</label>
                    <input
                      type="color"
                      value={activeSurface.source.shader.color1}
                      onChange={(e) => handleUpdateShader('color1', e.target.value)}
                      className="w-full h-8 rounded-lg bg-studio-800 border border-studio-700 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-studio-400 block mb-1">Color 2</label>
                    <input
                      type="color"
                      value={activeSurface.source.shader.color2}
                      onChange={(e) => handleUpdateShader('color2', e.target.value)}
                      className="w-full h-8 rounded-lg bg-studio-800 border border-studio-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED PRO MODE CONTROLS */}
          {!isEasyMode && (
            <div className="space-y-4 pt-2 border-t border-studio-800">
              {/* Geometry Type */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-studio-400">Mapping Geometry</span>
                <div className="grid grid-cols-4 gap-1 bg-studio-950 p-1 rounded-lg border border-studio-800">
                  {(['quad', 'mesh', 'polygon', 'circle'] as SurfaceType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        if (t === 'mesh' && !activeSurface.meshGrid) {
                          handleMeshGridResize(3, 3);
                        } else {
                          handleUpdate('type', t);
                        }
                      }}
                      className={`py-1 text-[10px] uppercase font-bold rounded text-center transition-all ${
                        activeSurface.type === t
                          ? 'bg-studio-800 text-accent-cyan shadow'
                          : 'text-studio-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {activeSurface.type === 'mesh' && (
                  <div className="p-2.5 bg-studio-850 rounded-lg border border-studio-750 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-studio-300 font-semibold">Mesh Grid Points</span>
                      <span className="font-mono text-accent-neon font-bold">
                        {activeSurface.meshGrid?.rows || 3} × {activeSurface.meshGrid?.cols || 3}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[2, 3, 4, 5].map((dim) => (
                        <button
                          key={dim}
                          onClick={() => handleMeshGridResize(dim, dim)}
                          className={`py-1 rounded text-[11px] font-mono border transition-all ${
                            activeSurface.meshGrid?.rows === dim
                              ? 'bg-accent-neon/20 border-accent-neon text-accent-neon font-bold'
                              : 'bg-studio-800 border-studio-700 text-studio-300 hover:bg-studio-750'
                          }`}
                        >
                          {dim}×{dim}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Blend Modes */}
              <div>
                <label className="text-[11px] text-studio-400 block mb-1">Blend Mode</label>
                <select
                  value={activeSurface.blendMode}
                  onChange={(e) => handleUpdate('blendMode', e.target.value as BlendMode)}
                  className="w-full bg-studio-850 border border-studio-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-accent-cyan"
                >
                  <option value="source-over">Normal</option>
                  <option value="screen">Screen (Light Additive)</option>
                  <option value="lighter">Add / Linear Dodge</option>
                  <option value="multiply">Multiply</option>
                  <option value="overlay">Overlay</option>
                  <option value="difference">Difference</option>
                </select>
              </div>

              {/* Edge Blending */}
              <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200">Edge Blending (Soft Edge)</span>
                  <input
                    type="checkbox"
                    checked={activeSurface.edgeBlend.enabled}
                    onChange={(e) => handleUpdateEdgeBlend('enabled', e.target.checked)}
                    className="accent-accent-cyan cursor-pointer"
                  />
                </div>

                {activeSurface.edgeBlend.enabled && (
                  <div className="space-y-2 pt-1 text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-studio-400">Left: {Math.round(activeSurface.edgeBlend.left * 100)}%</span>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.01"
                          value={activeSurface.edgeBlend.left}
                          onChange={(e) => handleUpdateEdgeBlend('left', parseFloat(e.target.value))}
                          className="w-full accent-accent-cyan"
                        />
                      </div>
                      <div>
                        <span className="text-studio-400">Right: {Math.round(activeSurface.edgeBlend.right * 100)}%</span>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.01"
                          value={activeSurface.edgeBlend.right}
                          onChange={(e) => handleUpdateEdgeBlend('right', parseFloat(e.target.value))}
                          className="w-full accent-accent-cyan"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Curved Bézier Edge Bowing (For Quads) */}
              {activeSurface.type === 'quad' && (
                <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200">Curved Bézier Edge Bowing</span>
                    <button
                      onClick={() =>
                        onUpdateSurface({
                          ...activeSurface,
                          edgeBowing: { top: 0, right: 0, bottom: 0, left: 0 },
                        })
                      }
                      className="text-[10px] text-accent-cyan hover:underline"
                    >
                      Reset Bow
                    </button>
                  </div>
                  <p className="text-[10px] text-studio-400">
                    Curve quad borders to map onto cylindrical pillars, arches, or curved facades
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <div className="flex justify-between text-studio-400">
                        <span>Top Bow</span>
                        <span className="font-mono text-accent-cyan">{activeSurface.edgeBowing?.top || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="80"
                        step="1"
                        value={activeSurface.edgeBowing?.top || 0}
                        onChange={(e) => handleUpdateEdgeBowing('top', parseInt(e.target.value))}
                        className="w-full accent-accent-cyan"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-studio-400">
                        <span>Bottom Bow</span>
                        <span className="font-mono text-accent-cyan">{activeSurface.edgeBowing?.bottom || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="80"
                        step="1"
                        value={activeSurface.edgeBowing?.bottom || 0}
                        onChange={(e) => handleUpdateEdgeBowing('bottom', parseInt(e.target.value))}
                        className="w-full accent-accent-cyan"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-studio-400">
                        <span>Left Bow</span>
                        <span className="font-mono text-accent-cyan">{activeSurface.edgeBowing?.left || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="80"
                        step="1"
                        value={activeSurface.edgeBowing?.left || 0}
                        onChange={(e) => handleUpdateEdgeBowing('left', parseInt(e.target.value))}
                        className="w-full accent-accent-cyan"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-studio-400">
                        <span>Right Bow</span>
                        <span className="font-mono text-accent-cyan">{activeSurface.edgeBowing?.right || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="80"
                        step="1"
                        value={activeSurface.edgeBowing?.right || 0}
                        onChange={(e) => handleUpdateEdgeBowing('right', parseInt(e.target.value))}
                        className="w-full accent-accent-cyan"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Soft Edge Feather & Black Level Compensation */}
              <div className="p-3 bg-studio-850 rounded-xl border border-studio-750 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-200">Edge Feather & Projector Black Level</div>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <div className="flex justify-between text-studio-400">
                      <span>Soft Edge Feather</span>
                      <span className="font-mono text-accent-pink">{activeSurface.feather || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={activeSurface.feather || 0}
                      onChange={(e) => handleUpdate('feather', parseInt(e.target.value))}
                      className="w-full accent-accent-pink"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-studio-400">
                      <span>Black Level Match (Overlap Floor)</span>
                      <span className="font-mono text-amber-400">{Math.round((activeSurface.blackLevel || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.2"
                      step="0.01"
                      value={activeSurface.blackLevel || 0}
                      onChange={(e) => handleUpdate('blackLevel', parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-studio-500">
          <Layers className="w-8 h-8 mb-2 opacity-50 text-accent-cyan" />
          <p className="text-xs font-semibold text-slate-300">No surface selected</p>
          <p className="text-[11px] text-studio-500 mt-1">Click any surface on the stage or in the list above</p>
        </div>
      )}
    </div>
  );
};
