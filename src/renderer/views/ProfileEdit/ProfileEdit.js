import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtProfileEdit from '../../components/ft-profile-edit/ft-profile-edit.vue'
import FtProfileChannelList from '../../components/ft-profile-channel-list/ft-profile-channel-list.vue'
import FtProfileFilterChannelsList from '../../components/ft-profile-filter-channels-list/ft-profile-filter-channels-list.vue'

export default Vue.extend({
  name: 'ProfileEdit',
  components: {
    'ft-loader': FtLoader,
    'ft-profile-edit': FtProfileEdit,
    'ft-profile-channel-list': FtProfileChannelList,
    'ft-profile-filter-channels-list': FtProfileFilterChannelsList
  },
  data: function () {
    document.title = `${this.$t(this.$route.meta.title)} - ${process.env.PRODUCT_NAME}`
    return {
      isLoading: false,
      isNew: false,
      profileId: '',
      profile: {}
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    isMainProfile: function () {
      return this.profileId === 'allChannels'
    }
  },
  watch: {
    profileList: {
      handler: function () {
        this.grabProfileInfo(this.profileId).then((profile) => {
          if (profile === null) {
            this.showToast({
              message: this.$t('Profile.Profile could not be found')
            })
            this.$router.push({
              path: '/settings/profile/'
            })
          }
          this.profile = profile
        })
      },
      deep: true
    }
  },
  mounted: async function () {
    this.isLoading = true
    const profileType = this.$route.name

    this.deletePromptLabel = `${this.$t('Profile.Are you sure you want to delete this profile?')} ${this.$t('Profile["All subscriptions will also be deleted."]')}`

    if (profileType === 'newProfile') {
      this.isNew = true
      const bgColor = await this.getRandomColor()
      const textColor = await this.calculateColorLuminance(bgColor)
      this.profile = {
        name: '',
        bgColor: bgColor,
        textColor: textColor,
        subscriptions: []
      }
      this.isLoading = false
    } else {
      this.isNew = false
      this.profileId = this.$route.params.id

      this.grabProfileInfo(this.profileId).then((profile) => {
        if (profile === null) {
          this.showToast({
            message: this.$t('Profile.Profile could not be found')
          })
          this.$router.push({
            path: '/settings/profile/'
          })
        }
        this.profile = profile
        this.isLoading = false
      })
    }
  },
  methods: {
    ...mapActions([
      'showToast',
      'grabProfileInfo',
      'getRandomColor',
      'calculateColorLuminance'
    ])
  }
})
