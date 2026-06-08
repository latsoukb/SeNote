import { shapeToPoints } from './shapeGeometry';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const boundingBox = (points) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
};

const pathLength = (points) => {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += dist(points[i - 1], points[i]);
  return len;
};

const perpendicularDist = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
};

const rdp = (points, epsilon) => {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD < epsilon) return [first, last];
  const left = rdp(points.slice(0, idx + 1), epsilon);
  const right = rdp(points.slice(idx), epsilon);
  return [...left.slice(0, -1), ...right];
};

const mergeNearby = (pts, threshold) => {
  const out = [];
  pts.forEach((p) => {
    if (!out.some((q) => dist(p, q) < threshold)) out.push(p);
  });
  return out;
};

/** Régression cercle — méthode algébrique (least squares) */
const fitCircleAlgebraic = (points) => {
  const n = points.length;
  let sx = 0, sy = 0, sx2 = 0, sy2 = 0, sxy = 0;
  let sx3 = 0, sy3 = 0, sx2y = 0, sxy2 = 0;

  points.forEach((p) => {
    const x = p.x;
    const y = p.y;
    sx += x;
    sy += y;
    sx2 += x * x;
    sy2 += y * y;
    sxy += x * y;
    sx3 += x * x * x;
    sy3 += y * y * y;
    sx2y += x * x * y;
    sxy2 += x * y * y;
  });

  const C = n * sx2 - sx * sx;
  const D = n * sxy - sx * sy;
  const E = n * sy2 - sy * sy;
  const G = 0.5 * (n * sx3 + n * sxy2 - sx * (sx2 + sy2));
  const H = 0.5 * (n * sy3 + n * sx2y - sy * (sx2 + sy2));
  const denom = C * E - D * D;

  if (Math.abs(denom) < 1e-4) {
    const box = boundingBox(points);
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    const r = (box.w + box.h) / 4;
    return { cx, cy, r, err: r * 0.2 };
  }

  const cx = (G * E - H * D) / denom;
  const cy = (C * H - D * G) / denom;
  let rSum = 0;
  points.forEach((p) => {
    rSum += dist(p, { x: cx, y: cy });
  });
  const r = rSum / n;
  const err =
    points.reduce((e, p) => e + Math.abs(dist(p, { x: cx, y: cy }) - r), 0) / n;
  return { cx, cy, r, err };
};

const fitLine = (points) => {
  const n = points.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  points.forEach((p) => {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
  });
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1) {
    return { x1: points[0].x, y1: points[0].y, x2: points[n - 1].x, y2: points[n - 1].y };
  }
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  const x1 = points[0].x;
  const x2 = points[n - 1].x;
  return { x1, y1: m * x1 + b, x2, y2: m * x2 + b };
};

const lineError = (points, line) => {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.hypot(dx, dy) || 1;
  let err = 0;
  points.forEach((p) => {
    const t = ((p.x - line.x1) * dx + (p.y - line.y1) * dy) / (len * len);
    const px = line.x1 + t * dx;
    const py = line.y1 + t * dy;
    err += Math.hypot(p.x - px, p.y - py);
  });
  return err / points.length;
};

const circularityOf = (points, box) => {
  const plen = pathLength(points);
  const area = box.w * box.h;
  return (4 * Math.PI * area) / (plen * plen || 1);
};

const edgeRatio = (points, box) => {
  const onEdge = points.filter(
    (p) =>
      Math.abs(p.x - box.minX) < box.w * 0.14 ||
      Math.abs(p.x - box.maxX) < box.w * 0.14 ||
      Math.abs(p.y - box.minY) < box.h * 0.14 ||
      Math.abs(p.y - box.maxY) < box.h * 0.14
  ).length;
  return onEdge / points.length;
};

const getMainVerts = (points, size) => {
  const simplified = rdp(points, size * 0.1);
  let verts = simplified;
  if (verts.length > 2 && dist(verts[0], verts[verts.length - 1]) < size * 0.2) {
    verts = verts.slice(0, -1);
  }
  return mergeNearby(verts, size * 0.12);
};

const fitRectangle = (points, size, forceSquare) => {
  const verts = getMainVerts(points, size);
  const box = boundingBox(points);

  if (verts.length === 4) {
    const xs = verts.map((v) => v.x);
    const ys = verts.map((v) => v.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const w = Math.max(...xs) - x;
    const h = Math.max(...ys) - y;
    if (forceSquare) {
      const s = Math.max(w, h);
      const cx = x + w / 2;
      const cy = y + h / 2;
      return { x: cx - s / 2, y: cy - s / 2, w: s, h: s };
    }
    return { x, y, w, h };
  }

  return forceSquare ? makeSquare(box) : { x: box.minX, y: box.minY, w: box.w, h: box.h };
};

const makeSquare = (box) => {
  const s = Math.max(box.w, box.h);
  const cx = box.minX + box.w / 2;
  const cy = box.minY + box.h / 2;
  return { x: cx - s / 2, y: cy - s / 2, w: s, h: s };
};

const pickTriangleVerts = (points, size) => {
  const verts = getMainVerts(points, size);
  if (verts.length >= 3) return verts.slice(0, 3);
  const box = boundingBox(points);
  return [
    { x: box.minX + box.w / 2, y: box.minY },
    { x: box.maxX, y: box.maxY },
    { x: box.minX, y: box.maxY },
  ];
};

const fitLineEndpoints = (points) => {
  const line = fitLine(points);
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  let minT = Infinity;
  let maxT = -Infinity;
  let p1 = points[0];
  let p2 = points[points.length - 1];

  points.forEach((p) => {
    const t = (p.x - line.x1) * ux + (p.y - line.y1) * uy;
    if (t < minT) {
      minT = t;
      p1 = { x: line.x1 + ux * t, y: line.y1 + uy * t };
    }
    if (t > maxT) {
      maxT = t;
      p2 = { x: line.x1 + ux * t, y: line.y1 + uy * t };
    }
  });

  return { type: 'line', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
};

/** Traits cursive / écriture — ne pas convertir en forme géométrique */
export const looksLikeHandwriting = (points) => {
  if (!points || points.length < 10) return false;
  let reversals = 0;
  let lastAngle = null;
  const step = Math.max(2, Math.floor(points.length / 15));
  for (let i = step; i < points.length; i += step) {
    const dx = points[i].x - points[i - step].x;
    const dy = points[i].y - points[i - step].y;
    if (dx * dx + dy * dy < 4) continue;
    const angle = Math.atan2(dy, dx);
    if (lastAngle !== null) {
      let diff = angle - lastAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 0.65) reversals++;
    }
    lastAngle = angle;
  }
  const start = points[0];
  const end = points[points.length - 1];
  const chord = dist(start, end);
  let plen = 0;
  for (let i = 1; i < points.length; i++) plen += dist(points[i - 1], points[i]);
  return reversals >= 3 && plen > chord * 1.6;
};

export const detectShape = (points, options = {}) => {
  if (!points || points.length < 16) return null;

  const box = boundingBox(points);
  const size = Math.max(box.w, box.h);
  if (size < 80) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const gap = dist(start, end);
  const plen = pathLength(points);
  const closed = gap < size * 0.28 || (gap < size * 0.42 && plen > gap * 2);

  const verts = getMainVerts(points, size);
  const edges = edgeRatio(points, box);
  const circle = fitCircleAlgebraic(points);
  const relErr = circle.err / (circle.r || 1);
  const circ = circularityOf(points, box);
  const aspect = box.w / (box.h || 1);

  if (options.forceSquare) {
    return { type: 'rect', ...fitRectangle(points, size, true) };
  }
  if (options.forceCircle) {
    return { type: 'circle', cx: circle.cx, cy: circle.cy, r: circle.r, rx: circle.r, ry: circle.r };
  }

  if (closed && relErr < 0.08 && circ > 0.78 && aspect > 0.55 && aspect < 1.85) {
    return { type: 'circle', cx: circle.cx, cy: circle.cy, r: circle.r, rx: circle.r, ry: circle.r };
  }

  if (closed && edges > 0.75 && relErr > 0.05 && circ < 0.86 && box.w > 30 && box.h > 30) {
    return { type: 'rect', ...fitRectangle(points, size, false) };
  }

  if (verts.length === 4 && box.w > 30 && box.h > 30) {
    return { type: 'rect', ...fitRectangle(points, size, false) };
  }

  if (verts.length === 3) {
    const [a, b, c] = verts;
    return { type: 'triangle', x1: a.x, y1: a.y, x2: b.x, y2: b.y, x3: c.x, y3: c.y };
  }

  if (!closed) {
    const chord = dist(start, end);
    if (lineError(points, fitLine(points)) < size * 0.08 && chord > size * 0.35) {
      return fitLineEndpoints(points);
    }
    if (verts.length >= 3 && verts.length <= 4) {
      const [a, b, c] = pickTriangleVerts(points, size);
      return { type: 'triangle', x1: a.x, y1: a.y, x2: b.x, y2: b.y, x3: c.x, y3: c.y };
    }
    return null;
  }

  if (verts.length >= 3 && verts.length <= 4 && edges < 0.78) {
    const [a, b, c] = pickTriangleVerts(points, size);
    return { type: 'triangle', x1: a.x, y1: a.y, x2: b.x, y2: b.y, x3: c.x, y3: c.y };
  }

  return null;
};

export const shapeToStroke = (shape, color, thickness, tool = 'pen') => {
  const base = { id: null, type: tool, color, thickness, shape };
  const pts = shapeToPoints(shape);
  return pts.length ? { ...base, points: pts } : null;
};
