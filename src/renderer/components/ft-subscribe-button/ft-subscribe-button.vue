<template>
  <div class="subscribeButton">
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
      </ft-button>
    </div>
    <template v-if="isProfileDropdownOpen">
      <ul
        ref="profileDropdown"
        tabindex="-1"
        class="profileDropdown bottom"
        @focusout="handleProfileDropdownFocusOut"
      >
        <!-- may want to make role="checkbox" -->
        <li
          v-for="(profile, index) in profileDisplayList"
          :id="'profile-' + index"
          :key="'subscription-profile-' + index"
          class="profile"
          :class="{
            subscribed: isProfileSubscribed(profile),
            unsubscribed: !isProfileSubscribed(profile)
          }"
          :aria-labelledby="'profile-' + index + '-name'"
          :aria-selected="isActiveProfile(profile)"
          :aria-checked="isProfileSubscribed(profile)"
          tabindex="0"
          role="checkbox"
          @click.stop.prevent="handleSubscription(profile)"
          @keydown.space.stop.prevent="handleSubscription(profile)"
        >
          <div
            class="colorOption"
            :style="{ background: profile.bgColor, color: profile.textColor }"
          >
            <div
              class="initial"
            >
              {{ profileInitials[index] }}
            </div>
          </div>
          <p
            :id="'profile-' + index + '-name'"
            class="profileName"
          >
            {{ profile.name }}
          </p>
        </li>
      </ul>
    </template>
  </div>
</template>

<script src="./ft-subscribe-button.js" />
<style src="./ft-subscribe-button.css" />
