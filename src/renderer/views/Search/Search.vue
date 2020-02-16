<template>
  <div
    ref="search"
  >
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
    >
      <h3>Search Results</h3>
      <ft-element-list
        :data="shownResults"
      />
      <div
        class="getNextPage"
        @click="nextPage"
      >
        <font-awesome-icon icon="search" /> Fetch more results…
      </div>
    </ft-card>
  </div>
</template>

<script src="./Search.js" />
<style scoped src="./Search.css" />
