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
          :disabled="backendPreference === 'piped'"
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
        v-if="backendFallback"
        :placeholder="$t('Settings.General Settings.Preferred API Backend.Fallback API Backend')"
        :value="fallbackPreference"
        :select-names="backendNames"
        :select-values="backendValues"
        :tooltip="$t('Tooltips.General Settings.Fallback API Backend')"
        @change="handleFallbackApiBackend"
      />
      <ft-select
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
        @change="handleThumbnailPreferenceChange"
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
    <template
      v-if="backendPreference === 'piped'"
    >
      <ft-instance-selector
        :backend-type="'piped'"
        :placeholder="$t('Settings.General Settings.Current Piped Instance')"
        :tooltip="$t('Tooltips.General Settings.Piped Instance')"
        :instance-list="pipedInstancesList"
        :current-instance="currentPipedInstance"
        :default-instance="defaultPipedInstance"
        @input="handlePipedInstanceInput"
        @setDefaultInstance="handleSetDefaultPipedInstanceClick"
        @clearDefaultInstance="handleClearDefaultPipedInstanceClick"
      />
      <br
        v-if="(backendFallback && fallbackPreference === 'invidious')"
      >
    </template>
    <template
      v-if="(backendFallback && fallbackPreference === 'invidious') || backendPreference == 'invidious'"
    >
      <ft-instance-selector
        :backend-type="'invidious'"
        :placeholder="$t('Settings.General Settings.Current Invidious Instance')"
        :tooltip="$t('Tooltips.General Settings.Invidious Instance')"
        :instance-list="invidiousInstancesList"
        :current-instance="currentInvidiousInstance"
        :default-instance="defaultInvidiousInstance"
        @input="handleInvidiousInstanceInput"
        @setDefaultInstance="handleSetDefaultInvidiousInstanceClick"
        @clearDefaultInstance="handleClearDefaultInvidiousInstanceClick"
      />
      <br
        v-if="(backendFallback && fallbackPreference === 'piped')"
      >
    </template>
    <template
      v-if="backendFallback && fallbackPreference === 'piped'"
    >
      <ft-instance-selector
        :backend-type="'piped'"
        :placeholder="$t('Settings.General Settings.Current Piped Instance')"
        :tooltip="$t('Tooltips.General Settings.Piped Instance')"
        :instance-list="pipedInstancesList"
        :current-instance="currentPipedInstance"
        :default-instance="defaultPipedInstance"
        @input="handlePipedInstanceInput"
        @setDefaultInstance="handleSetDefaultPipedInstanceClick"
        @clearDefaultInstance="handleClearDefaultPipedInstanceClick"
      />
    </template>
  </ft-settings-section>
</template>

<script src="./general-settings.js" />
<style scoped src="./general-settings.css" />
