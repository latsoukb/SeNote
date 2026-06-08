import React, { useRef, useState } from 'react';
import { X, GripVertical } from 'lucide-react';
import { PAGE_W } from '../lib/pageDimensions';

const TextBox = ({
  box,
  tool,
  editing,
  onEdit,
  onBlur,
  onChange,
  onDelete,
}) => {
  const dragRef = useRef(null);
  const [resizing, setResizing] = useState(false);

  const startDrag = (e) => {
    if (tool !== 'text' && !editing) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: box.x,
      origY: box.y,
    };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const scale = box.scale || 1;
      const dx = (ev.clientX - dragRef.current.startX) / scale;
      const dy = (ev.clientY - dragRef.current.startY) / scale;
      onChange({
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    const startY = e.clientY;
    const startSize = box.size || 16;
    const scale = box.scale || 1;
    const onMove = (ev) => {
      const dy = (ev.clientY - startY) / scale;
      onChange({ size: Math.max(10, Math.min(120, startSize + dy * 0.5)) });
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const width = box.width || Math.max(160, (box.text?.length || 0) * (box.size * 0.5) + 40);

  return (
    <div
      className="absolute group pointer-events-auto"
      style={{
        left: box.x,
        top: box.y,
        width: Math.min(width, PAGE_W - box.x - 10),
      }}
    >
      {(tool === 'text' || editing) && (
        <div
          onPointerDown={startDrag}
          className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-500/90 text-white rounded-t cursor-grab active:cursor-grabbing text-[10px]"
        >
          <GripVertical className="w-3 h-3" />
          <span>Déplacer</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-auto p-0.5 hover:bg-red-500 rounded"
            aria-label="Supprimer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {editing ? (
        <textarea
          autoFocus
          value={box.text}
          onChange={(e) => onChange({ text: e.target.value })}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onBlur();
          }}
          className="bg-white/95 dark:bg-slate-100 outline outline-2 outline-blue-500 rounded-b px-2 py-1 resize-none w-full"
          style={{
            color: box.color,
            fontSize: box.size,
            fontFamily: 'inherit',
            lineHeight: 1.3,
            minHeight: box.size * 1.8,
          }}
        />
      ) : (
        <div
          onDoubleClick={onEdit}
          onClick={() => tool === 'text' && onEdit()}
          className={`whitespace-pre-wrap leading-tight px-2 py-1 rounded-b ${
            tool === 'text' ? 'hover:outline hover:outline-2 hover:outline-blue-400 bg-white/80' : ''
          } ${resizing ? 'outline outline-2 outline-blue-500' : ''}`}
          style={{ color: box.color, fontSize: box.size, cursor: tool === 'text' ? 'text' : 'default' }}
        >
          {box.text || <span className="text-slate-400 italic">Tapez votre texte…</span>}
        </div>
      )}
      {(tool === 'text' || editing) && (
        <div
          onPointerDown={startResize}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow"
          aria-label="Redimensionner"
        />
      )}
    </div>
  );
};

export default TextBox;
