import React, { useState, useEffect } from 'react';
import { renderTemplatePreviewDataUrl } from '../lib/templatePreview';
import { normalizeTemplateId } from '../lib/pageTemplates';
import { getTemplateThumbUrl } from '../lib/pageDimensions';

/** Miniature = vignette PNG (PDF) ou rendu canvas pour modèles CSS */
const PageTemplatePreview = ({ template, selected, onClick, size = 'md' }) => {
  const isSm = size === 'sm';
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const id = normalizeTemplateId(template.id);
    const staticThumb = getTemplateThumbUrl(id);
    if (staticThumb) {
      setPreviewUrl(staticThumb);
      return () => {
        cancelled = true;
      };
    }
    renderTemplatePreviewDataUrl(id).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [template.id]);

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
        className="relative w-full rounded overflow-hidden border border-slate-100 dark:border-slate-200 aspect-[210/297] bg-white"
        style={{ minHeight: isSm ? 48 : 72 }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{ objectFit: 'fill' }}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-100 animate-pulse" />
        )}
      </div>
      <span
        className={`font-medium text-slate-700 dark:text-slate-300 text-center leading-tight ${
          isSm ? 'text-[10px]' : 'text-xs'
        }`}
      >
        {template.name}
      </span>
    </button>
  );
};

export default PageTemplatePreview;
