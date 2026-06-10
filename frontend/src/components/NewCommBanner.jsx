import React from 'react';
import { Bell, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';

const NewCommBanner = ({ count, onOpen, onDismiss }) => {
  if (!count || count < 1) return null;

  const label =
    count === 1
      ? '1 nouveau message de votre professeur'
      : `${count} nouveaux messages de votre professeur`;

  return (
    <div
      role="status"
      className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-3 shadow-md"
    >
      <Bell className="w-4 h-4 shrink-0" />
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 text-left text-sm font-medium hover:underline flex items-center gap-1 min-w-0"
      >
        <span className="truncate">{label}</span>
        <ChevronRight className="w-4 h-4 shrink-0" />
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white hover:bg-white/20 shrink-0"
        onClick={onDismiss}
        aria-label="Masquer"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NewCommBanner;
