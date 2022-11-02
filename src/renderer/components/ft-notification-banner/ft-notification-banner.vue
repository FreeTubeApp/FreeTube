<template>
  <div
    class="ftNotificationBanner"
    @click="handleClick(true)"
  >
    <div
      class="message"
    >
      <slot>
        <p>
          {{ message }}
        </p>
      </slot>
    </div>
    <font-awesome-icon
      class="bannerIcon"
      :icon="['fas', 'times']"
      @click="handleClose"
    />
  </div>
</template>

<script src="./ft-notification-banner.js" />
<style scoped src="./ft-notification-banner.css" />
