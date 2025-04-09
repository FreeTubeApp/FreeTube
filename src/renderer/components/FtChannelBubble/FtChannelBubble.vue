<template>
  <router-link
    v-if="!selectable"
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
    <FontAwesomeIcon
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
    :aria-checked="selected"
    role="checkbox"
    tabindex="0"
    :aria-labelledby="id"
    @click="handleClick"
    @keydown.space.enter.prevent="handleClick"
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
      <FontAwesomeIcon
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
import { useId } from '../../composables/use-id-polyfill'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const id = useId()

const emit = defineEmits(['change'])

function handleClick() {
  emit('change', !props.selected)
}
</script>

<style scoped src="./FtChannelBubble.css" />
