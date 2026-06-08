import React, { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { makeId } from '../lib/id';
import { PAGE_W, PAGE_H } from '../lib/pageDimensions';
import { getTemplateBackground } from '../lib/pageTemplates';
import { detectShape, shapeToStroke } from '../lib/shapeDetection';
import { snapToInstruments, projectOnRuler } from '../lib/instrumentSnap';
import TextBox from './TextBox';
import GeometryInstruments from './GeometryInstruments';

const HOLD_MS = 1000;
const MOVE_THRESHOLD = 5;

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
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const currentStrokeRef = useRef(null);
  const rulerStartRef = useRef(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const holdTimerRef = useRef(null);
  const shapeSnappedRef = useRef(false);
  const drawingRef = useRef(false);
  const lastMoveAtRef = useRef(0);
  const constraintRef = useRef(false);

  const displayHeight = displayWidth * (PAGE_H / PAGE_W);
  const scale = displayWidth / PAGE_W;
  const instruments = page.instruments || [];
  const ruler = instruments.find((i) => i.type === 'ruler');

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pressure = e.pressure > 0 ? e.pressure : 0.5;
    let pos = {
      x: ((e.clientX - rect.left) / rect.width) * PAGE_W,
      y: ((e.clientY - rect.top) / rect.height) * PAGE_H,
      pressure,
    };
    if ((tool === 'pen' || tool === 'highlighter') && ruler) {
      pos = snapToInstruments(pos, instruments);
    }
    return pos;
  };

  const drawStrokePath = (ctx, s) => {
    if (s.shape) {
      const sh = s.shape;
      ctx.beginPath();
      if (sh.type === 'line') {
        ctx.moveTo(sh.x1, sh.y1);
        ctx.lineTo(sh.x2, sh.y2);
      } else if (sh.type === 'circle') {
        ctx.arc(sh.cx, sh.cy, sh.r, 0, Math.PI * 2);
      } else if (sh.type === 'rect') {
        ctx.rect(sh.x, sh.y, sh.w, sh.h);
      } else if (sh.type === 'triangle') {
        ctx.moveTo(sh.x1, sh.y1);
        ctx.lineTo(sh.x2, sh.y2);
        ctx.lineTo(sh.x3, sh.y3);
        ctx.closePath();
      } else if (sh.type === 'arrow') {
        ctx.moveTo(sh.x1, sh.y1);
        ctx.lineTo(sh.x2, sh.y2);
        ctx.moveTo(sh.headLeft.x, sh.headLeft.y);
        ctx.lineTo(sh.x2, sh.y2);
        ctx.lineTo(sh.headRight.x, sh.headRight.y);
      }
      ctx.stroke();
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

    (page.strokes || []).forEach(drawOne);
    if (currentStrokeRef.current) drawOne(currentStrokeRef.current);
  }, [page.strokes]);

  useLayoutEffect(() => {
    renderCanvas();
  }, [renderCanvas, page.id, page.strokes, isActive]);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const attemptShapeSnap = useCallback(() => {
    if (tool !== 'pen' || shapeSnappedRef.current || !currentStrokeRef.current?.points) {
      return false;
    }
    const pts = currentStrokeRef.current.points;
    if (pts.length < 8) return false;
    const shape = detectShape(pts, {
      forceSquare: constraintRef.current,
      forceCircle: constraintRef.current,
    });
    if (!shape) return false;
    const snapped = shapeToStroke(
      shape,
      currentStrokeRef.current.color,
      currentStrokeRef.current.thickness,
      'pen'
    );
    if (!snapped) return false;
    snapped.id = currentStrokeRef.current.id;
    currentStrokeRef.current = snapped;
    shapeSnappedRef.current = true;
    renderCanvas();
    return true;
  }, [tool, renderCanvas]);

  const scheduleHoldSnap = () => {
    if (tool !== 'pen') return;
    const pts = currentStrokeRef.current?.points;
    if (!pts || pts.length < 8) return;
    if (holdTimerRef.current) return;
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      if (!drawingRef.current) return;
      attemptShapeSnap();
    }, HOLD_MS);
  };

  useEffect(() => {
    const onTouch = (e) => {
      if (!drawingRef.current) return;
      if (e.touches.length >= 2) {
        constraintRef.current = true;
        const held = Date.now() - lastMoveAtRef.current >= HOLD_MS * 0.5;
        if (held && !shapeSnappedRef.current) {
          attemptShapeSnap();
        }
      }
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [attemptShapeSnap]);

  const startPan = (e) => {
    if (tool !== 'hand' || !isActive || writeZoom <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: writePan.x, panY: writePan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const startDraw = (e) => {
    if (tool === 'hand') {
      startPan(e);
      return;
    }
    if (tool === 'ruler' || tool === 'text') return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const pos = getPos(e);
    pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes, instruments });
    shapeSnappedRef.current = false;
    rulerStartRef.current = null;
    drawingRef.current = true;
    lastMoveAtRef.current = Date.now();
    constraintRef.current = false;
    clearHoldTimer();

    if (tool === 'eraser') {
      eraseAt(pos);
      setIsDrawing(true);
      return;
    }

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
    }

    currentStrokeRef.current = stroke;
    setIsDrawing(true);
    renderCanvas();
  };

  const moveDraw = (e) => {
    if (isPanning && tool === 'hand') {
      e.preventDefault();
      onWritePanChange?.({
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      });
      return;
    }
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);

    if (tool === 'eraser') {
      eraseAt(pos);
      return;
    }

    if (rulerStartRef.current && ruler) {
      const hit = projectOnRuler(pos, ruler, 40);
      const end = hit || pos;
      currentStrokeRef.current.points = [rulerStartRef.current, { x: end.x, y: end.y }];
      renderCanvas();
      return;
    }

    if (currentStrokeRef.current?.points) {
      const pts = currentStrokeRef.current.points;
      const last = pts[pts.length - 1];
      const moved = (pos.x - last.x) ** 2 + (pos.y - last.y) ** 2;
      if (moved > 1) {
        if (moved > MOVE_THRESHOLD * MOVE_THRESHOLD) {
          clearHoldTimer();
        }
        pts.push({ x: pos.x, y: pos.y });
        lastMoveAtRef.current = Date.now();
        scheduleHoldSnap();
        renderCanvas();
      }
    }
  };

  const endDraw = (e) => {
    if (isPanning) {
      setIsPanning(false);
      e?.currentTarget?.releasePointerCapture?.(e.pointerId);
      return;
    }
    if (!isDrawing) return;
    setIsDrawing(false);
    drawingRef.current = false;
    canvasRef.current?.releasePointerCapture?.(e?.pointerId);

    const heldStill = Date.now() - lastMoveAtRef.current >= HOLD_MS * 0.75;
    if (!shapeSnappedRef.current && heldStill) {
      attemptShapeSnap();
    }
    clearHoldTimer();

    if (currentStrokeRef.current) {
      if (currentStrokeRef.current.points?.length > 1 || currentStrokeRef.current.shape) {
        onChange({ strokes: [...(page.strokes || []), currentStrokeRef.current] });
      }
      currentStrokeRef.current = null;
      rulerStartRef.current = null;
      renderCanvas();
    }
  };

  const eraseAt = (pos) => {
    const radius = Math.max(15, thickness * 3);
    const r2 = radius * radius;
    const remaining = (page.strokes || []).filter(
      (s) => !s.points?.some((p) => (p.x - pos.x) ** 2 + (p.y - pos.y) ** 2 < r2)
    );
    if (remaining.length !== (page.strokes || []).length) {
      onChange({ strokes: remaining });
    }
  };

  const handleClickText = (e) => {
    if (tool !== 'text' || isDrawing) return;
    const pos = getPos(e);
    const newBox = {
      id: makeId('t'),
      x: pos.x,
      y: pos.y,
      text: '',
      color,
      size: Math.max(16, thickness * 6),
      width: 200,
    };
    pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes, instruments });
    onChange({ textBoxes: [...(page.textBoxes || []), newBox] });
    setEditingTextId(newBox.id);
  };

  const bg = getTemplateBackground(page.template);
  const cursorClass =
    tool === 'eraser' ? 'canvas-eraser' : tool === 'text' ? 'canvas-text' : tool === 'hand' ? 'canvas-hand' : 'canvas-pen';

  const zoomed = isActive && writeZoom > 1;
  const innerW = displayWidth * (zoomed ? writeZoom : 1);
  const innerH = displayHeight * (zoomed ? writeZoom : 1);

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
      <GeometryInstruments
        instruments={instruments}
        scale={scale * (zoomed ? writeZoom : 1)}
        tool={tool}
        onChange={(next) => onChange({ instruments: next })}
      />
      <canvas
        ref={canvasRef}
        width={PAGE_W}
        height={PAGE_H}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
        onClick={handleClickText}
        className={`absolute inset-0 w-full h-full ${cursorClass}`}
        style={{
          touchAction: 'none',
          pointerEvents: tool === 'hand' && writeZoom <= 1 ? 'none' : 'auto',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          transform: `scale(${scale * (zoomed ? writeZoom : 1)})`,
          transformOrigin: 'top left',
        }}
      >
        {(page.textBoxes || []).map((t) => (
          <TextBox
            key={t.id}
            box={{ ...t, scale: scale * (zoomed ? writeZoom : 1) }}
            tool={tool}
            editing={editingTextId === t.id}
            onEdit={() => setEditingTextId(t.id)}
            onBlur={() => setEditingTextId(null)}
            onChange={(patch) =>
              onChange({
                textBoxes: (page.textBoxes || []).map((b) =>
                  b.id === t.id ? { ...b, ...patch } : b
                ),
              })
            }
            onDelete={() => {
              pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes, instruments });
              onChange({ textBoxes: (page.textBoxes || []).filter((b) => b.id !== t.id) });
            }}
          />
        ))}
      </div>
    </>
  );

  return (
    <div
      className={`relative bg-white overflow-hidden shadow-lg ${isActive ? 'ring-2 ring-blue-500/40' : ''}`}
      style={{ width: displayWidth, height: displayHeight }}
      onPointerDown={tool === 'hand' && zoomed ? startPan : undefined}
      onPointerMove={tool === 'hand' && zoomed ? moveDraw : undefined}
      onPointerUp={tool === 'hand' && zoomed ? endDraw : undefined}
    >
      {zoomed ? (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-0 left-0"
            style={{
              width: innerW,
              height: innerH,
              transform: `translate(${writePan.x}px, ${writePan.y}px)`,
            }}
          >
            <div className="relative" style={{ width: innerW, height: innerH }}>
              {pageContent}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">{pageContent}</div>
      )}
      {zoomed && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium z-30 pointer-events-none">
          {Math.round(writeZoom * 100)}%
        </div>
      )}
    </div>
  );
};

export default PageSheet;
