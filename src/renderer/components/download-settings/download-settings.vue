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
        :icon="['fas', 'download']"
        @change="updateDownloadBehavior"
      />
    </ft-flex-box>
    <template
      v-if="downloadBehavior === 'download'"
    >
      <ft-flex-box
        class="settingsFlexStart500px"
      >
        <ft-toggle-switch
          :label="$t('Settings.Download Settings.Ask Download Path')"
          :default-value="askForDownloadPath"
          @change="handleDownloadingSettingChange"
        />
      </ft-flex-box>
      <template
        v-if="!askForDownloadPath"
      >
        <ft-flex-box>
          <ft-input
            class="folderDisplay"
            :placeholder="downloadPath"
            :show-action-button="false"
            :show-label="false"
            :disabled="true"
          />
        </ft-flex-box>
        <ft-flex-box>
          <ft-button
            :label="$t('Settings.Download Settings.Choose Path')"
            @click="chooseDownloadingFolder"
          />
        </ft-flex-box>
      </template>
    </template>
  </ft-settings-section>
</template>

<script src="./download-settings.js" />
<style scoped src="./download-settings.css" />
