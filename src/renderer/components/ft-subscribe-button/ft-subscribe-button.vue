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
        :aria-label="$t('Profile.Show Unubscribed Profiles')"
        :title="$t('Profile.Show Unsubscribed Profiles')"
        class="subIconButton plusButton"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        @click="showProfileList('subscribed')"
      >
        <font-awesome-icon
          :icon="['fas', 'plus']"
        />
      </ft-button>
      <ft-button
        :aria-label="$t('Profile.Show Subscribed Profiles')"
        :title="$t('Profile.Show Subscribed Profiles')"
        class="subIconButton minusButton"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        @click="showProfileList('unsubscribed')"
      >
        <font-awesome-icon
          :icon="['fas', 'minus']"
        />
      </ft-button>
    </div>
    <div
      v-if="showProfiles === 'subscribed'"
      id="profileList"
    >
      <template
        v-if="notSubscribedProfiles.length > 0"
      >
        <div
          v-for="(profile, index) in notSubscribedProfiles"
          :key="index"
          class="profile"
          tabindex="0"
          :aria-describedby="`susbcribeTip${index}`"
          @keydown.enter.space="subscribe(profile, true, $event)"
          @click="subscribe(profile, true)"
        >
          <div
            class="colorOption"
            :style="{ background: profile.bgColor, color: profile.textColor }"
          >
            <div
              class="initial"
            >
              {{ notSubscribedProfileInitials[index] }}
            </div>
          </div>
          <div
            :id="`susbcribeTip${index}`"
            class="profileName"
            role="tooltip"
          >
            {{ profile.name }}
          </div>
        </div>
      </template>
      <template v-else>
        {{ $t('Profile.All of your profiles are subscribed') }}
      </template>
    </div>
    <div
      v-if="showProfiles === 'unsubscribed'"
      id="profileList"
    >
      <template
        v-if="subscribedProfiles.length > 0"
      >
        <div
          v-for="(profile, index) in subscribedProfiles"
          :key="index"
          class="profile"
          tabindex="0"
          :aria-describedby="`susbcribeTip${index}`"
          @keydown="subscribe(profile, false, $event)"
          @click="subscribe(profile, false)"
        >
          <div
            class="colorOption"
            :style="{ background: profile.bgColor, color: profile.textColor }"
          >
            <div
              class="initial"
            >
              {{ subscribedProfileInitials[index] }}
            </div>
          </div>
          <div
            :id="`susbcribeTip${index}`"
            class="profileName"
            role="tooltip"
          >
            {{ profile.name }}
          </div>
        </div>
      </template>
      <template v-else>
        {{ $t('Profile.None of your profiles are subscribed') }}
      </template>
    </div>
  </div>
</template>

<script src="./ft-subscribe-button.js" />
<style scoped src="./ft-subscribe-button.scss" lang="scss" />
