import videojs from 'video.js'

export default Vue.extend({
    name: 'FtVideoStats',
    props: {
        player: {
            type: videojs.Player,
            required: true
        },
        id: {
            type: String,
            require=true,
        }
    },
    data: function () {
        return {
            video_id: null,
            player_resolution: null, //videojs.getTech('Html5').currentDimension();
            frame_drop: null,
            volume: null, //videojs.getTech('Html5').volume();
            network_state: null, //this.player.network_state()
            network_speed: null,
            data_transfer_speed: null,
            buffer_time: null, //videojs.getTech('Html5').buffered();
            buffer_percent: null, //videojs.getTech('Html5').bufferedPercent()
        }
    }
})