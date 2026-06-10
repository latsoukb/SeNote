import React, { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { makeId } from '../lib/id';
import { PAGE_W, PAGE_H } from '../lib/pageDimensions';
import { getPageBackground, getPaperZoomStyle } from '../lib/pageTemplates';
import { detectShape, shapeToStroke, looksLikeHandwriting } from '../lib/shapeDetection';
import {
  drawShape,
  hitTestStroke,
  getStrokeBounds,
  moveStroke,
  updateShapeFromHandle,
  shapeToPoints,
} from '../lib/shapeGeometry';
import { snapToInstruments, instrumentEdgeKey } from '../lib/instrumentSnap';
import {
  eraseStrokes,
  eraseTextBoxes,
  eraseInstruments,
} from '../lib/eraser';
import TextBox from './TextBox';
import TextBoxToolbar from './TextBoxToolbar';
import GeometryInstruments from './GeometryInstruments';
import ShapeEditor from './ShapeEditor';
import LassoSelection from './LassoSelection';
import {
  canDrawWithPointer,
  shouldIgnoreDrawPointer,
  isPalmTouch,
  isFingerPointer,
  beginPenSession,
  endPenSession,
  isPenSessionActive,
} from '../lib/pointerInput';
import {
  getCoalescedPointerEvents,
  shouldAddPoint,
  pressureWidth,
  clampPan,
  focalPan,
  getPanEdgeOverflow,
} from '../lib/inkEngine';
import { strokeToSvgPath } from '../lib/strokeSvg';
import InkSvgLayer from './InkSvgLayer';
import { MIN_ZOOM, MAX_ZOOM } from './NoteCanvas';

const SHAPE_DELAY_MS = 650;

const PageSheet = ({
  page,
  displayWidth,
  tool,
  color,
  thickness,
  onChange,
  pushUndo,
  isActive,
  writeZoom = 1,
  writePan = { x: 0, y: 0 },
  onWritePanChange,
  onWriteZoomChange,
  stylusOnly = true,
  pageSyncRevision = 0,
  scrollDirection = 'vertical',
  onPenActiveChange,
  penLock = false,
  onRequestActivate,
  onScrollChain,
}) => {
  const pointerLayerRef = useRef(null);
  const livePathRef = useRef(null);
  const [inkVersion, setInkVersion] = useState(0);
  const [eraserRing, setEraserRing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const currentStrokeRef = useRef(null);
  const instrumentStartRef = useRef(null);
  const instrumentEdgeRef = useRef(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [selectedStrokeId, setSelectedStrokeId] = useState(null);
  const [dragFrame, setDragFrame] = useState(0);
  const shapeTimerRef = useRef(null);
  const pendingStrokeIdRef = useRef(null);
  const eraserPathRef = useRef([]);
  const strokesRef = useRef(page.strokes || []);
  const liveStrokesRef = useRef(null);
  const liveTextBoxesRef = useRef(null);
  const liveInstrumentsRef = useRef(null);
  const [erasePreview, setErasePreview] = useState(null);
  const rafRef = useRef(null);
  const constraintRef = useRef(false);
  const pageIdRef = useRef(page.id);
  const lastSyncRevRef = useRef(pageSyncRevision);
  const lassoDragRef = useRef(null);
  const lassoOrigStrokeRef = useRef(null);
  const textTapRef = useRef(null);
  const viewportRef = useRef(null);
  const [layoutWidth, setLayoutWidth] = useState(displayWidth);
  const pinchRef = useRef(null);
  const touchPanRef = useRef(null);
  const writeZoomRef = useRef(writeZoom);
  const writePanRef = useRef(writePan);
  const onZoomRef = useRef(onWriteZoomChange);
  const onPanRef = useRef(onWritePanChange);
  const stylusOnlyRef = useRef(stylusOnly);
  const penPointerRef = useRef(false);
  const onScrollChainRef = useRef(onScrollChain);
  const scrollDirRef = useRef(scrollDirection);
  onScrollChainRef.current = onScrollChain;
  scrollDirRef.current = scrollDirection;
  writeZoomRef.current = writeZoom;
  writePanRef.current = writePan;
  stylusOnlyRef.current = stylusOnly;
  onZoomRef.current = onWriteZoomChange;
  onPanRef.current = onWritePanChange;

  const strokesDataChanged = (prop, local) => {
    if ((prop?.length ?? 0) !== (local?.length ?? 0)) return true;
    const localIds = new Set((local || []).map((s) => s.id));
    if ((prop || []).some((s) => !localIds.has(s.id))) return true;
    return prop.some((s, i) => {
      const l = local[i];
      if (!l || s.id !== l.id) return true;
      if ((s.points?.length ?? 0) !== (l.points?.length ?? 0)) return true;
      if (s.shape?.type !== l.shape?.type) return true;
      return false;
    });
  };

  const cloneUndoSnapshot = useCallback(
    () => ({
      strokes: (strokesRef.current || []).map((s) => ({
        ...s,
        points: s.points ? s.points.map((p) => ({ ...p })) : s.points,
        shape: s.shape ? { ...s.shape } : s.shape,
      })),
      textBoxes: (page.textBoxes || []).map((t) => ({ ...t })),
      instruments: (page.instruments || []).map((i) => ({ ...i })),
    }),
    [page.textBoxes, page.instruments]
  );

  const applyStrokesFromProps = useCallback(() => {
    strokesRef.current = (page.strokes || []).map((s) => ({
      ...s,
      points: s.points ? [...s.points] : s.points,
      shape: s.shape ? { ...s.shape } : s.shape,
    }));
    setInkVersion((v) => v + 1);
  }, [page.strokes]);

  const syncStrokesFromProps = useCallback(() => {
    if (isDrawing || liveStrokesRef.current || currentStrokeRef.current) return false;
    const prop = page.strokes || [];
    const local = strokesRef.current || [];
    const pendingAppend =
      local.length > prop.length && prop.every((s, i) => local[i]?.id === s.id);
    if (strokesDataChanged(prop, local) && !pendingAppend) {
      applyStrokesFromProps();
      return true;
    }
    return false;
  }, [page.strokes, isDrawing, applyStrokesFromProps]);

  useEffect(() => {
    if (page.id !== pageIdRef.current) {
      strokesRef.current = page.strokes || [];
      pageIdRef.current = page.id;
      setInkVersion((v) => v + 1);
    }
  }, [page.id, page.strokes]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setLayoutWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (displayWidth > 0) setLayoutWidth(displayWidth);
  }, [displayWidth]);

  useEffect(() => {
    if (!isActive || !onWritePanChange || writeZoom <= 1) return;
    const el = viewportRef.current;
    if (!el) return;
    const clamped = clampPan(writePan, writeZoom, el.clientWidth, el.clientHeight);
    if (clamped.x !== writePan.x || clamped.y !== writePan.y) {
      onWritePanChange(clamped);
    }
  }, [writeZoom, writePan, isActive, onWritePanChange]);

  useEffect(() => {
    if (!isActive) return;
    const el = viewportRef.current;
    if (!el) return;

    const applyZoom = (newZoom, clientX, clientY, fromPinch) => {
      const onZoom = onZoomRef.current;
      const onPan = onPanRef.current;
      if (!onZoom) return;

      const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      if (clampedZoom <= 1) {
        onZoom(clampedZoom);
        onPan?.({ x: 0, y: 0 });
        return;
      }

      const rect = el.getBoundingClientRect();
      const focalX = clientX - rect.left;
      const focalY = clientY - rect.top;
      const prevZoom =
        fromPinch && pinchRef.current ? pinchRef.current.lastZoom : writeZoomRef.current;
      const prevPan =
        fromPinch && pinchRef.current ? pinchRef.current.pan : writePanRef.current;
      const rawPan = focalPan(focalX, focalY, prevPan, prevZoom, clampedZoom);
      const newPan = clampPan(rawPan, clampedZoom, rect.width, rect.height);

      if (fromPinch && pinchRef.current) {
        pinchRef.current.lastZoom = clampedZoom;
        pinchRef.current.pan = newPan;
      }
      onZoom(clampedZoom);
      onPan?.(newPan);
    };

    const onTouchStart = (e) => {
      if (isPenSessionActive()) {
        e.preventDefault();
        return;
      }
      if (e.touches.length === 2) {
        touchPanRef.current = null;
        const [t0, t1] = e.touches;
        pinchRef.current = {
          dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
          zoom: writeZoomRef.current,
          pan: { ...writePanRef.current },
          lastZoom: writeZoomRef.current,
        };
        return;
      }
      if (
        e.touches.length === 1 &&
        writeZoomRef.current > 1.01 &&
        onPanRef.current &&
        !isPenSessionActive()
      ) {
        const t = e.touches[0];
        touchPanRef.current = {
          x: t.clientX,
          y: t.clientY,
          panX: writePanRef.current.x,
          panY: writePanRef.current.y,
        };
      }
    };

    const onTouchMove = (e) => {
      if (isPenSessionActive()) {
        e.preventDefault();
        return;
      }
      if (e.touches.length === 1 && touchPanRef.current && writeZoomRef.current > 1.01) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - touchPanRef.current.x;
        const dy = t.clientY - touchPanRef.current.y;
        const vertical = scrollDirRef.current !== 'horizontal';
        const pan = writePanRef.current;
        const zoom = writeZoomRef.current;
        const w = el.clientWidth;
        const h = el.clientHeight;
        const raw = {
          x: touchPanRef.current.panX + dx,
          y: touchPanRef.current.panY + dy,
        };
        const next = clampPan(raw, zoom, w, h);
        const unchanged =
          Math.abs(next.x - pan.x) < 0.5 && Math.abs(next.y - pan.y) < 0.5;
        if (unchanged && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
          const overflow = getPanEdgeOverflow(pan, zoom, w, h, dx, dy, vertical);
          if (overflow && onScrollChainRef.current) {
            onScrollChainRef.current(dx, dy);
            touchPanRef.current = {
              x: t.clientX,
              y: t.clientY,
              panX: pan.x,
              panY: pan.y,
            };
            return;
          }
        }
        onPanRef.current?.(next);
        touchPanRef.current = {
          x: t.clientX,
          y: t.clientY,
          panX: next.x,
          panY: next.y,
        };
        return;
      }
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      touchPanRef.current = null;
      const [t0, t1] = e.touches;
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const ratio = dist / pinchRef.current.dist;
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, pinchRef.current.zoom * ratio)
      );
      const cx = (t0.clientX + t1.clientX) / 2;
      const cy = (t0.clientY + t1.clientY) / 2;
      applyZoom(next, cx, cy, true);
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) touchPanRef.current = null;
      if (e.touches.length < 2) pinchRef.current = null;
    };

    const wantsZoom = (e) => e.ctrlKey || e.metaKey || e.altKey;

    const onWheel = (e) => {
      if (writeZoomRef.current > 1.01 && onPanRef.current && !wantsZoom(e)) {
        e.preventDefault();
        e.stopPropagation();
        const pan = writePanRef.current;
        const zoom = writeZoomRef.current;
        const w = el.clientWidth;
        const h = el.clientHeight;
        const vertical = scrollDirRef.current !== 'horizontal';
        const raw = { x: pan.x - e.deltaX, y: pan.y - e.deltaY };
        const next = clampPan(raw, zoom, w, h);
        const unchanged =
          Math.abs(next.x - pan.x) < 0.5 && Math.abs(next.y - pan.y) < 0.5;
        if (unchanged && (Math.abs(e.deltaX) > 1 || Math.abs(e.deltaY) > 1)) {
          const overflow = getPanEdgeOverflow(
            pan,
            zoom,
            w,
            h,
            -e.deltaX,
            -e.deltaY,
            vertical
          );
          if (overflow && onScrollChainRef.current) {
            onScrollChainRef.current(-e.deltaX, -e.deltaY);
            return;
          }
        }
        onPanRef.current(next);
        return;
      }
      if (!wantsZoom(e)) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, writeZoomRef.current + delta)
      );
      applyZoom(next, e.clientX, e.clientY, false);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false, capture: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel, { capture: true });
    };
  }, [isActive]);

  useEffect(
    () => () => {
      if (penPointerRef.current) {
        penPointerRef.current = false;
        endPenSession();
        onPenActiveChange?.(false);
      }
    },
    [onPenActiveChange]
  );

  const baseW = layoutWidth;
  const displayHeight = layoutWidth * (PAGE_H / PAGE_W);
  const scale = layoutWidth / PAGE_W;
  const instruments = erasePreview?.instruments ?? page.instruments ?? [];
  const displayTextBoxes = erasePreview?.textBoxes ?? page.textBoxes ?? [];
  const hasSnapInstruments = instruments.some(
    (i) => i.type === 'ruler' || i.type === 'setSquare'
  );

  const eraserRadius = () => Math.max(10, thickness * 3.5);

  const getPosFromClient = (clientX, clientY, pressure = 0.5) => {
    const surface = pointerLayerRef.current;
    if (!surface) return { x: 0, y: 0, pressure };
    const rect = surface.getBoundingClientRect();
    let pos = {
      x: ((clientX - rect.left) / rect.width) * PAGE_W,
      y: ((clientY - rect.top) / rect.height) * PAGE_H,
      pressure,
    };
    if ((tool === 'pen' || tool === 'highlighter') && hasSnapInstruments) {
      pos = snapToInstruments(pos, instruments);
    }
    return pos;
  };

  const getPos = (e) => getPosFromClient(e.clientX, e.clientY, e.pressure > 0 ? e.pressure : 0.5);

  const bumpInk = useCallback(() => setInkVersion((v) => v + 1), []);

  const updateLivePath = useCallback(() => {
    const el = livePathRef.current;
    const stroke = currentStrokeRef.current;
    if (!el) return;
    if (!stroke?.points?.length) {
      el.setAttribute('d', '');
      return;
    }
    const isHi = stroke.type === 'highlighter';
    el.setAttribute('d', strokeToSvgPath(stroke));
    el.setAttribute('stroke', stroke.color);
    el.setAttribute('stroke-width', String(stroke.thickness));
    el.setAttribute('stroke-linecap', isHi ? 'butt' : 'round');
    el.setAttribute('opacity', isHi ? '0.5' : '1');
    el.style.mixBlendMode = isHi ? 'multiply' : '';
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (tool === 'eraser' && liveStrokesRef.current) {
        bumpInk();
        const last = eraserPathRef.current[eraserPathRef.current.length - 1];
        if (last) {
          setEraserRing({ x: last.x, y: last.y, r: Math.max(10, thickness * 3.5) });
        }
      } else {
        updateLivePath();
      }
    });
  }, [tool, thickness, bumpInk, updateLivePath]);

  useLayoutEffect(() => {
    const forceFromUndo = pageSyncRevision !== lastSyncRevRef.current;
    if (forceFromUndo) {
      lastSyncRevRef.current = pageSyncRevision;
      if (!isDrawing && !liveStrokesRef.current && !currentStrokeRef.current) {
        applyStrokesFromProps();
      }
    } else {
      syncStrokesFromProps();
    }
    bumpInk();
  }, [
    bumpInk,
    syncStrokesFromProps,
    applyStrokesFromProps,
    page.id,
    page.strokes,
    pageSyncRevision,
    isActive,
    isDrawing,
    writeZoom,
    writePan.x,
    writePan.y,
  ]);

  useEffect(() => {
    const onTouch = (e) => {
      if (pendingStrokeIdRef.current && e.touches.length >= 2) {
        constraintRef.current = true;
      }
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  const clearShapeTimer = () => {
    if (shapeTimerRef.current) {
      clearTimeout(shapeTimerRef.current);
      shapeTimerRef.current = null;
    }
    pendingStrokeIdRef.current = null;
  };

  const applyShapeConversion = (strokeId) => {
    const list = strokesRef.current || [];
    const idx = list.findIndex((s) => s.id === strokeId);
    if (idx < 0) return;
    const stroke = list[idx];
    if (!stroke.points || stroke.points.length < 20 || stroke.shape) return;
    if (looksLikeHandwriting(stroke.points)) return;

    const shape = detectShape(stroke.points, {
      forceSquare: constraintRef.current,
      forceCircle: constraintRef.current,
    });
    if (!shape) return;

    const snapped = shapeToStroke(shape, stroke.color, stroke.thickness, stroke.type);
    if (!snapped) return;

    snapped.id = stroke.id;
    const next = [...list];
    next[idx] = snapped;
    strokesRef.current = next;
    onChange({ strokes: next });
    bumpInk();
  };

  const scheduleShapeConversion = (strokeId) => {
    clearShapeTimer();
    pendingStrokeIdRef.current = strokeId;
    shapeTimerRef.current = setTimeout(() => {
      shapeTimerRef.current = null;
      pendingStrokeIdRef.current = null;
      applyShapeConversion(strokeId);
    }, SHAPE_DELAY_MS);
  };

  const strokeList = strokesRef.current ?? page.strokes ?? [];
  void dragFrame;
  const selectedStroke = strokeList.find((s) => s.id === selectedStrokeId);
  const selectedTextBox = (page.textBoxes || []).find((t) => t.id === selectedTextId);

  const commitStrokes = (next) => {
    strokesRef.current = next;
    onChange({ strokes: next });
    bumpInk();
  };

  const handleShapeHandleDrag = (handleId, e) => {
    if (!selectedStroke?.shape) return;
    const pos = getPos(e);
    const newShape = updateShapeFromHandle(selectedStroke.shape, handleId, pos);
    const newPoints = shapeToPoints(newShape);
    const next = strokeList.map((s) =>
      s.id === selectedStrokeId ? { ...s, shape: newShape, points: newPoints } : s
    );
    strokesRef.current = next;
    onChange({ strokes: next });
    scheduleRender();
  };

  const getTextBoxBounds = (t, pad = 12) => {
    const w = t.width || Math.max(120, (t.text?.length || 1) * (t.size || 16) * 0.55 + 16);
    const lines = Math.max(1, (t.text || '').split('\n').length);
    const h = Math.max((t.size || 16) * 1.6, lines * (t.size || 16) * 1.4);
    return { x: t.x - pad, y: t.y - pad, w: w + pad * 2, h: h + pad * 2 };
  };

  const hitTestTextAt = (pos, pad = 12) => {
    const boxes = page.textBoxes || [];
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = getTextBoxBounds(boxes[i], pad);
      if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
        return boxes[i];
      }
    }
    return null;
  };

  const selectTextAt = (pos) => {
    const hit = hitTestTextAt(pos);
    if (hit) {
      setSelectedTextId(hit.id);
      setSelectedStrokeId(null);
      return true;
    }
    return false;
  };

  const selectStrokeAt = (pos) => {
    const list = strokesRef.current || page.strokes || [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (hitTestStroke(list[i], pos, 18)) {
        setSelectedStrokeId(list[i].id);
        setSelectedTextId(null);
        return list[i];
      }
    }
    setSelectedStrokeId(null);
    return null;
  };

  const clampedPan = (pan) => {
    const el = viewportRef.current;
    if (!el || writeZoom <= 1) return { x: 0, y: 0 };
    return clampPan(pan, writeZoom, el.clientWidth, el.clientHeight);
  };

  const startPan = (e, target = e.currentTarget) => {
    if (!isActive || writeZoom <= 1 || !onWritePanChange) return;
    e.preventDefault();
    e.stopPropagation();
    touchPanRef.current = null;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: writePan.x, panY: writePan.y };
    target?.setPointerCapture?.(e.pointerId);
  };

  const setPenActive = (active, pointerType) => {
    if (pointerType !== 'pen') return;
    if (active && !penPointerRef.current) {
      penPointerRef.current = true;
      beginPenSession();
      onPenActiveChange?.(true);
    } else if (!active && penPointerRef.current) {
      penPointerRef.current = false;
      endPenSession();
      onPenActiveChange?.(false);
    }
  };

  const startDraw = (e) => {
    if (isPalmTouch(e)) return;

    // Doigt / paume : scroll natif (même sur une page non « courante »)
    if (stylusOnly && shouldIgnoreDrawPointer(e, stylusOnly)) return;

    // Stylet sur une autre page visible → activation automatique
    if (!isActive) {
      if (!stylusOnly || !canDrawWithPointer(e, stylusOnly)) return;
      onRequestActivate?.();
    }

    if (tool === 'ruler') return;
    if (stylusOnly && !canDrawWithPointer(e, stylusOnly)) return;

    if (tool === 'lasso') {
      e.preventDefault();
      pointerLayerRef.current?.setPointerCapture(e.pointerId);
      setPenActive(true, e.pointerType);
      const pos = getPos(e);
      if (selectTextAt(pos)) return;
      const hit = selectStrokeAt(pos);
      if (hit) {
        pushUndo(cloneUndoSnapshot());
        lassoOrigStrokeRef.current = hit;
        lassoDragRef.current = { startPos: pos, moved: false };
        setIsDrawing(true);
      }
      return;
    }

    if (tool === 'text') {
      e.preventDefault();
      const pos = getPos(e);
      const hit = hitTestTextAt(pos);
      if (hit) {
        if (selectedTextId === hit.id) {
          setEditingTextId(hit.id);
        } else {
          setSelectedTextId(hit.id);
          setSelectedStrokeId(null);
          setEditingTextId(null);
        }
      } else {
        textTapRef.current = { pos, x: e.clientX, y: e.clientY };
        setSelectedTextId(null);
        setEditingTextId(null);
      }
      return;
    }

    e.preventDefault();
    pointerLayerRef.current?.setPointerCapture(e.pointerId);
    setPenActive(true, e.pointerType);

    clearShapeTimer();
    constraintRef.current = false;

    const pos = getPos(e);

    if (tool === 'eraser') {
      pushUndo(cloneUndoSnapshot());
      liveStrokesRef.current = [...(strokesRef.current || [])];
      liveTextBoxesRef.current = [...(page.textBoxes || [])];
      liveInstrumentsRef.current = [...(page.instruments || [])];
      eraserPathRef.current = [pos];
      setErasePreview(null);
      setIsDrawing(true);
      eraseAt(pos);
      scheduleRender();
      return;
    }

    if (!instrumentStartRef.current) {
      pushUndo(cloneUndoSnapshot());
    }
    setSelectedStrokeId(null);

    const stroke = {
      id: makeId('s'),
      type: tool,
      color,
      thickness: pressureWidth(thickness, pos.pressure, tool),
      points: [{ x: pos.x, y: pos.y }],
    };

    if (pos.onRuler) {
      instrumentStartRef.current = { x: pos.x, y: pos.y };
      instrumentEdgeRef.current = instrumentEdgeKey(pos);
    }

    currentStrokeRef.current = stroke;
    setIsDrawing(true);
    scheduleRender();
  };

  const moveDraw = (e) => {
    if (isPanning && onWritePanChange) {
      e.preventDefault();
      onWritePanChange(
        clampedPan({
          x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
          y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
        })
      );
      return;
    }
    if (tool === 'lasso' && lassoDragRef.current && lassoOrigStrokeRef.current) {
      e.preventDefault();
      const pos = getPos(e);
      const dx = pos.x - lassoDragRef.current.startPos.x;
      const dy = pos.y - lassoDragRef.current.startPos.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        lassoDragRef.current.moved = true;
        const moved = moveStroke(lassoOrigStrokeRef.current, dx, dy);
        const next = (strokesRef.current || []).map((s) =>
          s.id === moved.id ? moved : s
        );
        strokesRef.current = next;
        scheduleRender();
        setDragFrame((n) => n + 1);
      }
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);

    if (tool === 'eraser') {
      eraserPathRef.current.push(pos);
      eraseAt(pos);
      scheduleRender();
      return;
    }

    if (instrumentStartRef.current) {
      const hit = snapToInstruments(pos, instruments, 36);
      if (hit?.onRuler) {
        const key = instrumentEdgeKey(hit);
        if (key === instrumentEdgeRef.current) {
          currentStrokeRef.current.points = [
            instrumentStartRef.current,
            { x: hit.x, y: hit.y },
          ];
        } else {
          instrumentStartRef.current = { x: hit.x, y: hit.y };
          instrumentEdgeRef.current = key;
          currentStrokeRef.current.points = [
            instrumentStartRef.current,
            { x: hit.x, y: hit.y },
          ];
        }
      }
      scheduleRender();
      return;
    }

    if (currentStrokeRef.current?.points) {
      const pts = currentStrokeRef.current.points;
      const events = getCoalescedPointerEvents(e);
      let changed = false;
      events.forEach((ev) => {
        const p = getPosFromClient(
          ev.clientX,
          ev.clientY,
          ev.pressure > 0 ? ev.pressure : 0.5
        );
        const last = pts[pts.length - 1];
        if (shouldAddPoint(last, p)) {
          pts.push({ x: p.x, y: p.y });
          changed = true;
        }
      });
      if (changed) scheduleRender();
    }
  };

  const endDraw = (e) => {
    if (tool === 'text' && textTapRef.current) {
      const tap = textTapRef.current;
      textTapRef.current = null;
      const moved =
        e && Math.hypot((e.clientX || tap.x) - tap.x, (e.clientY || tap.y) - tap.y) > 6;
      if (!moved && !hitTestTextAt(tap.pos)) {
        const newBox = {
          id: makeId('t'),
          x: tap.pos.x,
          y: tap.pos.y,
          text: '',
          color,
          size: Math.max(16, thickness * 6),
          width: 200,
        };
        pushUndo(cloneUndoSnapshot());
        onChange({ textBoxes: [...(page.textBoxes || []), newBox] });
        setEditingTextId(newBox.id);
        setSelectedTextId(newBox.id);
      }
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      e?.currentTarget?.releasePointerCapture?.(e.pointerId);
      setPenActive(false, e?.pointerType);
      return;
    }
    if (tool === 'lasso' && lassoDragRef.current) {
      setIsDrawing(false);
      pointerLayerRef.current?.releasePointerCapture?.(e?.pointerId);
      setPenActive(false, e?.pointerType);
      if (lassoDragRef.current.moved) {
        commitStrokes(strokesRef.current || []);
      }
      lassoDragRef.current = null;
      lassoOrigStrokeRef.current = null;
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    pointerLayerRef.current?.releasePointerCapture?.(e?.pointerId);
    setPenActive(false, e?.pointerType);

    if (tool === 'eraser') {
      const radius = eraserRadius();
      const path = eraserPathRef.current;
      const erasedStrokes = eraseStrokes(liveStrokesRef.current || strokesRef.current || [], path, radius);
      strokesRef.current = erasedStrokes;
      onChange({
        strokes: erasedStrokes,
        textBoxes: eraseTextBoxes(liveTextBoxesRef.current || page.textBoxes || [], path, radius),
        instruments: eraseInstruments(
          liveInstrumentsRef.current || page.instruments || [],
          path,
          radius
        ),
      });
      liveStrokesRef.current = null;
      liveTextBoxesRef.current = null;
      liveInstrumentsRef.current = null;
      eraserPathRef.current = [];
      setErasePreview(null);
      setEraserRing(null);
      bumpInk();
      return;
    }

    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (livePathRef.current) livePathRef.current.setAttribute('d', '');
    instrumentStartRef.current = null;
    instrumentEdgeRef.current = null;

    if (!stroke) return;

    if (stroke.points?.length >= 1) {
      let saved = stroke;
      if (saved.points.length === 1) {
        const p = saved.points[0];
        saved = { ...saved, points: [p, { x: p.x + 0.5, y: p.y + 0.5 }] };
      }

      const nextStrokes = [...strokesRef.current, saved];
      strokesRef.current = nextStrokes;
      onChange({ strokes: nextStrokes });
      bumpInk();

      if (tool === 'pen' && saved.points.length >= 20 && !looksLikeHandwriting(saved.points)) {
        scheduleShapeConversion(saved.id);
      }
    }
  };

  const eraseAt = (pos) => {
    const radius = eraserRadius();
    const path = eraserPathRef.current.length ? eraserPathRef.current : [pos];
    const erased = eraseStrokes(liveStrokesRef.current ?? strokesRef.current ?? [], path, radius);
    liveStrokesRef.current = erased;
    strokesRef.current = erased;
    liveTextBoxesRef.current = eraseTextBoxes(
      liveTextBoxesRef.current ?? page.textBoxes ?? [],
      path,
      radius
    );
    liveInstrumentsRef.current = eraseInstruments(
      liveInstrumentsRef.current ?? page.instruments ?? [],
      path,
      radius
    );
    setErasePreview({
      strokes: liveStrokesRef.current,
      textBoxes: liveTextBoxesRef.current,
      instruments: liveInstrumentsRef.current,
    });
    setEraserRing({ x: pos.x, y: pos.y, r: radius });
  };

  const bg = getPageBackground(page);
  const cursorClass =
    tool === 'eraser'
      ? 'canvas-eraser'
      : tool === 'text'
        ? 'canvas-text'
        : tool === 'lasso'
            ? 'canvas-lasso'
            : 'canvas-pen';

  const effectiveZoom = isActive ? writeZoom : 1;
  const paperZoomStyle =
    bg.type === 'css' && !page?.pdfBackground
      ? getPaperZoomStyle(page?.template, effectiveZoom)
      : undefined;
  const baseH = displayHeight;
  const contentW = layoutWidth * effectiveZoom;
  const contentH = displayHeight * effectiveZoom;
  const visualScale = scale * effectiveZoom;
  const panX = isActive && effectiveZoom > 1 ? writePan.x : 0;
  const panY = isActive && effectiveZoom > 1 ? writePan.y : 0;
  void inkVersion;
  const inkStrokes = erasePreview?.strokes ?? strokesRef.current ?? [];
  const isZoomedForPan = isActive && writeZoom > 1.01;
  // Zoomé : pan au doigt en JS + passage auto à la page suivante au bord
  const pageTouchAction =
    penLock || isPenSessionActive() || isZoomedForPan
      ? 'none'
      : scrollDirection === 'horizontal'
        ? 'pan-x'
        : 'pan-y';
  const selectionBounds = tool === 'lasso' && selectedStroke ? getStrokeBounds(selectedStroke) : null;

  const pageContent = (
    <>
      {bg.type === 'image' ? (
        <img
          src={bg.src}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ objectFit: 'fill' }}
          draggable={false}
        />
      ) : (
        <div
          className={`absolute inset-0 ${bg.className || 'bg-white'}`}
          style={paperZoomStyle}
        />
      )}
      <InkSvgLayer
        strokes={inkStrokes}
        livePathRef={livePathRef}
        eraserPreview={eraserRing}
      />
      <div
        ref={pointerLayerRef}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
        className={`absolute inset-0 ${cursorClass}`}
        style={{
          touchAction: pageTouchAction,
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      />
      <GeometryInstruments
        instruments={instruments}
        scale={visualScale}
        zoom={1}
        tool={tool}
        onChange={(next) => onChange({ instruments: next })}
      />
      <div
        className="absolute inset-0"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          transform: `scale(${visualScale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        {(displayTextBoxes || []).map((t) => (
          <TextBox
            key={t.id}
            box={{ ...t, scale: visualScale, zoom: 1 }}
            tool={tool}
            editing={editingTextId === t.id}
            selected={selectedTextId === t.id}
            onSelect={() => {
              if (selectedTextId === t.id) {
                setEditingTextId(t.id);
              } else {
                setSelectedTextId(t.id);
                setSelectedStrokeId(null);
                setEditingTextId(null);
              }
            }}
            onDragStart={() => pushUndo(cloneUndoSnapshot())}
            onEdit={() => {
              setEditingTextId(t.id);
              setSelectedTextId(t.id);
            }}
            onBlur={() => setEditingTextId(null)}
            onChange={(patch) =>
              onChange({
                textBoxes: (page.textBoxes || []).map((b) =>
                  b.id === t.id ? { ...b, ...patch } : b
                ),
              })
            }
          />
        ))}
        {(tool === 'lasso' || tool === 'text') && selectedTextBox && !editingTextId && (
          <TextBoxToolbar
            box={selectedTextBox}
            scale={visualScale}
            onChange={(patch) =>
              onChange({
                textBoxes: (page.textBoxes || []).map((b) =>
                  b.id === selectedTextId ? { ...b, ...patch } : b
                ),
              })
            }
          />
        )}
        {tool === 'lasso' && selectionBounds && (
          <LassoSelection bounds={selectionBounds} scale={visualScale} />
        )}
        {tool === 'lasso' && selectedStroke?.shape && (
          <ShapeEditor
            shape={selectedStroke.shape}
            scale={visualScale}
            onHandleDrag={handleShapeHandleDrag}
          />
        )}
      </div>
    </>
  );

  return (
    <div
      ref={viewportRef}
      data-page-viewport
      className={`relative bg-white overflow-hidden shadow-lg ${isActive ? 'ring-2 ring-blue-500/40' : ''}`}
      style={{ width: '100%', height: baseH, touchAction: pageTouchAction }}
      onPointerMove={isPanning ? moveDraw : undefined}
      onPointerUp={isPanning ? endDraw : undefined}
      onPointerCancel={isPanning ? endDraw : undefined}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: contentW,
          height: contentH,
          transform: panX || panY ? `translate(${panX}px, ${panY}px)` : undefined,
          willChange: effectiveZoom > 1 ? 'transform' : undefined,
        }}
      >
        <div className="relative" style={{ width: contentW, height: contentH }}>
          {pageContent}
        </div>
      </div>
      {isActive && effectiveZoom !== 1 && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium z-30 pointer-events-none">
          {Math.round(effectiveZoom * 100)}%
        </div>
      )}
    </div>
  );
};

export default PageSheet;
