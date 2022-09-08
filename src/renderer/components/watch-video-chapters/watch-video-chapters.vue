<template>
  <ft-card class="videoChapters">
    <h3
      class="chaptersTitle"
      @click="showChapters = !showChapters"
    >
      {{ $t("Chapters") }}

      <span class="currentChapter">
        • {{ chapters[currentIndex].title }}
      </span>

      <font-awesome-icon
        class="chaptersChevron"
        :icon="['fas', 'chevron-right']"
        :rotation="showChapters ? 90 : null"
        :class="{ open: showChapters }"
      />
    </h3>
    <div
      v-show="showChapters"
      class="chaptersWrapper"
      :class="{ compact }"
    >
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        class="chapter"
        :class="{ current: index === currentIndex }"
        @click="changeChapter(index)"
      >
        <img
          v-if="!compact"
          class="chapterThumbnail"
          :src="chapter.thumbnail"
        >
        <div class="chapterTimestamp">
          {{ chapter.timestamp }}
        </div>
        <p class="chapterTitle">
          {{ chapter.title }}
        </p>
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-chapters.js" />
<style scoped src="./watch-video-chapters.css" />
