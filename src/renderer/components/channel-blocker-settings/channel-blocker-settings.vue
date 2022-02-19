<template>
  <details>
    <summary>
      <h3>
        {{ $t('Settings.ChannelBlocker Settings.ChannelBlocker Settings') }}
      </h3>
    </summary>
    <hr>
    <ft-flex-box>
      <ft-toggle-switch
        :label="$t('Settings.ChannelBlocker Settings.Enable ChannelBlocker')"
        :default-value="useChannelBlocker"
        @change="handleUpdateChannelBlocker"
      />
    </ft-flex-box>
    <div
      v-if="useChannelBlocker"
    >
      <ft-flex-box class="channelBlockerSettingsSearchFlexBox">
        <div>{{ $t('Settings.ChannelBlocker Settings.Blocked Channels') }}</div>
        <ft-input
          id="cb-settings-search-input"
          ref="searchBar"
          :show-action-button="false"
          :show-clear-text-button="true"
          :placeholder="$t('Settings.ChannelBlocker Settings.Search bar placeholder')"
          @input="filterChannelsList"
        />
      </ft-flex-box>
      <ft-flex-box
        v-if="channelBlockerCache.length === 0"
      >
        <p
          v-if="!hasQuery"
          class="message"
        >
          {{ $t('Settings.ChannelBlocker Settings.Empty List') }}
        </p>
        <p
          v-else
          class="message"
        >
          {{ $t('Settings.ChannelBlocker Settings.Empty Search Result') }}
        </p>
      </ft-flex-box>
      <channel-blocker-settings-list
        v-else
        :data="channelBlockerCache"
        @cbRemoveChannel="removeChannelFromBlockList"
      />
    </div>
  </details>
</template>

<script src="./channel-blocker-settings.js" />
<style scoped lang="sass" src="./channel-blocker-settings.sass" />
