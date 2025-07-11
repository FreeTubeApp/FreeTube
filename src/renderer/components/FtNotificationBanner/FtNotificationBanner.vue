<template>
  <div
    class="ftNotificationBanner"
    tabindex="0"
    role="link"
    :title="message"
    :aria-describedby="id"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div
      class="message"
    >
      <p :id="id">
        {{ message }}
      </p>
    </div>
    <FontAwesomeIcon
      class="bannerIcon"
      :icon="['fas', 'times']"
      tabindex="0"
      :title="$t('Close Banner')"
      @click.stop="handleClose"
      @keydown.enter.space.stop.prevent="handleClose"
    />
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useId } from '../../composables/use-id-polyfill'

defineProps({
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click'])

const id = useId()

function handleClick() {
  emit('click', true)
}

function handleClose() {
  emit('click', false)
}
</script>

<style scoped src="./FtNotificationBanner.css" />
