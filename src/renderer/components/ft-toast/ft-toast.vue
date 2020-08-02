<template>
  <div class="toast-holder">
    <div
      v-for="(toast, index) in toasts"
      :key="'toast-' + index"
      class="toast"
      :class="{ closed: !toast.isOpen, open: toast.isOpen }"
      @click="performAction(index)"
    >
      <p class="message">
        {{ toast.message }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-toast.js" />
<style scoped src="./ft-toast.css" />
