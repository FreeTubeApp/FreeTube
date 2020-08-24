<template>
  <div
    class="bubblePadding"
    @click="goToProfile"
  >
    <div
      class="bubble"
      :style="{ background: backgroundColor, color: textColor }"
    >
      <p class="initial">
        {{ profileInitial }}
      </p>
    </div>
    <div class="profileName">
      {{ profileName }}
    </div>
  </div>
</template>

<script src="./ft-profile-bubble.js" />
<style scoped src="./ft-profile-bubble.css" />
