import React from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  Undo2,
  Redo2,
  Trash,
  Ruler,
  Download,
  Lasso,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PEN_COLORS, HIGHLIGHTER_COLORS } from '../mock/mock';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const ToolButton = ({ active, onClick, label, children }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`p-2 rounded-lg transition-colors shrink-0 ${
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
  writeZoom = 1,
  onWriteZoomIn,
  onWriteZoomOut,
  onWriteZoomReset,
  onAddInstrument,
  instrumentsActive,
  onExport,
}) => {
  const colors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;
  const drawTools = ['pen', 'highlighter', 'eraser'];

  return (
    <div className="w-full shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-40">
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto thin-scroll">
        <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} label="Stylo">
          <Pen className="w-5 h-5" />
        </ToolButton>
        <ToolButton active={tool === 'highlighter'} onClick={() => setTool('highlighter')} label="Surligneur">
          <Highlighter className="w-5 h-5" />
        </ToolButton>
        <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} label="Gomme">
          <Eraser className="w-5 h-5" />
        </ToolButton>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`p-2 rounded-lg transition-colors shrink-0 ${
                instrumentsActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              aria-label="Instruments de géométrie"
            >
              <Ruler className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="start" avoidCollisions={false}>
            <p className="text-xs text-slate-500 px-2 pb-2">Dimensions réelles (A4)</p>
            <button
              onClick={() => onAddInstrument('ruler', 30)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Règle 30 cm
            </button>
            <button
              onClick={() => onAddInstrument('ruler', 10)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Règle 10 cm
            </button>
            <button
              onClick={() => onAddInstrument('setSquare', 10)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Équerre 10 cm
            </button>
          </PopoverContent>
        </Popover>
        <ToolButton active={tool === 'text'} onClick={() => setTool('text')} label="Texte">
          <Type className="w-5 h-5" />
        </ToolButton>
        <ToolButton active={tool === 'lasso'} onClick={() => setTool('lasso')} label="Lasso — sélectionner traits, formes et texte">
          <Lasso className="w-5 h-5" />
        </ToolButton>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

        {(drawTools.includes(tool) || tool === 'text') && (
          <div className="flex items-center gap-1 shrink-0">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 shrink-0 ${
                  color === c ? 'border-blue-600 ring-2 ring-blue-300' : 'border-white dark:border-slate-700'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        )}

        {drawTools.includes(tool) && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <div
                    className="rounded-full bg-slate-800 dark:bg-slate-200"
                    style={{
                      width: Math.min(22, Math.max(4, thickness * 1.5)),
                      height: Math.min(22, Math.max(4, thickness * 1.5)),
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums w-7">{thickness.toFixed(1)}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52" avoidCollisions={false}>
              <Slider
                value={[thickness]}
                onValueChange={(v) => setThickness(v[0])}
                min={1}
                max={tool === 'highlighter' ? 30 : tool === 'eraser' ? 40 : 12}
                step={0.5}
              />
            </PopoverContent>
          </Popover>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

        <ToolButton onClick={onUndo} label="Annuler">
          <Undo2 className="w-5 h-5" />
        </ToolButton>
        <ToolButton onClick={onRedo} label="Rétablir">
          <Redo2 className="w-5 h-5" />
        </ToolButton>
        <ToolButton onClick={onClear} label="Effacer la page">
          <Trash className="w-5 h-5" />
        </ToolButton>

        <div className="flex-1 min-w-2" />

        <ToolButton onClick={onWriteZoomOut} label="Zoom arrière (Ctrl + molette)">
          <ZoomOut className="w-5 h-5" />
        </ToolButton>
        <button
          onClick={writeZoom !== 1 ? onWriteZoomReset : onWriteZoomIn}
          className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 tabular-nums ${
            writeZoom !== 1
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={
            writeZoom !== 1
              ? 'Réinitialiser le zoom · Tactile : pincez pour zoomer, 1 doigt pour déplacer'
              : 'Zoom avant · Ordinateur : Ctrl + molette ou pincement trackpad'
          }
        >
          {Math.round(writeZoom * 100)}%
        </button>
        <ToolButton onClick={onWriteZoomIn} label="Zoom avant (Ctrl + molette)">
          <ZoomIn className="w-5 h-5" />
        </ToolButton>

        <ToolButton onClick={onExport} label="Exporter PDF">
          <Download className="w-5 h-5" />
        </ToolButton>
      </div>
    </div>
  );
};

export default Toolbar;
