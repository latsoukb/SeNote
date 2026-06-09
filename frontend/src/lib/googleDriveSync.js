import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './platform';
import { wrapWorkspace, unwrapWorkspace } from './dataStore';

const PREFS = {
  FILE_ID: 'senote_drive_file_id',
  FOLDER_ID: 'senote_drive_folder_id',
  EMAIL: 'senote_drive_email',
  LAST_SYNC: 'senote_drive_last_sync',
};

const FOLDER_NAME = 'SeNote';
const WORKSPACE_NAME = 'senote-workspace.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';

const getGoogleClientId = () =>
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID ||
  '';

let authModule = null;

const loadGoogleAuth = async () => {
  if (!isNativeApp()) return null;
  if (authModule) return authModule;
  try {
    const mod = await import('@codetrix-studio/capacitor-google-auth');
    authModule = mod.GoogleAuth;
    const clientId = getGoogleClientId();
    if (clientId) {
      await authModule.initialize({
        clientId,
        scopes: [DRIVE_SCOPE],
        grantOfflineAccess: true,
      });
    }
    return authModule;
  } catch (e) {
    console.warn('Google Auth non disponible', e);
    return null;
  }
};

const prefGet = async (key) => {
  const { value } = await Preferences.get({ key });
  return value;
};

const prefSet = async (key, value) => {
  await Preferences.set({ key, value });
};

const prefRemove = async (key) => {
  await Preferences.remove({ key });
};

const driveFetch = async (path, token, options = {}) => {
  const res = await fetch(`${DRIVE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API ${res.status}: ${err}`);
  }
  return res;
};

const findOrCreateFolder = async (token) => {
  const cached = await prefGet(PREFS.FOLDER_ID);
  if (cached) return cached;

  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const list = await driveFetch(`/files?q=${q}&spaces=drive&fields=files(id)`, token);
  const data = await list.json();
  if (data.files?.length) {
    await prefSet(PREFS.FOLDER_ID, data.files[0].id);
    return data.files[0].id;
  }

  const create = await driveFetch('/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await create.json();
  await prefSet(PREFS.FOLDER_ID, folder.id);
  return folder.id;
};

const findWorkspaceFile = async (token, folderId) => {
  const cached = await prefGet(PREFS.FILE_ID);
  if (cached) return cached;

  const q = encodeURIComponent(
    `name='${WORKSPACE_NAME}' and '${folderId}' in parents and trashed=false`
  );
  const list = await driveFetch(`/files?q=${q}&spaces=drive&fields=files(id)`, token);
  const data = await list.json();
  if (data.files?.length) {
    await prefSet(PREFS.FILE_ID, data.files[0].id);
    return data.files[0].id;
  }
  return null;
};

export const isDriveConfigured = () => Boolean(getGoogleClientId());

export const getDriveStatus = async () => {
  const email = await prefGet(PREFS.EMAIL);
  const lastSync = await prefGet(PREFS.LAST_SYNC);
  return {
    connected: Boolean(email),
    email: email || null,
    lastSync: lastSync ? Number(lastSync) : null,
    configured: isDriveConfigured(),
    available: isNativeApp() && isDriveConfigured(),
  };
};

export const signInGoogleDrive = async () => {
  const GoogleAuth = await loadGoogleAuth();
  if (!GoogleAuth) {
    throw new Error(
      'Google Drive disponible uniquement sur l\'APK Android avec REACT_APP_GOOGLE_CLIENT_ID configuré.'
    );
  }
  const result = await GoogleAuth.signIn();
  const token = result?.authentication?.accessToken;
  if (!token) throw new Error('Connexion Google échouée');
  await prefSet(PREFS.EMAIL, result.email || 'compte Google');
  return token;
};

export const signOutGoogleDrive = async () => {
  try {
    const GoogleAuth = await loadGoogleAuth();
    if (GoogleAuth) await GoogleAuth.signOut();
  } catch {
    /* ignore */
  }
  await Promise.all(Object.values(PREFS).map((k) => prefRemove(k)));
};

const getAccessToken = async () => {
  const GoogleAuth = await loadGoogleAuth();
  if (!GoogleAuth) return null;
  try {
    const auth = await GoogleAuth.refresh();
    return auth?.accessToken || null;
  } catch {
    return null;
  }
};

export const uploadToGoogleDrive = async (workspaceData) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Non connecté à Google Drive');

  const folderId = await findOrCreateFolder(token);
  const payload = wrapWorkspace(workspaceData);
  const body = JSON.stringify(payload);
  let fileId = await findWorkspaceFile(token, folderId);

  if (fileId) {
    await driveFetch(`/files/${fileId}?uploadType=media`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } else {
    const metadata = {
      name: WORKSPACE_NAME,
      parents: [folderId],
      mimeType: 'application/json',
    };
    const boundary = 'senote_boundary';
    const multipart = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      body,
      `--${boundary}--`,
    ].join('\r\n');

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipart,
      }
    );
    if (!res.ok) throw new Error(`Upload Drive échoué: ${res.status}`);
    const created = await res.json();
    fileId = created.id;
    await prefSet(PREFS.FILE_ID, fileId);
  }

  await prefSet(PREFS.LAST_SYNC, String(Date.now()));
  return { fileId, savedAt: payload.savedAt };
};

export const downloadFromGoogleDrive = async () => {
  const token = await getAccessToken();
  if (!token) throw new Error('Non connecté à Google Drive');

  const folderId = await findOrCreateFolder(token);
  const fileId = await findWorkspaceFile(token, folderId);
  if (!fileId) return null;

  const res = await driveFetch(`/files/${fileId}?alt=media`, token);
  const raw = await res.json();
  await prefSet(PREFS.LAST_SYNC, String(Date.now()));
  return unwrapWorkspace(raw);
};

/** Au démarrage : prend la copie la plus récente (local vs Drive) */
export const mergeWithGoogleDrive = async (localData) => {
  try {
    const remote = await downloadFromGoogleDrive();
    if (!remote) return localData;
    const localAt = localData?.savedAt ?? 0;
    const remoteAt = remote.savedAt ?? 0;
    if (remoteAt > localAt) {
      return {
        folders: remote.folders,
        notebooks: remote.notebooks,
        trash: remote.trash,
        savedAt: remoteAt,
      };
    }
    return localData;
  } catch (e) {
    console.warn('Sync Drive au démarrage ignorée', e);
    return localData;
  }
};
