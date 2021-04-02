import Vue from 'vue'

export default Vue.extend({
  name: 'FtListVideo',
  props: {
    data: {
      type: Object,
      required: true
    },
    appearance: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      playlistLink: '',
      channelLink: '',
      title: 'Pop Music Playlist - Timeless Pop Songs (Updated Weekly 2020)',
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
      channelName: '#RedMusic: Just Hits',
      videoCount: 200,
      description: '',
      verified: ''
    }
  },
  computed: {
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    playlistId: function () {
      return this.playlistLink.replace(
        'https://www.youtube.com/playlist?list=',
        ''
      )
    },

    channelId: function () {
      let id = this.channelLink.replace('https://www.youtube.com/user/', '')
      id = id.replace('https://www.youtube.com/channel/', '')
      return id
    }
  },
  mounted: function () {
    if (typeof this.data.owner === 'object') {
      this.parseLocalData()
    } else {
      this.parseInvidiousData()
    }
  },
  methods: {
    parseInvidiousData: function () {
      this.title = this.data.title
      this.thumbnail = this.data.playlistThumbnail
        .replace('https://i.ytimg.com', this.invidiousInstance)
        .replace('hqdefault', 'mqdefault')
      this.channelName = this.data.author
      this.verified = false
      this.channelLink = this.data.authorUrl
      this.playlistLink = this.data.playlistId
      this.videoCount = this.data.videoCount

      if (this.data.proxyThumbnail === false) {
        this.thumbnail = this.data.playlistThumbnail
      }
    },

    parseLocalData: function () {
      this.title = this.data.title
      this.thumbnail = this.data.firstVideo.bestThumbnail.url
      this.channelName = this.data.owner.name
      this.verified = this.data.owner.verified
      this.channelLink = this.data.owner.url
      this.playlistLink = this.data.url
      this.videoCount = this.data.length
    }
  }
})
