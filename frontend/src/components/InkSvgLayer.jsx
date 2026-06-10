import React from 'react';
import { PAGE_W, PAGE_H } from '../lib/pageDimensions';
import { strokeToSvgPath } from '../lib/strokeSvg';

const StrokePath = ({ stroke }) => {
  const d = strokeToSvgPath(stroke);
  if (!d) return null;
  const isHi = stroke.type === 'highlighter';
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.thickness}
      strokeLinecap={isHi ? 'butt' : 'round'}
      strokeLinejoin="round"
      opacity={isHi ? 0.5 : 1}
      style={isHi ? { mixBlendMode: 'multiply' } : undefined}
    />
  );
};

const InkSvgLayer = React.forwardRef(function InkSvgLayer(
  { strokes = [], livePathRef, eraserPreview },
  ref
) {
  const hi = strokes.filter((s) => s.type === 'highlighter');
  const ink = strokes.filter((s) => s.type !== 'highlighter');

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: 5 }}
      aria-hidden
    >
      <g className="ink-highlighter">
        {hi.map((s) => (
          <StrokePath key={s.id} stroke={s} />
        ))}
      </g>
      <g className="ink-pen">
        {ink.map((s) => (
          <StrokePath key={s.id} stroke={s} />
        ))}
      </g>
      <path
        ref={livePathRef}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {eraserPreview && (
        <circle
          cx={eraserPreview.x}
          cy={eraserPreview.y}
          r={eraserPreview.r}
          fill="none"
          stroke="rgba(100,116,139,0.45)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
});

export default InkSvgLayer;
