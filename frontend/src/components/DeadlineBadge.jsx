import React from 'react';
import { Check, Clock } from 'lucide-react';
import {
  DEADLINE_STYLES,
  formatDeadline,
  formatDeadlineStatus,
  getDeadlineDisplayUrgency,
} from '../lib/deadline';

const DeadlineBadge = ({ deadlineAt, done = false, variant = 'badge' }) => {
  if (!deadlineAt) return null;
  const urgency = getDeadlineDisplayUrgency(deadlineAt, done);
  const style = DEADLINE_STYLES[urgency];
  if (!style) return null;

  if (variant === 'banner') {
    return (
      <div className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium ${style.banner}`}>
        {done ? <Check className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
        <span>
          {done
            ? `Travail terminé — échéance le ${formatDeadline(deadlineAt)}`
            : `Échéance : ${formatDeadline(deadlineAt)} — ${formatDeadlineStatus(deadlineAt, false)}`}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.badge}`}
    >
      {done ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {formatDeadlineStatus(deadlineAt, done)}
    </span>
  );
};

export default DeadlineBadge;
