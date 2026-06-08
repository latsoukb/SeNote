import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const SettingsContext = createContext(null);
const SETTINGS_KEY = 'senote-settings-v1';

const DEFAULT_SETTINGS = {
  scrollDirection: 'vertical', // 'vertical' | 'horizontal'
  autoAddPage: true,
  stylusOnly: true, // stylet écrit, doigt déplace (GoodNotes)
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }, [settings]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
};
