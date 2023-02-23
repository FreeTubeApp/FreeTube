<template>
  <ft-settings-section
    :title="$t('Settings.Return YouTube Dislikes Settings.Return YouTube Dislikes Settings')"
  >
    <ft-flex-box class="settingsFlexStart500px">
      <ft-toggle-switch
        :label="$t('Settings.Return YouTube Dislikes Settings.Enable Return YouTube Dislikes')"
        :default-value="useReturnYoutubeDislikes"
        @change="handleUpdateUseReturnYoutubeDislike"
      />
    </ft-flex-box>
    <div
      v-if="useReturnYoutubeDislikes"
    >
      <ft-flex-box>
        <ft-input
          :placeholder="$t('Settings.Return YouTube Dislikes Settings.Return YouTube Dislikes Url')"
          :show-action-button="false"
          :show-label="true"
          :data-list="returnYoutubeDislikesInstances"
          :value="returnYoutubeDislikesUrl"
          @input="handleUpdateReturnYouTubeDislikesUrl"
        />
      </ft-flex-box>
    </div>
  </ft-settings-section>
</template>

<script src="./ryd-settings.js" />
