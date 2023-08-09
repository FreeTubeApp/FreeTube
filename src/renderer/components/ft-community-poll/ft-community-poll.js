import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtCommunityPoll',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data: function () {
    return {
      active: -1
    }
  },
  methods: {
    getQuizOptionClass(index) {
      return `${this.data.content[index].isCorrect ? 'correct' : 'incorrect'}-option`
    }
  }
})
