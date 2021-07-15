<template>
  <div
    class="ftNotificationBanner"
    @click="handleClick(true)"
    @keydown="handleClick(true, $event)"
    tabindex="0"
    role="link"
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
      icon="times"
      @click="handleClose"
      @keydown="handleClose($event)"
      tabindex="0"
    />
  </div>
</template>

<script src="./ft-notification-banner.js" />
<style scoped src="./ft-notification-banner.css" />
