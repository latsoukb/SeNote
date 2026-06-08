/** Moteur d'encre — points coalescés, lissage, zoom focal */

export const clampPan = (pan, zoom, viewW, viewH) => {
  if (zoom <= 1) return { x: 0, y: 0 };
  const minX = viewW - viewW * zoom;
  const minY = viewH - viewH * zoom;
  return {
    x: Math.min(0, Math.max(minX, pan.x)),
    y: Math.min(0, Math.max(minY, pan.y)),
  };
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
