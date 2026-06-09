import { SEYES_BG, PAGE_W, PAGE_H } from './pageDimensions';

export const normalizeTemplateId = (templateId) => {
  if (templateId === 'calligraphy' || templateId === 'music-large') return 'music';
  return templateId;
};

export const isPdfPage = (page) => Boolean(page?.pdfBackground);

export const getPaperClass = (templateId) => {
  const id = normalizeTemplateId(templateId);
  const map = {
    lined: 'paper-lined',
    grid: 'paper-grid',
    dotted: 'paper-dotted',
    music: 'paper-music',
  };
  return map[id] || '';
};

export const getTemplateBackground = (templateId) => {
  const id = normalizeTemplateId(templateId);
  if (id === 'seyes') {
    return { type: 'image', src: SEYES_BG };
  }
  if (id === 'blank') {
    return { type: 'css', className: 'bg-white' };
  }
  return { type: 'css', className: getPaperClass(id) };
};

/** Fond d'une page (modèle ou PDF importé) */
export const getPageBackground = (page) => {
  if (page?.pdfBackground) {
    return { type: 'image', src: page.pdfBackground };
  }
  return getTemplateBackground(page?.template || 'seyes');
};

/** Dessine le fond page sur canvas (pleine résolution) */
export const drawTemplateBackground = (ctx, templateId, destW, destH) => {
  const id = normalizeTemplateId(templateId);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, destW, destH);

  const sx = destW / PAGE_W;
  const sy = destH / PAGE_H;
  const line = (rgba, y1, y2 = y1 + 1) => {
    ctx.fillStyle = rgba;
    ctx.fillRect(0, y1 * sy, destW, Math.max(1, (y2 - y1) * sy));
  };

  if (id === 'seyes') return 'image';

  if (id === 'lined') {
    for (let y = 32; y < PAGE_H; y += 32) line('rgba(148,163,184,0.35)', y, y + 1);
    return 'css';
  }
  if (id === 'grid') {
    const step = 24;
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= destW; x += step * sx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, destH);
      ctx.stroke();
    }
    for (let y = 0; y <= destH; y += step * sy) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(destW, y);
      ctx.stroke();
    }
    return 'css';
  }
  if (id === 'dotted') {
    const step = 22;
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
  if (id === 'music') {
    const staffGap = 88;
    const lineStep = 9;
    const staffLines = [0, lineStep, lineStep * 2, lineStep * 3, lineStep * 4];
    for (let staffTop = 48; staffTop < PAGE_H - 60; staffTop += staffGap) {
      staffLines.forEach((offset) =>
        line('rgba(15,23,42,0.55)', staffTop + offset, staffTop + offset + 1)
      );
    }
    return 'css';
  }
  return 'css';
};
