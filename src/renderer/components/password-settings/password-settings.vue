<template>
  <ft-settings-section
    :title="$t('Settings.Password Settings.Password Settings')"
  >
    <div>
      <ft-flex-box
        v-if="hasStoredPassword"
        class="settingsFlexStart460px"
      >
        <ft-button
          :label="$t('Settings.Password Settings.Remove Password')"
          @click="handleRemovePassword"
        />
      </ft-flex-box>
      <ft-flex-box
        v-else
        class="settingsFlexStart460px"
      >
        <ft-input
          :placeholder="$t('Settings.Password Settings.Set Password To Prevent Access')"
          :show-action-button="false"
          :show-label="true"
          input-type="password"
          :value="password"
          @input="e => password = e"
        />
        <ft-button
          :label="$t('Settings.Password Settings.Set Password')"
          @click="handleSetPassword"
        />
      </ft-flex-box>
    </div>
  </ft-settings-section>
</template>

<script src="./password-settings.js" />
