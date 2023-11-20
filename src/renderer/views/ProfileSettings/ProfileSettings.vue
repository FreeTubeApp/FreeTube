<template>
  <div>
    <ft-card class="card">
      <h2>{{ $t("Profile.Profile Manager") }}</h2>
      <ft-flex-box
        class="profileList"
      >
        <ft-profile-bubble
          v-for="(profile, index) in profileList"
          :key="index"
          :profile-id="profile._id"
          :profile-name="profile.name"
          :background-color="profile.bgColor"
          :text-color="profile.textColor"
          @click="openSettingsForProfile(profile)"
        />
      </ft-flex-box>
      <ft-flex-box>
        <ft-button
          v-if="!isOpenProfileNew"
          :label="$t('Profile.Create New Profile')"
          @click="openSettingsForNewProfile"
        />
      </ft-flex-box>
    </ft-card>
    <div v-if="openSettingsProfile">
      <ft-profile-channel-list
        v-if="!isOpenProfileNew"
        :profile="openSettingsProfile"
        :is-main-profile="isMainProfile"
      />
      <ft-profile-filter-channels-list
        v-if="!isOpenProfileNew && !isMainProfile"
        :profile="openSettingsProfile"
      />
      <ft-profile-edit
        :profile="openSettingsProfile"
        :is-new="isOpenProfileNew"
        :is-main-profile="isMainProfile"
      />
    </div>
  </div>
</template>

<script src="./ProfileSettings.js" />
<style scoped src="./ProfileSettings.css" />
