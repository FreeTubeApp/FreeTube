<template>
  <div>
    <ft-card class="card">
      <h2>
        {{ $t("Profile.Subscription List") }}
      </h2>
      <p class="selectedCount">
        {{ selectedText }}
      </p>
      <ft-flex-box>
        <ft-channel-bubble
          v-for="(channel, index) in subscriptions"
          :key="index"
          :ref="`channel-${index}`"
          :channel-id="channel.id"
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
          :label="$t('Profile.Delete Selected')"
          text-color="var(--destructive-text-color)"
          background-color="var(--destructive-color)"
          @click="displayDeletePrompt"
        />
      </ft-flex-box>
    </ft-card>
    <ft-prompt
      v-if="showDeletePrompt"
      :label="deletePromptMessage"
      :option-names="deletePromptNames"
      :option-values="deletePromptValues"
      :is-first-option-destructive="true"
      @click="handleDeletePromptClick"
    />
  </div>
</template>

<script src="./ft-profile-channel-list.js" />
<style scoped src="./ft-profile-channel-list.css" />
