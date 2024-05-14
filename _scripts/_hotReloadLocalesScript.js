const websocket = new WebSocket('ws://localhost:9080/ws')

websocket.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'freetube-locale-update') {
    const i18n = document.getElementById('app').__vue__.$i18n

    for (const [locale, data] of message.data) {
      // Only update locale data if it was already loaded
      if (i18n.availableLocales.includes(locale)) {
        const localeData = JSON.parse(data)

        i18n.setLocaleMessage(locale, localeData)
      }
    }
  }
}
