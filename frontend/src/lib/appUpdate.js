import { isNativeApp } from './platform';

const DEFAULT_CONFIG_URL = 'https://latsoukb.github.io/SeNote/app-config.json';

const remoteConfigUrl = () => {
  const fromEnv = (process.env.REACT_APP_UPDATE_CONFIG_URL || '').trim();
  return fromEnv || DEFAULT_CONFIG_URL;
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

export const fetchRemoteUpdateInfo = async () => {
  const url = `${remoteConfigUrl()}?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Impossible de contacter le serveur de mises à jour.');
  const data = await res.json();
  const info = parseUpdateInfo(data);
  if (!info) throw new Error('Informations de mise à jour indisponibles.');
  return info;
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

/** Ouvre le navigateur système (même flux que install manuelle GitHub). */
export const openApkInSystemBrowser = (downloadUrl) => {
  const url = bustUrl(downloadUrl);
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
  // Même URL et même flux que l’installation manuelle depuis GitHub Releases
  openApkInSystemBrowser(downloadUrl);
  onProgress?.('install');
};
