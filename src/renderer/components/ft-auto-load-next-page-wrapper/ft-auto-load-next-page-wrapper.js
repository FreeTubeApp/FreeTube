import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtAutoLoadNextPageWrapper',
  emits: ['load-next-page'],
  computed: {
    generalAutoLoadMorePaginatedItemsEnabled() {
      return this.$store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
    },
    observeVisibilityOptions() {
      if (!this.generalAutoLoadMorePaginatedItemsEnabled) { return false }

      return {
        callback: (isVisible, _entry) => {
          // This is also fired when **hidden**
          // No point doing anything if not visible
          if (!isVisible) { return }

          this.$emit('load-next-page')
        },
        intersection: {
          // Only when it intersects with N% above bottom
          rootMargin: '0% 0% 0% 0%',
        },
        // Callback responsible for loading multiple pages
        once: false,
      }
    },

  },
})
