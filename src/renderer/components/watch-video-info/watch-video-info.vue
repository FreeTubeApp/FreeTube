<template>
  <ft-card class="watchVideoInfo">
    <div>
      <p
        class="videoTitle"
      >
        {{ title }}
      </p>
      <div
        class="channelInformation"
      >
        <div
          class="profileRow"
        >
          <div>
            <img
              :src="channelThumbnail"
              class="channelThumbnail"
              @click="goToChannel"
            >
          </div>
          <div>
            <div
              class="channelName"
              @click="goToChannel"
            >
              {{ channelName }}
            </div>
            <ft-button
              :label="subscribedText"
              class="subscribeButton"
              background-color="var(--primary-color)"
              @click="handleSubscription"
            />
          </div>
        </div>
      </div>
    </div>
    <div>
      <p class="viewCount">
        {{ parsedViewCount }}
      </p>
      <div
        class="likeSection"
      >
        <div
          class="likeBar"
          :style="{ background: `linear-gradient(to right, var(--accent-color) ${likePercentageRatio}%, #9E9E9E ${likePercentageRatio}%` }"
        ></div>
        <div class="likeCount">👍 {{ likeCount }}</div>
        <div class="dislikeCount">{{ dislikeCount }} 👎</div>
      </div>
      <!--
        <ft-flex-box class="videoOptions">
          <ft-button
            label="Toggle Theatre Mode"
            class="theatreModeButton"
            @click="$emit('theatreMode')"
          />
          <ft-list-dropdown
            :title="formatTypeLabel"
            :label-names="formatTypeNames"
            :label-values="formatTypeValues"
            class="formatTypeDropdown"
            @click="handleFormatChange"
          />
          <ft-list-dropdown
            :title="shareLabel"
            :label-names="shareNames"
            :label-values="shareValues"
            class="shareDropdown"
            @click="handleShare"
          />
        </ft-flex-box>
      -->
      <div class="optionsContainer">
        <div v-for="i in [`download`, `star`, `bookmark`, `share`]" :key="i" class="option">
          <font-awesome-icon
            class="refreshIcon"
            :icon="i"
          />
        </div>
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-info.js" />
<style scoped src="./watch-video-info.sass" lang="sass" />
