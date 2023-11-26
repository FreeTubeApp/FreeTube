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
          :class="{ openedProfile: openSettingsProfile?._id === profile._id }"
          @click="openSettingsForProfileWithId(profile._id)"
        />
      </ft-flex-box>
      <ft-flex-box>
        <ft-button
          v-if="!isNewProfileOpen"
          :label="$t('Profile.Create New Profile')"
          @click="openSettingsForNewProfile"
        />
      </ft-flex-box>
    </ft-card>
    <div
      v-if="openSettingsProfile"
      :key="openSettingsProfileId"
    >
      <ft-profile-channel-list
        v-if="!isNewProfileOpen"
        :profile="openSettingsProfile"
        :is-main-profile="isMainProfile"
      />
      <ft-profile-filter-channels-list
        v-if="!isNewProfileOpen && !isMainProfile"
        :profile="openSettingsProfile"
      />
      <ft-profile-edit
        :profile="openSettingsProfile"
        :is-new="isNewProfileOpen"
        :is-main-profile="isMainProfile"
        @new-profile-created="handleNewProfileCreated"
        @profile-deleted="handleProfileDeleted"
      />
    </div>
  </div>
</template>

<script src="./ProfileSettings.js" />
<style scoped src="./ProfileSettings.css" />
