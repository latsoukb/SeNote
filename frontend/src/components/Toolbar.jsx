import React from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  Hand,
  Undo2,
  Redo2,
  Trash,
} from 'lucide-react';
import { PEN_COLORS, HIGHLIGHTER_COLORS } from '../mock/mock';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Slider } from './ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const ToolButton = ({ active, onClick, label, children }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`p-2.5 rounded-lg transition-colors ${
            active
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  thickness,
  setThickness,
  onUndo,
  onRedo,
  onClear,
}) => {
  const colors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
      <div className="flex items-center gap-1 px-2">
        <ToolButton
          active={tool === 'hand'}
          onClick={() => setTool('hand')}
          label="Déplacer"
        >
          <Hand className="w-5 h-5" />
        </ToolButton>
        <ToolButton
          active={tool === 'pen'}
          onClick={() => setTool('pen')}
          label="Stylo"
        >
          <Pen className="w-5 h-5" />
        </ToolButton>
        <ToolButton
          active={tool === 'highlighter'}
          onClick={() => setTool('highlighter')}
          label="Surligneur"
        >
          <Highlighter className="w-5 h-5" />
        </ToolButton>
        <ToolButton
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          label="Gomme"
        >
          <Eraser className="w-5 h-5" />
        </ToolButton>
        <ToolButton
          active={tool === 'text'}
          onClick={() => setTool('text')}
          label="Texte"
        >
          <Type className="w-5 h-5" />
        </ToolButton>
      </div>

      <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* Color picker - only for pen and highlighter */}
      {(tool === 'pen' || tool === 'highlighter' || tool === 'text') && (
        <>
          <div className="flex items-center gap-1.5 px-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  color === c
                    ? 'border-blue-600 scale-110 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'border-white dark:border-slate-700 hover:scale-110'
                }`}
                style={{ background: c }}
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
        </>
      )}

      {/* Thickness */}
      {(tool === 'pen' || tool === 'highlighter' || tool === 'eraser') && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Épaisseur"
            >
              <div
                className="rounded-full bg-current"
                style={{
                  width: `${Math.max(4, thickness * 1.5)}px`,
                  height: `${Math.max(4, thickness * 1.5)}px`,
                }}
              />
              <span className="text-xs font-medium">{thickness.toFixed(1)}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500">Épaisseur</p>
              <Slider
                value={[thickness]}
                onValueChange={(v) => setThickness(v[0])}
                min={1}
                max={tool === 'highlighter' ? 30 : tool === 'eraser' ? 40 : 12}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Fin</span>
                <span>Épais</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

      <ToolButton onClick={onUndo} label="Annuler">
        <Undo2 className="w-5 h-5" />
      </ToolButton>
      <ToolButton onClick={onRedo} label="Rétablir">
        <Redo2 className="w-5 h-5" />
      </ToolButton>
      <ToolButton onClick={onClear} label="Effacer la page">
        <Trash className="w-5 h-5" />
      </ToolButton>
    </div>
  );
};

export default Toolbar;
