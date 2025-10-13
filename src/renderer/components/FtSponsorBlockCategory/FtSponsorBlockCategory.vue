<template>
  <div class="sponsorBlockCategory">
    <div
      :id="id"
      class="sponsorTitle"
    >
      {{ translatedCategoryName }}
    </div>
    <FtSelect
      :describe-by-id="id"
      :placeholder="$t('Settings.SponsorBlock Settings.Category Color')"
      :value="sponsorBlockValues.color"
      :select-names="colorNames"
      :select-values="COLOR_VALUES"
      :icon="['fas', 'palette']"
      :class="'sec' + sponsorBlockValues.color"
      icon-color="rgb(var(--accent-color-rgb))"
      @change="updateColor"
    />
    <FtSelect
      :describe-by-id="id"
      :placeholder="$t('Settings.SponsorBlock Settings.Skip Options.Skip Option')"
      :value="sponsorBlockValues.skip"
      :select-names="skipNames"
      :select-values="SKIP_VALUES"
      :icon="['fas', 'forward']"
      @change="updateSkipOption"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useId } from '../../composables/use-id-polyfill'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtSelect from '../FtSelect/FtSelect.vue'

import store from '../../store/index'

import { colors } from '../../helpers/colors'
import { useColorTranslations } from '../../composables/colors'

const props = defineProps({
  categoryName: {
    type: String,
    required: true
  }
})

const { t } = useI18n()

const SKIP_VALUES = [
  'autoSkip',
  // 'promptToSkip',
  'showInSeekBar',
  'doNothing'
]

const skipNames = computed(() => [
  t('Settings.SponsorBlock Settings.Skip Options.Auto Skip'),
  // t('Settings.SponsorBlock Settings.Skip Options.Prompt To Skip'),
  t('Settings.SponsorBlock Settings.Skip Options.Show In Seek Bar'),
  t('Settings.SponsorBlock Settings.Skip Options.Do Nothing')
])

const COLOR_VALUES = colors.map(color => color.name)
const colorNames = useColorTranslations()

const id = useId()

/** @type {import('vue').ComputedRef<{ color: string, skip: string }>} */
const sponsorBlockValues = computed(() => {
  switch (props.categoryName) {
    case 'sponsor':
      return store.getters.getSponsorBlockSponsor
    case 'self-promotion':
      return store.getters.getSponsorBlockSelfPromo
    case 'interaction':
      return store.getters.getSponsorBlockInteraction
    case 'intro':
      return store.getters.getSponsorBlockIntro
    case 'outro':
      return store.getters.getSponsorBlockOutro
    case 'recap':
      return store.getters.getSponsorBlockRecap
    case 'music offtopic':
      return store.getters.getSponsorBlockMusicOffTopic
    case 'filler':
      return store.getters.getSponsorBlockFiller
    default:
      return ''
  }
})

const translatedCategoryName = computed(() => {
  switch (props.categoryName) {
    case 'sponsor':
      return t('Video.Sponsor Block category.sponsor')
    case 'self-promotion':
      return t('Video.Sponsor Block category.self-promotion')
    case 'interaction':
      return t('Video.Sponsor Block category.interaction')
    case 'intro':
      return t('Video.Sponsor Block category.intro')
    case 'outro':
      return t('Video.Sponsor Block category.outro')
    case 'recap':
      return t('Video.Sponsor Block category.recap')
    case 'music offtopic':
      return t('Video.Sponsor Block category.music offtopic')
    case 'filler':
      return t('Video.Sponsor Block category.filler')
    default:
      return ''
  }
})

/**
 * @param {string} color
 */
function updateColor(color) {
  updateSponsorCategory({
    color,
    skip: sponsorBlockValues.value.skip
  })
}

/**
 * @param {string} skipOption
 */
function updateSkipOption(skipOption) {
  updateSponsorCategory({
    color: sponsorBlockValues.value.color,
    skip: skipOption
  })
}

/**
 * @param {{ color: string, skip: string }} payload
 */
function updateSponsorCategory(payload) {
  switch (props.categoryName) {
    case 'sponsor':
      store.dispatch('updateSponsorBlockSponsor', payload)
      break
    case 'self-promotion':
      store.dispatch('updateSponsorBlockSelfPromo', payload)
      break
    case 'interaction':
      store.dispatch('updateSponsorBlockInteraction', payload)
      break
    case 'intro':
      store.dispatch('updateSponsorBlockIntro', payload)
      break
    case 'outro':
      store.dispatch('updateSponsorBlockOutro', payload)
      break
    case 'recap':
      store.dispatch('updateSponsorBlockRecap', payload)
      break
    case 'music offtopic':
      store.dispatch('updateSponsorBlockMusicOffTopic', payload)
      break
    case 'filler':
      store.dispatch('updateSponsorBlockFiller', payload)
      break
  }
}
</script>

<style scoped src="./FtSponsorBlockCategory.css" />
