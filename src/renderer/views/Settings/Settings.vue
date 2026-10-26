<template>
  <div class="settingsPage">
    <template v-if="unlocked">
      <FtCard
        v-if="!isInDesktopView"
        class="settingsSearchMobileCard"
      >
        <div class="settingsSearchMobileRow">
          <button
            v-if="settingsSectionTypeOpenInMobile != null"
            class="returnToMenuMobileButton"
            :class="{ returnToMenuMobileButtonHidden: isSearching }"
            :aria-label="t('Settings.Return to Settings Menu')"
            :aria-hidden="isSearching"
            :tabindex="isSearching ? -1 : 0"
            :title="t('Settings.Return to Settings Menu')"
            @click="returnToSettingsMenu"
          >
            <FontAwesomeIcon
              class="returnToMenuMobileIcon"
              :icon="['fas', 'angle-left']"
            />
          </button>
          <FtInput
            ref="settingsSearchMobileRef"
            class="settingsSearchMobile"
            :placeholder="t('Settings.Search Settings')"
            :value="searchQuery"
            :show-action-button="false"
            :show-clear-text-button="true"
            @input="updateSearchQuery"
            @clear="clearSearch"
          />
        </div>
      </FtCard>
      <FtSettingsMenu
        v-show="isInDesktopView || (!isSearching && settingsSectionTypeOpenInMobile == null)"
        ref="menuRef"
        :settings-sections="settingsSectionComponents"
        :active-section="activeSection"
        @navigate-to-section="navigateToSection"
      />
      <div
        v-show="isInDesktopView || isSearching || settingsSectionTypeOpenInMobile != null"
        class="settingsContent"
      >
        <div
          ref="switchRowRef"
          class="switchRow"
          data-section="general"
        >
          <FtInput
            v-if="isInDesktopView"
            ref="settingsSearchDesktopRef"
            class="settingsSearchDesktop"
            :placeholder="t('Settings.Search Settings')"
            :value="searchQuery"
            :show-action-button="false"
            :show-clear-text-button="true"
            @input="updateSearchQuery"
            @clear="clearSearch"
          />
          <FtButton
            v-if="USING_ELECTRON"
            :label="t('KeyboardShortcutPrompt.Show Keyboard Shortcuts')"
            :icon="['fas', 'keyboard']"
            @click="showKeyboardShortcutPrompt"
          />
          <FtToggleSwitch
            class="settingsToggle"
            :label="t('Settings.Sort Settings Sections (A-Z)')"
            :default-value="settingsSectionSortEnabled"
            @change="updateSettingsSectionSortEnabled"
          />
        </div>
        <div
          v-if="isSearching"
          class="settingsSearchResults"
        >
          <FtCard
            v-if="matchingSections.length === 0"
            class="settingsSearchEmptyCard"
          >
            <p
              class="settingsSearchStatus settingsSearchStatusHidden"
              role="status"
              aria-atomic="true"
            >
              {{ searchResultsStatus }}
            </p>
            <p class="settingsSearchEmpty">
              {{ t('Settings.No Matching Settings') }}
            </p>
          </FtCard>
          <FtCard
            v-else
            class="settingsSearchResultsCard"
          >
            <p
              class="settingsSearchStatus"
              role="status"
              aria-atomic="true"
            >
              {{ searchResultsStatus }}
            </p>
            <section
              v-for="section in matchingSections"
              :key="section.type"
              class="settingsSearchGroup"
            >
              <h2>
                {{ section.title }}
              </h2>
              <button
                v-for="(result, index) in section.results"
                :key="index"
                class="settingsSearchResult"
                @click="selectSearchResult(result)"
              >
                <span class="settingsSearchResultText">
                  <span>{{ result.label }}</span>
                  <small v-if="result.context">{{ result.context }}</small>
                </span>
                <FontAwesomeIcon
                  class="settingsSearchResultIcon"
                  :icon="['fas', 'chevron-right']"
                  aria-hidden="true"
                />
              </button>
            </section>
          </FtCard>
        </div>
        <div
          v-show="!isSearching"
          ref="settingsSectionsRef"
          class="settingsSections"
        >
          <component
            :is="section.component"
            v-for="section in settingsSectionComponents"
            :key="section.type"
            ref="sectionRefs"
            class="section"
            :class="{ hideOnMobile: settingsSectionTypeOpenInMobile !== section.type }"
            :data-section="section.type"
          />
        </div>
      </div>
    </template>
    <PasswordDialog
      v-else
      @unlocked="handleUnlock"
    />
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import GeneralSettings from '../../components/GeneralSettings/GeneralSettings.vue'
import ThemeSettings from '../../components/ThemeSettings.vue'
import PlayerSettings from '../../components/PlayerSettings/PlayerSettings.vue'
import ExternalPlayerSettings from '../../components/ExternalPlayerSettings.vue'
import SubscriptionSettings from '../../components/SubscriptionSettings/SubscriptionSettings.vue'
import PrivacySettings from '../../components/PrivacySettings.vue'
import DataSettings from '../../components/DataSettings/DataSettings.vue'
import DistractionSettings from '../../components/DistractionSettings/DistractionSettings.vue'
import ProxySettings from '../../components/ProxySettings/ProxySettings.vue'
import SponsorBlockSettings from '../../components/SponsorBlockSettings.vue'
import ParentalControlSettings from '../../components/ParentalControlSettings.vue'
import ExperimentalSettings from '../../components/ExperimentalSettings/ExperimentalSettings.vue'
import PasswordSettings from '../../components/PasswordSettings/PasswordSettings.vue'
import PasswordDialog from '../../components/PasswordDialog/PasswordDialog.vue'
import FtToggleSwitch from '../../components/FtToggleSwitch/FtToggleSwitch.vue'
import FtButton from '../../components/FtButton/FtButton.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtInput from '../../components/FtInput/FtInput.vue'
import FtSettingsMenu from '../../components/FtSettingsMenu/FtSettingsMenu.vue'
import { ctrlFHandler } from '../../helpers/utils'

import store from '../../store/index'

const USING_ELECTRON = !!process.env.IS_ELECTRON
const SETTINGS_MOBILE_WIDTH_THRESHOLD = 1015

const { locale, t } = useI18n()

const isInDesktopView = ref(true)
const settingsSectionTypeOpenInMobile = ref(null)
const activeSection = ref(null)
const searchQuery = ref('')
const searchEntries = shallowRef([])
const isSearching = computed(() => searchQuery.value.trim().length > 0)
const settingsSearchDesktopRef = useTemplateRef('settingsSearchDesktopRef')
const settingsSearchMobileRef = useTemplateRef('settingsSearchMobileRef')
const switchRowRef = useTemplateRef('switchRowRef')
const settingsSectionsRef = useTemplateRef('settingsSectionsRef')
let searchObserver
let highlightedElement
let searchStartScrollY = null

/** @type {import('vue').ComputedRef<boolean>} */
const settingsSectionSortEnabled = computed(() => store.getters.getSettingsSectionSortEnabled)

const settingsComponentsData = computed(() => {
  return [
    {
      type: 'theme',
      title: t('Settings.Theme Settings.Theme Settings'),
      icon: ['fas', 'display'],
      component: ThemeSettings
    },
    {
      type: 'player',
      title: t('Settings.Player Settings.Player Settings'),
      icon: ['fas', 'circle-play'],
      component: PlayerSettings
    },
    ...(process.env.IS_ELECTRON
      ? [{
          type: 'external-player',
          title: t('Settings.External Player Settings.External Player Settings'),
          icon: ['fas', 'clapperboard'],
          component: ExternalPlayerSettings
        }]
      : []),
    {
      type: 'subscription',
      title: t('Settings.Subscription Settings.Subscription Settings'),
      icon: ['fas', 'play'],
      component: SubscriptionSettings
    },
    {
      type: 'distraction',
      title: t('Settings.Distraction Free Settings.Distraction Free Settings'),
      icon: ['fas', 'eye-slash'],
      component: DistractionSettings
    },
    {
      type: 'parental-control',
      title: t('Settings.Parental Control Settings.Parental Control Settings'),
      icon: ['fas', 'user-lock'],
      component: ParentalControlSettings
    },
    {
      type: 'privacy',
      title: t('Settings.Privacy Settings.Privacy Settings'),
      icon: ['fas', 'lock'],
      component: PrivacySettings
    },
    {
      type: 'data',
      title: t('Settings.Data Settings.Data Settings'),
      icon: ['fas', 'database'],
      component: DataSettings
    },
    ...(process.env.IS_ELECTRON
      ? [
          {
            type: 'proxy',
            title: t('Settings.Proxy Settings.Proxy Settings'),
            icon: ['fas', 'network-wired'],
            component: ProxySettings
          }
        ]
      : []),
    {
      type: 'sponsor-block',
      title: t('Settings.SponsorBlock Settings.SponsorBlock Settings'),
      // TODO: replace with SponsorBlock icon
      icon: ['fas', 'shield'],
      component: SponsorBlockSettings
    },
    {
      type: 'password',
      title: t('Settings.Password Settings.Password Settings'),
      icon: ['fas', 'key'],
      component: PasswordSettings
    },
    ...(process.env.IS_ELECTRON
      ? [{
          type: 'experimental',
          title: t('Settings.Experimental Settings.Experimental Settings'),
          icon: ['fas', 'flask'],
          component: ExperimentalSettings
        }]
      : []),
  ]
})

const collator = computed(() => {
  return new Intl.Collator([locale.value, 'en'], { sensitivity: 'base' })
})

const settingsSectionComponents = computed(() => {
  let settingsSections = settingsComponentsData.value

  if (settingsSectionSortEnabled.value) {
    const collator_ = collator.value

    settingsSections = settingsSections.toSorted((a, b) => {
      return collator_.compare(a.title, b.title)
    })
  }

  // ensure General Settings is placed first regardless of sorting
  const generalSettingsEntry = {
    type: 'general',
    title: t('Settings.General Settings.General Settings'),
    icon: ['fas', 'border-all'],
    component: GeneralSettings
  }

  return [generalSettingsEntry, ...settingsSections]
})

const matchingSections = computed(() => {
  const words = searchQuery.value.trim().toLocaleLowerCase(locale.value).split(/\s+/)

  return settingsSectionComponents.value.flatMap(section => {
    const results = searchEntries.value.filter(entry => {
      if (entry.sectionType !== section.type || (!isInDesktopView.value && entry.element.closest('.switchRow'))) {
        return false
      }

      const text = `${entry.label} ${entry.context}`.toLocaleLowerCase(locale.value)
      return words.every(word => text.includes(word))
    })
    return results.length ? [{ ...section, results }] : []
  })
})

const searchResultsStatus = computed(() => {
  const count = matchingSections.value.reduce((total, section) => total + section.results.length, 0)
  return t('Settings.Settings found', { count }, count)
})

const unlocked = ref(store.getters.getSettingsPassword === '')

if (unlocked.value) {
  onMounted(handleMounted)
}

function handleUnlock() {
  unlocked.value = true

  nextTick(() => {
    handleMounted()
  })
}

onBeforeUnmount(() => {
  document.removeEventListener('scroll', markScrolledToSectionAsActive)
  document.removeEventListener('keydown', handleSearchShortcut)
  window.removeEventListener('resize', handleResize)
  searchObserver?.disconnect()
  clearSearchHighlight()
})

function showKeyboardShortcutPrompt() {
  store.dispatch('showKeyboardShortcutPrompt')
}

/**
 * @param {boolean} value
 */
function updateSettingsSectionSortEnabled(value) {
  store.dispatch('updateSettingsSectionSortEnabled', value)
}

function handleMounted() {
  handleResize()
  window.addEventListener('resize', handleResize)
  document.addEventListener('scroll', markScrolledToSectionAsActive)
  document.addEventListener('keydown', handleSearchShortcut)
  refreshSearchEntries()
  searchObserver = new MutationObserver(refreshSearchEntries)
  const observerOptions = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-settings-search-label', 'data-settings-search-context']
  }
  searchObserver.observe(settingsSectionsRef.value, observerOptions)
  searchObserver.observe(switchRowRef.value, observerOptions)

  // mark first section as active before any scrolling has taken place
  activeSection.value = settingsSectionComponents.value[0].type
}

function refreshSearchEntries() {
  const controls = [
    ...settingsSectionsRef.value.querySelectorAll('[data-settings-search-label]'),
    ...switchRowRef.value.querySelectorAll('[data-settings-search-label]')
  ]
  searchEntries.value = controls.map(element => ({
    element,
    sectionType: element.closest('[data-section]')?.dataset.section,
    label: element.dataset.settingsSearchLabel,
    context: element.closest('[data-settings-search-context]')?.dataset.settingsSearchContext || ''
  })).filter(entry => entry.sectionType && entry.label && !entry.element.closest('.settingsSearchDesktop'))
}

function updateSearchQuery(value) {
  if (!isSearching.value && value.trim()) {
    if (searchStartScrollY === null) {
      searchStartScrollY = window.scrollY
    }
    if (isInDesktopView.value) {
      window.scrollTo(0, 0)
    }
  }
  searchQuery.value = value
  if (!value.trim()) {
    restoreSearchScroll()
  }
}

function clearSearch() {
  const isDesktop = isInDesktopView.value
  searchQuery.value = ''
  restoreSearchScroll()
  nextTick(() => {
    const searchRef = isDesktop ? settingsSearchDesktopRef.value : settingsSearchMobileRef.value
    const searchInput = searchRef?.$el.querySelector('input')
    if (!searchInput) return

    searchInput.focus({ preventScroll: isDesktop })
    if (!isDesktop) {
      const searchTop = searchInput.getBoundingClientRect().top
      const navigationBottom = document.querySelector('.topNav')?.getBoundingClientRect().bottom
      if (navigationBottom !== undefined && searchTop < navigationBottom) {
        window.scrollBy(0, searchTop - navigationBottom - 10)
      }
    }
  })
}

function restoreSearchScroll() {
  if (searchStartScrollY !== null && isInDesktopView.value) {
    const scrollY = searchStartScrollY
    nextTick(() => window.requestAnimationFrame(() => {
      if (isSearching.value || !settingsSectionsRef.value?.isConnected) return
      window.scrollTo(0, scrollY)
    }))
  }
  searchStartScrollY = null
}

async function selectSearchResult(result) {
  searchStartScrollY = null
  searchQuery.value = ''
  if (!isInDesktopView.value) {
    settingsSectionTypeOpenInMobile.value = result.sectionType
  }
  await nextTick()
  if (!result.element.isConnected) return

  if (isInDesktopView.value) {
    activeSection.value = result.sectionType
  }
  clearSearchHighlight()
  highlightedElement = result.element
  highlightedElement.dataset.searchHighlight = ''
  result.element.scrollIntoView({ block: 'center' })
  const focusTarget = result.element.matches('button')
    ? result.element
    : result.element.querySelector('input:not(:disabled), select:not(:disabled)')
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true })
  } else {
    result.element.tabIndex = -1
    result.element.focus({ preventScroll: true })
  }
  document.addEventListener('click', clearSearchHighlight, { capture: true, once: true })
  highlightedElement.addEventListener('focusout', clearSearchHighlight, { once: true })
  highlightedElement.addEventListener('input', clearSearchHighlight, { once: true })
}

function clearSearchHighlight() {
  if (highlightedElement) {
    highlightedElement.removeEventListener('focusout', clearSearchHighlight)
    highlightedElement.removeEventListener('input', clearSearchHighlight)
    delete highlightedElement.dataset.searchHighlight
    highlightedElement = null
  }
  document.removeEventListener('click', clearSearchHighlight, true)
}

function handleSearchShortcut(event) {
  if ((event.key === 'f' || event.key === 'F') && (process.platform === 'darwin' ? event.metaKey : event.ctrlKey) && !isSearching.value && searchStartScrollY === null) {
    searchStartScrollY = window.scrollY
  }
  ctrlFHandler(event, isInDesktopView.value ? settingsSearchDesktopRef.value : settingsSearchMobileRef.value)
}

const sectionRefs = useTemplateRef('sectionRefs')

/**
 * @param {string} sectionType
 */
function navigateToSection(sectionType) {
  if (isSearching.value) {
    searchStartScrollY = null
    searchQuery.value = ''
  }

  if (isInDesktopView.value) {
    nextTick(() => {
      const sectionElement = sectionRefs.value.find(sectionRef => {
        return sectionRef.$el.dataset.section === sectionType
      })?.$el
      sectionElement.scrollIntoView()

      const sectionHeading = sectionElement.firstChild.firstChild
      sectionHeading.tabIndex = 0
      sectionHeading.focus()
      sectionHeading.tabIndex = -1
    })
  } else {
    settingsSectionTypeOpenInMobile.value = sectionType
  }
}

const menuRef = useTemplateRef('menuRef')

function returnToSettingsMenu() {
  const openSection = settingsSectionTypeOpenInMobile.value
  settingsSectionTypeOpenInMobile.value = null

  // focus the corresponding Settings Menu title
  nextTick(() => {
    return menuRef.value?.focusLink(openSection)
  })
}

/* Set the current section to be shown as active in the Settings Menu
* if it is the lowest section within the top quarter of the viewport (25vh) */
function markScrolledToSectionAsActive() {
  if (!isInDesktopView.value) {
    activeSection.value = null
    return
  }

  const highlightedSection = highlightedElement?.closest('[data-section]')
  if (highlightedSection) {
    activeSection.value = highlightedSection.dataset.section
    return
  }

  const scrollY = window.scrollY + window.innerHeight / 4

  for (const sectionRef of sectionRefs.value) {
    const sectionElement = sectionRef.$el

    const sectionHeight = sectionElement.offsetHeight
    const sectionTop = sectionElement.offsetTop

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      activeSection.value = sectionElement.dataset.section
      break
    }
  }
}

function handleResize() {
  const wasNotInDesktopView = !isInDesktopView.value
  isInDesktopView.value = window.innerWidth > SETTINGS_MOBILE_WIDTH_THRESHOLD

  if (isSearching.value) {
    if (isInDesktopView.value) settingsSectionTypeOpenInMobile.value = null
    return
  }

  // navigate to section that was open in mobile or desktop view, if any
  if (isInDesktopView.value && wasNotInDesktopView && settingsSectionTypeOpenInMobile.value != null) {
    navigateToSection(settingsSectionTypeOpenInMobile.value)
    settingsSectionTypeOpenInMobile.value = null
  } else if (!isInDesktopView.value && !wasNotInDesktopView && activeSection.value) {
    navigateToSection(activeSection.value)
  }
}
</script>

<style scoped src="./Settings.css" />
