<template>
  <div class="poll">
    <div
      class="vote-count"
    >
      <!-- Format the votes to be split by commas ie. 1000 -> 1,000 -->
      {{ `${data.totalVotes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} votes` }}
    </div>
    <div
      v-for="(choice, index) in data.content"
      :key="index"
    >
      <div
        v-if="data.type == 'quiz'"
        class="option quiz-option"
        @click="active = index"
      >
        <span class="empty-circle">
          <span :class="active === index ? 'filled-circle' : ''" />
        </span>
        <div
          class="option-text"
          :class="active === index ? getQuizOptionClass(index) : ''"
        >
          {{ choice.text }}
        </div>
      </div>
      <div
        v-if="data.type == 'poll'"
        class="option poll-option"
      >
        <span class="empty-circle" />
        <div class="option-text">
          {{ choice.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./ft-community-poll.js" />
<style scoped src="./ft-community-poll.scss" lang="scss" />
