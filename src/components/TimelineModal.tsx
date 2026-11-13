import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  Sliders, 
  Layers, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { ProjectData, ShowTimeline, TimelineTrack, Keyframe } from '../types';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30); // 30 seconds default
  const [loop, setLoop] = useState<boolean>(true);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track_dimmer');

  // Default tracks if not present in project
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'track_dimmer',
      name: 'Master Dimmer Curve',
      target: 'masterDimmer',
      color: '#00f0ff',
      keyframes: [
        { id: 'kf_0', time: 0, value: 0.0, easing: 'easeInOut' },
        { id: 'kf_1', time: 3, value: 1.0, easing: 'easeInOut' },
        { id: 'kf_2', time: 14, value: 1.0, easing: 'easeInOut' },
        { id: 'kf_3', time: 15, value: 0.2, easing: 'easeInOut' },
        { id: 'kf_4', time: 16, value: 1.0, easing: 'easeInOut' },
        { id: 'kf_5', time: 28, value: 1.0, easing: 'easeInOut' },
        { id: 'kf_6', time: 30, value: 0.0, easing: 'easeInOut' },
      ],
    },
    {
      id: 'track_scenes',
      name: 'Automated Scene Cues',
      target: 'sceneCue',
      color: '#ff007f',
      keyframes: [
        { id: 'kf_s1', time: 0, value: 0, sceneId: project.scenes[0]?.id },
        { id: 'kf_s2', time: 10, value: 1, sceneId: project.scenes[1]?.id || project.scenes[0]?.id },
        { id: 'kf_s3', time: 20, value: 2, sceneId: project.scenes[2]?.id || project.scenes[0]?.id },
      ],
    },
  ]);

  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Real-time playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loopStep = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) * 0.001;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        let next = prev + deltaSec;
        if (next >= duration) {
          if (loop) {
            next = 0;
          } else {
            setIsPlaying(false);
            return duration;
          }
        }

        // Evaluate keyframes for tracks
        // 1. Master dimmer evaluation
        const dimmerTrack = tracks.find((t) => t.target === 'masterDimmer');
        if (dimmerTrack && dimmerTrack.keyframes.length > 0) {
          const sorted = [...dimmerTrack.keyframes].sort((a, b) => a.time - b.time);
          if (next <= sorted[0].time) {
            setProject((p) => ({ ...p, masterDimmer: sorted[0].value }));
          } else if (next >= sorted[sorted.length - 1].time) {
            setProject((p) => ({ ...p, masterDimmer: sorted[sorted.length - 1].value }));
          } else {
            for (let i = 0; i < sorted.length - 1; i++) {
              if (next >= sorted[i].time && next <= sorted[i + 1].time) {
                const ratio = (next - sorted[i].time) / (sorted[i + 1].time - sorted[i].time || 1);
                const val = sorted[i].value + (sorted[i + 1].value - sorted[i].value) * ratio;
                setProject((p) => ({ ...p, masterDimmer: Math.max(0, Math.min(1, val)) }));
                break;
              }
            }
          }
        }

        // 2. Scene cue evaluation
        const sceneTrack = tracks.find((t) => t.target === 'sceneCue');
        if (sceneTrack && sceneTrack.keyframes.length > 0) {
          const sorted = [...sceneTrack.keyframes].sort((a, b) => a.time - b.time);
          const activeKf = [...sorted].reverse().find((kf) => next >= kf.time);
          if (activeKf && activeKf.sceneId && activeKf.sceneId !== project.activeSceneId) {
            setProject((p) => ({ ...p, activeSceneId: activeKf.sceneId! }));
          }
        }

        return next;
      });

      animRef.current = requestAnimationFrame(loopStep);
    };

    animRef.current = requestAnimationFrame(loopStep);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, duration, loop, tracks, project.activeSceneId]);

  if (!isOpen) return null;

  const formatTimecode = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const handleAddKeyframe = () => {
    const track = tracks.find((t) => t.id === selectedTrackId);
    if (!track) return;

    let newVal = 1.0;
    let sceneId = undefined;
    if (track.target === 'masterDimmer') {
      newVal = project.masterDimmer;
    } else if (track.target === 'sceneCue') {
      sceneId = project.activeSceneId;
      newVal = 1;
    }

    const newKf: Keyframe = {
      id: `kf_${Date.now()}`,
      time: Math.round(currentTime * 10) / 10,
      value: newVal,
      sceneId,
      easing: 'easeInOut',
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === selectedTrackId) {
          return {
            ...t,
            keyframes: [...t.keyframes.filter((k) => Math.abs(k.time - newKf.time) > 0.1), newKf].sort(
              (a, b) => a.time - b.time
            ),
          };
        }
        return t;
      })
    );
  };

  const handleDeleteKeyframe = (trackId: string, kfId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          return {
            ...t,
            keyframes: t.keyframes.filter((k) => k.id !== kfId),
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-14 px-5 border-b border-studio-750 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent-pink/20 text-accent-pink flex items-center justify-center border border-accent-pink/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-sm">Automated Show Timeline & Sequencer</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent-pink/15 text-accent-pink border border-accent-pink/30">
                  Keyframe Engine
                </span>
              </div>
              <p className="text-[11px] text-studio-400">
                Automate Master Dimmer curves, scene transitions, and lighting cues across time
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Timecode Digital Display */}
            <div className="bg-black/60 px-3 py-1 rounded-lg border border-studio-750 font-mono text-accent-cyan font-bold text-base tracking-wider shadow-inner">
              {formatTimecode(currentTime)}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-studio-400 hover:text-slate-100 rounded-lg hover:bg-studio-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transport & Keyframe Controls */}
        <div className="h-12 px-5 bg-studio-950 border-b border-studio-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              className="p-2 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300 hover:text-white border border-studio-750 transition-colors"
              title="Return to 00:00.00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all shadow-md ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-black'
                  : 'bg-accent-cyan hover:bg-cyan-400 text-black'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
            </button>

            <button
              onClick={() => setLoop(!loop)}
              className={`p-2 rounded-lg border transition-colors ${
                loop
                  ? 'bg-accent-neon/15 text-accent-neon border-accent-neon/30'
                  : 'bg-studio-850 text-studio-500 border-studio-750'
              }`}
              title="Toggle Timeline Loop"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-px bg-studio-800 mx-2" />

            <button
              onClick={handleAddKeyframe}
              className="px-3 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-750 text-slate-200 border border-studio-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-accent-cyan" />
              <span>+ Keyframe at Playhead</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-studio-400 font-mono">
            <span>Duration:</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-studio-850 border border-studio-700 rounded px-2 py-1 text-slate-200 font-bold outline-none"
            >
              <option value="15">15 Seconds</option>
              <option value="30">30 Seconds</option>
              <option value="60">60 Seconds (1 Min)</option>
              <option value="120">120 Seconds (2 Min)</option>
              <option value="300">300 Seconds (5 Min)</option>
            </select>
          </div>
        </div>

        {/* Timeline Tracks View */}
        <div className="flex-1 flex flex-col bg-[#0d1117] overflow-y-auto custom-scrollbar select-none">
          {/* Timeline Time Ruler */}
          <div className="h-8 border-b border-studio-800 flex bg-studio-900 sticky top-0 z-20">
            <div className="w-56 shrink-0 border-r border-studio-800 px-4 flex items-center text-[10px] font-bold text-studio-400 uppercase tracking-wider">
              Tracks
            </div>
            <div
              className="flex-1 relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                setCurrentTime(ratio * duration);
              }}
            >
              {/* Ruler Tick Marks */}
              {Array.from({ length: Math.floor(duration / 5) + 1 }).map((_, idx) => {
                const timeSec = idx * 5;
                const leftPercent = (timeSec / duration) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-studio-500 pointer-events-none"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span className="pl-1 pt-1">{timeSec}s</span>
                    <div className="h-2 w-px bg-studio-750" />
                  </div>
                );
              })}

              {/* Red Playhead Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-lg shadow-rose-500/50"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              >
                <div className="w-3 h-3 bg-rose-500 rotate-45 -ml-[5px] -mt-1 rounded-sm shadow-md" />
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <div className="divide-y divide-studio-800/80 flex-1">
            {tracks.map((track) => {
              const isSelected = track.id === selectedTrackId;
              return (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`flex h-20 transition-colors ${
                    isSelected ? 'bg-studio-850/60' : 'hover:bg-studio-850/30'
                  }`}
                >
                  {/* Track Info (Left) */}
                  <div className="w-56 shrink-0 border-r border-studio-800 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                        <span className="font-bold text-xs text-slate-200">{track.name}</span>
                      </div>
                      <div className="text-[10px] text-studio-400 mt-0.5 font-mono">
                        {track.target === 'masterDimmer'
                          ? `Value: ${Math.round(project.masterDimmer * 100)}%`
                          : `Scene: ${project.scenes.find((s) => s.id === project.activeSceneId)?.name || 'Default'}`}
                      </div>
                    </div>

                    <div className="text-[10px] text-studio-500">
                      {track.keyframes.length} keyframes
                    </div>
                  </div>

                  {/* Track Keyframe Line (Right) */}
                  <div
                    className="flex-1 relative bg-black/30 overflow-hidden cursor-crosshair"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                      setCurrentTime(ratio * duration);
                    }}
                  >
                    {/* Horizontal center guide */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-studio-800/60 pointer-events-none" />

                    {/* Keyframes on track */}
                    {track.keyframes.map((kf) => {
                      const leftPercent = (kf.time / duration) * 100;
                      return (
                        <div
                          key={kf.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTime(kf.time);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleDeleteKeyframe(track.id, kf.id);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-studio-900 border-2 rounded-sm rotate-45 cursor-pointer hover:scale-125 transition-transform flex items-center justify-center group shadow-md"
                          style={{
                            left: `${leftPercent}%`,
                            borderColor: track.color,
                          }}
                          title={`Time: ${kf.time}s | Value: ${kf.value} (Right-click to delete)`}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: track.color }}
                          />
                        </div>
                      );
                    })}

                    {/* Red Playhead in track */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none opacity-80"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="h-10 px-5 bg-studio-950 border-t border-studio-800 flex items-center justify-between text-xs text-studio-400">
          <span>Click on ruler to scrub playhead • Right-click any keyframe diamond to delete</span>
          <span className="font-mono text-accent-cyan">Automated Show Engine Running</span>
        </div>
      </div>
    </div>
  );
};

