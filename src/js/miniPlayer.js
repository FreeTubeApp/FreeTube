/*
    This file is part of FreeTube.

    FreeTube is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    FreeTube is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with FreeTube.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * A file for handling mini-player functionality
 */

import Vue from '../js/vue.js';

const electron = require('electron');

let mouseTimeout; // Timeout for hiding the mouse cursor on video playback
let checkedSettings = true;

let miniPlayerView = new Vue({
  el: '#player',
  data: {
    video360p: '',
    valid360p: true,
    video720p: '',
    valid720p: true,
    videoAudio: '',
    validAudio: true,
    videoDash: '',
    validDash: true,
    videoLive: '',
    validLive: false,
    subtitleHtml: '',
    videoThumbnail: '',
    defaultPlaybackRate: '',
    quality: '',
    volume: '',
    currentTime: '',
  }
});

/**
 * Hide the mouse cursor after ~3 seconds.  Used to hide the video when the user
 * hovers the mouse over the video player.
 *
 * @return {Void}
 */
function hideMouseTimeout() {
    $('.videoPlayer')[0].style.cursor = 'default';
    clearTimeout(mouseTimeout);
    mouseTimeout = window.setTimeout(function () {
        $('.videoPlayer')[0].style.cursor = 'none';
    }, 2800);
}

/**
 * Remove the timeout for the mouse cursor as a fallback.
 *
 * @return {Void}
 */
function removeMouseTimeout() {
    $('.videoPlayer')[0].style.cursor = 'default';
    clearTimeout(mouseTimeout);
}

function checkVideoSettings() {
  if (checkedSettings === false) {
    return;
  }

  let player = new MediaElementPlayer('player', {
    features: ['playpause', 'current', 'loop', 'tracks', 'progress', 'duration', 'volume', 'stop', 'speed', 'quality', 'fullscreen'],
    speeds: ['2', '1.75', '1.5', '1.25', '1', '0.75', '0.5', '0.25'],
    defaultSpeed: miniPlayerView.defaultPlaybackRate,
    qualityText: 'Quality',
    defaultQuality: miniPlayerView.quality,
    stretching: 'responsive',
    startVolume: miniPlayerView.volume,

    success: function(mediaElement, originalNode, instance) {
      console.log(mediaElement,originalNode,instance);

      instance.currentTime = miniPlayerView.currentTime;
      instance.play();

      checkedSettings = false;

      /*if (autoplay) {
          instance.play();
      }

      if (enableSubtitles) {
          instance.options.startLanguage = 'en';
      }*/
    }
  });
}

electron.ipcRenderer.on('ping', function(event, message) {
   console.log(message);

   miniPlayerView.video360p = message.video360p;
   miniPlayerView.valid360p = message.valid360p;
   miniPlayerView.video720p = message.video720p;
   miniPlayerView.valid720p = message.valid720p;
   miniPlayerView.videoAudio = message.videoAudio;
   miniPlayerView.validAudio = message.validAudio;
   miniPlayerView.videoDash = message.videoDash;
   miniPlayerView.validDash = message.validDash;
   miniPlayerView.videoLive = message.videoLive;
   miniPlayerView.validLive = message.validLive;
   miniPlayerView.subtitleHtml = message.subtitleHtml;
   miniPlayerView.videoThumbnail = message.videoThumbnail;
   miniPlayerView.defaultPlaybackRate = message.defaultPlaybackRate;
   miniPlayerView.quality = message.quality;
   miniPlayerView.volume = message.volume;
   miniPlayerView.currentTime = message.currentTime;

   window.setTimeout(checkVideoSettings, 100);
});
