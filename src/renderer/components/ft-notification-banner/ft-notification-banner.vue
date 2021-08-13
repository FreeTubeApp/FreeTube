<template>
  <div
    class="ftNotificationBanner"
    tabindex="0"
    role="link"
    :title="message"
    :aria-describedby="message"
    @click="handleClick(true)"
    @keydown="handleClick(true, $event)"
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
      tabindex="0"
      :title="$t('Close Banner')"
      @click="handleClose"
      @keydown="handleClose($event)"
    />
  </div>
</template>

<script src="./ft-notification-banner.js" />
<style scoped src="./ft-notification-banner.css" />
