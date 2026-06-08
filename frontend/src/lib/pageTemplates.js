import { SEYES_BG } from './pageDimensions';

export const getPaperClass = (templateId) => {
  const map = {
    lined: 'paper-lined',
    grid: 'paper-grid',
    dotted: 'paper-dotted',
    calligraphy: 'paper-calligraphy',
  };
  return map[templateId] || '';
};

export const getTemplateBackground = (templateId) => {
  if (templateId === 'seyes') {
    return { type: 'image', src: SEYES_BG };
  }
  return { type: 'css', className: getPaperClass(templateId) };
};
