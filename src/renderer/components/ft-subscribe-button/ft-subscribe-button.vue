<template>
  <div
    class="buttonList"
    :class="{ hasProfileDropdownToggle: isProfileDropdownEnabled}"
  >
    <ft-button
      :label="subscribedText"
      :no-border="true"
      class="subscribeButton"
      background-color="var(--primary-color)"
      text-color="var(--text-with-main-color)"
      @click="handleSubscription"
    />
    <ft-button
      v-if="isProfileDropdownEnabled"
      :no-border="true"
      :title="isProfileDropdownOpen ? $t('Profile.Close Profile Dropdown') : $t('Profile.Open Profile Dropdown')"
      class="profileDropdownToggle"
      background-color="var(--primary-color)"
      text-color="var(--text-with-main-color)"
      @click="toggleProfileDropdown"
    >
      <font-awesome-icon
        :icon="isProfileDropdownOpen ? ['fas', 'angle-up'] : ['fas', 'angle-down']"
      />
      <!-- :icon="['fas', isProfileDropdownOpen ? 'angle-up' : 'angle-down']" -->
    </ft-button>
  </div>
</template>

<script src="./ft-subscribe-button.js" />
<style src="./ft-subscribe-button.css" />
