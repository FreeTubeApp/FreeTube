/*
    This file is part of FreeTube.

    FreeTube is free software: you can redistribute it and/or modify
    sit under the terms of the GNU General Public License as published by
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
 * File for events within application.  Work needs to be done throughout the application
 * to use this style more.  Please use this style going forward if possible.
 */

/**
 * Event when user clicks comment box,
 * and wants to show/display comments for the user.
 */
let showComments = function (event, continuation = '') {
    let comments = $('#comments');

    if (comments.css('display') === 'none') {
        comments.attr('loaded', 'true');

        invidiousAPI('comments', $('#comments').attr('data-video-id'), {}, (data) => {
          ft.log(data);

          let comments = [];

          data.comments.forEach((object) => {

              let snippet = {
                author: object.author,
                authorId: object.authorId,
                authorThumbnail: object.authorThumbnails[0].url,
                published: object.publishedText,
                authorComment: object.content,
              }

              comments.push(snippet);
          })
          const commentsTemplate = require('./templates/comments.html');
          const html = mustache.render(commentsTemplate, {
              comments: comments,
          });

          $('#comments').html(html);
        });

        comments.show();
    } else {
        comments.hide();
    }
};

/**
 * Play / Pause the video player upon click.
 */
let playPauseVideo = function (event) {
    let el = event.currentTarget;
    if (el.paused && $('.videoPlayer').is(':hover')) {
      $('.videoPlayer')[0].style.cursor = 'none';
    }
};

/**
* Handle keyboard shortcut commands.
*/
let videoShortcutHandler = function (event) {
    let videoPlayer;

    if (event.which == 68 && event.altKey === true) {
      $('#search').focus();
    }

    if (event.which == 82 && event.shiftKey === false && event.ctrlKey === true && !$('#jumpToInput').is(':focus') && !$('#search').is(':focus')) {
      event.stopPropagation();
      event.preventDefault();
      forceSubscriptions();
    }

    if ((typeof(playerView) !== 'undefined' && playerView.legacySeen) || (typeof(miniPlayerView) !== 'undefined' && miniPlayerView.legacySeen)) {
      videoPlayer = $('.videoPlayer').get(0);
    }
    else {
      videoPlayer = $('#player').get(0);
    }

    if (typeof(videoPlayer) !== 'undefined' && !$('#jumpToInput').is(':focus') && !$('#search').is(':focus')) {
        switch (event.which) {
        case 32:
            // Space Bar
            event.preventDefault();
            if ($('.videoPlayer').is(':focus')) {
              return;
            }
            if (videoPlayer.paused) {
              videoPlayer.play();
              if($('.videoPlayer').is(':hover')) {
                $('.videoPlayer')[0].style.cursor = 'none';
              }
            }
            else {
              videoPlayer.pause();
            }
            break;
        case 74:
            // J Key
            event.preventDefault();
            changeDurationBySeconds(-10);
            break;
        case 75:
            // K Key
            event.preventDefault();
            if (videoPlayer.paused) {
              videoPlayer.play();
              if($('.videoPlayer').is(':hover')) {
                $('.videoPlayer')[0].style.cursor = 'none';
              }
            }
            else {
              videoPlayer.pause();
            }
            break;
        case 76:
            // L Key
            event.preventDefault();
            changeDurationBySeconds(10);
            break;
        case 79:
            // O Key
            event.preventDefault();
            if (videoPlayer.playbackRate > 0.25){
              let rate = videoPlayer.playbackRate - 0.25;
              videoPlayer.playbackRate = rate;
              changeVideoSpeed(rate);
            }
            break;
        case 80:
            // P Key
            event.preventDefault();
            if (videoPlayer.playbackRate < 2){
              let rate = videoPlayer.playbackRate + 0.25;
              videoPlayer.playbackRate = rate;
              changeVideoSpeed(rate);
            }
            break;
        case 70:
            // F Key
            event.preventDefault();
            fullscreenVideo();
            break;
        case 77:
            // M Key
            event.preventDefault();
            let volume = videoPlayer.volume;

            if (volume > 0) {
                changeVolume(-1);
            } else {
                changeVolume(1);
            }
            break;
        case 67:
            // C Key
            if (playerView.legacySeen) {
              let subtitleMode = videoPlayer.textTracks[0].mode;
              if (subtitleMode === 'hidden') {
                videoPlayer.textTracks[0].mode = 'showing'
              } else {
                videoPlayer.textTracks[0].mode = 'hidden'
              }
            }
            else {
              let captionOptions = $('.mejs__captions-selector-input').get();

              if (!captionOptions[0].labels[0].className.includes('mejs__captions-selected')) {
                captionOptions[0].click();
              }
              else {
               captionOptions[1].click();
              }
            }
            break;
        case 38:
            // Up Arrow Key
            event.preventDefault();
            changeVolume(0.05);
            break;
        case 40:
            // Down Arrow Key
            event.preventDefault();
            changeVolume(-0.05);
            break;
        case 37:
            // Left Arrow Key
            event.preventDefault();
            changeDurationBySeconds(-5);
            break;
        case 39:
            // Right Arrow Key
            event.preventDefault();
            changeDurationBySeconds(5);
            break;
        case 49:
            // 1 Key
            event.preventDefault();
            changeDurationByPercentage(0.1);
            break;
        case 50:
            // 2 Key
            event.preventDefault();
            changeDurationByPercentage(0.2);
            break;
        case 51:
            // 3 Key
            event.preventDefault();
            changeDurationByPercentage(0.3);
            break;
        case 52:
            // 4 Key
            event.preventDefault();
            changeDurationByPercentage(0.4);
            break;
        case 53:
            // 5 Key
            event.preventDefault();
            changeDurationByPercentage(0.5);
            break;
        case 54:
            // 6 Key
            event.preventDefault();
            changeDurationByPercentage(0.6);
            break;
        case 55:
            // 7 Key
            event.preventDefault();
            changeDurationByPercentage(0.7);
            break;
        case 56:
            // 8 Key
            event.preventDefault();
            changeDurationByPercentage(0.8);
            break;
        case 57:
            // 9 Key
            event.preventDefault();
            changeDurationByPercentage(0.9);
            break;
        case 48:
            // 0 Key
            event.preventDefault();
            changeDurationByPercentage(0);
            break;
        }
    }
};

let fullscreenVideo = function (event) {
  if (playerView.legacySeen) {
    if (document.webkitFullscreenElement !== null) {
        document.webkitExitFullscreen();
    } else {
        $('.videoPlayer').get(0).webkitRequestFullscreen();
      }
  }
  else {
    $('.mejs__fullscreen-button').click();

    if (document.webkitFullscreenElement !== null) {
      console.log('changing screen size...');
      const currentWindow = electron.remote.getCurrentWindow();
      let bounds = currentWindow.getBounds();
      let newBounds = {
        height: bounds.height,
        width:  bounds.width + 1,
        x:  bounds.x,
        y:  bounds.y,
      }

      currentWindow.setBounds(newBounds);
      currentWindow.setBounds(bounds);
    }
  }
}

/**
 * ---------------------------
 * Bind click events
 * --------------------------
 */

$(document).on('click', '#showComments', showComments);

$(document).on('click', '#legacyPlayer', playPauseVideo);

$(document).on('dblclick', '.videoPlayer', fullscreenVideo);

$(document).on('keydown', videoShortcutHandler);

$(document).on('click', '#confirmNo', hideConfirmFunction);

// Open links externally by default
$(document).on('click', 'a[href^="http"]', (event) => {
  let el = event.currentTarget;
  if (!el.href.includes('freetube://')) {
    event.preventDefault();
    shell.openExternal(el.href);
  }
  else{
    search(el.href);
  }
});

// Open links externally on middle click.
$(document).on('auxclick', 'a[href^="http"]', (event) => {
  let el = event.currentTarget;
  if (!el.href.includes('freetube://')) {
    event.preventDefault();
    shell.openExternal(el.href);
  }
  else{
    search(el.href);
  }
});
