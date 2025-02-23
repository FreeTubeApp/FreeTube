<template>
  <div>
    <FtCard class="card">
      <h2>
        <FontAwesomeIcon
          :icon="['fas', 'info-circle']"
          class="headingIcon"
          fixed-width
        />
        {{ $t("About.About") }}
      </h2>
      <section class="brand">
        <FtLogoFull class="logo" />
        <div class="version">
          {{ versionNumber }} {{ $t("About.Beta") }}
        </div>
      </section>
      <section class="about-chunks">
        <figure
          v-for="chunk in chunks"
          :key="chunk.title"
          class="chunk"
        >
          <FontAwesomeIcon
            class="icon"
            :icon="chunk.icon"
          />
          <h3 class="title">
            {{ chunk.title }}
          </h3>
          <div
            class="content"
            v-html="chunk.content"
          />
        </figure>
      </section>
    </FtCard>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtLogoFull from '../../components/FtLogoFull/FtLogoFull.vue'

import { ABOUT_BITCOIN_ADDRESS } from '../../../constants'
import packageDetails from '../../../../package.json'

const { t } = useI18n()

const versionNumber = `v${packageDetails.version}`

const chunks = computed(() => [
  {
    icon: ['fab', 'github'],
    title: t('About.Source code'),
    content: `<a href="https://github.com/FreeTubeApp/FreeTube" lang="en">GitHub: FreeTubeApp/FreeTube</a><br>${t('About.Licensed under the')} <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">${t('About.AGPLv3')}</a>`
  },
  {
    icon: ['fas', 'file-download'],
    title: t('About.Downloads / Changelog'),
    content: `<a href="https://github.com/FreeTubeApp/FreeTube/releases">${t('About.GitHub releases')}</a>`
  },
  {
    icon: ['fas', 'question-circle'],
    title: t('About.Help'),
    content: `<a href="https://docs.freetubeapp.io/">${t('About.FreeTube Wiki')}</a> / <a href="https://docs.freetubeapp.io/faq/">${t('About.FAQ')}</a> / <a href="https://github.com/FreeTubeApp/FreeTube/discussions/">${t('About.Discussions')}</a>`
  },
  {
    icon: ['fas', 'exclamation-circle'],
    title: t('About.Report a problem'),
    content: `<a href="https://github.com/FreeTubeApp/FreeTube/issues">${t('About.GitHub issues')}</a><br>${t('About.Please check for duplicates before posting')}`
  },
  {
    icon: ['fas', 'globe'],
    title: t('About.Website'),
    content: '<a href="https://freetubeapp.io/">https://freetubeapp.io/</a>'
  },
  {
    icon: ['fas', 'newspaper'],
    title: t('About.Blog'),
    content: '<a href="https://blog.freetubeapp.io">https://blog.freetubeapp.io</a>'
  },
  {
    icon: ['fas', 'envelope'],
    title: t('About.Email'),
    content: '<a href="mailto:FreeTubeApp@protonmail.com">FreeTubeApp@protonmail.com</a>'
  },
  {
    icon: ['fab', 'mastodon'],
    title: t('About.Mastodon'),
    content: '<a href="https://fosstodon.org/@FreeTube">@FreeTube@fosstodon.org</a>'
  },
  {
    icon: ['fas', 'comment-dots'],
    title: t('About.Chat on Matrix'),
    content: `<a href="https://matrix.to/#/#freetube:matrix.org">#freetube:matrix.org</a><br>${t('About.Please read the')} <a href="https://docs.freetubeapp.io/community/matrix/">${t('About.room rules')}</a>`
  },
  {
    icon: ['fas', 'language'],
    title: t('About.Translate'),
    content: '<a href="https://hosted.weblate.org/engage/free-tube/">https://hosted.weblate.org/engage/free-tube/</a>'
  },
  {
    icon: ['fas', 'users'],
    title: t('About.Credits'),
    content: `${t('About.FreeTube is made possible by')} <a href="https://docs.freetubeapp.io/credits/">${t('About.these people and projects')}</a>`
  },
  {
    icon: ['fab', 'bitcoin'],
    title: `${t('About.Donate')} - BTC`,
    content: `<a href="bitcoin:${ABOUT_BITCOIN_ADDRESS}">${ABOUT_BITCOIN_ADDRESS}</a>`
  }
])
</script>

<style scoped src="./About.css" />
