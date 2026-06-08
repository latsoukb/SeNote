import React, { useRef } from 'react';
import { X, RotateCw } from 'lucide-react';
import { getRulerSegment } from '../lib/instrumentSnap';

const GoodNotesRuler = ({ inst, scale, tool, onUpdate, onRemove }) => {
  const len = inst.length || 500;
  const half = len / 2;
  const canInteract = tool === 'hand' || tool === 'ruler';

  const startDrag = (e, mode) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { x: inst.x, y: inst.y, rotation: inst.rotation || 0 };

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (mode === 'move') {
        onUpdate({ x: orig.x + dx, y: orig.y + dy });
      } else {
        const angle =
          Math.atan2(ev.clientY - startY, ev.clientX - startX) * (180 / Math.PI);
        onUpdate({ rotation: orig.rotation + angle * 0.4 });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const marks = [];
  const unit = 40;
  for (let i = -Math.floor(half / unit); i <= Math.floor(half / unit); i++) {
    marks.push(i);
  }

  return (
    <div
      className={`absolute pointer-events-auto ${canInteract ? 'z-20' : 'z-10 pointer-events-none'}`}
      style={{
        left: inst.x * scale,
        top: inst.y * scale,
        transform: `translate(-50%, -50%) rotate(${inst.rotation || 0}deg)`,
      }}
    >
      <div
        onPointerDown={(e) => canInteract && startDrag(e, 'move')}
        className={`relative ${canInteract ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ width: len * scale, height: 36 * scale }}
      >
        <div
          className="absolute inset-0 rounded-sm shadow-lg border border-slate-400/60"
          style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(2px)' }}
        />
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-500/70"
          style={{ transform: 'translateX(-50%)' }}
        />
        {marks.map((i) => {
          const left = (half + i * unit) * scale;
          const isMajor = i % 5 === 0;
          const isZero = i === 0;
          return (
            <React.Fragment key={i}>
              <div
                className="absolute bottom-0 bg-slate-600"
                style={{
                  left,
                  width: 1,
                  height: (isMajor ? 14 : 8) * scale,
                }}
              />
              {isMajor && !isZero && (
                <span
                  className="absolute text-slate-600 font-medium select-none"
                  style={{
                    left,
                    bottom: 16 * scale,
                    transform: 'translateX(-50%)',
                    fontSize: 9 * scale,
                  }}
                >
                  {Math.abs(i / 5)}
                </span>
              )}
              {isZero && (
                <span
                  className="absolute text-slate-700 font-semibold select-none"
                  style={{
                    left,
                    bottom: 16 * scale,
                    transform: 'translateX(-50%)',
                    fontSize: 10 * scale,
                  }}
                >
                  0
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {canInteract && (
        <>
          <button
            onPointerDown={(e) => startDrag(e, 'rotate')}
            className="absolute -top-3 -right-3 p-1 bg-white rounded-full shadow border cursor-grab"
            aria-label="Pivoter la règle"
          >
            <RotateCw className="w-3 h-3 text-slate-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-3 -left-3 p-1 bg-red-500 text-white rounded-full shadow"
            aria-label="Retirer la règle"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};

const GeometryInstruments = ({ instruments = [], scale, tool, onChange }) => {
  const ruler = instruments.find((i) => i.type === 'ruler');
  if (!ruler) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 15 }}>
      <GoodNotesRuler
        inst={ruler}
        scale={scale}
        tool={tool}
        onUpdate={(patch) =>
          onChange(instruments.map((i) => (i.id === ruler.id ? { ...i, ...patch } : i)))
        }
        onRemove={() => onChange(instruments.filter((i) => i.id !== ruler.id))}
      />
    </div>
  );
};

export default GeometryInstruments;
