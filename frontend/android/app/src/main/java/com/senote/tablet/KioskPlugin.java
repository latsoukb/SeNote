package com.senote.tablet;

import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Kiosk")
public class KioskPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                KioskManager.exitMaintenanceMode(getContext(), getActivity());
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }

    @PluginMethod
    public void enterMaintenance(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            KioskManager.enterMaintenanceMode(getContext(), getActivity());
            call.resolve();
        });
    }

    @PluginMethod
    public void exitMaintenance(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            KioskManager.exitMaintenanceMode(getContext(), getActivity());
            call.resolve();
        });
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null || uri.trim().isEmpty()) {
            call.reject("URI APK manquante");
            return;
        }

        getActivity().runOnUiThread(() -> {
            KioskManager.preparePackageInstall(getContext(), getActivity());
            call.setKeepAlive(true);
            bridge.saveCall(call);
            ApkInstaller.install(
                    getContext(),
                    uri,
                    new ApkInstaller.Callback() {
                        @Override
                        public void onSuccess() {
                            getActivity()
                                    .runOnUiThread(
                                            () -> {
                                                PluginCall saved = bridge.getSavedCall(call.getCallbackId());
                                                if (saved != null) {
                                                    saved.resolve();
                                                    bridge.releaseCall(saved);
                                                }
                                            });
                        }

                        @Override
                        public void onError(String message) {
                            getActivity()
                                    .runOnUiThread(
                                            () -> {
                                                PluginCall saved = bridge.getSavedCall(call.getCallbackId());
                                                if (saved != null) {
                                                    saved.reject(message);
                                                    bridge.releaseCall(saved);
                                                }
                                            });
                        }
                    });
        });
    }

    @PluginMethod
    public void getBuildInfo(PluginCall call) {
        JSObject ret = new JSObject();
        boolean debug =
                (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        ret.put("debug", debug);
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("deviceOwner", KioskManager.isDeviceOwner(getContext()));
        ret.put("lockTaskActive", KioskManager.isLockTaskActive(getActivity()));
        ret.put("maintenanceMode", KioskManager.isMaintenanceMode());
        call.resolve(ret);
    }

    @PluginMethod
    public void applyPolicies(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!KioskManager.isDeviceOwner(getContext())) {
                call.reject("NOT_DEVICE_OWNER");
                return;
            }
            KioskManager.applyDeviceOwnerPolicies(getContext());
            KioskManager.enableLockTask(getActivity());
            call.resolve();
        });
    }

    @PluginMethod
    public void openSystemSettings(PluginCall call) {
        String type = call.getString("type", "wifi");
        getActivity().runOnUiThread(() -> {
            KioskManager.openAdminSystemSettings(getActivity(), type);
            call.resolve();
        });
    }

    @PluginMethod
    public void openFullSettings(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            KioskManager.openFullSettings(getActivity());
            call.resolve();
        });
    }

    @PluginMethod
    public void setSystemBars(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        getActivity().runOnUiThread(() -> {
            applySystemBars(getActivity().getWindow(), dark);
            call.resolve();
        });
    }

    static void applySystemBars(Window window, boolean dark) {
        if (window == null) return;

        if (dark) {
            window.setStatusBarColor(Color.BLACK);
            window.setNavigationBarColor(Color.BLACK);
            setLightBarIcons(window, false);
        } else {
            window.setStatusBarColor(Color.WHITE);
            window.setNavigationBarColor(Color.WHITE);
            setLightBarIcons(window, true);
        }
    }

    private static void setLightBarIcons(Window window, boolean light) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller == null) return;
            int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            if (light) {
                controller.setSystemBarsAppearance(mask, mask);
            } else {
                controller.setSystemBarsAppearance(0, mask);
            }
            return;
        }

        View decorView = window.getDecorView();
        int flags = decorView.getSystemUiVisibility();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (light) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            } else {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (light) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            } else {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
        }
        decorView.setSystemUiVisibility(flags);
    }
}
