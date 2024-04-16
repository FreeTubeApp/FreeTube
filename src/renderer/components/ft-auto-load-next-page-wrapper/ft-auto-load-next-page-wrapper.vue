<template>
  <div
    class="ft-auto-load-next-page-wrapper"
  >
    <div
      v-observe-visibility="observeVisibilityOptions"
    >
      <!--
        Dummy element to be observed by Intersection Observer
      -->
    </div>
    <slot />
  </div>
</template>

<script src="./ft-auto-load-next-page-wrapper.js" />
