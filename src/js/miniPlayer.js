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
let checkedSettings = false;

let miniPlayerView = new Vue({
  el: '#miniPlayer',
  data: {
    videoId: '',
    videoUrl: '',
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
    playerSeen: true,
    legacySeen: false,
    autoplay: true,
    enableSubtitles: false,
    thumbnailInterval: 5,
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

function checkDashSettings() {
    // Mediaelement.js for some reason calls onLoadStart() multiple times
    // This check is here to force checkVideoSettings to only run once.
    if (checkedSettings) {
      return;
    }

    checkedSettings = true;
    let checked720p = false;
    let checked360p = false;
    let checkedAudio = false;
    let checkedDash = false;
    let parseDash = true;
    let quality = 'Auto';

    let declarePlayer = function() {
      if (!checkedDash) {
        return;
      }

      if (miniPlayerView.validLive) {
        quality = 'Live';
      }

        let player = new MediaElementPlayer('player', {
          features: ['playpause', 'current', 'progress', 'duration', 'volume', 'stop', 'speed', 'quality', 'loop', 'tracks', 'fullscreen', 'timerailthumbnails'],
          speeds: ['2', '1.75', '1.5', '1.25', '1', '0.75', '0.5', '0.25'],
          renderers: ['native_dash', 'native_hls', 'html5'],
          defaultSpeed: miniPlayerView.defaultPlaybackRate,
          autoGenerate: true,
          autoDash: true,
          autoHLS: false,
          qualityText: 'Quality',
          defaultQuality: 'Auto',
          stretching: 'responsive',
          startVolume: miniPlayerView.volume,
          timeRailThumbnailsSeconds: miniPlayerView.thumbnailInterval,

          success: function(mediaElement, originalNode, instance) {
            ft.log(mediaElement,originalNode,instance);

            if (miniPlayerView.autoplay) {
                instance.play();
            };

            window.setTimeout(() => {
              if (miniPlayerView.enableSubtitles) {
                instance.options.startLanguage = 'en';
              };
            }, 2000);

            let initializeSettings = function() {
              let qualityOptions = $('.mejs__qualities-selector-input').get();

              if (qualityOptions.length < 2) {
                // Other plugin hasn't finished making the qualities.  Let's try again in a moment.

                window.setTimeout(initializeSettings, 500);
                return;
              }

              if (typeof(miniPlayerView.currentTime) !== 'undefined') {
                instance.currentTime = miniPlayerView.currentTime;
                miniPlayerView.currentTime = undefined;
              }

              let selectedOption = false;
              qualityOptions.reverse().forEach((option, index) => {
                if (option.value === miniPlayerView.quality || option.value === miniPlayerView.quality + 'p') {
                  option.click();
                  selectedOption = true;
                }
              });

              if (selectedOption === false) {
                // Assume user selected a higher quality as their default.  Select the highest option available.
                ft.log('Quality not available.');
                ft.log(qualityOptions.reverse()[0]);

                qualityOptions.reverse()[0].click();
              }
            };

            initializeSettings();
          },

          error: function(error, originalNode, instance) {
            ft.log(error);
            ft.log(originalNode);
            ft.log(instance);
            showToast('There was an error with playing DASH formats.  Reverting to the legacy formats.');
            checkedSettings = false;
            miniPlayerView.currentTime = instance.currentTime;
            miniPlayerView.legacyFormats();
          }
        });
    };

    if (miniPlayerView.validDash !== false) {
      validateUrl(miniPlayerView.videoDash, (valid) => {
        miniPlayerView.validDash = valid;
        checkedDash = true;
        declarePlayer();
      });
    }
    else if (miniPlayerView.validLive !==  false) {
      checkedDash = true;
      declarePlayer();
    }
    else {
      miniPlayerView.legacyFormats();
    }

    return;
}

function checkLegacySettings() {
  let legacyPlayer = document.getElementById('legacyPlayer');

  let checked720p = false;
  let checked360p = false;
  let checkedAudio = false;

  let declarePlayer = function() {
    if (!checked720p || !checked360p || !checkedAudio) {
      return;
    }

    if (typeof(miniPlayerView.currentTime) !== 'undefined') {
      legacyPlayer.currentTime = miniPlayerView.currentTime;
      miniPlayerView.currentTime = undefined;
    }

    if (miniPlayerView.autoplay) {
        legacyPlayer.play();
    }

    changeVideoSpeed(miniPlayerView.defaultPlaybackRate);
  };

  if (miniPlayerView.valid360p !== false) {
    validateUrl(miniPlayerView.video360p, (valid) => {
      miniPlayerView.valid360p = valid;
      checked360p = true;
      declarePlayer();
    });
  }
  else {
    checked360p = true;
    declarePlayer();
  }

  if (miniPlayerView.valid720p !== false) {
    validateUrl(miniPlayerView.video720p, (valid) => {
      miniPlayerView.valid720p = valid;
      checked720p = true;
      declarePlayer();
    });
  }
  else {
    checked720p = true;
    declarePlayer();
  }

  if (miniPlayerView.validAudio !== false) {
    validateUrl(miniPlayerView.videoAudio, (valid) => {
      miniPlayerView.validAudio = valid;
      checkedAudio = true;
      declarePlayer();
    });
  }
  else {
    checkedAudio = true;
    declarePlayer();
  }

  return;
}

function validateUrl(videoUrl, callback) {
    if (typeof (videoUrl) !== 'undefined') {
        let getUrl = fetch(videoUrl);
        getUrl.then((status) => {
            switch (status.status) {
            case 404:
                callback(false);
                return;
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                callback(false)
                return;
                break;
            default:
                ft.log('videoUrl is valid');
                callback(true);
                return;
                break;
            }
        });
    } else {
        callback(false);
        return;
    }
}

/**
 * Change the playpack speed of the video.
 *
 * @param {double} speed - The playback speed of the video.
 *
 * @return {Void}
 */
function changeVideoSpeed(speed) {
  if (miniPlayerView.legacySeen) {
    $('#currentSpeed').html(speed);
    $('.videoPlayer').get(0).playbackRate = speed;
  }
  else {
    let speedOptions = $('.mejs__speed-selector-input').get();
    speedOptions.forEach((option, index) => {
      if (option.value == speed) {
        option.click();
        player.playbackRate = speed;
      }
    });
  }
}

function hideConfirmFunction() {
  return;
}

electron.ipcRenderer.on('ping', function(event, message) {
   console.log(message);

   miniPlayerView.videoId = message.videoId;
   miniPlayerView.videoUrl = message.videoUrl;
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
   miniPlayerView.playerSeen = message.playerSeen;
   miniPlayerView.legacySeen = message.legacySeen;
   miniPlayerView.autoplay = message.autoplay;
   miniPlayerView.enableSubtitles = message.enableSubtitles;
   miniPlayerView.thumbnailInterval = message.thumbnailInterval;

   window.setTimeout(checkDashSettings, 100);
});

electron.ipcRenderer.on('play360p', function(event, message) {
  if (!miniPlayerView.valid360p) {
    return;
  }

  let videoPlayer = $('.videoPlayer').get(0);

  videoPlayer.pause();

  let time = videoPlayer.currentTime;

  console.log(time);

  miniPlayerView.videoUrl = miniPlayerView.video360p;

  setTimeout(() => {videoPlayer.currentTime = time; videoPlayer.play();}, 100);
});

electron.ipcRenderer.on('play720p', function(event, message) {
  if (!miniPlayerView.valid720p) {
    return;
  }

  let videoPlayer = $('.videoPlayer').get(0);

  videoPlayer.pause();

  let time = videoPlayer.currentTime;

  console.log(time);

  miniPlayerView.videoUrl = miniPlayerView.video720p;

  setTimeout(() => {videoPlayer.currentTime = time; videoPlayer.play();}, 100);
});

electron.ipcRenderer.on('playAudio', function(event, message) {
  if (!miniPlayerView.validAudio) {
    return;
  }

  let videoPlayer = $('.videoPlayer').get(0);

  videoPlayer.pause();

  let time = videoPlayer.currentTime;

  console.log(time);

  miniPlayerView.videoUrl = miniPlayerView.videoAudio;

  setTimeout(() => {videoPlayer.currentTime = time; videoPlayer.play();}, 100);
});

electron.ipcRenderer.on('videoSpeed', function(event, message) {
  changeVideoSpeed(message);
});

electron.ipcRenderer.on('videoLoop', function(event, message) {
  let videoPlayer = $('.videoPlayer').get(0);

  videoPlayer.loop = !videoPlayer.loop;
});
