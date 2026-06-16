#!/usr/bin/env node
/**
 * Injecte les infos de mise à jour APK dans app-config.json
 * à partir de frontend/android/app/build.gradle
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gradlePath = path.join(root, 'frontend/android/app/build.gradle');
const configPath = process.argv[2];

if (!configPath) {
  console.error('Usage: node inject-app-config-update.mjs <path/to/app-config.json>');
  process.exit(1);
}

const gradle = fs.readFileSync(gradlePath, 'utf8');
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1];
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];

if (!versionCode || !versionName) {
  console.error('versionCode / versionName introuvable dans build.gradle');
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
cfg.latestApkVersion = versionName;
cfg.latestApkVersionCode = Number(versionCode);
cfg.apkDownloadUrl =
  cfg.apkDownloadUrl ||
  'https://github.com/latsoukb/SeNote/releases/latest/download/SeNote-tablet.apk';

fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
console.log(`app-config: APK v${versionName} (${versionCode})`);
