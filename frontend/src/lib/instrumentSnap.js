import { cmToPx } from './pageDimensions';
import { makeId } from './id';

const rotatePoint = (x, y, cx, cy, rad) => {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

/** Largeur visible de la règle / équerre (~1,3 cm sur la page) */
export const RULER_THICKNESS = 56;

export const getRulerLengthPx = (ruler) => {
  if (ruler.lengthCm != null) return cmToPx(ruler.lengthCm);
  return ruler.length || cmToPx(30);
};

export const getSetSquareLegPx = (sq) => cmToPx(sq.legCm ?? 10);

export const getRulerSegment = (ruler) => {
  const rad = ((ruler.rotation || 0) * Math.PI) / 180;
  const len = getRulerLengthPx(ruler);
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

const projectOnSegment = (pos, a, b, thickness, threshold, meta = {}) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return null;

  let t = ((pos.x - a.x) * dx + (pos.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx2 = a.x + t * dx;
  const cy2 = a.y + t * dy;

  const rad = Math.atan2(dy, dx);
  const nx = -Math.sin(rad);
  const ny = Math.cos(rad);
  const half = thickness / 2;

  const top = { x: cx2 + nx * half, y: cy2 + ny * half };
  const bottom = { x: cx2 - nx * half, y: cy2 - ny * half };

  const dTop = Math.hypot(pos.x - top.x, pos.y - top.y);
  const dBottom = Math.hypot(pos.x - bottom.x, pos.y - bottom.y);
  const dCenter = Math.hypot(pos.x - cx2, pos.y - cy2);

  if (Math.min(dTop, dBottom, dCenter) > threshold) return null;

  const useTop = dTop <= dBottom;
  const edge = useTop ? top : bottom;
  return {
    x: edge.x,
    y: edge.y,
    t,
    onRuler: true,
    edge: useTop ? 'top' : 'bottom',
    ...meta,
  };
};

/** Projette sur la ligne centrale puis accroche au bord le plus proche (haut ou bas) */
export const projectOnRuler = (pos, ruler, threshold = 30) => {
  const { a, b } = getRulerSegment(ruler);
  return projectOnSegment(pos, a, b, RULER_THICKNESS, threshold, { leg: null });
};

export const getSetSquareLegs = (sq) => {
  const leg = getSetSquareLegPx(sq);
  const rad = ((sq.rotation || 0) * Math.PI) / 180;
  const corner = { x: sq.x, y: sq.y };
  const leg1End = { x: sq.x + leg * Math.cos(rad), y: sq.y + leg * Math.sin(rad) };
  const leg2End = {
    x: sq.x + leg * Math.cos(rad + Math.PI / 2),
    y: sq.y + leg * Math.sin(rad + Math.PI / 2),
  };
  return { corner, leg1End, leg2End, leg, rad };
};

export const projectOnSetSquare = (pos, sq, threshold = 30) => {
  const { corner, leg1End, leg2End } = getSetSquareLegs(sq);
  const hits = [
    projectOnSegment(pos, corner, leg1End, RULER_THICKNESS, threshold, { leg: 'leg1' }),
    projectOnSegment(pos, corner, leg2End, RULER_THICKNESS, threshold, { leg: 'leg2' }),
  ];
  return hits.filter(Boolean);
};

const edgeKey = (hit) => (hit.leg ? `${hit.leg}-${hit.edge}` : hit.edge);

export const snapToInstruments = (pos, instruments, threshold = 30) => {
  let best = null;
  let bestD = threshold;

  const ruler = instruments?.find((i) => i.type === 'ruler');
  if (ruler) {
    const hit = projectOnRuler(pos, ruler, threshold);
    if (hit) {
      const d = Math.hypot(pos.x - hit.x, pos.y - hit.y);
      if (d < bestD) {
        best = hit;
        bestD = d;
      }
    }
  }

  const sq = instruments?.find((i) => i.type === 'setSquare');
  if (sq) {
    for (const hit of projectOnSetSquare(pos, sq, threshold)) {
      const d = Math.hypot(pos.x - hit.x, pos.y - hit.y);
      if (d < bestD) {
        best = hit;
        bestD = d;
      }
    }
  }

  if (best) return { ...best, pressure: pos.pressure };
  return { ...pos, onRuler: false };
};

export const instrumentEdgeKey = edgeKey;

/** Teste si le point est sur le corps de la règle (pas seulement le bord) */
export const hitRulerBody = (pos, ruler) => {
  const { a, b } = getRulerSegment(ruler);
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

export const createRuler = (lengthCm = 30, cx = 450, cy = 640) => ({
  id: makeId('inst'),
  type: 'ruler',
  x: cx,
  y: cy,
  rotation: 0,
  lengthCm,
});

export const createSetSquare = (legCm = 10, cx = 380, cy = 520) => ({
  id: makeId('inst'),
  type: 'setSquare',
  x: cx,
  y: cy,
  rotation: 0,
  legCm,
});

/** @deprecated utiliser createRuler */
export const defaultRuler = () => createRuler(30);
