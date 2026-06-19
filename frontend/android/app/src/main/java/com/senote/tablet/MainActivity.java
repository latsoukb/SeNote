package com.senote.tablet;

import android.os.Bundle;
import android.view.View;
import android.view.Window;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KioskPlugin.class);
        registerPlugin(WifiConnectPlugin.class);
        super.onCreate(savedInstanceState);
        if (getWindow() != null) {
            KioskPlugin.applySystemBars(getWindow(), false);
        }
        applyKioskUi();
        if (!KioskManager.isMaintenanceMode()) {
            KioskManager.applyStrictLockTaskPackages(this);
            KioskManager.enableLockTask(this);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applyKioskUi();
        if (KioskManager.isMaintenanceMode()) return;
        KioskManager.applyStrictLockTaskPackages(this);
        KioskManager.enableLockTask(this);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus || KioskManager.isMaintenanceMode()) return;
        applyKioskUi();
        KioskManager.enableLockTask(this);
    }

    private void applyKioskUi() {
        if (KioskManager.isMaintenanceMode()) {
            showSystemBars(getWindow());
            return;
        }
        hideSystemBars(getWindow());
    }

    static void hideSystemBars(Window window) {
        if (window == null) return;
        View decor = window.getDecorView();
        decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    static void showSystemBars(Window window) {
        if (window == null) return;
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
}
