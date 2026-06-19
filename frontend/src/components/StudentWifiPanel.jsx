import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import StudentWifiSettings from './StudentWifiSettings';

/** Fenêtre Wi‑Fi in-app (depuis la barre système). */
const StudentWifiPanel = ({ open, onOpenChange }) => {
  const [scanKey, setScanKey] = useState(0);

  useEffect(() => {
    if (open) setScanKey((k) => k + 1);
  }, [open]);

  const handleClose = useCallback(
    (next) => {
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[min(85dvh,100vh-3rem)] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>Wi‑Fi</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 overflow-y-auto overscroll-contain thin-scroll min-h-0 flex-1">
          <StudentWifiSettings panelMode autoScanKey={scanKey} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentWifiPanel;
