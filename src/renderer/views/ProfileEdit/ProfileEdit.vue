<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-else
    >
      <ft-profile-edit
        :profile="profile"
        :is-new="isNew"
      />
      <ft-profile-channel-list
        v-if="!isNew"
        :profile="profile"
        :is-main-profile="isMainProfile"
      />
      <ft-profile-filter-channels-list
        v-if="!isNew && !isMainProfile"
        :profile="profile"
      />
    </div>
  </div>
</template>

<script src="./ProfileEdit.js" />
<style scoped src="./ProfileEdit.css" />
