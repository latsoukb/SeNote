import { getTemplateImageUrl, PAGE_W, PAGE_H } from './pageDimensions';

export const normalizeTemplateId = (templateId) => {
  if (templateId === 'calligraphy' || templateId === 'music-large') return 'music';
  // Ancien quadrillé CSS → image PDF
  if (templateId === 'grid-css') return 'grid';
  return templateId;
};

export const isPdfPage = (page) => Boolean(page?.pdfBackground);

export const isImageTemplate = (templateId) =>
  Boolean(getTemplateImageUrl(normalizeTemplateId(templateId)));

export const getPaperClass = (templateId) => {
  const id = normalizeTemplateId(templateId);
  const map = {
    lined: 'paper-lined',
    dotted: 'paper-dotted',
  };
  return map[id] || '';
};

/** Ajuste la taille des motifs CSS quand le zoom d'écriture agrandit la page. */
export const getPaperZoomStyle = (templateId, zoom = 1) => {
  if (!zoom || zoom <= 1.01 || isImageTemplate(templateId)) return undefined;
  const id = normalizeTemplateId(templateId);
  const z = zoom;
  if (id === 'dotted') {
    const cell = 22 * z;
    return { backgroundSize: `${cell}px ${cell}px` };
  }
  if (id === 'lined') {
    return { backgroundSize: `100% ${32 * z}px` };
  }
  return undefined;
};

export const getTemplateBackground = (templateId) => {
  const id = normalizeTemplateId(templateId);
  const src = getTemplateImageUrl(id);
  if (src) {
    return {
      type: 'image',
      src,
      fit: 'fill',
    };
  }
  if (id === 'blank') {
    return { type: 'css', className: 'bg-white' };
  }
  return { type: 'css', className: getPaperClass(id) };
};

/** Fond d'une page (modèle ou PDF importé) */
export const getPageBackground = (page) => {
  if (page?.pdfBackground) {
    return { type: 'image', src: page.pdfBackground, fit: 'fill' };
  }
  return getTemplateBackground(page?.template || 'seyes');
};

/** Dessine le fond page sur canvas (pleine résolution) */
export const drawTemplateBackground = (ctx, templateId, destW, destH) => {
  const id = normalizeTemplateId(templateId);
  if (isImageTemplate(id)) return 'image';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, destW, destH);

  const sy = destH / PAGE_H;
  const line = (rgba, y1, y2 = y1 + 1) => {
    ctx.fillStyle = rgba;
    ctx.fillRect(0, y1 * sy, destW, Math.max(1, (y2 - y1) * sy));
  };

  if (id === 'lined') {
    for (let y = 32; y < PAGE_H; y += 32) line('rgba(148,163,184,0.35)', y, y + 1);
    return 'css';
  }
  if (id === 'dotted') {
    const step = 22;
    const sx = destW / PAGE_W;
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    for (let y = step; y < PAGE_H; y += step) {
      for (let x = step; x < PAGE_W; x += step) {
        ctx.beginPath();
        ctx.arc(x * sx, y * sy, 1.2 * sx, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return 'css';
  }
  return 'css';
};
