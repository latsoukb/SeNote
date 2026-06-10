import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  COMM_TYPES,
  fetchStudentInbox,
  getDeviceCode,
  getOrCreateDeviceId,
  getStoredStudentName,
  isSyncConfigured,
  markCommunicationSeen,
  saveStoredStudentName,
} from '../lib/classSync';

const SEEN_KEY = 'senote-seen-comms';

const StudentClassContext = createContext(null);

const loadSeen = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    const migrated = {};
    Object.entries(raw).forEach(([k, v]) => {
      const id = k.includes(':') ? k.split(':').pop() : k;
      if (id) migrated[id] = migrated[id] || v;
    });
    return migrated;
  } catch {
    return {};
  }
};

const saveSeen = (map) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const seenKey = (commId) => commId;

export const StudentClassProvider = ({ children }) => {
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [displayName, setDisplayName] = useState(getStoredStudentName);
  const [enrolled, setEnrolled] = useState(false);
  const [classIds, setClassIds] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [seenMap, setSeenMap] = useState(loadSeen);
  const knownIdsRef = useRef(new Set());

  const setupStudent = useCallback((name) => {
    const trimmed = name.trim() || 'Élève';
    setDisplayName(trimmed);
    saveStoredStudentName(trimmed);
  }, []);

  const logoutStudent = useCallback(() => {
    setDisplayName('');
    saveStoredStudentName('');
    setCommunications([]);
    setEnrolled(false);
    setClassIds([]);
    knownIdsRef.current = new Set();
  }, []);

  const syncNow = useCallback(async () => {
    if (!deviceId || !isSyncConfigured()) {
      return { ok: false, newItems: [] };
    }
    setSyncing(true);
    try {
      const data = await fetchStudentInbox(deviceId);
      setEnrolled(data.enrolled);
      setClassIds(data.classIds || []);
      const items = data.communications || [];
      const newItems = items.filter((c) => !knownIdsRef.current.has(c.id));
      items.forEach((c) => knownIdsRef.current.add(c.id));
      setCommunications(items);
      setLastSyncAt(Date.now());
      setSyncError(null);
      if (newItems.length) {
        window.dispatchEvent(
          new CustomEvent('senote:new-communications', { detail: { items: newItems } }),
        );
      }
      return { ok: true, newItems };
    } catch (err) {
      setSyncError(err?.message || 'Sync impossible');
      return { ok: false, newItems: [] };
    } finally {
      setSyncing(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId || !isSyncConfigured()) return undefined;
    syncNow();
    const id = setInterval(syncNow, 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', syncNow);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', syncNow);
    };
  }, [deviceId, syncNow]);

  const markSeen = useCallback(
    async (comm) => {
      if (!comm?.id) return;
      const key = seenKey(comm.id);
      if (seenMap[key]) return;
      const next = { ...seenMap, [key]: Date.now() };
      setSeenMap(next);
      saveSeen(next);
      try {
        await markCommunicationSeen(comm.classId, comm.id, {
          deviceId,
          displayName: displayName || 'Élève',
        });
      } catch {
        /* offline ok */
      }
    },
    [deviceId, displayName, seenMap],
  );

  const newCount = useMemo(
    () => communications.filter((c) => !seenMap[seenKey(c.id)]).length,
    [communications, seenMap],
  );

  const getCommunicationById = useCallback(
    (id) => communications.find((c) => c.id === id),
    [communications],
  );

  const upsertCommunication = useCallback((comm) => {
    if (!comm?.id) return;
    setCommunications((prev) => {
      const idx = prev.findIndex((c) => c.id === comm.id);
      if (idx < 0) return [comm, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...comm };
      return next;
    });
  }, []);

  const isCommUnread = useCallback(
    (commId) => !seenMap[seenKey(commId)],
    [seenMap],
  );

  const session = displayName
    ? { deviceId, displayName, deviceCode: getDeviceCode(deviceId), enrolled, classIds }
    : null;

  const value = useMemo(
    () => ({
      session,
      currentStudent: session,
      deviceId,
      deviceCode: getDeviceCode(deviceId),
      communications,
      newCount,
      enrolled,
      syncing,
      lastSyncAt,
      syncError,
      syncConfigured: isSyncConfigured(),
      setupStudent,
      logoutStudent,
      syncNow,
      markCommunicationSeen: markSeen,
      isCommUnread,
      getCommunicationById,
      upsertCommunication,
      COMM_TYPES,
    }),
    [
      session,
      deviceId,
      communications,
      newCount,
      enrolled,
      syncing,
      lastSyncAt,
      syncError,
      setupStudent,
      logoutStudent,
      syncNow,
      markSeen,
      isCommUnread,
      getCommunicationById,
      upsertCommunication,
    ],
  );

  return (
    <StudentClassContext.Provider value={value}>{children}</StudentClassContext.Provider>
  );
};

export const useStudentClass = () => {
  const ctx = useContext(StudentClassContext);
  if (!ctx) throw new Error('useStudentClass requires StudentClassProvider');
  return ctx;
};
