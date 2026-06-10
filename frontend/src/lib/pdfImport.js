import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import { PAGE_W, PAGE_H } from './pageDimensions';

const MAX_PAGES = 80;
const JPEG_QUALITY = 0.82;

const renderPdfPageToDataUrl = async (pdfPage) => {
  const baseVp = pdfPage.getViewport({ scale: 1 });
  const scale = Math.min(PAGE_W / baseVp.width, PAGE_H / baseVp.height);
  const viewport = pdfPage.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const x = (PAGE_W - viewport.width) / 2;
  const y = (PAGE_H - viewport.height) / 2;
  ctx.save();
  ctx.translate(x, y);
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  ctx.restore();

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};

/**
 * Lit un fichier PDF et renvoie les images de fond (une par page).
 * @returns {{ title: string, backgrounds: string[] }}
 */
export const parsePdfFile = async (file) => {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Fichier PDF attendu');
  }

  const buffer = await file.arrayBuffer();
  return parsePdfBuffer(buffer, (file.name || 'Document').replace(/\.pdf$/i, '').trim() || 'Document PDF');
};

const parsePdfBuffer = async (buffer, defaultTitle = 'Document PDF') => {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageCount = pdf.numPages;

  if (pageCount > MAX_PAGES) {
    throw new Error(`PDF trop long (${pageCount} pages, max ${MAX_PAGES})`);
  }

  const backgrounds = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    backgrounds.push(await renderPdfPageToDataUrl(page));
  }

  return { title: defaultTitle, backgrounds };
};

/** Importe un PDF depuis une data URL (envoi prof JokkoNote). */
export const parsePdfDataUrl = async (dataUrl, title = 'Document PDF') => {
  const res = await fetch(dataUrl);
  const buffer = await res.arrayBuffer();
  return parsePdfBuffer(buffer, title);
};
