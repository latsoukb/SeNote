import React, { useRef, useLayoutEffect } from 'react';
import { drawPageToCanvas, seyesLoad } from '../lib/drawPage';

const PageLiveThumbnail = ({ page, className = '' }) => {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
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
  }, [page.strokes, page.template, page.textBoxes, page.pdfBackground, page]);

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
