import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import GeneralSettings from '../../components/general-settings/general-settings.vue'
import ThemeSettings from '../../components/theme-settings/theme-settings.vue'
import PlayerSettings from '../../components/player-settings/player-settings.vue'
import SubscriptionSettings from '../../components/subscription-settings/subscription-settings.vue'
import PrivacySettings from '../../components/privacy-settings/privacy-settings.vue'
import DataSettings from '../../components/data-settings/data-settings.vue'
import DistractionSettings from '../../components/distraction-settings/distraction-settings.vue'
import ProxySettings from '../../components/proxy-settings/proxy-settings.vue'
import SponsorBlockSettings from '../../components/sponsor-block-settings/sponsor-block-settings.vue'

export default Vue.extend({
  name: 'Settings',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'general-settings': GeneralSettings,
    'theme-settings': ThemeSettings,
    'player-settings': PlayerSettings,
    'subscription-settings': SubscriptionSettings,
    'privacy-settings': PrivacySettings,
    'data-settings': DataSettings,
    'distraction-settings': DistractionSettings,
    'proxy-settings': ProxySettings,
    'sponsor-block-settings': SponsorBlockSettings
  }
})
