# Repository Instructions

## Before changes

For Android, build, runtime, or packaging work, read `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md` first.

## Checks and builds

Host checks use `pnpm@11`:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run lint-json
pnpm run lint-yml
pnpm run checkforbadtemplates
```

Android packaging/build uses Docker only. Do not use host Android tooling or host `pnpm` for it:

```bash
docker compose run --rm android-build bash -lc \
  'pnpm install --frozen-lockfile && pnpm run pack:android:core && \
   cd android && ./gradlew assembleDebug'
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Host `adb` is for device installation/tests only.

## Android device rules

Before every ADB command, require a physical device with state `device` and user `0`:

```bash
adb devices -l
adb get-state
adb shell am get-current-user
```

Use explicit `--user 0` for install/start/stop/grant. Never use or switch to work profile `10` or `/data/user/10/`. Test only `io.freetubeapp.freetubeandroid` unless explicitly approved. Never change system density, scale, resolution, font scale, or display settings. App `UI Scale` is allowed only for documented FreeTube smoke normalization.

## Files and architecture

- Never hand-edit generated `dist/` or `android/app/src/main/assets/`; regenerate them.
- Keep generated output, local data, logs, screenshots, recordings, and `docs/plans/` out of commits.
- UI belongs in `src/renderer/`; Android lifecycle/bridge in `android/app/src/main/java/`. Preserve Electron/PWA/Android boundaries.
- Read callers before adding helpers/branches, reuse existing interfaces, and keep JS-exposed bridge methods narrow.

## Git workflow

- Direct commits and force pushes to `development` are allowed for repository-owner-approved maintenance changes.
- Preserve Conventional Commits and coordinate force pushes with active contributors.
- Do not use direct commits or pushes for development changes.
- Start each change from current `development` in a separate feature branch.
- Push feature branch and merge only through a PR targeting `development`.
- Use GitHub `Squash and merge`; do not use merge commits or rebase merge.
- Use Conventional Commits: `<type>[optional scope]: <description>`.
