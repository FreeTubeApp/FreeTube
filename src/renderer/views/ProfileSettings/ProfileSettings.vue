<template>
  <div>
    <ft-card class="card">
      <h3>{{ $t("Profile.Profile Manager") }}</h3>
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
        />
      </ft-flex-box>
      <ft-flex-box>
        <ft-button
          :label="$t('Profile.Create New Profile')"
          @click="newProfile"
        />
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./ProfileSettings.js" />
<style scoped src="./ProfileSettings.css" />
