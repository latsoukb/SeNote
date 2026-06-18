import { PAGE_W, PAGE_H, getTemplateImageUrl } from './pageDimensions';
import { getPageBackground, drawTemplateOnCanvas } from './pageTemplates';
import { isNativeApp } from './platform';

const imageCache = new Map();

const loadImageFromUrl = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

const bytesToImage = async (bytes, mime = 'image/png') => {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mime });
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImageFromUrl(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const loadBgImageNative = async (src) => {
  try {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.get({ url: src, responseType: 'arraybuffer' });
    if (res.status < 200 || res.status >= 300 || !res.data) return null;
    return bytesToImage(res.data);
  } catch {
    return null;
  }
};

const loadBgImage = async (src) => {
  if (!src) return null;
  if (imageCache.has(src)) return imageCache.get(src);

  const p = (async () => {
    if (isNativeApp()) {
      const nativeImg = await loadBgImageNative(src);
      if (nativeImg) return nativeImg;
    }
    return loadImageFromUrl(src);
  })();

  imageCache.set(src, p);
  return p;
};

const seyesLoad = loadBgImage(getTemplateImageUrl('seyes'));

export const preloadTemplateImages = async () => {
  const ids = ['seyes', 'grid', 'grid-margin', 'millimeter', 'music'];
  await Promise.all(
    ids.map((id) => {
      const src = getTemplateImageUrl(id);
      return src ? loadBgImage(src) : Promise.resolve(null);
    })
  );
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

export const drawPageToCanvas = async (ctx, page, destW, destH, { forExport = false } = {}) => {
  const sx = destW / PAGE_W;
  const sy = destH / PAGE_H;
  const templateId = page?.template || 'seyes';

  if (forExport) {
    drawTemplateOnCanvas(ctx, templateId, destW, destH);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, destW, destH);
  }

  const bg = getPageBackground(page);
  if (bg.type === 'image') {
    const img = await loadBgImage(bg.src);
    if (img) ctx.drawImage(img, 0, 0, destW, destH);
    else if (!forExport) drawTemplateOnCanvas(ctx, templateId, destW, destH);
  } else if (!forExport) {
    drawTemplateOnCanvas(ctx, templateId, destW, destH);
  }

  const strokes = page.strokes || [];
  strokes.filter((s) => s.type === 'highlighter').forEach((s) => drawStroke(ctx, s, sx, sy));
  strokes.filter((s) => s.type !== 'highlighter').forEach((s) => drawStroke(ctx, s, sx, sy));
};

export { seyesLoad };
