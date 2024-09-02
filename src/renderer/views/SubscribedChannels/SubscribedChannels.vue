<template>
  <div>
    <ft-card class="card">
      <h2>{{ $t('Channels.Title') }}</h2>
      <ft-input
        v-show="subscribedChannels.length > 0"
        ref="searchBarChannels"
        :placeholder="$t('Channels.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        :spellcheck="false"
        :maxlength="255"
        @input="handleInput"
        @clear="query = ''"
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
          {{ $t('Channels.Count', { number: channelList.length }) }}
        </ft-flex-box>
        <ft-flex-box class="channels">
          <div
            v-for="channel in channelList"
            :key="channel.id"
            class="channel"
          >
            <router-link
              tabindex="-1"
              class="thumbnailContainer"
              :to="`/channel/${channel.id}`"
            >
              <img
                v-if="channel.thumbnail != null"
                class="channelThumbnail"
                :src="thumbnailURL(channel.thumbnail)"
                alt=""
                @error.once="updateThumbnail(channel)"
              >
              <font-awesome-icon
                v-else
                class="channelThumbnail"
                :icon="['fas', 'circle-user']"
              />
            </router-link>
            <router-link
              class="channelName"
              :title="channel.name"
              :to="`/channel/${channel.id}`"
            >
              {{ channel.name }}
            </router-link>
            <div
              v-if="!hideUnsubscribeButton"
              class="unsubscribeContainer"
            >
              <ft-subscribe-button
                :channel-id="channel.id"
                :channel-name="channel.name"
                :channel-thumbnail="channel.thumbnail"
                :open-dropdown-on-subscribe="false"
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
