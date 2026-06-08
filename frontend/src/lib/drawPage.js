import { PAGE_W, PAGE_H, SEYES_BG } from './pageDimensions';
import { getTemplateBackground } from './pageTemplates';

let seyesImage = null;
const seyesLoad = new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    seyesImage = img;
    resolve(img);
  };
  img.onerror = () => resolve(null);
  img.src = SEYES_BG;
});

const drawStroke = (ctx, s, sx, sy) => {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.thickness * sx;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.type === 'highlighter') {
    ctx.globalAlpha = 0.35;
    ctx.lineCap = 'butt';
  }
  ctx.beginPath();
  if (s.shape) {
    const sh = s.shape;
    if (sh.type === 'line') {
      ctx.moveTo(sh.x1 * sx, sh.y1 * sy);
      ctx.lineTo(sh.x2 * sx, sh.y2 * sy);
    } else if (sh.type === 'circle') {
      ctx.arc(sh.cx * sx, sh.cy * sy, sh.r * sx, 0, Math.PI * 2);
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

export const drawPageToCanvas = (ctx, page, destW, destH) => {
  const sx = destW / PAGE_W;
  const sy = destH / PAGE_H;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, destW, destH);

  const bg = getTemplateBackground(page.template);
  if (bg.type === 'image' && seyesImage) {
    ctx.drawImage(seyesImage, 0, 0, destW, destH);
  } else if (bg.className) {
    // CSS templates not available on canvas — light hint only
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    for (let y = 32 * sy; y < destH; y += 32 * sy) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(destW, y);
      ctx.stroke();
    }
  }

  (page.strokes || []).forEach((s) => drawStroke(ctx, s, sx, sy));
};

export { seyesLoad };
