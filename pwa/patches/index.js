// Fixes and adjustments of upstream code for the PWA, applied at build time by replace-loader.js.
// If upstream changes the patched code, the build shows a warning.

module.exports = [
  {
    name: 'relative-invidious-baseurl',
    // Invidious companion returns relative BaseURLs in DASH manifests (e.g. "/companion/videoplayback?..."),
    // repairInvidiousManifest() passes them to `new URL()` without a base. That throws "Invalid URL"
    // and FreeTube falls back to the legacy formats (360p). The URL is only used to read its search parameters,
    // so any base works. Worth fixing upstream, this patch can be removed afterwards.
    file: 'src/renderer/helpers/player/utils.js',
    search: "new URL(baseUrl.replaceAll('&amp;', '&'))",
    replace: "new URL(baseUrl.replaceAll('&amp;', '&'), 'https://invidious.invalid')",
  },
  {
    name: 'default-invidious-instance',
    // Use the Invidious instance configured on the server (pwa-config.js) as the default,
    // instead of a random public instance. Users can still pick another one in the settings.
    file: 'src/renderer/store/modules/settings.js',
    search: "defaultInvidiousInstance: '',",
    replace: "defaultInvidiousInstance: globalThis.ftPwaConfig?.defaultInvidiousInstance ?? '',",
  },
]
