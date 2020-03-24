<template>
  <ft-card
    class="relative card">
    <h3
      class="videoTitle"
    >
      {{ title }}
    </h3>
    <ft-flex-box class="generalSettingsFlexBox">
      <ft-toggle-switch
        label="Fallback to Non-Preferred Backend on Failure"
        :default-value="backendFallback"
        @change="updateBackendFallback"
      />
      <ft-toggle-switch
        label="Check for Updates"
        :default-value="checkForUpdates"
        @change="updateCheckForUpdates"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        placeholder="Preferred API Backend"
        :value="backendPreference"
        :select-names="backendNames"
        :select-values="backendValues"
        @change="updateBackendPreference"
      />
      <ft-select
        placeholder="Default Landing Page"
        :value="landingPage"
        :select-names="defaultPageNames"
        :select-values="defaultPageValues"
        @change="updateLandingPage"
      />
      <ft-select
        placeholder="Region for Trending"
        :value="region"
        :select-names="regionNames"
        :select-values="regionValues"
        @change="updateRegion"
      />
      <ft-select
        placeholder="Video View Type"
        :value="listType"
        :select-names="viewTypeNames"
        :select-values="viewTypeValues"
        @change="updateListType"
      />
      <ft-select
        placeholder="Thumbnail Preference"
        :value="thumbnailPreference"
        :select-names="thumbnailTypeNames"
        :select-values="thumbnailTypeValues"
        @change="updateThumbnailPreference"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./general-settings.js" />
<style scoped src="./general-settings.css" />
