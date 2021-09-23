<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.Privacy Settings.Privacy Settings") }}
      </h3>
    </summary>
    <hr>
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
          :label="$t('Settings.Privacy Settings.Save Watched Progress')"
          :compact="true"
          :disabled="!rememberHistory"
          :default-value="saveWatchedProgress"
          @change="updateSaveWatchedProgress"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Privacy Settings.Automatically Remove Video Meta Files')"
          :compact="true"
          :default-value="removeVideoMetaFiles"
          :tooltip="$t('Tooltips.Privacy Settings.Remove Video Meta Files')"
          @change="handleVideoMetaFiles"
        />
      </div>
    </div>
    <br>
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.Privacy Settings.Clear Search Cache')"
        text-color="var(--text-with-main-color)"
        background-color="var(--primary-color)"
        @click="showSearchCachePrompt = true"
      />
      <ft-button
        :label="$t('Settings.Privacy Settings.Remove Watch History')"
        text-color="var(--text-with-main-color)"
        background-color="var(--primary-color)"
        @click="showRemoveHistoryPrompt = true"
      />
      <ft-button
        :label="$t('Settings.Privacy Settings.Remove All Subscriptions / Profiles')"
        text-color="var(--text-with-main-color)"
        background-color="var(--primary-color)"
        @click="showRemoveSubscriptionsPrompt = true"
      />
    </ft-flex-box>
    <ft-prompt
      v-if="showSearchCachePrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to clear out your search cache?')"
      :option-names="promptNames"
      :option-values="promptValues"
      @click="handleSearchCache"
    />
    <ft-prompt
      v-if="showRemoveHistoryPrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to remove your entire watch history?')"
      :option-names="promptNames"
      :option-values="promptValues"
      @click="handleRemoveHistory"
    />
    <ft-prompt
      v-if="showRemoveSubscriptionsPrompt"
      :label="removeSubscriptionsPromptMessage"
      :option-names="promptNames"
      :option-values="promptValues"
      @click="handleRemoveSubscriptions"
    />
  </details>
</template>

<script src="./privacy-settings.js" />
<style scoped lang="sass" src="./privacy-settings.sass" />
