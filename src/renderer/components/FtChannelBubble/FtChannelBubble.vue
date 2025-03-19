<template>
  <router-link
    v-if="!showSelected"
    class="bubblePadding"
    :aria-labelledby="id"
    :to="`/channel/${channelId}`"
  >
    <img
      v-if="channelThumbnail != null"
      class="bubble"
      :src="channelThumbnail"
      alt=""
    >
    <font-awesome-icon
      v-else
      :icon="['fas', 'circle-user']"
      class="bubble"
      fixed-width
    />
    <div
      :id="id"
      class="channelName"
    >
      {{ channelName }}
    </div>
  </router-link>
  <div
    v-else
    class="bubblePadding"
    role="button"
    tabindex="0"
    :aria-labelledby="id"
    @click="handleClick"
    @keydown.space.enter.prevent="handleClick($event)"
  >
    <img
      class="bubble"
      :src="channelThumbnail"
      alt=""
    >
    <div
      v-if="selected"
      class="bubble selected"
    >
      <font-awesome-icon
        :icon="['fas', 'check']"
        class="icon"
      />
    </div>
    <div
      :id="id"
      class="channelName"
    >
      {{ channelName }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useId } from '../../composables/use-id-polyfill'

const id = useId()
const props = defineProps({
  channelId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelThumbnail: {
    type: String,
    default: null
  },
  showSelected: {
    type: Boolean,
    default: false
  }
})

const selected = ref(false)

const emit = defineEmits('click')

function handleClick(event) {
  if (event instanceof KeyboardEvent) {
    event.preventDefault()
  }

  if (props.showSelected) {
    selected.value = !selected.value
  }
  emit('click')
}
</script>
<style scoped src="./FtChannelBubble.css" />
