const fs = require('fs/promises')
const url = 'https://piped-instances.kavin.rocks/'

fetch(url).then(e => e.json()).then(res => {
  const data = res.map(e => e.api_url)
  fs.writeFile('././static/piped-instances.json', JSON.stringify(data, null, 2))
})
