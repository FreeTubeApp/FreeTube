import { defineComponent } from 'vue'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { KeyboardShortcuts } from '../../../constants'
import { addKeyboardShortcutToActionLabel } from '../../helpers/utils'

export default defineComponent({
  name: 'FtRefreshWidget',
  components: {
    'ft-icon-button': FtIconButton,
  },
  props: {
    disableRefresh: {
      type: Boolean,
      default: false
    },
    lastRefreshTimestamp: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['click'],
  computed: {
    refreshFeedButtonTitle: function() {
      return addKeyboardShortcutToActionLabel(
        this.$t('Feed.Refresh Feed', { subscriptionName: this.title }),
        KeyboardShortcuts.FEED.REFRESH
      )
    }
  },
  methods: {
    click: function() {
      this.$emit('click')
    }
  }
})
