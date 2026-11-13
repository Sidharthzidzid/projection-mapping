export type SurfaceType = 'quad' | 'mesh' | 'polygon' | 'circle';

export type SourceType = 
  | 'video' 
  | 'image' 
  | 'camera' 
  | 'screen' 
  | 'shader' 
  | 'custom_shader'
  | 'stream'
  | 'text' 
  | 'testpattern';

export type BlendMode = 
  | 'source-over' 
  | 'screen' 
  | 'lighter' 
  | 'multiply' 
  | 'overlay' 
  | 'hard-light' 
  | 'difference' 
  | 'color-dodge';

export type TestPatternType = 
  | 'white_mesh'
  | 'smpte' 
  | 'grid' 
  | 'circles' 
  | 'checkerboard' 
  | 'gradient' 
  | 'alignment';

export type ShaderPreset = 
  | 'cyberpunk_grid' 
  | 'audio_waves' 
  | 'liquid_plasma' 
  | 'matrix_rain' 
  | 'pulsing_polyhedra' 
  | 'sacred_mandala' 
  | 'strobe';

export interface Point {
  x: number;
  y: number;
}

export interface MeshPoint extends Point {
  u: number;
  v: number;
}

export interface ColorAdjustments {
  brightness: number; // -100 to 100 (0 default)
  contrast: number;   // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  hue: number;        // 0 to 360 (0 default)
  gamma: number;      // 0.2 to 3.0 (1.0 default)
  invert: boolean;
  tint: string;       // hex or 'transparent'
}

export interface EdgeBlend {
  enabled: boolean;
  left: number;       // 0 to 0.5 (percent of surface width)
  right: number;
  top: number;        // 0 to 0.5 (percent of surface height)
  bottom: number;
  gamma: number;      // 0.5 to 3.0 (2.2 default)
}

export interface ShaderConfig {
  preset: ShaderPreset;
  speed: number;        // 0.1 to 5.0
  scale: number;        // 0.2 to 5.0
  intensity: number;    // 0.1 to 2.0
  color1: string;       // hex
  color2: string;       // hex
  audioReactive: boolean;
}

export interface TextConfig {
  content: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  glowColor: string;
  glowIntensity: number;
  animation: 'none' | 'pulse' | 'marquee' | 'clock' | 'countdown';
  countdownMinutes: number;
}

export interface CustomShaderConfig {
  code: string;
  name: string;
  author?: string;
  compileStatus?: 'ok' | 'error';
  errorMessage?: string;
}

export interface EdgeBowing {
  top: number;    // -100 to 100 pixels curve displacement
  right: number;
  bottom: number;
  left: number;
}

export interface SourceConfig {
  type: SourceType;
  url?: string;
  name?: string;
  loop?: boolean;
  playbackRate?: number;
  muted?: boolean;
  aspectRatioMode?: 'fill' | 'fit' | 'stretch';
  shader?: ShaderConfig;
  customShader?: CustomShaderConfig;
  streamUrl?: string;
  text?: TextConfig;
  testPattern?: TestPatternType;
  deviceId?: string;
}

export interface MeshGrid {
  rows: number;
  cols: number;
  points: Point[][];
}

export interface Surface {
  id: string;
  name: string;
  type: SurfaceType;
  visible: boolean;
  locked: boolean;
  solo: boolean;
  opacity: number;
  blendMode: BlendMode;
  source: SourceConfig;
  points: Point[];
  meshGrid?: MeshGrid;
  polygonPoints?: Point[];
  circleParams?: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    rotation: number;
  };
  colorAdjustments: ColorAdjustments;
  edgeBlend: EdgeBlend;
  edgeBowing?: EdgeBowing;
  blackLevel?: number; // 0 to 0.3 for multi-projector black matching
  maskInvert: boolean;
  feather: number;
}

export interface Keyframe {
  id: string;
  time: number; // in seconds
  value: number; // 0.0 to 1.0 or target numeric value
  sceneId?: string;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface TimelineTrack {
  id: string;
  name: string;
  target: 'masterDimmer' | 'sceneCue' | 'surfaceOpacity';
  targetSurfaceId?: string;
  color: string;
  keyframes: Keyframe[];
}

export interface ShowTimeline {
  enabled: boolean;
  duration: number; // total duration in seconds, e.g. 60
  currentTime: number; // playhead in seconds
  isPlaying: boolean;
  loop: boolean;
  tracks: TimelineTrack[];
}

export interface ProjectorLensConfig {
  throwRatio: number; // e.g. 0.8, 1.2, 1.5, 2.0
  lumens: number;      // e.g. 5000
  distanceMeters: number; // e.g. 4.0
  customModelUrl?: string;
}

export interface Scene {
  id: string;
  name: string;
  surfaces: Surface[];
  transitionDuration: number;
}

export interface PostFXConfig {
  rgbSplit: number;        // 0 to 20 px
  strobe: boolean;         // manual or audio flash
  strobeSpeed: number;     // 1 to 10
  kaleidoscope: number;    // 1 (off), 2, 4, 8
  neonEdges: boolean;      // Sobel edge filter
  scanlines: boolean;      // CRT retro scanlines
  invert: boolean;
}

export interface LedStrip {
  id: string;
  name: string;
  start: Point;
  end: Point;
  pixelCount: number; // 8, 16, 24, 32
  universe: number;   // 1 to 4
  startChannel: number;
  enabled: boolean;
}

export interface ProjectData {
  version: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  fps: number;
  scenes: Scene[];
  activeSceneId: string;
  masterDimmer: number;
  masterBlackout: boolean;
  masterSpeed: number;
  bpm: number;
  postFX?: PostFXConfig;
  ledStrips?: LedStrip[];
  timeline?: ShowTimeline;
  projectorLens?: ProjectorLensConfig;
}

export interface AudioBands {
  subBass: number;
  bass: number;
  mid: number;
  high: number;
  peak: number;
  beat: boolean;
}

export interface MidiBinding {
  id: string;
  channel: number;
  controller: number;
  type: 'cc' | 'note';
  action: 'surface_opacity' | 'surface_brightness' | 'master_dimmer' | 'master_blackout' | 'scene_select' | 'shader_speed';
  targetId?: string;
  paramName?: string;
  label: string;
}
