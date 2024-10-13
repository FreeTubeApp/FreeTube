import { defineComponent } from 'vue'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { KeyboardShortcuts } from '../../../constants'

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
      return this.$t('KeyboardShortcutTemplate', {
        label: this.$t('Feed.Refresh Feed', { subscriptionName: this.title }),
        shortcut: KeyboardShortcuts.FEED.REFRESH
      })
    }
  },
  methods: {
    click: function() {
      this.$emit('click')
    }
  }
})
