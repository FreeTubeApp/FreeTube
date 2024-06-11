import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtRadioButton from '../ft-radio-button/ft-radio-button.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtCheckboxList from '../ft-checkbox-list/ft-checkbox-list.vue'

export default defineComponent({
  name: 'FtSearchFilters',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-radio-button': FtRadioButton,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'ft-checkbox-list': FtCheckboxList
  },
  data: function () {
    return {
      searchSortByStartIndex: 0,
      searchTimeStartIndex: 0,
      searchTypeStartIndex: 0,
      searchDurationStartIndex: 0,
      searchDefaultFeatures: [],
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
      ],
      featureValues: [
        'hd',
        'subtitles',
        'creative_commons',
        '3d',
        'live',
        '4k',
        '360',
        'location',
        'hdr',
        'vr180'
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
        this.$refs.durationRadio.selectedValue !== this.durationValues[0],
        this.$refs.featuresCheck.selectedValues.length !== 0
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
    },

    featureLabels: function() {
      return [
        this.$t('Search Filters.Features.HD'),
        this.$t('Search Filters.Features.Subtitles'),
        this.$t('Search Filters.Features.Creative Commons'),
        this.$t('Search Filters.Features.3D'),
        this.$t('Search Filters.Features.Live'),
        this.$t('Search Filters.Features.4K'),
        this.$t('Search Filters.Features.360 Video'),
        this.$t('Search Filters.Features.Location'),
        this.$t('Search Filters.Features.HDR'),
        this.$t('Search Filters.Features.VR180')
      ]
    },
  },
  created: function () {
    this.searchSortByStartIndex = this.sortByValues.indexOf(this.searchSettings.sortBy)
    this.searchTimeStartIndex = this.timeValues.indexOf(this.searchSettings.time)
    this.searchTypeStartIndex = this.typeValues.indexOf(this.searchSettings.type)
    this.searchDurationStartIndex = this.durationValues.indexOf(this.searchSettings.duration)
    this.searchDefaultFeatures = [...this.searchSettings.features]
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

    updateFeatures: function(value) {
      if (!this.isVideoOrMovieOrAll(this.searchSettings.type)) {
        const featuresCheck = this.$refs.featuresCheck
        featuresCheck.removeSelectedValues()
        this.$store.commit('setSearchType', 'all')
      }

      this.$store.commit('setSearchFeatures', value)
      this.$store.commit('setSearchFilterValueChanged', this.searchFilterValueChanged)
    },

    updateType: function (value) {
      if (value === 'channel' || value === 'playlist') {
        const timeRadio = this.$refs.timeRadio
        const durationRadio = this.$refs.durationRadio
        const sortByRadio = this.$refs.sortByRadio
        const featuresCheck = this.$refs.featuresCheck
        timeRadio.updateSelectedValue('')
        durationRadio.updateSelectedValue('')
        sortByRadio.updateSelectedValue(this.sortByValues[0])
        featuresCheck.removeSelectedValues()
        this.$store.commit('setSearchTime', '')
        this.$store.commit('setSearchDuration', '')
        this.$store.commit('setSearchFeatures', [])
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
