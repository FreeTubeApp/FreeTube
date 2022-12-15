<template>
  <div>
    <ft-card
      class="card"
    >
      <h3>{{ $t("Settings.Password Dialog.Enter Password To Unlock") }}</h3>

      <ft-flex-box>
        <ft-input
          ref="password"
          :placeholder="$t('Settings.Password Dialog.Password')"
          :show-action-button="false"
          input-type="password"
          class="passwordInput"
          :value="password"
          @input="e => password = e"
        />
      </ft-flex-box>
      <ft-prompt
        v-if="showIncorrectPassword"
        :label="$t('Settings.Password Dialog.Password Incorrect')"
        :option-names="[$t('Ok')]"
        :option-values="['ok']"
        @click="handleLock"
      />
    </ft-card>
  </div>
</template>

<script src="./password-dialog.js" />
<style scoped src="./password-dialog.css" />
