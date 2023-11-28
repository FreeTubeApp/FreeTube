import { defineComponent } from 'vue'
import { parseCaptionString, transformCaptions } from '../../helpers/captions'
import { showSaveDialog, showToast, writeFileFromDialog } from '../../helpers/utils'
import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtSelect from '../ft-select/ft-select.vue'

export default defineComponent({
  name: 'Watch',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton,
    'ft-select': FtSelect,
  },

  props: {
    captionHybridList: {
      type: Array,
      default: () => []
    },
    videoId: {
      type: String,
      required: true
    },
    videoTimestamp: {
      type: Number,
      default: -1
    }
  },

  data: function () {
    return {
      activeLanguage: '',
      activeCaption: undefined,
      activeCueIndex: -1,
      autoScrollDisabled: false,
      autoScrollTimeout: undefined,
      captions: [],
      captionLanguages: [],
      timestamp: -1,
      timestampShown: true,
    }
  },

  computed: {
    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    menuOptions: function () {
      return [
        {
          label: this.$t('Transcript.Toggle timestamps'),
          value: 'toggle-timestamp'
        },
        {
          label: this.$t('Transcript.Download Transcript (txt)'),
          value: 'dl-transcript-txt'
        },
        {
          label: this.$t('Transcript.Download Transcript (vtt)'),
          value: 'dl-transcript-vtt'
        }
      ]
    }
  },

  watch: {
    videoTimestamp: function (value) {
      if (!this.activeCaption || this.timestamp === value) return
      this.timestamp = value

      for (const [index, cue] of this.activeCaption.cues.entries()) {
        if (value >= cue.startTime && value < cue.endTime) {
          this.activeCueIndex = index
          this.autoScrollCue()
          break
        }
      }
    }
  },

  mounted: async function () {
    this.captions = await transformCaptions(this.captionHybridList, this.currentLocale)
    this.activeCaption = await parseCaptionString(this.captions[0])
    this.activeLanguage = this.activeCaption.label
    this.captionLanguages = this.captions.map(caption => caption.label)
    this.timestamp = this.videoTimestamp
  },

  methods: {
    autoScrollCue: function () {
      if (this.autoScrollDisabled) return

      const body = this.$refs.cueBody
      const activeCue = this.$refs.cueBody.children[this.activeCueIndex]
      if (!body || !activeCue) return

      let offsetTop = activeCue.offsetTop - body.offsetTop

      // Show previous 2 cues if possible
      if (this.activeCueIndex > 0) offsetTop -= this.$refs.cueBody.children[this.activeCueIndex - 1].offsetHeight
      if (this.activeCueIndex > 1) offsetTop -= this.$refs.cueBody.children[this.activeCueIndex - 2].offsetHeight

      // Raise flag to indicate scroll was automated
      body.setAttribute('data-autoscroll', '')
      body.scrollTo({ top: offsetTop })
    },

    /**
     * If scroll was detected and it was from the user, disable autoscroll
     * from video playback for a couple of seconds
     * @param {Event} event
     * @returns
     */
    disableAutoScroll: function (event) {
      // If scroll was automated, do not disable autoscroll
      if (event.target.hasAttribute('data-autoscroll')) {
        event.target.removeAttribute('data-autoscroll')
        return
      }

      clearTimeout(this.autoScrollTimeout)
      this.autoScrollDisabled = true

      this.autoScrollTimeout = setTimeout(() => {
        this.autoScrollDisabled = false
      }, 3000)
    },

    handleMenuClick: function (menuAction) {
      switch (menuAction) {
        case 'toggle-timestamp':
          this.timestampShown = !this.timestampShown
          break
        case 'dl-transcript-txt':
          this.downloadTranscript('txt')
          break
        case 'dl-transcript-vtt':
          this.downloadTranscript('vtt')
          break
      }
    },

    /**
     * @param {('txt'|'vtt')} type
     */
    downloadTranscript: async function (type) {
      const fileName = `${this.videoId}_${this.activeCaption.language_code}.${type}`

      let fileContent
      if (type === 'txt') {
        fileContent = this.activeCaption.cues.reduce((acc, cur) => {
          return `${acc}\n\n${cur.startTimeFormatted}\n${cur.text}`
        }, '')
      } else if (type === 'vtt') {
        fileContent = this.activeCaption.vttString
      }
      fileContent = fileContent.trim()

      const options = {
        defaultPath: fileName,
        filters: [
          {
            name: this.$t('Transcript.Transcript File'),
            extensions: [type]
          }
        ]
      }

      const response = await showSaveDialog(options)
      if (response.canceled || response.filePath === '') return

      try {
        await writeFileFromDialog(response, fileContent)
      } catch (writeErr) {
        const message = this.$t('Transcript.Unable to download transcript file')
        showToast(`${message}: ${writeErr}`)
        return
      }

      showToast(this.$t('Transcript.Transcript file downloaded'))
    },

    handleLanguageChange: async function (language) {
      this.activeCaption = false
      this.activeCaption = this.captions.find(caption => caption.label === language)
      this.activeCaption = await parseCaptionString(this.activeCaption)
      this.activeLanguage = this.activeCaption.label
    },
  },
})
