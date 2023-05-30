<template>
  <ft-card class="videoChapters">
    <h3
      class="chaptersTitle"
      tabindex="0"
      :aria-label="showChapters
        ? $t('Chapters.Chapters list visible, current chapter: {chapterName}', null, { chapterName: currentTitle })
        : $t('Chapters.Chapters list hidden, current chapter: {chapterName}', null, { chapterName: currentTitle })
      "
      :aria-pressed="showChapters"
      @click="toggleShowChapters"
      @keydown.space.stop.prevent="toggleShowChapters"
      @keydown.enter.stop.prevent="toggleShowChapters"
    >
      {{ $t("Chapters.Chapters") }}

      <span class="currentChapter">
        • {{ currentTitle }}
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
      ref="chaptersWrapper"
      class="chaptersWrapper"
      :class="{ compact }"
      @keydown.arrow-up.stop.prevent="navigateChapters('up')"
      @keydown.arrow-down.stop.prevent="navigateChapters('down')"
    >
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        :ref="index === currentIndex ? 'currentChaptersItem' : null"
        class="chapter"
        role="button"
        tabindex="0"
        :aria-selected="index === currentIndex"
        :class="{ current: index === currentIndex }"
        @click="changeChapter(index)"
        @keydown.space.stop.prevent="changeChapter(index)"
        @keydown.enter.stop.prevent="changeChapter(index)"
      >
        <img
          v-if="!compact"
          alt=""
          aria-hidden="true"
          class="chapterThumbnail"
          loading="lazy"
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
