import React from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  Undo2,
  Redo2,
  Ruler,
  Download,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PEN_COLORS, HIGHLIGHTER_COLORS } from '../mock/mock';
import { DEFAULT_WRITE_ZOOM } from './NoteCanvas';
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
              ? 'bg-brand-600 text-white'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-chrome-700'
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
  toolColors,
  setColorForActiveTool,
  toolThickness,
  setThicknessForActiveTool,
  onUndo,
  onRedo,
  writeZoom = 1,
  onWriteZoomIn,
  onWriteZoomOut,
  onWriteZoomReset,
  onAddInstrument,
  instrumentsActive,
  onExport,
}) => {
  const colors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;
  const colorKey = tool === 'highlighter' ? 'highlighter' : tool === 'text' ? 'text' : 'pen';
  const color = toolColors[colorKey] ?? colors[0];
  const zoomCustom = Math.abs(writeZoom - DEFAULT_WRITE_ZOOM) > 0.08;

  const thickness = toolThickness[tool] ?? toolThickness.pen ?? 2.5;

  return (
    <div className="w-full shrink-0 border-b border-slate-200 dark:border-chrome-800 bg-white dark:bg-chrome-950 z-40">
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
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-chrome-700'
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
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-chrome-800"
            >
              Règle 30 cm
            </button>
            <button
              onClick={() => onAddInstrument('ruler', 10)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-chrome-800"
            >
              Règle 10 cm
            </button>
            <button
              onClick={() => onAddInstrument('setSquare', 10)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-chrome-800"
            >
              Équerre 10 cm
            </button>
          </PopoverContent>
        </Popover>
        <ToolButton active={tool === 'text'} onClick={() => setTool('text')} label="Texte">
          <Type className="w-5 h-5" />
        </ToolButton>

        <div className="h-6 w-px bg-slate-200 dark:bg-chrome-800 mx-0.5 shrink-0" />

        {tool === 'eraser' && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 shrink-0"
                aria-label="Taille de la gomme"
              >
                <Eraser className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="text-xs font-medium text-rose-800 dark:text-rose-300 hidden sm:inline">
                  Taille
                </span>
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <div
                    className="rounded-full bg-rose-200/90 dark:bg-rose-300/80 border border-rose-300/60"
                    style={{
                      width: Math.min(24, Math.max(6, thickness * 1.2)),
                      height: Math.min(24, Math.max(6, thickness * 1.2)),
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums font-medium text-rose-900 dark:text-rose-200 w-8">
                  {thickness.toFixed(1)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56" avoidCollisions={false}>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">
                Taille de la gomme
              </p>
              <Slider
                value={[thickness]}
                onValueChange={(v) => setThicknessForActiveTool(v[0])}
                min={4}
                max={40}
                step={1}
              />
              <p className="text-[10px] text-slate-400 mt-2">Glissez pour agrandir la zone d&apos;effacement</p>
            </PopoverContent>
          </Popover>
        )}

        {(tool === 'pen' || tool === 'highlighter') && (
          <>
            <div className="flex items-center gap-1 shrink-0">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColorForActiveTool(c)}
                  className={`w-6 h-6 rounded-full border-2 shrink-0 ${
                    color === c ? 'border-brand-600 ring-2 ring-brand-300' : 'border-white dark:border-chrome-700'
                  }`}
                  style={{ background: c }}
                  aria-label={`Couleur ${c}`}
                />
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-chrome-800 shrink-0"
                  aria-label={tool === 'highlighter' ? 'Épaisseur du surligneur' : 'Épaisseur du stylo'}
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <div
                      className="rounded-full"
                      style={{
                        background: color,
                        width: Math.min(22, Math.max(4, thickness * 1.5)),
                        height: Math.min(22, Math.max(4, thickness * 1.5)),
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-7">{thickness.toFixed(1)}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52" avoidCollisions={false}>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">
                  {tool === 'highlighter' ? 'Épaisseur du surligneur' : 'Épaisseur du stylo'}
                </p>
                <Slider
                  value={[thickness]}
                  onValueChange={(v) => setThicknessForActiveTool(v[0])}
                  min={1}
                  max={tool === 'highlighter' ? 30 : 12}
                  step={0.5}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {tool === 'text' && (
          <div className="flex items-center gap-1 shrink-0">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColorForActiveTool(c)}
                className={`w-6 h-6 rounded-full border-2 shrink-0 ${
                  color === c ? 'border-brand-600 ring-2 ring-brand-300' : 'border-white dark:border-chrome-700'
                }`}
                style={{ background: c }}
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-chrome-800 mx-0.5 shrink-0" />

        <ToolButton onClick={onUndo} label="Annuler">
          <Undo2 className="w-5 h-5" />
        </ToolButton>
        <ToolButton onClick={onRedo} label="Rétablir">
          <Redo2 className="w-5 h-5" />
        </ToolButton>

        <div className="flex-1 min-w-2" />

        <ToolButton onClick={onWriteZoomOut} label="Zoom arrière (Ctrl + molette)">
          <ZoomOut className="w-5 h-5" />
        </ToolButton>
        <button
          onClick={zoomCustom ? onWriteZoomReset : onWriteZoomIn}
          className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 tabular-nums ${
            zoomCustom
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-chrome-800'
          }`}
          title={
            zoomCustom
              ? 'Réinitialiser le zoom (150 %) · Tactile : pincez pour zoomer, 1 doigt pour déplacer'
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
