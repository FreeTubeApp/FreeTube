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
      <h3>{{ $t("Trending") }}</h3>
      <ft-element-list
        :data="shownResults"
      />
    </ft-card>
  </div>
</template>

<script src="./Trending.js" />
<style scoped src="./Trending.css" />
