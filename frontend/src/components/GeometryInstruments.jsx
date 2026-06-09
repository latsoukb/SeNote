import React from 'react';
import { X, RotateCw } from 'lucide-react';

const snapRotation = (deg) => {
  const n = ((deg % 360) + 360) % 360;
  const snaps = [0, 90, 180, 270];
  for (const s of snaps) {
    const diff = Math.min(Math.abs(n - s), 360 - Math.abs(n - s));
    if (diff <= 5) return s;
  }
  return deg;
};

const GoodNotesRuler = ({ inst, scale, zoom = 1, tool, onUpdate, onRemove }) => {
  const interactionScale = scale * zoom;
  const len = inst.length || 500;
  const half = len / 2;
  const canInteract = tool === 'ruler' || tool === 'pen' || tool === 'highlighter' || tool === 'lasso';

  const startDrag = (e, mode) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { x: inst.x, y: inst.y, rotation: inst.rotation || 0 };
    const rulerEl = e.currentTarget.closest('[data-ruler]');
    const rect = rulerEl?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : startX;
    const cy = rect ? rect.top + rect.height / 2 : startY;

    let lastRotation = orig.rotation;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / interactionScale;
      const dy = (ev.clientY - startY) / interactionScale;
      if (mode === 'move') {
        onUpdate({ x: orig.x + dx, y: orig.y + dy });
      } else {
        const angle =
          Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
        lastRotation = snapRotation(angle);
        onUpdate({ rotation: lastRotation });
      }
    };
    const onUp = () => {
      if (mode === 'rotate') {
        onUpdate({ rotation: snapRotation(lastRotation) });
      }
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
      data-ruler
      className={`absolute ${canInteract ? 'pointer-events-none z-30' : 'pointer-events-none z-10'}`}
      style={{
        left: inst.x * scale,
        top: inst.y * scale,
        transform: `translate(-50%, -50%) rotate(${inst.rotation || 0}deg)`,
      }}
    >
      <div
        className="relative"
        style={{ width: len * scale, height: 36 * scale }}
      >
        {/* Bords fins — le stylo trace sur le canvas en dessous */}
        <div className="absolute inset-x-0 top-0 h-[14%] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[14%] pointer-events-none" />

        {/* Corps cliquable — déplacer / pivoter la règle au clic */}
        <div
          onPointerDown={(e) => {
            if (!canInteract) return;
            e.stopPropagation();
            e.preventDefault();
            startDrag(e, 'move');
          }}
          className={`absolute inset-x-0 top-[14%] h-[72%] ${
            canInteract ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <div
            className="absolute inset-0 rounded-sm shadow-lg border border-slate-400/60"
            style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(2px)' }}
          />
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-slate-600/80 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-600/80 pointer-events-none" />
        {marks.map((i) => {
          const left = (half + i * unit) * scale;
          const isMajor = i % 5 === 0;
          const isZero = i === 0;
          return (
            <React.Fragment key={i}>
              <div
                className="absolute bottom-0 bg-slate-600 pointer-events-none"
                style={{
                  left,
                  width: 1,
                  height: (isMajor ? 14 : 8) * scale,
                }}
              />
              {isMajor && !isZero && (
                <span
                  className="absolute text-slate-600 font-medium select-none pointer-events-none"
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
                  className="absolute text-slate-700 font-semibold select-none pointer-events-none"
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
            onPointerDown={(e) => {
              e.stopPropagation();
              startDrag(e, 'rotate');
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              const cur = inst.rotation || 0;
              const n = ((cur % 360) + 360) % 360;
              const order = [0, 90, 180, 270];
              const idx = order.findIndex((s) => Math.min(Math.abs(n - s), 360 - Math.abs(n - s)) <= 5);
              const next = order[(idx + 1) % order.length];
              onUpdate({ rotation: next });
            }}
            className="absolute -top-3 -right-3 p-1 bg-white rounded-full shadow border cursor-grab pointer-events-auto"
            aria-label="Pivoter la règle (double-clic : 0° → 90° → 180° → 270°)"
            title="Pivoter · double-clic pour 90°"
          >
            <RotateCw className="w-3 h-3 text-slate-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-3 -left-3 p-1 bg-red-500 text-white rounded-full shadow pointer-events-auto"
            aria-label="Retirer la règle"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};

const GeometryInstruments = ({ instruments = [], scale, zoom = 1, tool, onChange }) => {
  const ruler = instruments.find((i) => i.type === 'ruler');
  if (!ruler) return null;

  return (
    <div className="absolute inset-0 overflow-visible" style={{ zIndex: 25, pointerEvents: 'none' }}>
      <GoodNotesRuler
        inst={ruler}
        scale={scale}
        zoom={zoom}
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
