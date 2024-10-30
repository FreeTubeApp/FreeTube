<template>
  <div>
    <div
      v-for="(shelf, index) in shelves"
      :key="index"
    >
      <details>
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
                path: `/playlist/${shelf.playlistId}`,
                query: searchSettings
              }"
            >
              <FontAwesomeIcon
                class="thumbnail"
                :icon="['fas', 'play']"
              />
              {{ $t('Channel.Home.Play all') }}
            </router-link>
          </span>
          <hr class="shelfUnderline">
        </summary>
        <FtElementList
          :data="shelf.content"
          :use-channels-hidden-preference="false"
          :display="shelf.isCommunity ? 'list' : null"
        />
      </details>
    </div>
  </div>
</template>

<script setup>
import FtElementList from '../../components/FtElementList/FtElementList.vue'

defineProps({
  shelves: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped src="./ChannelHome.css" />
