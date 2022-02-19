import Vue from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'ChannelBlockerSettingsList',
  components: {
    'ft-flex-box': FtFlexBox
  },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  methods: {
    handleIconClick: function (_id) {
      this.$emit('cbRemoveChannel', _id)
    }
  }
})
