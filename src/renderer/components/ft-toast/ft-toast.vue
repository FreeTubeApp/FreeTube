<template>
  <div class="toast-holder">
    <div
      v-for="(toast, index) in toasts"
      :key="'toast-' + index"
      class="toast"
      :class="{ closed: !toast.isOpen, open: toast.isOpen }"
      tabindex="0"
      role="status"
      @click="performAction(index)"
      @keydown.enter.prevent="performAction(index)"
      @keydown.space.prevent="performAction(index)"
    >
      <p class="message">
        {{ toast.message }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-toast.js" />
<style scoped src="./ft-toast.css" />
