import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
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
const ANNOUNCED_KEY = 'senote-announced-comms';
const DONE_KEY = 'senote-done-comms';

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

const loadAnnounced = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(ANNOUNCED_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const saveAnnounced = (set) => {
  try {
    localStorage.setItem(ANNOUNCED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
};

const loadDone = () => {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveDone = (map) => {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(map));
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
  const [doneMap, setDoneMap] = useState(loadDone);
  const seenMapRef = useRef(loadSeen());
  const announcedRef = useRef(loadAnnounced());
  const enrolledRef = useRef(false);

  useEffect(() => {
    seenMapRef.current = seenMap;
  }, [seenMap]);

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
    enrolledRef.current = false;
    setClassIds([]);
    announcedRef.current = new Set();
    saveAnnounced(announcedRef.current);
  }, []);

  const syncNow = useCallback(async () => {
    if (!deviceId || !isSyncConfigured()) {
      return { ok: false, newItems: [] };
    }
    setSyncing(true);
    try {
      const data = await fetchStudentInbox(deviceId);
      const nowEnrolled = Boolean(data.enrolled);
      if (nowEnrolled && !enrolledRef.current) {
        const n = (data.classIds || []).length;
        toast.success(
          n > 1 ? `Inscrit dans ${n} classes` : 'Inscrit dans la classe de ton prof',
          { description: 'Les messages arrivent dans Réception.', duration: 8000 },
        );
      }
      enrolledRef.current = nowEnrolled;
      setEnrolled(nowEnrolled);
      setClassIds(data.classIds || []);
      const items = data.communications || [];
      const seen = seenMapRef.current;
      const newItems = [];
      items.forEach((c) => {
        const key = seenKey(c.id);
        if (seen[key]) {
          announcedRef.current.add(c.id);
          return;
        }
        if (announcedRef.current.has(c.id)) return;
        announcedRef.current.add(c.id);
        newItems.push(c);
      });
      saveAnnounced(announcedRef.current);
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
    const tick = () => syncNow();
    const id = setInterval(tick, enrolled ? 15_000 : 5_000);
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
  }, [deviceId, syncNow, enrolled]);

  const markSeen = useCallback(
    async (comm) => {
      if (!comm?.id) return;
      const key = seenKey(comm.id);
      if (seenMap[key]) return;
      const next = { ...seenMap, [key]: Date.now() };
      setSeenMap(next);
      saveSeen(next);
      announcedRef.current.add(comm.id);
      saveAnnounced(announcedRef.current);
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

  const isCommunicationDone = useCallback(
    (commId) => Boolean(doneMap[commId]),
    [doneMap],
  );

  const toggleCommunicationDone = useCallback((commId) => {
    if (!commId) return;
    setDoneMap((prev) => {
      const next = { ...prev };
      if (next[commId]) delete next[commId];
      else next[commId] = Date.now();
      saveDone(next);
      return next;
    });
  }, []);

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
      isCommunicationDone,
      toggleCommunicationDone,
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
      isCommunicationDone,
      toggleCommunicationDone,
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
