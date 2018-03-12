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
 * File for events within application.  Work needs to be done throughout the application
 * to use this style more.  Please use this style going forward if possible.
 */

/**
 * Event when user clicks comment box,
 * and wants to show/display comments for the user.
 */
let showComments = function(event) {
  let comments = $('#comments');

  if (comments.css('display') === 'none') {
    comments.attr('loaded', 'true');

    youtubeAPI('commentThreads', {
      'videoId': $('#comments').attr('data-video-id'),
      'part': 'snippet,replies',
      'maxResults': 100,
    }, function (data){
      let comments = [];
      let items = data.items;

      items.forEach((object) => {
        let snippet = object.snippet.topLevelComment.snippet;

        snippet.publishedAt = dateFormat(new Date(snippet.publishedAt), "mmm dS, yyyy");

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
let playPauseVideo = function(event) {
  let el = event.currentTarget;
  el.paused ? el.play() : el.pause();
};

$('.videoPlayer').keypress((event) => {
  console.log(event.which);
});

let videoShortcutHandler = function(event) {
  console.log(event.which);
  let videoPlayer = $('.videoPlayer').get(0);
  if (typeof(videoPlayer) !== 'undefined' && !$('#jumpToInput').is(':focus') && !$('#search').is(':focus')){
    switch (event.which) {
      case 32:
        // Space Bar
        event.preventDefault();
        videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause();
        break;
      case 74:
        // J Key
        event.preventDefault();
        changeDurationBySeconds(-10);
        break;
      case 75:
        // K Key
        event.preventDefault();
        videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause();
        break;
      case 76:
        // L Key
        event.preventDefault();
        changeDurationBySeconds(10);
        break;
      case 70:
        // F Key
        event.preventDefault();
        videoPlayer.webkitRequestFullscreen();
        break;
      case 77:
        // M Key
        event.preventDefault();
        let volume = videoPlayer.volume;
        console.log(volume);
        if (volume > 0){
          changeVolume(-1);
        }
        else{
          changeVolume(1);
        }
        break;
      case 67:
        // F Key
        event.preventDefault();
        let subtitleMode = $('.videoPlayer').get(0).textTracks[0].mode;
        if (subtitleMode === 'hidden'){
          $('.videoPlayer').get(0).textTracks[0].mode = 'showing'
        }
        else{
          $('.videoPlayer').get(0).textTracks[0].mode = 'hidden'
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

/**
 * ---------------------------
 * Bind click events
 * --------------------------
 */
$(document).on('click', '#showComments', showComments);

$(document).on('click', '.videoPlayer', playPauseVideo);

$(document).on('keydown', videoShortcutHandler);

$(document).on('click', '#confirmNo', hideConfirmFunction);
