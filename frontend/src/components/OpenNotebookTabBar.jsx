import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, X, ChevronDown, Plus, BookOpen } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useOpenNotebooks } from '../context/OpenNotebooksContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

const OpenNotebookTabBar = ({ activeId = null }) => {
  const navigate = useNavigate();
  const { notebooks } = useNotes();
  const { openIds, closeNotebook, openNotebook } = useOpenNotebooks();
  const [pickerOpen, setPickerOpen] = useState(false);

  const titleFor = (id) => notebooks.find((n) => n.id === id)?.title || 'Cahier';

  const goHome = () => navigate('/');

  const selectTab = (id) => {
    if (id !== activeId) navigate(`/notebook/${id}`);
  };

  const handleOpenNotebook = (id) => {
    openNotebook(id);
    navigate(`/notebook/${id}`);
    setPickerOpen(false);
  };

  const handleClose = (id, e) => {
    e.stopPropagation();
    const remaining = openIds.filter((x) => x !== id);
    closeNotebook(id);
    if (activeId === id) {
      if (remaining.length > 0) {
        navigate(`/notebook/${remaining[remaining.length - 1]}`);
      } else {
        navigate('/');
      }
    }
  };

  const sortedNotebooks = [...notebooks].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="shrink-0 flex items-end gap-0.5 h-10 px-1 bg-brand-950 border-b border-brand-900 overflow-x-auto thin-scroll">
      <button
        type="button"
        onClick={goHome}
        className={`shrink-0 flex items-center justify-center w-10 h-9 mb-0 rounded-t-md transition-colors ${
          activeId === null
            ? 'bg-brand-700 text-white'
            : 'text-brand-300 hover:text-white hover:bg-brand-900'
        }`}
        aria-label="Bibliothèque"
        title="Bibliothèque"
      >
        <Home className="w-4 h-4" />
      </button>

      {openIds.map((id) => {
        const active = id === activeId;
        return (
          <div
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => selectTab(id)}
            className={`group shrink-0 flex items-center gap-1 h-9 mb-0 pl-3 pr-1 max-w-[11rem] rounded-t-lg cursor-pointer transition-colors ${
              active
                ? 'bg-brand-800 text-white'
                : 'bg-brand-900/60 text-brand-300 hover:bg-brand-900 hover:text-brand-100'
            }`}
          >
            <span className="text-xs font-medium truncate">{titleFor(id)}</span>
            {active && <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />}
            <button
              type="button"
              onClick={(e) => handleClose(id, e)}
              className="shrink-0 p-1 rounded hover:bg-brand-700/80 text-brand-300 hover:text-white opacity-70 group-hover:opacity-100 transition-opacity"
              aria-label={`Fermer ${titleFor(id)}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="shrink-0 flex items-center justify-center w-9 h-9 mb-0 rounded-t-md text-brand-300 hover:text-white hover:bg-brand-900 transition-colors"
            aria-label="Ouvrir un cahier"
            title="Ouvrir un cahier"
          >
            <Plus className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-2 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-medium text-slate-500 px-2 py-1 mb-1">Ouvrir un cahier</p>
          {sortedNotebooks.length === 0 ? (
            <p className="text-sm text-slate-500 px-2 py-3">Aucun cahier — créez-en un dans la bibliothèque.</p>
          ) : (
            <ul className="space-y-0.5">
              {sortedNotebooks.map((nb) => {
                const isOpen = openIds.includes(nb.id);
                return (
                  <li key={nb.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotebook(nb.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm transition-colors ${
                        nb.id === activeId
                          ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                          : 'hover:bg-slate-100 dark:hover:bg-brand-900'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate flex-1">{nb.title}</span>
                      {isOpen && (
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 shrink-0">
                          ouvert
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default OpenNotebookTabBar;
