<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-else
    >
      <ft-profile-channel-list
        v-if="!isNew"
        :profile="profile"
        :is-main-profile="isMainProfile"
      />
      <ft-profile-filter-channels-list
        v-if="!isNew && !isMainProfile"
        :profile="profile"
      />
      <ft-profile-edit
        :profile="profile"
        :is-new="isNew"
      />
    </div>
  </div>
</template>

<script src="./ProfileEdit.js" />
