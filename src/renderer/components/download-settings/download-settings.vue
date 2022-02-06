<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.Download Settings.Download Settings") }}
      </h3>
    </summary>
    <hr>
    <ft-flex-box class="downloadSettingsFlexBox">
      <ft-toggle-switch
        :label="$t('Settings.Download Settings.Ask Download Path')"
        :default-value="askForDownloadPath"
        @change="handleDownloadingSettingChange"
      />
    </ft-flex-box>
    <ft-flex-box
      v-if="!askForDownloadPath"
    >
      <ft-input
        class="folderDisplay"
        :placeholder="downloadPath"
        :show-action-button="false"
        :show-label="false"
        :disabled="true"
      />
    </ft-flex-box>
    <ft-flex-box
      v-if="!askForDownloadPath"
    >
      <ft-button
        :label="$t('Settings.Download Settings.Choose Path')"
        @click="chooseDownloadingFolder"
      />
    </ft-flex-box>
  </details>
</template>

<script src="./download-settings.js" />
<style scoped lang="sass" src="./download-settings.sass" />
