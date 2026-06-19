import { useCallback, useEffect, useState } from 'react';
import { isNativeApp } from './platform';
import { Kiosk } from '../plugins/kiosk';

const DEFAULT_STATUS = {
  batteryLevel: 0,
  batteryCharging: false,
  wifiEnabled: false,
  wifiConnected: false,
  wifiSsid: '',
  networkConnected: false,
  deviceOwner: false,
  lockTaskActive: false,
  maintenanceMode: false,
};

/** Heure, batterie, Wi‑Fi et état du verrou (APK tablette). */
export function useDeviceStatus(pollMs = 15000) {
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [clock, setClock] = useState(() => new Date());

  const refresh = useCallback(async () => {
    if (!isNativeApp()) return;
    try {
      const next = await Kiosk.getDeviceStatus();
      setStatus((prev) => ({ ...prev, ...next }));
    } catch {
      // Plugin absent ou indisponible
    }
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    refresh();
    const dataTimer = setInterval(refresh, pollMs);
    const clockTimer = setInterval(() => setClock(new Date()), 1000);

    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, [pollMs, refresh]);

  return { status, clock, refresh };
}
