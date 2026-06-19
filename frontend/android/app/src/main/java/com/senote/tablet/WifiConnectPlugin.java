package com.senote.tablet;

import android.Manifest;
import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiNetworkSpecifier;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(
        name = "WifiConnect",
        permissions = {
            @Permission(
                    alias = "location",
                    strings = { Manifest.permission.ACCESS_FINE_LOCATION }),
            @Permission(
                    alias = "nearbyWifi",
                    strings = { Manifest.permission.NEARBY_WIFI_DEVICES })
        })
public class WifiConnectPlugin extends Plugin {

    @PluginMethod
    public void getStatus(PluginCall call) {
        WifiManager wifi = wifiManager();
        if (wifi == null) {
            call.reject("Wi-Fi indisponible sur cet appareil");
            return;
        }

        JSObject ret = new JSObject();
        ret.put("wifiEnabled", wifi.isWifiEnabled());
        ret.put("connected", false);
        ret.put("ssid", "");

        WifiInfo info = wifi.getConnectionInfo();
        if (info != null) {
            String ssid = normalizeSsid(info.getSSID());
            boolean connected =
                    info.getNetworkId() != -1
                            && ssid != null
                            && !ssid.isEmpty()
                            && !"<unknown ssid>".equalsIgnoreCase(ssid);
            ret.put("connected", connected);
            if (connected) {
                ret.put("ssid", ssid);
            }
        }

        call.resolve(ret);
    }

    @PluginMethod
    public void scan(PluginCall call) {
        if (!hasScanPermission()) {
            requestAllPermissions(call, "scanPermissionsCallback");
            return;
        }
        performScan(call);
    }

    @PermissionCallback
    private void scanPermissionsCallback(PluginCall call) {
        if (!hasScanPermission()) {
            call.reject("Autorisation requise pour rechercher les réseaux Wi-Fi");
            return;
        }
        performScan(call);
    }

    private void performScan(PluginCall call) {
        WifiManager wifi = wifiManager();
        if (wifi == null) {
            call.reject("Wi-Fi indisponible");
            return;
        }
        if (!wifi.isWifiEnabled()) {
            call.reject("WIFI_DISABLED");
            return;
        }

        boolean started = wifi.startScan();
        if (!started) {
            // startScan peut echouer (throttle) — on retourne quand meme les derniers resultats
        }

        List<ScanResult> results = wifi.getScanResults();
        Map<String, ScanResult> bestBySsid = new HashMap<>();
        if (results != null) {
            for (ScanResult result : results) {
                if (result.SSID == null || result.SSID.isEmpty()) continue;
                ScanResult existing = bestBySsid.get(result.SSID);
                if (existing == null || result.level > existing.level) {
                    bestBySsid.put(result.SSID, result);
                }
            }
        }

        JSArray networks = new JSArray();
        List<Map.Entry<String, ScanResult>> sorted = new ArrayList<>(bestBySsid.entrySet());
        sorted.sort((a, b) -> Integer.compare(b.getValue().level, a.getValue().level));

        for (Map.Entry<String, ScanResult> entry : sorted) {
            ScanResult result = entry.getValue();
            JSObject network = new JSObject();
            network.put("ssid", result.SSID);
            network.put("level", result.level);
            network.put("secure", isSecure(result));
            networks.put(network);
        }

        JSObject ret = new JSObject();
        ret.put("networks", networks);
        call.resolve(ret);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String ssid = call.getString("ssid");
        if (ssid == null || ssid.trim().isEmpty()) {
            call.reject("SSID manquant");
            return;
        }
        String password = call.getString("password", "");
        boolean secure = Boolean.TRUE.equals(call.getBoolean("secure", true));

        WifiManager wifi = wifiManager();
        if (wifi == null) {
            call.reject("Wi-Fi indisponible");
            return;
        }
        if (!wifi.isWifiEnabled()) {
            call.reject("WIFI_DISABLED");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            connectModern(call, ssid, password, secure);
        } else {
            connectLegacy(call, ssid, password, secure);
        }
    }

    @PluginMethod
    public void openWifiPanel(PluginCall call) {
        getActivity()
                .runOnUiThread(
                        () -> {
                            if (!KioskManager.openStudentPanel(getActivity(), "wifi")) {
                                call.reject("NOT_DEVICE_OWNER");
                                return;
                            }
                            call.resolve();
                        });
    }

    @PluginMethod
    public void setWifiEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", true));
        WifiManager wifi = wifiManager();
        if (wifi == null) {
            call.reject("Wi-Fi indisponible");
            return;
        }

        Context ctx = getContext();
        if (KioskManager.isDeviceOwner(ctx)) {
            DevicePolicyManager dpm = ctx.getSystemService(DevicePolicyManager.class);
            if (dpm != null) {
                try {
                    dpm.setGlobalSetting(
                            KioskManager.adminComponent(ctx),
                            android.provider.Settings.Global.WIFI_ON,
                            enabled ? "1" : "0");
                    call.resolve();
                    return;
                } catch (Exception e) {
                    call.reject(e.getMessage());
                    return;
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            call.reject("WIFI_TOGGLE_BLOCKED");
            return;
        }

        @SuppressWarnings("deprecation")
        boolean ok = wifi.setWifiEnabled(enabled);
        if (ok) {
            call.resolve();
        } else {
            call.reject("Impossible de modifier le Wi-Fi");
        }
    }

    private void connectModern(PluginCall call, String ssid, String password, boolean secure) {
        if (secure && (password == null || password.isEmpty())) {
            call.reject("Mot de passe requis");
            return;
        }

        WifiNetworkSpecifier.Builder builder = new WifiNetworkSpecifier.Builder().setSsid(ssid);
        if (secure) {
            builder.setWpa2Passphrase(password);
        }

        NetworkRequest request =
                new NetworkRequest.Builder()
                        .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                        .setNetworkSpecifier(builder.build())
                        .build();

        ConnectivityManager cm =
                (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) {
            call.reject("Connexion impossible");
            return;
        }

        ConnectivityManager.NetworkCallback callback =
                new ConnectivityManager.NetworkCallback() {
                    @Override
                    public void onAvailable(Network network) {
                        try {
                            cm.unregisterNetworkCallback(this);
                        } catch (Exception ignored) {
                        }
                        call.resolve();
                    }

                    @Override
                    public void onUnavailable() {
                        try {
                            cm.unregisterNetworkCallback(this);
                        } catch (Exception ignored) {
                        }
                        call.reject("Connexion refusée ou réseau introuvable");
                    }
                };

        cm.requestNetwork(request, callback, 45000);
    }

    @SuppressWarnings("deprecation")
    private void connectLegacy(PluginCall call, String ssid, String password, boolean secure) {
        WifiManager wifi = wifiManager();
        if (wifi == null) {
            call.reject("Wi-Fi indisponible");
            return;
        }

        WifiConfiguration config = new WifiConfiguration();
        config.SSID = quoteSsid(ssid);
        if (secure) {
            if (password == null || password.isEmpty()) {
                call.reject("Mot de passe requis");
                return;
            }
            config.preSharedKey = quoteSsid(password);
        } else {
            config.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE);
        }

        int networkId = wifi.addNetwork(config);
        if (networkId == -1) {
            call.reject("Impossible d'ajouter le réseau");
            return;
        }
        wifi.disconnect();
        boolean enabled = wifi.enableNetwork(networkId, true);
        boolean reconnected = wifi.reconnect();
        if (enabled && reconnected) {
            call.resolve();
        } else {
            call.reject("Connexion impossible");
        }
    }

    private boolean hasScanPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return getPermissionState("nearbyWifi") == PermissionState.GRANTED;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return getPermissionState("location") == PermissionState.GRANTED
                    || getContext()
                                    .checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                            == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    private WifiManager wifiManager() {
        return (WifiManager)
                getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    }

    private static boolean isSecure(ScanResult result) {
        String caps = result.capabilities == null ? "" : result.capabilities;
        return caps.contains("WEP")
                || caps.contains("WPA")
                || caps.contains("WPA2")
                || caps.contains("WPA3")
                || caps.contains("PSK")
                || caps.contains("EAP");
    }

    private static String normalizeSsid(String raw) {
        if (raw == null) return "";
        if (raw.startsWith("\"") && raw.endsWith("\"") && raw.length() >= 2) {
            return raw.substring(1, raw.length() - 1);
        }
        return raw;
    }

    private static String quoteSsid(String value) {
        return "\"" + value.replace("\"", "\\\"") + "\"";
    }
}
