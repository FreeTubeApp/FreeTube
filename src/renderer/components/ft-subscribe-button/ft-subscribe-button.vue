<template>
  <div>
    <div class="buttons">
      <ft-button
        :label="subscribedText"
        class="subscribeButton"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        @click="handleSubscription"
      />
      <ft-button
        class="plusButton"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        @click="showProfileList"
      >
        <font-awesome-icon
          icon="plus"
        />
      </ft-button>
    </div>
    <div
      v-if="showProfiles"
      id="profileList"
    >
      <div
        v-for="(profile, index) in profileList"
        :key="index"
        class="profile"
        @click="subscribe(profile)"
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
          <div
            class="profileName"
          >
            {{ profile.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./ft-subscribe-button.js" />
<style scoped src="./ft-subscribe-button.sass" lang="sass"/>
