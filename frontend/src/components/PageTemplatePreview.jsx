import React from 'react';
import { getTemplateBackground } from '../lib/pageTemplates';

const PageTemplatePreview = ({ template, selected, onClick, size = 'md' }) => {
  const isSm = size === 'sm';
  const bg = getTemplateBackground(template.id);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 transition-all ${
        isSm ? 'p-1.5' : 'p-2'
      } ${
        selected
          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 scale-[1.02]'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
      aria-label={template.name}
      aria-pressed={selected}
    >
      <div
        className={`w-full rounded bg-white dark:bg-slate-50 shadow-inner overflow-hidden border border-slate-100 dark:border-slate-200 aspect-[210/297] ${
          bg.type === 'css' ? bg.className : ''
        }`}
        style={{ minHeight: isSm ? 48 : 72 }}
      >
        {bg.type === 'image' && (
          <img src={bg.src} alt="" className="w-full h-full object-cover" draggable={false} />
        )}
      </div>
      <span
        className={`font-medium text-slate-700 dark:text-slate-300 ${
          isSm ? 'text-[10px]' : 'text-xs'
        }`}
      >
        {template.name}
      </span>
    </button>
  );
};

export default PageTemplatePreview;
