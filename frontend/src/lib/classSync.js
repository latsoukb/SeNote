/**
 * Sync prof → élève entre JokkoNote (prof) et SeNote (élève).
 * Backend : REACT_APP_JOKKO_SYNC_URL (serveur dans repo JokkoNote).
 */

export const COMM_TYPES = {
  MESSAGE: 'message',
  PDF: 'pdf',
  IMAGE: 'image',
};

const syncBase = () => (process.env.REACT_APP_JOKKO_SYNC_URL || '').replace(/\/$/, '');

const readFile = async (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const fileToAttachment = async (file) => {
  const dataUrl = await readFile(file);
  const type = file.type === 'application/pdf'
    ? COMM_TYPES.PDF
    : file.type.startsWith('image/')
      ? COMM_TYPES.IMAGE
      : COMM_TYPES.MESSAGE;
  return { type, dataUrl, fileName: file.name, mimeType: file.type };
};

export const fetchClassCommunications = async (classId) => {
  const base = syncBase();
  if (!base) return [];
  const res = await fetch(`${base}/classes/${encodeURIComponent(classId)}/communications`);
  if (!res.ok) throw new Error('Sync impossible');
  const data = await res.json();
  return data.communications || [];
};

export const pushClassCommunication = async (classId, payload) => {
  const base = syncBase();
  if (!base) throw new Error('REACT_APP_JOKKO_SYNC_URL non configuré');
  const res = await fetch(`${base}/classes/${encodeURIComponent(classId)}/communications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Envoi impossible');
  return res.json();
};

export const markCommunicationSeen = async (classId, commId, studentId) => {
  const base = syncBase();
  if (!base) return;
  await fetch(
    `${base}/classes/${encodeURIComponent(classId)}/communications/${encodeURIComponent(commId)}/seen`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    },
  );
};

export const isSyncConfigured = () => Boolean(syncBase());
