import Vue from 'vue'

export default Vue.extend({
  name: 'FtVideoStats',
  props: {
    stats: {
      type: Object,
      required: true
    },
  },
  computed:{
    formated_stats: function(){
      const resolution = `(${this.stats.playerResolution}X${this.stats.playerResolution})`
        return  [
          ["video id",this.stats.videoId],
          ["player resolution",resolution],
          ["fps",this.stats.fps],
          ["frame drop",this.stats.frameDrop],
          ["network state",this.stats.networkState],
          ["bandwidth",this.stats.bandwidth],
          ["buffer range",this.stats.bufferTime],
          ["percentage of video buffered",this.stats.bufferPercent]
        ]
      
    }
  }
})
