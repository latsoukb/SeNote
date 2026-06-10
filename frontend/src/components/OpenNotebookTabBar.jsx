import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, X, ChevronDown } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useOpenNotebooks } from '../context/OpenNotebooksContext';

const OpenNotebookTabBar = ({ activeId = null }) => {
  const navigate = useNavigate();
  const { notebooks } = useNotes();
  const { openIds, closeNotebook } = useOpenNotebooks();

  if (openIds.length === 0) return null;

  const titleFor = (id) => notebooks.find((n) => n.id === id)?.title || 'Cahier';

  const goHome = () => navigate('/');

  const selectTab = (id) => {
    if (id !== activeId) navigate(`/notebook/${id}`);
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

  return (
    <div className="shrink-0 flex items-end gap-0.5 h-10 px-1 bg-slate-900 border-b border-slate-800 overflow-x-auto thin-scroll">
      <button
        type="button"
        onClick={goHome}
        className={`shrink-0 flex items-center justify-center w-10 h-9 mb-0 rounded-t-md transition-colors ${
          activeId === null
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span className="text-xs font-medium truncate">{titleFor(id)}</span>
            {active && <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />}
            <button
              type="button"
              onClick={(e) => handleClose(id, e)}
              className="shrink-0 p-1 rounded hover:bg-slate-600/80 text-slate-400 hover:text-white opacity-70 group-hover:opacity-100 transition-opacity"
              aria-label={`Fermer ${titleFor(id)}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default OpenNotebookTabBar;
