# Repository architecture

FreeTubeAndroid is a FreeTube web application packaged in multiple runtimes:

- Electron desktop app.
- Browser/PWA build.
- Android application with a native `WebView` wrapper.

The product logic is mostly shared JavaScript. Android-specific behavior is exposed through a small Kotlin bridge.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/renderer/` | Vue UI, router, Vuex store, helpers, themes, localization |
| `src/main/` | Electron main-process integrations, external player, image cache, runtime utilities |
| `src/preload/` | Electron preload API and renderer/main boundary |
| `src/datastores/` | Persistence handlers for Electron and Web/PWA runtimes |
| `src/constants.js` | Shared application constants |
| `src/index.ejs` | Desktop HTML entry template |
| `static/` | Runtime static files and instance/config data |
| `_scripts/` | Webpack configs, development runner, packaging and data-generation scripts |
| `android/app/src/main/java/` | Native Android activity and JavaScript bridge |
| `android/app/src/main/assets/` | Generated Android web bundle and packaged static assets |
| `android/app/src/main/res/` | Android resources and activity layout |
| `android/` | Gradle Android project |
| `dist/` | Generated desktop/web bundles, never edit manually |

## Runtime boundaries

### Renderer

Use `src/renderer/` for product UI and shared browser-compatible behavior. Keep platform-specific calls behind the existing runtime interfaces and datastore handlers.

### Electron

Use `src/main/` for privileged desktop operations. Expose new renderer capabilities through `src/preload/`; do not bypass the preload boundary from Vue code.

### Android

`MainActivity.kt` creates a `WebView`, loads `file:///android_asset/index.html`, and installs `AndroidBridge` as the JavaScript interface named `Android`. The Kotlin layer handles Android capabilities such as file pickers, media controls, notifications, screen state, and WebView helpers.

The Android web bundle is produced by `_scripts/webpack.android.config.js` into `android/app/src/main/assets/`. Files in that directory are generated except for native resources and committed source assets explicitly required by the Android project. Rebuild the bundle instead of editing generated `index.html`, `web.js`, or generated static files by hand.

### Data storage

`src/datastores/handlers/index.js` selects a runtime handler. Electron and Web/PWA have separate handlers. Android uses the Web-compatible path plus native bridge support for app-local files and Android document providers.

## Change routing

- UI, views, components, styles: `src/renderer/`.
- Navigation: `src/renderer/router/`.
- Shared renderer state: `src/renderer/store/`.
- API/domain helpers: `src/renderer/helpers/` or the closest existing module.
- Electron privileged behavior: `src/main/` and `src/preload/`.
- Persistence behavior: `src/datastores/`.
- Android lifecycle, intents, WebView, or system integration: `android/app/src/main/java/`.
- Android build or asset generation: `android/app/build.gradle.kts` and `_scripts/webpack.android.config.js`.
- Build or development behavior: `_scripts/` and `package.json`.

Before adding code, search for all callers and existing runtime-specific implementations. Prefer the existing interface over a new platform branch.

## Important constraints

- Support both built-in/Local API and Invidious API where feature behavior touches data loading.
- Preserve privacy behavior. Do not add tracking, cookies, or official YouTube API calls without an explicit architectural decision.
- Keep Android bridge methods narrow. A JavaScript-exposed method is a trust boundary between bundled web code and native code.
- Treat `android/app/src/main/assets/` generated output as build artifacts unless a file is clearly source-owned.
