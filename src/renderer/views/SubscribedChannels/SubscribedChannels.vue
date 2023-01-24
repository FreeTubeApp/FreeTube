<template>
  <div>
    <ft-card class="card">
      <h3>{{ $t('Channels.Title') }}</h3>
      <ft-input
        v-show="subscribedChannels.length > 0"
        ref="searchBarChannels"
        :placeholder="$t('Channels.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        :spellcheck="false"
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
            :key="channel.key"
            class="channel"
          >
            <router-link
              tabindex="-1"
              class="thumbnailContainer"
              :to="`/channel/${channel.id}`"
            >
              <img
                class="channelThumbnail"
                :src="thumbnailURL(channel.thumbnail)"
                alt=""
                @error.once="updateThumbnail(channel)"
              >
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
              <ft-button
                :label="$t('Channels.Unsubscribe')"
                background-color="var(--search-bar-color)"
                text-color="var(--secondary-text-color)"
                @click="handleUnsubscribeButtonClick(channel)"
              />
            </div>
          </div>
        </ft-flex-box>
      </template>
    </ft-card>
    <ft-prompt
      v-if="showUnsubscribePrompt"
      :label="$t('Channels.Unsubscribe Prompt', { channelName: channelToUnsubscribe.name })"
      :option-names="unsubscribePromptNames"
      :option-values="unsubscribePromptValues"
      @click="handleUnsubscribePromptClick"
    />
  </div>
</template>

<script src="./SubscribedChannels.js" />
<style scoped src="./SubscribedChannels.css" />
