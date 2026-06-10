import { COMM_TYPES } from './classSync';
import { parsePdfDataUrl } from './pdfImport';
import { getCommAttachments } from './commAttachments';

/** Extrait les fonds de page importables depuis un envoi prof (tous les fichiers). */
export const getCommBackgrounds = async (comm) => {
  const attachments = getCommAttachments(comm);
  const backgrounds = [];

  for (const att of attachments) {
    const label = att.fileName || comm.title || 'Document';
    if (
      (att.type === COMM_TYPES.PDF || att.mimeType === 'application/pdf') &&
      att.dataUrl
    ) {
      const { backgrounds: pages } = await parsePdfDataUrl(att.dataUrl, label);
      backgrounds.push(...pages);
    } else if (
      (att.type === COMM_TYPES.IMAGE || att.mimeType?.startsWith('image/')) &&
      att.dataUrl
    ) {
      backgrounds.push(att.dataUrl);
    }
  }

  return backgrounds.length ? backgrounds : null;
};

export { canImportComm } from './commAttachments';
