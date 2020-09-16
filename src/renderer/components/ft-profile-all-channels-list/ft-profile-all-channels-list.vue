<template>
  <div>
    <ft-card class="card">
      <h2>
        {{ $t("Profile.Other Channels") }}
      </h2>
      <p>
        {{ selectedText }}
      </p>
      <ft-flex-box>
        <ft-channel-bubble
          v-for="(channel, index) in channels"
          :key="index"
          :ref="`all-channels-${index}`"
          :channel-name="channel.name"
          :channel-thumbnail="channel.thumbnail"
          :show-selected="true"
          @click="handleChannelClick(index)"
        />
      </ft-flex-box>
      <ft-flex-box>
        <ft-button
          :label="$t('Profile.Select All')"
          @click="selectAll"
        />
        <ft-button
          :label="$t('Profile.Select None')"
          @click="selectNone"
        />
        <ft-button
          :label="$t('Profile.Add Selected To Profile')"
          text-color="var(--text-with-main-color)"
          background-color="var(--primary-color)"
          @click="addChannelToProfile"
        />
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./ft-profile-all-channels-list.js" />
<style scoped src="./ft-profile-all-channels-list.css" />
