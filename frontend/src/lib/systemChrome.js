import { isAndroid, isNativeApp } from './platform';
import { Kiosk } from '../plugins/kiosk';

/** Synchronise barres système Android avec le thème clair/sombre de l'app */
export async function syncSystemChrome(theme) {
  if (!isNativeApp()) return;

  const dark = theme === 'dark';

  if (isAndroid()) {
    try {
      await Kiosk.setSystemBars({ dark });
    } catch {
      // Plugin absent (build web)
    }
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    if (dark) {
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await StatusBar.setStyle({ style: Style.Dark });
    } else {
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      await StatusBar.setStyle({ style: Style.Light });
    }
  } catch {
    // @capacitor/status-bar indisponible
  }
}
