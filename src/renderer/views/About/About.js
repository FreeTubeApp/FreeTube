import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

const { version } = require('../../../../package.json')

export default Vue.extend({
  name: 'About',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      versionNumber: `v${version}`,
      chunks: [
        {
          icon: ['fab', 'github'],
          title: 'Source code',
          content: '<a href="https://github.com/FreeTubeApp/FreeTube">GitHub: FreeTubeApp/FreeTube</a><br>Licensed under the AGPL 3'
        },
        {
          icon: 'file-download',
          title: 'Downloads',
          content: '<a href="https://github.com/FreeTubeApp/FreeTube/releases">GitHub releases</a>'
        },
        {
          icon: 'question-circle',
          title: 'Help',
          content: '<a href="https://github.com/FreeTubeApp/FreeTube/wiki">FreeTube Wiki</a> / <a href="https://github.com/FreeTubeApp/FreeTube/wiki/F.A.Q.">FAQ</a>'
        },
        {
          icon: 'exclamation-circle',
          title: 'Report a problem',
          content: '<a href="https://github.com/FreeTubeApp/FreeTube/issues">GitHub issues</a><br>Please check for duplicates before posting'
        },
        {
          icon: 'globe',
          title: 'Website',
          content: '<a href="https://freetubeapp.io/">https://freetubeapp.io/</a>'
        },
        {
          icon: 'newspaper',
          title: 'Blog',
          content: '<a href="https://freetube.writeas.com/">https://freetube.writeas.com/</a>'
        },
        {
          icon: 'envelope',
          title: 'Email',
          content: '<a href="mailto:FreeTubeApp@protonmail.com">FreeTubeApp@protonmail.com</a>'
        },
        {
          icon: ['fab', 'mastodon'],
          title: 'Mastodon',
          content: '<a href="https://mastodon.technology/@FreeTube">@FreeTube@mastodon.technology</a>'
        },
        {
          icon: 'comment-dots',
          title: 'Chat on Matrix',
          content: '<a href="https://matrix.to/#/#freetube:matrix.org?via=matrix.org&via=privacytools.io&via=tchncs.de">#freetube:matrix.org</a><br>Please read the <a href="https://github.com/FreeTubeApp/FreeTube/wiki/Matrix-Channel-Info-&-Rules">room rules.</a>'
        },
        {
          icon: 'users',
          title: 'Credits',
          content: 'FreeTube is made possible by <a href="https://github.com/FreeTubeApp/FreeTube/wiki/Credits">these people and projects.</a>'
        },
        {
          icon: 'heart',
          title: 'Donate - Liberapay',
          content: '<a href="https://liberapay.com/FreeTube">https://liberapay.com/FreeTube</a>'
        },
        {
          icon: ['fab', 'bitcoin'],
          title: 'Donate - BTC',
          content: '<a href="bitcoin:1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS">1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS</a>'
        }
      ]
    }
  },
  mounted: function () {
  }
})
