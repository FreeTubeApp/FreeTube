import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtProfileBubble from '../../components/ft-profile-bubble/ft-profile-bubble.vue'
import FtButton from '../../components/ft-button/ft-button.vue'

export default defineComponent({
  name: 'ProfileSettings',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-profile-bubble': FtProfileBubble,
    'ft-button': FtButton
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    }
  },
  methods: {
    newProfile: function () {
      this.$router.push({
        path: '/settings/profile/new/'
      })
    }
  }
})
