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
      <h3>{{ $t("Subscriptions.Subscriptions") }}</h3>
      <ft-flex-box
        v-if="profileSubscriptions.videoList.length === 0"
      >
        <p class="message">
          {{ $t("History['Your history list is currently empty.']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-else
        :data="profileSubscriptions.videoList"
      />
      <ft-flex-box
        v-if="false"
      >
        <ft-button
          label="Load More"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./Subscriptions.js" />
<style scoped src="./Subscriptions.css" />
