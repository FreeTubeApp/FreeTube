import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import { showToast } from '../../helpers/utils'
import { defaultBookmarkNameForRoute } from '../../helpers/strings'

export default defineComponent({
  name: 'PageBookmarkPrompt',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'ft-input': FtInput,
  },
  data: function () {
    return {
      name: ''
    }
  },
  computed: {
    isBookmarkBeingCreated: function () {
      return this.pageBookmark == null
    },
    pageBookmark: function () {
      return this.$store.getters.getPageBookmarkWithRoute(this.$router.currentRoute.fullPath)
    },
    title: function () {
      return this.isBookmarkBeingCreated ? this.$t('Page Bookmark.Create Bookmark') : this.$t('Page Bookmark.Edit Bookmark')
    },
    cancelLabel: function () {
      return this.isBookmarkBeingCreated ? this.$t('Cancel') : this.$t('Page Bookmark.Remove Bookmark')
    }
  },
  mounted: function () {
    nextTick(() => {
      this.name = this.pageBookmark?.name ?? defaultBookmarkNameForRoute(this.$router.currentRoute)
      this.lastActiveElement = document.activeElement
      this.$refs.pageBookmarkNameInput.focus()
    })
  },
  beforeDestroy() {
    nextTick(() => this.lastActiveElement?.focus())
  },
  methods: {
    hide: function () {
      this.hidePageBookmarkPrompt()
    },

    cancelAction: function () {
      if (!this.isBookmarkBeingCreated) {
        this.removeBookmark()
      }
      this.hide()
    },

    removeBookmark: function () {
      this.removePageBookmark(this.pageBookmark)
      showToast(this.$t('Page Bookmark.Removed page bookmark', { name: this.name }))
    },

    save: function () {
      const pageBookmark = {
        route: this.$router.currentRoute.fullPath,
        name: this.name,
        isBookmark: true
      }

      if (this.isBookmarkBeingCreated) {
        this.createPageBookmark(pageBookmark)
        showToast(this.$t('Page Bookmark.Created page bookmark', { name: this.name }))
      } else if (this.pageBookmark.name !== pageBookmark.name) {
        this.updatePageBookmark(pageBookmark)
        showToast(this.$t('Page Bookmark.Updated page bookmark', { name: this.name }))
      }

      this.hide()
    },

    ...mapActions([
      'hidePageBookmarkPrompt',
      'createPageBookmark',
      'removePageBookmark',
      'updatePageBookmark'
    ])
  }
})
