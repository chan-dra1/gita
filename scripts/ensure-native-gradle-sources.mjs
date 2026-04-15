#!/usr/bin/env node
/**
 * Repair incomplete node_modules trees that break Android Gradle (missing Kotlin sources).
 * Re-syncs from the published npm tarball for the *installed* package version.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function packAndExtractDir({ scopeName, version, innerDir, destDir }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gita-native-"));
  try {
    const packOut = execSync(`npm pack ${scopeName}@${version}`, {
      cwd: tmp,
      encoding: "utf8",
    })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .pop();
    const tgz = path.join(tmp, packOut);
    execSync(`tar -xzf "${tgz}" -C "${tmp}"`, { stdio: "inherit" });
    const src = path.join(tmp, "package", innerDir);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing ${innerDir} in ${scopeName}@${version} tarball`);
    }
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destDir), { recursive: true });
    fs.cpSync(src, destDir, { recursive: true });
    console.warn(`ensure-native-gradle-sources: restored ${path.relative(root, destDir)} from ${scopeName}@${version}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function maybeRepairReactNativeGradlePlugin() {
  const destDir = path.join(root, "node_modules/@react-native/gradle-plugin");
  const pkgJson = path.join(destDir, "package.json");
  if (!fs.existsSync(pkgJson)) return;

  const { version } = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
  const ver = parseFloat(String(version).replace(/^(\d+\.\d+).*/, "$1"));
  if (Number.isFinite(ver) && ver < 0.83) {
    return;
  }

  const markers = [
    "settings-plugin/src/main/kotlin/com/facebook/react/ReactSettingsPlugin.kt",
    "react-native-gradle-plugin/src/main/kotlin/com/facebook/react/utils/FileUtils.kt",
    "react-native-gradle-plugin/src/main/kotlin/com/facebook/react/ReactPlugin.kt",
  ];
  const broken = markers.some((rel) => !fs.existsSync(path.join(destDir, rel)));
  if (!broken) return;

  packAndExtractDir({
    scopeName: "@react-native/gradle-plugin",
    version,
    innerDir: "",
    destDir,
  });
}

function maybeRepairExpoAutolinkingGradle() {
  const base = path.join(root, "node_modules/expo-modules-autolinking");
  const pkgJson = path.join(base, "package.json");
  if (!fs.existsSync(pkgJson)) return;

  const marker = path.join(
    base,
    "android/expo-gradle-plugin/expo-max-sdk-override-plugin/src/main/kotlin/expo/modules/plugin/PermissionInfo.kt",
  );
  if (fs.existsSync(marker)) return;

  const { version } = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
  const major = parseInt(String(version).split(".")[0], 10);
  if (!Number.isFinite(major) || major < 50) {
    return;
  }

  const destDir = path.join(base, "android/expo-gradle-plugin");
  packAndExtractDir({
    scopeName: "expo-modules-autolinking",
    version,
    innerDir: path.join("android", "expo-gradle-plugin"),
    destDir,
  });
}

maybeRepairReactNativeGradlePlugin();
maybeRepairExpoAutolinkingGradle();
