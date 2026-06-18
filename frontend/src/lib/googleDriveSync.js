import { isNativeApp } from './platform';
import { wrapWorkspace, unwrapWorkspace } from './dataStore';
import {
  ensureAppConfig,
  getGoogleAuthClientId,
  getGoogleTokenExchangeUrl,
  getGoogleWebClientId,
} from './appConfig';

const PREFS = {
  FILE_ID: 'senote_drive_file_id',
  FOLDER_ID: 'senote_drive_folder_id',
  EMAIL: 'senote_drive_email',
  LAST_SYNC: 'senote_drive_last_sync',
  TOKEN: 'senote_drive_token',
  TOKEN_EXPIRY: 'senote_drive_token_expiry',
  REFRESH_TOKEN: 'senote_drive_refresh_token',
  PDF_MAP: 'senote_drive_pdf_map',
};

const FOLDER_NAME = 'SeNote';
const WORKSPACE_NAME = 'senote-workspace.json';
/** Scopes Drive — ne pas passer en une seule chaîne (bug plugin Android). */
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
];
const DRIVE_SCOPE_STRING = DRIVE_SCOPES.join(' ');
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const OAUTH_PENDING_KEY = 'senote_drive_oauth_pending';
const PKCE_VERIFIER_KEY = 'senote_pkce_verifier';
const OAUTH_STATE = 'senote_drive';
/** URI fixe APK (Capacitor androidScheme https) — doit être dans Google Cloud. */
const NATIVE_OAUTH_REDIRECT_URI = 'https://localhost/';

const getOAuthRedirectUri = () => {
  if (isNativeApp()) return NATIVE_OAUTH_REDIRECT_URI;
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${window.location.origin}${base}/`;
};

const base64UrlEncode = (bytes) => {
  let str = '';
  bytes.forEach((b) => {
    str += String.fromCharCode(b);
  });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const generatePkcePair = async () => {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const verifier = base64UrlEncode(random);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(digest));
  return { verifier, challenge };
};

const parseOAuthReturn = (rawUrl) => {
  const source = rawUrl ? new URL(rawUrl) : new URL(window.location.href);
  const query = new URLSearchParams(source.search);
  const hash = new URLSearchParams(source.hash.replace(/^#/, ''));
  const get = (key) => query.get(key) || hash.get(key);
  return {
    code: get('code'),
    state: get('state'),
    error: get('error'),
    errorDescription: get('error_description'),
    accessToken: get('access_token'),
    expiresIn: get('expires_in'),
  };
};

const cleanOAuthUrl = () => {
  window.history.replaceState(null, '', window.location.pathname);
};

const nativeHttp = async (url, init = {}) => {
  const { CapacitorHttp } = await import('@capacitor/core');
  const method = (init.method || 'GET').toUpperCase();
  const headers = { ...(init.headers || {}) };
  let data = init.body;
  if (data && headers['Content-Type']?.includes('json') && typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      /* string body */
    }
  }
  const res = await CapacitorHttp.request({ url, method, headers, data });
  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    json: async () =>
      typeof res.data === 'object' && res.data !== null
        ? res.data
        : JSON.parse(String(res.data || '{}')),
    text: async () =>
      typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? ''),
  };
};

const httpFetch = (url, init = {}) => {
  const body = init.body;
  if (
    isNativeApp() &&
    (body instanceof Blob || body instanceof ArrayBuffer || body instanceof FormData)
  ) {
    return fetch(url, init);
  }
  if (isNativeApp()) return nativeHttp(url, init);
  return fetch(url, init);
};

const postTokenExchange = async (payload) => {
  const proxyUrl = getGoogleTokenExchangeUrl();
  if (proxyUrl) {
    const res = await httpFetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data.error_description ||
          data.error ||
          'Échange du jeton Google impossible (proxy).'
      );
    }
    return data;
  }

  const clientId = getGoogleWebClientId();
  const params = new URLSearchParams({ client_id: clientId });
  if (payload.grant_type === 'refresh_token') {
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', payload.refresh_token);
  } else if (payload.grant_type === 'authorization_code' && payload.code && !payload.redirect_uri) {
    // serverAuthCode Android (offline access)
    params.set('grant_type', 'authorization_code');
    params.set('code', payload.code);
  } else {
    params.set('code', payload.code);
    params.set('redirect_uri', payload.redirect_uri);
    params.set('grant_type', 'authorization_code');
    if (payload.code_verifier) params.set('code_verifier', payload.code_verifier);
  }

  const res = await httpFetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const needsProxy =
      !proxyUrl &&
      (String(data.error_description || data.error || '').includes('client_secret') ||
        data.error === 'invalid_client');
    const msg = needsProxy
      ? 'Sauvegarde cloud : le proxy OAuth n’est pas encore activé. Contactez l’administrateur.'
      : data.error_description || data.error || 'Échange du code Google impossible';
    throw new Error(msg);
  }
  return data;
};

const exchangeAuthCode = async (code, verifier) =>
  postTokenExchange({
    code,
    redirect_uri: getOAuthRedirectUri(),
    code_verifier: verifier,
  });

const persistWebTokens = async (tokenResponse) => {
  await prefSet(PREFS.TOKEN, tokenResponse.access_token);
  const expiresIn = Number(tokenResponse.expires_in || 3600);
  await prefSet(PREFS.TOKEN_EXPIRY, String(Date.now() + expiresIn * 1000));
  if (tokenResponse.refresh_token) {
    await prefSet(PREFS.REFRESH_TOKEN, tokenResponse.refresh_token);
  }
  const email = await fetchGoogleEmail(tokenResponse.access_token);
  await prefSet(PREFS.EMAIL, email);
  return { email, accessToken: tokenResponse.access_token };
};

export const isDriveConfigured = () => Boolean(getGoogleAuthClientId());

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

/* ── Web (navigateur + APK via redirection OAuth) ── */

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
    const res = await httpFetch('https://www.googleapis.com/oauth2/v3/userinfo', {
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
          scope: DRIVE_SCOPE_STRING,
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

const signInWebGoogleDrive = async ({ onBeforeNavigate } = {}) => {
  await ensureAppConfig();
  const clientId = getGoogleWebClientId();
  if (!clientId) {
    throw new Error('Sauvegarde cloud non configurée sur cet appareil.');
  }

  const { verifier, challenge } = await generatePkcePair();
  sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getOAuthRedirectUri(),
    response_type: 'code',
    scope: DRIVE_SCOPE_STRING,
    include_granted_scopes: 'true',
    access_type: 'offline',
    prompt: 'consent',
    state: OAUTH_STATE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  onBeforeNavigate?.();

  if (isNativeApp()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: authUrl });
    return;
  }
  window.location.assign(authUrl);
};

/** Au retour de Google (?code=…), échange le code et nettoie l’URL. */
export const completeWebOAuthRedirect = async (returnUrl) => {
  const returned = parseOAuthReturn(returnUrl);
  if (!returned.code && !returned.error && !returned.accessToken) return null;

  cleanOAuthUrl();

  if (returned.error) {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    const msg =
      returned.error === 'access_denied'
        ? 'Accès refusé — ajoutez votre compte dans « Utilisateurs test » (Google Cloud).'
        : returned.error === 'redirect_uri_mismatch'
          ? 'URI de redirection manquante : ajoutez https://localhost/ dans le client OAuth Web (Google Cloud → Credentials).'
          : returned.errorDescription || returned.error;
    throw new Error(msg);
  }

  if (returned.accessToken) {
    const wasPending = sessionStorage.getItem(OAUTH_PENDING_KEY);
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    if (!wasPending || returned.state !== OAUTH_STATE) return null;
    const expiresIn = Number(returned.expiresIn || 3600);
    await prefSet(PREFS.TOKEN, returned.accessToken);
    await prefSet(PREFS.TOKEN_EXPIRY, String(Date.now() + expiresIn * 1000));
    const email = await fetchGoogleEmail(returned.accessToken);
    await prefSet(PREFS.EMAIL, email);
    return { email, accessToken: returned.accessToken };
  }

  if (returned.state !== OAUTH_STATE) return null;

  const wasPending = sessionStorage.getItem(OAUTH_PENDING_KEY);
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  if (!wasPending || !verifier || !returned.code) return null;

  await ensureAppConfig();
  const tokenResponse = await exchangeAuthCode(returned.code, verifier);
  return persistWebTokens(tokenResponse);
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

const refreshWebAccessToken = async () => {
  const refreshToken = await prefGet(PREFS.REFRESH_TOKEN);
  if (!refreshToken || !getGoogleWebClientId()) return null;

  try {
    const data = await postTokenExchange({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    if (!data.access_token) return null;
    await storeWebToken(data);
    return data.access_token;
  } catch {
    return null;
  }
};

const getWebAccessToken = async () => {
  const token = await prefGet(PREFS.TOKEN);
  const expiry = Number((await prefGet(PREFS.TOKEN_EXPIRY)) || 0);
  if (token && Date.now() < expiry - 60_000) return token;

  const email = await prefGet(PREFS.EMAIL);
  if (!email) return null;

  return refreshWebAccessToken();
};

/* ── API Drive (commun web + native) ── */

/** fetch patché par Capacitor — fiable pour JSON et binaire ; nativeHttp casse le multipart. */
const driveHttpFetch = (url, init) => fetch(url, init);

const driveFetch = async (path, token, options = {}) => {
  const res = await driveHttpFetch(`${DRIVE_API}${path}`, {
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

/** Mises à jour du contenu fichier (JSON, PDF) — endpoint upload, pas metadata. */
const driveUploadFetch = async (path, token, options = {}) => {
  const res = await driveHttpFetch(`${DRIVE_UPLOAD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload ${res.status}: ${err}`);
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

export const signInGoogleDrive = async (options) => {
  await ensureAppConfig();
  if (!isDriveConfigured()) {
    throw new Error('Sauvegarde cloud non configurée sur cet appareil.');
  }
  return signInWebGoogleDrive(options);
};

export const signOutGoogleDrive = async () => {
  await signOutWebGoogleDrive();
  await Promise.all(Object.values(PREFS).map((k) => prefRemove(k)));
};

const getAccessToken = async () => {
  await ensureAppConfig();
  return getWebAccessToken();
};

const getPdfMap = async () => {
  const raw = await prefGet(PREFS.PDF_MAP);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const savePdfMap = async (map) => {
  await prefSet(PREFS.PDF_MAP, JSON.stringify(map));
};

const asUploadBody = async (blob) =>
  isNativeApp() && blob instanceof Blob ? blob.arrayBuffer() : blob;

const uploadPdfToDrive = async (token, folderId, fileName, blob, fileId, previousName) => {
  const pdfBody = await asUploadBody(blob);

  if (fileId) {
    await driveUploadFetch(`/files/${fileId}?uploadType=media`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/pdf' },
      body: pdfBody,
    });
    if (previousName !== fileName) {
      await driveFetch(`/files/${fileId}?fields=id`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName }),
      });
    }
    return fileId;
  }

  const create = await driveFetch('/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType: 'application/pdf',
    }),
  });
  const created = await create.json();
  await driveUploadFetch(`/files/${created.id}?uploadType=media`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/pdf' },
    body: pdfBody,
  });
  return created.id;
};

/** Un PDF par cahier dans le dossier SeNote (lisible dans Drive). */
export const syncNotebookPdfsToDrive = async (workspaceData) => {
  const { notebookToPdfBlob, pdfFileName } = await import('./exportNotebookPdf');
  await ensureAppConfig();
  const token = await getAccessToken();
  if (!token) throw new Error('Non connecté à Google Drive');

  const folderId = await findOrCreateFolder(token);
  const map = await getPdfMap();
  const activeIds = new Set((workspaceData?.notebooks || []).map((n) => n.id));

  for (const nb of workspaceData?.notebooks || []) {
    const updatedAt = nb.updatedAt || 0;
    if (map[nb.id]?.updatedAt >= updatedAt) continue;

    const fileName = pdfFileName(nb);
    const blob = await notebookToPdfBlob(nb);
    const fileId = await uploadPdfToDrive(
      token,
      folderId,
      fileName,
      blob,
      map[nb.id]?.fileId,
      map[nb.id]?.fileName
    );
    map[nb.id] = { fileId, fileName, updatedAt };
  }

  for (const id of Object.keys(map)) {
    if (!activeIds.has(id)) {
      try {
        await driveFetch(`/files/${map[id].fileId}`, token, { method: 'DELETE' });
      } catch {
        /* déjà supprimé */
      }
      delete map[id];
    }
  }

  await savePdfMap(map);
  await prefSet(PREFS.LAST_SYNC, String(Date.now()));
  return { count: Object.keys(map).length };
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
    await driveUploadFetch(`/files/${fileId}?uploadType=media`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } else {
    const create = await driveFetch('/files', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: WORKSPACE_NAME,
        parents: [folderId],
        mimeType: 'application/json',
      }),
    });
    const created = await create.json();
    fileId = created.id;
    await driveUploadFetch(`/files/${fileId}?uploadType=media`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
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
