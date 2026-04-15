#!/usr/bin/env bash
# Build a local release APK (unsigned / debug keystore per app/build.gradle).
# Output: android/app/build/outputs/apk/release/app-release.apk
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
elif [[ -d "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]]; then
  export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
elif command -v /usr/libexec/java_home >/dev/null 2>&1; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
fi
if [[ -z "${JAVA_HOME:-}" || ! -d "$JAVA_HOME" ]]; then
  echo "Set JAVA_HOME to JDK 17 (required for stable Kotlin/Gradle with this project)." >&2
  exit 1
fi
# RN codegen (New Architecture) breaks on Node 23+; RN 0.83 expects Node 20 LTS.
if [[ -x "/opt/homebrew/opt/node@20/bin/node" ]]; then
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
elif [[ -x "/usr/local/opt/node@20/bin/node" ]]; then
  export PATH="/usr/local/opt/node@20/bin:$PATH"
fi
NODE_MAJOR="$(node -p "parseInt(process.versions.node,10)" 2>/dev/null || echo 99)"
if [[ "$NODE_MAJOR" -gt 22 ]]; then
  echo "Install Node 20 (e.g. brew install node@20) or use nvm/fnm; Android codegen fails on Node $(node -v 2>/dev/null)." >&2
  exit 1
fi
# Project-local Gradle home avoids half-written plugin JARs from shared/sandbox caches after interrupted Kotlin compiles.
# Cursor may set GRADLE_USER_HOME to a sandbox path; do not inherit it. Override with GITA_GRADLE_USER_HOME if needed.
export GRADLE_USER_HOME="${GITA_GRADLE_USER_HOME:-$ROOT/.gradle-user-home}"
mkdir -p "$GRADLE_USER_HOME"
# Large local native build trees slow Expo/RN autolinking during settings.gradle.
rm -rf "$ROOT/modules/dharma-blocker/android/build" "$ROOT/modules/dharma-blocker/android/.gradle" 2>/dev/null || true
cd "$ROOT/android"
./gradlew --stop 2>/dev/null || true
exec ./gradlew \
  -Dkotlin.compiler.execution.strategy=in-process \
  :app:assembleRelease "$@"
