import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TabletShellContext = createContext(null);

export function TabletShellProvider({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocus, setSettingsFocus] = useState(null);

  const openSettings = useCallback((focus) => {
    setSettingsFocus(focus || null);
    setSettingsOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      settingsOpen,
      setSettingsOpen,
      settingsFocus,
      openSettings,
    }),
    [settingsOpen, settingsFocus, openSettings]
  );

  return <TabletShellContext.Provider value={value}>{children}</TabletShellContext.Provider>;
}

export function useTabletShell() {
  return useContext(TabletShellContext);
}
