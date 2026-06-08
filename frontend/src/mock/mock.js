// Mock data for SeNote - simulates user's notebooks library
// Each notebook has pages, each page has strokes (drawings) and textBoxes

export const COVER_TEMPLATES = [
  { id: 'cover-blue', name: 'Bleu', gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' },
  { id: 'cover-emerald', name: 'Émeraude', gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
  { id: 'cover-amber', name: 'Ambre', gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' },
  { id: 'cover-rose', name: 'Rose', gradient: 'linear-gradient(135deg, #F43F5E 0%, #9F1239 100%)' },
  { id: 'cover-violet', name: 'Violet', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)' },
  { id: 'cover-slate', name: 'Ardoise', gradient: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)' },
  { id: 'cover-paper', name: 'Papier', gradient: 'linear-gradient(135deg, #FDF6E3 0%, #E7DFC6 100%)' },
  { id: 'cover-leather', name: 'Cuir', gradient: 'linear-gradient(135deg, #92400E 0%, #451A03 100%)' },
];

export const PAGE_TEMPLATES = [
  { id: 'blank', name: 'Vierge' },
  { id: 'lined', name: 'Ligné' },
  { id: 'grid', name: 'Quadrillé' },
  { id: 'dotted', name: 'Pointillé' },
];

const makePage = (template = 'lined') => ({
  id: `page-${Math.random().toString(36).slice(2, 10)}`,
  template,
  strokes: [],
  textBoxes: [],
  createdAt: Date.now(),
});

export const initialNotebooks = [
  {
    id: 'nb-welcome',
    title: 'Bienvenue sur SeNote',
    cover: 'cover-blue',
    pageTemplate: 'lined',
    pages: [makePage('lined'), makePage('lined')],
    updatedAt: Date.now(),
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'nb-meetings',
    title: 'Notes de réunion',
    cover: 'cover-slate',
    pageTemplate: 'lined',
    pages: [makePage('lined')],
    updatedAt: Date.now() - 3600000,
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'nb-sketches',
    title: 'Croquis & idées',
    cover: 'cover-amber',
    pageTemplate: 'blank',
    pages: [makePage('blank'), makePage('grid')],
    updatedAt: Date.now() - 7200000,
    createdAt: Date.now() - 10 * 86400000,
  },
  {
    id: 'nb-math',
    title: 'Mathématiques',
    cover: 'cover-emerald',
    pageTemplate: 'grid',
    pages: [makePage('grid')],
    updatedAt: Date.now() - 4 * 86400000,
    createdAt: Date.now() - 30 * 86400000,
  },
];

export const PEN_COLORS = [
  '#0F172A', // near black
  '#2563EB', // blue
  '#DC2626', // red
  '#16A34A', // green
  '#CA8A04', // amber
  '#9333EA', // purple
  '#0891B2', // cyan
  '#EC4899', // pink
  '#FFFFFF', // white
];

export const HIGHLIGHTER_COLORS = [
  '#FDE047', // yellow
  '#86EFAC', // green
  '#FCA5A5', // red
  '#93C5FD', // blue
  '#F0ABFC', // pink
  '#FDBA74', // orange
];

export const newPage = makePage;

export const newNotebook = (title = 'Nouveau cahier', cover = 'cover-blue', pageTemplate = 'lined') => ({
  id: `nb-${Math.random().toString(36).slice(2, 10)}`,
  title,
  cover,
  pageTemplate,
  pages: [makePage(pageTemplate)],
  updatedAt: Date.now(),
  createdAt: Date.now(),
});
