import { isNativeApp } from './platform';

const DEFAULT_CONFIG_URL = 'https://latsoukb.github.io/SeNote/app-config.json';
const APK_DIR = 'updates';
const APK_FILE_NAME = 'senote-update.apk';
const APK_RELATIVE_PATH = `${APK_DIR}/${APK_FILE_NAME}`;
/** APK release signe ~11 Mo — en dessous = fichier corrompu ou page HTML */
const MIN_APK_BYTES = 8_000_000;

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

const apkDownloadCandidates = (primaryUrl, versionName) => {
  const urls = new Set();
  if (primaryUrl) urls.add(primaryUrl);
  urls.add('https://latsoukb.github.io/SeNote/SeNote-tablet.apk');
  if (versionName) {
    urls.add(
      `https://github.com/latsoukb/SeNote/releases/download/v${versionName}/SeNote-tablet.apk`
    );
  }
  urls.add('https://github.com/latsoukb/SeNote/releases/latest/download/SeNote-tablet.apk');
  return [...urls];
};

const verifyApkStat = async (Filesystem, Directory) => {
  const stat = await Filesystem.stat({
    path: APK_RELATIVE_PATH,
    directory: Directory.External,
  });
  if (!stat.size || stat.size < MIN_APK_BYTES) {
    throw new Error(
      `Fichier APK incomplet (${stat.size || 0} octets). Réessayez sur Wi‑Fi.`
    );
  }
  if (!stat.uri) {
    throw new Error('URI du fichier APK introuvable.');
  }
  return stat;
};

const downloadApkToStorage = async (downloadUrl, onProgress) => {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  await Filesystem.mkdir({
    path: APK_DIR,
    directory: Directory.External,
    recursive: true,
  }).catch(() => {});

  await Filesystem.deleteFile({
    path: APK_RELATIVE_PATH,
    directory: Directory.External,
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

    await Filesystem.downloadFile({
      url: bustUrl(downloadUrl),
      path: APK_RELATIVE_PATH,
      directory: Directory.External,
      recursive: true,
      progress: true,
      headers: {
        Accept: 'application/vnd.android.package-archive, application/octet-stream, */*',
        'Cache-Control': 'no-cache',
      },
    });
  } finally {
    await progressHandle?.remove?.();
  }

  return verifyApkStat(Filesystem, Directory);
};

const downloadApkViaHttpWrite = async (downloadUrl, onProgress) => {
  const { CapacitorHttp } = await import('@capacitor/core');
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  onProgress?.('download', 5);

  const res = await CapacitorHttp.get({
    url: bustUrl(downloadUrl),
    responseType: 'arraybuffer',
    headers: {
      Accept: 'application/vnd.android.package-archive, application/octet-stream, */*',
      'Cache-Control': 'no-cache',
    },
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }

  let base64;
  if (typeof res.data === 'string') {
    base64 = res.data;
  } else if (res.data instanceof ArrayBuffer) {
    const bytes = new Uint8Array(res.data);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    base64 = btoa(binary);
  } else {
    throw new Error('Format de telechargement non supporte.');
  }

  onProgress?.('download', 80);

  await Filesystem.mkdir({
    path: APK_DIR,
    directory: Directory.External,
    recursive: true,
  }).catch(() => {});

  await Filesystem.writeFile({
    path: APK_RELATIVE_PATH,
    data: base64,
    directory: Directory.External,
    recursive: true,
  });

  onProgress?.('download', 100);
  return verifyApkStat(Filesystem, Directory);
};

const downloadApkNative = async (primaryUrl, versionName, onProgress) => {
  const candidates = apkDownloadCandidates(primaryUrl, versionName);
  let lastError;

  for (const url of candidates) {
    try {
      return await downloadApkToStorage(url, onProgress);
    } catch (err) {
      console.warn('Filesystem download failed', url, err);
      lastError = err;
    }

    try {
      return await downloadApkViaHttpWrite(url, onProgress);
    } catch (err) {
      console.warn('HTTP write download failed', url, err);
      lastError = err;
    }
  }

  throw lastError || new Error('Telechargement APK impossible.');
};

export const downloadAndInstallUpdate = async (downloadUrl, onProgress, versionName) => {
  if (!isNativeApp()) {
    throw new Error('Mise à jour disponible uniquement sur l’application tablette.');
  }

  onProgress?.('download', 0);

  let stat;
  try {
    stat = await downloadApkNative(downloadUrl, versionName, onProgress);
  } catch (err) {
    console.warn('APK download failed', err);
    throw new Error(
      err?.message ||
        'Téléchargement impossible. Vérifiez le Wi‑Fi et réessayez dans quelques minutes.'
    );
  }

  onProgress?.('install');

  const { FileOpener } = await import('@capawesome-team/capacitor-file-opener');
  await FileOpener.openFile({
    path: stat.uri,
    mimeType: 'application/vnd.android.package-archive',
  });
};
