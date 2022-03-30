<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.Distraction Free Settings.Distraction Free Settings") }}
      </h3>
    </summary>
    <hr>
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Video Views')"
          :compact="true"
          :default-value="hideVideoViews"
          @change="updateHideVideoViews"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Video Likes And Dislikes')"
          :compact="true"
          :default-value="hideVideoLikesAndDislikes"
          @change="updateHideVideoLikesAndDislikes"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Channel Subscribers')"
          :compact="true"
          :default-value="hideChannelSubscriptions"
          @change="updateHideChannelSubscriptions"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Comment Likes')"
          :compact="true"
          :default-value="hideCommentLikes"
          @change="updateHideCommentLikes"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Active Subscriptions')"
          :compact="true"
          :default-value="hideActiveSubscriptions"
          @change="updateHideActiveSubscriptions"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Recommended Videos')"
          :compact="true"
          :default-value="hideRecommendedVideos"
          @change="handleHideRecommendedVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Trending Videos')"
          :compact="true"
          :default-value="hideTrendingVideos"
          @change="updateHideTrendingVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Popular Videos')"
          :compact="true"
          :default-value="hidePopularVideos"
          @change="updateHidePopularVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Playlists')"
          :compact="true"
          :default-value="hidePlaylists"
          @change="updateHidePlaylists"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Live Chat')"
          :compact="true"
          :default-value="hideLiveChat"
          @change="updateHideLiveChat"
        />
      </div>
    </div>
    <br>
    <div class="channelBlockerSection">
      <h4>Channel Blocker</h4>
      <ft-flex-box class="switchColumnGrid">
        <ft-toggle-switch
          label="Skip to Next Video"
          tooltip="Skips only if &quot;Autoplay Playlists&quot; or &quot;Play Next Video&quot; is enabled in Player Settings"
          :compact="true"
          :default-value="channelBlockerSkipBlocked"
          @change="updateChannelBlockerSkipBlocked"
        />
        <ft-toggle-switch
          label="Enable Temporary Unblocking"
          :compact="true"
          :default-value="channelBlockerAllowTempUnblock"
          @change="updateChannelBlockerAllowTempUnblock"
        />
      </ft-flex-box>
      <ft-input
        id="channel_blocker_search_input"
        :label="$t('Settings.Distraction Free Settings.Blocked Channels')"
        :show-action-button="false"
        :show-clear-text-button="true"
        :placeholder="$t('Settings.Distraction Free Settings.ChannelBlocker Search bar placeholder')"
        @input="filterChannelBlockerList"
      />
      <ft-flex-box
        v-if="channelBlockerShownList.length === 0"
      >
        <p
          v-if="!channelBlockerHasQuery"
          class="message"
        >
          {{ $t('Settings.Distraction Free Settings.ChannelBlocker Empty List') }}
        </p>
        <p
          v-else
          class="message"
        >
          {{ $t('Settings.Distraction Free Settings.ChannelBlocker Empty Search Result') }}
        </p>
      </ft-flex-box>
      <ul
        v-else
        class="channelBlockerSettingsBlockedList"
      >
        <li
          v-for="item in channelBlockerShownList"
          :key="item.authorId"
          class="channelBlockerSettingsBlockedListItem"
        >
          <span
            class="channelBlockerSettingsBlockedListRemoveButton"
            @click="onChannelBlockerRemoveButtonClicked(item)"
          >
            <font-awesome-icon
              icon="times"
            />
          </span>
          <span
            class="channelBlockerSettingsBlockedListName"
          >
            <a
              class="channelName"
              :href="`#/channel/${item.authorId}`"
            >
              {{ item.author }}
            </a>
          </span>
        </li>
      </ul>
    </div>
    <ft-prompt
      v-if="showChannelBlockerRemovePrompt"
      :label="channelBlockerPromptText"
      :option-names="promptNames"
      :option-values="promptValues"
      @click="removeChannelFromBlockList"
    />
    <br>
    <ft-flex-box>
      <ft-select
        v-if="false"
        placeholder="Distraction View Type"
        :value="viewValues[0]"
        :select-names="viewNames"
        :select-values="viewValues"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-button
        v-if="false"
        label="Manage My Distractions"
      />
    </ft-flex-box>
  </details>
</template>

<script src="./distraction-settings.js" />
<style scoped lang="sass" src="./distraction-settings.sass" />
