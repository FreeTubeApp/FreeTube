import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import { MAIN_PROFILE_ID } from '../../../constants'
import { calculateColorLuminance, colors } from '../../helpers/colors'
import { showToast } from '../../helpers/utils'
import { getFirstCharacter } from '../../helpers/strings'

export default defineComponent({
  name: 'FtProfileEdit',
  components: {
    'ft-card': FtCard,
    'ft-prompt': FtPrompt,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-button': FtButton
  },
  props: {
    isMainProfile: {
      type: Boolean,
      required: true
    },
    isNew: {
      type: Boolean,
      required: true
    },
    profile: {
      type: Object,
      required: true
    }
  },
  emits: ['new-profile-created', 'profile-deleted'],
  data: function () {
    return {
      showDeletePrompt: false,
      profileId: '',
      profileName: '',
      profileBgColor: '',
      profileTextColor: '',
      deletePromptValues: [
        'delete',
        'cancel'
      ]
    }
  },
  computed: {
    locale: function () {
      return this.$i18n.locale
    },
    colorValues: function () {
      return colors.map(color => color.value)
    },
    profileInitial: function () {
      return this.profileName
        ? getFirstCharacter(this.translatedProfileName, this.locale).toUpperCase()
        : ''
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
        this.$t('Yes, Delete'),
        this.$t('Cancel')
      ]
    },
    editOrCreateProfileLabel: function () {
      return this.isNew ? this.$t('Profile.Create Profile') : this.$t('Profile.Edit Profile')
    },
    editOrCreateProfileNameLabel: function () {
      return this.isNew ? this.$t('Profile.Create Profile Name') : this.$t('Profile.Edit Profile Name')
    },
    translatedProfileName: function () {
      return this.isMainProfile ? this.$t('Profile.All Channels') : this.profileName
    }
  },
  watch: {
    profileBgColor: function (val) {
      this.profileTextColor = calculateColorLuminance(val)
    }
  },
  created: function () {
    this.profileId = this.profile._id
    this.profileName = this.profile.name
    this.profileBgColor = this.profile.bgColor
    this.profileTextColor = this.profile.textColor
  },
  methods: {
    openDeletePrompt: function () {
      this.showDeletePrompt = true
    },

    handleDeletePrompt: function (response) {
      if (response === 'delete') {
        this.deleteProfile()
      } else {
        this.showDeletePrompt = false
      }
    },

    saveProfile: function () {
      if (this.profileName === '') {
        showToast(this.$t('Profile.Your profile name cannot be empty'))
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

      if (this.isNew) {
        this.createProfile(profile)
        showToast(this.$t('Profile.Profile has been created'))
        this.$emit('new-profile-created')
      } else {
        this.updateProfile(profile)
        showToast(this.$t('Profile.Profile has been updated'))
      }
    },

    setDefaultProfile: function () {
      this.updateDefaultProfile(this.profileId)
      const message = this.$t('Profile.Your default profile has been set to {profile}', { profile: this.translatedProfileName })
      showToast(message)
    },

    deleteProfile: function () {
      if (this.activeProfile._id === this.profileId) {
        this.updateActiveProfile(MAIN_PROFILE_ID)
      }

      this.removeProfile(this.profileId)

      const message = this.$t('Profile.Removed {profile} from your profiles', { profile: this.translatedProfileName })
      showToast(message)

      if (this.defaultProfile === this.profileId) {
        this.updateDefaultProfile(MAIN_PROFILE_ID)
        showToast(this.$t('Profile.Your default profile has been changed to your primary profile'))
      }

      this.$emit('profile-deleted')
    },

    ...mapActions([
      'createProfile',
      'updateProfile',
      'removeProfile',
      'updateDefaultProfile',
      'updateActiveProfile'
    ])
  }
})
