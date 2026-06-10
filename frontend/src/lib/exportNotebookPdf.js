import { jsPDF } from 'jspdf';
import { PAGE_W, PAGE_H, SEYES_BG } from './pageDimensions';
import { getPageBackground, drawTemplateBackground } from './pageTemplates';
import { drawStrokesLayered } from './strokeRenderer';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const renderPageToCanvas = async (page, imageCache) => {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const bg = getPageBackground(page);
  if (bg.type === 'image') {
    let img = imageCache.get(bg.src);
    if (!img) {
      img = await loadImage(bg.src);
      imageCache.set(bg.src, img);
    }
    ctx.drawImage(img, 0, 0, PAGE_W, PAGE_H);
  } else {
    drawTemplateBackground(ctx, page.template, PAGE_W, PAGE_H);
  }

  drawStrokesLayered(ctx, page.strokes || []);

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

  const imageCache = new Map();
  try {
    imageCache.set(SEYES_BG, await loadImage(SEYES_BG));
  } catch {
    /* optional */
  }

  for (let i = 0; i < notebook.pages.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await renderPageToCanvas(notebook.pages[i], imageCache);
    const data = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(data, 'JPEG', 0, 0, 595, 842);
  }

  pdf.save(`${notebook.title || 'cahier'}.pdf`);
};
