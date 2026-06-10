export const DEFAULT_TOOL_THICKNESS = {
  pen: 2.5,
  highlighter: 18,
  eraser: 16,
};

const STORAGE_KEY = 'senote-tool-thickness';

export const loadToolThickness = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TOOL_THICKNESS };
    return { ...DEFAULT_TOOL_THICKNESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TOOL_THICKNESS };
  }
};

export const saveToolThickness = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

export const thicknessForTool = (map, tool) =>
  map[tool] ?? map.pen ?? DEFAULT_TOOL_THICKNESS.pen;
