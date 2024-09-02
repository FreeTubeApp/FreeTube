<template>
  <ft-card
    class="card"
  >
    <h3
      v-if="commentData.length > 0 && !isLoading && showComments"
      class="commentsTitle"
    >
      {{ $t("Comments.Comments") }}
      <span
        class="hideComments"
        role="button"
        tabindex="0"
        @click="showComments = false"
        @keydown.space.prevent="showComments = false"
        @keydown.enter.prevent="showComments = false"
      >
        {{ $t("Comments.Hide Comments") }}
      </span>
    </h3>
    <h4
      v-if="canPerformInitialCommentLoading"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="getCommentData"
      @keydown.space.prevent="getCommentData"
      @keydown.enter.prevent="getCommentData"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <h4
      v-if="commentData.length > 0 && !isLoading && !showComments"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="showComments = true"
      @keydown.space.prevent="showComments = true"
      @keydown.enter.prevent="showComments = true"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <ft-select
      v-if="commentData.length > 0 && !isLoading && showComments"
      class="commentSort"
      :placeholder="$t('Comments.Sort by')"
      :value="currentSortValue"
      :select-names="sortNames"
      :select-values="sortValues"
      :icon="['fas', 'arrow-down-short-wide']"
      @change="handleSortChange"
    />
    <div
      v-if="commentData.length > 0 && showComments"
    >
      <div
        v-for="(comment, index) in commentData"
        :id="'comment' + index"
        :key="index"
        class="comment"
      >
        <router-link
          :to="`/channel/${comment.authorLink}`"
          tabindex="-1"
        >
          <!-- Hide comment photo only if it isn't the video uploader -->
          <div
            v-if="hideCommentPhotos && !comment.isOwner"
            class="commentThumbnailHidden"
          >
            {{ comment.author.substring(1, 2) }}
          </div>
          <img
            v-else
            :src="comment.authorThumb"
            alt=""
            class="commentThumbnail"
          >
        </router-link>
        <p
          v-if="comment.isPinned"
          class="commentPinned"
        >
          <font-awesome-icon
            :icon="['fas', 'thumbtack']"
          />
          {{ $t("Comments.Pinned by") }} {{ channelName }}
        </p>
        <p
          class="commentAuthorWrapper"
        >
          <router-link
            class="commentAuthor"
            :class="{
              commentOwner: comment.isOwner
            }"
            :to="`/channel/${comment.authorLink}`"
          >
            {{ comment.author }}
          </router-link>
          <img
            v-if="comment.isMember"
            :src="comment.memberIconUrl"
            :title="$t('Comments.Member')"
            :aria-label="$t('Comments.Member')"
            class="commentMemberIcon"
            alt=""
          >
          <img
            v-if="subscriptions.find((channel) => channel.id === comment.authorId)"
            :title="$t('Comments.Subscribed')"
            :aria-label="$t('Comments.Subscribed')"
            class="commentSubscribedIcon"
            alt=""
          >
          <span class="commentDate">
            {{ comment.time }}
          </span>
        </p>
        <ft-timestamp-catcher
          class="commentText"
          :input-html="comment.text"
          @timestamp-event="onTimestamp"
        />
        <p class="commentLikeCount">
          <template
            v-if="!hideCommentLikes"
          >
            <font-awesome-icon
              :icon="['fas', 'thumbs-up']"
            />
            {{ comment.likes }}
          </template>
          <span
            v-if="comment.isHearted"
            class="commentHeartBadge"
          >
            <img
              :src="channelThumbnail"
              :title="$t('Comments.Hearted')"
              :aria-label="$t('Comments.Hearted')"
              class="commentHeartBadgeImg"
              alt=""
            >
            <font-awesome-icon
              :icon="['fas', 'heart']"
              class="commentHeartBadgeWhite"
            />
            <font-awesome-icon
              :icon="['fas', 'heart']"
              class="commentHeartBadgeRed"
            />
          </span>
          <span
            v-if="comment.numReplies > 0"
            class="commentMoreReplies"
            role="button"
            tabindex="0"
            @click="toggleCommentReplies(index)"
            @keydown.space.prevent="toggleCommentReplies(index)"
            @keydown.enter.prevent="toggleCommentReplies(index)"
          >
            <span v-if="!comment.showReplies">{{ $t("Comments.View") }}</span>
            <span v-else>{{ $t("Comments.Hide") }}</span>
            {{ comment.numReplies }}
            <span v-if="comment.numReplies === 1">{{ $t("Comments.Reply").toLowerCase() }}</span>
            <span v-else>{{ $t("Comments.Replies").toLowerCase() }}</span>
            <span v-if="comment.hasOwnerReplied && !comment.showReplies"> {{ $t("Comments.From {channelName}", { channelName }) }}</span>
            <span v-if="comment.numReplies > 1 && comment.hasOwnerReplied && !comment.showReplies"> {{ $t("Comments.And others") }}</span>
          </span>
        </p>
        <div
          v-if="comment.showReplies"
          class="commentReplies"
        >
          <div
            v-for="(reply, replyIndex) in comment.replies"
            :id="'comment' + index + '-' + replyIndex"
            :key="replyIndex"
            class="comment"
          >
            <router-link
              :to="`/channel/${reply.authorLink}`"
              tabindex="-1"
            >
              <!-- Hide comment photo only if it isn't the video uploader -->
              <div
                v-if="hideCommentPhotos && !reply.isOwner"
                class="commentThumbnailHidden"
              >
                {{ reply.author.substring(1, 2) }}
              </div>
              <img
                v-else
                :src="reply.authorThumb"
                alt=""
                class="commentThumbnail"
              >
            </router-link>
            <p class="commentAuthorWrapper">
              <router-link
                class="commentAuthor"
                :class="{
                  commentOwner: reply.isOwner
                }"
                :to="`/channel/${reply.authorLink}`"
              >
                {{ reply.author }}
              </router-link>
              <img
                v-if="reply.isMember"
                :src="reply.memberIconUrl"
                class="commentMemberIcon"
                alt=""
              >
              <img
                v-if="subscriptions.find((channel) => channel.id === reply.authorId)"
                :title="$t('Comments.Subscribed')"
                :aria-label="$t('Comments.Subscribed')"
                class="commentSubscribedIcon"
                alt=""
              >
              <span class="commentDate">
                {{ reply.time }}
              </span>
            </p>
            <ft-timestamp-catcher
              class="commentText"
              :input-html="reply.text"
              @timestamp-event="onTimestamp"
            />
            <p class="commentLikeCount">
              <template
                v-if="!hideCommentLikes"
              >
                <font-awesome-icon
                  v-if="!hideCommentLikes"
                  :icon="['fas', 'thumbs-up']"
                />
                {{ reply.likes }}
              </template>
            </p>
            <p
              v-if="reply.numReplies > 0"
              class="commentMoreReplies"
            >
              {{ $t('Comments.View {replyCount} replies', { replyCount: reply.numReplies }) }}
            </p>
          </div>
          <div
            v-if="comment.hasReplyToken"
            class="showMoreReplies"
            role="button"
            tabindex="0"
            @click="getCommentReplies(index)"
            @keydown.space.prevent="getCommentReplies(index)"
            @keydown.enter.prevent="getCommentReplies(index)"
          >
            <span>{{ $t("Comments.Show More Replies") }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="showComments && !isLoading"
    >
      <h3 class="noCommentMsg">
        {{ $t("Comments.There are no comments available for this video") }}
      </h3>
    </div>
    <h4
      v-if="canPerformMoreCommentLoading"
      class="getMoreComments"
      role="button"
      tabindex="0"
      @click="getMoreComments"
      @keydown.space.prevent="getMoreComments"
      @keydown.enter.prevent="getMoreComments"
    >
      {{ $t("Comments.Load More Comments") }}
    </h4>
    <ft-loader
      v-if="isLoading"
    />
    <div
      v-observe-visibility="observeVisibilityOptions"
    >
      <!--
        Dummy element to be observed by Intersection Observer
      -->
    </div>
  </ft-card>
</template>

<script src="./watch-video-comments.js" />
<style scoped src="./watch-video-comments.css" />
