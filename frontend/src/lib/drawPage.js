import { PAGE_W, PAGE_H, getTemplateImageUrl } from './pageDimensions';
import { getPageBackground, drawTemplateBackground } from './pageTemplates';

const imageCache = new Map();
const preloaded = new Set();

const loadBgImage = (src) => {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, p);
  preloaded.add(src);
  return p;
};

const drawPaperFallback = (ctx, templateId, destW, destH) => {
  const id = templateId || 'seyes';
  const mode = drawTemplateBackground(ctx, id, destW, destH);
  if (mode !== 'image') return;
  drawTemplateBackground(ctx, 'lined', destW, destH);
};

const seyesLoad = loadBgImage(getTemplateImageUrl('seyes'));

export const preloadTemplateImages = () => {
  Object.keys({
    seyes: 1,
    grid: 1,
    'grid-margin': 1,
    millimeter: 1,
    music: 1,
  }).forEach((id) => {
    const src = getTemplateImageUrl(id);
    if (src && !preloaded.has(src)) loadBgImage(src);
  });
};

const drawStroke = (ctx, s, sx, sy) => {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.thickness * sx;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.type === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    ctx.lineCap = 'butt';
  }
  ctx.beginPath();
  if (s.shape) {
    const sh = s.shape;
    if (sh.type === 'line') {
      ctx.moveTo(sh.x1 * sx, sh.y1 * sy);
      ctx.lineTo(sh.x2 * sx, sh.y2 * sy);
    } else if (sh.type === 'circle') {
      const rx = (sh.rx ?? sh.r) * sx;
      const ry = (sh.ry ?? sh.r) * sy;
      ctx.ellipse(sh.cx * sx, sh.cy * sy, rx, ry, 0, 0, Math.PI * 2);
    } else if (sh.type === 'rect') {
      ctx.rect(sh.x * sx, sh.y * sy, sh.w * sx, sh.h * sy);
    } else if (sh.type === 'triangle') {
      ctx.moveTo(sh.x1 * sx, sh.y1 * sy);
      ctx.lineTo(sh.x2 * sx, sh.y2 * sy);
      ctx.lineTo(sh.x3 * sx, sh.y3 * sy);
      ctx.closePath();
    } else if (sh.type === 'arrow') {
      ctx.moveTo(sh.x1 * sx, sh.y1 * sy);
      ctx.lineTo(sh.x2 * sx, sh.y2 * sy);
      ctx.moveTo(sh.headLeft.x * sx, sh.headLeft.y * sy);
      ctx.lineTo(sh.x2 * sx, sh.y2 * sy);
      ctx.lineTo(sh.headRight.x * sx, sh.headRight.y * sy);
    }
  } else if (s.points?.length) {
    ctx.moveTo(s.points[0].x * sx, s.points[0].y * sy);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x * sx, s.points[i].y * sy);
    }
  }
  ctx.stroke();
  ctx.restore();
};

export const drawPageToCanvas = async (ctx, page, destW, destH) => {
  const sx = destW / PAGE_W;
  const sy = destH / PAGE_H;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, destW, destH);

  const bg = getPageBackground(page);
  if (bg.type === 'image') {
    const img = await loadBgImage(bg.src);
    if (img) ctx.drawImage(img, 0, 0, destW, destH);
    else drawPaperFallback(ctx, page.template, destW, destH);
  } else {
    drawTemplateBackground(ctx, page.template, destW, destH);
  }

  const strokes = page.strokes || [];
  strokes.filter((s) => s.type === 'highlighter').forEach((s) => drawStroke(ctx, s, sx, sy));
  strokes.filter((s) => s.type !== 'highlighter').forEach((s) => drawStroke(ctx, s, sx, sy));
};

export { seyesLoad };
