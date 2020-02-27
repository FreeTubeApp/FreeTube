import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import GeneralSettings from '../../components/general-settings/general-settings.vue'
import PlayerSettings from '../../components/player-settings/player-settings.vue'
import SubscriptionSettings from '../../components/subscription-settings/subscription-settings.vue'

export default Vue.extend({
  name: 'Settings',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'general-settings': GeneralSettings,
    'player-settings': PlayerSettings,
    'subscription-settings': SubscriptionSettings
  },
  mounted: function () {
  },
  methods: {
    handleToggleSwitch: function (event) {
      console.log(event)
    }
  }
})
