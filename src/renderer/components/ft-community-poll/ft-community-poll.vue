<template>
  <div class="poll">
    <div
      class="vote-count"
    >
      <!-- Format the votes to be split by commas ie. 1000 -> 1,000 -->
      {{ $t('Channel.Community.votes', {votes: formattedVotes}) }}
    </div>
    <div
      v-for="(choice, index) in data.content"
      :key="index"
    >
      <div
        v-if="data.type === 'quiz'"
        class="option quiz-option"
      >
        <span class="empty-circle">
          <span :class="revealAnswer && choice.isCorrect ? 'filled-circle' : ''" />
        </span>
        <div
          class="option-text"
          :class="revealAnswer && choice.isCorrect ? 'correct-option' : ''"
        >
          {{ choice.text }}
        </div>
      </div>
      <div
        v-else
        class="option poll-option"
      >
        <span class="empty-circle" />
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
        <font-awesome-icon :icon="['fas', 'eye']" /> {{ $t('Channel.Community.Reveal Answers') }}
      </div>
      <div
        v-else
        class="option-text"
      >
        <font-awesome-icon :icon="['fas', 'eye-slash']" /> {{ $t('Channel.Community.Hide Answers') }}
      </div>
    </div>
  </div>
</template>

<script src="./ft-community-poll.js" />
<style scoped src="./ft-community-poll.css" />
