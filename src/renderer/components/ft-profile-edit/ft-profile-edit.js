import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import { MAIN_PROFILE_ID } from '../../../constants'

export default Vue.extend({
  name: 'FtProfileEdit',
  components: {
    'ft-card': FtCard,
    'ft-prompt': FtPrompt,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-button': FtButton
  },
  props: {
    profile: {
      type: Object,
      required: true
    },
    isNew: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      showDeletePrompt: false,
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
    isMainProfile: function () {
      return this.profileId === MAIN_PROFILE_ID
    },
    colorValues: function () {
      return this.$store.getters.getColorValues
    },
    profileInitial: function () {
      return this?.profileName?.length > 0 ? Array.from(this.profileName)[0].toUpperCase() : ''
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    defaultProfile: function () {
      return this.$store.getters.getDefaultProfile
    },
    deletePromptLabel: function () {
      return `${this.$t('Profile.Are you sure you want to delete this profile?')} ${this.$t('Profile["All subscriptions will also be deleted."]')}`
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
  created: function () {
    this.profileId = this.$route.params.id
    this.profileName = this.profile.name
    this.profileBgColor = this.profile.bgColor
    this.profileTextColor = this.profile.textColor
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
          message: this.$t('Profile.Your profile name cannot be empty')
        })
        return
      }
      const profile = {
        name: this.profileName,
        bgColor: this.profileBgColor,
        textColor: this.profileTextColor,
        subscriptions: this.profile.subscriptions
      }

      if (!this.isNew) {
        profile._id = this.profileId
      }

      console.log(profile)

      if (this.isNew) {
        this.createProfile(profile)
        this.showToast({
          message: this.$t('Profile.Profile has been created')
        })
        this.$router.push({
          path: '/settings/profile/'
        })
      } else {
        this.updateProfile(profile)
        this.showToast({
          message: this.$t('Profile.Profile has been updated')
        })
      }
    },

    setDefaultProfile: function () {
      this.updateDefaultProfile(this.profileId)
      const message = this.$t('Profile.Your default profile has been set to $').replace('$', this.profileName)
      this.showToast({
        message: message
      })
    },

    deleteProfile: function () {
      if (this.activeProfile._id === this.profileId) {
        this.updateActiveProfile(MAIN_PROFILE_ID)
      }

      this.removeProfile(this.profileId)

      const message = this.$t('Profile.Removed $ from your profiles').replace('$', this.profileName)
      this.showToast({ message })

      if (this.defaultProfile === this.profileId) {
        this.updateDefaultProfile(MAIN_PROFILE_ID)
        this.showToast({
          message: this.$t('Profile.Your default profile has been changed to your primary profile')
        })
      }

      this.$router.push({
        path: '/settings/profile/'
      })
    },

    ...mapActions([
      'showToast',
      'createProfile',
      'updateProfile',
      'removeProfile',
      'updateDefaultProfile',
      'updateActiveProfile',
      'calculateColorLuminance'
    ])
  }
})
