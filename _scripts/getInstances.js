const fs = require('fs/promises')
const invidiousApiUrl = 'https://api.invidious.io/instances.json'

fetch(invidiousApiUrl).then(e => e.json()).then(res => {
  const data = res.filter((instance) => {
    return !(instance[0].includes('.onion') ||
      instance[0].includes('.i2p') ||
      !instance[1].api)
  }).map((instance) => {
    return {
      url: instance[1].uri.replace(/\/$/, ''),
      cors: instance[1].cors
    }
  })
  fs.writeFile('././static/invidious-instances.json', JSON.stringify(data, null, 2))
})
