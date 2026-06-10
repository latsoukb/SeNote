import { HIGHLIGHTER_COLORS, PEN_COLORS } from '../mock/mock';

export const DEFAULT_TOOL_COLORS = {
  pen: PEN_COLORS[0],
  highlighter: HIGHLIGHTER_COLORS[0],
  text: PEN_COLORS[0],
};

const STORAGE_KEY = 'senote-tool-colors';

export const loadToolColors = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TOOL_COLORS };
    return { ...DEFAULT_TOOL_COLORS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TOOL_COLORS };
  }
};

export const saveToolColors = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

export const colorForTool = (map, tool) => {
  if (tool === 'highlighter') return map.highlighter ?? DEFAULT_TOOL_COLORS.highlighter;
  if (tool === 'text') return map.text ?? DEFAULT_TOOL_COLORS.text;
  return map.pen ?? DEFAULT_TOOL_COLORS.pen;
};
