import Vue from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtRadioButton from '../ft-radio-button/ft-radio-button.vue'

export default Vue.extend({
  name: 'FtSearchFilters',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-radio-button': FtRadioButton
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
        'playlist'
      ],
      durationValues: [
        '',
        'short',
        'long'
      ]
    }
  },
  computed: {
    searchSettings: function () {
      return this.$store.getters.getSearchSettings
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
        this.$t('Playlists')
      ]
    },

    durationLabels: function () {
      return [
        this.$t('Search Filters.Duration.All Durations'),
        this.$t('Search Filters.Duration.Short (< 4 minutes)'),
        this.$t('Search Filters.Duration.Long (> 20 minutes)')
      ]
    }
  },
  methods: {
    updateSortBy: function (value) {
      this.$store.commit('setSearchSortBy', value)
    },

    updateTime: function (value) {
      this.$store.commit('setSearchTime', value)
    },

    updateType: function (value) {
      this.$store.commit('setSearchType', value)
    },

    updateDuration: function (value) {
      this.$store.commit('setSearchDuration', value)
    }
  }
})
