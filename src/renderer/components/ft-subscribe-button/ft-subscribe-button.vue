<template>
  <ft-button
    :label="subscribedText"
    class="subscribeButton"
    background-color="var(--primary-color)"
    text-color="var(--text-with-main-color)"
    @click="handleSubscription"
  />
</template>

<script src="./ft-subscribe-button.js" />
<style src="./ft-subscribe-button.css" />
