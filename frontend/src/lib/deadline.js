/** Urgence échéance : rouge < 24h, jaune < 3j, vert au-delà */

const DAY = 24 * 60 * 60 * 1000;

export const getDeadlineUrgency = (deadlineAt) => {
  if (!deadlineAt) return null;
  const ms = Number(deadlineAt) - Date.now();
  if (ms <= 0) return 'red';
  if (ms <= DAY) return 'red';
  if (ms <= 3 * DAY) return 'yellow';
  return 'green';
};

export const DEADLINE_STYLES = {
  red: {
    label: 'Urgent',
    bg: 'bg-red-600',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-600 text-white',
    banner: 'bg-red-600 text-white',
  },
  yellow: {
    label: 'Bientôt',
    bg: 'bg-amber-400',
    border: 'border-amber-400',
    text: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-500 text-white',
    banner: 'bg-amber-500 text-white',
  },
  green: {
    label: 'À faire',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-600 text-white',
    banner: 'bg-emerald-600 text-white',
  },
};

export const formatDeadline = (deadlineAt) => {
  if (!deadlineAt) return '';
  return new Date(Number(deadlineAt)).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDeadlineCountdown = (deadlineAt) => {
  if (!deadlineAt) return '';
  const ms = Number(deadlineAt) - Date.now();
  if (ms <= 0) return 'Échéance dépassée';
  const h = Math.floor(ms / (60 * 60 * 1000));
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d} jour${d > 1 ? 's' : ''} restant${d > 1 ? 's' : ''}`;
  if (h >= 1) return `${h} h restantes`;
  const m = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${m} min restantes`;
};
