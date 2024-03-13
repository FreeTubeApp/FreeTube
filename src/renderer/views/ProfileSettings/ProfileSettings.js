import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
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
      isNewProfileOpen: false,
      openSettingsProfileId: null,
      openSettingsProfile: null
    }
  },
  computed: {
    ...mapGetters([
      'profileById'
    ]),
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    isMainProfile: function () {
      return this.openSettingsProfileId === MAIN_PROFILE_ID
    }
  },
  watch: {
    profileList: {
      handler: function () {
        this.openSettingsProfile = this.getProfileById(this.openSettingsProfileId)
      },
      deep: true
    }
  },
  methods: {
    openSettingsForNewProfile: function () {
      this.isNewProfileOpen = true
      const bgColor = getRandomColor().value
      const textColor = calculateColorLuminance(bgColor)
      this.openSettingsProfile = {
        name: '',
        bgColor: bgColor,
        textColor: textColor,
        subscriptions: []
      }
      this.openSettingsProfileId = -1
    },
    openSettingsForProfileWithId: function (profileId) {
      if (this.profileId === this.openSettingsProfileId) {
        return
      }
      this.isNewProfileOpen = false
      this.openSettingsProfileId = profileId
      this.openSettingsProfile = this.getProfileById(profileId)
    },
    getProfileById: function (profileId) {
      if (!profileId) {
        return null
      }

      return this.profileById(profileId)
    },
    handleNewProfileCreated: function () {
      this.isNewProfileOpen = false
      this.openSettingsProfile = null
      this.openSettingsProfileId = -1
    },
    handleProfileDeleted: function () {
      this.openSettingsProfile = null
      this.openSettingsProfileId = -1
    }
  }
})
