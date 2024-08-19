<template>
  <div>
    <div v-if="!isInvidiousAllowed">
      {{ $t('Channel.Community.Viewing Posts Only Supported By Invidious') }}
    </div>
    <FtLoader v-else-if="isLoading" />
    <template
      v-else
    >
      <FtCard>
        <FtCommunityPost
          :data="post"
          appearance="result"
        />
      </FtCard>
      <FtCard>
        <WatchVideoComments
          :id="post.postId"
          :channel-name="post.author"
          :post-author-id="authorId"
          :video-player-ready="false"
          :force-state="null"
          :is-post-comments="true"
          :channel-thumbnail="post.authorThumbnails[0].url"
          :show-sort-by="false"
        />
      </FtCard>
    </template>
  </div>
</template>
<script src="./Post.js" />
