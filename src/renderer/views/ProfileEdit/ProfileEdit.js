import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtButton from '../../components/ft-button/ft-button.vue'

export default Vue.extend({
  name: 'ProfileEdit',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-prompt': FtPrompt,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-button': FtButton
  },
  data: function () {
    return {
      isLoading: false,
      showDeletePrompt: false,
      deletePromptLabel: '',
      isNew: false,
      profileId: '',
      profileName: '',
      profileBgColor: '',
      profileTextColor: '',
      profileSubscriptions: [],
      deletePromptValues: [
        'yes',
        'no'
      ]
    }
  },
  computed: {
    colorValues: function () {
      return this.$store.getters.getColorValues
    },
    profileInitial: function () {
      return this.profileName.slice(0, 1).toUpperCase()
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    defaultProfile: function () {
      return this.$store.getters.getDefaultProfile
    },
    deletePromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    }
  },
  watch: {
    profileBgColor: async function (val) {
      this.profileTextColor = await this.calculateColorLuminance(val)
    }
  },
  mounted: async function () {
    this.isLoading = true
    const profileType = this.$route.name

    this.deletePromptLabel = 'Are you sure you want to delete this profile?  All subscriptions in this profile will also be deleted.'

    if (profileType === 'newProfile') {
      this.isNew = true
      this.profileBgColor = await this.getRandomColor()
      this.isLoading = false
    } else {
      this.isNew = false
      this.profileId = this.$route.params.id
      console.log(this.profileId)
      console.log(this.$route.name)

      this.grabProfileInfo(this.profileId).then((profile) => {
        if (profile === null) {
          this.showToast({
            message: 'Profile could not be found'
          })
          this.$router.push({
            path: '/settings/profile/'
          })
        }
        this.profileName = profile.name
        this.profileBgColor = profile.bgColor
        this.profileTextColor = profile.textColor
        this.profileSubscriptions = profile.subscriptions
        this.isLoading = false
      })
    }
  },
  methods: {
    openDeletePrompt: function () {
      this.showDeletePrompt = true
    },

    handleDeletePrompt: function (response) {
      if (response === 'yes') {
        this.deleteProfile()
      } else {
        this.showDeletePrompt = false
      }
    },

    saveProfile: function () {
      if (this.profileName === '') {
        this.showToast({
          message: 'Your profile name cannot be empty'
        })
        return
      }
      const profile = {
        name: this.profileName,
        bgColor: this.profileBgColor,
        textColor: this.profileTextColor,
        subscriptions: this.profileSubscriptions
      }

      if (!this.isNew) {
        profile._id = this.profileId
      }

      console.log(profile)

      this.updateProfile(profile)

      if (this.isNew) {
        this.showToast({
          message: 'Profile has been created'
        })
        this.$router.push({
          path: '/settings/profile/'
        })
      } else {
        this.showToast({
          message: 'Profile has been updated'
        })
      }
    },

    setDefaultProfile: function () {
      this.updateDefaultProfile(this.profileId)
      this.showToast({
        message: `Your default profile has been set to ${this.profileName}`
      })
    },

    deleteProfile: function () {
      this.removeProfile(this.profileId)
      this.showToast({
        message: `Removed ${this.profileName} from your profiles`
      })
      if (this.defaultProfile === this.profileId) {
        this.updateDefaultProfile('allChannels')
        this.showToast({
          message: 'Your default profile has been set your Primary profile'
        })
      }
      if (this.activeProfile._id === this.profileId) {
        this.updateActiveProfile('allChannels')
      }
      this.$router.push({
        path: '/settings/profile/'
      })
    },

    ...mapActions([
      'showToast',
      'grabProfileInfo',
      'updateProfile',
      'removeProfile',
      'updateDefaultProfile',
      'updateActiveProfile',
      'calculateColorLuminance',
      'getRandomColor'
    ])
  }
})
