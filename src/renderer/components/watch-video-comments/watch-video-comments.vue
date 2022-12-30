<template>
  <ft-card>
    <h4
      v-if="commentData.length === 0 && !isLoading"
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
        @keydown.space.prevent="showComments = false"
        @keydown.enter.prevent="showComments = false"
      >
        {{ $t("Comments.Hide Comments") }}
      </span>
    </h3>
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
          <img
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
            <span v-if="comment.numReplies > 1 && comment.hasOwnerReplied && !comment.showReplies">{{ $t("Comments.And others") }}</span>
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
              <img
                :src="reply.authorThumb"
                class="commentThumbnail"
                alt=""
              >
            </router-link>
            <p class="commentAuthorWrapper">
              <span
                class="commentAuthor"
                :class="{
                  commentOwner: reply.isOwner
                }"
              >
                <router-link
                  :to="`/channel/${reply.authorLink}`"
                >
                  {{ reply.author }}
                </router-link>
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
              {{ $t('Comments.View {replyCount} replies', { replyCount: reply.numReplies }) }}
            </p>
          </div>
          <div
            v-if="comment.replyToken !== null"
            class="showMoreReplies"
            role="button"
            tabindex="0"
            @click="getCommentReplies(index, comment.replies.length)"
            @keydown.space.prevent="getCommentReplies(index, comment.replies.length)"
            @keydown.enter.prevent="getCommentReplies(index, comment.replies.length)"
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
      v-if="commentData.length > 0 && !isLoading && showComments && nextPageToken"
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
  </ft-card>
</template>

<script src="./watch-video-comments.js" />
<style scoped src="./watch-video-comments.css" />
