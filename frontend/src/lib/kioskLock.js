import { App } from '@capacitor/app';
import { isNativeApp } from './platform';
import { Kiosk } from '../plugins/kiosk';

/** Verrouille l'app en mode kiosk Android et bloque la sortie via le bouton Retour */
export async function initKioskLock() {
  if (!isNativeApp()) return;

  try {
    await Kiosk.enable();
  } catch {
    // startLockTask peut échouer si lockTaskMode absent
  }

  // Empêche la fermeture de l'app au bouton Retour (navigation interne gérée par React Router)
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    }
    // Sans listener par défaut, Capacitor quitte l'app — ce listener la garde ouverte
  });
}
