import { COMM_TYPES } from './classSync';
import { parsePdfDataUrl } from './pdfImport';

/** Extrait les fonds de page importables depuis un envoi prof. */
export const getCommBackgrounds = async (comm) => {
  const title = comm.title || 'Document';
  const dataUrl = comm.attachment?.dataUrl;

  if (comm.type === COMM_TYPES.PDF && dataUrl) {
    const { backgrounds } = await parsePdfDataUrl(dataUrl, title);
    return backgrounds;
  }
  if (comm.type === COMM_TYPES.IMAGE && dataUrl) {
    return [dataUrl];
  }
  return null;
};

export const canImportComm = (comm) =>
  comm?.type === COMM_TYPES.PDF || comm?.type === COMM_TYPES.IMAGE;
