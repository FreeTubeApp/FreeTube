<template>
  <ft-card
    class="relative card">
    <h3>
      {{ title }}
    </h3>
    <ft-flex-box>
      <ft-toggle-switch
        label="Match Top Bar with Main Color"
        :default-value="barColor"
        @change="updateBarColor"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        placeholder="Base Theme"
        :value="currentBaseTheme"
        :select-names="baseThemeNames"
        :select-values="baseThemeValues"
        @change="updateBaseTheme"
      />
      <ft-select
        placeholder="Main Color Theme"
        :value="currentMainColor"
        :select-names="colorNames"
        :select-values="colorValues"
        @change="updateMainColor"
      />
      <ft-select
        placeholder="Secondary Color Theme"
        :value="currentSecColor"
        :select-names="colorNames"
        :select-values="colorValues"
        @change="updateSecColor"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./theme-settings.js" />
<style scoped src="./theme-settings.css" />
