<template>
  <div>
    <div
      class="colorOption"
      :style="{ background: activeProfile.bgColor, color: activeProfile.textColor }"
      @click="toggleProfileList"
    >
      <div
        class="initial"
      >
        {{ activeProfileInitial }}
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
      <ft-icon-button
        class="profileSettings"
        icon="sliders-h"
        @click="openProfileSettings"
      />
      <div
        class="profileWrapper"
      >
        <div
          v-for="(profile, index) in profileList"
          :key="index"
          class="profile"
          @click="setActiveProfile(profile)"
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
      </div>
    </ft-card>
  </div>
</template>

<script src="./ft-profile-selector.js" />
<style scoped src="./ft-profile-selector.css" />
