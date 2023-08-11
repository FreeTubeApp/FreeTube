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
  }
})
