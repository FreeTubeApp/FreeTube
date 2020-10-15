const ModuleScraper = require('yt-comment-scraper')
const fs = require('fs')
let scraper = null
let currentSort = null
let currentVideoId = null
//fs.writeFileSync('D:/Workspace/textELEC.txt', 'hallololol')
process.on('message', (msg) => {
  if (msg === 'end') {
    process.exit(0)
  }
  if (msg.id !== currentVideoId || msg.sortNewest !== currentSort) {
    if (scraper !== null) {
      scraper.cleanupStatics()
    }
    currentSort = msg.sortNewest
    currentVideoId = msg.id
    scraper = new ModuleScraper(true, currentSort)
  }
  scraper.scrape_next_page_youtube_comments(currentVideoId).then((comments) => {
    process.send({ comments: JSON.stringify(comments), error: null })
  }).catch((error) => {
    process.send({ comments: null, error: error })
  })
})
