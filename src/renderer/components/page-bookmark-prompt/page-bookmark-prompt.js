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
    'ft-input': FtInput
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
    pageBookmarks: function () {
      return this.$store.getters.getPageBookmarks
    },
    duplicateNameCount: function () {
      const currentBookmarkAdjustment = this.name === this.pageBookmark?.name ? -1 : 0
      return currentBookmarkAdjustment + this.pageBookmarks.filter((pageBookmark) => pageBookmark.name === this.name).length
    },
    duplicateNameMessage: function () {
      return this.$tc('Page Bookmark["There is {count} other bookmark with the same name."]', this.duplicateNameCount, { count: this.duplicateNameCount })
    },
    pageBookmark: function () {
      return this.$store.getters.getPageBookmarkWithRoute(this.$router.currentRoute.fullPath)
    },
    title: function () {
      return this.isBookmarkBeingCreated ? this.$t('Page Bookmark.Create Bookmark') : this.$t('Page Bookmark.Edit Bookmark')
    }
  },
  mounted: function () {
    nextTick(() => {
      this.name = this.pageBookmark?.name ?? defaultBookmarkNameForRoute(this.$router.currentRoute)
      this.$refs.pageBookmarkNameInput?.focus()
    })
  },
  methods: {
    hide: function () {
      this.hidePageBookmarkPrompt()
    },

    removeBookmark: function () {
      const pageBookmark = this.pageBookmark
      this.removePageBookmark(pageBookmark._id)
      showToast(this.$t('Page Bookmark.Removed page bookmark', { name: pageBookmark.name }))
      this.hide()
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
