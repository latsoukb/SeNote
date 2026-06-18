import { jsPDF } from 'jspdf';
import { PAGE_W, PAGE_H } from './pageDimensions';
import { getAllNotebookPages } from './notebookSections';
import { drawPageToCanvas, seyesLoad } from './drawPage';

const renderPageToCanvas = async (page) => {
  await seyesLoad;
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  await drawPageToCanvas(ctx, page, PAGE_W, PAGE_H);

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
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await renderPageToCanvas(pages[i]);
    const data = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(data, 'JPEG', 0, 0, 595, 842);
  }

  return pdf;
};

export const notebookToPdfBlob = async (notebook) => {
  const pdf = await buildNotebookPdf(notebook);
  const buf = pdf.output('arraybuffer');
  return new Blob([buf], { type: 'application/pdf' });
};

export const exportNotebookToPdf = async (notebook) => {
  const pdf = await buildNotebookPdf(notebook);
  pdf.save(pdfFileName(notebook));
};
