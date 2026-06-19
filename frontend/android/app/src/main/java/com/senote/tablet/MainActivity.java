package com.senote.tablet;

import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KioskPlugin.class);
        super.onCreate(savedInstanceState);
        // Barres claires par défaut au lancement (thème JS appliquera la bonne variante)
        if (getWindow() != null) {
            KioskPlugin.applySystemBars(getWindow(), false);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                startLockTask();
            }
        } catch (Exception ignored) {
            // lockTaskMode="always" requis dans le manifest
        }
    }
}
