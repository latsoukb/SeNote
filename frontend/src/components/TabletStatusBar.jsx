import React from 'react';
import {
  Battery,
  BatteryCharging,
  Settings,
  Shield,
  ShieldOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from './ui/button';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useTabletShell } from '../context/TabletShellContext';

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

/** Barre système SeNote : heure, réseau, batterie, accès paramètres. */
const TabletStatusBar = () => {
  const { openSettings } = useTabletShell();
  const { status, clock } = useDeviceStatus();

  const locked = status.lockTaskActive && !status.maintenanceMode;
  const wifiLabel = status.wifiConnected
    ? status.wifiSsid || 'Wi‑Fi'
    : status.wifiEnabled
      ? 'Non connecté'
      : 'Wi‑Fi off';

  return (
    <header
      className="tablet-os-bar shrink-0 z-50 flex items-center gap-2 px-3 sm:px-4 border-b border-slate-200/80 dark:border-chrome-800/80 bg-white/95 dark:bg-chrome-950/95 backdrop-blur-md text-xs sm:text-sm text-slate-700 dark:text-slate-200"
      role="banner"
      aria-label="Barre système SeNote"
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="font-semibold tracking-tight text-brand-700 dark:text-brand-300 shrink-0">
          SeNote
        </span>
        {status.deviceOwner ? (
          <Shield
            className="w-3.5 h-3.5 shrink-0 text-green-600 dark:text-green-400"
            aria-label="Verrou définitif actif"
          />
        ) : (
          <ShieldOff
            className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-label="Verrou partiel"
            title="Verrou partiel — provision IT requis"
          />
        )}
        {!locked && (
          <span className="hidden sm:inline text-amber-700 dark:text-amber-300 truncate">
            · maintenance
          </span>
        )}
      </div>

      <div className="hidden md:flex flex-col items-center leading-tight px-2">
        <time dateTime={clock.toISOString()} className="font-medium tabular-nums">
          {formatClock(clock)}
        </time>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
          {formatDate(clock)}
        </span>
      </div>
      <time
        dateTime={clock.toISOString()}
        className="md:hidden font-medium tabular-nums px-1"
      >
        {formatClock(clock)}
      </time>

      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end min-w-0">
        <button
          type="button"
          onClick={() => openSettings('wifi')}
          className="flex items-center gap-1 min-w-0 max-w-[9rem] sm:max-w-[12rem] px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-chrome-800 transition-colors"
          aria-label={`Wi‑Fi : ${wifiLabel}`}
        >
          {status.wifiConnected ? (
            <Wifi className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 shrink-0 text-slate-400" />
          )}
          <span className="truncate hidden sm:inline">{wifiLabel}</span>
        </button>

        <div
          className="flex items-center gap-1 px-1 tabular-nums"
          aria-label={`Batterie ${status.batteryLevel} pour cent${status.batteryCharging ? ', en charge' : ''}`}
        >
          <BatteryIcon level={status.batteryLevel} charging={status.batteryCharging} />
          <span>{status.batteryLevel > 0 ? `${status.batteryLevel}%` : '—'}</span>
        </div>

        {!status.networkConnected && status.wifiConnected && (
          <span className="hidden lg:inline text-[10px] text-amber-700 dark:text-amber-300">
            sans Internet
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full shrink-0"
          aria-label="Paramètres"
          onClick={() => openSettings()}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default TabletStatusBar;
