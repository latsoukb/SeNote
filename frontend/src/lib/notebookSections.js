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

/** IDs des cahiers démo d'origine (app web) — ignorés s'ils n'ont jamais été modifiés. */
const SEED_DEMO_NOTEBOOK_IDS = new Set([
  'nb-welcome',
  'nb-meetings',
  'nb-sketches',
  'nb-math',
]);

/** Synchroniser tous les cahiers sauf les démos jamais touchées (pas besoin d'écriture). */
export const shouldSyncNotebookToDrive = (nb) => {
  if (!SEED_DEMO_NOTEBOOK_IDS.has(nb.id)) return true;
  const created = nb.createdAt ?? 0;
  const updated = nb.updatedAt ?? 0;
  return updated > created + 60_000;
};

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
