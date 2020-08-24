<template>
  <div>
    <ft-card class="card">
      <h3>{{ $t("Profile.Profile Manager") }}</h3>
      <ft-flex-box>
        <ft-profile-bubble
          v-for="(profile, index) in profileList"
          :key="index"
          :profile-id="profile._id"
          :profile-name="profile.name"
          :background-color="profile.bgColor"
          :text-color="profile.textColor"
        />
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./ProfileSettings.js" />
<style scoped src="./ProfileSettings.css" />
