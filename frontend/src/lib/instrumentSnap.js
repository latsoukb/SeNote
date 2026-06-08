const rotatePoint = (x, y, cx, cy, rad) => {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

export const getRulerSegment = (ruler) => {
  const rad = ((ruler.rotation || 0) * Math.PI) / 180;
  const len = ruler.length || 500;
  const cx = ruler.x;
  const cy = ruler.y;
  return {
    a: rotatePoint(cx - len / 2, cy, cx, cy, rad),
    b: rotatePoint(cx + len / 2, cy, cx, cy, rad),
    cx,
    cy,
    rad,
    len,
  };
};

export const projectOnRuler = (pos, ruler, threshold = 22) => {
  const { a, b } = getRulerSegment(ruler);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return null;
  let t = ((pos.x - a.x) * dx + (pos.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  const d = Math.hypot(pos.x - x, pos.y - y);
  if (d > threshold) return null;
  return { x, y, t, onRuler: true };
};

export const snapToInstruments = (pos, instruments, threshold = 22) => {
  const ruler = instruments?.find((i) => i.type === 'ruler');
  if (!ruler) return { ...pos, onRuler: false };
  const hit = projectOnRuler(pos, ruler, threshold);
  if (hit) return { ...hit, pressure: pos.pressure };
  return { ...pos, onRuler: false };
};

export const defaultRuler = (cx = 450, cy = 640) => ({
  id: `inst-${Math.random().toString(36).slice(2, 9)}`,
  type: 'ruler',
  x: cx,
  y: cy,
  rotation: 0,
  length: 500,
});
