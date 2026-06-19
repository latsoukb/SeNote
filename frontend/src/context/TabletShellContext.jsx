import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TabletShellContext = createContext(null);

export function TabletShellProvider({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocus, setSettingsFocus] = useState(null);
  const [wifiOpen, setWifiOpen] = useState(false);

  const openSettings = useCallback((focus) => {
    setSettingsFocus(focus || null);
    setSettingsOpen(true);
  }, []);

  const openWifiPanel = useCallback(() => {
    setWifiOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      settingsOpen,
      setSettingsOpen,
      settingsFocus,
      openSettings,
      wifiOpen,
      setWifiOpen,
      openWifiPanel,
    }),
    [settingsOpen, settingsFocus, openSettings, wifiOpen, openWifiPanel]
  );

  return <TabletShellContext.Provider value={value}>{children}</TabletShellContext.Provider>;
}

export function useTabletShell() {
  return useContext(TabletShellContext);
}
