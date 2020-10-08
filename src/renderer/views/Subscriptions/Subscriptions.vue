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
        v-if="activeVideoList.length === 0"
      >
        <p class="message">
          {{ $t("Subscriptions['Your Subscription list is currently empty. Start adding subscriptions to see them here.']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-else
        :data="activeVideoList"
      />
      <ft-flex-box>
        <ft-button
          v-if="videoList.length > dataLimit"
          :label="$t('Subscriptions.Load More Videos')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </ft-flex-box>
    </ft-card>
    <ft-icon-button
      v-if="!isLoading"
      icon="sync"
      class="floatingTopButton"
      :title="$t('Subscriptions.Refresh Subscriptions')"
      :size="12"
      theme="primary"
      @click="getSubscriptions"
    />
  </div>
</template>

<script src="./Subscriptions.js" />
<style scoped src="./Subscriptions.css" />
