import { isNativeApp } from './platform';

const DEFAULT_CONFIG_URL = 'https://latsoukb.github.io/SeNote/app-config.json';
export const GITHUB_LATEST_APK_URL =
  'https://github.com/latsoukb/SeNote/releases/latest/download/SeNote-tablet.apk';

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
    return new Error(
      'Connexion impossible. Vérifiez le Wi‑Fi ou utilisez « Installer depuis GitHub ».'
    );
  }
  return cause instanceof Error ? cause : new Error(msg || 'Erreur réseau');
};

/** GET JSON — CapacitorHttp natif sur APK (WebView fetch échoue souvent). */
const httpGetJson = async (url) => {
  if (isNativeApp()) {
    try {
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
    } catch (nativeErr) {
      console.warn('CapacitorHttp GET failed', url, nativeErr);
    }
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    throw networkError(err);
  }
};

export const fetchRemoteUpdateInfo = async () => {
  const remoteUrl = `${remoteConfigUrl()}?t=${Date.now()}`;

  try {
    const data = await httpGetJson(remoteUrl);
    const info = parseUpdateInfo(data);
    if (info) return info;
  } catch (err) {
    console.warn('Remote update config failed', err);
  }

  try {
    const data = await httpGetJson(`${bundledConfigUrl()}?t=${Date.now()}`);
    const info = parseUpdateInfo(data);
    if (info) return info;
  } catch (err) {
    console.warn('Bundled update config failed', err);
  }

  throw new Error(
    'Impossible de contacter le serveur de mises à jour. Utilisez « Installer depuis GitHub ».'
  );
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

/** Ouvre Chrome / navigateur système (même flux que install manuelle GitHub). */
export const openApkInSystemBrowser = async (downloadUrl = GITHUB_LATEST_APK_URL) => {
  const url = bustUrl(downloadUrl);

  if (isNativeApp()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    } catch (browserErr) {
      console.warn('Browser.open failed', browserErr);
    }
  }

  const link = document.createElement('a');
  link.href = url;
  link.target = '_system';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAndInstallUpdate = async (downloadUrl, onProgress) => {
  if (!isNativeApp()) {
    throw new Error('Mise à jour disponible uniquement sur l’application tablette.');
  }

  onProgress?.('download');
  await openApkInSystemBrowser(downloadUrl || GITHUB_LATEST_APK_URL);
  onProgress?.('install');
};
