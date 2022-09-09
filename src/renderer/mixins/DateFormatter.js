const DateFormatter = {
  methods: {
    toLocalePublicationString ({ publishedText, publishedDate, isLive = false, isUpcoming = false, isRSS = false }) {
      if (isLive) {
        const liveStreamString = this.$t('Video.Watching')
        return '0' + liveStreamString
      } else if (isUpcoming || publishedText === null) {
        // the check for null is currently just an inferring of knowledge,
        // because there is no other possibility left
        const upcomingString = this.$t('Video.Published.Upcoming')
        return `${upcomingString}: ${publishedText}`
      }
      const now = new Date()
      publishedDate = new Date(publishedDate)
      const dateDiff = now - publishedDate
      const unitAndNumeral = this.unitAndNumberFromMillis(dateDiff)
      return this.stringFromNumberAndUnit(unitAndNumeral)
    },

    stringFromNumberAndUnit({ num, unit }) {
      if (num > 1) { unit += 's' }
      const templateString = this.$t('Video.Publicationtemplate').replace('$', num)
      return templateString.replace('%', this.$t('Video.Published')[unit])
    },

    unitAndNumberFromMillis(millis) {
      const years = Math.floor(millis / 31557600000)
      if (years > 0) return { unit: 'Year', num: years }
      const months = Math.floor(millis / 2629800000)
      if (months > 0) return { unit: 'Month', num: months }
      const weeks = Math.floor(millis / 604800000)
      if (weeks > 0) return { unit: 'Week', num: weeks }
      const days = Math.floor(millis / 86400000)
      if (days > 0) return { unit: 'Day', num: days }
      const hours = Math.floor(millis / 3600000)
      if (hours > 0) return { unit: 'Hour', num: hours }
      const minutes = Math.floor(millis / 60000)
      if (minutes > 0) return { unit: 'Minute', num: minutes }
    }
  }
}

export default DateFormatter
