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
