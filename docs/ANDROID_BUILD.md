# Android build

Android build uses Docker for Node.js, pnpm, JDK, and Android SDK. Host `adb` is only needed for device installation and tests.

## Build

```bash
docker compose build android-build
docker compose run --rm android-build bash -lc \
  'pnpm install --frozen-lockfile && \
   pnpm run pack:android:dev && \
   cd android && ./gradlew assembleDebug'
```

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Gradle and pnpm stores use Docker named volumes. The repository and generated Android assets are bind-mounted into `/workspace`; generated output is ignored by Git.

## Install on device

Keep `adb` on host. Use host `pnpm` only for JavaScript/static checks; Android packaging and Gradle builds stay in Docker:

```bash
adb devices -l
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

A connected device is not required to build the APK. Device validation must be reported separately when no device is available.

## Toolchain

The image currently provides:

- Node.js 24;
- pnpm 11.3.0;
- JDK 17;
- Android platform 36;
- Android build tools 36.0.0.

These versions match current Android project configuration. Change them together with `android/app/build.gradle.kts`, not independently.
