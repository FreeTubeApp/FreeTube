<template>
  <ft-settings-section
    :title="$t('Settings.Privacy Settings.Privacy Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Privacy Settings.Remember History')"
          :compact="true"
          :default-value="rememberHistory"
          @change="handleRememberHistory"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Privacy Settings.Remember Search History')"
          :compact="true"
          :default-value="rememberSearchHistory"
          @change="updateRememberSearchHistory"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Privacy Settings.Save Watched Progress')"
          :compact="true"
          :disabled="!rememberHistory"
          :default-value="saveWatchedProgress"
          @change="updateSaveWatchedProgress"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Privacy Settings.Save Watched Videos With Last Viewed Playlist')"
          :compact="true"
          :disabled="!rememberHistory"
          :default-value="saveVideoHistoryWithLastViewedPlaylist"
          @change="updateSaveVideoHistoryWithLastViewedPlaylist"
        />
      </div>
    </div>
    <br>
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.Privacy Settings.Clear Search History and Cache')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showSearchCachePrompt = true"
      />
      <ft-button
        :label="$t('Settings.Privacy Settings.Remove Watch History')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showRemoveHistoryPrompt = true"
      />
      <ft-button
        :label="$t('Settings.Privacy Settings.Remove All Subscriptions / Profiles')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showRemoveSubscriptionsPrompt = true"
      />
      <ft-button
        :label="$t('Settings.Privacy Settings.Remove All Playlists')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showRemovePlaylistsPrompt = true"
      />
    </ft-flex-box>
    <ft-prompt
      v-if="showSearchCachePrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to clear out your search history and cache?')"
      :option-names="promptNames"
      :option-values="promptValues"
      :is-first-option-destructive="true"
      @click="handleSearchCache"
    />
    <ft-prompt
      v-if="showRemoveHistoryPrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to remove your entire watch history?')"
      :option-names="promptNames"
      :option-values="promptValues"
      :is-first-option-destructive="true"
      @click="handleRemoveHistory"
    />
    <ft-prompt
      v-if="showRemoveSubscriptionsPrompt"
      :label="removeSubscriptionsPromptMessage"
      :option-names="promptNames"
      :option-values="promptValues"
      :is-first-option-destructive="true"
      @click="handleRemoveSubscriptions"
    />
    <ft-prompt
      v-if="showRemovePlaylistsPrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to remove all your playlists?')"
      :option-names="promptNames"
      :option-values="promptValues"
      :is-first-option-destructive="true"
      @click="handleRemovePlaylists"
    />
  </ft-settings-section>
</template>

<script src="./privacy-settings.js" />
