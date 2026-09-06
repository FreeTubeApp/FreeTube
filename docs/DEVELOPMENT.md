# Development workflow

## Prerequisites

- Node.js and `pnpm` compatible with the lockfile.
- JDK 17 for Android builds.
- Android SDK with API 36 and Android build tools 36.0.0.
- `adb` on `PATH` for Android installation, logs, and smoke tests.
- `ffmpeg` on `PATH` for 720p/15 fps Android screen recordings.

## JavaScript setup

```bash
pnpm install
```

Run Electron development mode:

```bash
pnpm dev
```

Run browser/PWA development mode:

```bash
pnpm dev:web
```

Run the main checks:

```bash
pnpm run lint
pnpm run lint-json
pnpm run lint-yml
pnpm run checkforbadtemplates
```

Useful host packaging commands:

```bash
pnpm run pack
pnpm run pack:web
```

Build Android packaging in Docker:

```bash
docker compose run --rm android-build bash -lc \
  'pnpm install --frozen-lockfile && \
   pnpm run pack:android:dev && \
   cd android && ./gradlew assembleDebug'
```

`pack:android:dev` creates the development web bundle in `android/app/src/main/assets/`. Run it in Docker after changing shared JavaScript and before installing the Android app.

## Android build and install

Build from repository root with documented Docker workflow:

```bash
docker compose run --rm android-build bash -lc \
  'pnpm install --frozen-lockfile && \
   pnpm run pack:android:dev && \
   cd android && ./gradlew assembleDebug'
```

Install the resulting APK from host with `adb` only after the required device checks. The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`. The Android application id is `io.freetubeapp.freetubeandroid`.

### Build reproducibility

Android builds are functionally reproducible with the documented Docker and toolchain workflow, but byte-for-byte APK reproducibility is not currently guaranteed. The generated `assets/web.js` output/source map can differ between equivalent builds. Do not commit generated build output; validate functional artifacts with `assembleDebug` and device smoke tests.

## Required physical test device

Android work must use the connected physical test phone whenever available. Android has main personal and work profiles; all Android interaction through `adb` must use the personal profile (`user 0`), never the work profile.

Before Android work or validation, run:

```bash
adb devices -l
adb get-state
adb shell am get-current-user
```

A physical phone must be present with state `device`, and `adb shell am get-current-user` must print `0`. If it is missing, unlock the phone, confirm the USB debugging authorization dialog, reconnect USB, and do not claim Android validation is complete until ADB is working. Switch to the personal profile before any `adb` install, launch, log collection, or test command.

Install and launch on the connected phone:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n io.freetubeapp.freetubeandroid/.MainActivity
```

Collect native and WebView logs when diagnosing Android behavior:

```bash
adb logcat -c
adb logcat -v brief
```

## Android smoke test

The repository includes a device-driven smoke test. Do not change phone-level Android display scale. Set scale only inside the development app through its `UI Scale` setting, which the smoke test normalizes to `100%`.

Before every smoke test run:

1. Use the phone's existing Android display scale without changing it.
2. Keep the phone unlocked for the `unlocked` suite.

```bash
adb devices -l
adb shell am get-current-user
_scripts/android-smoke-test.sh --serial ZY32KFTHMV --suite unlocked
```

The smoke script also checks that active Android user is the personal profile `0`, installs the APK for `user 0`, and records the run at 720p/15 fps as `screen.mp4`. It does not change Android system display scale. It returns `77` when `adb` or a device is unavailable. Its artifacts are written under ignored `tmp/android-smoke/`.

The smoke test can run a smaller test or suite when debugging:

```bash
_scripts/android-smoke-test.sh --test cold-start
_scripts/android-smoke-test.sh --suite locked
```

## Android manual test recording

Record manual tests at 720p/15 fps and press Ctrl-C when finished:

```bash
_scripts/android-screen-record.sh --serial ZY32KFTHMV
```

Recordings are written under ignored `tmp/android-screen-record/`. Use `--output PATH` to choose another file.

## Change workflow

1. Read `docs/ARCHITECTURE.md` and this file before changing code.
2. Inspect the nearest existing implementation and all callers before adding a new helper or platform branch.
3. For Android changes, check the required ADB device first and use the physical phone for validation.
4. Regenerate Android assets with `pnpm run pack:android:dev`; do not hand-edit generated bundle files.
5. Run the smallest relevant lint/build/smoke checks and report any check skipped because the device or environment was unavailable.
6. Keep generated output, local data, and logs out of commits.
