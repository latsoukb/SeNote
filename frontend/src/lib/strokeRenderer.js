import { drawShape } from './shapeGeometry';

export const drawStrokePath = (ctx, s) => {
  if (s.shape) {
    drawShape(ctx, s.shape);
    return;
  }
  if (!s.points?.length) return;
  const pts = s.points;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length < 3) {
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  ctx.stroke();
};

export const drawStroke = (ctx, s) => {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.type === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    ctx.lineCap = 'butt';
  }
  drawStrokePath(ctx, s);
  ctx.restore();
};

/** Surligneur en arrière-plan, encre (stylo) au-dessus — texte et traits plus lisibles. */
export const drawStrokesLayered = (ctx, strokes, liveStroke = null) => {
  const list = strokes || [];
  list.filter((s) => s.type === 'highlighter').forEach((s) => drawStroke(ctx, s));
  if (liveStroke?.type === 'highlighter') drawStroke(ctx, liveStroke);
  list.filter((s) => s.type !== 'highlighter').forEach((s) => drawStroke(ctx, s));
  if (liveStroke && liveStroke.type !== 'highlighter') drawStroke(ctx, liveStroke);
};

export const createStaticLayer = () => {
  const c = document.createElement('canvas');
  return c;
};
