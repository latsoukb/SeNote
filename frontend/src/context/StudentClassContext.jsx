import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  COMM_TYPES,
  fetchClassCommunications,
  isSyncConfigured,
  markCommunicationSeen,
} from '../lib/classSync';

const SESSION_KEY = 'senote-student-session';
const SEEN_KEY = 'senote-seen-comms';

const StudentClassContext = createContext(null);

const loadSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
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

export const StudentClassProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [communications, setCommunications] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [seenMap, setSeenMap] = useState(loadSeen);

  const persistSession = useCallback((next) => {
    setSession(next);
    try {
      if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loginStudent = useCallback(({ displayName, classId }) => {
    const trimmedClass = classId.trim().toUpperCase();
    const id = `stu-${Math.random().toString(36).slice(2, 10)}`;
    persistSession({
      id,
      displayName: displayName.trim() || 'Élève',
      classId: trimmedClass,
    });
  }, [persistSession]);

  const logoutStudent = useCallback(() => {
    persistSession(null);
    setCommunications([]);
  }, [persistSession]);

  const syncNow = useCallback(async () => {
    if (!session?.classId || !isSyncConfigured()) {
      return { ok: false, newItems: [] };
    }
    setSyncing(true);
    try {
      const items = await fetchClassCommunications(session.classId);
      const prevIds = new Set(communications.map((c) => c.id));
      const newItems = items.filter((c) => !prevIds.has(c.id));
      setCommunications(items);
      setLastSyncAt(Date.now());
      if (newItems.length) {
        window.dispatchEvent(
          new CustomEvent('senote:new-communications', { detail: { items: newItems } }),
        );
      }
      return { ok: true, newItems };
    } catch {
      return { ok: false, newItems: [] };
    } finally {
      setSyncing(false);
    }
  }, [session?.classId, communications]);

  useEffect(() => {
    if (!session?.classId || !isSyncConfigured()) return undefined;
    syncNow();
    const id = setInterval(syncNow, 30_000);
    return () => clearInterval(id);
  }, [session?.classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const markSeen = useCallback(
    async (commId) => {
      if (!session) return;
      const key = `${session.classId}:${commId}`;
      if (seenMap[key]) return;
      const next = { ...seenMap, [key]: Date.now() };
      setSeenMap(next);
      saveSeen(next);
      try {
        await markCommunicationSeen(session.classId, commId, session.id);
      } catch {
        /* offline ok */
      }
    },
    [session, seenMap],
  );

  const newCount = useMemo(() => {
    if (!session) return 0;
    return communications.filter((c) => !seenMap[`${session.classId}:${c.id}`]).length;
  }, [communications, seenMap, session]);

  const getCommunicationById = useCallback(
    (id) => communications.find((c) => c.id === id),
    [communications],
  );

  const value = useMemo(
    () => ({
      session,
      currentStudent: session,
      communications,
      newCount,
      syncing,
      lastSyncAt,
      syncConfigured: isSyncConfigured(),
      loginStudent,
      logoutStudent,
      syncNow,
      markCommunicationSeen: markSeen,
      getCommunicationById,
      COMM_TYPES,
    }),
    [
      session,
      communications,
      newCount,
      syncing,
      lastSyncAt,
      loginStudent,
      logoutStudent,
      syncNow,
      markSeen,
      getCommunicationById,
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
