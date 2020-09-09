<template>
  <ft-card
    class="relative card"
  >
    <h3>
      {{ $t("Settings.Data Settings.Data Settings") }}
    </h3>
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.Data Settings.Import Subscriptions')"
        @click="showImportSubscriptionsPrompt = true"
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
    <ft-prompt
      v-if="showImportSubscriptionsPrompt"
      :label="$t('Settings.Data Settings.Select Import Type')"
      :option-names="importSubscriptionsPromptNames"
      :option-values="subscriptionsPromptValues"
      @click="importSubscriptions"
    />
    <ft-prompt
      v-if="showExportSubscriptionsPrompt"
      :label="$t('Settings.Data Settings.Select Export Type')"
      :option-names="exportSubscriptionsPromptNames"
      :option-values="subscriptionsPromptValues"
      @click="exportSubscriptions"
    />
  </ft-card>
</template>

<script src="./data-settings.js" />
<style scoped lang="sass" src="./data-settings.sass" />
