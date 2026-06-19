import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import SettingsDialog from './SettingsDialog';
import TabletStatusBar from './TabletStatusBar';
import StudentWifiPanel from './StudentWifiPanel';
import StudentScreenLockGate from './StudentScreenLockGate';
import { TabletShellProvider, useTabletShell } from '../context/TabletShellContext';
import { useDeviceStatus } from '../hooks/useDeviceStatus';

const TabletShellFrame = ({ children }) => {
  const { settingsOpen, setSettingsOpen, settingsFocus, wifiOpen, setWifiOpen } = useTabletShell();
  const { refresh } = useDeviceStatus();

  return (
    <div className="min-h-dvh flex flex-col">
      <TabletStatusBar />
      <StudentScreenLockGate>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </StudentScreenLockGate>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        focusSection={settingsFocus}
        hideTrigger
      />
      <StudentWifiPanel
        open={wifiOpen}
        onOpenChange={(next) => {
          setWifiOpen(next);
          if (!next) refresh();
        }}
      />
    </div>
  );
};

/** Enveloppe tablette : barre système + Wi‑Fi / paramètres in-app. */
export default function TabletShell({ children }) {
  return (
    <TabletShellProvider>
      <TabletShellFrame>{children}</TabletShellFrame>
    </TabletShellProvider>
  );
}

/** Bouton paramètres (une seule instance dans l'app, pas dans la barre système). */
export function SettingsTrigger({ className }) {
  const shell = useTabletShell();

  if (shell) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className || 'rounded-full'}
        aria-label="Paramètres"
        onClick={() => shell.openSettings()}
      >
        <Settings className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <SettingsDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className || 'rounded-full'}
          aria-label="Paramètres"
        >
          <Settings className="w-5 h-5" />
        </Button>
      }
    />
  );
}
