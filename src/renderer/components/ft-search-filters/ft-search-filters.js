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
      sortByTitle: 'Sort By',
      sortByLabels: [
        'Most Relevant',
        'Rating',
        'Upload Date',
        'View Count'
      ],
      sortByValues: [
        'relevance',
        'rating',
        'upload_date',
        'view_count'
      ],
      timeTitle: 'Time',
      timeLabels: [
        'Any Time',
        'Last Hour',
        'Today',
        'This Week',
        'This Month',
        'This Year'
      ],
      timeValues: [
        '',
        'hour',
        'today',
        'week',
        'month',
        'year'
      ],
      typeTitle: 'Type',
      typeLabels: [
        'All Types',
        'Videos',
        'Channels',
        'Playlists'
      ],
      typeValues: [
        'all',
        'video',
        'channel',
        'playlist'
      ],
      durationTitle: 'Duration',
      durationLabels: [
        'All Durations',
        'Short (< 4 minutes)',
        'Long (> 20 minutes)'
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
