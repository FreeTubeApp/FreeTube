<template>
  <div
    class="ftNotificationBanner"
    tabindex="0"
    role="link"
    :title="message"
    :aria-describedby="message"
    @click="handleClick(true)"
    @keydown.enter.prevent="handleClick(true)"
    @keydown.space.prevent="handleClick(true)"
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
    <span
      role="button"
      tabindex="0"
      @click.stop="handleClose"
      @keydown.enter.stop.prevent="handleClose"
    >
      <font-awesome-icon
        class="bannerIcon"
        :icon="['fas', 'times']"
        :title="$t('Close Banner')"
      />
    </span>
  </div>
</template>

<script src="./ft-notification-banner.js" />
<style scoped src="./ft-notification-banner.css" />
