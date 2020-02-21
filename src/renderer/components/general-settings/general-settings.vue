<template>
  <ft-card
    class="relative card">
    <h3
      class="videoTitle"
    >
      {{ title }}
    </h3>
    <ft-flex-box>
      <ft-toggle-switch
        label="Fallback to Non-Preferred Backend on Failure"
      />
      <ft-toggle-switch
        label="Check for Updates"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        placeholder="Preferred API Backend"
        :value="backendValues[0]"
        :select-names="backendNames"
        :select-values="backendValues"
      />
      <ft-select
        placeholder="Default Theme"
        :value="themeValues[0]"
        :select-names="themeNames"
        :select-values="themeValues"
      />
      <ft-select
        placeholder="Default Landing Page"
        :value="defaultPageValues[0]"
        :select-names="defaultPageNames"
        :select-values="defaultPageValues"
      />
      <ft-select
        placeholder="Region for Trending"
        :value="regionValues[0]"
        :select-names="regionNames"
        :select-values="regionValues"
      />
      <ft-select
        placeholder="Video View Type"
        :value="viewTypeValues[0]"
        :select-names="viewTypeNames"
        :select-values="viewTypeValues"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./general-settings.js" />
<style scoped src="./general-settings.css" />
