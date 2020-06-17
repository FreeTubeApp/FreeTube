import Vue from 'vue'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtButton from '../ft-button/ft-button.vue'

export default Vue.extend({
  name: 'FtShareButton',
  components: {
    'ft-icon-button': FtIconButton,
    'ft-button': FtButton
  }
})
