<template>
  <div>
    <div
      v-for="(shelf, index) in filteredShelves"
      :key="index"
    >
      <details
        open
      >
        <summary
          class="shelfTitle"
        >
          {{ shelf.title }}
          <span
            v-if="shelf.playlistId"
            class="playAllSpan"
          >
            <router-link
              class="playAllLink"
              :to="{
                path: `/playlist/${shelf.playlistId}`
              }"
            >
              <FontAwesomeIcon
                class="thumbnail"
                :icon="['fas', 'list']"
              />
              {{ $t('Channel.Home.View Playlist') }}
            </router-link>
          </span>
          <hr class="shelfUnderline">
        </summary>
        <p
          v-if="shelf.subtitle"
          class="shelfSubtitle"
        >
          {{ shelf.subtitle }}
        </p>
        <FtElementList
          :data="shelf.content"
          :use-channels-hidden-preference="false"
          :display="shelf.isCommunity ? 'list' : ''"
        />
      </details>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'
import FtElementList from '../FtElementList/FtElementList.vue'
import store from '../../store/index'

const props = defineProps({
  shelves: {
    type: Array,
    default: () => []
  }
})

/** @type {import('vue').ComputedRef<bool>} */
const hideFeaturedChannels = computed(() => {
  return store.getters.getHideFeaturedChannels
})

const filteredShelves = computed(() => {
  let shelves = props.shelves
  if (hideFeaturedChannels.value) {
    shelves = shelves.filter(shelf => shelf.content[0].type !== 'channel')
  }

  return shelves.filter(shelf => shelf.content.length > 0)
})
</script>

<style scoped src="./ChannelHome.css" />
