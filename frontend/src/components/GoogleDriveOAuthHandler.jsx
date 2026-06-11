import React from 'react';
import { toast } from 'sonner';
import { useNotes } from '../context/NotesContext';
import { ensureAppConfig } from '../lib/appConfig';
import { completeWebOAuthRedirect } from '../lib/googleDriveSync';

const GoogleDriveOAuthHandler = () => {
  const { syncNowToDrive } = useNotes();

  React.useEffect(() => {
    (async () => {
      await ensureAppConfig();
      try {
        const result = await completeWebOAuthRedirect();
        if (!result) return;
        const sync = await syncNowToDrive();
        if (sync?.ok) {
          toast.success(`Compte Google Drive connecté : ${result.email}`);
        } else {
          toast.success(`Compte Google Drive connecté : ${result.email}`);
          toast.error(sync?.error || 'Première synchronisation impossible — utilisez Synchroniser.');
        }
      } catch (e) {
        console.warn('Google Drive OAuth return', e);
        toast.error(e.message || 'Connexion Google Drive impossible');
      }
    })();
  }, [syncNowToDrive]);

  return null;
};

export default GoogleDriveOAuthHandler;
