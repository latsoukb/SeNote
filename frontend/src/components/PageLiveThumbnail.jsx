import React, { useRef, useLayoutEffect } from 'react';
import { drawPageToCanvas, seyesLoad } from '../lib/drawPage';
import { getTemplateThumbUrl } from '../lib/pageDimensions';
import { isNativeApp } from '../lib/platform';

const isEmptyPage = (page) =>
  !(page.strokes?.length) &&
  !(page.textBoxes?.length) &&
  !page.pdfBackground;

const PageLiveThumbnail = ({ page, className = '' }) => {
  const canvasRef = useRef(null);
  const useThumb = isNativeApp() && isEmptyPage(page);
  const thumbSrc = useThumb ? getTemplateThumbUrl(page.template || 'seyes') : null;

  useLayoutEffect(() => {
    if (useThumb) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let cancelled = false;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const render = async () => {
      if (cancelled) return;
      await drawPageToCanvas(ctx, page, w, h);
    };
    render();
    seyesLoad.then(() => {
      if (!cancelled) render();
    });

    return () => {
      cancelled = true;
    };
  }, [useThumb, page.strokes, page.template, page.textBoxes, page.pdfBackground, page]);

  if (useThumb) {
    if (thumbSrc) {
      return (
        <img
          src={thumbSrc}
          alt=""
          className={`w-full h-full object-cover ${className}`}
          draggable={false}
        />
      );
    }
    return <div className={`w-full h-full bg-white ${className}`} />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={240}
      className={`w-full h-full ${className}`}
    />
  );
};

export default PageLiveThumbnail;
