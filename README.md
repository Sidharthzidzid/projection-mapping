# LUMINA PRO — Modern Web-Based Projection Mapping Suite

**LUMINA PRO** is a professional-grade, web-based projection mapping software suite inspired by MadMapper, Resolume Arena, TouchDesigner, and HeavyM. Built with React, TypeScript, Three.js, WebGL, Tailwind CSS, Web Audio API, Web MIDI API, and hardware-accelerated 2D/3D projection mapping engines.

---

## 🌟 Key Features

### 1. 3D Virtual Projector Stage Simulator (Three.js WebGL)
- **3D Room & Concert Stage**: Switch to the **"3D Stage"** view mode to see a simulated 3D theatre stage with audience POV, balcony POV, and projector lens POV!
- **Dynamic 3D Projection Mapping**: Projects your 2D mapped surfaces and live animations onto physical 3D models in real time using a live dynamic WebGL canvas texture.
- **Interchangeable 3D Projection Targets**:
  - 🏛 *Architectural Building Façade* (Columns, pediment gable, portals)
  - 📦 *3D Isometric Cubes* (Stage DJ booth illusion cubes)
  - 🔮 *Curved Amphitheater Dome* (360 panoramic curved architecture)
  - 💎 *Low-Poly Crystal Polyhedron* (Multi-faceted geometric sculpture)
- **Virtual Projector Rig**: Realistic volumetric spotlight beam with projector positioning and throw angle.
- **3D Orbit Controls**: Rotate, zoom, and pan around the 3D stage with your mouse.

### 2. Master Post-FX & Live Video Glitch Rack
- **Interactive XY Kaoss Touchpad**: Drag your mouse to modulate RGB Glitch on the X-axis and Kaleidoscope on the Y-axis in real time!
- **RGB Chromatic Split / Glitch**: Cyberpunk horizontal color offset.
- **Kaleidoscope Mirroring**: 2-fold, 4-fold, and 8-fold multi-axis psychedelic reflections.
- **Retro CRT Scanlines**: Authentic broadcast arcade scanlines.
- **Beat Strobe Flash**: Audio-synced and speed-adjustable strobe pulses.
- **Color Inversion**: High-contrast solarized color invert.

### 3. Live Show Video Recording & 4K Snapshot Tool
- **Live Show Video Recorder**: Click **"Record"** in the top bar to capture your entire projection mapping performance directly to a high-definition `.webm` video file via `MediaRecorder`.
- **4K / 1080p PNG Snapshot**: Instant 1-click snapshot of the projected canvas.

### 4. DMX / LED Pixel Strip Simulation (LED Mapping)
- Real-time LED pixel mapping along arbitrary lines and architectural contours.
- Samples RGB colors directly from the video canvas.
- Renders virtual glowing LED strip pixels and provides live Art-Net / DMX universe and channel assignments (`U1:CH1-48`).

### 5. BPM Clock & Tap Tempo
- **Tap Tempo**: Click the BPM button or tap to sync the project tempo to live music (40 to 240 BPM).
- Metronome and audio beat synchronization for shaders and strobe pulses.

### 6. Multi-Surface Warping Geometry
- **Quad Corner Pinning**: 4-point perspective warp with projective homography matrix calculation for flat architectural walls, billboards, and building facades at extreme angles.
- **Bézier Curved Mesh Grid**: Configurable NxM control point grid ($2\times 2$ up to $5\times 5$) for mapping visuals onto cylindrical columns, arches, domes, spheres, and drapery.
- **Polygon Mask Slices**: Arbitrary $n$-sided polygon geometry for triangular pediments and roof gables.
- **Circular / Dome Masks**: Elliptical and circular masking with rotation, radius, and feather controls.

### 7. Dual-Window Physical Projector Architecture
- **Operator Stage UI**: Main monitor interface with interactive handles, wireframes, layer reordering, color adjustments, and snapping guides.
- **Dedicated Projector Output Window**: Detached, clean canvas window for monitor 2 (the physical projector beam) via BroadcastChannel with sub-16ms zero-latency synchronization.
- **Borderless Fullscreen**: Instant toggle via `F` key or double-click.
- **Cursor Auto-Hide**: Mouse cursor auto-hides after 2 seconds of inactivity on the projector display.

### 8. Beginner-Friendly Mode & Presets
- **Beginner Mode**: Simple sliders, labeled handles (`TL`, `TR`, `BR`, `BL`), and 1-click "Reset Shape" and "Center Stage" buttons.
- **Pre-Configured Demos**:
  1. *Architectural Facade Projection* (Cylindrical pillars, pediment, rose dome, main portal)
  2. *3D Optical Stage Cube* (Isometric 3D box illusion with top, left, right faces)
  3. *Curved Dome & Edge-Blend Panorama* (Dual-projector soft edge overlap)

---

## 🚀 Getting Started

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.
