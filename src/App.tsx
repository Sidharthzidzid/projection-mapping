import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectData, Surface, SurfaceType, SourceConfig, PostFXConfig } from './types';
import { createDefaultProject } from './services/presetProjects';
import { createInitialMeshGrid } from './services/homography';
import { syncService } from './services/broadcastSync';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { MediaBin } from './components/MediaBin';
import { Inspector } from './components/Inspector';
import { CanvasStage } from './components/CanvasStage';
import { SceneBar } from './components/SceneBar';
import { ProjectorOutput } from './components/ProjectorOutput';
import { MidiModal } from './components/MidiModal';
import { HelpModal } from './components/HelpModal';
import { PostFxModal } from './components/PostFxModal';
import { ShaderEditorModal } from './components/ShaderEditorModal';
import { TimelineModal } from './components/TimelineModal';
import { AutoAlignModal } from './components/AutoAlignModal';
import { gamepadService } from './services/gamepadService';

export const App: React.FC = () => {
  // Check if opened as dedicated projector output window
  const isProjectorOutputWindow = typeof window !== 'undefined' && (
    window.location.search.includes('output=true') || window.location.hash.includes('output')
  );

  if (isProjectorOutputWindow) {
    return <ProjectorOutput />;
  }

  // OPERATOR STUDIO SUITE STATE
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const saved = localStorage.getItem('lumina_project_autosave');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return createDefaultProject();
  });

  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(() => {
    return project.scenes[0]?.surfaces[0]?.id || null;
  });

  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split' | '3d_stage'>('editor');
  const [isUsingMic, setIsUsingMic] = useState<boolean>(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isPostFxModalOpen, setIsPostFxModalOpen] = useState<boolean>(false);
  const [isShaderModalOpen, setIsShaderModalOpen] = useState<boolean>(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState<boolean>(false);
  const [isAutoAlignModalOpen, setIsAutoAlignModalOpen] = useState<boolean>(false);
  const [gamepadConnected, setGamepadConnected] = useState<boolean>(false);

  // Video Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Undo / Redo History Stacks
  const historyRef = useRef<ProjectData[]>([]);
  const futureRef = useRef<ProjectData[]>([]);
  const isUndoingOrRedoing = useRef<boolean>(false);

  const pushHistory = useCallback((newProject: ProjectData) => {
    if (isUndoingOrRedoing.current) return;
    historyRef.current = [...historyRef.current.slice(-25), project];
    futureRef.current = [];
  }, [project]);

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const previous = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [project, ...futureRef.current];
    isUndoingOrRedoing.current = true;
    setProject(previous);
    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  };

  const handleRedo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current, project];
    isUndoingOrRedoing.current = true;
    setProject(next);
    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setProject(p => ({ ...p, masterBlackout: !p.masterBlackout }));
      } else if (e.key >= '1' && e.key <= '9') {
        const sceneIndex = parseInt(e.key) - 1;
        if (project.scenes[sceneIndex]) {
          setProject(p => ({ ...p, activeSceneId: project.scenes[sceneIndex].id }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Gamepad Hardware Controller Subscription
  useEffect(() => {
    const unsub = gamepadService.subscribe((action) => {
      setGamepadConnected(gamepadService.getStatus().isConnected);

      // Analog Nudge Active Surface with stick
      if (Math.abs(action.nudgeX) > 0 || Math.abs(action.nudgeY) > 0) {
        const dx = action.nudgeX * 4;
        const dy = action.nudgeY * 4;
        setProject((p) => {
          const scene = p.scenes.find((s) => s.id === p.activeSceneId);
          if (!scene) return p;
          return {
            ...p,
            scenes: p.scenes.map((s) =>
              s.id === p.activeSceneId
                ? {
                    ...s,
                    surfaces: s.surfaces.map((surf) =>
                      surf.id === activeSurfaceId
                        ? {
                            ...surf,
                            points: surf.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
                          }
                        : surf
                    ),
                  }
                : s
            ),
          };
        });
      }

      // Right Trigger Dimmer control
      if (action.triggerDimmer !== undefined) {
        setProject((p) => ({ ...p, masterDimmer: action.triggerDimmer! }));
      }

      // Buttons A, B, X, Y -> Scene Cues 1, 2, 3, 4
      if (action.cueIndex !== undefined) {
        setProject((p) => {
          const targetScene = p.scenes[action.cueIndex!];
          if (targetScene) return { ...p, activeSceneId: targetScene.id };
          return p;
        });
      }

      // Start button -> Master Blackout
      if (action.toggleBlackout) {
        setProject((p) => ({ ...p, masterBlackout: !p.masterBlackout }));
      }

      // Bumpers LB / RB -> Cycle Active Surface
      if (action.cycleSurface) {
        setProject((p) => {
          const scene = p.scenes.find((s) => s.id === p.activeSceneId);
          if (!scene || scene.surfaces.length === 0) return p;
          const currentIdx = scene.surfaces.findIndex((s) => s.id === activeSurfaceId);
          const nextIdx =
            action.cycleSurface === 'next'
              ? (currentIdx + 1) % scene.surfaces.length
              : (currentIdx - 1 + scene.surfaces.length) % scene.surfaces.length;
          setActiveSurfaceId(scene.surfaces[nextIdx].id);
          return p;
        });
      }
    });

    return () => unsub();
  }, [activeSurfaceId]);

  // Auto-save to localStorage & Broadcast to Projector Window
  useEffect(() => {
    try {
      localStorage.setItem('lumina_project_autosave', JSON.stringify(project));
      syncService.send({ type: 'SYNC_FULL', project });
    } catch {
      // ignore
    }
  }, [project]);

  useEffect(() => {
    audioEngine.init();
  }, []);

  const handleToggleMic = async () => {
    if (isUsingMic) {
      audioEngine.disableMicrophone();
      setIsUsingMic(false);
    } else {
      const success = await audioEngine.enableMicrophone();
      setIsUsingMic(success);
    }
  };

  // Launch Detached Projector Output Window
  const handleLaunchProjector = () => {
    const url = `${window.location.origin}${window.location.pathname}?output=true`;
    const projWindow = window.open(
      url,
      'LuminaProjectorOutput',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
    if (projWindow) {
      projWindow.focus();
    } else {
      alert('Pop-up window blocked! Please allow pop-ups for this site to launch the Projector Output Window.');
    }
  };

  // 4K Snapshot Tool
  const handleTakeSnapshot = () => {
    if (!stageCanvasRef.current) return;
    const canvas = stageCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `lumina_projection_snapshot_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Live Video Recording Tool
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    } else {
      // Start recording
      if (!stageCanvasRef.current) return;
      const canvas = stageCanvasRef.current;
      const stream = canvas.captureStream(60);
      recordedChunksRef.current = [];

      try {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `lumina_projection_show_${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        };

        recorder.start(500); // 500ms chunk timeslice
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingSeconds(0);

        recordTimerRef.current = window.setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      } catch (err) {
        alert('MediaRecorder not supported or failed to initialize on this browser.');
      }
    }
  };

  // Active Scene & Surfaces
  const activeScene = project.scenes.find(s => s.id === project.activeSceneId) || project.scenes[0];
  const surfaces = activeScene ? activeScene.surfaces : [];
  const activeSurface = surfaces.find(s => s.id === activeSurfaceId) || null;

  // Surface Actions
  const handleUpdateSurface = (updated: Surface) => {
    pushHistory(project);
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => {
        if (s.id !== p.activeSceneId) return s;
        return {
          ...s,
          surfaces: s.surfaces.map(surf => surf.id === updated.id ? updated : surf),
        };
      }),
    }));
  };

  const handleAddSurface = (type: SurfaceType) => {
    pushHistory(project);
    const newId = `surf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cx = 960;
    const cy = 540;
    const w = 480;
    const h = 320;

    const points = [
      { x: cx - w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];

    let meshGrid = undefined;
    if (type === 'mesh') {
      meshGrid = createInitialMeshGrid({ x: cx - w / 2, y: cy - h / 2, width: w, height: h }, 3, 3);
    }

    const newSurface: Surface = {
      id: newId,
      name: `${type.toUpperCase()} Surface ${surfaces.length + 1}`,
      type,
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'source-over',
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
      points,
      meshGrid,
      polygonPoints: type === 'polygon' ? points : undefined,
      circleParams: type === 'circle' ? { cx, cy, rx: 180, ry: 180, rotation: 0 } : undefined,
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    };

    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => s.id === p.activeSceneId ? { ...s, surfaces: [...s.surfaces, newSurface] } : s),
    }));
    setActiveSurfaceId(newId);
  };

  const handleDeleteSurface = (id: string) => {
    pushHistory(project);
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => {
        if (s.id !== p.activeSceneId) return s;
        return {
          ...s,
          surfaces: s.surfaces.filter(surf => surf.id !== id),
        };
      }),
    }));
    if (activeSurfaceId === id) {
      const remaining = surfaces.filter(s => s.id !== id);
      setActiveSurfaceId(remaining[0]?.id || null);
    }
  };

  const handleDuplicateSurface = (id: string) => {
    const target = surfaces.find(s => s.id === id);
    if (!target) return;
    pushHistory(project);

    const dupId = `surf_${Date.now()}`;
    const offset = 30;
    const duplicated: Surface = {
      ...JSON.parse(JSON.stringify(target)),
      id: dupId,
      name: `${target.name} (Copy)`,
      points: target.points.map(p => ({ x: p.x + offset, y: p.y + offset })),
    };

    if (duplicated.meshGrid) {
      duplicated.meshGrid.points = duplicated.meshGrid.points.map(row =>
        row.map(p => ({ x: p.x + offset, y: p.y + offset }))
      );
    }

    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => s.id === p.activeSceneId ? { ...s, surfaces: [...s.surfaces, duplicated] } : s),
    }));
    setActiveSurfaceId(dupId);
  };

  const handleApplySource = (source: SourceConfig) => {
    if (!activeSurface) return;
    handleUpdateSurface({
      ...activeSurface,
      source,
    });
  };

  const handleAddSurfaceWithSource = (source: SourceConfig) => {
    handleAddSurface('quad');
    setTimeout(() => {
      setProject(p => {
        const scene = p.scenes.find(s => s.id === p.activeSceneId);
        if (!scene || scene.surfaces.length === 0) return p;
        const lastSurf = scene.surfaces[scene.surfaces.length - 1];
        lastSurf.source = source;
        return { ...p };
      });
    }, 50);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-studio-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header
        project={project}
        setProject={setProject}
        isUsingMic={isUsingMic}
        onToggleMic={handleToggleMic}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenPostFxModal={() => setIsPostFxModalOpen(true)}
        onLaunchProjector={handleLaunchProjector}
        viewMode={viewMode}
        setViewMode={setViewMode}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTakeSnapshot={handleTakeSnapshot}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        onToggleRecording={handleToggleRecording}
        onOpenShaderModal={() => setIsShaderModalOpen(true)}
        onOpenTimelineModal={() => setIsTimelineModalOpen(true)}
        onOpenAutoAlignModal={() => setIsAutoAlignModalOpen(true)}
        gamepadConnected={gamepadConnected}
      />

      {/* Main Workspace (Media Bin + Canvas Stage + Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Media Generator Bin */}
        <MediaBin
          activeSurface={activeSurface}
          onApplySource={handleApplySource}
          onAddSurfaceWithSource={handleAddSurfaceWithSource}
        />

        {/* Center: Interactive Canvas Stage / 3D Virtual Stage */}
        <CanvasStage
          surfaces={surfaces}
          activeSurfaceId={activeSurfaceId}
          onSelectSurface={setActiveSurfaceId}
          onUpdateSurface={handleUpdateSurface}
          masterDimmer={project.masterDimmer}
          masterBlackout={project.masterBlackout}
          viewMode={viewMode}
          canvasWidth={project.canvasWidth}
          canvasHeight={project.canvasHeight}
          postFX={project.postFX}
          ledStrips={project.ledStrips}
          onCanvasReady={(c) => {
            stageCanvasRef.current = c;
          }}
        />

        {/* Right: Surface Layers & Warping Inspector */}
        <Inspector
          surfaces={surfaces}
          activeSurfaceId={activeSurfaceId}
          onSelectSurface={setActiveSurfaceId}
          onAddSurface={handleAddSurface}
          onDeleteSurface={handleDeleteSurface}
          onDuplicateSurface={handleDuplicateSurface}
          onUpdateSurface={handleUpdateSurface}
        />
      </div>

      {/* Bottom: Scenes, Cues, Master Dimmer & Blackout Strip */}
      <SceneBar
        project={project}
        setProject={setProject}
        activeSceneId={project.activeSceneId}
        onSelectScene={(id) => setProject(p => ({ ...p, activeSceneId: id }))}
        masterDimmer={project.masterDimmer}
        setMasterDimmer={(val) => setProject(p => ({ ...p, masterDimmer: val }))}
        masterBlackout={project.masterBlackout}
        setMasterBlackout={(val) => setProject(p => ({ ...p, masterBlackout: val }))}
      />

      {/* Post-Processing Video FX & XY Touchpad Modal */}
      <PostFxModal
        isOpen={isPostFxModalOpen}
        onClose={() => setIsPostFxModalOpen(false)}
        fx={project.postFX || {
          rgbSplit: 0,
          strobe: false,
          strobeSpeed: 4,
          kaleidoscope: 1,
          neonEdges: false,
          scanlines: false,
          invert: false,
        }}
        onUpdateFx={(updated) => setProject(p => ({ ...p, postFX: updated }))}
      />

      {/* Hardware MIDI & Virtual Controller Modal */}
      <MidiModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        masterDimmer={project.masterDimmer}
        setMasterDimmer={(val) => setProject(p => ({ ...p, masterDimmer: val }))}
        masterBlackout={project.masterBlackout}
        setMasterBlackout={(val) => setProject(p => ({ ...p, masterBlackout: val }))}
        onTriggerScene={(idx) => {
          if (project.scenes[idx]) {
            setProject(p => ({ ...p, activeSceneId: project.scenes[idx].id }));
          }
        }}
      />

      {/* Help & Operator Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Live GLSL Fragment Shader Studio Modal */}
      <ShaderEditorModal
        isOpen={isShaderModalOpen}
        onClose={() => setIsShaderModalOpen(false)}
        activeSurface={activeSurface}
        onUpdateSurface={handleUpdateSurface}
      />

      {/* Automated Show Timeline & Keyframe Sequencer Modal */}
      <TimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        project={project}
        setProject={setProject}
      />

      {/* Computer Vision Camera Auto-Alignment Modal */}
      <AutoAlignModal
        isOpen={isAutoAlignModalOpen}
        onClose={() => setIsAutoAlignModalOpen(false)}
        activeSurface={activeSurface}
        onUpdateSurface={handleUpdateSurface}
        canvasWidth={project.canvasWidth}
        canvasHeight={project.canvasHeight}
      />
    </div>
  );
};
