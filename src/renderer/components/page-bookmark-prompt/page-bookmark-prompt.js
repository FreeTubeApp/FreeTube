import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import { showToast } from '../../helpers/utils'

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
      bookmarkName: ''
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
      this.bookmarkName = this.pageBookmark?.bookmarkName ?? document.title
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
      this.removePageBookmark(this.page)
      showToast(this.$t('Page Bookmark.Removed page bookmark', { bookmarkName: this.bookmarkName }))
    },

    save: function () {
      const pageBookmark = {
        route: this.$router.currentRoute.fullPath,
        bookmarkName: this.bookmarkName
      }

      if (this.isBookmarkBeingCreated) {
        this.createPageBookmark(pageBookmark)
        showToast(this.$t('Page Bookmark.Created page bookmark', { bookmarkName: this.bookmarkName }))
      } else if (this.pageBookmark.bookmarkName !== pageBookmark.bookmarkName) {
        this.updatePageBookmark(pageBookmark)
        showToast(this.$t('Page Bookmark.Updated page bookmark', { bookmarkName: this.bookmarkName }))
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
