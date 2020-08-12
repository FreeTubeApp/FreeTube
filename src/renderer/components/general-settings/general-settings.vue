<template>
  <ft-card
    class="card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.General Settings.General Settings") }}
    </h3>
    <ft-flex-box class="generalSettingsFlexBox">
      <ft-toggle-switch
        :label="$t('Settings.General Settings.Fallback to Non-Preferred Backend on Failure')"
        :default-value="backendFallback"
        @change="updateBackendFallback"
      />
      <ft-toggle-switch
        :label="$t('Settings.General Settings.Enable Search Suggestions')"
        :default-value="enableSearchSuggestions"
        @change="updateEnableSearchSuggestions"
      />
      <ft-toggle-switch
        v-if="false"
        :label="$t('Settings.General Settings.Check for Updates')"
        :default-value="checkForUpdates"
        @change="updateCheckForUpdates"
      />
    </ft-flex-box>
    <div class="switchGrid">
      <ft-select
        :placeholder="$t('Settings.General Settings.Preferred API Backend.Preferred API Backend')"
        :value="backendPreference"
        :select-names="backendNames"
        :select-values="backendValues"
        @change="updateBackendPreference"
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
        v-if="false"
        :placeholder="$t('Settings.General Settings.Region for Trending')"
        :value="region"
        :select-names="regionNames"
        :select-values="regionValues"
        @change="updateRegion"
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
        @change="updateThumbnailPreference"
      />
      <ft-select
        placeholder="Change Locale"
        :value="currentLocale"
        :select-names="localeOptions"
        :select-values="localeOptions"
        @change="updateLocale"
      />
    </div>
    <ft-flex-box class="generalSettingsFlexBox">
      <ft-input
        :placeholder="$t('Settings.General Settings[\'Invidious Instance (Default is https://invidio.us)\']')"
        :show-arrow="false"
        :show-label="true"
        :value="invidiousInstance"
        :data-list="instanceValues"
        @input="handleInvidiousInstanceInput"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./general-settings.js" />
<style scoped lang="sass" src="./general-settings.sass" />
