// Mock data for SeNote - simulates user's notebooks library

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

export const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#64748B', '#EC4899', '#0891B2',
];

export const PAGE_TEMPLATES = [
  { id: 'seyes', name: 'Seyès' },
  { id: 'blank', name: 'Vierge' },
  { id: 'lined', name: 'Ligné' },
  { id: 'grid', name: 'Quadrillé' },
  { id: 'dotted', name: 'Pointillé' },
  { id: 'calligraphy', name: 'Caligraphe' },
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
    pages: [makePage('seyes'), makePage('seyes')],
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
    pages: [makePage('seyes')],
    updatedAt: Date.now() - 3600000,
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'nb-sketches',
    title: 'Croquis & idées',
    cover: 'cover-amber',
    pageTemplate: 'blank',
    folderId: 'folder-personal',
    pinned: false,
    pages: [makePage('blank'), makePage('grid')],
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
    pages: [makePage('grid')],
    updatedAt: Date.now() - 4 * 86400000,
    createdAt: Date.now() - 30 * 86400000,
  },
];

export const PEN_COLORS = [
  '#0F172A',
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#CA8A04',
  '#9333EA',
  '#0891B2',
  '#EC4899',
  '#FFFFFF',
];

export const HIGHLIGHTER_COLORS = [
  '#FDE047',
  '#86EFAC',
  '#FCA5A5',
  '#93C5FD',
  '#F0ABFC',
  '#FDBA74',
];

export const newPage = makePage;

export const newFolder = (name = 'Nouveau dossier', color = FOLDER_COLORS[0]) => ({
  id: `folder-${Math.random().toString(36).slice(2, 10)}`,
  name,
  color,
  createdAt: Date.now(),
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
  pages: [makePage(pageTemplate)],
  updatedAt: Date.now(),
  createdAt: Date.now(),
});
