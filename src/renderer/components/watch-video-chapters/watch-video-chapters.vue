<template>
  <ft-card class="videoChapters">
    <h3
      class="chaptersTitle"
      @click="showChapters = !showChapters"
    >
      <span>
        {{ $t("Chapters") }}
      </span>
      <span class="currentChapter">
        {{ chapters[currentChapterIndex].title }}
      </span>
    </h3>
    <div
      v-if="showChapters"
      class="chaptersWrapper"
    >
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        class="chapter"
        @click="changeChapter(chapter.seconds)"
      >
        <div class="chapterThumbnail">
          <img
            :src="chapter.thumbnail"
            class="chapterImage"
            :class="{ chapterImageCurrent: index === currentChapterIndex }"
          >
        </div>
        <div class="chapterInfo">
          <p class="chapterTitle">
            {{ chapter.title }}
          </p>
          <div class="chapterTimestamp">
            <span>
              {{ chapter.timestamp }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-chapters.js" />
<style scoped src="./watch-video-chapters.css" />
