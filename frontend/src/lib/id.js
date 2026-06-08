// Stable utility to generate unique IDs outside of React render
export const makeId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
