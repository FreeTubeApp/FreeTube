import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtProfileBubble from '../../components/ft-profile-bubble/ft-profile-bubble.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtProfileEdit from '../../components/ft-profile-edit/ft-profile-edit.vue'
import FtProfileChannelList from '../../components/ft-profile-channel-list/ft-profile-channel-list.vue'
import FtProfileFilterChannelsList from '../../components/ft-profile-filter-channels-list/ft-profile-filter-channels-list.vue'
import { calculateColorLuminance, getRandomColor } from '../../helpers/colors'
import { MAIN_PROFILE_ID } from '../../../constants'

export default defineComponent({
  name: 'ProfileSettings',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-profile-bubble': FtProfileBubble,
    'ft-button': FtButton,
    'ft-loader': FtLoader,
    'ft-profile-edit': FtProfileEdit,
    'ft-profile-channel-list': FtProfileChannelList,
    'ft-profile-filter-channels-list': FtProfileFilterChannelsList
  },
  data: function () {
    return {
      isOpenProfileNew: false,
      openSettingsProfile: null
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    isMainProfile: function () {
      return this.profileId === MAIN_PROFILE_ID
    }
  },
  methods: {
    newProfile: function () {
      this.$router.push({
        path: '/settings/profile/new/'
      })
    },
    openSettingsForNewProfile: function () {
      if (this.isOpenProfileNew) {
        return
      }
      this.isOpenProfileNew = true
      const bgColor = getRandomColor()
      const textColor = calculateColorLuminance(bgColor)
      this.openSettingsProfile = {
        name: '',
        bgColor: bgColor,
        textColor: textColor,
        subscriptions: []
      }
    },
    openSettingsForProfile: function (profile) {
      this.isOpenProfileNew = false
      this.openSettingsProfile = profile
    }
  }
})
