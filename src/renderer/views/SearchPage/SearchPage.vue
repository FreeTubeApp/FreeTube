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
      <h2>
        <font-awesome-icon
          :icon="['fas', 'search']"
          class="headingIcon"
          fixed-width
        />
        {{ $t("Search Filters.Search Results") }}
      </h2>
      <ft-element-list
        :data="shownResults"
      />
      <ft-auto-load-next-page-wrapper
        @load-next-page="nextPage"
      >
        <div
          class="getNextPage"
          role="button"
          tabindex="0"
          @click="nextPage"
          @keydown.enter.prevent="nextPage"
          @keydown.space.prevent="nextPage"
        >
          <font-awesome-icon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
        </div>
      </ft-auto-load-next-page-wrapper>
    </ft-card>
  </div>
</template>

<script src="./SearchPage.js" />
<style scoped src="./SearchPage.css" />
