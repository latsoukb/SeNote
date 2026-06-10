import React from 'react';
import { X, RotateCw } from 'lucide-react';
import { cmToPx } from '../lib/pageDimensions';
import {
  RULER_THICKNESS,
  getRulerLengthPx,
  getSetSquareLegPx,
  getProtractorRadiusPx,
} from '../lib/instrumentSnap';

const PROTRACTOR_IMG = `${process.env.PUBLIC_URL || ''}/instruments/protractor.png`;

const snapRotation = (deg) => {
  const n = ((deg % 360) + 360) % 360;
  const snaps = [0, 90, 180, 270];
  for (const s of snaps) {
    const diff = Math.min(Math.abs(n - s), 360 - Math.abs(n - s));
    if (diff <= 5) return s;
  }
  return deg;
};

/** Graduations symétriques : 0 au centre, ticks vers les 2 bords (haut + bas) */
const BilateralRulerScale = ({ lengthCm, scale }) => {
  const halfMm = Math.round((lengthCm / 2) * 10);
  const mmPx = cmToPx(0.1) * scale;
  const centerPx = cmToPx(lengthCm / 2) * scale;

  return (
    <>
      {Array.from({ length: halfMm * 2 + 1 }, (_, i) => {
        const mm = i - halfMm;
        const isCm = mm !== 0 && mm % 10 === 0;
        const isHalf = mm !== 0 && mm % 5 === 0;
        const tickLen = (mm === 0 ? 18 : isCm ? 16 : isHalf ? 11 : 6) * scale;
        const pos = centerPx + mm * mmPx;
        const label = mm === 0 ? '0' : isCm ? `${Math.abs(mm / 10)}` : null;

        return (
          <React.Fragment key={mm}>
            <div
              className="absolute bg-slate-600 pointer-events-none"
              style={{ left: pos, top: 0, width: 1, height: tickLen, transform: 'translateX(-50%)' }}
            />
            <div
              className="absolute bg-slate-600 pointer-events-none"
              style={{
                left: pos,
                bottom: 0,
                width: 1,
                height: tickLen,
                transform: 'translateX(-50%)',
              }}
            />
            {label !== null && (
              <>
                <span
                  className="absolute text-slate-600 font-medium select-none pointer-events-none"
                  style={{
                    left: pos,
                    top: tickLen + 2 * scale,
                    transform: 'translateX(-50%)',
                    fontSize: 8 * scale,
                  }}
                >
                  {label}
                </span>
                <span
                  className="absolute text-slate-600 font-medium select-none pointer-events-none"
                  style={{
                    left: pos,
                    bottom: tickLen + 2 * scale,
                    transform: 'translateX(-50%)',
                    fontSize: 8 * scale,
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** Graduations le long d'un bord, de l'origine vers l'extrémité */
const EdgeScale = ({ lengthCm, scale, edge }) => {
  const totalMm = Math.round(lengthCm * 10);
  const mmPx = cmToPx(0.1) * scale;
  const totalPx = cmToPx(lengthCm) * scale;

  const tickStyle = (mm, tickLen) => {
    const pos = mm * mmPx;
    const isCm = mm % 10 === 0;
    const label = isCm ? `${mm / 10}` : null;

    if (edge === 'top') {
      return {
        tick: {
          left: pos,
          bottom: 0,
          width: 1,
          height: tickLen,
          transform: 'translateX(-50%)',
        },
        label: label
          ? {
              left: pos,
              bottom: tickLen + 2 * scale,
              transform: 'translateX(-50%)',
              fontSize: 8 * scale,
            }
          : null,
      };
    }
    if (edge === 'left') {
      return {
        tick: {
          top: pos,
          right: 0,
          width: tickLen,
          height: 1,
          transform: 'translateY(-50%)',
        },
        label: label
          ? {
              top: pos,
              right: tickLen + 2 * scale,
              transform: 'translateY(-50%)',
              fontSize: 8 * scale,
            }
          : null,
      };
    }
    if (edge === 'hypotenuse') {
      return {
        tick: {
          left: pos,
          top: 0,
          width: 1,
          height: tickLen,
          transform: 'translateX(-50%)',
        },
        label: label
          ? {
              left: pos,
              top: tickLen + 2 * scale,
              transform: 'translateX(-50%)',
              fontSize: 7 * scale,
            }
          : null,
      };
    }
    return { tick: {}, label: null };
  };

  return (
    <>
      {Array.from({ length: totalMm + 1 }, (_, mm) => {
        const isCm = mm % 10 === 0;
        const isHalf = mm % 5 === 0;
        const tickLen = (isCm ? 16 : isHalf ? 11 : 6) * scale;
        const { tick, label } = tickStyle(mm, tickLen);

        return (
          <React.Fragment key={mm}>
            <div className="absolute bg-slate-600 pointer-events-none" style={tick} />
            {label && (
              <span
                className="absolute text-slate-600 font-medium select-none pointer-events-none"
                style={label}
              >
                {label}
              </span>
            )}
          </React.Fragment>
        );
      })}
      {edge === 'top' && (
        <span
          className="absolute text-slate-500 select-none pointer-events-none"
          style={{ left: 4 * scale, bottom: 4 * scale, fontSize: 7 * scale }}
        >
          cm
        </span>
      )}
      {edge === 'left' && (
        <span
          className="absolute text-slate-500 select-none pointer-events-none"
          style={{ top: 4 * scale, right: 4 * scale, fontSize: 7 * scale }}
        >
          cm
        </span>
      )}
      {edge === 'hypotenuse' && (
        <span
          className="absolute text-slate-500 select-none pointer-events-none"
          style={{ left: totalPx - 18 * scale, top: 4 * scale, fontSize: 7 * scale }}
        >
          cm
        </span>
      )}
    </>
  );
};

const useInstrumentDrag = (inst, scale, zoom, onUpdate, anchor = 'center') => {
  const interactionScale = scale * zoom;

  const startDrag = (e, mode) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { x: inst.x, y: inst.y, rotation: inst.rotation || 0 };
    const el = e.currentTarget.closest('[data-instrument]');
    const rect = el?.getBoundingClientRect();
    const pivotX =
      anchor === 'corner' ? (rect?.left ?? startX) : (rect?.left ?? 0) + (rect?.width ?? 0) / 2;
    const pivotY =
      anchor === 'corner' ? (rect?.top ?? startY) : (rect?.top ?? 0) + (rect?.height ?? 0) / 2;

    let lastRotation = orig.rotation;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / interactionScale;
      const dy = (ev.clientY - startY) / interactionScale;
      if (mode === 'move') {
        onUpdate({ x: orig.x + dx, y: orig.y + dy });
      } else {
        const angle = Math.atan2(ev.clientY - pivotY, ev.clientX - pivotX) * (180 / Math.PI);
        lastRotation = snapRotation(angle);
        onUpdate({ rotation: lastRotation });
      }
    };
    const onUp = () => {
      if (mode === 'rotate') onUpdate({ rotation: snapRotation(lastRotation) });
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return startDrag;
};

const InstrumentControls = ({ canInteract, startDrag, onRemove, rotateTitle }) => {
  if (!canInteract) return null;
  return (
    <>
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          startDrag(e, 'rotate');
        }}
        className="absolute -top-3 -right-3 p-1 bg-white rounded-full shadow border cursor-grab pointer-events-auto"
        aria-label={rotateTitle}
        title={rotateTitle}
      >
        <RotateCw className="w-3 h-3 text-slate-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-3 -left-3 p-1 bg-red-500 text-white rounded-full shadow pointer-events-auto"
        aria-label="Retirer"
      >
        <X className="w-3 h-3" />
      </button>
    </>
  );
};

const GoodNotesRuler = ({ inst, scale, zoom = 1, tool, onUpdate, onRemove }) => {
  const canInteract = tool === 'ruler' || tool === 'pen' || tool === 'highlighter' || tool === 'lasso';
  const len = getRulerLengthPx(inst);
  const lengthCm = inst.lengthCm ?? 30;
  const thick = RULER_THICKNESS;
  const startDrag = useInstrumentDrag(inst, scale, zoom, onUpdate, 'center');

  return (
    <div
      data-instrument
      className={`absolute ${canInteract ? 'pointer-events-none z-30' : 'pointer-events-none z-10'}`}
      style={{
        left: inst.x * scale,
        top: inst.y * scale,
        transform: `translate(-50%, -50%) rotate(${inst.rotation || 0}deg)`,
      }}
    >
      <div className="relative" style={{ width: len * scale, height: thick * scale }}>
        <div
          onPointerDown={(e) => {
            if (!canInteract) return;
            e.stopPropagation();
            e.preventDefault();
            startDrag(e, 'move');
          }}
          className={`absolute inset-x-0 top-[12%] h-[76%] ${
            canInteract ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <div
            className="absolute inset-0 rounded-sm shadow-lg border border-slate-400/60"
            style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(2px)' }}
          />
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-slate-600/80 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-600/80 pointer-events-none" />
        <BilateralRulerScale lengthCm={lengthCm} scale={scale} />
      </div>
      <InstrumentControls
        canInteract={canInteract}
        startDrag={startDrag}
        onRemove={onRemove}
        rotateTitle="Pivoter la règle"
      />
    </div>
  );
};

const GoodNotesSetSquare = ({ inst, scale, zoom = 1, tool, onUpdate, onRemove }) => {
  const canInteract = tool === 'ruler' || tool === 'pen' || tool === 'highlighter' || tool === 'lasso';
  const leg = getSetSquareLegPx(inst);
  const legCm = inst.legCm ?? 10;
  const hypoCm = legCm * Math.SQRT2;
  const hypo = leg * Math.SQRT2;
  const thick = RULER_THICKNESS;
  const startDrag = useInstrumentDrag(inst, scale, zoom, onUpdate, 'corner');

  return (
    <div
      data-instrument
      className={`absolute ${canInteract ? 'pointer-events-none z-30' : 'pointer-events-none z-10'}`}
      style={{
        left: inst.x * scale,
        top: inst.y * scale,
        transform: `rotate(${inst.rotation || 0}deg)`,
        transformOrigin: '0 0',
      }}
    >
      <div className="relative" style={{ width: leg * scale, height: leg * scale }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={leg * scale}
          height={leg * scale}
          viewBox={`0 0 ${leg} ${leg}`}
        >
          <polygon
            points={`0,0 ${leg},0 0,${leg}`}
            fill="rgba(255,255,255,0.78)"
            stroke="rgba(100,116,139,0.65)"
            strokeWidth="1.5"
          />
        </svg>

        <div
          onPointerDown={(e) => {
            if (!canInteract) return;
            e.stopPropagation();
            e.preventDefault();
            startDrag(e, 'move');
          }}
          className={`absolute inset-0 ${
            canInteract ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />

        {/* Côté court horizontal — graduations vers l'extrémité droite */}
        <div
          className="absolute left-0 overflow-visible pointer-events-none"
          style={{ top: -thick * scale, width: leg * scale, height: thick * scale }}
        >
          <EdgeScale lengthCm={legCm} scale={scale} edge="top" />
        </div>

        {/* Côté court vertical — graduations vers l'extrémité basse */}
        <div
          className="absolute top-0 overflow-visible pointer-events-none"
          style={{ left: -thick * scale, width: thick * scale, height: leg * scale }}
        >
          <EdgeScale lengthCm={legCm} scale={scale} edge="left" />
        </div>

        {/* Hypoténuse (côté long) — graduations le long de l'extrémité */}
        <div
          className="absolute overflow-visible pointer-events-none"
          style={{
            left: leg * scale,
            top: 0,
            width: hypo * scale,
            height: thick * scale,
            transformOrigin: '0 0',
            transform: 'rotate(135deg)',
          }}
        >
          <EdgeScale lengthCm={hypoCm} scale={scale} edge="hypotenuse" />
        </div>
      </div>
      <InstrumentControls
        canInteract={canInteract}
        startDrag={startDrag}
        onRemove={onRemove}
        rotateTitle="Pivoter l'équerre"
      />
    </div>
  );
};

const GoodNotesProtractor = ({ inst, scale, zoom = 1, tool, onUpdate, onRemove }) => {
  const canInteract = tool === 'ruler' || tool === 'pen' || tool === 'highlighter' || tool === 'lasso';
  const radius = getProtractorRadiusPx(inst);
  const diameter = radius * 2;
  const startDrag = useInstrumentDrag(inst, scale, zoom, onUpdate, 'center');

  return (
    <div
      data-instrument
      className={`absolute ${canInteract ? 'pointer-events-none z-30' : 'pointer-events-none z-10'}`}
      style={{
        left: inst.x * scale,
        top: inst.y * scale,
        transform: `translate(-50%, -50%) rotate(${inst.rotation || 0}deg)`,
      }}
    >
      <div
        className="relative"
        style={{ width: diameter * scale, height: radius * scale }}
      >
        <img
          src={PROTRACTOR_IMG}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ objectFit: 'contain', objectPosition: 'center' }}
        />
        <div
          onPointerDown={(e) => {
            if (!canInteract) return;
            e.stopPropagation();
            e.preventDefault();
            startDrag(e, 'move');
          }}
          className={`absolute inset-0 ${
            canInteract ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
          }`}
        />
      </div>
      <InstrumentControls
        canInteract={canInteract}
        startDrag={startDrag}
        onRemove={onRemove}
        rotateTitle="Pivoter le rapporteur"
      />
    </div>
  );
};

const GeometryInstruments = ({ instruments = [], scale, zoom = 1, tool, onChange }) => {
  if (!instruments.length) return null;

  return (
    <div className="absolute inset-0 overflow-visible" style={{ zIndex: 25, pointerEvents: 'none' }}>
      {instruments.map((inst) => {
        const update = (patch) =>
          onChange(instruments.map((i) => (i.id === inst.id ? { ...i, ...patch } : i)));
        const remove = () => onChange(instruments.filter((i) => i.id !== inst.id));

        if (inst.type === 'ruler') {
          return (
            <GoodNotesRuler
              key={inst.id}
              inst={inst}
              scale={scale}
              zoom={zoom}
              tool={tool}
              onUpdate={update}
              onRemove={remove}
            />
          );
        }
        if (inst.type === 'setSquare') {
          return (
            <GoodNotesSetSquare
              key={inst.id}
              inst={inst}
              scale={scale}
              zoom={zoom}
              tool={tool}
              onUpdate={update}
              onRemove={remove}
            />
          );
        }
        if (inst.type === 'protractor') {
          return (
            <GoodNotesProtractor
              key={inst.id}
              inst={inst}
              scale={scale}
              zoom={zoom}
              tool={tool}
              onUpdate={update}
              onRemove={remove}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default GeometryInstruments;
