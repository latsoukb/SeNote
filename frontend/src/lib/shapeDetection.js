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

const mergeNearby = (pts, threshold) => {
  const out = [];
  pts.forEach((p) => {
    if (!out.some((q) => dist(p, q) < threshold)) out.push(p);
  });
  return out;
};

const fitCircle = (points) => {
  const box = boundingBox(points);
  let cx = (box.minX + box.maxX) / 2;
  let cy = (box.minY + box.maxY) / 2;
  let r = (box.w + box.h) / 4;
  for (let iter = 0; iter < 4; iter++) {
    let n = 0;
    let sx = 0, sy = 0, sr = 0;
    points.forEach((p) => {
      const d = dist(p, { x: cx, y: cy }) || 0.001;
      const w = 1 / d;
      sx += w * p.x;
      sy += w * p.y;
      sr += w * d;
      n += w;
    });
    if (n > 0) {
      cx = sx / n;
      cy = sy / n;
      r = sr / n;
    }
  }
  const err =
    points.reduce((e, p) => e + Math.abs(dist(p, { x: cx, y: cy }) - r), 0) / points.length;
  return { cx, cy, r, err };
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

const detectArrow = (points, size) => {
  if (points.length < 14) return null;
  const split = Math.floor(points.length * 0.82);
  const shaft = points.slice(0, split);
  const head = points.slice(split);
  if (shaft.length < 8 || head.length < 4) return null;
  const line = fitLine(shaft);
  if (lineError(shaft, line) > size * 0.08) return null;
  const tip = points[points.length - 1];
  const headLen = dist(head[0], tip);
  if (headLen < size * 0.06 || headLen > size * 0.38) return null;
  const headOff = head.filter((p) => perpendicularDist(p, line) > size * 0.05).length;
  if (headOff < 2) return null;
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const headSize = Math.min(size * 0.2, len * 0.35);
  return {
    type: 'arrow',
    x1: line.x1,
    y1: line.y1,
    x2: tip.x,
    y2: tip.y,
    headLeft: {
      x: tip.x - ux * headSize - uy * headSize * 0.55,
      y: tip.y - uy * headSize + ux * headSize * 0.55,
    },
    headRight: {
      x: tip.x - ux * headSize + uy * headSize * 0.55,
      y: tip.y - uy * headSize - ux * headSize * 0.55,
    },
  };
};

const getMainVerts = (points, size) => {
  const simplified = rdp(points, size * 0.1);
  let verts = simplified;
  if (verts.length > 2 && dist(verts[0], verts[verts.length - 1]) < size * 0.2) {
    verts = verts.slice(0, -1);
  }
  return mergeNearby(verts, size * 0.12);
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

const makeRect = (box, forceSquare) => {
  let { minX, minY, w, h } = { minX: box.minX, minY: box.minY, w: box.w, h: box.h };
  if (forceSquare) {
    const s = Math.max(w, h);
    const cx = minX + w / 2;
    const cy = minY + h / 2;
    return { x: cx - s / 2, y: cy - s / 2, w: s, h: s };
  }
  return { x: minX, y: minY, w, h };
};

export const detectShape = (points, options = {}) => {
  if (!points || points.length < 8) return null;

  const box = boundingBox(points);
  const size = Math.max(box.w, box.h);
  if (size < 55) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const gap = dist(start, end);
  const plen = pathLength(points);
  const closed = gap < size * 0.28 || (gap < size * 0.42 && plen > gap * 2);

  const verts = getMainVerts(points, size);
  const edges = edgeRatio(points, box);
  const { cx, cy, r, err } = fitCircle(points);
  const relErr = err / (r || 1);
  const circ = circularityOf(points, box);
  const aspect = box.w / (box.h || 1);

  if (options.forceSquare && (verts.length >= 3 || edges > 0.4)) {
    return { type: 'rect', ...makeRect(box, true) };
  }
  if (options.forceCircle) {
    return { type: 'circle', cx, cy, r: Math.max(r, (box.w + box.h) / 4) };
  }

  if (closed && relErr < 0.07 && circ > 0.82 && aspect > 0.55 && aspect < 1.8) {
    return { type: 'circle', cx, cy, r };
  }

  if (
    closed &&
    edges > 0.78 &&
    relErr > 0.06 &&
    circ < 0.84 &&
    box.w > 30 &&
    box.h > 30
  ) {
    return { type: 'rect', ...makeRect(box, false) };
  }

  if (verts.length === 4 && box.w > 30 && box.h > 30) {
    return { type: 'rect', ...makeRect(box, false) };
  }

  if (verts.length === 3) {
    const [a, b, c] = verts;
    return { type: 'triangle', x1: a.x, y1: a.y, x2: b.x, y2: b.y, x3: c.x, y3: c.y };
  }

  if (!closed) {
    const line = fitLine(points);
    const chord = dist(start, end);
    if (lineError(points, line) < size * 0.08 && chord > size * 0.38) {
      return { type: 'line', ...line };
    }
    const arrow = detectArrow(points, size);
    if (arrow) return arrow;
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
  if (shape.type === 'line') {
    return {
      ...base,
      points: [
        { x: shape.x1, y: shape.y1 },
        { x: shape.x2, y: shape.y2 },
      ],
    };
  }
  if (shape.type === 'arrow') {
    return {
      ...base,
      points: [
        { x: shape.x1, y: shape.y1 },
        { x: shape.x2, y: shape.y2 },
        { x: shape.headLeft.x, y: shape.headLeft.y },
        { x: shape.x2, y: shape.y2 },
        { x: shape.headRight.x, y: shape.headRight.y },
      ],
    };
  }
  if (shape.type === 'circle') {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push({
        x: shape.cx + Math.cos(a) * shape.r,
        y: shape.cy + Math.sin(a) * shape.r,
      });
    }
    return { ...base, points: pts };
  }
  if (shape.type === 'rect') {
    const { x, y, w, h } = shape;
    return {
      ...base,
      points: [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
        { x, y },
      ],
    };
  }
  if (shape.type === 'triangle') {
    return {
      ...base,
      points: [
        { x: shape.x1, y: shape.y1 },
        { x: shape.x2, y: shape.y2 },
        { x: shape.x3, y: shape.y3 },
        { x: shape.x1, y: shape.y1 },
      ],
    };
  }
  return null;
};
