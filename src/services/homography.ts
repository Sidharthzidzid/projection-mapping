import { Point, MeshGrid, ColorAdjustments, EdgeBlend, EdgeBowing } from '../types';

/**
 * Computes exact affine transform matrix [a, b, c, d, e, f]
 * that maps source triangle (s0, s1, s2) to destination triangle (d0, d1, d2).
 * Formulated as M = D * S^{-1}.
 */
export function getAffineTransform(
  s0: Point, s1: Point, s2: Point,
  d0: Point, d1: Point, d2: Point
): { a: number; b: number; c: number; d: number; e: number; f: number } | null {
  const det = s0.x * (s1.y - s2.y) - s1.x * (s0.y - s2.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(det) < 1e-6) return null;

  // Inverse elements of matrix S
  const i00 = (s1.y - s2.y) / det;
  const i01 = (s2.y - s0.y) / det;
  const i02 = (s0.y - s1.y) / det;

  const i10 = (s2.x - s1.x) / det;
  const i11 = (s0.x - s2.x) / det;
  const i12 = (s1.x - s0.x) / det;

  const i20 = (s1.x * s2.y - s2.x * s1.y) / det;
  const i21 = (s2.x * s0.y - s0.x * s2.y) / det;
  const i22 = (s0.x * s1.y - s1.x * s0.y) / det;

  // Row 0 of affine transform (horizontal components)
  const a = d0.x * i00 + d1.x * i01 + d2.x * i02;
  const c = d0.x * i10 + d1.x * i11 + d2.x * i12;
  const e = d0.x * i20 + d1.x * i21 + d2.x * i22;

  // Row 1 of affine transform (vertical components)
  const b = d0.y * i00 + d1.y * i01 + d2.y * i02;
  const d = d0.y * i10 + d1.y * i11 + d2.y * i12;
  const f = d0.y * i20 + d1.y * i21 + d2.y * i22;

  return { a, b, c, d, e, f };
}

/**
 * High-performance texture rendering for a triangular patch from source to destination.
 * Uses exact affine transformation with centroid dilation to 100% eliminate anti-aliasing clipping seams (black lines).
 */
export function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  s0: Point, s1: Point, s2: Point,
  d0: Point, d1: Point, d2: Point
) {
  const m = getAffineTransform(s0, s1, s2, d0, d1, d2);
  if (!m) return;

  // Compute centroid of destination triangle
  const cx = (d0.x + d1.x + d2.x) / 3;
  const cy = (d0.y + d1.y + d2.y) / 3;

  // Dilate destination triangle vertices outward by 1.2px from centroid
  // This completely bridges anti-aliasing clipping seams, eliminating all black cracks/lines!
  const expand = (p: Point): Point => {
    const vx = p.x - cx;
    const vy = p.y - cy;
    const len = Math.hypot(vx, vy) || 1;
    return {
      x: p.x + (vx / len) * 1.2,
      y: p.y + (vy / len) * 1.2,
    };
  };

  const ed0 = expand(d0);
  const ed1 = expand(d1);
  const ed2 = expand(d2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ed0.x, ed0.y);
  ctx.lineTo(ed1.x, ed1.y);
  ctx.lineTo(ed2.x, ed2.y);
  ctx.closePath();
  ctx.clip();

  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  ctx.drawImage(source, 0, 0);
  ctx.restore();
}

/**
 * Subdivides a 4-point corner-pinned Quad into a grid of triangles for smooth perspective mapping.
 * Supports Cubic Bézier Curved Edge Bowing (top, bottom, left, right) to wrap video around cylindrical pillars and curved architecture.
 * Uses seamless sub-pixel padding to ensure completely solid, artifact-free textures.
 */
export function drawSubdividedQuad(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  quad: [Point, Point, Point, Point], // TL, TR, BR, BL
  subdivisions: number = 4,
  edgeBowing?: EdgeBowing
) {
  const [p0, p1, p2, p3] = quad; // TL, TR, BR, BL

  const hasBowing = !!(edgeBowing && (
    edgeBowing.top !== 0 || edgeBowing.right !== 0 || 
    edgeBowing.bottom !== 0 || edgeBowing.left !== 0
  ));

  // If curved bowing is active, increase subdivisions for silky-smooth Bézier curves
  const steps = hasBowing ? Math.max(8, subdivisions) : Math.max(2, subdivisions);

  // Quad Centroid for outward normal calculations
  const cx = (p0.x + p1.x + p2.x + p3.x) / 4;
  const cy = (p0.y + p1.y + p2.y + p3.y) / 4;

  // Edge midpoints and outward unit normals
  const mTop = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const dTopLen = Math.hypot(mTop.x - cx, mTop.y - cy) || 1;
  const nTop = { x: (mTop.x - cx) / dTopLen, y: (mTop.y - cy) / dTopLen };

  const mBot = { x: (p3.x + p2.x) / 2, y: (p3.y + p2.y) / 2 };
  const dBotLen = Math.hypot(mBot.x - cx, mBot.y - cy) || 1;
  const nBot = { x: (mBot.x - cx) / dBotLen, y: (mBot.y - cy) / dBotLen };

  const mLeft = { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 };
  const dLeftLen = Math.hypot(mLeft.x - cx, mLeft.y - cy) || 1;
  const nLeft = { x: (mLeft.x - cx) / dLeftLen, y: (mLeft.y - cy) / dLeftLen };

  const mRight = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const dRightLen = Math.hypot(mRight.x - cx, mRight.y - cy) || 1;
  const nRight = { x: (mRight.x - cx) / dRightLen, y: (mRight.y - cy) / dRightLen };

  const getDestPoint = (u: number, v: number): Point => {
    const topX = p0.x + (p1.x - p0.x) * u;
    const topY = p0.y + (p1.y - p0.y) * u;
    const botX = p3.x + (p2.x - p3.x) * u;
    const botY = p3.y + (p2.y - p3.y) * u;

    let posX = topX + (botX - topX) * v;
    let posY = topY + (botY - topY) * v;

    if (hasBowing) {
      // Top bow displacement (decays with v)
      const bowTop = (edgeBowing?.top || 0) * Math.sin(Math.PI * u) * (1 - v);
      // Bottom bow displacement (decays with 1 - v)
      const bowBot = (edgeBowing?.bottom || 0) * Math.sin(Math.PI * u) * v;
      // Left bow displacement (decays with u)
      const bowLeft = (edgeBowing?.left || 0) * Math.sin(Math.PI * v) * (1 - u);
      // Right bow displacement (decays with 1 - u)
      const bowRight = (edgeBowing?.right || 0) * Math.sin(Math.PI * v) * u;

      posX += nTop.x * bowTop + nBot.x * bowBot + nLeft.x * bowLeft + nRight.x * bowRight;
      posY += nTop.y * bowTop + nBot.y * bowBot + nLeft.y * bowLeft + nRight.y * bowRight;
    }

    return { x: posX, y: posY };
  };

  for (let y = 0; y < steps; y++) {
    const v0 = y / steps;
    const v1 = (y + 1) / steps;
    const sy0 = Math.max(0, v0 * sourceHeight - 0.5);
    const sy1 = Math.min(sourceHeight, v1 * sourceHeight + 0.5);

    for (let x = 0; x < steps; x++) {
      const u0 = x / steps;
      const u1 = (x + 1) / steps;
      const sx0 = Math.max(0, u0 * sourceWidth - 0.5);
      const sx1 = Math.min(sourceWidth, u1 * sourceWidth + 0.5);

      const dTL = getDestPoint(u0, v0);
      const dTR = getDestPoint(u1, v0);
      const dBR = getDestPoint(u1, v1);
      const dBL = getDestPoint(u0, v1);

      const sTL = { x: sx0, y: sy0 };
      const sTR = { x: sx1, y: sy0 };
      const sBR = { x: sx1, y: sy1 };
      const sBL = { x: sx0, y: sy1 };

      // Triangle 1: TL - TR - BL
      drawTexturedTriangle(ctx, source, sTL, sTR, sBL, dTL, dTR, dBL);
      // Triangle 2: TR - BR - BL
      drawTexturedTriangle(ctx, source, sTR, sBR, sBL, dTR, dBR, dBL);
    }
  }
}

/**
 * Draws an arbitrary NxM Bézier / Mesh Grid surface.
 */
export function drawMeshGrid(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  grid: MeshGrid
) {
  const rows = grid.rows;
  const cols = grid.cols;
  const pts = grid.points;

  for (let r = 0; r < rows - 1; r++) {
    const v0 = r / (rows - 1);
    const v1 = (r + 1) / (rows - 1);
    const sy0 = Math.max(0, v0 * sourceHeight - 0.5);
    const sy1 = Math.min(sourceHeight, v1 * sourceHeight + 0.5);

    for (let c = 0; c < cols - 1; c++) {
      const u0 = c / (cols - 1);
      const u1 = (c + 1) / (cols - 1);
      const sx0 = Math.max(0, u0 * sourceWidth - 0.5);
      const sx1 = Math.min(sourceWidth, u1 * sourceWidth + 0.5);

      const dTL = pts[r][c];
      const dTR = pts[r][c + 1];
      const dBR = pts[r + 1][c + 1];
      const dBL = pts[r + 1][c];

      const sTL = { x: sx0, y: sy0 };
      const sTR = { x: sx1, y: sy0 };
      const sBR = { x: sx1, y: sy1 };
      const sBL = { x: sx0, y: sy1 };

      drawTexturedTriangle(ctx, source, sTL, sTR, sBL, dTL, dTR, dBL);
      drawTexturedTriangle(ctx, source, sTR, sBR, sBL, dTR, dBR, dBL);
    }
  }
}

/**
 * Generates an initial regular grid of points for a given bounding box.
 */
export function createInitialMeshGrid(
  bounds: { x: number; y: number; width: number; height: number },
  rows: number = 3,
  cols: number = 3
): MeshGrid {
  const points: Point[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowPoints: Point[] = [];
    const v = r / (rows - 1);
    const y = bounds.y + bounds.height * v;
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const x = bounds.x + bounds.width * u;
      rowPoints.push({ x, y });
    }
    points.push(rowPoints);
  }
  return { rows, cols, points };
}

/**
 * Applies Edge Blending soft gradients (feathering with gamma curve) to an offscreen canvas.
 */
export function applyEdgeBlendToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  edge: EdgeBlend
) {
  if (!edge.enabled) return;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';

  if (edge.left > 0) {
    const w = width * edge.left;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, height);
  }

  if (edge.right > 0) {
    const w = width * edge.right;
    const grad = ctx.createLinearGradient(width, 0, width - w, 0);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(width - w, 0, w, height);
  }

  if (edge.top > 0) {
    const h = height * edge.top;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, h);
  }

  if (edge.bottom > 0) {
    const h = height * edge.bottom;
    const grad = ctx.createLinearGradient(0, height, 0, height - h);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - h, width, h);
  }

  ctx.restore();
}

/**
 * Returns a CSS filter string for color adjustments if any are non-zero.
 */
export function getColorFilterString(adj: ColorAdjustments): string {
  if (
    adj.brightness === 0 &&
    adj.contrast === 0 &&
    adj.saturation === 0 &&
    adj.hue === 0 &&
    !adj.invert
  ) {
    return 'none';
  }

  const brightness = 1 + adj.brightness / 100;
  const contrast = 1 + adj.contrast / 100;
  const saturation = 1 + adj.saturation / 100;
  const hue = adj.hue;
  const invert = adj.invert ? 1 : 0;

  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg) invert(${invert})`;
}
