<template>
  <ft-settings-section
    :title="$t('Settings.Password Settings.Password Settings')"
  >
    <div>
      <ft-flex-box
        v-if="(hasStoredPassword && !unlocked)"
        class="settingsFlexStart460px"
      >
        <ft-input
          :placeholder="$t('Settings.Password Settings.Enter Password To Unlock')"
          :show-action-button="false"
          :show-label="true"
          input-type="password"
          :value="password"
          @input="e => password = e"
        />
        <ft-button
          v-if="!unlocked"
          :label="$t('Settings.Password Settings.Unlock')"
          @click="handleUnlock"
        />
      </ft-flex-box>
      <ft-prompt
        v-if="showIncorrectPassword"
        :label="$t('Settings.Password Settings.Password Incorrect')"
        :option-names="[$t('Ok')]"
        :option-values="['ok']"
        @click="handleLock"
      />
      <ft-flex-box
        v-if="(hasStoredPassword && unlocked)"
        class="settingsFlexStart460px"
      >
        <ft-input
          :placeholder="$t('Settings.Password Settings.Settings Unlocked')"
          :show-action-button="false"
          :show-label="true"
          input-type="password"
          :value="password"
          @input="e => password = e"
        />
        <ft-button
          :label="$t('Settings.Password Settings.Lock')"
          @click="handleLock"
        />
        <ft-button
          :label="$t('Settings.Password Settings.Remove Password')"
          @click="handleRemovePassword"
        />
      </ft-flex-box>
      <ft-flex-box
        v-if="!hasStoredPassword"
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
