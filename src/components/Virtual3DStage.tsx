import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { 
  Box, 
  Layers, 
  RotateCcw, 
  Eye, 
  Sliders, 
  Sparkles, 
  Maximize2,
  Video,
  Upload,
  Compass,
  Zap
} from 'lucide-react';

interface Virtual3DStageProps {
  sourceCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export const Virtual3DStage: React.FC<Virtual3DStageProps> = ({ sourceCanvasRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelType, setModelType] = useState<'facade' | 'cubes' | 'dome' | 'crystal' | 'custom'>('facade');
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [throwRatio, setThrowRatio] = useState<number>(1.2);
  const [lumens, setLumens] = useState<number>(5000);
  const [beamIntensity, setBeamIntensity] = useState<number>(1.5);
  const [projectorHeight, setProjectorHeight] = useState<number>(4);
  const [projectorDist, setProjectorDist] = useState<number>(9);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const targetGroupRef = useRef<THREE.Group | null>(null);
  const canvasTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const customMeshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x06070a, 0.035);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 11);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x222633, 0.8);
    scene.add(ambientLight);

    // 6. Stage Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1118,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid lines
    const gridHelper = new THREE.GridHelper(30, 30, 0x00f0ff, 0x1e2230);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 7. Dynamic Canvas Texture from 2D mapping engine
    let dynamicTexture: THREE.CanvasTexture | null = null;
    if (sourceCanvasRef.current) {
      dynamicTexture = new THREE.CanvasTexture(sourceCanvasRef.current);
      dynamicTexture.minFilter = THREE.LinearFilter;
      dynamicTexture.magFilter = THREE.LinearFilter;
      canvasTextureRef.current = dynamicTexture;
    }

    // 8. 3D Projector Model & Spotlight Beam
    const projectorGroup = new THREE.Group();
    const projBodyGeo = new THREE.BoxGeometry(0.8, 0.4, 0.6);
    const projBodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1d26, metalness: 0.8, roughness: 0.3 });
    const projBody = new THREE.Mesh(projBodyGeo, projBodyMat);
    projBody.castShadow = true;
    projectorGroup.add(projBody);

    const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.35;
    projectorGroup.add(lens);

    projectorGroup.position.set(0, projectorHeight, projectorDist);
    scene.add(projectorGroup);

    // Volumetric Spotlight
    const spotLight = new THREE.SpotLight(0x00f0ff, beamIntensity * 10);
    spotLight.position.set(0, projectorHeight, projectorDist);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.4;
    spotLight.decay = 1.2;
    spotLight.distance = 25;
    spotLight.castShadow = true;
    scene.add(spotLight);
    spotlightRef.current = spotLight;

    // 9. 3D Target Models Group
    const targetGroup = new THREE.Group();
    scene.add(targetGroup);
    targetGroupRef.current = targetGroup;
    spotLight.target = targetGroup;

    // Helper to build 3D models
    const build3DModel = (type: string) => {
      while (targetGroup.children.length > 0) {
        targetGroup.remove(targetGroup.children[0]);
      }

      const mat = new THREE.MeshStandardMaterial({
        map: dynamicTexture || undefined,
        roughness: 0.4,
        metalness: 0.1,
      });

      if (type === 'facade') {
        // Architectural Building Façade
        const wallGeo = new THREE.BoxGeometry(7, 4.5, 0.4);
        const wall = new THREE.Mesh(wallGeo, mat);
        wall.position.y = 2.25;
        wall.castShadow = true;
        wall.receiveShadow = true;
        targetGroup.add(wall);

        // Columns
        const colGeo = new THREE.CylinderGeometry(0.3, 0.3, 4.5, 24);
        const col1 = new THREE.Mesh(colGeo, mat);
        col1.position.set(-2.8, 2.25, 0.4);
        col1.castShadow = true;
        targetGroup.add(col1);

        const col2 = new THREE.Mesh(colGeo, mat);
        col2.position.set(2.8, 2.25, 0.4);
        col2.castShadow = true;
        targetGroup.add(col2);

        // Pediment (Triangle gable on top)
        const pedShape = new THREE.Shape();
        pedShape.moveTo(-3.5, 0);
        pedShape.lineTo(3.5, 0);
        pedShape.lineTo(0, 1.8);
        pedShape.closePath();
        const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.4, bevelEnabled: false });
        const ped = new THREE.Mesh(pedGeo, mat);
        ped.position.set(0, 4.5, -0.2);
        ped.castShadow = true;
        targetGroup.add(ped);
      } else if (type === 'cubes') {
        // Isometric 3D Stage Cubes
        const cubeSizes = [
          { s: 1.8, x: -1.2, y: 0.9, z: 0 },
          { s: 1.5, x: 1.2, y: 0.75, z: 0.3 },
          { s: 1.2, x: 0, y: 2.1, z: -0.2 },
          { s: 0.9, x: 1.5, y: 1.9, z: -0.1 },
        ];
        cubeSizes.forEach(({ s, x, y, z }) => {
          const cGeo = new THREE.BoxGeometry(s, s, s);
          const cMesh = new THREE.Mesh(cGeo, mat);
          cMesh.position.set(x, y, z);
          cMesh.castShadow = true;
          cMesh.receiveShadow = true;
          targetGroup.add(cMesh);
        });
      } else if (type === 'dome') {
        // Curved Dome & Amphitheater
        const domeGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.5, 32, 1, true, -Math.PI / 2, Math.PI);
        const domeMat = mat.clone();
        domeMat.side = THREE.DoubleSide;
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, 1.75, 1);
        dome.castShadow = true;
        targetGroup.add(dome);
      } else if (type === 'crystal') {
        // Low-Poly Crystal Polyhedron
        const polyGeo = new THREE.IcosahedronGeometry(2.2, 0);
        const poly = new THREE.Mesh(polyGeo, mat);
        poly.position.set(0, 2.5, 0);
        poly.castShadow = true;
        targetGroup.add(poly);
      } else if (type === 'custom' && customMeshRef.current) {
        targetGroup.add(customMeshRef.current);
      }
    };

    build3DModel(modelType);

    // 10. Animation Loop
    let animId: number;
    const animate = () => {
      // Update dynamic canvas texture
      if (canvasTextureRef.current) {
        canvasTextureRef.current.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelType, beamIntensity, projectorHeight, projectorDist, sourceCanvasRef]);

  // Camera Presets
  const setCameraPreset = (preset: 'front' | 'balcony' | 'side' | 'projector') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'front') {
      cam.position.set(0, 2.2, 9);
      controlsRef.current.target.set(0, 2, 0);
    } else if (preset === 'balcony') {
      cam.position.set(0, 6, 12);
      controlsRef.current.target.set(0, 1.5, 0);
    } else if (preset === 'side') {
      cam.position.set(9, 2.5, 5);
      controlsRef.current.target.set(0, 2, 0);
    } else if (preset === 'projector') {
      cam.position.set(0, projectorHeight, projectorDist);
      controlsRef.current.target.set(0, 2, 0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as string;
      const loader = new OBJLoader();
      try {
        const obj = loader.parse(contents);

        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 5 / maxDim;
        obj.scale.set(scale, scale, scale);

        box.setFromObject(obj);
        obj.position.y = -box.min.y;

        if (canvasTextureRef.current) {
          const mat = new THREE.MeshStandardMaterial({
            map: canvasTextureRef.current,
            roughness: 0.4,
            metalness: 0.1,
          });
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = mat;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
        }

        customMeshRef.current = obj;
        setCustomModelName(file.name);
        setModelType('custom');

        if (targetGroupRef.current) {
          while (targetGroupRef.current.children.length > 0) {
            targetGroupRef.current.remove(targetGroupRef.current.children[0]);
          }
          targetGroupRef.current.add(obj);
        }
      } catch (err) {
        alert('Failed to parse 3D file. Please ensure it is a valid .OBJ file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const projectedWidth = (projectorDist / throwRatio).toFixed(1);
  const projectedHeight = ((projectorDist / throwRatio) * (9 / 16)).toFixed(1);
  const projectedArea = Math.max(1, parseFloat(projectedWidth) * parseFloat(projectedHeight));
  const estimatedLux = Math.round(lumens / projectedArea);

  return (
    <div className="relative w-full h-full bg-studio-950 overflow-hidden select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".obj"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating 3D Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-studio-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-studio-700 shadow-2xl space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 text-accent-cyan font-bold">
          <Box className="w-4 h-4" />
          <span>3D Stage</span>
        </div>

        <div className="h-4 w-px bg-studio-750" />

        {/* 3D Target Model Selector */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-studio-400 uppercase font-semibold mr-1">Target:</span>
          {(['facade', 'cubes', 'dome', 'crystal'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModelType(m)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                modelType === m
                  ? 'bg-accent-cyan text-studio-950 shadow'
                  : 'bg-studio-800 hover:bg-studio-750 text-studio-300'
              }`}
            >
              {m}
            </button>
          ))}

          {/* Upload 3D OBJ Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 border transition-all ${
              modelType === 'custom'
                ? 'bg-accent-purple text-white border-accent-purple'
                : 'bg-studio-800 hover:bg-studio-750 text-studio-300 border-studio-700'
            }`}
            title="Upload custom 3D model (.OBJ file)"
          >
            <Upload className="w-3 h-3" />
            <span>{customModelName ? customModelName.substring(0, 10) + '...' : 'Upload .OBJ'}</span>
          </button>
        </div>

        <div className="h-4 w-px bg-studio-750" />

        {/* Camera Views */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-studio-400 uppercase font-semibold mr-1">POV:</span>
          <button
            onClick={() => setCameraPreset('front')}
            className="px-2 py-0.5 rounded bg-studio-800 hover:bg-studio-750 text-studio-300 text-[11px]"
          >
            Front
          </button>
          <button
            onClick={() => setCameraPreset('balcony')}
            className="px-2 py-0.5 rounded bg-studio-800 hover:bg-studio-750 text-studio-300 text-[11px]"
          >
            Balcony
          </button>
          <button
            onClick={() => setCameraPreset('side')}
            className="px-2 py-0.5 rounded bg-studio-800 hover:bg-studio-750 text-studio-300 text-[11px]"
          >
            Side
          </button>
          <button
            onClick={() => setCameraPreset('projector')}
            className="px-2 py-0.5 rounded bg-accent-neon/20 border border-accent-neon/40 text-accent-neon font-bold text-[11px]"
          >
            Beam
          </button>
        </div>
      </div>

      {/* Projector Lens Throw & Lux Calculator HUD (Top Right) */}
      <div className="absolute top-4 right-4 z-20 bg-studio-900/90 backdrop-blur-md p-3 rounded-xl border border-studio-700 shadow-2xl text-xs space-y-2 w-64">
        <div className="flex items-center justify-between text-slate-200 font-bold">
          <span className="flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-accent-neon" />
            <span>Lens Throw Calculator</span>
          </span>
          <span className="text-[10px] text-accent-cyan font-mono">{lumens} LM</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-studio-400">
            <span>Throw Ratio</span>
            <select
              value={throwRatio}
              onChange={(e) => setThrowRatio(parseFloat(e.target.value))}
              className="bg-studio-800 border border-studio-700 rounded px-1.5 py-0.5 text-slate-200 font-bold outline-none"
            >
              <option value="0.38">0.38:1 (Ultra Short)</option>
              <option value="0.8">0.80:1 (Short Throw)</option>
              <option value="1.2">1.20:1 (Standard)</option>
              <option value="2.0">2.00:1 (Long Throw)</option>
            </select>
          </div>

          <div className="flex justify-between text-studio-400 font-mono">
            <span>Throw Distance:</span>
            <span className="text-slate-200 font-bold">{projectorDist.toFixed(1)} m</span>
          </div>

          <div className="flex justify-between text-studio-400 font-mono">
            <span>Beam Coverage:</span>
            <span className="text-accent-cyan font-bold">{projectedWidth}m × {projectedHeight}m</span>
          </div>

          <div className="flex justify-between text-studio-400 font-mono border-t border-studio-800 pt-1">
            <span>Estimated Surface Lux:</span>
            <span className="text-accent-neon font-bold">~{estimatedLux} lx</span>
          </div>
        </div>
      </div>

      {/* Floating Instructions HUD (Bottom) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-studio-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-studio-700 text-slate-300 text-[11px] flex items-center space-x-3 shadow-xl">
        <span>🖱 Left Click + Drag: <strong>Orbit 3D Stage</strong></span>
        <span>•</span>
        <span>Scroll: <strong>Zoom</strong></span>
        <span>•</span>
        <span>Right Click: <strong>Pan</strong></span>
      </div>
    </div>
  );
};

