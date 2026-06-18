import React from 'react';
import { toast } from 'sonner';
import { useNotes } from '../context/NotesContext';
import { ensureAppConfig } from '../lib/appConfig';
import { isNativeApp } from '../lib/platform';
import { completeWebOAuthRedirect } from '../lib/googleDriveSync';

const finishOAuthReturn = async (returnUrl, syncNowToDrive) => {
  const result = await completeWebOAuthRedirect(returnUrl);
  if (!result) return;

  if (isNativeApp()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.close();
    } catch {
      /* onglet déjà fermé */
    }
  }

  const sync = await syncNowToDrive();
  if (sync?.ok) {
    toast.success(`Compte Google Drive connecté : ${result.email}`);
  } else {
    toast.success(`Compte Google Drive connecté : ${result.email}`);
    toast.error(sync?.error || 'Première synchronisation impossible — utilisez Synchroniser.');
  }
};

const GoogleDriveOAuthHandler = () => {
  const { syncNowToDrive } = useNotes();

  React.useEffect(() => {
    let appUrlListener;

    (async () => {
      await ensureAppConfig();
      try {
        await finishOAuthReturn(undefined, syncNowToDrive);
      } catch (e) {
        console.warn('Google Drive OAuth return', e);
        toast.error(e.message || 'Connexion Google Drive impossible');
      }

      if (!isNativeApp()) return;

      const { App } = await import('@capacitor/app');
      appUrlListener = await App.addListener('appUrlOpen', async ({ url }) => {
        if (!url?.includes('localhost')) return;
        if (!url.includes('code=') && !url.includes('error=')) return;
        try {
          await finishOAuthReturn(url, syncNowToDrive);
        } catch (e) {
          console.warn('Google Drive OAuth deep link', e);
          toast.error(e.message || 'Connexion Google Drive impossible');
        }
      });
    })();

    return () => {
      appUrlListener?.remove();
    };
  }, [syncNowToDrive]);

  return null;
};

export default GoogleDriveOAuthHandler;
