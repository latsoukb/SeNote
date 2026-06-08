import React, { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { makeId } from '../lib/id';
import { PAGE_W, PAGE_H } from '../lib/pageDimensions';
import { getTemplateBackground } from '../lib/pageTemplates';
import { detectShape, shapeToStroke, looksLikeHandwriting } from '../lib/shapeDetection';
import {
  drawShape,
  hitTestStroke,
  getStrokeBounds,
  moveStroke,
  updateShapeFromHandle,
  shapeToPoints,
} from '../lib/shapeGeometry';
import { snapToInstruments, projectOnRuler } from '../lib/instrumentSnap';
import {
  eraseStrokes,
  eraseTextBoxes,
  eraseInstruments,
  isScribbleGesture,
  strokesUnderScribble,
  textBoxesUnderScribble,
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
} from '../lib/pointerInput';

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
  stylusOnly = true,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const currentStrokeRef = useRef(null);
  const rulerStartRef = useRef(null);
  const rulerEdgeRef = useRef(null);
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
  const lassoDragRef = useRef(null);
  const lassoOrigStrokeRef = useRef(null);
  const textTapRef = useRef(null);

  useEffect(() => {
    if (page.id !== pageIdRef.current) {
      strokesRef.current = page.strokes || [];
      pageIdRef.current = page.id;
      return;
    }
    if (isDrawing || liveStrokesRef.current || currentStrokeRef.current) return;
    const prop = page.strokes || [];
    const local = strokesRef.current || [];
    const pendingSave =
      local.length > prop.length && prop.every((s, i) => local[i]?.id === s.id);
    if (pendingSave) return;
    if (
      prop.length !== local.length ||
      prop.some((s, i) => s.id !== local[i]?.id)
    ) {
      strokesRef.current = prop;
    }
  }, [page.id, page.strokes, isDrawing]);

  const displayHeight = displayWidth * (PAGE_H / PAGE_W);
  const scale = displayWidth / PAGE_W;
  const instruments = erasePreview?.instruments ?? page.instruments ?? [];
  const displayTextBoxes = erasePreview?.textBoxes ?? page.textBoxes ?? [];
  const ruler = instruments.find((i) => i.type === 'ruler');

  const eraserRadius = () => Math.max(10, thickness * 3.5);

  const getPosFromClient = (clientX, clientY, pressure = 0.5) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let pos = {
      x: ((clientX - rect.left) / rect.width) * PAGE_W,
      y: ((clientY - rect.top) / rect.height) * PAGE_H,
      pressure,
    };
    if ((tool === 'pen' || tool === 'highlighter') && ruler) {
      pos = snapToInstruments(pos, instruments);
    }
    return pos;
  };

  const getPos = (e) => getPosFromClient(e.clientX, e.clientY, e.pressure > 0 ? e.pressure : 0.5);

  const drawStrokePath = (ctx, s) => {
    if (s.shape) {
      drawShape(ctx, s.shape);
      return;
    }
    if (!s.points?.length) return;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    if (s.points.length < 3) {
      s.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    } else {
      for (let i = 1; i < s.points.length - 1; i++) {
        const xc = (s.points[i].x + s.points[i + 1].x) / 2;
        const yc = (s.points[i].y + s.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, xc, yc);
      }
      ctx.lineTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y);
    }
    ctx.stroke();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const list = liveStrokesRef.current ?? strokesRef.current ?? page.strokes ?? [];
    const drawOne = (s) => {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (s.type === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineCap = 'butt';
      }
      drawStrokePath(ctx, s);
      ctx.restore();
    };

    list.forEach(drawOne);
    if (currentStrokeRef.current) drawOne(currentStrokeRef.current);

    if (tool === 'eraser' && isDrawing && eraserPathRef.current.length) {
      const last = eraserPathRef.current[eraserPathRef.current.length - 1];
      const r = Math.max(10, thickness * 3.5);
      ctx.save();
      ctx.strokeStyle = 'rgba(100,116,139,0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(last.x, last.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [page.strokes, tool, isDrawing, thickness]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      renderCanvas();
    });
  }, [renderCanvas]);

  useLayoutEffect(() => {
    renderCanvas();
  }, [renderCanvas, page.id, page.strokes, isActive, writeZoom, writePan.x, writePan.y]);

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
    renderCanvas();
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
    scheduleRender();
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

  const startPan = (e, target = e.currentTarget) => {
    if (!isActive || writeZoom <= 1 || !onWritePanChange) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: writePan.x, panY: writePan.y };
    target?.setPointerCapture?.(e.pointerId);
  };

  const startDraw = (e) => {
    if (!isActive) return;
    if (isPalmTouch(e)) return;

    if (stylusOnly && shouldIgnoreDrawPointer(e, stylusOnly)) {
      if (writeZoom > 1 && onWritePanChange) {
        startPan(e, canvasRef.current);
      }
      return;
    }

    if (tool === 'hand') {
      startPan(e);
      return;
    }
    if (tool === 'ruler') return;

    if (stylusOnly && !canDrawWithPointer(e, stylusOnly)) return;

    if (tool === 'lasso') {
      e.preventDefault();
      canvasRef.current?.setPointerCapture(e.pointerId);
      const pos = getPos(e);
      if (selectTextAt(pos)) return;
      const hit = selectStrokeAt(pos);
      if (hit) {
        pushUndo({
          strokes: strokesRef.current,
          textBoxes: page.textBoxes,
          instruments: page.instruments,
        });
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
    canvasRef.current?.setPointerCapture(e.pointerId);

    clearShapeTimer();
    constraintRef.current = false;

    const pos = getPos(e);

    if (tool === 'eraser') {
      pushUndo({
        strokes: page.strokes,
        textBoxes: page.textBoxes,
        instruments: page.instruments,
      });
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

    if (!rulerStartRef.current) {
      pushUndo({
        strokes: strokesRef.current,
        textBoxes: page.textBoxes,
        instruments: page.instruments,
      });
    }
    setSelectedStrokeId(null);

    const t = thickness * (tool === 'highlighter' ? 1 : 0.35 + pos.pressure * 0.65);
    const stroke = {
      id: makeId('s'),
      type: tool,
      color,
      thickness: tool === 'highlighter' ? Math.max(14, t) : t,
      points: [{ x: pos.x, y: pos.y }],
    };

    if (pos.onRuler && ruler) {
      rulerStartRef.current = { x: pos.x, y: pos.y };
      rulerEdgeRef.current = pos.edge;
    }

    currentStrokeRef.current = stroke;
    setIsDrawing(true);
    scheduleRender();
  };

  const moveDraw = (e) => {
    if (isPanning && onWritePanChange) {
      e.preventDefault();
      onWritePanChange({
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      });
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

    if (rulerStartRef.current && ruler) {
      const hit = projectOnRuler(pos, ruler, 36);
      if (hit && hit.edge === rulerEdgeRef.current) {
        currentStrokeRef.current.points = [rulerStartRef.current, { x: hit.x, y: hit.y }];
      } else if (hit) {
        rulerStartRef.current = { x: hit.x, y: hit.y };
        rulerEdgeRef.current = hit.edge;
        currentStrokeRef.current.points = [rulerStartRef.current, { x: hit.x, y: hit.y }];
      }
      scheduleRender();
      return;
    }

    if (currentStrokeRef.current?.points) {
      const pts = currentStrokeRef.current.points;
      const last = pts[pts.length - 1];
      if ((pos.x - last.x) ** 2 + (pos.y - last.y) ** 2 > 0.8) {
        pts.push({ x: pos.x, y: pos.y });
        scheduleRender();
      }
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
        pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes, instruments });
        onChange({ textBoxes: [...(page.textBoxes || []), newBox] });
        setEditingTextId(newBox.id);
        setSelectedTextId(newBox.id);
      }
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      e?.currentTarget?.releasePointerCapture?.(e.pointerId);
      return;
    }
    if (tool === 'lasso' && lassoDragRef.current) {
      setIsDrawing(false);
      canvasRef.current?.releasePointerCapture?.(e?.pointerId);
      if (lassoDragRef.current.moved) {
        commitStrokes(strokesRef.current || []);
      }
      lassoDragRef.current = null;
      lassoOrigStrokeRef.current = null;
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture?.(e?.pointerId);

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
      renderCanvas();
      return;
    }

    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    rulerStartRef.current = null;
    rulerEdgeRef.current = null;

    if (!stroke) return;

    if (stroke.points?.length >= 1) {
      let saved = stroke;
      if (saved.points.length === 1) {
        const p = saved.points[0];
        saved = { ...saved, points: [p, { x: p.x + 0.5, y: p.y + 0.5 }] };
      }

      const isScribble =
        tool === 'pen' &&
        saved.points.length >= 30 &&
        isScribbleGesture(saved.points) &&
        strokesUnderScribble(strokesRef.current, saved.points, Math.max(20, thickness * 4)).length > 0;

      if (isScribble) {
        const radius = Math.max(20, thickness * 4);
        const toRemove = new Set(
          strokesUnderScribble(strokesRef.current, saved.points, radius).map((s) => s.id)
        );
        const toRemoveText = new Set(
          textBoxesUnderScribble(page.textBoxes || [], saved.points, radius).map((t) => t.id)
        );
        const nextStrokes = strokesRef.current.filter((s) => !toRemove.has(s.id));
        strokesRef.current = nextStrokes;
        onChange({
          strokes: nextStrokes,
          textBoxes: (page.textBoxes || []).filter((t) => !toRemoveText.has(t.id)),
        });
        renderCanvas();
        return;
      }

      const nextStrokes = [...strokesRef.current, saved];
      strokesRef.current = nextStrokes;
      onChange({ strokes: nextStrokes });

      if (tool === 'pen' && saved.points.length >= 20 && !looksLikeHandwriting(saved.points)) {
        scheduleShapeConversion(saved.id);
      }
    }

    renderCanvas();
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
  };

  const bg = getTemplateBackground(page.template);
  const cursorClass =
    tool === 'eraser'
      ? 'canvas-eraser'
      : tool === 'text'
        ? 'canvas-text'
        : tool === 'hand'
          ? 'canvas-hand'
          : tool === 'lasso'
            ? 'canvas-lasso'
            : 'canvas-pen';

  const effectiveZoom = isActive ? writeZoom : 1;
  const baseW = displayWidth;
  const baseH = displayHeight;
  const contentScale = scale;
  const panX = isActive && effectiveZoom > 1 ? writePan.x : 0;
  const panY = isActive && effectiveZoom > 1 ? writePan.y : 0;
  const sheetW = baseW * effectiveZoom;
  const sheetH = baseH * effectiveZoom;
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
        <div className={`absolute inset-0 ${bg.className || 'bg-white'}`} />
      )}
      <canvas
        ref={canvasRef}
        width={PAGE_W}
        height={PAGE_H}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
        className={`absolute inset-0 w-full h-full ${cursorClass}`}
        style={{
          touchAction: stylusOnly ? 'pan-x pan-y' : 'none',
          zIndex: 10,
          pointerEvents: tool === 'hand' && effectiveZoom <= 1 ? 'none' : 'auto',
        }}
      />
      <GeometryInstruments
        instruments={instruments}
        scale={contentScale}
        zoom={effectiveZoom}
        tool={tool}
        onChange={(next) => onChange({ instruments: next })}
      />
      <div
        className="absolute inset-0"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          transform: `scale(${contentScale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        {(displayTextBoxes || []).map((t) => (
          <TextBox
            key={t.id}
            box={{ ...t, scale: contentScale, zoom: effectiveZoom }}
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
            onDragStart={() =>
              pushUndo({
                strokes: strokesRef.current,
                textBoxes: page.textBoxes,
                instruments: page.instruments,
              })
            }
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
            scale={contentScale}
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
          <LassoSelection bounds={selectionBounds} scale={contentScale} />
        )}
        {tool === 'lasso' && selectedStroke?.shape && (
          <ShapeEditor
            shape={selectedStroke.shape}
            scale={contentScale}
            onHandleDrag={handleShapeHandleDrag}
          />
        )}
      </div>
    </>
  );

  return (
    <div
      className={`relative bg-white overflow-hidden shadow-lg ${isActive ? 'ring-2 ring-blue-500/40' : ''}`}
      style={{ width: sheetW, height: sheetH }}
      onPointerDown={
        tool === 'hand' && effectiveZoom > 1 ? (e) => startPan(e) : undefined
      }
      onPointerMove={isPanning ? moveDraw : tool === 'hand' && effectiveZoom > 1 ? moveDraw : undefined}
      onPointerUp={isPanning || (tool === 'hand' && effectiveZoom > 1) ? endDraw : undefined}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: baseW,
          height: baseH,
          transform:
            effectiveZoom !== 1 || panX || panY
              ? `scale(${effectiveZoom}) translate(${panX / effectiveZoom}px, ${panY / effectiveZoom}px)`
              : undefined,
          transformOrigin: 'top left',
        }}
      >
        <div className="relative" style={{ width: baseW, height: baseH }}>
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
