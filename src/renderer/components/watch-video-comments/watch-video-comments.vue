<template>
  <ft-card>
    <h4
      v-if="commentData.length === 0 && !isLoading"
      class="getCommentsTitle"
      @click="getCommentData"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <h4
      v-if="commentData.length > 0 && !isLoading && !showComments"
      class="getCommentsTitle"
      @click="showComments = true"
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
      @change="handleSortChange"
    />
    <h3
      v-if="commentData.length > 0 && !isLoading && showComments"
    >
      {{ $t("Comments.Comments") }}
      <span
        class="hideComments"
        @click="showComments = false"
      >
        {{ $t("Comments.Hide Comments") }}
      </span>
    </h3>
    <div
      v-if="commentData.length > 0 && showComments"
    >
      <div
        v-for="(comment, index) in commentData"
        :key="index"
        class="comment"
      >
        <img
          :src="comment.authorThumb"
          class="commentThumbnail"
          @click="goToChannel(comment.authorLink)"
        >
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
          <span
            class="commentAuthor"
            :class="{
              commentOwner: comment.isOwner
            }"
            @click="goToChannel(comment.authorLink)"
          >
            {{ comment.author }}
          </span>
          <img
            v-if="comment.isMember"
            :src="comment.memberIconUrl"
            :title="$t('Comments.Member')"
            :aria-label="$t('Comments.Member')"
            class="commentMemberIcon"
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
          <font-awesome-icon
            v-if="!hideCommentLikes"
            :icon="['fas', 'thumbs-up']"
          />
          {{ comment.likes }}
          <span
            v-if="comment.isHearted"
            class="commentHeartBadge"
          >
            <img
              :src="channelThumbnail"
              class="commentHeartBadgeImg"
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
            @click="toggleCommentReplies(index)"
          >
            <span v-if="!comment.showReplies">{{ $t("Comments.View") }}</span>
            <span v-else>{{ $t("Comments.Hide") }}</span>
            {{ comment.numReplies }}
            <span v-if="comment.numReplies === 1">{{ $t("Comments.Reply").toLowerCase() }}</span>
            <span v-else>{{ $t("Comments.Replies").toLowerCase() }}</span>
            <span v-if="comment.hasOwnerReplied && !comment.showReplies"> {{ $t("Comments.From {channelName}", { channelName }) }}</span>
            <span v-if="comment.numReplies > 1 && comment.hasOwnerReplied && !comment.showReplies">{{ $t("Comments.And others") }}</span>
          </span>
        </p>
        <div
          v-if="comment.showReplies"
          class="commentReplies"
        >
          <div
            v-for="(reply, replyIndex) in comment.replies"
            :key="replyIndex"
            class="comment"
          >
            <img
              :src="reply.authorThumb"
              class="commentThumbnail"
            >
            <p class="commentAuthorWrapper">
              <span
                class="commentAuthor"
                :class="{
                  commentOwner: reply.isOwner
                }"
                @click="goToChannel(reply.authorLink)"
              >
                {{ reply.author }}
              </span>
              <img
                v-if="reply.isMember"
                :src="reply.memberIconUrl"
                class="commentMemberIcon"
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
              <font-awesome-icon
                v-if="!hideCommentLikes"
                :icon="['fas', 'thumbs-up']"
              />
              {{ reply.likes }}
            </p>
            <p
              v-if="reply.numReplies > 0"
              class="commentMoreReplies"
            >
              View {{ reply.numReplies }} replies
            </p>
          </div>
          <div
            v-if="comment.replyToken !== null"
            class="showMoreReplies"
            @click="getCommentReplies(index)"
          >
            <span>{{ $t("Comments.Show More Replies") }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="showComments && !isLoading"
    >
      <h3 class="center">
        {{ $t("There are no comments available for this video") }}
      </h3>
    </div>
    <h4
      v-if="commentData.length > 0 && !isLoading && showComments"
      class="getMoreComments"
      @click="getMoreComments"
    >
      {{ $t("Comments.Load More Comments") }}
    </h4>
    <ft-loader
      v-if="isLoading"
    />
  </ft-card>
</template>

<script src="./watch-video-comments.js" />
<style scoped src="./watch-video-comments.css" />
