import React, { useRef, useEffect, useCallback, useState } from 'react';
import PageSheet from './PageSheet';
import { PAGE_W, PAGE_H } from '../lib/pageDimensions';
import { isNativeApp } from '../lib/platform';

const GAP = 16;
/** Sur APK : au plus 3 PageSheet montées (courante ± 1) pour éviter OOM WebView */
const NATIVE_RENDER_RADIUS = 1;

const shouldMountPageSheet = (idx, currentPageIdx) => {
  if (!isNativeApp()) return true;
  return Math.abs(idx - currentPageIdx) <= NATIVE_RENDER_RADIUS;
};

const PagePlaceholder = ({ idx, onActivate }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onActivate}
    onKeyDown={(e) => e.key === 'Enter' && onActivate?.()}
    className="relative bg-white dark:bg-chrome-900 overflow-hidden shadow-lg border border-slate-200 dark:border-chrome-700 w-full flex items-center justify-center text-slate-400 text-xs cursor-pointer"
    style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }}
    aria-label={`Page ${idx + 1}`}
  >
    {idx + 1}
  </div>
);

/** Page la plus visible dans le viewport (gère 2 pages partiellement à l'écran) */
const pickVisiblePageIndex = (root, pageEls, isVertical) => {
  const rootRect = root.getBoundingClientRect();
  const viewportCenter = isVertical
    ? rootRect.top + rootRect.height / 2
    : rootRect.left + rootRect.width / 2;

  let bestIdx = 0;
  let bestScore = -1;

  pageEls.forEach((el, idx) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const span = isVertical ? rect.height : rect.width;
    if (span <= 0) return;

    const visibleStart = isVertical
      ? Math.max(rect.top, rootRect.top)
      : Math.max(rect.left, rootRect.left);
    const visibleEnd = isVertical
      ? Math.min(rect.bottom, rootRect.bottom)
      : Math.min(rect.right, rootRect.right);
    const visible = Math.max(0, visibleEnd - visibleStart);
    const ratio = visible / span;

    const pageCenter = isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const centerDist = Math.abs(pageCenter - viewportCenter);
    const centerWeight = 1 / (1 + centerDist / 200);
    const score = ratio * 0.7 + centerWeight * 0.3;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  return bestIdx;
};

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
  stylusOnly = true,
  pageSyncRevision = 0,
  onRegisterScrollToPage,
}) => {
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const addingRef = useRef(false);
  const wasAtEndRef = useRef(false);
  const scrollSyncRef = useRef(false);
  const scrollSyncReadyRef = useRef(false);
  const currentPageIdxRef = useRef(currentPageIdx);
  const writeZoomRef = useRef(writeZoom);
  const [penLock, setPenLock] = useState(false);
  const isVertical = scrollDirection !== 'horizontal';

  currentPageIdxRef.current = currentPageIdx;
  writeZoomRef.current = writeZoom;

  const scrollToPage = useCallback((idx, smooth = true) => {
    const el = pageRefs.current[idx];
    if (el) {
      el.scrollIntoView({
        behavior: smooth ? 'smooth' : isNativeApp() ? 'auto' : 'instant',
        block: 'start',
        inline: 'start',
      });
    }
  }, []);

  useEffect(() => {
    onRegisterScrollToPage?.(scrollToPage);
  }, [onRegisterScrollToPage, scrollToPage]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !penLock) return;
    const blockTouch = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    root.addEventListener('touchmove', blockTouch, { passive: false, capture: true });
    root.addEventListener('touchstart', blockTouch, { passive: false, capture: true });
    return () => {
      root.removeEventListener('touchmove', blockTouch, { capture: true });
      root.removeEventListener('touchstart', blockTouch, { capture: true });
    };
  }, [penLock]);

  const syncPageFromViewport = useCallback(() => {
    const root = scrollRef.current;
    if (!root || scrollSyncRef.current || !scrollSyncReadyRef.current) return;

    const bestIdx = pickVisiblePageIndex(root, pageRefs.current, isVertical);
    if (bestIdx !== currentPageIdxRef.current) {
      scrollSyncRef.current = true;
      onPageChange(bestIdx, {
        resetZoom: writeZoomRef.current > 1.01,
      });
      requestAnimationFrame(() => {
        scrollSyncRef.current = false;
      });
    }
  }, [isVertical, onPageChange]);

  const handleScrollChain = useCallback(
    (dx, dy) => {
      const root = scrollRef.current;
      if (!root) return;
      if (isVertical) root.scrollTop -= dy;
      else root.scrollLeft -= dx;
      syncPageFromViewport();
    },
    [isVertical, syncPageFromViewport]
  );

  useEffect(() => {
    scrollSyncReadyRef.current = false;
    if (!pages.length) return undefined;

    let cancelled = false;
    const restore = () => {
      if (cancelled) return;
      scrollToPage(currentPageIdx, false);
      requestAnimationFrame(() => {
        if (!cancelled) scrollSyncReadyRef.current = true;
      });
    };
    requestAnimationFrame(() => requestAnimationFrame(restore));

    return () => {
      cancelled = true;
      scrollSyncReadyRef.current = false;
    };
  }, [notebook?.id, pages.length, currentPageIdx, scrollToPage]);

  // Détection automatique au scroll + IntersectionObserver
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const onScroll = () => {
      syncPageFromViewport();

      const scrollPos = isVertical ? root.scrollTop : root.scrollLeft;
      const clientSize = isVertical ? root.clientHeight : root.clientWidth;
      const scrollSize = isVertical ? root.scrollHeight : root.scrollWidth;
      const bestIdx = currentPageIdxRef.current;

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

    const observer = new IntersectionObserver(
      () => syncPageFromViewport(),
      { root, threshold: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1] }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      root.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [
    autoAddPage,
    pages.length,
    notebook.pageTemplate,
    onAutoAddPage,
    isVertical,
    syncPageFromViewport,
  ]);

  return (
    <div
      ref={scrollRef}
      className={`flex-1 thin-scroll bg-slate-200/80 dark:bg-chrome-950/50 ${
        isVertical ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-hidden'
      }`}
      style={{
        touchAction: penLock ? 'none' : isVertical ? 'pan-y' : 'pan-x',
        overflow: penLock ? 'hidden' : undefined,
      }}
    >
      <div
        className={`w-full min-w-0 py-2 px-0 sm:py-3 ${
          isVertical ? 'flex flex-col items-stretch' : 'flex flex-row items-start h-full'
        }`}
        style={{ gap: GAP }}
      >
        {pages.map((page, idx) => {
          const mountSheet = shouldMountPageSheet(idx, currentPageIdx);
          return (
            <div
              key={page.id}
              ref={(el) => {
                pageRefs.current[idx] = el;
              }}
              data-page-idx={idx}
              className="shrink-0 w-full min-w-0"
            >
              {mountSheet ? (
                <PageSheet
                  page={page}
                  displayWidth={0}
                  tool={tool}
                  color={color}
                  thickness={thickness}
                  onChange={(patch) => onPageUpdate(page.id, patch)}
                  pushUndo={(snap) => pushUndo(page.id, snap)}
                  isActive={idx === currentPageIdx}
                  writeZoom={idx === currentPageIdx ? writeZoom : 1}
                  writePan={idx === currentPageIdx ? writePan : { x: 0, y: 0 }}
                  onWritePanChange={idx === currentPageIdx ? onWritePanChange : undefined}
                  onWriteZoomChange={idx === currentPageIdx ? onWriteZoomChange : undefined}
                  stylusOnly={stylusOnly}
                  pageSyncRevision={pageSyncRevision}
                  scrollDirection={scrollDirection}
                  onPenActiveChange={setPenLock}
                  penLock={penLock}
                  onRequestActivate={() => {
                    if (idx !== currentPageIdxRef.current) onPageChange(idx);
                  }}
                  onScrollChain={idx === currentPageIdx ? handleScrollChain : undefined}
                />
              ) : (
                <PagePlaceholder
                  idx={idx}
                  onActivate={() => {
                    if (idx !== currentPageIdxRef.current) onPageChange(idx);
                  }}
                />
              )}
            </div>
          );
        })}
        {autoAddPage && (
          <div
            className={`shrink-0 flex items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md bg-white/40 dark:bg-chrome-900/20 ${
              isVertical ? 'w-full' : 'h-full'
            }`}
            style={
              isVertical
                ? { width: '100%', minHeight: 120, padding: '2rem 0' }
                : { width: 120, minHeight: 240, padding: '0 2rem' }
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
