import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import SettingsDialog from './SettingsDialog';
import TabletStatusBar from './TabletStatusBar';
import { TabletShellProvider, useTabletShell } from '../context/TabletShellContext';

const TabletShellFrame = ({ children }) => {
  const { settingsOpen, setSettingsOpen, settingsFocus } = useTabletShell();

  return (
    <div className="min-h-dvh flex flex-col">
      <TabletStatusBar />
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        focusSection={settingsFocus}
        hideTrigger
      />
    </div>
  );
};

/** Enveloppe tablette : barre système + paramètres globaux. */
export default function TabletShell({ children }) {
  return (
    <TabletShellProvider>
      <TabletShellFrame>{children}</TabletShellFrame>
    </TabletShellProvider>
  );
}

/** Bouton paramètres branché sur la coque tablette (ou dialog autonome sur le web). */
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
