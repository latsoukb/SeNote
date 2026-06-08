import React from 'react';
import { getTemplateBackground } from '../lib/pageTemplates';

const PageThumbnail = ({ template, className = '' }) => {
  const bg = getTemplateBackground(template);
  if (bg.type === 'image') {
    return (
      <img
        src={bg.src}
        alt=""
        className={`w-full h-full object-cover ${className}`}
        draggable={false}
      />
    );
  }
  return <div className={`w-full h-full bg-white ${bg.className || ''} ${className}`} />;
};

export default PageThumbnail;
