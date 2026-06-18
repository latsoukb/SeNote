import { isNativeApp } from './platform';

const DEFAULT_CONFIG_URL = 'https://latsoukb.github.io/SeNote/app-config.json';
const APK_FILE_NAME = 'senote-update.apk';

const remoteConfigUrl = () => {
  const fromEnv = (process.env.REACT_APP_UPDATE_CONFIG_URL || '').trim();
  return fromEnv || DEFAULT_CONFIG_URL;
};

const bundledConfigUrl = () => {
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/app-config.json`;
};

const parseUpdateInfo = (data) => {
  if (!data) return null;
  const versionCode = Number(data.latestApkVersionCode);
  const versionName = String(data.latestApkVersion || '').trim();
  const downloadUrl = String(data.apkDownloadUrl || '').trim();
  if (!Number.isFinite(versionCode) || versionCode <= 0 || !downloadUrl) return null;
  return {
    versionCode,
    versionName: versionName || String(versionCode),
    downloadUrl,
    releaseNotes: String(data.releaseNotes || '').trim(),
  };
};

const networkError = (cause) => {
  const msg = cause?.message || String(cause || '');
  if (/failed to fetch|network|load failed|timeout/i.test(msg)) {
    return new Error('Connexion impossible. Vérifiez le Wi‑Fi et réessayez.');
  }
  return cause instanceof Error ? cause : new Error(msg || 'Erreur réseau');
};

/** GET JSON — CapacitorHttp natif sur APK (WebView fetch échoue souvent). */
const httpGetJson = async (url) => {
  if (isNativeApp()) {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.get({
      url,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}`);
    }
    if (typeof res.data === 'object' && res.data !== null) return res.data;
    if (typeof res.data === 'string') return JSON.parse(res.data);
    throw new Error('Réponse serveur invalide.');
  }

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const fetchRemoteUpdateInfo = async () => {
  const errors = [];

  for (const url of [
    `${remoteConfigUrl()}?t=${Date.now()}`,
    `${bundledConfigUrl()}?t=${Date.now()}`,
  ]) {
    try {
      const data = await httpGetJson(url);
      const info = parseUpdateInfo(data);
      if (info) return info;
    } catch (err) {
      console.warn('Update config failed', url, err);
      errors.push(err);
    }
  }

  throw errors[0] instanceof Error
    ? networkError(errors[0])
    : new Error('Impossible de vérifier les mises à jour.');
};

export const getInstalledAppInfo = async () => {
  if (!isNativeApp()) {
    return { version: 'web', build: '0', versionCode: 0 };
  }
  const { App } = await import('@capacitor/app');
  const info = await App.getInfo();
  const versionCode = Number.parseInt(info.build, 10) || 0;
  return {
    version: info.version || '0',
    build: info.build || '0',
    versionCode,
  };
};

export const checkForAppUpdate = async () => {
  if (!isNativeApp()) {
    return { available: false, reason: 'web' };
  }

  const [installed, remote] = await Promise.all([
    getInstalledAppInfo(),
    fetchRemoteUpdateInfo(),
  ]);

  if (remote.versionCode > installed.versionCode) {
    return {
      available: true,
      installed,
      remote,
    };
  }

  return {
    available: false,
    installed,
    remote,
  };
};

const bustUrl = (url) => {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
};

const downloadApkNative = async (downloadUrl, onProgress) => {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  await Filesystem.deleteFile({
    path: APK_FILE_NAME,
    directory: Directory.Cache,
  }).catch(() => {});

  let progressHandle = null;
  try {
    progressHandle = await Filesystem.addListener('progress', (status) => {
      if (status.contentLength > 0) {
        const percent = Math.min(
          100,
          Math.round((status.bytes / status.contentLength) * 100)
        );
        onProgress?.('download', percent);
      }
    });

    const result = await Filesystem.downloadFile({
      url: bustUrl(downloadUrl),
      path: APK_FILE_NAME,
      directory: Directory.Cache,
      recursive: true,
      progress: true,
    });

    const savedPath = result.path || APK_FILE_NAME;
    const { uri } = await Filesystem.getUri({
      path: savedPath,
      directory: Directory.Cache,
    });
    return uri;
  } finally {
    await progressHandle?.remove?.();
  }
};

export const downloadAndInstallUpdate = async (downloadUrl, onProgress) => {
  if (!isNativeApp()) {
    throw new Error('Mise à jour disponible uniquement sur l’application tablette.');
  }

  onProgress?.('download', 0);

  let fileUri;
  try {
    fileUri = await downloadApkNative(downloadUrl, onProgress);
  } catch (err) {
    console.warn('APK download failed', err);
    throw new Error(
      'Téléchargement impossible. Vérifiez le Wi‑Fi et réessayez dans quelques minutes.'
    );
  }

  onProgress?.('install');

  const { FileOpener } = await import('@capawesome-team/capacitor-file-opener');
  await FileOpener.openFile({
    path: fileUri,
    mimeType: 'application/vnd.android.package-archive',
  });
};
