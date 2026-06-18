import { jsPDF } from 'jspdf';
import { PAGE_W, PAGE_H } from './pageDimensions';
import { getAllNotebookPages } from './notebookSections';
import { drawPageToCanvas, preloadTemplateImages, seyesLoad } from './drawPage';

/** A4 en points — canvas plus petit = export fiable sur WebView Android. */
const PDF_W = 595;
const PDF_H = 842;
const SCALE_X = PDF_W / PAGE_W;
const SCALE_Y = PDF_H / PAGE_H;

const canvasToJpegDataUrl = (canvas) =>
  new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size < 100) {
            reject(new Error('Export page vide'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Lecture export impossible'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.92
      );
      return;
    }
    const data = canvas.toDataURL('image/jpeg', 0.92);
    if (!data || data.length < 200) {
      reject(new Error('Export page vide'));
      return;
    }
    resolve(data);
  });

const renderPageToCanvas = async (page) => {
  await seyesLoad;
  await preloadTemplateImages();
  const canvas = document.createElement('canvas');
  canvas.width = PDF_W;
  canvas.height = PDF_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  await drawPageToCanvas(ctx, page, PDF_W, PDF_H, { forExport: true });

  (page.textBoxes || []).forEach((t) => {
    const size = (t.size || 16) * SCALE_X;
    ctx.fillStyle = t.color || '#0F172A';
    ctx.font = `${size}px Inter, sans-serif`;
    const lines = (t.text || '').split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, t.x * SCALE_X, (t.y + (i + 1) * (t.size || 16) * 1.1) * SCALE_Y);
    });
  });

  return canvas;
};

export const pdfFileName = (notebook) => {
  const base =
    (notebook?.title || 'Cahier')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim()
      .slice(0, 80) || 'Cahier';
  return `${base}.pdf`;
};

export const buildNotebookPdf = async (notebook) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pages = getAllNotebookPages(notebook);
  if (!pages.length) {
    pdf.text(notebook?.title || 'Cahier', 40, 60);
  }

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await renderPageToCanvas(pages[i]);
    const data = await canvasToJpegDataUrl(canvas);
    pdf.addImage(data, 'JPEG', 0, 0, PDF_W, PDF_H);
  }

  return pdf;
};

export const notebookToPdfBlob = async (notebook) => {
  const pdf = await buildNotebookPdf(notebook);
  const buf = pdf.output('arraybuffer');
  if (!buf || buf.byteLength < 800) {
    throw new Error('PDF généré vide');
  }
  return new Blob([buf], { type: 'application/pdf' });
};

export const exportNotebookToPdf = async (notebook) => {
  const pdf = await buildNotebookPdf(notebook);
  pdf.save(pdfFileName(notebook));
};
