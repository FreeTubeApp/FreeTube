<template>
  <div>
    <FtCard class="card">
      <h2>
        <FontAwesomeIcon
          :icon="['fas', 'download']"
          class="headingIcon"
          fixed-width
        />
        {{ $t("Downloads.Downloads") }}
      </h2>

      <FtButton
        v-if="false"
        :label="$t('Downloads.Start Local Fake Download')"
        @click="startLocalFakeDownload"
      />

      <section class="download-chunks">
        <figure
          v-for="(chunk, chunk_index) in chunks"
          :key="chunk_index"
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
          <FtIconButton
            v-if="chunk.status == 'downloading'"
            class="action"
            :title="$t('Downloads.Cancel')"
            :icon="['fas', 'xmark']"
            theme="destructive"
            @click="cancelDownload(chunk_index)"
          />
        </figure>
      </section>
    </FtCard>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtButton from '../../components/FtButton/FtButton.vue'
import store from '../../store/index'

const { t } = useI18n()

export default defineComponent({
  name: 'Downloads',
  components: {
    FtCard,
    FtIconButton,
    FtButton,
  },

  data: function () {
    return {
    }
  },

  computed: {

    chunks: function () {
      const allChunks = []

      const entries = store.getters.downloadsEntries

      for (const entry of entries) {
        let content = ''
        if (entry.dl.status === 'preparing') {
          content = `${t('Downloads.Preparing')}`
        } else if (entry.dl.status === 'downloading') {
          content = `${t('Downloads.Downloading')} ${entry.dl.progress}%`
        } else if (entry.dl.status === 'muxing') {
          content = `${t('Downloads.Muxing')}`
        } else if (entry.dl.status === 'complete') {
          content = `${t('Downloads.Complete')}`
        } else if (entry.dl.status === 'failed') {
          content = `${t('Downloads.Failed')}`
        }

        allChunks.push(
          {
            icon: ['fas', 'file-download'],
            title: entry.title,
            content: content,
            status: entry.dl.status,
          })
      }

      return allChunks
    }

  },

  created () {

  },

  methods: {

    cancelDownload: function (index) {
      store.dispatch('cancelDownload', index)
    },

    startLocalFakeDownload: function () {
      // console.log('starting local fake download ...')

      const entry = {
        title: 'Local Fake Download',
        items: [
          { mime: 'audio/mp4', url: 'http://localhost:1234/testdata/audio1.m4a' },
          // { mime: 'audio/webm', url: 'http://localhost:1234/testdata/audio1.webm' },
          { mime: 'video/mp4', url: 'http://localhost:1234/testdata/video1.mp4' }
        ],
      }
      store.dispatch('createNewDownload', entry)
    },

  }

})

</script>

<style scoped src="./Downloads.css" />
