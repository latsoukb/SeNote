import React from 'react';
import { getShapeHandles } from '../lib/shapeGeometry';

const Handle = ({ h, scale, onDragStart }) => (
  <div
    onPointerDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
      onDragStart(h.id, e);
    }}
    className="absolute rounded-full bg-brand-600 border-2 border-white shadow-md cursor-grab active:cursor-grabbing z-30 pointer-events-auto"
    style={{
      left: h.x * scale,
      top: h.y * scale,
      width: 10,
      height: 10,
      transform: 'translate(-50%, -50%)',
      touchAction: 'none',
    }}
  />
);

const ShapeEditor = ({ shape, scale, onHandleDrag }) => {
  if (!shape) return null;
  const handles = getShapeHandles(shape);

  const startDrag = (handleId, e) => {
    onHandleDrag(handleId, e);
    const onMove = (ev) => onHandleDrag(handleId, ev);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 25 }}>
      {handles.map((h) => (
        <Handle key={h.id} h={h} scale={scale} onDragStart={startDrag} />
      ))}
    </div>
  );
};

export default ShapeEditor;
