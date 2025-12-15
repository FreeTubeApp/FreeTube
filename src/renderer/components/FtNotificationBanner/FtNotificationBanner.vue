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
    <p
      :id="id"
      class="message"
    >
      {{ message }}
    </p>
    <button
      class="closeButton"
      :aria-label="$t('Close Banner')"
      :title="$t('Close Banner')"
      @click.stop="handleClose"
      @keydown.enter.space.stop
    >
      <FontAwesomeIcon
        class="closeIcon"
        :icon="['fas', 'times']"
      />
    </button>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useId } from 'vue'

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
