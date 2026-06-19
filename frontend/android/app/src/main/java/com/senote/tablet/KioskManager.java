package com.senote.tablet;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.UserManager;
import android.provider.Settings;

public final class KioskManager {

    private static final String PKG = "com.senote.tablet";
    private static final String SETTINGS_PKG = "com.android.settings";

    private static boolean maintenanceMode = false;

    private KioskManager() {}

    public static boolean isMaintenanceMode() {
        return maintenanceMode;
    }

    public static ComponentName adminComponent(Context ctx) {
        return new ComponentName(ctx, SeNoteDeviceAdminReceiver.class);
    }

    public static boolean isDeviceOwner(Context ctx) {
        DevicePolicyManager dpm = ctx.getSystemService(DevicePolicyManager.class);
        return dpm != null && dpm.isDeviceOwnerApp(PKG);
    }

    public static boolean isLockTaskActive(Activity activity) {
        if (activity == null) return false;
        ActivityManager am = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
        if (am == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int state = am.getLockTaskModeState();
            return state == ActivityManager.LOCK_TASK_MODE_LOCKED
                    || state == ActivityManager.LOCK_TASK_MODE_PINNED;
        }
        return false;
    }

    public static void applyStrictLockTaskPackages(Context ctx) {
        if (!isDeviceOwner(ctx)) return;
        DevicePolicyManager dpm = ctx.getSystemService(DevicePolicyManager.class);
        if (dpm == null) return;
        dpm.setLockTaskPackages(adminComponent(ctx), new String[] { PKG });
    }

    public static void applyDeviceOwnerPolicies(Context ctx) {
        if (!isDeviceOwner(ctx)) return;
        DevicePolicyManager dpm = ctx.getSystemService(DevicePolicyManager.class);
        if (dpm == null) return;
        ComponentName admin = adminComponent(ctx);

        applyStrictLockTaskPackages(ctx);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
        }

        setUserRestriction(dpm, admin, UserManager.DISALLOW_UNINSTALL_APPS);
        setUserRestriction(dpm, admin, UserManager.DISALLOW_FACTORY_RESET);
        setUserRestriction(dpm, admin, UserManager.DISALLOW_SAFE_BOOT);
        setUserRestriction(dpm, admin, UserManager.DISALLOW_ADD_USER);
        setUserRestriction(dpm, admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES);
        // Pas DISALLOW_INSTALL_APPS : bloquerait les mises a jour SeNote in-app

        hideApplication(dpm, admin, "com.android.vending");
        hideApplication(dpm, admin, "com.android.chrome");
        hideApplication(dpm, admin, "com.google.android.youtube");
        hideApplication(dpm, admin, "com.zhiliaoapp.musically");
        hideApplication(dpm, admin, "com.ss.android.ugc.trill");
    }

    private static void setUserRestriction(
            DevicePolicyManager dpm, ComponentName admin, String restriction) {
        try {
            dpm.addUserRestriction(admin, restriction);
        } catch (Exception ignored) {
            // Policy deja appliquee ou non supportee sur cet appareil
        }
    }

    private static void clearUserRestriction(
            DevicePolicyManager dpm, ComponentName admin, String restriction) {
        try {
            dpm.clearUserRestriction(admin, restriction);
        } catch (Exception ignored) {
            // Restriction absente
        }
    }

    /** Mode maintenance IT : le technicien peut installer, desinstaller, ouvrir les reglages. */
    public static void enterMaintenanceMode(Context ctx, Activity activity) {
        if (activity == null) return;
        maintenanceMode = true;

        if (isDeviceOwner(ctx)) {
            DevicePolicyManager dpm = ctx.getSystemService(DevicePolicyManager.class);
            if (dpm != null) {
                ComponentName admin = adminComponent(ctx);
                clearUserRestriction(dpm, admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES);
                clearUserRestriction(dpm, admin, UserManager.DISALLOW_UNINSTALL_APPS);
                dpm.setLockTaskPackages(
                        admin,
                        new String[] {
                            PKG,
                            SETTINGS_PKG,
                            "com.android.packageinstaller",
                            "com.google.android.packageinstaller",
                            "com.android.permissioncontroller"
                        });
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                activity.stopLockTask();
            } catch (Exception ignored) {
                // Pas en lock task
            }
        }
    }

    public static void exitMaintenanceMode(Context ctx, Activity activity) {
        maintenanceMode = false;
        if (isDeviceOwner(ctx)) {
            applyDeviceOwnerPolicies(ctx);
        }
        enableLockTask(activity);
    }

    public static void preparePackageInstall(Context ctx, Activity activity) {
        if (!isDeviceOwner(ctx) || activity == null) return;
        DevicePolicyManager dpm = ctx.getSystemService(DevicePolicyManager.class);
        if (dpm == null) return;
        ComponentName admin = adminComponent(ctx);
        clearUserRestriction(dpm, admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES);
        dpm.setLockTaskPackages(
                admin,
                new String[] {
                    PKG,
                    "com.android.packageinstaller",
                    "com.google.android.packageinstaller",
                    "com.android.permissioncontroller"
                });
        restartLockTask(activity);
    }

    public static void openFullSettings(Activity activity) {
        if (activity == null) return;
        enterMaintenanceMode(activity.getApplicationContext(), activity);
        Intent intent = new Intent(Settings.ACTION_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }

    private static void hideApplication(
            DevicePolicyManager dpm, ComponentName admin, String packageName) {
        try {
            dpm.setApplicationHidden(admin, packageName, true);
        } catch (Exception ignored) {
            // Application absente sur cet appareil
        }
    }

    public static void openWifiPanel(Activity activity) {
        openAdminSystemSettings(activity, "wifi");
    }

    public static void openAdminSystemSettings(Activity activity, String type) {
        if (activity == null) return;

        if (isDeviceOwner(activity)) {
            DevicePolicyManager dpm = activity.getSystemService(DevicePolicyManager.class);
            if (dpm != null) {
                dpm.setLockTaskPackages(
                        adminComponent(activity), new String[] { PKG, SETTINGS_PKG });
            }
            restartLockTask(activity);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                activity.stopLockTask();
            } catch (Exception ignored) {
                // Pas en lock task
            }
        }

        Intent intent = buildSettingsIntent(type);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }

    private static Intent buildSettingsIntent(String type) {
        if ("security".equals(type)) {
            return new Intent(Settings.ACTION_SECURITY_SETTINGS);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return new Intent(Settings.Panel.ACTION_WIFI);
        }
        return new Intent(Settings.ACTION_WIFI_SETTINGS);
    }

    public static void restartLockTask(Activity activity) {
        if (activity == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return;
        try {
            activity.stopLockTask();
            activity.startLockTask();
        } catch (Exception ignored) {
            // Lock task indisponible sans device owner / manifest
        }
    }

    public static void enableLockTask(Activity activity) {
        if (activity == null) return;
        Context ctx = activity.getApplicationContext();
        if (isDeviceOwner(ctx)) {
            applyDeviceOwnerPolicies(ctx);
        }
        restartLockTask(activity);
    }
}
