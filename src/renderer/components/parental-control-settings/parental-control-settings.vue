<template>
  <ft-card
    class="relative card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.Parental Control Settings.Parental Control Settings") }}
    </h3>
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Parental Control Settings.Hide Unsubscribe')"
          :compact="true"
          :default-value="hideUnsubscribe"
          @change="updateHideUnsubscribe"
        />
        <ft-toggle-switch
          :label="$t('Settings.Parental Control Settings.Hide Live Streams')"
          :compact="true"
          :default-value="hideLiveStreams"
          @change="updateHideLiveStreams"
        />
        <ft-toggle-switch
          :label="$t('Settings.Parental Control Settings.Show Family Friendly Only')"
          :compact="true"
          :default-value="showFamilyFriendlyOnly"
          @change="updateShowFamilyFriendlyOnly"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Parental Control Settings.Hide Comments')"
          :compact="true"
          :default-value="hideComments"
          @change="updateHideComments"
        />
        <ft-toggle-switch
          :label="$t('Settings.Parental Control Settings.Hide Share')"
          :compact="true"
          :default-value="hideShare"
          @change="updateHideShare"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./parental-control-settings.js" />
<style scoped lang="sass" src="./parental-control-settings.sass" />
