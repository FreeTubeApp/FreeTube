<template>
  <ft-icon-button
    ref="iconButton"
    :title="$t(`Share.Share ${shareTargetType}`)"
    :theme="isVideo?'secondary':'base-no-default'"
    :icon="['fas', 'share-alt']"
    dropdown-position-x="left"
    :force-dropdown="true"
  >
    <ft-flex-box>
      <ft-toggle-switch
        v-if="isVideo"
        :label="$t('Share.Include Timestamp')"
        :compact="true"
        :default-value="includeTimestamp"
        @change="updateIncludeTimestamp"
      />
    </ft-flex-box>
    <div class="shareLinks">
      <div class="header">
        <img
          id="youtubeShareImage"
          class="youtubeLogo"
          src="~../../assets/img/yt_logo_mono_dark.png"
          alt="YouTube"
          width="794"
          height="178"
        >
      </div>

      <div class="buttons">
        <ft-button
          class="action"
          aria-describedby="youtubeShareImage"
          @click="copyYoutube()"
        >
          <font-awesome-icon :icon="['fas', 'copy']" />
          {{ $t("Share.Copy Link") }}
        </ft-button>
        <ft-button
          class="action"
          aria-describedby="youtubeShareImage"
          @click="openYoutube()"
        >
          <font-awesome-icon :icon="['fas', 'globe']" />
          {{ $t("Share.Open Link") }}
        </ft-button>
        <ft-button
          v-if="isVideo"
          class="action"
          aria-describedby="youtubeShareImage"
          background-color="var(--accent-color-active)"
          @click="copyYoutubeEmbed()"
        >
          <font-awesome-icon :icon="['fas', 'copy']" />
          {{ $t("Share.Copy Embed") }}
        </ft-button>
        <ft-button
          v-if="isVideo"
          class="action"
          aria-describedby="youtubeShareImage"
          background-color="var(--accent-color-active)"
          @click="openYoutubeEmbed()"
        >
          <font-awesome-icon :icon="['fas', 'globe']" />
          {{ $t("Share.Open Embed") }}
        </ft-button>
      </div>

      <div class="divider" />

      <div
        id="invidiousShare"
        class="header invidious"
      >
        <span class="invidiousLogo" />Invidious
      </div>

      <div class="buttons">
        <ft-button
          aria-describedby="invidiousShare"
          class="action"
          @click="copyInvidious()"
        >
          <font-awesome-icon :icon="['fas', 'copy']" />
          {{ $t("Share.Copy Link") }}
        </ft-button>
        <ft-button
          aria-describedby="invidiousShare"
          class="action"
          @click="openInvidious()"
        >
          <font-awesome-icon :icon="['fas', 'globe']" />
          {{ $t("Share.Open Link") }}
        </ft-button>
        <ft-button
          v-if="isVideo"
          aria-describedby="invidiousShare"
          class="action"
          background-color="var(--accent-color-active)"
          @click="copyInvidiousEmbed()"
        >
          <font-awesome-icon :icon="['fas', 'copy']" />
          {{ $t("Share.Copy Embed") }}
        </ft-button>
        <ft-button
          v-if="isVideo"
          aria-describedby="invidiousShare"
          class="action"
          background-color="var(--accent-color-active)"
          @click="openInvidiousEmbed()"
        >
          <font-awesome-icon :icon="['fas', 'globe']" />
          {{ $t("Share.Open Embed") }}
        </ft-button>
      </div>
    </div>
  </ft-icon-button>
</template>

<script src="./ft-share-button.js" />
<style scoped lang="sass" src="./ft-share-button.sass" />
