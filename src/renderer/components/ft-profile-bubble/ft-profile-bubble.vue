<template>
  <div
    class="bubblePadding"
    tabindex="0"
    :aria-labelledby="sanitizedId"
    @click="goToProfile"
    @keydown.space.prevent="goToProfile($event)"
    @keydown.enter.prevent="goToProfile($event)"
  >
    <div
      class="bubble"
      :style="{ background: backgroundColor, color: textColor }"
    >
      <div class="initial">
        {{ profileInitial }}
      </div>
    </div>
    <div
      :id="sanitizedId"
      class="profileName"
    >
      {{ translatedProfileName }}
    </div>
  </div>
</template>

<script src="./ft-profile-bubble.js" />
<style scoped src="./ft-profile-bubble.css" />
