<template>
  <ft-settings-section
    :title="$t('Settings.Data Settings.Data Settings')"
  >
    <h4 class="groupTitle">
      {{ $t('Subscriptions.Subscriptions') }}
    </h4>
    <ft-flex-box class="dataSettingsBox">
      <ft-button
        :label="$t('Settings.Data Settings.Import Subscriptions')"
        @click="importSubscriptions"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Manage Subscriptions')"
        @click="openProfileSettings"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Export Subscriptions')"
        @click="showExportSubscriptionsPrompt = true"
      />
    </ft-flex-box>
    <ft-flex-box>
      <p>
        <a href="https://docs.freetubeapp.io/usage/importing-subscriptions/">
          {{ $t("Settings.Data Settings.How do I import my subscriptions?") }}
        </a>
      </p>
    </ft-flex-box>
    <h4 class="groupTitle">
      {{ $t('History.History') }}
    </h4>
    <ft-flex-box class="dataSettingsBox">
      <ft-button
        :label="$t('Settings.Data Settings.Import History')"
        @click="importHistory"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Export History')"
        @click="exportHistory"
      />
    </ft-flex-box>
    <h4 class="groupTitle">
      {{ $t('Playlists') }}
    </h4>
    <ft-flex-box class="dataSettingsBox">
      <ft-button
        :label="$t('Settings.Data Settings.Import Playlists')"
        @click="importPlaylists"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Export Playlists')"
        @click="exportPlaylistsForOlderVersionsSometimes"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-toggle-switch
        :label="$t('Settings.Data Settings.Export Playlists For Older FreeTube Versions.Label')"
        :compact="true"
        :default-value="shouldExportPlaylistForOlderVersions"
        :tooltip="$t('Settings.Data Settings.Export Playlists For Older FreeTube Versions.Tooltip')"
        :tooltip-allow-newlines="true"
        @change="shouldExportPlaylistForOlderVersions = !shouldExportPlaylistForOlderVersions"
      />
    </ft-flex-box>
    <ft-prompt
      v-if="showExportSubscriptionsPrompt"
      :label="$t('Settings.Data Settings.Select Export Type')"
      :option-names="exportSubscriptionsPromptNames"
      :option-values="subscriptionsPromptValues"
      @click="exportSubscriptions"
    />
  </ft-settings-section>
</template>

<script src="./data-settings.js" />
