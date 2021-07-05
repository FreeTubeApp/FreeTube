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
          :label="$t('Settings.Parental Control Settings.Hide Unsubscribe Button')"
          :compact="true"
          :default-value="hideUnsubscribeButton"
          @change="updateHideUnsubscribeButton"
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
          :label="$t('Settings.Parental Control Settings.Hide Search Bar')"
          :compact="true"
          :default-value="hideSearchBar"
          @change="updateHideSearchBar"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./parental-control-settings.js" />
<style scoped lang="sass" src="./parental-control-settings.sass" />
