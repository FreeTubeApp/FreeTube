<template>
  <div class="toast-holder">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="{ closed: !toast.isOpen, open: toast.isOpen }"
      tabindex="0"
      role="status"
      @click="performAction(toast.id)"
      @keydown.enter.prevent="performAction(toast.id)"
      @keydown.space.prevent="performAction(toast.id)"
    >
      <p class="message">
        {{ toast.message }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-toast.js" />
<style scoped src="./ft-toast.css" />
