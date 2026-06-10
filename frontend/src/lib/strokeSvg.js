/** Conversion traits → chemins SVG (vectoriel, net à tout zoom). */

export const pointsToSvgPath = (points) => {
  if (!points?.length) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.5} ${p.y + 0.5}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
};

export const shapeToSvgPath = (sh) => {
  if (!sh) return '';
  switch (sh.type) {
    case 'line':
      return `M ${sh.x1} ${sh.y1} L ${sh.x2} ${sh.y2}`;
    case 'circle': {
      const rx = sh.rx ?? sh.r;
      const ry = sh.ry ?? sh.r;
      return `M ${sh.cx - rx} ${sh.cy} A ${rx} ${ry} 0 1 0 ${sh.cx + rx} ${sh.cy} A ${rx} ${ry} 0 1 0 ${sh.cx - rx} ${sh.cy}`;
    }
    case 'rect':
      return `M ${sh.x} ${sh.y} H ${sh.x + sh.w} V ${sh.y + sh.h} H ${sh.x} Z`;
    case 'triangle':
      return `M ${sh.x1} ${sh.y1} L ${sh.x2} ${sh.y2} L ${sh.x3} ${sh.y3} Z`;
    case 'arrow':
      return `M ${sh.x1} ${sh.y1} L ${sh.x2} ${sh.y2} M ${sh.headLeft.x} ${sh.headLeft.y} L ${sh.x2} ${sh.y2} L ${sh.headRight.x} ${sh.headRight.y}`;
    default:
      return '';
  }
};

export const strokeToSvgPath = (stroke) => {
  if (stroke?.shape) return shapeToSvgPath(stroke.shape);
  return pointsToSvgPath(stroke?.points);
};
