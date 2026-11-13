import React, { useEffect, useRef, useState } from 'react';
import { ProjectData, Surface, AudioBands } from '../types';
import { drawSurface } from '../services/surfaceRenderer';
import { syncService, SyncMessage } from '../services/broadcastSync';
import { audioEngine } from '../services/audioEngine';
import { renderTestPattern } from '../services/testPatterns';
import { createDefaultProject } from '../services/presetProjects';
import { Maximize2, Power, Grid, Sparkles } from 'lucide-react';

export const ProjectorOutput: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [project, setProject] = useState<ProjectData>(createDefaultProject());
  const [blackout, setBlackout] = useState<boolean>(false);
  const [dimmer, setDimmer] = useState<number>(1.0);
  const [testPattern, setTestPattern] = useState<string | null>(null);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [cursorHidden, setCursorHidden] = useState<boolean>(false);
  const cursorTimerRef = useRef<number | null>(null);

  // Load project from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lumina_project_autosave');
      if (saved) {
        setProject(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    // Subscribe to broadcast sync events from operator stage
    const unsubscribe = syncService.subscribe((msg: SyncMessage) => {
      switch (msg.type) {
        case 'SYNC_FULL':
          setProject(msg.project);
          setBlackout(msg.project.masterBlackout);
          setDimmer(msg.project.masterDimmer);
          break;
        case 'SYNC_SURFACES':
          setProject(p => ({
            ...p,
            scenes: p.scenes.map(s => s.id === msg.activeSceneId ? { ...s, surfaces: msg.surfaces } : s),
          }));
          break;
        case 'SYNC_BLACKOUT':
          setBlackout(msg.blackout);
          break;
        case 'SYNC_DIMMER':
          setDimmer(msg.dimmer);
          break;
        case 'SYNC_TEST_PATTERN':
          setTestPattern(msg.pattern);
          break;
      }
    });

    // Notify operator stage that projector output window is connected
    syncService.send({ type: 'PROJECTOR_READY' });

    // Hide HUD after 4 seconds
    const hudTimer = window.setTimeout(() => {
      setShowHUD(false);
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(hudTimer);
    };
  }, []);

  // Mouse activity cursor auto-hide
  const handleMouseMove = () => {
    setCursorHidden(false);
    if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    cursorTimerRef.current = window.setTimeout(() => {
      setCursorHidden(true);
    }, 2000);
  };

  // Keyboard Shortcuts in Projector Window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'b' || e.key === 'B') {
        setBlackout(b => !b);
      } else if (e.key === 't' || e.key === 'T') {
        setTestPattern(p => (p === 'white_mesh' ? null : 'white_mesh'));
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHUD(h => !h);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 60 FPS Render Loop
  useEffect(() => {
    let animationFrameId: number;
    audioEngine.init();

    const render = (time: number) => {
      const audioBands = audioEngine.update(time);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (!blackout) {
            // Find surfaces for active scene
            const activeScene = project.scenes.find(s => s.id === project.activeSceneId) || project.scenes[0];
            if (activeScene && activeScene.surfaces) {
              for (const surf of activeScene.surfaces) {
                drawSurface(ctx, surf, time, audioBands, dimmer, blackout);
              }
            }

            // Draw calibration test pattern overlay if active
            if (testPattern) {
              renderTestPattern(ctx, canvas.width, canvas.height, testPattern as any);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [project, blackout, dimmer, testPattern]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen bg-black overflow-hidden select-none ${
        cursorHidden ? 'cursor-none' : 'cursor-default'
      }`}
    >
      <canvas
        ref={canvasRef}
        width={project.canvasWidth || 1920}
        height={project.canvasHeight || 1080}
        className="w-full h-full object-contain block bg-black"
        onDoubleClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }}
      />

      {/* Floating HUD overlay on startup or toggled with 'H' */}
      {showHUD && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-studio-900/90 border border-studio-700 backdrop-blur-xl px-5 py-3 rounded-xl shadow-2xl text-slate-100 flex items-center space-x-6 text-xs transition-opacity duration-500 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-accent-cyan tracking-wider">PROJECTOR OUTPUT LIVE</span>
          </div>
          <div className="h-4 w-px bg-studio-700" />
          <div className="flex items-center space-x-4 text-studio-300 font-mono text-[11px]">
            <span>Double-Click or <strong className="text-white">F</strong>: Fullscreen</span>
            <span><strong className="text-white">B</strong>: Blackout</span>
            <span><strong className="text-white">T</strong>: Test Grid</span>
            <span><strong className="text-white">H</strong>: Hide HUD</span>
          </div>
          <button
            onClick={() => setShowHUD(false)}
            className="text-[10px] bg-studio-800 hover:bg-studio-750 px-2 py-0.5 rounded text-studio-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

