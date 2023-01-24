<template>
  <ft-card
    class="relative"
  >
    <ft-loader
      v-if="isLoading"
    />
    <div
      v-else-if="hasError"
      class="messageContainer"
    >
      <p
        class="message"
      >
        {{ errorMessage }}
      </p>
      <font-awesome-icon
        :icon="['fas', 'exclamation-circle']"
        class="errorIcon"
      />
      <ft-button
        v-if="showEnableChat"
        :label="$t('Video.Enable Live Chat')"
        class="enableLiveChat"
        @click="enableLiveChat"
      />
    </div>
    <div
      v-else-if="comments.length === 0"
      ref="liveChatMessage"
      class="messageContainer liveChatMessage"
    >
      <p
        class="message"
      >
        {{ $t("Video['Live chat is enabled.  Chat messages will appear here once sent.']") }}
      </p>
    </div>
    <div
      v-else
      class="relative"
    >
      <h4>{{ $t("Video.Live Chat") }}</h4>
      <div
        v-if="superChatComments.length > 0"
        class="superChatComments"
      >
        <div
          v-for="(comment, index) in superChatComments"
          :key="index"
          :aria-label="$t('Video.Show Super Chat Comment')"
          :style="{ backgroundColor: 'var(--primary-color)' }"
          class="superChat"
          :class="comment.superChat.colorClass"
          role="button"
          tabindex="0"
          @click="showSuperChatComment(comment)"
          @keydown.space.prevent="showSuperChatComment(comment)"
          @keydown.enter.prevent="showSuperChatComment(comment)"
        >
          <img
            :src="comment.author.thumbnailUrl"
            class="channelThumbnail"
            alt=""
          >
          <p
            class="superChatContent"
          >
            <span
              class="donationAmount"
            >
              {{ comment.superChat.amount }}
            </span>
          </p>
        </div>
      </div>
      <div
        v-if="showSuperChat"
        class="openedSuperChat"
        :class="superChat.superChat.colorClass"
        role="button"
        tabindex="0"
        @click="showSuperChat = false"
        @keydown.space.prevent="showSuperChat = false"
        @keydown.enter.prevent="showSuperChat = false"
      >
        <div
          class="superChatMessage"
          @click.stop.prevent
        >
          <div
            class="upperSuperChatMessage"
          >
            <img
              :src="superChat.author.thumbnailUrl"
              class="channelThumbnail"
              alt=""
            >
            <p
              class="channelName"
            >
              {{ superChat.author.name }}
            </p>
            <p
              class="donationAmount"
            >
              {{ superChat.superChat.amount }}
            </p>
          </div>
          <p
            class="chatMessage"
            v-html="superChat.message"
          />
        </div>
      </div>
      <div
        ref="liveChatComments"
        class="liveChatComments"
        :style="{ height: chatHeight }"
        @mousewheel="e => onScroll(e)"
      >
        <div
          v-for="(comment, index) in comments"
          :key="index"
          class="comment"
          :class="comment.superChat ? `superChatMessage ${comment.superChat.colorClass}` : ''"
        >
          <template
            v-if="comment.superChat"
          >
            <div
              class="upperSuperChatMessage"
            >
              <img
                :src="comment.author.thumbnailUrl"
                class="channelThumbnail"
                alt=""
              >
              <p
                class="channelName"
              >
                {{ comment.author.name }}
              </p>
              <p
                class="donationAmount"
              >
                {{ comment.superChat.amount }}
              </p>
            </div>
            <p
              v-if="comment.message"
              class="chatMessage"
              v-html="comment.message"
            />
          </template>
          <template
            v-else
          >
            <img
              :src="comment.author.thumbnailUrl"
              class="channelThumbnail"
              alt=""
            >
            <p
              class="chatContent"
            >
              <span
                class="channelName"
                :class="{
                  member: comment.author.isMember,
                  moderator: comment.author.isModerator,
                  owner: comment.author.isOwner
                }"
              >
                {{ comment.author.name }}
              </span>
              <span
                v-if="comment.author.badge"
                class="badge"
              >
                <img
                  :src="comment.author.badge.url"
                  alt=""
                  :title="comment.author.badge.tooltip"
                  class="badgeImage"
                >
              </span>
              <span
                class="chatMessage"
                v-html="comment.message"
              />
            </p>
          </template>
        </div>
      </div>
      <div
        v-if="showScrollToBottom"
        class="scrollToBottom"
        :aria-label="$t('Video.Scroll to Bottom')"
        role="button"
        tabindex="0"
        @click="scrollToBottom"
        @keydown.space.prevent="scrollToBottom"
        @keydown.enter.prevent="scrollToBottom"
      >
        <font-awesome-icon
          class="icon"
          :icon="['fas', 'arrow-down']"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-live-chat.js" />
<style scoped src="./watch-video-live-chat.css" />
