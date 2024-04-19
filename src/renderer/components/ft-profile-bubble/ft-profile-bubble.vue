<template>
  <div
    class="bubblePadding"
    tabindex="0"
    role="button"
    :aria-labelledby="sanitizedId"
    @click="click"
    @keydown.space.enter.prevent="click"
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
