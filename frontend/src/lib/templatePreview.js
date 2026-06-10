import { PAGE_W, PAGE_H, getTemplateImageUrl } from './pageDimensions';
import { drawTemplateBackground, normalizeTemplateId } from './pageTemplates';

const cache = {};
const imageCache = {};

const loadTemplateImage = (src) => {
  if (!src) return Promise.resolve(null);
  if (imageCache[src]) return imageCache[src];
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache[src] = p;
  return p;
};

/** Capture pleine page (900×1273) puis redimensionnée en miniature — fidèle au modèle */
export const renderTemplatePreviewDataUrl = async (templateId) => {
  const id = normalizeTemplateId(templateId);
  if (cache[id]) return cache[id];

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const src = getTemplateImageUrl(id);
  if (src) {
    const img = await loadTemplateImage(src);
    if (img) {
      if (id === 'protractor') {
        const scale = Math.min(PAGE_W / img.width, PAGE_H / img.height) * 0.92;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (PAGE_W - w) / 2, (PAGE_H - h) / 2, w, h);
      } else {
        ctx.drawImage(img, 0, 0, PAGE_W, PAGE_H);
      }
    }
  } else {
    drawTemplateBackground(ctx, id, PAGE_W, PAGE_H);
  }

  const url = canvas.toDataURL('image/png');
  cache[id] = url;
  return url;
};
