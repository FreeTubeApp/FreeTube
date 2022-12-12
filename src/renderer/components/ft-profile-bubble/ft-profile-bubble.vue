<template>
  <div
    class="bubblePadding"
    @click="goToProfile"
  >
    <div
      v-if="hasProfileImage"
      class="bubble"
      :style="{ backgroundImage: `url(${profileImageUrl})` }"
    />
    <div
      v-else
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
