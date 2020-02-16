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
      Click to view comments
    </h4>
    <h3
      v-if="commentData.length > 0 && !isLoading"
    >
      Comments
    </h3>
    <div
      v-if="commentData.length > 0"
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
          View {{ comment.numReplies }} replies
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
    <h4
      v-if="commentData.length > 0 && !isLoading"
      class="getMoreComments"
      @click="getCommentData"
    >
      Load More Comments
    </h4>
  </ft-card>
</template>

<script src="./watch-video-comments.js" />
<style scoped src="./watch-video-comments.css" />
