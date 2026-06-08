import React from 'react';

const LassoSelection = ({ bounds, scale }) => {
  if (!bounds) return null;
  return (
    <div
      className="absolute border-2 border-blue-500 border-dashed rounded-sm pointer-events-none z-20"
      style={{
        left: bounds.x * scale,
        top: bounds.y * scale,
        width: Math.max(bounds.w, 8) * scale,
        height: Math.max(bounds.h, 8) * scale,
        boxShadow: '0 0 0 1px rgba(59,130,246,0.15)',
      }}
    />
  );
};

export default LassoSelection;
