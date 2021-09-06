<template>
  <div>
    <div
      class="colorOption"
      :title="$t('Profile.Toggle Profile List')"
      :style="{ background: profileList[activeProfile].bgColor, color: profileList[activeProfile].textColor }"
      tabindex="0"
      role="button"
      @click="toggleProfileList"
      @keydown.space.prevent="toggleProfileList"
      @keydown.enter.prevent="toggleProfileList"
    >
      <div
        class="initial"
      >
        {{ profileInitials[activeProfile] }}
      </div>
    </div>
    <ft-card
      id="profileList"
      tabindex="-1"
    >
      <h3
        id="profileListTitle"
        class="profileListTitle"
      >
        {{ $t("Profile.Profile Select") }}
      </h3>
      <div
        class="profileWrapper"
        role="listbox"
        aria-labelledby="profileListTitle"
      >
        <div
          v-for="(profile, index) in profileList"
          :id="'profile-' + index"
          :key="index"
          class="profile"
          :aria-labelledby="'profile-' + $unspace(profile.name)"
          aria-selected="false"
          tabindex="-1"
          role="option"
          @click="setActiveProfile(profile)"
          @keydown="setActiveProfile(profile, $event)"
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
            :id="'profile-' + $unspace(profile.name)"
            class="profileName"
          >
            {{ profile.name }}
          </p>
        </div>
      </div>
      <ft-icon-button
        class="profileSettings"
        :title="$t('Profile.Open Profile Settings')"
        icon="sliders-h"
        role="link"
        @click="openProfileSettings"
      />
    </ft-card>
  </div>
</template>

<script src="./ft-profile-selector.js" />
<style scoped src="./ft-profile-selector.css" />
