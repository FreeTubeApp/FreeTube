import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtRadioButton from '../ft-radio-button/ft-radio-button.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'

export default defineComponent({
  name: 'FtSearchFilters',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-radio-button': FtRadioButton,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton
  },
  data: function () {
    return {
      sortByValues: [
        'relevance',
        'rating',
        'upload_date',
        'view_count'
      ],
      timeValues: [
        '',
        'hour',
        'today',
        'week',
        'month',
        'year'
      ],
      typeValues: [
        'all',
        'video',
        'channel',
        'playlist',
        'movie'
      ],
      durationValues: [
        '',
        'short',
        'medium',
        'long'
      ]
    }
  },
  computed: {
    title: function () {
      return this.$t('Search Filters.Search Filters')
    },

    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    searchFilterValueChanged: function() {
      return [
        this.$refs.sortByRadio.selectedValue !== this.sortByValues[0],
        this.$refs.timeRadio.selectedValue !== this.timeValues[0],
        this.$refs.typeRadio.selectedValue !== this.typeValues[0],
        this.$refs.durationRadio.selectedValue !== this.durationValues[0]
      ].some((bool) => bool === true)
    },

    sortByLabels: function () {
      return [
        this.$t('Search Filters.Sort By.Most Relevant'),
        this.$t('Search Filters.Sort By.Rating'),
        this.$t('Search Filters.Sort By.Upload Date'),
        this.$t('Search Filters.Sort By.View Count')
      ]
    },

    timeLabels: function () {
      return [
        this.$t('Search Filters.Time.Any Time'),
        this.$t('Search Filters.Time.Last Hour'),
        this.$t('Search Filters.Time.Today'),
        this.$t('Search Filters.Time.This Week'),
        this.$t('Search Filters.Time.This Month'),
        this.$t('Search Filters.Time.This Year')
      ]
    },

    typeLabels: function () {
      return [
        this.$t('Search Filters.Type.All Types'),
        this.$t('Search Filters.Type.Videos'),
        this.$t('Search Filters.Type.Channels'),
        this.$t('Playlists'),
        this.$t('Search Filters.Type.Movies')
      ]
    },

    durationLabels: function () {
      return [
        this.$t('Search Filters.Duration.All Durations'),
        this.$t('Search Filters.Duration.Short (< 4 minutes)'),
        this.$t('Search Filters.Duration.Medium (4 - 20 minutes)'),
        this.$t('Search Filters.Duration.Long (> 20 minutes)')
      ]
    }
  },
  methods: {
    isVideoOrMovieOrAll(type) {
      return type === 'video' || type === 'movie' || type === 'all'
    },

    updateSortBy: function (value) {
      this.$store.commit('setSearchSortBy', value)
      this.$store.commit('setSearchFilterValueChanged', this.searchFilterValueChanged)
    },

    updateTime: function (value) {
      if (!this.isVideoOrMovieOrAll(this.searchSettings.type)) {
        const typeRadio = this.$refs.typeRadio
        typeRadio.updateSelectedValue('all')
        this.$store.commit('setSearchType', 'all')
      }
      this.$store.commit('setSearchTime', value)
      this.$store.commit('setSearchFilterValueChanged', this.searchFilterValueChanged)
    },

    updateType: function (value) {
      if (value === 'channel' || value === 'playlist') {
        const timeRadio = this.$refs.timeRadio
        const durationRadio = this.$refs.durationRadio
        const sortByRadio = this.$refs.sortByRadio
        timeRadio.updateSelectedValue('')
        durationRadio.updateSelectedValue('')
        sortByRadio.updateSelectedValue(this.sortByValues[0])
        this.$store.commit('setSearchTime', '')
        this.$store.commit('setSearchDuration', '')
        this.$store.commit('setSearchSortBy', this.sortByValues[0])
      }
      this.$store.commit('setSearchType', value)
      this.$store.commit('setSearchFilterValueChanged', this.searchFilterValueChanged)
    },

    updateDuration: function (value) {
      if (value !== '' && !this.isVideoOrMovieOrAll(this.searchSettings.type)) {
        const typeRadio = this.$refs.typeRadio
        typeRadio.updateSelectedValue('all')
        this.updateType('all')
      }
      this.$store.commit('setSearchDuration', value)
      this.$store.commit('setSearchFilterValueChanged', this.searchFilterValueChanged)
    },

    ...mapActions([
      'hideSearchFilters'
    ])
  }
})
