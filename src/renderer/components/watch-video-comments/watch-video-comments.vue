<template>
  <ft-card>
    <ft-loader
      v-if="isLoading"
    />
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
        >
        <p class="commentAuthor">
          {{ comment.author }}
          <span class="commentDate">
            {{ comment.time }}
          </span>
        </p>
        <p class="commentText">
          {{ comment.text }}
        </p>
        <p class="commentLikeCount">
          <font-awesome-icon
            icon="thumbs-up"
          />
          {{ comment.likes }}
        </p>
        <p
          v-if="comment.numReplies > 0"
          class="commentMoreReplies"
          @click="getCommentReplies(index)"
        >
          <span v-if="!comment.showReplies">{{ $t("Comments.View") }}</span>
          <span v-else>Hide</span>
          {{ comment.numReplies }}
          <span v-if="comment.numReplies === 1">{{ $t("Comments.Reply").toLowerCase() }}</span>
          <span v-else>{{ $t("Comments.Replies").toLowerCase() }}</span>
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
            <p class="commentAuthor">
              {{ reply.author }}
              <span class="commentDate">
                {{ reply.time }}
              </span>
            </p>
            <p class="commentText">
              {{ reply.text }}
            </p>
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
      @click="getCommentData"
    >
      {{ $t("Load More Comments") }}
    </h4>
  </ft-card>
</template>

<script src="./watch-video-comments.js" />
<style scoped src="./watch-video-comments.css" />
