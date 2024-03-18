<template>
  <div>
    <div
      ref="iconButton"
      class="colorOption"
      :title="$t('Profile.Toggle Profile List')"
      :style="{ background: activeProfile.bgColor, color: activeProfile.textColor }"
      tabindex="0"
      role="button"
      :aria-expanded="profileListShown"
      aria-controls="profileSelectorList"
      @click="toggleProfileList"
      @mousedown="handleIconMouseDown"
      @keydown.space.prevent="toggleProfileList"
      @keydown.enter.prevent="toggleProfileList"
    >
      <div
        class="initial"
      >
        {{ activeProfileInitial }}
      </div>
    </div>
    <ft-card
      v-show="profileListShown"
      id="profileSelectorList"
      ref="profileList"
      class="profileList"
      tabindex="-1"
      @focusout.native="handleProfileListFocusOut"
      @keydown.native.esc.stop="handleProfileListEscape"
    >
      <h3
        id="profileListTitle"
        class="profileListTitle"
      >
        {{ $t("Profile.Profile Select") }}
      </h3>
      <ft-icon-button
        class="profileSettings"
        :icon="['fas', 'sliders-h']"
        @click="openProfileSettings"
      />
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
          :aria-labelledby="'profile-' + index + '-name'"
          :aria-selected="isActiveProfile(profile)"
          tabindex="0"
          role="option"
          @click="setActiveProfile(profile)"
          @keydown.enter.prevent="setActiveProfile(profile, $event)"
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
            {{ translatedProfileName(profile) }}
          </p>
        </div>
      </div>
    </ft-card>
  </div>
</template>

<script src="./ft-profile-selector.js" />
<style scoped src="./ft-profile-selector.css" />
