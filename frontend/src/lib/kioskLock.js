import { App } from '@capacitor/app';
import { isNativeApp } from './platform';
import { Kiosk } from '../plugins/kiosk';

/** Verrouille l'app en mode kiosk Android et bloque la sortie via le bouton Retour */
export async function initKioskLock() {
  if (!isNativeApp()) return;

  try {
    const status = await Kiosk.getStatus();
    if (status.deviceOwner) {
      await Kiosk.applyPolicies();
    } else {
      await Kiosk.enable();
    }
  } catch {
    try {
      await Kiosk.enable();
    } catch {
      // Lock task indisponible
    }
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    }
  });

  App.addListener('appStateChange', async ({ isActive }) => {
    if (!isActive) return;
    try {
      const status = await Kiosk.getStatus();
      if (status.deviceOwner) {
        await Kiosk.applyPolicies();
      } else {
        await Kiosk.enable();
      }
    } catch {
      // Re-verrouillage silencieux au retour dans l'app
    }
  });
}

export async function getKioskStatus() {
  if (!isNativeApp()) {
    return { deviceOwner: false, lockTaskActive: false };
  }
  try {
    return await Kiosk.getStatus();
  } catch {
    return { deviceOwner: false, lockTaskActive: false };
  }
}

export async function openAdminSystemSettings(type) {
  await Kiosk.openSystemSettings({ type });
}

export async function temporarilyDisableKiosk() {
  await Kiosk.disable();
}

export async function reEnableKiosk() {
  const status = await getKioskStatus();
  if (status.deviceOwner) {
    await Kiosk.applyPolicies();
  } else {
    await Kiosk.enable();
  }
}
