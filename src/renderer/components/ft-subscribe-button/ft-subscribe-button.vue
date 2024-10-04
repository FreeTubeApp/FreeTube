<template>
  <div
    ref="subscribeButton"
    class="ftSubscribeButton"
    :class="{ dropdownOpened: isProfileDropdownOpen}"
    @focusout="handleProfileDropdownFocusOut"
  >
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
      <ft-prompt
        v-if="showUnsubscribePopupForProfile !== null"
        :label="$t('Channels.Unsubscribe Prompt', { channelName: channelName })"
        :option-names="[$t('Yes'), $t('No')]"
        :option-values="['yes', 'no']"
        :autosize="true"
        @click="handleUnsubscribeConfirmation"
      />
      <ft-button
        v-if="isProfileDropdownEnabled"
        :no-border="true"
        :title="isProfileDropdownOpen ? $t('Profile.Close Profile Dropdown') : $t('Profile.Open Profile Dropdown')"
        class="profileDropdownToggle"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        :aria-expanded="isProfileDropdownOpen"
        @click="toggleProfileDropdown"
      >
        <font-awesome-icon
          :icon="isProfileDropdownOpen ? ['fas', 'angle-up'] : ['fas', 'angle-down']"
        />
      </ft-button>
    </div>
    <template v-if="isProfileDropdownOpen">
      <div
        tabindex="-1"
        class="profileDropdown"
      >
        <ul
          class="profileList"
        >
          <li
            v-for="(profile, index) in profileDisplayList"
            :id="'subscription-profile-' + index"
            :key="index"
            class="profile"
            :class="{
              subscribed: isProfileSubscribed(profile)
            }"
            :aria-labelledby="'subscription-profile-' + index + '-name'"
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
                {{ isProfileSubscribed(profile) ? $t('checkmark') : profileInitials[index] }}
              </div>
            </div>
            <p
              :id="'subscription-profile-' + index + '-name'"
              class="profileName"
            >
              {{ profile.name }}
            </p>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script src="./ft-subscribe-button.js" />
<style scoped lang="scss" src="./ft-subscribe-button.scss" />
