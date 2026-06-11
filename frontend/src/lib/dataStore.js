export const STORAGE_KEY = 'senote-data-v3';
const LEGACY_KEYS = ['senote-data-v2', 'senote-data-v1'];

const readWebStorage = () => {
  if (typeof window === 'undefined') return null;
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (const key of LEGACY_KEYS) {
      raw = localStorage.getItem(key);
      if (raw) break;
    }
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeWebStorage = (payload) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

/** Enveloppe avec horodatage pour sync Drive */
export const wrapWorkspace = (data) => ({
  version: 3,
  savedAt: Date.now(),
  folders: data.folders,
  notebooks: data.notebooks,
  trash: data.trash,
});

export const unwrapWorkspace = (payload) => {
  if (!payload) return null;
  if (payload.folders && payload.notebooks) {
    return {
      folders: payload.folders,
      notebooks: payload.notebooks,
      trash: payload.trash ?? { notebooks: [], pages: [] },
      savedAt: payload.savedAt ?? 0,
    };
  }
  return null;
};

export const loadWorkspace = async () => unwrapWorkspace(readWebStorage());

export const saveWorkspace = async (data) => {
  const payload = wrapWorkspace(data);
  writeWebStorage(payload);
  return payload;
};

export const getStorageLabel = () => 'Navigateur (local)';
