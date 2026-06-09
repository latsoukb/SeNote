/** Détection native sans import statique (compatible build web Mac) */
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

/** Tablette dédiée : pas de code PIN, stockage natif */
export const isKioskApp = () =>
  isNativeApp() || process.env.REACT_APP_KIOSK_MODE === 'true';
