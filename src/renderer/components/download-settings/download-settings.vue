<template>
  <ft-settings-section
    :title="$t('Settings.Download Settings.Download Settings')"
  >
    <ft-flex-box>
      <ft-select
        :placeholder="$t('Settings.Download Settings.Download Behavior')"
        :value="downloadBehavior"
        :select-names="downloadBehaviorNames"
        :select-values="downloadBehaviorValues"
        @change="updateDownloadBehavior"
      />
    </ft-flex-box>
    <ft-flex-box
      v-if="downloadBehavior === 'download'"
      class="settingsFlexStart500px"
    >
      <ft-toggle-switch
        :label="$t('Settings.Download Settings.Ask Download Path')"
        :default-value="askForDownloadPath"
        @change="handleDownloadingSettingChange"
      />
    </ft-flex-box>
    <ft-flex-box
      v-if="!askForDownloadPath && downloadBehavior === 'download'"
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
      v-if="!askForDownloadPath && downloadBehavior === 'download'"
    >
      <ft-button
        :label="$t('Settings.Download Settings.Choose Path')"
        @click="chooseDownloadingFolder"
      />
    </ft-flex-box>
  </ft-settings-section>
</template>

<script src="./download-settings.js" />
<style scoped lang="scss" src="./download-settings.scss" />
