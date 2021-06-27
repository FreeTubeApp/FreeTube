import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-button': FtButton,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox
  },
  computed: {
    hideComments: function () {
      return this.$store.getters.getHideComments
    },
    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
    },
    hideShare: function() {
      return this.$store.getters.getHideShare
    },
    hideUnsubscribe: function() {
      return this.$store.getters.getHideUnsubscribe
    },
    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
    }
  },
  methods: {
    ...mapActions([
      'updateHideComments',
      'updateHideLiveStreams',
      'updateHideShare',
      'updateHideUnsubscribe',
      'updateShowFamilyFriendlyOnly'
    ])
  }
})
