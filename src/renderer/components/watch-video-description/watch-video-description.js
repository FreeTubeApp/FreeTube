import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtTimestampCatcher from '../ft-timestamp-catcher/ft-timestamp-catcher.vue'
import autolinker from 'autolinker'

export default Vue.extend({
  name: 'WatchVideoDescription',
  components: {
    'ft-card': FtCard,
    'ft-timestamp-catcher': FtTimestampCatcher
  },
  props: {
    published: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    descriptionHtml: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      shownDescription: ''
    }
  },
  mounted: function () {
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
      descriptionText = descriptionText.replaceAll('target="_blank"', '')
      descriptionText = descriptionText.replaceAll(/\/redirect.+?(?=q=)/g, '')
      descriptionText = descriptionText.replaceAll('q=', '')
      descriptionText = descriptionText.replaceAll(/rel="nofollow\snoopener"/g, '')
      descriptionText = descriptionText.replaceAll(/class=.+?(?=")./g, '')
      descriptionText = descriptionText.replaceAll(/id=.+?(?=")./g, '')
      descriptionText = descriptionText.replaceAll(/data-target-new-window=.+?(?=")./g, '')
      descriptionText = descriptionText.replaceAll(/data-url=.+?(?=")./g, '')
      descriptionText = descriptionText.replaceAll(/data-sessionlink=.+?(?=")./g, '')
      descriptionText = descriptionText.replaceAll('&amp;', '&')
      descriptionText = descriptionText.replaceAll('%3A', ':')
      descriptionText = descriptionText.replaceAll('%2F', '/')
      descriptionText = descriptionText.replaceAll(/&v.+?(?=")/g, '')
      descriptionText = descriptionText.replaceAll(/&redirect-token.+?(?=")/g, '')
      descriptionText = descriptionText.replaceAll(/&redir_token.+?(?=")/g, '')
      descriptionText = descriptionText.replaceAll('href="/', 'href="https://www.youtube.com/')
      // TODO: Implement hashtag support
      descriptionText = descriptionText.replaceAll('href="/hashtag/', 'href="freetube://')
      descriptionText = descriptionText.replaceAll('yt.www.watch.player.seekTo', 'changeDuration')

      return descriptionText
    }
  }
})
