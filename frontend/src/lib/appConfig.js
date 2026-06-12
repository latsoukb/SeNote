/**
 * Config publique (OAuth client IDs ne sont pas secrets).
 * Priorité : variables build → fichier public/app-config.json
 */
const fromEnv = {
  googleWebClientId: (process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || '').trim(),
  googleNativeClientId: (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim(),
  googleTokenExchangeUrl: (process.env.REACT_APP_GOOGLE_TOKEN_URL || '').trim(),
};

let merged = { ...fromEnv };
let loadPromise = null;

const configUrl = () => {
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/app-config.json`;
};

export const ensureAppConfig = async () => {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const res = await fetch(configUrl(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.googleWebClientId) {
          merged.googleWebClientId = String(data.googleWebClientId).trim();
        }
        if (data.googleNativeClientId) {
          merged.googleNativeClientId = String(data.googleNativeClientId).trim();
        }
        if (data.googleTokenExchangeUrl) {
          merged.googleTokenExchangeUrl = String(data.googleTokenExchangeUrl).trim();
        }
      }
    } catch {
      /* fichier absent ou hors ligne */
    }
    return merged;
  })();
  return loadPromise;
};

export const getGoogleWebClientId = () => merged.googleWebClientId;
export const getGoogleNativeClientId = () => merged.googleNativeClientId;
export const getGoogleTokenExchangeUrl = () => merged.googleTokenExchangeUrl;
