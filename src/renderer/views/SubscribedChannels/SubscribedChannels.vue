<template>
  <div>
    <ft-card class="card">
      <h3>{{ $t('Channels.Title') }}</h3>
      <ft-input
        ref="searchBarChannels"
        :placeholder="$t('Channels.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        :spellcheck="false"
        @input="filterChannels"
      />
      <ft-flex-box
        v-if="activeSubscriptionList.length === 0"
      >
        <p class="message">
          {{ $t('Channels.Empty') }}
        </p>
      </ft-flex-box>
      <template v-else>
        <ft-flex-box class="count">
          {{ $t('Channels.Count').replace('$', channelsList.length) }}
        </ft-flex-box>
        <ft-flex-box class="channels">
          <div
            v-for="channel in channelsList"
            :key="channel.key"
            class="channel"
          >
            <div class="thumbnailContainer">
              <img
                class="channelThumbnail"
                :src="thumbnailURL(channel.thumbnail)"
                @click="goToChannel(channel.id)"
              >
            </div>
            <div
              class="channelName"
              :title="channel.name"
              @click="goToChannel(channel.id)"
            >
              {{ channel.name }}
            </div>
            <div class="buttonContainer">
              <ft-button
                :label="$t('Channels.Unsubscribe')"
                background-color="var(--search-bar-color)"
                text-color="var(--secondary-text-color)"
                @click="unsubscribeChannel(channel.id, channel.name)"
              />
            </div>
          </div>
        </ft-flex-box>
      </template>
    </ft-card>
  </div>
</template>

<script src="./SubscribedChannels.js" />
<style scoped src="./SubscribedChannels.css" />
