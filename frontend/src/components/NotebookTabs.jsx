import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const NotebookTabs = ({
  sections,
  activeSectionId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const startRename = (section) => {
    setEditingId(section.id);
    setDraft(section.title);
  };

  const commitRename = (sectionId) => {
    const title = draft.trim() || 'Onglet';
    onRename(sectionId, title);
    setEditingId(null);
  };

  const handleDelete = (section) => {
    if (sections.length <= 1) {
      toast.error('Impossible de supprimer le dernier onglet');
      return;
    }
    onDelete(section.id);
  };

  return (
    <div className="shrink-0 flex items-end gap-0.5 px-3 pt-2 pb-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto thin-scroll">
      {sections.map((section) => {
        const active = section.id === activeSectionId;
        return (
          <div
            key={section.id}
            className={`group relative flex items-center shrink-0 max-w-[10rem] rounded-t-lg border border-b-0 transition-colors ${
              active
                ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 z-10 -mb-px'
                : 'bg-slate-50 dark:bg-slate-900/60 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {editingId === section.id ? (
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commitRename(section.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(section.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                className="h-8 text-xs border-0 bg-transparent px-3 min-w-[5rem]"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                onDoubleClick={() => startRename(section)}
                className={`px-3 py-2 text-xs font-medium truncate ${
                  active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                }`}
                title="Double-clic pour renommer"
              >
                {section.title}
              </button>
            )}
            {sections.length > 1 && (
              <button
                type="button"
                onClick={() => handleDelete(section)}
                className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-opacity"
                aria-label="Supprimer l'onglet"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 flex items-center justify-center w-8 h-8 mb-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
        aria-label="Nouvel onglet"
        title="Nouvel onglet"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NotebookTabs;
