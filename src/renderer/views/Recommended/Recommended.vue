<template>
  <div>
    <ft-card class="card">
      <h2>Recommended</h2>
      <ft-flex-box
        class="subscriptionTabs"
        role="tablist"
        :aria-label="$t('Recommended.Recommended Tabs')"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="videos"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'videos')"
          aria-controls="recommendedPanel"
          :tabindex="currentTab === 'videos' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'videos' }"
          @click="changeTab('videos')"
          @keydown.space.enter.prevent="changeTab('videos')"
          @keydown.left.right="focusTab($event, 'videos')"
        >
          {{ $t("Global.Videos").toUpperCase() }}
        </div>
      </ft-flex-box>
      <recommended-videos
        v-if="currentTab === 'videos'"
        id="recommendedPanel"
        role="tabpanel"
      />
      <p v-else-if="currentTab === null">
        {{ $t("Recommended.All Recommend Tabs Hidden", {
          subsection: $t('Settings.Distraction Free Settings.Sections.Recommended Page'),
          settingsSection: $t('Settings.Distraction Free Settings.Distraction Free Settings')
        }) }}
      </p>
    </ft-card>
  </div>
</template>

<script src="./Recommended.js" />
<style scoped src="./Recommended.css" />
