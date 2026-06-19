import React, { useCallback, useEffect, useState } from 'react';
import {
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useTabletShell } from '../context/TabletShellContext';
import { WifiConnect } from '../plugins/wifiConnect';
import { toast } from 'sonner';

const formatClock = (date) =>
  date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const formatDate = (date) =>
  date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

const BatteryIcon = ({ level, charging }) => {
  if (charging) return <BatteryCharging className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />;
  const tone =
    level <= 15
      ? 'text-red-600 dark:text-red-400'
      : level <= 30
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-600 dark:text-slate-300';
  return <Battery className={`w-4 h-4 shrink-0 ${tone}`} />;
};

/** Wi‑Fi à gauche · heure au centre · batterie à droite. */
const TabletStatusBar = () => {
  const { openWifiPanel } = useTabletShell();
  const { status, clock } = useDeviceStatus();

  const wifiLabel = status.wifiConnected
    ? status.wifiSsid || 'Connecté'
    : status.wifiEnabled
      ? 'Wi‑Fi'
      : 'Wi‑Fi off';

  const handleWifiTap = async () => {
    if (status.deviceOwner) {
      try {
        await WifiConnect.openWifiPanel();
      } catch {
        toast.error('Panneau Wi‑Fi indisponible.');
      }
      return;
    }
    openWifiPanel();
  };

  return (
    <header
      className="tablet-os-bar shrink-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4 border-b border-slate-200/80 dark:border-chrome-800/80 bg-white/95 dark:bg-chrome-950/95 backdrop-blur-md text-xs sm:text-sm text-slate-700 dark:text-slate-200"
      role="banner"
      aria-label="Barre système"
    >
      <button
        type="button"
        onClick={handleWifiTap}
        className="flex items-center gap-1.5 min-w-0 justify-self-start px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-chrome-800 transition-colors"
        aria-label={`Wi‑Fi : ${wifiLabel}`}
      >
        {status.wifiConnected ? (
          <Wifi className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 shrink-0 text-slate-400" />
        )}
        <span className="truncate max-w-[8rem] sm:max-w-[10rem]">{wifiLabel}</span>
      </button>

      <div className="flex flex-col items-center leading-tight justify-self-center px-1">
        <time dateTime={clock.toISOString()} className="font-medium tabular-nums">
          {formatClock(clock)}
        </time>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize hidden sm:inline">
          {formatDate(clock)}
        </span>
      </div>

      <div
        className="flex items-center gap-1 justify-self-end tabular-nums px-1"
        aria-label={`Batterie ${status.batteryLevel} pour cent${status.batteryCharging ? ', en charge' : ''}`}
      >
        <BatteryIcon level={status.batteryLevel} charging={status.batteryCharging} />
        <span>{status.batteryLevel > 0 ? `${status.batteryLevel}%` : '—'}</span>
      </div>
    </header>
  );
};

export default TabletStatusBar;
