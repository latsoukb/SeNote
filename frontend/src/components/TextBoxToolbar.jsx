import React from 'react';
import { PEN_COLORS } from '../mock/mock';

export const TEXT_FONTS = [
  { id: 'sans', label: 'Sans', family: 'system-ui, -apple-system, sans-serif' },
  { id: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: 'Mono', family: 'ui-monospace, "SF Mono", monospace' },
  { id: 'hand', label: 'Écriture', family: '"Segoe Print", "Comic Sans MS", cursive' },
];

const TextBoxToolbar = ({ box, onChange, scale = 1 }) => {
  const font = TEXT_FONTS.find((f) => f.id === box.fontFamily) || TEXT_FONTS[0];

  return (
    <div
      className="absolute z-40 flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700 pointer-events-auto"
      style={{
        left: box.x * scale,
        top: Math.max(0, box.y * scale - 36),
        transform: 'translateX(-4px)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <select
        value={box.fontFamily || 'sans'}
        onChange={(e) => onChange({ fontFamily: e.target.value })}
        className="text-[10px] h-6 rounded border border-slate-200 dark:border-slate-700 bg-transparent px-1 max-w-[72px]"
        aria-label="Police"
      >
        {TEXT_FONTS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={8}
        max={72}
        value={Math.round(box.size || 16)}
        onChange={(e) => onChange({ size: Math.max(8, Math.min(72, Number(e.target.value) || 16)) })}
        className="w-10 h-6 text-[10px] text-center rounded border border-slate-200 dark:border-slate-700 bg-transparent"
        aria-label="Taille"
      />
      <div className="flex gap-0.5">
        {PEN_COLORS.slice(0, 6).map((c) => (
          <button
            key={c}
            onClick={() => onChange({ color: c })}
            className={`w-4 h-4 rounded-full border shrink-0 ${
              box.color === c ? 'border-brand-600 ring-1 ring-brand-400' : 'border-slate-300'
            }`}
            style={{ background: c }}
            aria-label={`Couleur ${c}`}
          />
        ))}
      </div>
      <span className="text-[9px] text-slate-400 hidden sm:inline" style={{ fontFamily: font.family }}>
        Aa
      </span>
    </div>
  );
};

export default TextBoxToolbar;
