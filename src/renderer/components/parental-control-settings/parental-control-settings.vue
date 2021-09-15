<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.Parental Control Settings.Parental Control Settings") }}
      </h3>
    </summary>
    <hr>
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
  </details>
</template>

<script src="./parental-control-settings.js" />
<style scoped lang="sass" src="./parental-control-settings.sass" />
