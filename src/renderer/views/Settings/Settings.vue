<template>
  <div class="settingsPage">
    <template v-if="unlocked">
      <div v-show="settingsSectionTypeOpenInMobile != null">
        <button
          class="returnToMenuMobileButton"
          :aria-label="t('Settings.Return to Settings Menu')"
          :title="t('Settings.Return to Settings Menu')"
          @click="returnToSettingsMenu"
        >
          <FontAwesomeIcon
            class="returnToMenuMobileIcon"
            :icon="['fas', 'angle-left']"
          />
        </button>
      </div>
      <FtSettingsMenu
        v-show="isInDesktopView || settingsSectionTypeOpenInMobile == null"
        :settings-sections="settingsSectionComponents"
        @navigate-to-section="navigateToSection"
      />
      <div
        v-show="isInDesktopView || settingsSectionTypeOpenInMobile != null"
        class="settingsContent"
      >
        <div class="switchRow">
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
        <div class="settingsSections">
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

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
import FtSettingsMenu from '../../components/FtSettingsMenu/FtSettingsMenu.vue'

import store from '../../store/index'

const USING_ELECTRON = !!process.env.IS_ELECTRON
const ACTIVE_CLASS_NAME = 'active'
const SETTINGS_MOBILE_WIDTH_THRESHOLD = 1015

const { locale, t } = useI18n()

const isInDesktopView = ref(true)
const settingsSectionTypeOpenInMobile = ref(null)

/** @type {import('vue').ComputedRef<boolean>} */
const settingsSectionSortEnabled = computed(() => store.getters.getSettingsSectionSortEnabled)

const settingsComponentsData = computed(() => {
  return [
    {
      type: 'theme-settings',
      title: t('Settings.Theme Settings.Theme Settings'),
      icon: ['fas', 'display'],
      component: ThemeSettings
    },
    {
      type: 'player-settings',
      title: t('Settings.Player Settings.Player Settings'),
      icon: ['fas', 'circle-play'],
      component: PlayerSettings
    },
    ...(process.env.IS_ELECTRON
      ? [{
          type: 'external-player-settings',
          title: t('Settings.External Player Settings.External Player Settings'),
          icon: ['fas', 'clapperboard'],
          component: ExternalPlayerSettings
        }]
      : []),
    {
      type: 'subscription-settings',
      title: t('Settings.Subscription Settings.Subscription Settings'),
      icon: ['fas', 'play'],
      component: SubscriptionSettings
    },
    {
      type: 'distraction-settings',
      title: t('Settings.Distraction Free Settings.Distraction Free Settings'),
      icon: ['fas', 'eye-slash'],
      component: DistractionSettings
    },
    {
      type: 'parental-control-settings',
      title: t('Settings.Parental Control Settings.Parental Control Settings'),
      icon: ['fas', 'user-lock'],
      component: ParentalControlSettings
    },
    {
      type: 'privacy-settings',
      title: t('Settings.Privacy Settings.Privacy Settings'),
      icon: ['fas', 'lock'],
      component: PrivacySettings
    },
    {
      type: 'data-settings',
      title: t('Settings.Data Settings.Data Settings'),
      icon: ['fas', 'database'],
      component: DataSettings
    },
    ...(process.env.IS_ELECTRON
      ? [
          {
            type: 'proxy-settings',
            title: t('Settings.Proxy Settings.Proxy Settings'),
            icon: ['fas', 'network-wired'],
            component: ProxySettings
          }
        ]
      : []),
    {
      type: 'sponsor-block-settings',
      title: t('Settings.SponsorBlock Settings.SponsorBlock Settings'),
      // TODO: replace with SponsorBlock icon
      icon: ['fas', 'shield'],
      component: SponsorBlockSettings
    },
    {
      type: 'password-settings',
      title: t('Settings.Password Settings.Password Settings'),
      icon: ['fas', 'key'],
      component: PasswordSettings
    },
    ...(process.env.IS_ELECTRON
      ? [{
          type: 'experimental-settings',
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
    type: 'general-settings',
    title: t('Settings.General Settings.General Settings'),
    icon: ['fas', 'border-all'],
    component: GeneralSettings
  }

  return [generalSettingsEntry, ...settingsSections]
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
  window.removeEventListener('resize', handleResize)
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

  // mark first section as active before any scrolling has taken place
  const firstSection = document.getElementById(settingsSectionComponents.value[0].type)
  firstSection.classList.add(ACTIVE_CLASS_NAME)
}

const sectionRefs = useTemplateRef('sectionRefs')

/**
 * @param {string} sectionType
 */
function navigateToSection(sectionType) {
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

function returnToSettingsMenu() {
  const openSection = settingsSectionTypeOpenInMobile.value
  settingsSectionTypeOpenInMobile.value = null

  // focus the corresponding Settings Menu title
  nextTick(() => document.getElementById(openSection)?.focus())
}

/* Set the current section to be shown as active in the Settings Menu
* if it is the lowest section within the top quarter of the viewport (25vh) */
function markScrolledToSectionAsActive() {
  const scrollY = window.scrollY + window.innerHeight / 4

  sectionRefs.value.forEach((sectionRef) => {
    const sectionElement = sectionRef.$el

    const sectionHeight = sectionElement.offsetHeight
    const sectionTop = sectionElement.offsetTop
    const correspondingMenuLink = document.getElementById(sectionElement.dataset.section)

    if (isInDesktopView.value && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      correspondingMenuLink.classList.add(ACTIVE_CLASS_NAME)
    } else {
      correspondingMenuLink.classList.remove(ACTIVE_CLASS_NAME)
    }
  })
}

function handleResize() {
  const wasNotInDesktopView = !isInDesktopView.value
  isInDesktopView.value = window.innerWidth > SETTINGS_MOBILE_WIDTH_THRESHOLD

  // navigate to section that was open in mobile or desktop view, if any
  if (isInDesktopView.value && wasNotInDesktopView && settingsSectionTypeOpenInMobile.value != null) {
    navigateToSection(settingsSectionTypeOpenInMobile.value)
    settingsSectionTypeOpenInMobile.value = null
  } else if (!isInDesktopView.value && !wasNotInDesktopView) {
    const activeMenuLink = document.querySelector(`.settingsMenu .title.${ACTIVE_CLASS_NAME}`)
    if (!activeMenuLink) {
      return
    }

    const sectionType = activeMenuLink.id
    navigateToSection(sectionType)
  }
}
</script>

<style scoped src="./Settings.css" />
