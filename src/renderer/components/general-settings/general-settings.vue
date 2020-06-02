<template>
  <ft-card
    class="card">
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
        v-if="false"
        label="Check for Updates"
        :default-value="checkForUpdates"
        @change="updateCheckForUpdates"
      />
    </ft-flex-box>
    <div class="switchGrid">
      <ft-select
        placeholder="Preferred API Backend"
        :value="backendPreference"
        :select-names="backendNames"
        :select-values="backendValues"
        @change="updateBackendPreference"
      />
      <ft-select
        v-if="false"
        placeholder="Default Landing Page"
        :value="landingPage"
        :select-names="defaultPageNames"
        :select-values="defaultPageValues"
        @change="updateLandingPage"
      />
      <ft-select
        v-if="false"
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
    </div>
    <ft-flex-box class="generalSettingsFlexBox">
      <ft-input
        placeholder="Invidious Instance (Default is https://invidio.us)"
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
