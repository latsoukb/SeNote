import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyAccentTheme, DEFAULT_ACCENT, isValidAccent } from '../lib/accentThemes';

const ThemeContext = createContext({
  theme: 'light',
  accent: DEFAULT_ACCENT,
  toggleTheme: () => {},
  setAccent: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('senote-theme') || 'light';
  });

  const [accent, setAccentState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_ACCENT;
    const stored = localStorage.getItem('senote-accent');
    return isValidAccent(stored) ? stored : DEFAULT_ACCENT;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('senote-theme', theme);
  }, [theme]);

  useEffect(() => {
    applyAccentTheme(accent);
    localStorage.setItem('senote-accent', accent);
  }, [accent]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const setAccent = (next) => {
    if (isValidAccent(next)) setAccentState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, accent, toggleTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
