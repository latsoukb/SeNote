import { useEffect, useMemo, useState } from 'react';
import { useStudentClass } from '../context/StudentClassContext';
import { getDeadlineDisplayUrgency } from '../lib/deadline';

const URGENCY_ORDER = { red: 0, yellow: 1, green: 2, done: 3 };

export const useDeadlineItems = () => {
  const { communications, enrolled, isCommunicationDone } = useStudentClass();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => {
    void tick;
    return (communications || [])
      .filter((c) => c.deadlineAt)
      .map((c) => {
        const done = isCommunicationDone(c.id);
        return {
          comm: c,
          done,
          urgency: getDeadlineDisplayUrgency(c.deadlineAt, done),
        };
      })
      .filter((x) => x.urgency && !x.done)
      .sort((a, b) => {
        const oa = URGENCY_ORDER[a.urgency] ?? 9;
        const ob = URGENCY_ORDER[b.urgency] ?? 9;
        if (oa !== ob) return oa - ob;
        return Number(a.comm.deadlineAt) - Number(b.comm.deadlineAt);
      });
  }, [communications, tick, isCommunicationDone]);

  const pendingCount = items.length;

  return { items, pendingCount, enrolled };
};
