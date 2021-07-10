<template>
  <ft-card>
    <h4
      v-if="commentData.length === 0 && !isLoading"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="getCommentData()"
      @keydown="getCommentData($event)"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <h4
      v-if="commentData.length > 0 && !isLoading && !showComments"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="showComments = true"
      @keydown="showComments = $event instanceof KeyboardEvent && $event.key !== ' ' && $event.key !== 'Enter'"
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
        role="button"
        tabindex="0"
        @click="showComments = false"
        @keydown="showComments = $event.key !== ' ' && $event.key !== 'Enter'"
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
          role="button"
          tabindex="0"
          @click="goToChannel(null, comment.authorLink)"
          @keydown="goToChannel($event, comment.authorLink)"
        >
        <p
          class="commentAuthorWrapper"
        >
          <span
            class="commentAuthor"
            role="button"
            tabindex="0"
            @click="goToChannel(null, comment.authorLink)"
            @keydown="goToChannel($event, comment.authorLink)"
          >
            {{ comment.author }}
          </span>
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
            icon="thumbs-up"
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
              icon="heart"
              class="commentHeartBadgeWhite"
            />
            <font-awesome-icon
              icon="heart"
              class="commentHeartBadgeRed"
            />
          </span>
          <span
            v-if="comment.numReplies > 0"
            class="commentMoreReplies"
            role="button"
            tabindex="0"
            @click="toggleCommentReplies(null, index)"
            @keydown="toggleCommentReplies($event, index)"
          >
            <span v-if="!comment.showReplies">{{ $t("Comments.View") }}</span>
            <span v-else>{{ $t("Comments.Hide") }}</span>
            {{ comment.numReplies }}
            <span v-if="comment.numReplies === 1">{{ $t("Comments.Reply").toLowerCase() }}</span>
            <span v-else>{{ $t("Comments.Replies").toLowerCase() }}</span>
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
                role="button"
                tabindex="0"
                @click="goToChannel(null, reply.authorLink)"
                @keydown="goToChannel($event, reply.authorLink)"
              >
                {{ reply.author }}
              </span>
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
                icon="thumbs-up"
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
            v-if="comment.replies.length < comment.numReplies"
            class="showMoreReplies"
            role="button"
            tabindex="0"
            @click="getCommentReplies(null, index)"
            @keydown="getCommentReplies($event, index)"
          >
            <span>Show More Replies</span>
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
      role="button"
      tabindex="0"
      @click="getMoreComments"
      @keydown="getMoreComments($event)"
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
