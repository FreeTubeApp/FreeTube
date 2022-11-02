<template>
  <ft-card
    v-if="!hideLiveChat"
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
          class="superChat"
          :class="comment.superchat.colorClass"
          @click="showSuperChatComment(comment)"
        >
          <img
            :src="comment.author.thumbnail.url"
            class="channelThumbnail"
          >
          <p
            class="superChatContent"
          >
            <span
              class="donationAmount"
            >
              {{ comment.superchat.amount }}
            </span>
          </p>
        </div>
      </div>
      <div
        v-if="showSuperChat"
        class="openedSuperChat"
        :class="superChat.superchat.colorClass"
        @click="showSuperChat = false"
      >
        <div
          class="superChatMessage"
          @click="e => preventDefault(e)"
        >
          <div
            class="upperSuperChatMessage"
          >
            <img
              :src="superChat.author.thumbnail.url"
              class="channelThumbnail"
            >
            <p
              class="channelName"
            >
              {{ superChat.author.name }}
            </p>
            <p
              class="donationAmount"
            >
              {{ superChat.superchat.amount }}
            </p>
          </div>
          <p
            v-if="superChat.message.length > 0"
            class="chatMessage"
            v-html="superChat.messageHtml"
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
          :class="{ superChatMessage: typeof (comment.superchat) !== 'undefined' }"
        >
          <div
            v-if="typeof (comment.superchat) !== 'undefined'"
            :class="comment.superchat.colorClass"
          >
            <div
              class="upperSuperChatMessage"
            >
              <img
                :src="comment.author.thumbnail.url"
                class="channelThumbnail"
              >
              <p
                class="channelName"
              >
                {{ comment.author.name }}
              </p>
              <p
                class="donationAmount"
              >
                {{ comment.superchat.amount }}
              </p>
            </div>
            <p
              v-if="comment.message.length > 0"
              class="chatMessage"
              v-html="comment.messageHtml"
            />
          </div>
          <template
            v-else
          >
            <img
              :src="comment.author.thumbnail.url"
              class="channelThumbnail"
            >
            <p
              class="chatContent"
            >
              <span
                class="channelName"
                :class="{
                  member: typeof (comment.author.badge) !== 'undefined' || comment.membership,
                  moderator: comment.isOwner,
                  owner: comment.author.name === channelName
                }"
              >
                {{ comment.author.name }}
              </span>
              <span
                v-if="typeof (comment.author.badge) !== 'undefined'"
                class="badge"
              >
                <img
                  :src="comment.author.badge.thumbnail.url"
                  :alt="comment.author.badge.thumbnail.alt"
                  :title="comment.author.badge.thumbnail.alt"
                  class="badgeImage"
                >
              </span>
              <span
                v-if="comment.message.length > 0"
                class="chatMessage"
                v-html="comment.messageHtml"
              />
            </p>
          </template>
        </div>
      </div>
      <div
        v-if="showScrollToBottom"
        class="scrollToBottom"
        @click="scrollToBottom"
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
