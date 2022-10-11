<template>
  <ft-settings-section
    :title="$t('Settings.General Settings.General Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.General Settings.Check for Updates')"
          :default-value="checkForUpdates"
          :compact="true"
          @change="updateCheckForUpdates"
        />
        <ft-toggle-switch
          :label="$t('Settings.General Settings.Fallback to Non-Preferred Backend on Failure')"
          :default-value="backendFallback"
          :compact="true"
          :tooltip="$t('Tooltips.General Settings.Fallback to Non-Preferred Backend on Failure')"
          @change="updateBackendFallback"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.General Settings.Check for Latest Blog Posts')"
          :default-value="checkForBlogPosts"
          :compact="true"
          @change="updateCheckForBlogPosts"
        />
        <ft-toggle-switch
          :label="$t('Settings.General Settings.Enable Search Suggestions')"
          :default-value="enableSearchSuggestions"
          :compact="true"
          @change="updateEnableSearchSuggestions"
        />
      </div>
    </div>
    <div class="switchGrid">
      <ft-select
        :placeholder="$t('Settings.General Settings.Preferred API Backend.Preferred API Backend')"
        :value="backendPreference"
        :select-names="backendNames"
        :select-values="backendValues"
        :tooltip="$t('Tooltips.General Settings.Preferred API Backend')"
        @change="handlePreferredApiBackend"
      />
      <ft-select
        v-if="false"
        :placeholder="$t('Settings.General Settings.Default Landing Page')"
        :value="landingPage"
        :select-names="defaultPageNames"
        :select-values="defaultPageValues"
        @change="updateLandingPage"
      />
      <ft-select
        :placeholder="$t('Settings.General Settings.Video View Type.Video View Type')"
        :value="listType"
        :select-names="viewTypeNames"
        :select-values="viewTypeValues"
        @change="updateListType"
      />
      <ft-select
        :placeholder="$t('Settings.General Settings.Thumbnail Preference.Thumbnail Preference')"
        :value="thumbnailPreference"
        :select-names="thumbnailTypeNames"
        :select-values="thumbnailTypeValues"
        :tooltip="$t('Tooltips.General Settings.Thumbnail Preference')"
        @change="updateThumbnailPreference"
      />
      <ft-select
        :placeholder="$t('Settings.General Settings.Locale Preference')"
        :value="currentLocale"
        :select-names="localeNames"
        :select-values="localeOptions"
        @change="updateCurrentLocale"
      />
      <ft-select
        :placeholder="$t('Settings.General Settings.Region for Trending')"
        :value="region"
        :select-names="regionNames"
        :select-values="regionValues"
        :tooltip="$t('Tooltips.General Settings.Region for Trending')"
        @change="updateRegion"
      />
      <ft-select
        :placeholder="$t('Settings.General Settings.External Link Handling.External Link Handling')"
        :value="externalLinkHandling"
        :select-names="externalLinkHandlingNames"
        :select-values="externalLinkHandlingValues"
        :tooltip="$t('Tooltips.General Settings.External Link Handling')"
        @change="updateExternalLinkHandling"
      />
    </div>
    <div
      v-if="backendPreference === 'invidious' || backendFallback"
    >
      <ft-flex-box class="settingsFlexStart460px">
        <ft-input
          :placeholder="$t('Settings.General Settings.Current Invidious Instance')"
          :show-action-button="false"
          :show-label="true"
          :value="currentInvidiousInstance"
          :data-list="invidiousInstancesList"
          :tooltip="$t('Tooltips.General Settings.Invidious Instance')"
          @input="handleInvidiousInstanceInput"
        />
      </ft-flex-box>
      <ft-flex-box>
        <div>
          <a
            href="https://api.invidious.io"
          >
            {{ $t('Settings.General Settings.View all Invidious instance information') }}
          </a>
        </div>
      </ft-flex-box>
      <p
        v-if="defaultInvidiousInstance !== ''"
        class="center"
      >
        {{ $t('Settings.General Settings.The currently set default instance is $').replace('$', defaultInvidiousInstance) }}
      </p>
      <template v-else>
        <p class="center">
          {{ $t('Settings.General Settings.No default instance has been set') }}
        </p>
        <p class="center">
          {{ $t('Settings.General Settings.Current instance will be randomized on startup') }}
        </p>
      </template>
      <ft-flex-box>
        <ft-button
          :label="$t('Settings.General Settings.Set Current Instance as Default')"
          @click="handleSetDefaultInstanceClick"
        />
        <ft-button
          :label="$t('Settings.General Settings.Clear Default Instance')"
          @click="handleClearDefaultInstanceClick"
        />
      </ft-flex-box>
    </div>
  </ft-settings-section>
</template>

<script src="./general-settings.js" />
<style scoped lang="sass" src="./general-settings.sass" />
