import { jsPDF } from 'jspdf';
import { PAGE_W, PAGE_H, SEYES_BG } from './pageDimensions';
import { getTemplateBackground, drawTemplateBackground } from './pageTemplates';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const drawStroke = (ctx, s) => {
  if (s.shape) {
    const sh = s.shape;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (sh.type === 'line') {
      ctx.moveTo(sh.x1, sh.y1);
      ctx.lineTo(sh.x2, sh.y2);
    } else if (sh.type === 'circle') {
      ctx.arc(sh.cx, sh.cy, sh.r, 0, Math.PI * 2);
    } else if (sh.type === 'rect') {
      ctx.rect(sh.x, sh.y, sh.w, sh.h);
    } else if (sh.type === 'arc') {
      ctx.arc(sh.cx, sh.cy, sh.r, sh.startAngle, sh.endAngle);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (!s.points?.length) return;
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.type === 'highlighter') ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) {
    ctx.lineTo(s.points[i].x, s.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
};

const renderPageToCanvas = async (page, seyesImg) => {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const bg = getTemplateBackground(page.template);
  if (bg.type === 'image' && seyesImg) {
    ctx.drawImage(seyesImg, 0, 0, PAGE_W, PAGE_H);
  } else {
    drawTemplateBackground(ctx, page.template, PAGE_W, PAGE_H);
  }

  (page.strokes || []).forEach((s) => drawStroke(ctx, s));

  (page.textBoxes || []).forEach((t) => {
    ctx.fillStyle = t.color || '#0F172A';
    ctx.font = `${t.size || 16}px Inter, sans-serif`;
    const lines = (t.text || '').split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, t.x, t.y + (i + 1) * (t.size || 16) * 1.1);
    });
  });

  return canvas;
};

export const exportNotebookToPdf = async (notebook) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  let seyesImg = null;
  try {
    seyesImg = await loadImage(SEYES_BG);
  } catch {
    /* optional */
  }

  for (let i = 0; i < notebook.pages.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await renderPageToCanvas(notebook.pages[i], seyesImg);
    const data = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(data, 'JPEG', 0, 0, 595, 842);
  }

  pdf.save(`${notebook.title || 'cahier'}.pdf`);
};
