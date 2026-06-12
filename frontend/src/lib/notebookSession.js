import { DEFAULT_WRITE_ZOOM } from '../components/NoteCanvas';

export const createNotebookSession = () => ({
  currentPageIdx: 0,
  writeZoom: DEFAULT_WRITE_ZOOM,
  writePan: { x: 0, y: 0 },
  sidebarOpen: false,
  pageSyncRevision: 0,
});

export const clampPageIdx = (idx, pageCount) => {
  if (pageCount <= 0) return 0;
  return Math.min(Math.max(0, idx), pageCount - 1);
};
