import React, { useRef, useLayoutEffect } from 'react';
import { drawPageToCanvas, seyesLoad } from '../lib/drawPage';

const PageLiveThumbnail = ({ page, className = '' }) => {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const render = () => drawPageToCanvas(ctx, page, w, h);
    render();
    seyesLoad.then(render);
  }, [page.strokes, page.template, page.textBoxes, page]);

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
