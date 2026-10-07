// Registers the FreeTube PWA service worker (see pwa/sw.js)
// and reloads the page once a new version of the app took over.

if ('serviceWorker' in navigator && window.isSecureContext) {
  // Only reload on updates, not when the service worker gets installed for the first time
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) {
      reloading = true
      window.location.reload()
    }
  })

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('sw.js', { scope: './' })

      // Installed PWAs often stay open for a long time, so check for updates whenever the app is shown again
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {})
        }
      })
    } catch (error) {
      console.error('Service worker registration failed', error)
    }
  })
}
