package com.senote.tablet;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;

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
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    getActivity().startLockTask();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    getActivity().stopLockTask();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
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
