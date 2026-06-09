import React, { useState, useEffect } from 'react';
import { renderTemplatePreviewDataUrl } from '../lib/templatePreview';
import { normalizeTemplateId } from '../lib/pageTemplates';

const PageThumbnail = ({ template, className = '' }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    renderTemplatePreviewDataUrl(normalizeTemplateId(template)).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [template]);

  if (!previewUrl) {
    return <div className={`w-full h-full bg-slate-100 ${className}`} />;
  }

  return (
    <img
      src={previewUrl}
      alt=""
      className={`w-full h-full ${className}`}
      style={{ objectFit: 'fill' }}
      draggable={false}
    />
  );
};

export default PageThumbnail;
