import { isNativeApp } from './platform';
import { wrapWorkspace, unwrapWorkspace } from './dataStore';
import {
  ensureAppConfig,
  getGoogleNativeClientId,
  getGoogleWebClientId,
} from './appConfig';

const PREFS = {
  FILE_ID: 'senote_drive_file_id',
  FOLDER_ID: 'senote_drive_folder_id',
  EMAIL: 'senote_drive_email',
  LAST_SYNC: 'senote_drive_last_sync',
  TOKEN: 'senote_drive_token',
  TOKEN_EXPIRY: 'senote_drive_token_expiry',
};

const FOLDER_NAME = 'SeNote';
const WORKSPACE_NAME = 'senote-workspace.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const OAUTH_PENDING_KEY = 'senote_drive_oauth_pending';
const OAUTH_STATE = 'senote_drive';

const getOAuthRedirectUri = () => {
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${window.location.origin}${base}/`;
};

export const isDriveConfigured = () =>
  isNativeApp() ? Boolean(getGoogleNativeClientId()) : Boolean(getGoogleWebClientId());

const PREF_PREFIX = 'senote-pref-';

const prefGet = async (key) => {
  if (isNativeApp()) {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(PREF_PREFIX + key);
};

const prefSet = async (key, value) => {
  if (isNativeApp()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(PREF_PREFIX + key, value);
};

const prefRemove = async (key) => {
  if (isNativeApp()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
    return;
  }
  localStorage.removeItem(PREF_PREFIX + key);
};

/* ── Native (APK Android) ── */

let authModule = null;

const loadGoogleAuth = async () => {
  if (!isNativeApp()) return null;
  if (authModule) return authModule;
  try {
    const mod = await import('@codetrix-studio/capacitor-google-auth');
    authModule = mod.GoogleAuth;
    await ensureAppConfig();
    const clientId = getGoogleNativeClientId();
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

const signInNativeGoogleDrive = async () => {
  await ensureAppConfig();
  const GoogleAuth = await loadGoogleAuth();
  if (!GoogleAuth) {
    throw new Error(
      'Google Drive indisponible — vérifiez REACT_APP_GOOGLE_CLIENT_ID (voir ANDROID.md).'
    );
  }
  const result = await GoogleAuth.signIn();
  const token = result?.authentication?.accessToken;
  if (!token) throw new Error('Connexion Google échouée');
  await prefSet(PREFS.EMAIL, result.email || 'compte Google');
  return token;
};

const signOutNativeGoogleDrive = async () => {
  try {
    const GoogleAuth = await loadGoogleAuth();
    if (GoogleAuth) await GoogleAuth.signOut();
  } catch {
    /* ignore */
  }
};

const getNativeAccessToken = async () => {
  const GoogleAuth = await loadGoogleAuth();
  if (!GoogleAuth) return null;
  try {
    const auth = await GoogleAuth.refresh();
    return auth?.accessToken || null;
  } catch {
    return null;
  }
};

/* ── Web (navigateur) — Google Identity Services ── */

let gsiPromise = null;

const loadGoogleGsi = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Auth indisponible hors navigateur'));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) resolve(window.google);
      else reject(new Error('Google Identity Services non chargé'));
    };
    script.onerror = () => reject(new Error('Impossible de charger Google Identity Services'));
    document.head.appendChild(script);
  });
  return gsiPromise;
};

const fetchGoogleEmail = async (token) => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 'compte Google';
    const data = await res.json();
    return data.email || 'compte Google';
  } catch {
    return 'compte Google';
  }
};

const OAUTH_TIMEOUT_MS = 120_000;

const requestWebAccessToken = async (prompt = '') =>
  new Promise((resolve, reject) => {
    const clientId = getGoogleWebClientId();
    if (!clientId) {
      reject(
        new Error(
          'Sauvegarde cloud non configurée. Contactez l\'administrateur de votre établissement.'
        )
      );
      return;
    }

    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      fn(value);
    };

    const timeoutId = setTimeout(() => {
      finish(
        reject,
        new Error(
          'Connexion Google expirée ou bloquée. Autorisez les popups pour ce site, puis réessayez.'
        )
      );
    }, OAUTH_TIMEOUT_MS);

    loadGoogleGsi()
      .then((google) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_SCOPE,
          callback: (response) => {
            if (response.error) {
              const msg =
                response.error === 'access_denied'
                  ? 'Accès refusé — ajoutez votre compte dans « Utilisateurs test » (Google Cloud).'
                  : response.error_description || response.error;
              finish(reject, new Error(msg));
              return;
            }
            finish(resolve, response);
          },
          error_callback: (err) => {
            finish(
              reject,
              new Error(
                err?.message ||
                  'Connexion Google impossible — vérifiez l’origine autorisée (https://latsoukb.github.io).'
              )
            );
          },
        });
        client.requestAccessToken(prompt ? { prompt } : {});
      })
      .catch((err) => finish(reject, err));
  });

const storeWebToken = async (response) => {
  await prefSet(PREFS.TOKEN, response.access_token);
  const expiresIn = response.expires_in || 3600;
  await prefSet(PREFS.TOKEN_EXPIRY, String(Date.now() + expiresIn * 1000));
  return response.access_token;
};

const signInWebGoogleDrive = async () => {
  await ensureAppConfig();
  const clientId = getGoogleWebClientId();
  if (!clientId) {
    throw new Error('Sauvegarde cloud non configurée sur cet appareil.');
  }

  sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getOAuthRedirectUri(),
    response_type: 'token',
    scope: DRIVE_SCOPE,
    include_granted_scopes: 'true',
    prompt: 'consent',
    state: OAUTH_STATE,
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

/** Au retour de Google (#access_token=…), enregistre le jeton et nettoie l’URL. */
export const completeWebOAuthRedirect = async () => {
  if (isNativeApp()) return null;

  const rawHash = window.location.hash?.replace(/^#/, '') || '';
  if (!rawHash) return null;

  const params = new URLSearchParams(rawHash);
  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState(null, '', cleanUrl);

  const error = params.get('error');
  if (error) {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
    const msg =
      error === 'access_denied'
        ? 'Accès refusé — ajoutez votre compte dans « Utilisateurs test » (Google Cloud).'
        : params.get('error_description') || error;
    throw new Error(msg);
  }

  const accessToken = params.get('access_token');
  const state = params.get('state');
  if (!accessToken || state !== OAUTH_STATE) return null;

  const wasPending = sessionStorage.getItem(OAUTH_PENDING_KEY);
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
  if (!wasPending) return null;

  const expiresIn = Number(params.get('expires_in') || 3600);
  await prefSet(PREFS.TOKEN, accessToken);
  await prefSet(PREFS.TOKEN_EXPIRY, String(Date.now() + expiresIn * 1000));
  const email = await fetchGoogleEmail(accessToken);
  await prefSet(PREFS.EMAIL, email);
  return { email, accessToken };
};

const signOutWebGoogleDrive = async () => {
  const token = await prefGet(PREFS.TOKEN);
  if (token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch {
      /* ignore */
    }
  }
};

const getWebAccessToken = async () => {
  const token = await prefGet(PREFS.TOKEN);
  const expiry = Number((await prefGet(PREFS.TOKEN_EXPIRY)) || 0);
  if (token && Date.now() < expiry - 60_000) return token;

  const email = await prefGet(PREFS.EMAIL);
  if (!email) return null;

  try {
    const response = await requestWebAccessToken('');
    return storeWebToken(response);
  } catch {
    return null;
  }
};

/* ── API Drive (commun web + native) ── */

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

export const getDriveStatus = async () => {
  await ensureAppConfig();
  const email = await prefGet(PREFS.EMAIL);
  const lastSync = await prefGet(PREFS.LAST_SYNC);
  return {
    connected: Boolean(email),
    email: email || null,
    lastSync: lastSync ? Number(lastSync) : null,
    configured: isDriveConfigured(),
    available: isDriveConfigured(),
  };
};

export const signInGoogleDrive = async () => {
  await ensureAppConfig();
  if (!isDriveConfigured()) {
    throw new Error('Sauvegarde cloud non configurée sur cet appareil.');
  }
  if (isNativeApp()) return signInNativeGoogleDrive();
  return signInWebGoogleDrive();
};

export const signOutGoogleDrive = async () => {
  if (isNativeApp()) await signOutNativeGoogleDrive();
  else await signOutWebGoogleDrive();
  await Promise.all(Object.values(PREFS).map((k) => prefRemove(k)));
};

const getAccessToken = async () => {
  await ensureAppConfig();
  if (isNativeApp()) return getNativeAccessToken();
  return getWebAccessToken();
};

export const uploadToGoogleDrive = async (workspaceData) => {
  await ensureAppConfig();
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
  await ensureAppConfig();
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

/** Au démarrage : prend la copie la plus récente (local vs Drive) et pousse la locale si elle est plus neuve */
export const mergeWithGoogleDrive = async (localData) => {
  try {
    const remote = await downloadFromGoogleDrive();
    if (!remote) {
      const hasLocal =
        (localData?.notebooks?.length || 0) > 0 || (localData?.folders?.length || 0) > 0;
      if (hasLocal) {
        try {
          await uploadToGoogleDrive(localData);
        } catch (e) {
          console.warn('Upload Drive initial ignoré', e);
        }
      }
      return localData;
    }
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
    if (localAt > remoteAt) {
      try {
        await uploadToGoogleDrive(localData);
      } catch (e) {
        console.warn('Mise à jour Drive au démarrage ignorée', e);
      }
    }
    return localData;
  } catch (e) {
    console.warn('Sync Drive au démarrage ignorée', e);
    return localData;
  }
};
