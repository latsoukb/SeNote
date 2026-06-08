const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const pointNearEraser = (p, eraserPts, radius) => {
  for (let i = 0; i < eraserPts.length; i++) {
    if (dist(p, eraserPts[i]) < radius) return true;
  }
  return false;
};

const sampleShapePoints = (stroke, count = 48) => {
  if (!stroke.shape) return stroke.points || [];
  const pts = stroke.points || [];
  if (pts.length >= 8) return pts;
  const sh = stroke.shape;
  const out = [];
  if (sh.type === 'circle') {
    const rx = sh.rx ?? sh.r;
    const ry = sh.ry ?? sh.r;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      out.push({ x: sh.cx + Math.cos(a) * rx, y: sh.cy + Math.sin(a) * ry });
    }
    return out;
  }
  if (sh.type === 'rect') {
    const { x, y, w, h } = sh;
    return [
      { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
    ];
  }
  if (sh.type === 'triangle') {
    return [
      { x: sh.x1, y: sh.y1 }, { x: sh.x2, y: sh.y2 }, { x: sh.x3, y: sh.y3 },
    ];
  }
  if (sh.type === 'line') {
    return [{ x: sh.x1, y: sh.y1 }, { x: sh.x2, y: sh.y2 }];
  }
  return pts;
};

const fragmentStroke = (stroke, eraserPts, radius) => {
  const pts = sampleShapePoints(stroke);
  if (!pts.length) return [stroke];

  const kept = pts.map((p) => !pointNearEraser(p, eraserPts, radius));
  const anyErased = kept.some((k) => !k);
  const allErased = kept.every((k) => !k);

  if (stroke.shape) {
    return allErased ? [] : anyErased ? [] : [stroke];
  }

  if (!stroke.points?.length) return [stroke];

  const pointKept = stroke.points.map((p) => !pointNearEraser(p, eraserPts, radius));
  const fragments = [];
  let current = [];

  stroke.points.forEach((p, i) => {
    if (pointKept[i]) {
      current.push(p);
    } else if (current.length > 1) {
      fragments.push({ ...stroke, id: `${stroke.id}-f${fragments.length}`, points: [...current] });
      current = [];
    } else {
      current = [];
    }
  });
  if (current.length > 1) {
    fragments.push({ ...stroke, id: `${stroke.id}-f${fragments.length}`, points: current });
  }
  return fragments.length ? fragments : [];
};

export const eraseStrokes = (strokes, eraserPts, radius) => {
  const out = [];
  strokes.forEach((s) => {
    out.push(...fragmentStroke(s, eraserPts, radius));
  });
  return out;
};

const boxHitByEraser = (box, eraserPts, radius) => {
  const w = box.width || Math.max(60, (box.text?.length || 0) * (box.size || 16) * 0.5);
  const lines = Math.max(1, (box.text || '').split('\n').length);
  const h = Math.max((box.size || 16) * 1.4, lines * (box.size || 16) * 1.35);
  const x = box.x;
  const y = box.y;

  return eraserPts.some((p) => {
    const cx = Math.max(x, Math.min(p.x, x + w));
    const cy = Math.max(y, Math.min(p.y, y + h));
    return dist(p, { x: cx, y: cy }) < radius;
  });
};

export const eraseTextBoxes = (boxes, eraserPts, radius) => {
  return (boxes || []).filter((b) => !boxHitByEraser(b, eraserPts, radius));
};

export const eraseInstruments = (instruments, eraserPts, radius) => {
  return (instruments || []).filter((inst) => {
    if (inst.type !== 'ruler') return true;
    return !eraserPts.some((p) => dist(p, { x: inst.x, y: inst.y }) < radius + 40);
  });
};

export const isScribbleGesture = (points) => {
  if (!points || points.length < 18) return false;
  let reversals = 0;
  let lastAngle = null;
  const step = Math.max(2, Math.floor(points.length / 20));
  for (let i = step; i < points.length; i += step) {
    const dx = points[i].x - points[i - step].x;
    const dy = points[i].y - points[i - step].y;
    const angle = Math.atan2(dy, dx);
    if (lastAngle !== null) {
      let diff = angle - lastAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 1.1) reversals++;
    }
    lastAngle = angle;
  }
  const box = points.reduce(
    (b, p) => ({
      minX: Math.min(b.minX, p.x),
      minY: Math.min(b.minY, p.y),
      maxX: Math.max(b.maxX, p.x),
      maxY: Math.max(b.maxY, p.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
  const size = Math.max(box.maxX - box.minX, box.maxY - box.minY, 1);
  let plen = 0;
  for (let i = 1; i < points.length; i++) plen += dist(points[i - 1], points[i]);
  return reversals >= 4 && plen > size * 2.8 && size > 30;
};

export const strokesUnderScribble = (strokes, scribblePts, radius) => {
  return strokes.filter((s) =>
    sampleShapePoints(s).some((p) => pointNearEraser(p, scribblePts, radius * 1.2))
  );
};

export const textBoxesUnderScribble = (boxes, scribblePts, radius) => {
  return (boxes || []).filter((b) => boxHitByEraser(b, scribblePts, radius));
};
