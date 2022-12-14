<template>
    <div>
      <ft-flex-box
        class="settingsFlexStart460px"
      >
        <ft-input
          :placeholder="$t('Settings.Password Dialog.Enter Password To Unlock')"
          :show-action-button="false"
          :show-label="true"
          input-type="password"
          :value="password"
          @input="e => password = e"
        />
        <ft-button
          v-if="!unlocked"
          :label="$t('Settings.Password Dialog.Unlock')"
          @click="handleUnlock"
        />
      </ft-flex-box>
      <ft-prompt
        v-if="showIncorrectPassword"
        :label="$t('Settings.Password Dialog.Password Incorrect')"
        :option-names="[$t('Ok')]"
        :option-values="['ok']"
        @click="handleLock"
      />
    </div>
</template>

<script src="./password-dialog.js" />
