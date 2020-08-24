import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtButton from '../../components/ft-button/ft-button.vue'

export default Vue.extend({
  name: 'ProfileEdit',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-button': FtButton
  },
  data: function () {
    return {
      isLoading: false,
      isNew: false,
      profileId: '',
      profileName: '',
      profileBgColor: '',
      profileTextColor: '',
      profileSubscriptions: []
    }
  },
  computed: {
    colorValues: function () {
      return this.$store.getters.getColorValues
    },
    profileInitial: function () {
      return this.profileName.slice(0, 1).toUpperCase()
    }
  },
  watch: {
    profileBgColor: async function (val) {
      this.profileTextColor = await this.calculateColorLuminance(val)
    }
  },
  mounted: function () {
    this.isLoading = true
    const profileType = this.$route.name

    if (profileType === 'newProfile') {
      this.isNew = true
    } else {
      this.isNew = false
      this.profileId = this.$route.params.id
      console.log(this.profileId)
      console.log(this.$route.name)

      this.grabProfileInfo(this.profileId).then((profile) => {
        console.log(profile)
        this.profileName = profile.name
        this.profileBgColor = profile.bgColor
        this.profileTextColor = profile.textColor
        this.profileSubscriptions = profile.subscriptions
        this.isLoading = false
      })
    }
  },
  methods: {
    saveProfile: function () {
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
      this.showToast({
        message: 'Profile has been updated'
      })
    },

    ...mapActions([
      'showToast',
      'grabProfileInfo',
      'updateProfile',
      'calculateColorLuminance'
    ])
  }
})
