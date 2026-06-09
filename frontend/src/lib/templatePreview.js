import { PAGE_W, PAGE_H, SEYES_BG } from './pageDimensions';
import { drawTemplateBackground, normalizeTemplateId } from './pageTemplates';

let seyesImage = null;
const cache = {};

const loadSeyes = () =>
  new Promise((resolve) => {
    if (seyesImage) {
      resolve(seyesImage);
      return;
    }
    const img = new Image();
    img.onload = () => {
      seyesImage = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = SEYES_BG;
  });

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

  if (id === 'seyes') {
    const img = await loadSeyes();
    if (img) ctx.drawImage(img, 0, 0, PAGE_W, PAGE_H);
  } else {
    drawTemplateBackground(ctx, id, PAGE_W, PAGE_H);
  }

  const url = canvas.toDataURL('image/png');
  cache[id] = url;
  return url;
};
