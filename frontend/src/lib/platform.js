import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const isAndroid = () => Capacitor.getPlatform() === 'android';

/** Tablette dédiée : pas de code PIN, stockage natif */
export const isKioskApp = () =>
  isNativeApp() || process.env.REACT_APP_KIOSK_MODE === 'true';
