import { ShaderConfig, AudioBands } from '../types';

export interface ProceduralGenerator {
  name: string;
  render: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    config: ShaderConfig,
    audio: AudioBands
  ) => void;
}

export const proceduralGenerators: Record<string, ProceduralGenerator> = {
  cyberpunk_grid: {
    name: 'Cyberpunk Neon Grid',
    render: (ctx, width, height, time, config, audio) => {
      const speed = config.speed * 0.0012;
      const audioBass = config.audioReactive ? audio.bass * 1.5 : 0;

      // Dark futuristic synthwave sky
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#04020a');
      bg.addColorStop(0.5, '#18072e');
      bg.addColorStop(1, '#080112');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Neon Horizon Sun
      const sunY = height * 0.46;
      const sunRad = Math.min(width, height) * 0.28 * (1 + audioBass * 0.15);
      const sunGrad = ctx.createRadialGradient(width / 2, sunY, 10, width / 2, sunY, sunRad);
      sunGrad.addColorStop(0, '#fffc79');
      sunGrad.addColorStop(0.35, config.color2 || '#ff007f');
      sunGrad.addColorStop(0.8, 'rgba(255, 0, 127, 0.4)');
      sunGrad.addColorStop(1, 'rgba(255, 0, 127, 0)');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, sunY, sunRad, 0, Math.PI * 2);
      ctx.fill();

      // Horizon line
      ctx.strokeStyle = config.color1 || '#00f0ff';
      ctx.lineWidth = 3 + audioBass * 3;
      ctx.beginPath();
      ctx.moveTo(0, sunY);
      ctx.lineTo(width, sunY);
      ctx.stroke();

      // Perspective Grid Floor moving forward
      const fov = height * 0.54;
      const t = (time * speed) % 1;
      const numLines = 12;

      ctx.strokeStyle = config.color1 || '#00f0ff';

      // Horizontal lines
      for (let i = 0; i < numLines; i++) {
        const lineProgress = Math.pow((i + t) / numLines, 2.2);
        const y = sunY + lineProgress * fov;
        const alpha = Math.min(1, lineProgress * 1.8);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1 + lineProgress * 2.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical perspective lines
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.5;
      const vLines = 18;
      for (let i = -vLines; i <= vLines; i++) {
        const xBottom = width / 2 + (i / vLines) * (width * 1.3);
        ctx.beginPath();
        ctx.moveTo(width / 2, sunY);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
    },
  },

  audio_waves: {
    name: 'Audio Reactive Spectrum Ring',
    render: (ctx, width, height, time, config, audio) => {
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.22 * config.scale;
      const numPoints = 80;
      const t = time * 0.002 * config.speed;
      const bassAmp = config.audioReactive ? audio.bass * 70 * config.intensity : 20;
      const midAmp = config.audioReactive ? audio.mid * 40 * config.intensity : 12;

      // Outer wave ring (double stroke for crisp neon glow)
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const wave = Math.sin(angle * 6 + t) * bassAmp + Math.cos(angle * 12 - t * 1.5) * midAmp;
        const r = baseRadius + wave;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      // Outer glow line
      ctx.strokeStyle = config.color1 || '#00f0ff';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 8;
      ctx.stroke();
      // Core sharp line
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner spectrum frequency spikes
      const numBars = 36;
      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2 + t * 0.25;
        const barLen = 15 + Math.sin(i * 0.9 + t * 4) * 15 + (config.audioReactive ? (i % 2 === 0 ? audio.bass : audio.high) * 55 : 20);
        const x1 = cx + Math.cos(angle) * (baseRadius * 0.65);
        const y1 = cy + Math.sin(angle) * (baseRadius * 0.65);
        const x2 = cx + Math.cos(angle) * (baseRadius * 0.65 + barLen);
        const y2 = cy + Math.sin(angle) * (baseRadius * 0.65 + barLen);

        ctx.strokeStyle = i % 2 === 0 ? (config.color1 || '#00f0ff') : (config.color2 || '#ff007f');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center glowing pulse core
      const corePulse = (config.audioReactive ? audio.bass * 25 : Math.sin(t * 4) * 12);
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 35 + corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.5, config.color2 || '#ff007f');
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 40 + corePulse, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  liquid_plasma: {
    name: 'Liquid Chromatic Plasma',
    render: (ctx, width, height, time, config, audio) => {
      const t = time * 0.0012 * config.speed;
      const bass = config.audioReactive ? audio.bass * 0.9 : 0.2;

      ctx.fillStyle = '#080314';
      ctx.fillRect(0, 0, width, height);

      const numBlobs = 6;
      for (let i = 0; i < numBlobs; i++) {
        const angle = t * (0.8 + i * 0.3) + (i * Math.PI * 2) / numBlobs;
        const radius = (Math.min(width, height) * 0.3) * (1 + Math.sin(t * 1.5 + i) * 0.3 + bass);
        const bx = width / 2 + Math.cos(angle) * (width * 0.28) * config.scale;
        const by = height / 2 + Math.sin(angle * 1.3) * (height * 0.28) * config.scale;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        const isEven = i % 2 === 0;
        grad.addColorStop(0, isEven ? (config.color1 || '#00f0ff') : (config.color2 || '#ff007f'));
        grad.addColorStop(0.5, isEven ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 0, 127, 0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    },
  },

  matrix_rain: {
    name: 'Matrix Digital Rain',
    render: (ctx, width, height, time, config, audio) => {
      // Solid deep green-black background
      ctx.fillStyle = '#040805';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.floor(width / 26);
      const t = time * 0.06 * config.speed;
      const glyphs = '0123456789ABCDEFΣΩΨλπ∆∇$@#*&%';

      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';

      for (let i = 0; i < cols; i++) {
        const colSpeed = (i * 7919) % 5 + 3;
        const yHead = Math.floor((t * colSpeed + (i * 47) % height) % (height + 250)) - 100;
        const charIdx = Math.floor((t + i * 13) % glyphs.length);
        const char = glyphs[charIdx];

        // Draw bright glowing head
        ctx.fillStyle = '#ffffff';
        ctx.fillText(char, i * 26 + 13, yHead);

        // Draw trail glyphs
        for (let j = 1; j < 9; j++) {
          const yTrail = yHead - j * 22;
          if (yTrail > 0 && yTrail < height) {
            const alpha = 1 - j / 9;
            ctx.fillStyle = j === 1 ? '#a7f3d0' : (config.color1 || '#39ff14');
            ctx.globalAlpha = alpha;
            const trailChar = glyphs[(charIdx + j * 3) % glyphs.length];
            ctx.fillText(trailChar, i * 26 + 13, yTrail);
          }
        }
        ctx.globalAlpha = 1.0;
      }
    },
  },

  pulsing_polyhedra: {
    name: '3D Wireframe Polyhedron',
    render: (ctx, width, height, time, config, audio) => {
      ctx.fillStyle = '#090a10';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const t = time * 0.001 * config.speed;
      const audioPulse = config.audioReactive ? audio.bass * 60 : 0;
      const size = (Math.min(width, height) * 0.3 + audioPulse) * config.scale;

      const vertices = [
        { x: 0, y: -1, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 1, z: 0 },
      ];

      const edges = [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [5, 1], [5, 2], [5, 3], [5, 4],
        [1, 2], [2, 3], [3, 4], [4, 1],
      ];

      const rotX = t * 0.8;
      const rotY = t * 1.3;
      const rotZ = t * 0.5;

      const project = (v: { x: number; y: number; z: number }) => {
        let x1 = v.x * Math.cos(rotY) + v.z * Math.sin(rotY);
        let z1 = -v.x * Math.sin(rotY) + v.z * Math.cos(rotY);
        let y2 = v.y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = v.y * Math.sin(rotX) + z1 * Math.cos(rotX);
        let x3 = x1 * Math.cos(rotZ) - y2 * Math.sin(rotZ);
        let y3 = x1 * Math.sin(rotZ) + y2 * Math.cos(rotZ);

        const cameraDist = 3.0;
        const factor = (cameraDist / (cameraDist + z2)) * size;
        return {
          x: cx + x3 * factor,
          y: cy + y3 * factor,
          z: z2,
        };
      };

      const projected = vertices.map(project);

      // Draw wireframe edges
      for (const [i, j] of edges) {
        const p1 = projected[i];
        const p2 = projected[j];

        // Outer glow stroke
        ctx.strokeStyle = config.color1 || '#00f0ff';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Inner sharp stroke
        ctx.strokeStyle = config.color2 || '#ff007f';
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw vertices
      for (const p of projected) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  sacred_mandala: {
    name: 'Sacred Mandala Kaleidoscope',
    render: (ctx, width, height, time, config, audio) => {
      ctx.fillStyle = '#06020c';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const t = time * 0.001 * config.speed;
      const petals = 12;
      const bassAmp = config.audioReactive ? audio.bass * 35 : 8;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.35);

      for (let ring = 1; ring <= 4; ring++) {
        const ringRadius = ring * 45 * config.scale + bassAmp * (ring * 0.3);
        ctx.strokeStyle = ring % 2 === 0 ? (config.color1 || '#ffaa00') : (config.color2 || '#00f0ff');
        ctx.lineWidth = 2.5;

        for (let i = 0; i < petals; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI * 2) / petals);

          ctx.beginPath();
          ctx.arc(ringRadius, 0, ringRadius * 0.45, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }

      ctx.restore();
    },
  },

  strobe: {
    name: 'Strobe & Infinite Tunnel',
    render: (ctx, width, height, time, config, audio) => {
      const t = time * 0.003 * config.speed;
      const isStrobe = config.audioReactive ? audio.beat : (Math.floor(t * 4) % 2 === 0);

      ctx.fillStyle = isStrobe ? '#181824' : '#050508';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.max(width, height);
      const rings = 12;

      for (let i = rings; i >= 1; i--) {
        const phase = (i / rings + (t * 0.5) % (1 / rings)) % 1;
        const rad = Math.pow(phase, 2) * maxDist * 0.8 * config.scale;

        ctx.strokeStyle = i % 2 === 0 ? (config.color1 || '#00f0ff') : (config.color2 || '#ff007f');
        ctx.lineWidth = 2.5 + phase * 5;

        ctx.beginPath();
        ctx.rect(cx - rad / 2, cy - rad / 2, rad, rad);
        ctx.stroke();
      }
    },
  },
};
