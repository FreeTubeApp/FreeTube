import { defineComponent } from 'vue'
import { formatNumber } from '../../helpers/utils'

export default defineComponent({
  name: 'FtCommunityPoll',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data: function () {
    return {
      revealAnswer: false
    }
  },
  computed: {
    formattedVotes: function () {
      return formatNumber(this.data.totalVotes)
    },
  },
  methods: {
    // Use smallest as it's resized to 125px anyways and they're usually all larger than that
    findSmallestPollImage: function (images) {
      return images.reduce((prev, img) => (img.height < prev.height) ? img : prev, images[0]).url
    }
  }
})
