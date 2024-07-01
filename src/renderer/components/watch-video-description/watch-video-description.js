import { defineComponent } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtTimestampCatcher from '../ft-timestamp-catcher/ft-timestamp-catcher.vue'
import autolinker from 'autolinker'

export default defineComponent({
  name: 'WatchVideoDescription',
  components: {
    'ft-card': FtCard,
    'ft-timestamp-catcher': FtTimestampCatcher
  },
  props: {
    description: {
      type: String,
      required: true
    },
    descriptionHtml: {
      type: String,
      default: ''
    }
  },
  emits: ['timestamp-event'],
  data: function () {
    return {
      shownDescription: ''
    }
  },
  created: function () {
    if (this.descriptionHtml !== '') {
      const parsed = this.parseDescriptionHtml(this.descriptionHtml)

      // the invidious API returns emtpy html elements when the description is empty
      // so we need to parse it to see if there is any meaningful text in the html
      // or if it's just empty html elements e.g. `<p></p>`

      const testDiv = document.createElement('div')
      testDiv.innerHTML = parsed

      if (!/^\s*$/.test(testDiv.innerText)) {
        this.shownDescription = parsed
      }
    } else {
      if (!/^\s*$/.test(this.description)) {
        this.shownDescription = autolinker.link(this.description)
      }
    }
  },
  methods: {
    onTimestamp: function(timestamp) {
      this.$emit('timestamp-event', timestamp)
    },
    parseDescriptionHtml: function (descriptionText) {
      return descriptionText
        .replaceAll('target="_blank"', '')
        .replaceAll(/\/redirect.+?(?=q=)/g, '')
        .replaceAll('q=', '')
        .replaceAll(/rel="nofollow\snoopener"/g, '')
        .replaceAll(/class=.+?(?=")./g, '')
        .replaceAll(/id=.+?(?=")./g, '')
        .replaceAll(/data-target-new-window=.+?(?=")./g, '')
        .replaceAll(/data-url=.+?(?=")./g, '')
        .replaceAll(/data-sessionlink=.+?(?=")./g, '')
        .replaceAll('&amp;', '&')
        .replaceAll('%3A', ':')
        .replaceAll('%2F', '/')
        .replaceAll(/&v.+?(?=")/g, '')
        .replaceAll(/&redirect-token.+?(?=")/g, '')
        .replaceAll(/&redir_token.+?(?=")/g, '')
        .replaceAll('href="/', 'href="https://www.youtube.com/')
        .replaceAll('href="/hashtag/', 'href="https://wwww.youtube.com/hashtag/')
        .replaceAll('yt.www.watch.player.seekTo', 'changeDuration')
    }
  }
})
