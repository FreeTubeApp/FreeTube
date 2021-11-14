<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.SponsorBlock Settings.SponsorBlock Settings") }}
      </h3>
    </summary>
    <hr>
    <ft-flex-box class="sponsorBlockSettingsFlexBox">
      <ft-toggle-switch
        :label="$t('Settings.SponsorBlock Settings.Enable SponsorBlock')"
        :default-value="useSponsorBlock"
        @change="handleUpdateSponsorBlock"
      />
    </ft-flex-box>
    <div
      v-if="useSponsorBlock"
    >
      <ft-flex-box class="sponsorBlockSettingsFlexBox">
        <ft-toggle-switch
          :label="$t('Settings.SponsorBlock Settings.Notify when sponsor segment is skipped')"
          :default-value="sponsorBlockShowSkippedToast"
          @change="handleUpdateSponsorBlockShowSkippedToast"
        />
      </ft-flex-box>
      <ft-flex-box>
        <ft-input
          :placeholder="$t('Settings.SponsorBlock Settings[\'SponsorBlock API Url (Default is https://sponsor.ajay.app)\']')"
          :show-action-button="false"
          :show-label="true"
          :value="sponsorBlockUrl"
          @input="handleUpdateSponsorBlockUrl"
        />
      </ft-flex-box>
    </div>
  </details>
</template>

<script src="./sponsor-block-settings.js" />
<style scoped lang="sass" src="./sponsor-block-settings.sass" />
