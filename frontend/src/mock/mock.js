// Mock data for SeNote - simulates user's notebooks library

export const COVER_TEMPLATES = [
  { id: 'cover-blue', name: 'Bleu', gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' },
  { id: 'cover-emerald', name: 'Émeraude', gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
  { id: 'cover-cyan', name: 'Cyan', gradient: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)' },
  { id: 'cover-rose', name: 'Rose', gradient: 'linear-gradient(135deg, #F43F5E 0%, #9F1239 100%)' },
  { id: 'cover-violet', name: 'Violet', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)' },
  { id: 'cover-slate', name: 'Ardoise', gradient: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)' },
  { id: 'cover-paper', name: 'Papier', gradient: 'linear-gradient(135deg, #FDF6E3 0%, #E7DFC6 100%)' },
  { id: 'cover-leather', name: 'Cuir', gradient: 'linear-gradient(135deg, #92400E 0%, #451A03 100%)' },
];

export const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#06B6D4', '#F43F5E', '#8B5CF6', '#64748B', '#EC4899', '#0891B2',
];

export const PAGE_TEMPLATES = [
  { id: 'seyes', name: 'Seyès' },
  { id: 'grid', name: 'Quadrillé' },
  { id: 'grid-margin', name: 'Quadrillé + marge' },
  { id: 'millimeter', name: 'Millimétré' },
  { id: 'music', name: 'Musique' },
  { id: 'protractor', name: 'Rapporteur' },
  { id: 'lined', name: 'Ligné' },
  { id: 'dotted', name: 'Pointillé' },
  { id: 'blank', name: 'Vierge' },
];

const makePage = (template = 'seyes') => ({
  id: `page-${Math.random().toString(36).slice(2, 10)}`,
  template,
  strokes: [],
  textBoxes: [],
  createdAt: Date.now(),
});

export const initialFolders = [
  { id: 'folder-school', name: 'École', color: '#3B82F6', createdAt: Date.now() - 86400000 * 7 },
  { id: 'folder-personal', name: 'Personnel', color: '#10B981', createdAt: Date.now() - 86400000 * 3 },
];

export const initialNotebooks = [
  {
    id: 'nb-welcome',
    title: 'Bienvenue sur SeNote',
    cover: 'cover-blue',
    pageTemplate: 'seyes',
    folderId: 'folder-school',
    pinned: true,
    sections: [
      {
        id: 'sec-welcome-1',
        title: 'Onglet 1',
        pages: [makePage('seyes'), makePage('seyes')],
      },
    ],
    updatedAt: Date.now(),
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'nb-meetings',
    title: 'Notes de réunion',
    cover: 'cover-slate',
    pageTemplate: 'seyes',
    folderId: 'folder-school',
    pinned: false,
    sections: [{ id: 'sec-meetings-1', title: 'Onglet 1', pages: [makePage('seyes')] }],
    updatedAt: Date.now() - 3600000,
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'nb-sketches',
    title: 'Croquis & idées',
    cover: 'cover-cyan',
    pageTemplate: 'blank',
    folderId: 'folder-personal',
    pinned: false,
    sections: [{ id: 'sec-sketches-1', title: 'Onglet 1', pages: [makePage('blank'), makePage('grid')] }],
    updatedAt: Date.now() - 7200000,
    createdAt: Date.now() - 10 * 86400000,
  },
  {
    id: 'nb-math',
    title: 'Mathématiques',
    cover: 'cover-emerald',
    pageTemplate: 'grid',
    folderId: null,
    pinned: false,
    sections: [{ id: 'sec-math-1', title: 'Onglet 1', pages: [makePage('grid')] }],
    updatedAt: Date.now() - 4 * 86400000,
    createdAt: Date.now() - 30 * 86400000,
  },
];

export const PEN_COLORS = [
  '#0F172A',
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#6366F1',
  '#9333EA',
  '#0891B2',
  '#EC4899',
  '#FFFFFF',
];

export const HIGHLIGHTER_COLORS = [
  '#FFF700', // jaune fluo
  '#00FF41', // vert néon
  '#FF2D95', // rose fluo
  '#00CFFF', // bleu cyan
  '#FF1493', // rose vif
  '#CCFF00', // lime
  '#FF00FF', // magenta
];

export const newPage = makePage;

export const newPdfPage = (pdfBackground) => ({
  id: `page-${Math.random().toString(36).slice(2, 10)}`,
  template: 'pdf',
  pdfBackground,
  strokes: [],
  textBoxes: [],
  createdAt: Date.now(),
});

export const newFolder = (name = 'Nouveau dossier', color = FOLDER_COLORS[0]) => ({
  id: `folder-${Math.random().toString(36).slice(2, 10)}`,
  name,
  color,
  createdAt: Date.now(),
});

export const newSection = (title = 'Onglet 1', pageTemplate = 'seyes') => ({
  id: `sec-${Math.random().toString(36).slice(2, 10)}`,
  title,
  pages: [makePage(pageTemplate)],
});

export const newNotebook = (
  title = 'Nouveau cahier',
  cover = 'cover-blue',
  pageTemplate = 'seyes',
  folderId = null
) => ({
  id: `nb-${Math.random().toString(36).slice(2, 10)}`,
  title,
  cover,
  pageTemplate,
  folderId,
  pinned: false,
  sections: [newSection('Onglet 1', pageTemplate)],
  updatedAt: Date.now(),
  createdAt: Date.now(),
});
