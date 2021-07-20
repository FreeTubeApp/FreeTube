<template>
  <div
    class="bubblePadding"
    :aria-label="profileName"
    tabindex="0"
    @click="goToProfile"
    @keydown="goToProfile($event)"
  >
    <div
      class="bubble"
      :style="{ background: backgroundColor, color: textColor }"
    >
      <div class="initial">
        {{ profileInitial }}
      </div>
    </div>
    <div class="profileName">
      {{ profileName }}
    </div>
  </div>
</template>

<script src="./ft-profile-bubble.js" />
<style scoped src="./ft-profile-bubble.css" />
