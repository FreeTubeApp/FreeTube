<template>
  <ft-settings-section
    :title="$t('Settings.SponsorBlock Settings.SponsorBlock Settings')"
  >
    <ft-flex-box class="settingsFlexStart500px">
      <ft-toggle-switch
        :label="$t('Settings.SponsorBlock Settings.Enable SponsorBlock')"
        :default-value="useSponsorBlock"
        @change="handleUpdateSponsorBlock"
      />
      <ft-toggle-switch
        :label="$t('Settings.SponsorBlock Settings.UseDeArrowTitles')"
        :default-value="useDeArrowTitles"
        :tooltip="$t('Tooltips.SponsorBlock Settings.UseDeArrowTitles')"
        @change="handleUpdateUseDeArrowTitles"
      />
    </ft-flex-box>
    <template
      v-if="useSponsorBlock || useDeArrowTitles"
    >
      <ft-flex-box
        v-if="useSponsorBlock"
        class="settingsFlexStart500px"
      >
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
      <ft-flex-box
        v-if="useSponsorBlock"
      >
        <ft-sponsor-block-category
          v-for="category in categories"
          :key="category"
          :category-name="category"
        />
      </ft-flex-box>
    </template>
  </ft-settings-section>
</template>

<script src="./sponsor-block-settings.js" />
