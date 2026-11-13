import { ProjectData, Surface } from '../types';
import { createInitialMeshGrid } from './homography';

export function createDefaultProject(): ProjectData {
  return createArchitecturalFacadePreset();
}

export function createArchitecturalFacadePreset(): ProjectData {
  const width = 1920;
  const height = 1080;

  const leftPillarMesh = createInitialMeshGrid(
    { x: 260, y: 340, width: 220, height: 600 },
    4,
    3
  );
  leftPillarMesh.points[1][1].x += 25;
  leftPillarMesh.points[2][1].x += 25;

  const rightPillarMesh = createInitialMeshGrid(
    { x: 1440, y: 340, width: 220, height: 600 },
    4,
    3
  );
  rightPillarMesh.points[1][1].x -= 25;
  rightPillarMesh.points[2][1].x -= 25;

  const surfaces: Surface[] = [
    {
      id: 'surf_pediment',
      name: 'Pediment (Triangular Gable)',
      type: 'polygon',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'screen',
      source: {
        type: 'shader',
        shader: {
          preset: 'pulsing_polyhedra',
          speed: 1.2,
          scale: 1.1,
          intensity: 1.4,
          color1: '#00f0ff',
          color2: '#ff007f',
          audioReactive: true,
        },
      },
      points: [
        { x: 960, y: 80 },
        { x: 1680, y: 320 },
        { x: 240, y: 320 },
      ],
      polygonPoints: [
        { x: 960, y: 80 },
        { x: 1680, y: 320 },
        { x: 240, y: 320 },
      ],
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_left_pillar',
      name: 'Left Cylindrical Column',
      type: 'mesh',
      visible: true,
      locked: false,
      solo: false,
      opacity: 0.95,
      blendMode: 'source-over',
      source: {
        type: 'shader',
        shader: {
          preset: 'cyberpunk_grid',
          speed: 1.0,
          scale: 1.0,
          intensity: 1.0,
          color1: '#00f0ff',
          color2: '#b026ff',
          audioReactive: true,
        },
      },
      points: [
        { x: 260, y: 340 },
        { x: 480, y: 340 },
        { x: 480, y: 940 },
        { x: 260, y: 940 },
      ],
      meshGrid: leftPillarMesh,
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: true, left: 0.05, right: 0.05, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_right_pillar',
      name: 'Right Cylindrical Column',
      type: 'mesh',
      visible: true,
      locked: false,
      solo: false,
      opacity: 0.95,
      blendMode: 'source-over',
      source: {
        type: 'shader',
        shader: {
          preset: 'cyberpunk_grid',
          speed: 1.0,
          scale: 1.0,
          intensity: 1.0,
          color1: '#00f0ff',
          color2: '#b026ff',
          audioReactive: true,
        },
      },
      points: [
        { x: 1440, y: 340 },
        { x: 1660, y: 340 },
        { x: 1660, y: 940 },
        { x: 1440, y: 940 },
      ],
      meshGrid: rightPillarMesh,
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: true, left: 0.05, right: 0.05, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_main_facade',
      name: 'Center Facade Portal',
      type: 'quad',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'source-over',
      source: {
        type: 'shader',
        shader: {
          preset: 'liquid_plasma',
          speed: 1.3,
          scale: 1.2,
          intensity: 1.2,
          color1: '#ff007f',
          color2: '#00f0ff',
          audioReactive: true,
        },
      },
      points: [
        { x: 520, y: 350 },
        { x: 1400, y: 350 },
        { x: 1360, y: 940 },
        { x: 560, y: 940 },
      ],
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_center_rose_window',
      name: 'Dome Rose Window',
      type: 'circle',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'lighter',
      source: {
        type: 'shader',
        shader: {
          preset: 'sacred_mandala',
          speed: 1.5,
          scale: 1.1,
          intensity: 1.5,
          color1: '#ffaa00',
          color2: '#00f0ff',
          audioReactive: true,
        },
      },
      points: [
        { x: 800, y: 450 },
        { x: 1120, y: 450 },
        { x: 1120, y: 770 },
        { x: 800, y: 770 },
      ],
      circleParams: {
        cx: 960,
        cy: 610,
        rx: 160,
        ry: 160,
        rotation: 0,
      },
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
  ];

  return {
    version: '1.0.0',
    name: 'Architectural Facade Projection',
    canvasWidth: width,
    canvasHeight: height,
    fps: 60,
    activeSceneId: 'scene_main',
    masterDimmer: 1.0,
    masterBlackout: false,
    masterSpeed: 1.0,
    bpm: 124,
    postFX: {
      rgbSplit: 0,
      strobe: false,
      strobeSpeed: 4,
      kaleidoscope: 1,
      neonEdges: false,
      scanlines: false,
      invert: false,
    },
    ledStrips: [
      {
        id: 'led_pediment_base',
        name: 'Gable DMX Bar',
        start: { x: 280, y: 320 },
        end: { x: 1640, y: 320 },
        pixelCount: 20,
        universe: 1,
        startChannel: 1,
        enabled: true,
      },
    ],
    scenes: [
      {
        id: 'scene_main',
        name: 'Scene 1: Grand Awakening',
        surfaces,
        transitionDuration: 1.5,
      },
      {
        id: 'scene_cyber',
        name: 'Scene 2: Matrix Cyber Shift',
        surfaces: surfaces.map((s, idx) => ({
          ...s,
          source: {
            ...s.source,
            shader: {
              ...(s.source.shader || {
                preset: 'matrix_rain',
                speed: 1.0,
                scale: 1.0,
                intensity: 1.0,
                color1: '#39ff14',
                color2: '#00f0ff',
                audioReactive: true,
              }),
              preset: idx % 2 === 0 ? 'matrix_rain' : 'strobe',
            },
          },
        })),
        transitionDuration: 1.5,
      },
    ],
  };
}

export function create3DCubePreset(): ProjectData {
  const width = 1920;
  const height = 1080;
  const cx = 960;
  const cy = 540;

  const topVertex = { x: cx, y: cy - 280 };
  const centerVertex = { x: cx, y: cy };
  const bottomVertex = { x: cx, y: cy + 280 };
  const leftVertex = { x: cx - 320, y: cy - 140 };
  const rightVertex = { x: cx + 320, y: cy - 140 };
  const bottomLeftVertex = { x: cx - 320, y: cy + 140 };
  const bottomRightVertex = { x: cx + 320, y: cy + 140 };

  const surfaces: Surface[] = [
    {
      id: 'surf_cube_top',
      name: 'Cube Top Face',
      type: 'quad',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'source-over',
      source: {
        type: 'shader',
        shader: {
          preset: 'strobe',
          speed: 1.0,
          scale: 1.0,
          intensity: 1.0,
          color1: '#00f0ff',
          color2: '#ff007f',
          audioReactive: true,
        },
      },
      points: [leftVertex, topVertex, rightVertex, centerVertex],
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_cube_left',
      name: 'Cube Left Face',
      type: 'quad',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'source-over',
      source: {
        type: 'shader',
        shader: {
          preset: 'matrix_rain',
          speed: 1.2,
          scale: 1.0,
          intensity: 1.2,
          color1: '#39ff14',
          color2: '#00f0ff',
          audioReactive: true,
        },
      },
      points: [leftVertex, centerVertex, bottomVertex, bottomLeftVertex],
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_cube_right',
      name: 'Cube Right Face',
      type: 'quad',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'source-over',
      source: {
        type: 'shader',
        shader: {
          preset: 'audio_waves',
          speed: 1.4,
          scale: 1.0,
          intensity: 1.5,
          color1: '#ff007f',
          color2: '#00f0ff',
          audioReactive: true,
        },
      },
      points: [centerVertex, rightVertex, bottomRightVertex, bottomVertex],
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
  ];

  return {
    version: '1.0.0',
    name: '3D Optical Stage Cube',
    canvasWidth: width,
    canvasHeight: height,
    fps: 60,
    activeSceneId: 'scene_cube',
    masterDimmer: 1.0,
    masterBlackout: false,
    masterSpeed: 1.0,
    bpm: 128,
    postFX: {
      rgbSplit: 0,
      strobe: false,
      strobeSpeed: 4,
      kaleidoscope: 1,
      neonEdges: false,
      scanlines: false,
      invert: false,
    },
    scenes: [
      {
        id: 'scene_cube',
        name: 'Scene 1: Isometric Projection',
        surfaces,
        transitionDuration: 1.0,
      },
    ],
  };
}

export function createCurvedDomePreset(): ProjectData {
  const width = 1920;
  const height = 1080;

  const leftHalfMesh = createInitialMeshGrid(
    { x: 100, y: 150, width: 950, height: 780 },
    4,
    4
  );
  leftHalfMesh.points[1][2].x += 40;
  leftHalfMesh.points[2][2].x += 40;

  const rightHalfMesh = createInitialMeshGrid(
    { x: 870, y: 150, width: 950, height: 780 },
    4,
    4
  );
  rightHalfMesh.points[1][1].x -= 40;
  rightHalfMesh.points[2][1].x -= 40;

  const surfaces: Surface[] = [
    {
      id: 'surf_proj1_left',
      name: 'Projector 1 (Left Dome Half)',
      type: 'mesh',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'screen',
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
      points: [
        { x: 100, y: 150 },
        { x: 1050, y: 150 },
        { x: 1050, y: 930 },
        { x: 100, y: 930 },
      ],
      meshGrid: leftHalfMesh,
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: true, left: 0, right: 0.18, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_proj2_right',
      name: 'Projector 2 (Right Dome Half)',
      type: 'mesh',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'screen',
      source: {
        type: 'shader',
        shader: {
          preset: 'liquid_plasma',
          speed: 1.0,
          scale: 1.0,
          intensity: 1.0,
          color1: '#ff007f',
          color2: '#00f0ff',
          audioReactive: true,
        },
      },
      points: [
        { x: 870, y: 150 },
        { x: 1820, y: 150 },
        { x: 1820, y: 930 },
        { x: 870, y: 930 },
      ],
      meshGrid: rightHalfMesh,
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: true, left: 0.18, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
  ];

  return {
    version: '1.0.0',
    name: 'Curved Dome Edge-Blend Panorama',
    canvasWidth: width,
    canvasHeight: height,
    fps: 60,
    activeSceneId: 'scene_dome',
    masterDimmer: 1.0,
    masterBlackout: false,
    masterSpeed: 1.0,
    bpm: 120,
    postFX: {
      rgbSplit: 0,
      strobe: false,
      strobeSpeed: 4,
      kaleidoscope: 1,
      neonEdges: false,
      scanlines: false,
      invert: false,
    },
    scenes: [
      {
        id: 'scene_dome',
        name: 'Scene 1: Seamless 360 Blend',
        surfaces,
        transitionDuration: 1.5,
      },
    ],
  };
}

/**
 * White Mesh Area Calibration Preset:
 * High-contrast pure white grid with 6x6 Bézier warp pins and corner keystone quads.
 * Designed specifically for projectionists to easily align, map, and calibrate physical structures.
 */
export function createWhiteMeshCalibrationPreset(): ProjectData {
  const width = 1920;
  const height = 1080;

  // 6x6 Mesh covering the projection area (36 warp control pins)
  const master6x6Mesh = createInitialMeshGrid(
    { x: 100, y: 60, width: 1720, height: 960 },
    6,
    6
  );

  const calibrationSurfaces: Surface[] = [
    {
      id: 'surf_white_mesh_master',
      name: 'Master 6x6 White Mapping Mesh',
      type: 'mesh',
      visible: true,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'screen',
      source: {
        type: 'testpattern',
        testPattern: 'white_mesh',
      },
      points: [
        { x: 100, y: 60 },
        { x: 1820, y: 60 },
        { x: 1820, y: 1020 },
        { x: 100, y: 1020 },
      ],
      meshGrid: master6x6Mesh,
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
    {
      id: 'surf_white_quad_warp',
      name: 'Quick 4-Corner Pin Quad',
      type: 'quad',
      visible: false,
      locked: false,
      solo: false,
      opacity: 1.0,
      blendMode: 'screen',
      source: {
        type: 'testpattern',
        testPattern: 'white_mesh',
      },
      points: [
        { x: 160, y: 100 },
        { x: 1760, y: 100 },
        { x: 1760, y: 980 },
        { x: 160, y: 980 },
      ],
      colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, hue: 0, gamma: 1.0, invert: false, tint: '' },
      edgeBlend: { enabled: false, left: 0, right: 0, top: 0, bottom: 0, gamma: 2.2 },
      maskInvert: false,
      feather: 0,
    },
  ];

  return {
    version: '1.0.0',
    name: 'White Mesh Area Calibration',
    canvasWidth: width,
    canvasHeight: height,
    fps: 60,
    activeSceneId: 'scene_calib_white',
    masterDimmer: 1.0,
    masterBlackout: false,
    masterSpeed: 1.0,
    bpm: 120,
    postFX: {
      rgbSplit: 0,
      strobe: false,
      strobeSpeed: 4,
      kaleidoscope: 1,
      neonEdges: false,
      scanlines: false,
      invert: false,
    },
    scenes: [
      {
        id: 'scene_calib_white',
        name: 'Scene 1: White Mesh Calibration',
        surfaces: calibrationSurfaces,
        transitionDuration: 1.0,
      },
      {
        id: 'scene_calib_show',
        name: 'Scene 2: Live Show Verification',
        surfaces: calibrationSurfaces.map(s => ({
          ...s,
          source: {
            type: 'shader',
            shader: {
              preset: 'cyberpunk_grid',
              speed: 1.0,
              scale: 1.0,
              intensity: 1.2,
              color1: '#00f0ff',
              color2: '#ff007f',
              audioReactive: true,
            },
          },
        })),
        transitionDuration: 1.5,
      },
    ],
  };
}
