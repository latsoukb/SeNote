import { newPage } from '../mock/mock';

export const newSection = (title = 'Onglet 1', pages = null, pageTemplate = 'seyes') => ({
  id: `sec-${Math.random().toString(36).slice(2, 10)}`,
  title,
  pages: pages?.length ? pages : [newPage(pageTemplate)],
});

export const ensureNotebookSections = (nb) => {
  if (!nb) return nb;
  if (nb.sections?.length) return nb;
  const pages = nb.pages?.length ? nb.pages : [newPage(nb.pageTemplate || 'seyes')];
  return {
    ...nb,
    sections: [newSection('Onglet 1', pages)],
  };
};

export const getNotebookSections = (nb) => ensureNotebookSections(nb).sections;

export const countNotebookPages = (nb) =>
  getNotebookSections(nb).reduce((n, s) => n + s.pages.length, 0);

export const getAllNotebookPages = (nb) =>
  getNotebookSections(nb).flatMap((s) => s.pages);

/** Synchroniser tous les cahiers de l'utilisateur vers Drive. */
export const shouldSyncNotebookToDrive = () => true;

/** @deprecated utiliser shouldSyncNotebookToDrive */
export const notebookHasContent = (nb) =>
  getAllNotebookPages(ensureNotebookSections(nb)).some(
    (p) =>
      (p.strokes?.length ?? 0) > 0 ||
      (p.textBoxes?.length ?? 0) > 0 ||
      (p.instruments?.length ?? 0) > 0 ||
      Boolean(p.pdfBackground)
  );

export const findSectionByPageId = (nb, pageId) => {
  for (const section of getNotebookSections(nb)) {
    if (section.pages.some((p) => p.id === pageId)) return section;
  }
  return null;
};
