import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { makeId } from '../lib/id';

// Page dimensions (3:4 portrait) - virtual coordinate system
const PAGE_W = 900;
const PAGE_H = 1200;

const NoteCanvas = ({ page, tool, color, thickness, onChange, pushUndo }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [scale, setScale] = useState(1);

  // Compute and update scale based on container size
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxW = el.parentElement.clientWidth - 80;
      const maxH = el.parentElement.clientHeight - 40;
      const sW = maxW / PAGE_W;
      const sH = maxH / PAGE_H;
      setScale(Math.min(sW, sH, 1));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Render strokes
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const drawStroke = (s) => {
      if (!s.points || s.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (s.type === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineCap = 'butt';
      }
      ctx.beginPath();
      const pts = s.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length < 3) {
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }
      ctx.stroke();
      ctx.restore();
    };

    (page.strokes || []).forEach(drawStroke);
    if (currentStrokeRef.current) drawStroke(currentStrokeRef.current);
  }, [page.strokes]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, page]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * PAGE_W,
      y: ((clientY - rect.top) / rect.height) * PAGE_H,
    };
  };

  const startDraw = (e) => {
    if (tool === 'hand') return;
    if (tool === 'text') return;
    e.preventDefault();
    const pos = getPos(e);
    pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes });

    if (tool === 'eraser') {
      // Erase strokes whose points are near pointer
      eraseAt(pos);
      setIsDrawing(true);
      return;
    }
    const strokeThickness =
      tool === 'highlighter' && thickness < 14 ? 14 : thickness;
    currentStrokeRef.current = {
      id: makeId('s'),
      type: tool, // pen | highlighter
      color,
      thickness: strokeThickness,
      points: [pos],
    };
    setIsDrawing(true);
    renderCanvas();
  };

  const moveDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    if (tool === 'eraser') {
      eraseAt(pos);
      return;
    }
    if (currentStrokeRef.current) {
      const last = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
      const dx = pos.x - last.x;
      const dy = pos.y - last.y;
      if (dx * dx + dy * dy > 2) {
        currentStrokeRef.current.points.push(pos);
        renderCanvas();
      }
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      const newStrokes = [...(page.strokes || []), currentStrokeRef.current];
      currentStrokeRef.current = null;
      onChange({ strokes: newStrokes });
    } else {
      currentStrokeRef.current = null;
      renderCanvas();
    }
  };

  const eraseAt = (pos) => {
    const radius = Math.max(15, thickness * 3);
    const r2 = radius * radius;
    const remaining = (page.strokes || []).filter((s) => {
      return !s.points.some((p) => {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        return dx * dx + dy * dy < r2;
      });
    });
    if (remaining.length !== (page.strokes || []).length) {
      onChange({ strokes: remaining });
    }
  };

  const handleCanvasClickForText = (e) => {
    if (tool !== 'text' || isDrawing) return;
    const pos = getPos(e);
    const newBox = {
      id: makeId('t'),
      x: pos.x,
      y: pos.y,
      text: '',
      color,
      size: Math.max(16, thickness * 6),
    };
    pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes });
    onChange({ textBoxes: [...(page.textBoxes || []), newBox] });
    setEditingTextId(newBox.id);
    setDraftText('');
  };

  const updateTextBox = (id, patch) => {
    onChange({
      textBoxes: (page.textBoxes || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  const deleteTextBox = (id) => {
    pushUndo({ strokes: page.strokes, textBoxes: page.textBoxes });
    onChange({ textBoxes: (page.textBoxes || []).filter((t) => t.id !== id) });
  };

  const templateClass =
    page.template === 'lined'
      ? 'paper-lined'
      : page.template === 'grid'
      ? 'paper-grid'
      : page.template === 'dotted'
      ? 'paper-dotted'
      : '';

  const cursorClass =
    tool === 'eraser'
      ? 'canvas-eraser'
      : tool === 'text'
      ? 'canvas-text'
      : tool === 'hand'
      ? 'canvas-hand'
      : 'canvas-pen';

  return (
    <div
      ref={containerRef}
      className="relative bg-white dark:bg-slate-100 shadow-2xl rounded-md overflow-hidden"
      style={{
        width: PAGE_W * scale,
        height: PAGE_H * scale,
      }}
    >
      <div
        className={`absolute inset-0 ${templateClass}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: PAGE_W,
          height: PAGE_H,
        }}
      />
      <canvas
        ref={canvasRef}
        width={PAGE_W}
        height={PAGE_H}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
        onClick={handleCanvasClickForText}
        className={`absolute inset-0 w-full h-full ${cursorClass}`}
        style={{ touchAction: 'none' }}
      />

      {/* Text boxes layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: PAGE_W,
          height: PAGE_H,
        }}
      >
        {(page.textBoxes || []).map((t) => (
          <div
            key={t.id}
            className="absolute group pointer-events-auto"
            style={{ left: t.x, top: t.y, maxWidth: PAGE_W - t.x - 20 }}
          >
            {editingTextId === t.id ? (
              <textarea
                autoFocus
                value={t.text}
                onChange={(e) => updateTextBox(t.id, { text: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingTextId(null);
                }}
                className="bg-transparent outline outline-2 outline-blue-500 rounded px-1 resize-none min-w-[120px]"
                style={{
                  color: t.color,
                  fontSize: t.size,
                  fontFamily: 'inherit',
                  lineHeight: 1.3,
                  width: Math.max(200, t.text.length * (t.size * 0.55)),
                  height: Math.max(t.size * 1.5, (t.text.split('\n').length) * t.size * 1.4),
                }}
              />
            ) : (
              <div
                onDoubleClick={() => {
                  setEditingTextId(t.id);
                  setDraftText(t.text);
                }}
                onClick={() => {
                  if (tool === 'text') {
                    setEditingTextId(t.id);
                  }
                }}
                className="cursor-text whitespace-pre-wrap leading-tight px-1 hover:outline hover:outline-1 hover:outline-blue-300 rounded"
                style={{ color: t.color, fontSize: t.size }}
              >
                {t.text || (
                  <span className="text-slate-400 italic">Tapez votre texte...</span>
                )}
              </div>
            )}
            {tool === 'text' && (
              <button
                onClick={() => deleteTextBox(t.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer le texte"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteCanvas;
