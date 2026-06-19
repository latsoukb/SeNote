package com.senote.tablet;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

final class ApkInstaller {

    interface Callback {
        void onSuccess();

        void onError(String message);
    }

    private ApkInstaller() {}

    static void install(Context context, String uriString, Callback callback) {
        try (InputStream in = openStream(context, uriString)) {
            PackageInstaller installer = context.getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params =
                    new PackageInstaller.SessionParams(
                            PackageInstaller.SessionParams.MODE_FULL_INSTALL);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    && KioskManager.isDeviceOwner(context)) {
                params.setRequireUserAction(
                        PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
            }

            int sessionId = installer.createSession(params);
            PackageInstaller.Session session = installer.openSession(sessionId);

            try (OutputStream out = session.openWrite("senote-update", 0, -1)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
                session.fsync(out);
            }

            InstallResultReceiver.setCallback(callback);

            Intent intent = new Intent(context, InstallResultReceiver.class);
            intent.setAction(InstallResultReceiver.ACTION);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flags |= PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent pendingIntent =
                    PendingIntent.getBroadcast(context, sessionId, intent, flags);

            session.commit(pendingIntent.getIntentSender());
            session.close();
        } catch (Exception e) {
            InstallResultReceiver.setCallback(null);
            callback.onError(e.getMessage() != null ? e.getMessage() : "Installation impossible");
        }
    }

    private static InputStream openStream(Context context, String uriString) throws IOException {
        Uri uri = Uri.parse(uriString);
        if ("file".equals(uri.getScheme())) {
            return new FileInputStream(new File(uri.getPath()));
        }
        if ("content".equals(uri.getScheme())) {
            return context.getContentResolver().openInputStream(uri);
        }
        File file = new File(uriString);
        if (file.exists()) {
            return context.getContentResolver().openInputStream(Uri.fromFile(file));
        }
        throw new IOException("Chemin APK introuvable : " + uriString);
    }
}
