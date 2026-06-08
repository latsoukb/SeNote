import React, { useRef, useEffect, useCallback, useState } from 'react';
import PageSheet from './PageSheet';
import { PAGE_W, PAGE_H } from '../lib/pageDimensions';
import { MIN_ZOOM, MAX_ZOOM } from './NoteCanvas';

const GAP = 16;

const PdfDocumentView = ({
  notebook,
  pages,
  currentPageIdx,
  onPageChange,
  scrollDirection,
  autoAddPage,
  onAutoAddPage,
  tool,
  color,
  thickness,
  onPageUpdate,
  pushUndo,
  writeZoom = 1,
  onWriteZoomChange,
  writePan = { x: 0, y: 0 },
  onWritePanChange,
}) => {
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const addingRef = useRef(false);
  const wasAtEndRef = useRef(false);
  const pinchRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(700);
  const isVertical = scrollDirection !== 'horizontal';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 48;
      setPageWidth(Math.min(820, Math.max(320, w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollToPage = useCallback(
    (idx, smooth = true) => {
      const el = pageRefs.current[idx];
      if (el) {
        el.scrollIntoView({
          behavior: smooth ? 'smooth' : 'instant',
          block: 'start',
          inline: 'start',
        });
      }
    },
    []
  );

  // Ne scroll que quand on clique une miniature (pas à chaque détection auto)
  const prevIdxRef = useRef(currentPageIdx);
  useEffect(() => {
    if (prevIdxRef.current !== currentPageIdx && pages.length > prevIdxRef.current + 1) {
      scrollToPage(currentPageIdx);
    }
    prevIdxRef.current = currentPageIdx;
  }, [currentPageIdx, pages.length, scrollToPage]);

  // Détection de la page visible au scroll (sans créer de page)
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const onScroll = () => {
      if (writeZoom > 1) return;

      const scrollPos = isVertical ? root.scrollTop : root.scrollLeft;
      const clientSize = isVertical ? root.clientHeight : root.clientWidth;
      const scrollSize = isVertical ? root.scrollHeight : root.scrollWidth;

      // Détection page courante
      let bestIdx = currentPageIdx;
      let bestDist = Infinity;
      pageRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const dist = isVertical
          ? Math.abs(rect.top - rootRect.top - 40)
          : Math.abs(rect.left - rootRect.left - 40);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      if (bestIdx !== currentPageIdx) {
        onPageChange(bestIdx);
      }

      // Ajout auto UNIQUEMENT si l'utilisateur a scrollé vers le bas/fin
      if (!autoAddPage || bestIdx !== pages.length - 1) {
        wasAtEndRef.current = false;
        return;
      }

      const hasOverflow = scrollSize > clientSize + 60;
      const atEnd = scrollPos + clientSize >= scrollSize - 24;

      if (hasOverflow && atEnd && !wasAtEndRef.current && !addingRef.current) {
        wasAtEndRef.current = true;
        addingRef.current = true;
        const last = pages[pages.length - 1];
        onAutoAddPage(last?.template || notebook.pageTemplate);
        setTimeout(() => {
          addingRef.current = false;
        }, 2000);
      } else if (!atEnd) {
        wasAtEndRef.current = false;
      }
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [
    autoAddPage,
    currentPageIdx,
    pages,
    notebook.pageTemplate,
    onAutoAddPage,
    onPageChange,
    isVertical,
    writeZoom,
  ]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const [t0, t1] = e.touches;
      pinchRef.current = {
        dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
        zoom: writeZoom,
        pan: { ...writePan },
        lastZoom: writeZoom,
      };
    }
  };

  const applyFocalZoom = (newZoom, clientX, clientY, fromPinch = false) => {
    const pageEl = pageRefs.current[currentPageIdx];
    if (!pageEl) {
      onWriteZoomChange?.(newZoom);
      return;
    }
    const rect = pageEl.getBoundingClientRect();
    const focalX = clientX - rect.left;
    const focalY = clientY - rect.top;
    const prevZoom = fromPinch && pinchRef.current ? pinchRef.current.lastZoom : writeZoom;
    const prevPan = fromPinch && pinchRef.current ? pinchRef.current.pan : writePan;
    const ratio = newZoom / prevZoom;
    const newPan = {
      x: focalX - (focalX - prevPan.x) * ratio,
      y: focalY - (focalY - prevPan.y) * ratio,
    };
    if (fromPinch && pinchRef.current) {
      pinchRef.current.lastZoom = newZoom;
      pinchRef.current.pan = newPan;
    }
    onWriteZoomChange?.(newZoom);
    onWritePanChange?.(newPan);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const [t0, t1] = e.touches;
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    const ratio = dist / pinchRef.current.dist;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.zoom * ratio));
    const cx = (t0.clientX + t1.clientX) / 2;
    const cy = (t0.clientY + t1.clientY) / 2;
    applyFocalZoom(next, cx, cy, true);
  };

  const handleTouchEnd = () => {
    pinchRef.current = null;
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, writeZoom + delta));
      applyFocalZoom(next, e.clientX, e.clientY);
    }
  };

  return (
    <div
      ref={scrollRef}
      className={`flex-1 thin-scroll bg-slate-200/80 dark:bg-slate-950/50 ${
        isVertical ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-hidden'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ touchAction: isVertical ? 'pan-y pinch-zoom' : 'pan-x pinch-zoom' }}
    >
      <div
        className={`mx-auto py-6 px-4 ${
          isVertical ? 'flex flex-col items-center' : 'flex flex-row items-start h-full'
        }`}
        style={{ gap: GAP }}
      >
        {pages.map((page, idx) => (
          <div
            key={page.id}
            ref={(el) => {
              pageRefs.current[idx] = el;
            }}
            data-page-idx={idx}
            className="shrink-0 shadow-lg"
          >
            <PageSheet
              page={page}
              displayWidth={pageWidth}
              tool={tool}
              color={color}
              thickness={thickness}
              onChange={(patch) => onPageUpdate(page.id, patch)}
              pushUndo={(snap) => pushUndo(page.id, snap)}
              isActive={idx === currentPageIdx}
              writeZoom={idx === currentPageIdx ? writeZoom : 1}
              writePan={idx === currentPageIdx ? writePan : { x: 0, y: 0 }}
              onWritePanChange={idx === currentPageIdx ? onWritePanChange : undefined}
            />
          </div>
        ))}
        {autoAddPage && (
          <div
            className={`shrink-0 flex items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md bg-white/40 dark:bg-slate-900/20 ${
              isVertical ? 'w-full' : 'h-full'
            }`}
            style={
              isVertical
                ? { width: pageWidth, minHeight: 120, padding: '2rem 0' }
                : { width: 120, minHeight: pageWidth * (PAGE_H / PAGE_W), padding: '0 2rem' }
            }
          >
            {isVertical
              ? '↓ Faites défiler pour ajouter une page'
              : '← Faites défiler pour ajouter une page'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfDocumentView;
