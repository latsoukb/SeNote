// A4 proportions from Feuille_Seyes-6.pdf (595 × 842 pt)
export const PAGE_W = 900;
export const PAGE_H = Math.round(900 * (842 / 595)); // 1273

/** Largeur / hauteur réelles de la page (format A4) */
export const PAGE_CM_W = 21;
export const PAGE_CM_H = 29.7;

export const cmToPx = (cm) => (cm / PAGE_CM_W) * PAGE_W;
export const pxToCm = (px) => (px / PAGE_W) * PAGE_CM_W;

const base = process.env.PUBLIC_URL || '';

/** Modèles rendus depuis PDF / PNG (comme Seyès). */
export const TEMPLATE_IMAGE_FILES = {
  seyes: 'seyes',
  grid: 'grid',
  'grid-margin': 'grid-margin',
  millimeter: 'millimeter',
  protractor: 'protractor',
};

export const getTemplateImageUrl = (templateId) => {
  const file = TEMPLATE_IMAGE_FILES[templateId];
  if (!file) return null;
  return `${base}/templates/${file}.png`;
};

export const getTemplateThumbUrl = (templateId) => {
  const file = TEMPLATE_IMAGE_FILES[templateId];
  if (!file) return null;
  return `${base}/templates/${file}-thumb.png`;
};

/** @deprecated utiliser getTemplateImageUrl('seyes') */
export const SEYES_BG = getTemplateImageUrl('seyes');
