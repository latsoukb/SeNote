/**
 * Config publique (OAuth client IDs ne sont pas secrets).
 * Priorité : variables build → app-config.json embarqué → app-config.json distant (APK)
 */
import { isNativeApp } from './platform';

const REMOTE_CONFIG_URL = 'https://latsoukb.github.io/SeNote/app-config.json';

const fromEnv = {
  googleWebClientId: (process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || '').trim(),
  googleNativeClientId: (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim(),
  googleTokenExchangeUrl: (process.env.REACT_APP_GOOGLE_TOKEN_URL || '').trim(),
};

let merged = { ...fromEnv };
let loadPromise = null;

const remoteConfigUrl = () => {
  const fromEnvUrl = (process.env.REACT_APP_UPDATE_CONFIG_URL || '').trim();
  return fromEnvUrl || REMOTE_CONFIG_URL;
};

const bundledConfigUrl = () => {
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/app-config.json`;
};

const applyConfigData = (data) => {
  if (!data || typeof data !== 'object') return;
  if (data.googleWebClientId) {
    merged.googleWebClientId = String(data.googleWebClientId).trim();
  }
  if (data.googleNativeClientId) {
    merged.googleNativeClientId = String(data.googleNativeClientId).trim();
  }
  if (data.googleTokenExchangeUrl) {
    merged.googleTokenExchangeUrl = String(data.googleTokenExchangeUrl).trim();
  }
};

const fetchJson = async (url) => {
  if (isNativeApp()) {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.get({
      url,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}`);
    }
    if (typeof res.data === 'object' && res.data !== null) return res.data;
    if (typeof res.data === 'string') return JSON.parse(res.data);
    throw new Error('Réponse config invalide');
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const ensureAppConfig = async () => {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const urls = [bundledConfigUrl()];
    if (isNativeApp()) {
      urls.push(`${remoteConfigUrl()}?t=${Date.now()}`);
    }

    for (const url of urls) {
      try {
        applyConfigData(await fetchJson(url));
        if (merged.googleWebClientId) break;
      } catch (err) {
        console.warn('app-config load failed', url, err);
      }
    }
    return merged;
  })();
  return loadPromise;
};

export const getGoogleWebClientId = () => merged.googleWebClientId;
export const getGoogleNativeClientId = () => merged.googleNativeClientId;
export const getGoogleTokenExchangeUrl = () => merged.googleTokenExchangeUrl;

/** Client OAuth utilisé par Google Sign-In sur Android (ID client Web). */
export const getGoogleAuthClientId = () =>
  merged.googleWebClientId || merged.googleNativeClientId;
