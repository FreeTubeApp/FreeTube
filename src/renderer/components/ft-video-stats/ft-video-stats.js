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
      let resolution =""
      let dropFrame = ""
      if (this.stats.playerResolution !=null){
        resolution = `(${this.stats.playerResolution.height}X${this.stats.playerResolution.width})`
      }
      if (this.stats.frameInfo!=null){
        dropFrame = this.stats.frameInfo.droppedVideoFrames
      }
        return  [
          ["video id",this.stats.videoId],
          ["player resolution",resolution],
          ["fps",this.stats.fps],
          ["frame drop",dropFrame],
          ["network state",this.stats.networkState],
          ["bandwidth",this.stats.bandwidth],
          ["buffer range",this.stats.bufferTime],
          ["percentage of video buffered",this.stats.bufferPercent]
        ]
    }
  }
})
