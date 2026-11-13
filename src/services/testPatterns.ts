import { TestPatternType } from '../types';

export function renderTestPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: TestPatternType
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  switch (type) {
    case 'white_mesh': {
      // High-contrast pure white calibration mesh for physical projection mapping
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 1. Fine 25px Sub-grid lines (subtle white)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 25) {
        if (x % 100 === 0) continue;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 25) {
        if (y % 100 === 0) continue;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Major 100px Grid Lines (bright crisp white)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.75;
      for (let x = 0; x <= width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Diagonal Alignment Guide Lines (corner-to-corner)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
      ctx.moveTo(width, 0);
      ctx.lineTo(0, height);
      ctx.stroke();

      // 4. Center Concentric Alignment Rings (Aspect, Circularity & Keystoning)
      const cx = width / 2;
      const cy = height / 2;
      const rings = [60, 140, 260, 420];
      for (const r of rings) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Center Master Crosshairs
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // 6. Cell Alphanumeric Identifiers (A1, A2, B1...) for physical object mapping
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      for (let col = 0; col * 100 < width; col++) {
        for (let row = 0; row * 100 < height; row++) {
          const colLetter = letters[col] || `${col + 1}`;
          const label = `${colLetter}${row + 1}`;
          ctx.fillText(label, col * 100 + 6, row * 100 + 6);
        }
      }

      // 7. Perimeter Heavy Border Frame & Corner Brackets
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      // Corner L-Brackets for projector lens edge alignment
      const bracketSize = 40;
      ctx.lineWidth = 6;
      // TL
      ctx.beginPath();
      ctx.moveTo(2, bracketSize); ctx.lineTo(2, 2); ctx.lineTo(bracketSize, 2);
      ctx.stroke();
      // TR
      ctx.beginPath();
      ctx.moveTo(width - bracketSize, 2); ctx.lineTo(width - 2, 2); ctx.lineTo(width - 2, bracketSize);
      ctx.stroke();
      // BL
      ctx.beginPath();
      ctx.moveTo(2, height - bracketSize); ctx.lineTo(2, height - 2); ctx.lineTo(bracketSize, height - 2);
      ctx.stroke();
      // BR
      ctx.beginPath();
      ctx.moveTo(width - bracketSize, height - 2); ctx.lineTo(width - 2, height - 2); ctx.lineTo(width - 2, height - bracketSize);
      ctx.stroke();

      // 8. Center HUD Readout
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(cx - 160, cy - 24, 320, 48);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 160, cy - 24, 320, 48);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`${width} × ${height} • WHITE MAPPING MESH`, cx, cy);
      break;
    }

    case 'smpte': {
      // 7 top bars: White, Yellow, Cyan, Green, Magenta, Red, Blue
      const colors = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
      const barW = width / colors.length;
      const topH = height * 0.67;

      for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * barW, 0, barW, topH);
      }

      // Middle small bars
      const midH = height * 0.08;
      const midColors = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
      for (let i = 0; i < midColors.length; i++) {
        ctx.fillStyle = midColors[i];
        ctx.fillRect(i * barW, topH, barW, midH);
      }

      // Bottom bars (I, White, Q, Black, PLUGE, Black)
      const botH = height - (topH + midH);
      const botY = topH + midH;
      ctx.fillStyle = '#08253a'; // -I
      ctx.fillRect(0, botY, width * 0.17, botH);
      ctx.fillStyle = '#ffffff'; // White
      ctx.fillRect(width * 0.17, botY, width * 0.17, botH);
      ctx.fillStyle = '#32005a'; // +Q
      ctx.fillRect(width * 0.34, botY, width * 0.17, botH);
      ctx.fillStyle = '#000000'; // Black
      ctx.fillRect(width * 0.51, botY, width * 0.49, botH);

      // PLUGE pulses
      ctx.fillStyle = '#080808';
      ctx.fillRect(width * 0.68, botY, width * 0.05, botH);
      ctx.fillStyle = '#141414';
      ctx.fillRect(width * 0.76, botY, width * 0.05, botH);
      ctx.fillStyle = '#222222';
      ctx.fillRect(width * 0.84, botY, width * 0.05, botH);
      break;
    }

    case 'grid': {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const gridSize = 40;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#22c55e'; // Bright green grid lines

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center crosshair
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444'; // Red center
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Border frame
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);
      break;
    }

    case 'circles': {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) / 2;
      const rings = 8;

      ctx.lineWidth = 2;
      for (let i = 1; i <= rings; i++) {
        const r = (i / rings) * maxR;
        ctx.strokeStyle = i % 2 === 0 ? '#00f0ff' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Diagonal cross lines
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
      ctx.moveTo(width, 0);
      ctx.lineTo(0, height);
      ctx.stroke();
      break;
    }

    case 'checkerboard': {
      const tileSize = 50;
      const cols = Math.ceil(width / tileSize);
      const rows = Math.ceil(height / tileSize);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0a0a0a';
          ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
      }
      break;
    }

    case 'gradient': {
      const steps = 16;
      const stepW = width / steps;
      for (let i = 0; i < steps; i++) {
        const val = Math.round((i / (steps - 1)) * 255);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(i * stepW, 0, stepW, height);
      }
      break;
    }

    case 'alignment': {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Red border with corner indicators
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`TL (0,0)`, 25, 40);
      ctx.fillText(`TR (${width},0)`, width - 180, 40);
      ctx.fillText(`BL (0,${height})`, 25, height - 25);
      ctx.fillText(`BR (${width},${height})`, width - 200, height - 25);

      // Center resolution label
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`${width} × ${height}`, width / 2, height / 2 - 10);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`ALIGNMENT TEST PATTERN`, width / 2, height / 2 + 25);
      break;
    }
  }

  ctx.restore();
}

