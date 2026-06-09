/** Moteur d'encre — points coalescés, lissage, zoom focal */

export const getPanLimits = (zoom, viewW, viewH) => {
  if (zoom <= 1) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return {
    minX: viewW - viewW * zoom,
    minY: viewH - viewH * zoom,
    maxX: 0,
    maxY: 0,
  };
};

export const clampPan = (pan, zoom, viewW, viewH) => {
  if (zoom <= 1) return { x: 0, y: 0 };
  const { minX, minY } = getPanLimits(zoom, viewW, viewH);
  return {
    x: Math.min(0, Math.max(minX, pan.x)),
    y: Math.min(0, Math.max(minY, pan.y)),
  };
};

const EDGE_EPS = 4;

/** Bord atteint + geste qui continue dans la même direction → page suivante/précédente */
export const getPanEdgeOverflow = (pan, zoom, viewW, viewH, deltaX, deltaY, vertical) => {
  if (zoom <= 1.01) return null;
  const { minX, minY } = getPanLimits(zoom, viewW, viewH);
  if (vertical) {
    if (pan.y <= minY + EDGE_EPS && deltaY < 0) return 'next';
    if (pan.y >= -EDGE_EPS && deltaY > 0) return 'prev';
  } else {
    if (pan.x <= minX + EDGE_EPS && deltaX < 0) return 'next';
    if (pan.x >= -EDGE_EPS && deltaX > 0) return 'prev';
  }
  return null;
};

/** Zoom centré sur un point (coordonnées viewport) — modèle GoodNotes */
export const focalPan = (focalX, focalY, prevPan, prevZoom, newZoom) => ({
  x: focalX - (focalX - prevPan.x) * (newZoom / prevZoom),
  y: focalY - (focalY - prevPan.y) * (newZoom / prevZoom),
});

/** Points intermédiaires manqués entre deux events (coalesced / historical) */
export const getCoalescedPointerEvents = (e) => {
  if (typeof e.getCoalescedEvents === 'function') {
    const coalesced = e.getCoalescedEvents();
    if (coalesced?.length) return coalesced;
  }
  return [e];
};

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Filtre le bruit — ignore les micro-mouvements */
export const shouldAddPoint = (last, next, minDist = 0.6) => {
  if (!last) return true;
  return dist2(last, next) >= minDist * minDist;
};

/** Épaisseur selon pression (page coords — indépendant du zoom écran) */
export const pressureWidth = (baseThickness, pressure, tool) => {
  if (tool === 'highlighter') return Math.max(14, baseThickness);
  return baseThickness * (0.35 + (pressure > 0 ? pressure : 0.5) * 0.65);
};
