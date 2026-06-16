import { isNativeApp } from './platform';

const DEFAULT_CONFIG_URL = 'https://latsoukb.github.io/SeNote/app-config.json';
const APK_FILE_NAME = 'senote-update.apk';

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

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Lecture du fichier impossible.'));
        return;
      }
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(blob);
  });

const downloadApkNative = async (downloadUrl) => {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  await Filesystem.deleteFile({
    path: APK_FILE_NAME,
    directory: Directory.Cache,
  }).catch(() => {});

  const result = await Filesystem.downloadFile({
    url: downloadUrl,
    path: APK_FILE_NAME,
    directory: Directory.Cache,
    recursive: true,
  });

  const savedPath = result.path || APK_FILE_NAME;
  const { uri } = await Filesystem.getUri({
    path: savedPath,
    directory: Directory.Cache,
  });
  return uri;
};

const downloadApkViaFetch = async (downloadUrl) => {
  let res;
  try {
    res = await fetch(downloadUrl, { cache: 'no-store' });
  } catch {
    throw new Error(
      'Téléchargement impossible. Vérifiez le Wi‑Fi ou réessayez dans quelques minutes.'
    );
  }
  if (!res.ok) throw new Error('Téléchargement de la mise à jour impossible.');

  const blob = await res.blob();
  const base64 = await blobToBase64(blob);
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const writeResult = await Filesystem.writeFile({
    path: APK_FILE_NAME,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
  if (writeResult.uri) return writeResult.uri;
  const { uri } = await Filesystem.getUri({
    path: APK_FILE_NAME,
    directory: Directory.Cache,
  });
  return uri;
};

export const downloadAndInstallUpdate = async (downloadUrl, onProgress) => {
  if (!isNativeApp()) {
    throw new Error('Mise à jour disponible uniquement sur l’application tablette.');
  }

  onProgress?.('download');

  let fileUri;
  try {
    fileUri = await downloadApkNative(downloadUrl);
  } catch (nativeErr) {
    console.warn('Native APK download failed, trying fetch fallback', nativeErr);
    fileUri = await downloadApkViaFetch(downloadUrl);
  }

  onProgress?.('install');

  const { FileOpener } = await import('@capawesome-team/capacitor-file-opener');
  await FileOpener.openFile({
    path: fileUri,
    mimeType: 'application/vnd.android.package-archive',
  });
};
