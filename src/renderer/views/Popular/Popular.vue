<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
    >
      <h3>Most Popular</h3>
      <ft-element-list
        :data="shownResults"
      />
    </ft-card>
  </div>
</template>

<script src="./Popular.js" />
<style scoped src="./Popular.css" />
