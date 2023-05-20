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

const pipedApiUrl = 'https://piped-instances.kavin.rocks/'

fetch(pipedApiUrl).then(e => e.json()).then(res => {
  const data = res.map(e => e.api_url)
  fs.writeFile('././static/piped-instances.json', JSON.stringify(data, null, 2))
})

const pipedApiUrl = 'https://piped-instances.kavin.rocks/'

fetch(pipedApiUrl).then(e => e.json()).then(res => {
  const data = res.map(e => e.api_url)
  fs.writeFile('././static/piped-instances.json', JSON.stringify(data, null, 2))
})
