import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const STORAGE_KEY = 'senote-data-v3';
const LEGACY_KEYS = ['senote-data-v2', 'senote-data-v1'];
const NATIVE_PATH = 'senote/workspace.json';

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

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

const ensureNativeDir = async () => {
  try {
    await Filesystem.mkdir({
      path: 'senote',
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    /* existe déjà */
  }
};

const readNativeStorage = async () => {
  try {
    const result = await Filesystem.readFile({
      path: NATIVE_PATH,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(result.data);
  } catch {
    return null;
  }
};

const writeNativeStorage = async (payload) => {
  await ensureNativeDir();
  await Filesystem.writeFile({
    path: NATIVE_PATH,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    data: JSON.stringify(payload),
  });
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

export const loadWorkspace = async () => {
  if (isNative()) {
    let data = await readNativeStorage();
    if (!data) {
      const legacy = readWebStorage();
      if (legacy) {
        data = wrapWorkspace(legacy);
        await writeNativeStorage(data);
      }
    }
    return unwrapWorkspace(data);
  }
  return unwrapWorkspace(readWebStorage());
};

export const saveWorkspace = async (data) => {
  const payload = wrapWorkspace(data);
  if (isNative()) {
    await writeNativeStorage(payload);
  } else {
    writeWebStorage(payload);
  }
  return payload;
};

export const getStorageLabel = () =>
  isNative() ? 'Mémoire interne de la tablette' : 'Navigateur (local)';
