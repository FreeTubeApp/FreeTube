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
    <font-awesome-icon
      class="bannerIcon"
      :icon="['fas', 'times']"
      tabindex="0"
      :title="$t('Close Banner')"
      @click.stop="handleClose"
      @keydown.enter.stop.prevent="handleClose"
    />
  </div>
</template>

<script src="./ft-notification-banner.js" />
<style scoped src="./ft-notification-banner.css" />
