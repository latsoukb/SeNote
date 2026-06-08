// A4 proportions from Feuille_Seyes-6.pdf (595 × 842 pt)
export const PAGE_W = 900;
export const PAGE_H = Math.round(900 * (842 / 595)); // 1273

export const SEYES_BG = `${process.env.PUBLIC_URL || ''}/templates/seyes.png`;
