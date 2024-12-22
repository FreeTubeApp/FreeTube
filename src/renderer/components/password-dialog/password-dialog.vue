<template>
  <ft-card
    class="card"
  >
    <h3>{{ $t("Settings.Password Dialog.Enter Password To Unlock") }}</h3>

    <ft-input
      ref="password"
      :placeholder="$t('Settings.Password Dialog.Password')"
      :show-action-button="false"
      input-type="password"
      class="passwordInput"
      @input="handlePasswordInput"
    />
  </ft-card>
</template>

<script src="./password-dialog.js" />
<style scoped src="./password-dialog.css" />
