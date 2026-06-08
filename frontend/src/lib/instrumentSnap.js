const rotatePoint = (x, y, cx, cy, rad) => {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

export const RULER_THICKNESS = 36;

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

/** Projette sur la ligne centrale puis accroche au bord le plus proche (haut ou bas) */
export const projectOnRuler = (pos, ruler, threshold = 30) => {
  const { a, b, rad, cx, cy } = getRulerSegment(ruler);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return null;

  let t = ((pos.x - a.x) * dx + (pos.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx2 = a.x + t * dx;
  const cy2 = a.y + t * dy;

  const nx = -Math.sin(rad);
  const ny = Math.cos(rad);
  const half = RULER_THICKNESS / 2;

  const top = { x: cx2 + nx * half, y: cy2 + ny * half };
  const bottom = { x: cx2 - nx * half, y: cy2 - ny * half };

  const dTop = Math.hypot(pos.x - top.x, pos.y - top.y);
  const dBottom = Math.hypot(pos.x - bottom.x, pos.y - bottom.y);
  const dCenter = Math.hypot(pos.x - cx2, pos.y - cy2);

  if (Math.min(dTop, dBottom, dCenter) > threshold) return null;

  const useTop = dTop <= dBottom;
  const edge = useTop ? top : bottom;
  return { x: edge.x, y: edge.y, t, onRuler: true, edge: useTop ? 'top' : 'bottom' };
};

export const snapToInstruments = (pos, instruments, threshold = 30) => {
  const ruler = instruments?.find((i) => i.type === 'ruler');
  if (!ruler) return { ...pos, onRuler: false };
  const hit = projectOnRuler(pos, ruler, threshold);
  if (hit) return { ...hit, pressure: pos.pressure };
  return { ...pos, onRuler: false };
};

/** Teste si le point est sur le corps de la règle (pas seulement le bord) */
export const hitRulerBody = (pos, ruler) => {
  const { a, b, rad, cx, cy } = getRulerSegment(ruler);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return false;
  let t = ((pos.x - a.x) * dx + (pos.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  const d = Math.hypot(pos.x - px, pos.y - py);
  return d < RULER_THICKNESS / 2 + 6;
};

export const defaultRuler = (cx = 450, cy = 640) => ({
  id: `inst-${Math.random().toString(36).slice(2, 9)}`,
  type: 'ruler',
  x: cx,
  y: cy,
  rotation: 0,
  length: 500,
});
