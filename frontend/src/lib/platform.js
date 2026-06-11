/** Détecte si l'app tourne dans Capacitor (APK natif) */
export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
};

export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.Capacitor?.getPlatform?.() === 'android';
  } catch {
    return false;
  }
};

/** Mode tablette dédiée : pas de PIN, stockage natif, ou kiosk web */
export const isKioskApp = () =>
  isNativeApp() || process.env.REACT_APP_KIOSK_MODE === 'true';
