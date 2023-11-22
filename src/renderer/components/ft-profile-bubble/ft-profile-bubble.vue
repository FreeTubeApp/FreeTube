<template>
  <div
    class="bubblePadding"
    :class="{
      profileSelectorGrid
    }"
    tabindex="0"
    :aria-labelledby="sanitizedId"
    :title="showTitle ? null : profileName"
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
      v-show="showTitle"
      :id="sanitizedId"
      class="profileName"
    >
      {{ profileName }}
    </div>
  </div>
</template>

<script src="./ft-profile-bubble.js" />
<style scoped src="./ft-profile-bubble.css" />
