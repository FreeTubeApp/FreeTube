<template>
  <div
    ref="toast"
    class="toast"
    :class="{ closed: !isOpen, open: isOpen }"
    @click="performAction()"
  >
  <p class="message"> {{ message }} </p></div>
</template>

<script src="./ft-toast.js" />
<style scoped src="./ft-toast.css" />