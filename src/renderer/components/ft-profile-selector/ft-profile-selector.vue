<template>
  <div>
    <div
      class="colorOption"
      :style="{ background: profileList[activeProfile].bgColor, color: profileList[activeProfile].textColor }"
      @click="toggleProfileList"
      @keydown="toggleProfileList($event)"
      tabindex="0"
      role="button"
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
        class="profileListTitle"
      >
        {{ $t("Profile.Profile Select") }}
      </h3>
      <div
        class="profileWrapper"
      >
        <div
          v-for="(profile, index) in profileList"
          :key="index"
          class="profile"
          @click="setActiveProfile(profile)"
          @keydown="setActiveProfile(profile, $event)"
          tabindex="-1"
          role="button"
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
            class="profileName"
          >
            {{ profile.name }}
          </p>
        </div>
        <ft-icon-button
          class="profileSettings"
          icon="sliders-h"
          @click="openProfileSettings"
          role="link"
        />
      </div>
    </ft-card>
  </div>
</template>

<script src="./ft-profile-selector.js" />
<style scoped src="./ft-profile-selector.css" />
