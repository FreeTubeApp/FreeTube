<template>
  <div class="poll">
    <div
      class="vote-count"
    >
      <!-- Format the votes to be split by commas ie. 1000 -> 1,000 -->
      {{ $t('Channel.Posts.votes', {votes: formattedVotes}) }}
    </div>
    <div
      v-for="(choice, index) in data.content"
      :key="index"
    >
      <div
        v-if="data.type === 'quiz'"
        class="option quiz-option"
        :class="revealAnswer && choice.isCorrect ? 'correct-option' : ''"
      >
        <span class="empty-circle">
          <span :class="revealAnswer && choice.isCorrect ? 'filled-circle' : ''" />
        </span>
        <div
          class="option-text"
        >
          {{ choice.text }}
        </div>
      </div>
      <div
        v-else
        class="option poll-option"
      >
        <span class="empty-circle" />
        <img
          v-if="choice.image"
          :src="findSmallestPollImage(choice.image)"
          alt=""
        >
        <div class="option-text">
          {{ choice.text }}
        </div>
      </div>
    </div>
    <div
      v-if="data.type === 'quiz'"
      class="reveal-answer option"
      tabindex="0"
      role="button"
      @click="revealAnswer = !revealAnswer"
      @keydown.enter.prevent="revealAnswer = !revealAnswer"
      @keydown.space.prevent="revealAnswer = !revealAnswer"
    >
      <div
        v-if="!revealAnswer"
        class="option-text"
      >
        <FontAwesomeIcon :icon="['fas', 'eye']" /> {{ $t('Channel.Posts.Reveal Answers') }}
      </div>
      <div
        v-else
        class="option-text"
      >
        <FontAwesomeIcon :icon="['fas', 'eye-slash']" /> {{ $t('Channel.Posts.Hide Answers') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { formatNumber } from '../../helpers/utils'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const formattedVotes = computed(() => {
  return formatNumber(props.data.totalVotes)
})

const revealAnswer = ref(false)

/**
 * Use smallest as it's resized to 125px anyways and they're usually all larger than that
 * @param {{ height: number, width: number, url: string }[]} images
 */
function findSmallestPollImage(images) {
  return images.reduce((prev, img) => (img.height < prev.height) ? img : prev, images[0]).url
}
</script>

<style scoped src="./FtCommunityPoll.css" />
