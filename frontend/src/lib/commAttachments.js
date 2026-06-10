import { COMM_TYPES } from './classSync';

/** Liste normalisée des pièces jointes (ancien format `attachment` inclus). */
export const getCommAttachments = (comm) => {
  if (!comm) return [];
  if (Array.isArray(comm.attachments) && comm.attachments.length) return comm.attachments;
  const single = comm.attachment;
  if (single && (single.fileName || single.dataUrl || single.hasData)) return [single];
  return [];
};

export const commNeedsDetailFetch = (comm) =>
  getCommAttachments(comm).some((a) => a.hasData && !a.dataUrl);

const isImportableAttachment = (att) =>
  att.type === COMM_TYPES.PDF ||
  att.type === COMM_TYPES.IMAGE ||
  att.mimeType === 'application/pdf' ||
  att.mimeType?.startsWith('image/');

export const canImportComm = (comm) =>
  getCommAttachments(comm).some(isImportableAttachment);

export const commAttachmentCount = (comm) => getCommAttachments(comm).length;
