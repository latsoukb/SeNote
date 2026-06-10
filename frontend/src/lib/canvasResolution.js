import { PAGE_W, PAGE_H } from './pageDimensions';

const MAX_PIXEL_SCALE = 4;

/** Résolution bitmap = DPR × zoom d'écriture (plafonnée) pour éviter l'encre pixelisée. */
export const getCanvasPixelScale = (effectiveZoom = 1) => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(MAX_PIXEL_SCALE, Math.max(1, dpr) * Math.max(1, effectiveZoom));
};

export const configureCanvas2d = (canvas, pixelScale) => {
  if (!canvas) return null;
  canvas.width = Math.round(PAGE_W * pixelScale);
  canvas.height = Math.round(PAGE_H * pixelScale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  return ctx;
};
