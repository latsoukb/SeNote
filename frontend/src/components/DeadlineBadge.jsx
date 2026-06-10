import React from 'react';
import { Clock } from 'lucide-react';
import {
  DEADLINE_STYLES,
  formatDeadline,
  formatDeadlineCountdown,
  getDeadlineUrgency,
} from '../lib/deadline';

const DeadlineBadge = ({ deadlineAt, variant = 'badge' }) => {
  if (!deadlineAt) return null;
  const urgency = getDeadlineUrgency(deadlineAt);
  const style = DEADLINE_STYLES[urgency];
  if (!style) return null;

  if (variant === 'banner') {
    return (
      <div className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium ${style.banner}`}>
        <Clock className="w-4 h-4 shrink-0" />
        <span>
          Échéance : {formatDeadline(deadlineAt)} — {formatDeadlineCountdown(deadlineAt)}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.badge}`}
    >
      <Clock className="w-3 h-3" />
      {formatDeadlineCountdown(deadlineAt)}
    </span>
  );
};

export default DeadlineBadge;
