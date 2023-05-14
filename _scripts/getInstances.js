const fs = require('fs/promises')
const invidiousApiUrl = 'https://api.invidious.io/instances.json'

fetch(invidiousApiUrl).then(e => e.json()).then(res => {
  const data = res.filter((instance) => {
    return !(instance[0].includes('.onion') ||
      instance[0].includes('.i2p') ||
      !instance[1].api ||
      (!process.env.IS_ELECTRON && !instance[1].cors))
  }).map((instance) => {
    return instance[1].uri.replace(/\/$/, '')
  })
  fs.writeFile('././static/invidious-instances.json', JSON.stringify(data, null, 2))
})
