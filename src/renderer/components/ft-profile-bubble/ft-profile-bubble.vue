<template>
  <div
    class="bubblePadding"
    tabindex="0"
    :aria-labelledby="'profileBubble-' + $unspace(profileName)"
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
    <div
      :id="'profileBubble-' + $unspace(profileName)"
      class="profileName"
    >
      {{ profileName }}
    </div>
  </div>
</template>

<script src="./ft-profile-bubble.js" />
<style scoped src="./ft-profile-bubble.css" />
