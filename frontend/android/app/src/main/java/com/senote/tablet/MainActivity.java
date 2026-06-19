package com.senote.tablet;

import android.os.Bundle;

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
    }

    @Override
    public void onResume() {
        super.onResume();
        if (KioskManager.isMaintenanceMode()) return;
        KioskManager.applyStrictLockTaskPackages(this);
        KioskManager.enableLockTask(this);
    }
}
