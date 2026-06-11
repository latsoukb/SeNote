import React, { useRef } from 'react';
import { PAGE_W } from '../lib/pageDimensions';
import { TEXT_FONTS } from './TextBoxToolbar';

const TextBox = ({
  box,
  tool,
  editing,
  selected,
  onEdit,
  onBlur,
  onChange,
  onSelect,
  onDragStart,
}) => {
  const dragRef = useRef(null);
  const interactionScale = (box.scale || 1) * (box.zoom || 1);
  const canEdit = tool === 'text';
  const showChrome = editing || (canEdit && selected);
  const font = TEXT_FONTS.find((f) => f.id === box.fontFamily) || TEXT_FONTS[0];

  const startDrag = (e) => {
    if (!showChrome) return;
    e.preventDefault();
    e.stopPropagation();
    onDragStart?.();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: box.x, origY: box.y };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX) / interactionScale;
      const dy = (ev.clientY - dragRef.current.startY) / interactionScale;
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
    onDragStart?.();
    const startW = box.width || 200;
    const startSize = box.size || 16;
    const startX = e.clientX;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / interactionScale;
      onChange({
        width: Math.max(60, startW + dx),
        size: Math.max(8, Math.min(72, startSize + dx * 0.04)),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const width = box.width || Math.max(80, (box.text?.length || 0) * (box.size * 0.55) + 8);

  const lineH = (box.size || 16) * 1.4;
  const lines = Math.max(1, (box.text || '').split('\n').length);
  const minH = Math.max(lineH, lines * lineH);

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: box.x,
        top: box.y,
        width: Math.min(width, PAGE_W - box.x - 8),
        minHeight: minH,
      }}
      onPointerDown={(e) => {
        if (canEdit) {
          e.stopPropagation();
          e.preventDefault();
          onSelect?.();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {editing ? (
        <textarea
          autoFocus
          value={box.text}
          onChange={(e) => onChange({ text: e.target.value, width: Math.max(80, e.target.scrollWidth) })}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Escape' && onBlur()}
          className="bg-transparent outline-none resize-none w-full border-b border-brand-500/60"
          style={{
            color: box.color,
            fontSize: box.size,
            fontFamily: font.family,
            lineHeight: 1.35,
            minHeight: box.size * 1.4,
          }}
        />
      ) : (
        <div
          onDoubleClick={() => tool === 'text' && onEdit?.()}
          onPointerDown={startDrag}
          className={`whitespace-pre-wrap leading-snug relative ${
            showChrome ? 'outline outline-1 outline-brand-400/50 outline-offset-2' : ''
          }`}
          style={{
            color: box.color,
            fontSize: box.size,
            fontFamily: font.family,
            cursor: showChrome ? 'grab' : 'default',
            background: 'transparent',
          }}
        >
          {box.text}
          {showChrome && (
            <div
              onPointerDown={startResize}
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-brand-600 border border-white rounded-sm cursor-se-resize z-10"
              aria-label="Redimensionner"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TextBox;
