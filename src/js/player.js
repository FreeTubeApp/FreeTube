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
 * File for functions related to videos.
 */

/**
 * Display the video player and play a video
 *
 * @param {string} videoId - The video ID of the video to be played.
 *
 * @return {Void}
 */
function playVideo(videoId, videoThumbnail = '', useWindowPlayer = false) {
  if (useWindowPlayer === false){
    clearMainContainer();
    startLoadingAnimation();
  }
  else{
    showToast('Getting video information.  Please wait...')
  }

  let subscribeText = '';
  let savedText = '';
  let savedIconClass = '';
  let savedIconColor = '';
  let video480p;
  let video720p;
  let videoSubtitles = '';
  let subtitleHtml = '';
  let subtitleLabel;
  let subtitleLanguage;
  let subtitleCode;
  let subtitleUrl;
  let defaultUrl;
  let defaultQuality;
  let channelId;
  let videoHtml;
  let videoType = 'video';
  let embedPlayer = "<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/" + videoId + "?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>";
  let useEmbedPlayer = false;
  let validUrl;
  let videoLikes;
  let videoDislikes;
  let totalLikes;
  let likePercentage;

  const checkSavedVideo = videoIsSaved(videoId);

  // Change the save button icon and text depending on if the user has saved the video or not.
  checkSavedVideo.then((results) => {
    if (results === false) {
      savedText = 'SAVE';
      savedIconClass = 'far unsaved';
    } else {
      savedText = 'SAVED';
      savedIconClass = 'fas saved';
    }
  });

  youtubeAPI('videos', {
    part: 'statistics',
    id: videoId,
  }, function(data) {
    console.log(data);

    // Figure out the width for the like/dislike bar.
    videoLikes = data['items'][0]['statistics']['likeCount'];
    videoDislikes = data['items'][0]['statistics']['dislikeCount'];
    totalLikes = parseInt(videoLikes) + parseInt(videoDislikes);
    likePercentage = parseInt((videoLikes / totalLikes) * 100);
  });

  /*
   * FreeTube calls youtube-dl to grab the direct video URL.
   */
  youtubedlGetInfo(videoId, (info) => {
    console.log(info);

    console.log(videoLikes);

    channelId = info['author']['id'];
    let channelThumbnail = info['author']['avatar'];

    let videoUrls = info['formats'];

    // Add commas to the video view count.
    const videoViews = info['view_count'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    videoThumbnail = info['player_response']['videoDetails']['thumbnail']['thumbnails'][3]['url'];

    // Format the date to a more readable format.
    let dateString = new Date(info['published']);
    dateString.setDate(dateString.getDate() + 1);
    const publishedDate = dateFormat(dateString, "mmm dS, yyyy");

    let description = info['description'];
    // Adds clickable links to the description.
    description = autolinker.link(description);

    // Search through the returned object to get the 480p and 720p video URLs (If available)
    Object.keys(videoUrls).forEach((key) => {
      switch (videoUrls[key]['itag']) {
        case '18':
          video480p = videoUrls[key]['url'];
          console.log(video480p);
          break;
        case '22':
          video720p = videoUrls[key]['url'];
          console.log(video720p);
          break;
      }
    });

    // Default to the embeded player if the URLs cannot be found.
    if (typeof(video720p) === 'undefined' && typeof(video480p) === 'undefined') {
      useEmbedPlayer = true;
      defaultQuality = 'EMBED';
      videoHtml = embedPlayer.replace(/\&quot\;/g, '"');
      showToast('Unable to get video file.  Reverting to embeded player.');
    } else if (typeof(video720p) === 'undefined' && typeof(video480p) !== 'undefined') {
      // Default to the 480p video if the 720p URL cannot be found.
      defaultUrl = video480p;
      defaultQuality = '480p';
    } else {
      // Default to the 720p video.
      defaultUrl = video720p;
      defaultQuality = '720p';
      // Force the embeded player if needed.
      //videoHtml = embedPlayer;
    }

    if (!useEmbedPlayer) {
      videoHtml = '<video class="videoPlayer" type="application/x-mpegURL" onmousemove="hideMouseTimeout()" onmouseleave="removeMouseTimeout()" controls="" src="' + defaultUrl + '" poster="' + videoThumbnail + '" autoplay>';


      if (typeof(info.player_response.captions) === 'object') {
        if (typeof(info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks) === 'object') {
          const videoSubtitles = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;

          videoSubtitles.forEach((subtitle) => {
            let subtitleUrl = 'https://www.youtube.com/api/timedtext?lang=' + subtitle.languageCode + '&fmt=vtt&name=&v=' + videoId;

            if (subtitle.kind == 'asr') {
              //subtitleUrl = subtitle.baseUrl;
              return;
            }

            videoHtml = videoHtml + '<track kind="subtitles" src="' + subtitleUrl + '" srclang="' + subtitle.languageCode + '" label="' + subtitle.name.simpleText + '">';
          });
        }
      }

      videoHtml = videoHtml + '</video>';
    }

    const checkSubscription = isSubscribed(channelId);

    // Change the subscribe button text depending on if the user has subscribed to the channel or not.

    checkSubscription.then((results) => {
      const subscribeButton = document.getElementById('subscribeButton');

      if (results === false) {
        if (subscribeButton != null) {
          subscribeButton.innerHTML = 'SUBSCRIBE';
        }
      } else {
        if (subscribeButton != null) {
          subscribeButton.innerHTML = 'UNSUBSCRIBE';
        }
      }
    });

    const playerTemplate = require('./templates/player.html')
    mustache.parse(playerTemplate);
    const rendered = mustache.render(playerTemplate, {
      videoHtml: videoHtml,
      videoQuality: defaultQuality,
      videoTitle: info['title'],
      videoViews: videoViews,
      videoThumbnail: videoThumbnail,
      channelName: info['author']['name'],
      videoLikes: videoLikes,
      videoDislikes: videoDislikes,
      likePercentage: likePercentage,
      videoId: videoId,
      channelId: channelId,
      channelIcon: channelThumbnail,
      publishedDate: publishedDate,
      description: description,
      isSubscribed: subscribeText,
      savedText: savedText,
      savedIconClass: savedIconClass,
      savedIconColor: savedIconColor,
      video480p: video480p,
      video720p: video720p,
      embedPlayer: embedPlayer,
    });

    // Add the video to the user's history
    addToHistory(videoId);

    if (useWindowPlayer){
      // Create a new browser window.
      const BrowserWindow = electron.remote.BrowserWindow;

      let newWindow = new BrowserWindow({
        width: 1200,
        height: 700
      });

      let playerWindowHeader = require('./templates/playerWindowHeader.html');
      let playerWindowFooter = require('./templates/playerWindowFooter.html');

      mustache.parse(playerWindowHeader);
      const playerHeaderRender = mustache.render(playerWindowHeader, {
        videoId: videoId,
        channelId: channelId
      });

      mustache.parse(playerWindowFooter);
      const playerFooterRender = mustache.render(playerWindowFooter);

      console.log(rendered);

      newWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(playerHeaderRender + rendered), {
	       baseURLForDataURL: `file://${__dirname}/src`
       });
    }
    else{
      $('#main').html(rendered);
      stopLoadingAnimation();

      showVideoRecommendations(videoId);

      // Sometimes a video URL is found, but the video will not play.  I believe the issue is
      // that the video has yet to render for that quality, as the video will be available at a later time.
      // This will check the URLs and switch video sources if there is an error.
      checkVideoUrls(video480p, video720p);

      // Hide subtitles by default
      if (typeof(info['subtitles']) !== 'undefined' && Object.keys(info['subtitles']).length > 0) {
        let textTracks = $('.videoPlayer').get(0).textTracks;
        Object.keys(textTracks).forEach((track) => {
          textTracks[track].mode = 'hidden';
        });
      }
    }



  });
}

/**
 * Open up the mini player to watch the video outside of the main application.
 *
 * @param {string} videoThumbnail - The URL of the video thumbnail.  Used to prevent another API call.
 *
 * @return {Void}
 */
function openMiniPlayer(videoThumbnail) {
  let lastTime;
  let videoHtml;

  // Grabs whatever the HTML is for the current video player.  Done this way to grab
  // the HTML5 player (with varying qualities) as well as the YouTube embeded player.
  if ($('.videoPlayer').length > 0) {
    $('.videoPlayer').get(0).pause();
    lastTime = $('.videoPlayer').get(0).currentTime;
    videoHtml = $('.videoPlayer').get(0).outerHTML;
  } else {
    videoHtml = $('iframe').get(0).outerHTML;
  }

  // Create a new browser window.
  const BrowserWindow = electron.remote.BrowserWindow;

  let miniPlayer = new BrowserWindow({
    width: 1200,
    height: 700
  });

  // Use the miniPlayer.html template.
  $.get('templates/miniPlayer.html', (template) => {
    mustache.parse(template);
    const rendered = mustache.render(template, {
      videoHtml: videoHtml,
      videoThumbnail: videoThumbnail,
      startTime: lastTime,
    });
    // Render the template to the new browser window.
    miniPlayer.loadURL("data:text/html;charset=utf-8," + encodeURI(rendered));
  });
}

/**
 * Change the quality of the current video.
 *
 * @param {string} videoHtml - The HTML of the video player to be set.
 * @param {string} qualityType - The Quality Type of the video. Ex: 720p, 480p
 * @param {boolean} isEmbed - Optional: Value on if the videoHtml is the embeded player.
 *
 * @return {Void}
 */
function changeQuality(videoHtml, qualityType, isEmbed = false) {
  if (videoHtml == '') {
    showToast('Video quality type is not available.  Unable to change quality.')
    return;
  }

  videoHtml = videoHtml.replace(/\&quot\;/g, '"');

  console.log(videoHtml);
  console.log(isEmbed);

  // The YouTube API creates 2 more iFrames.  This is why a boolean value is sent
  // with the function.
  const embedPlayer = document.getElementsByTagName('IFRAME')[0];

  const html5Player = document.getElementsByClassName('videoPlayer');

  console.log(embedPlayer);
  console.log(html5Player);

  if (isEmbed && html5Player.length == 0) {
    // The embeded player is already playing.  Return.
    showToast('You are already using the embeded player.')
    return;
  } else if (isEmbed) {
    // Switch from HTML 5 player to embeded Player
    html5Player[0].remove();
    const mainHtml = $('#main').html();
    $('#main').html(videoHtml + mainHtml);
    $('#currentQuality').html(qualityType);
  } else if (html5Player.length == 0) {
    // Switch from embeded player to HTML 5 player
    embedPlayer.remove();
    let videoPlayer = document.createElement('video');
    videoPlayer.className = 'videoPlayer';
    videoPlayer.src = videoHtml;
    videoPlayer.controls = true;
    videoPlayer.autoplay = true;
    $('#main').prepend(videoPlayer);
    $('#currentQuality').html(qualityType);
  } else {
    // Switch src on HTML 5 player
    const currentPlayBackTime = $('.videoPlayer').get(0).currentTime;
    html5Player[0].src = videoHtml;
    html5Player[0].load();
    $('.videoPlayer').get(0).currentTime = currentPlayBackTime;
    $('#currentQuality').html(qualityType);
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
  $('#currentSpeed').html(speed);
  $('.videoPlayer').get(0).playbackRate = speed;
}

/**
 * Change the volume of the video player
 *
 * @param {double} amount - The volume to increase or descrease the volume by. Will be any double between 0 and 1.
 *
 * @return {Void}
 */
function changeVolume(amount) {
  const videoPlayer = $('.videoPlayer').get(0);
  let volume = videoPlayer.volume;
  volume = volume + amount;
  if (volume > 1) {
    videoPlayer.volume = 1;
  } else if (volume < 0) {
    videoPlayer.volume = 0;
  } else {
    videoPlayer.volume = volume;
  }
}

/**
 * Change the duration of the current time of a video by a few seconds.
 *
 * @param {integer} seconds - The amount of seconds to change the video by.  Integer may be positive or negative.
 *
 * @return {Void}
 */
function changeDurationBySeconds(seconds) {
  const videoPlayer = $('.videoPlayer').get(0);
  videoPlayer.currentTime = videoPlayer.currentTime + seconds;
}

/**
 * Change the duration of a video by a percentage of the duration.
 *
 * @param {double} percentage - The percentage to hop to of the video.  Will be any double between 0 and 1.
 *
 * @return {Void}
 */
function changeDurationByPercentage(percentage) {
  const videoPlayer = $('.videoPlayer').get(0);
  videoPlayer.currentTime = videoPlayer.duration * percentage;
}
