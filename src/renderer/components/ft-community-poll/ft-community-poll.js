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
      revealAnswer: false
    }
  },
  methods: {
    getQuizOptionClass(index) {
      return this.data.content[index].isCorrect ? 'correct-option' : ''
    }
  }
})
