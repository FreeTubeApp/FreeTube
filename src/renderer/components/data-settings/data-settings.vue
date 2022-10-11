<template>
  <ft-settings-section
    :title="$t('Settings.Data Settings.Data Settings')"
  >
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.Data Settings.Import Subscriptions')"
        @click="importSubscriptions"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Export Subscriptions')"
        @click="showExportSubscriptionsPrompt = true"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Import History')"
        @click="importHistory"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Export History')"
        @click="exportHistory"
      />
    </ft-flex-box>
    <ft-flex-box>
      <a
        class="center"
        href="https://docs.freetubeapp.io/usage/importing-subscriptions/"
      >
        <p>
          {{ $t("Settings.Data Settings.How do I import my subscriptions?") }}
        </p>
      </a>
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.Data Settings.Manage Subscriptions')"
        @click="openProfileSettings"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.Data Settings.Import Playlists')"
        @click="importPlaylists"
      />
      <ft-button
        :label="$t('Settings.Data Settings.Export Playlists')"
        @click="exportPlaylists"
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
