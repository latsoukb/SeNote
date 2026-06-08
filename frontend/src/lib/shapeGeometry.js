/** Utilitaires de rendu et d'édition des formes reconnues */

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const drawShape = (ctx, sh) => {
  if (!sh) return;
  ctx.beginPath();
  if (sh.type === 'line') {
    ctx.moveTo(sh.x1, sh.y1);
    ctx.lineTo(sh.x2, sh.y2);
  } else if (sh.type === 'circle') {
    const rx = sh.rx ?? sh.r;
    const ry = sh.ry ?? sh.r;
    ctx.ellipse(sh.cx, sh.cy, rx, ry, 0, 0, Math.PI * 2);
  } else if (sh.type === 'rect') {
    ctx.rect(sh.x, sh.y, sh.w, sh.h);
  } else if (sh.type === 'triangle') {
    ctx.moveTo(sh.x1, sh.y1);
    ctx.lineTo(sh.x2, sh.y2);
    ctx.lineTo(sh.x3, sh.y3);
    ctx.closePath();
  } else if (sh.type === 'arrow') {
    ctx.moveTo(sh.x1, sh.y1);
    ctx.lineTo(sh.x2, sh.y2);
    ctx.moveTo(sh.headLeft.x, sh.headLeft.y);
    ctx.lineTo(sh.x2, sh.y2);
    ctx.lineTo(sh.headRight.x, sh.headRight.y);
  }
  ctx.stroke();
};

export const getShapeHandles = (sh) => {
  if (!sh) return [];
  if (sh.type === 'rect') {
    const { x, y, w, h } = sh;
    return [
      { id: 'tl', x, y, role: 'corner' },
      { id: 'tm', x: x + w / 2, y, role: 'edge-v' },
      { id: 'tr', x: x + w, y, role: 'corner' },
      { id: 'mr', x: x + w, y: y + h / 2, role: 'edge-h' },
      { id: 'br', x: x + w, y: y + h, role: 'corner' },
      { id: 'bm', x: x + w / 2, y: y + h, role: 'edge-v' },
      { id: 'bl', x, y: y + h, role: 'corner' },
      { id: 'ml', x, y: y + h / 2, role: 'edge-h' },
    ];
  }
  if (sh.type === 'circle') {
    const rx = sh.rx ?? sh.r;
    const ry = sh.ry ?? sh.r;
    return [
      { id: 't', x: sh.cx, y: sh.cy - ry, role: 'radius' },
      { id: 'r', x: sh.cx + rx, y: sh.cy, role: 'radius' },
      { id: 'b', x: sh.cx, y: sh.cy + ry, role: 'radius' },
      { id: 'l', x: sh.cx - rx, y: sh.cy, role: 'radius' },
    ];
  }
  if (sh.type === 'triangle') {
    return [
      { id: 'v1', x: sh.x1, y: sh.y1, role: 'vertex' },
      { id: 'v2', x: sh.x2, y: sh.y2, role: 'vertex' },
      { id: 'v3', x: sh.x3, y: sh.y3, role: 'vertex' },
    ];
  }
  if (sh.type === 'line') {
    return [
      { id: 'p1', x: sh.x1, y: sh.y1, role: 'endpoint' },
      { id: 'p2', x: sh.x2, y: sh.y2, role: 'endpoint' },
    ];
  }
  return [];
};

export const updateShapeFromHandle = (sh, handleId, pos) => {
  if (!sh) return sh;
  const s = { ...sh };

  if (s.type === 'rect') {
    let { x, y, w, h } = s;
    const r = x + w;
    const b = y + h;
    if (handleId === 'tl') return { ...s, x: pos.x, y: pos.y, w: r - pos.x, h: b - pos.y };
    if (handleId === 'tr') return { ...s, y: pos.y, w: pos.x - x, h: b - pos.y };
    if (handleId === 'br') return { ...s, w: pos.x - x, h: pos.y - y };
    if (handleId === 'bl') return { ...s, x: pos.x, w: r - pos.x, h: pos.y - y };
    if (handleId === 'tm') return { ...s, y: pos.y, h: b - pos.y };
    if (handleId === 'bm') return { ...s, h: pos.y - y };
    if (handleId === 'ml') return { ...s, x: pos.x, w: r - pos.x };
    if (handleId === 'mr') return { ...s, w: pos.x - x };
  }

  if (s.type === 'circle') {
    const dx = Math.abs(pos.x - s.cx);
    const dy = Math.abs(pos.y - s.cy);
    if (handleId === 't' || handleId === 'b') {
      return { ...s, ry: Math.max(8, dy), rx: s.rx ?? s.r };
    }
    if (handleId === 'l' || handleId === 'r') {
      return { ...s, rx: Math.max(8, dx), ry: s.ry ?? s.r };
    }
  }

  if (s.type === 'triangle') {
    if (handleId === 'v1') return { ...s, x1: pos.x, y1: pos.y };
    if (handleId === 'v2') return { ...s, x2: pos.x, y2: pos.y };
    if (handleId === 'v3') return { ...s, x3: pos.x, y3: pos.y };
  }

  if (s.type === 'line') {
    if (handleId === 'p1') return { ...s, x1: pos.x, y1: pos.y };
    if (handleId === 'p2') return { ...s, x2: pos.x, y2: pos.y };
  }

  return s;
};

const perpendicularDist = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
};

export const hitTestStroke = (stroke, pos, threshold = 14) => {
  if (!stroke) return false;
  if (stroke.shape) return hitTestShape(stroke.shape, pos, threshold);
  const pts = stroke.points || [];
  const tol = threshold + (stroke.thickness || 2) * 0.6;
  for (let i = 1; i < pts.length; i++) {
    if (perpendicularDist(pos, pts[i - 1], pts[i]) < tol) return true;
  }
  if (pts.length === 1 && dist(pos, pts[0]) < tol) return true;
  return false;
};

export const getStrokeBounds = (stroke) => {
  if (!stroke) return null;
  if (stroke.shape) {
    const pts = shapeToPoints(stroke.shape);
    if (!pts.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  const pts = stroke.points || [];
  if (!pts.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  const pad = (stroke.thickness || 2) * 0.5;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
};

export const moveStroke = (stroke, dx, dy) => {
  if (!stroke) return stroke;
  if (stroke.shape) {
    const sh = { ...stroke.shape };
    if (sh.type === 'line') {
      sh.x1 += dx; sh.y1 += dy; sh.x2 += dx; sh.y2 += dy;
    } else if (sh.type === 'circle') {
      sh.cx += dx; sh.cy += dy;
    } else if (sh.type === 'rect') {
      sh.x += dx; sh.y += dy;
    } else if (sh.type === 'triangle') {
      sh.x1 += dx; sh.y1 += dy; sh.x2 += dx; sh.y2 += dy; sh.x3 += dx; sh.y3 += dy;
    }
    return { ...stroke, shape: sh, points: shapeToPoints(sh) };
  }
  return {
    ...stroke,
    points: (stroke.points || []).map((p) => ({ x: p.x + dx, y: p.y + dy })),
  };
};

export const hitTestShape = (sh, pos, threshold = 14) => {
  if (!sh) return false;
  if (sh.type === 'line') {
    return perpendicularDist(pos, { x: sh.x1, y: sh.y1 }, { x: sh.x2, y: sh.y2 }) < threshold;
  }
  if (sh.type === 'circle') {
    const rx = sh.rx ?? sh.r;
    const ry = sh.ry ?? sh.r;
    const dx = (pos.x - sh.cx) / (rx || 1);
    const dy = (pos.y - sh.cy) / (ry || 1);
    const d = Math.abs(Math.hypot(dx, dy) - 1);
    return d * Math.max(rx, ry) < threshold * 2;
  }
  if (sh.type === 'rect') {
    const inside =
      pos.x >= sh.x - threshold &&
      pos.x <= sh.x + sh.w + threshold &&
      pos.y >= sh.y - threshold &&
      pos.y <= sh.y + sh.h + threshold;
    const inInner =
      pos.x >= sh.x + threshold &&
      pos.x <= sh.x + sh.w - threshold &&
      pos.y >= sh.y + threshold &&
      pos.y <= sh.y + sh.h - threshold;
    return inside && !inInner;
  }
  if (sh.type === 'triangle') {
    return (
      perpendicularDist(pos, { x: sh.x1, y: sh.y1 }, { x: sh.x2, y: sh.y2 }) < threshold ||
      perpendicularDist(pos, { x: sh.x2, y: sh.y2 }, { x: sh.x3, y: sh.y3 }) < threshold ||
      perpendicularDist(pos, { x: sh.x3, y: sh.y3 }, { x: sh.x1, y: sh.y1 }) < threshold
    );
  }
  return false;
};

export const shapeToPoints = (sh) => {
  if (!sh) return [];
  if (sh.type === 'line') return [{ x: sh.x1, y: sh.y1 }, { x: sh.x2, y: sh.y2 }];
  if (sh.type === 'circle') {
    const rx = sh.rx ?? sh.r;
    const ry = sh.ry ?? sh.r;
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push({ x: sh.cx + Math.cos(a) * rx, y: sh.cy + Math.sin(a) * ry });
    }
    return pts;
  }
  if (sh.type === 'rect') {
    const { x, y, w, h } = sh;
    return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }];
  }
  if (sh.type === 'triangle') {
    return [
      { x: sh.x1, y: sh.y1 },
      { x: sh.x2, y: sh.y2 },
      { x: sh.x3, y: sh.y3 },
      { x: sh.x1, y: sh.y1 },
    ];
  }
  return [];
};
