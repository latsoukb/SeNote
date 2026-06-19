package com.senote.tablet;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;

import com.getcapacitor.JSObject;

public final class DeviceStatusHelper {

    private DeviceStatusHelper() {}

    public static JSObject read(Context ctx) {
        JSObject ret = new JSObject();
        readBattery(ctx, ret);
        readNetwork(ctx, ret);
        readWifi(ctx, ret);
        ret.put("deviceOwner", KioskManager.isDeviceOwner(ctx));
        ret.put("lockTaskActive", false);
        return ret;
    }

    private static void readBattery(Context ctx, JSObject ret) {
        int level = -1;
        boolean charging = false;

        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent battery = ctx.registerReceiver(null, filter);
        if (battery != null) {
            level = battery.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = battery.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            if (level >= 0 && scale > 0) {
                level = Math.round(level * 100f / scale);
            }
            int status = battery.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            charging =
                    status == BatteryManager.BATTERY_STATUS_CHARGING
                            || status == BatteryManager.BATTERY_STATUS_FULL;
        }

        ret.put("batteryLevel", Math.max(0, level));
        ret.put("batteryCharging", charging);
    }

    private static void readNetwork(Context ctx, JSObject ret) {
        boolean online = false;
        ConnectivityManager cm = ctx.getSystemService(ConnectivityManager.class);
        if (cm != null) {
            Network network = cm.getActiveNetwork();
            if (network != null) {
                NetworkCapabilities caps = cm.getNetworkCapabilities(network);
                if (caps != null) {
                    online =
                            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                                    && caps.hasCapability(
                                            NetworkCapabilities.NET_CAPABILITY_VALIDATED);
                }
            }
        }
        ret.put("networkConnected", online);
    }

    private static void readWifi(Context ctx, JSObject ret) {
        WifiManager wifi = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifi == null) {
            ret.put("wifiEnabled", false);
            ret.put("wifiConnected", false);
            ret.put("wifiSsid", "");
            return;
        }

        ret.put("wifiEnabled", wifi.isWifiEnabled());
        ret.put("wifiConnected", false);
        ret.put("wifiSsid", "");

        WifiInfo info = wifi.getConnectionInfo();
        if (info == null) return;

        String ssid = normalizeSsid(info.getSSID());
        boolean connected =
                info.getNetworkId() != -1
                        && ssid != null
                        && !ssid.isEmpty()
                        && !"<unknown ssid>".equalsIgnoreCase(ssid);
        ret.put("wifiConnected", connected);
        if (connected) {
            ret.put("wifiSsid", ssid);
        }
    }

    private static String normalizeSsid(String raw) {
        if (raw == null) return "";
        if (raw.startsWith("\"") && raw.endsWith("\"") && raw.length() >= 2) {
            return raw.substring(1, raw.length() - 1);
        }
        return raw;
    }
}
