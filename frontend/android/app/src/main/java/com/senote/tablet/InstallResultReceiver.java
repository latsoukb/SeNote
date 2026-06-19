package com.senote.tablet;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;

public class InstallResultReceiver extends BroadcastReceiver {

    public static final String ACTION = "com.senote.tablet.INSTALL_COMPLETE";

    private static ApkInstaller.Callback callback;

    static void setCallback(ApkInstaller.Callback next) {
        callback = next;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        ApkInstaller.Callback current = callback;
        callback = null;

        if (current == null) return;

        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_SUCCESS) {
            current.onSuccess();
            return;
        }

        String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
        if (message == null || message.isEmpty()) {
            message = "Installation refusée (code " + status + ")";
        }
        current.onError(message);
    }
}
