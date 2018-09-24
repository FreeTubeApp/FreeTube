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
function playVideo(videoId) {
    hideViews();

    playerView.playerSeen = true;
    playerView.firstLoad = true;
    playerView.videoId = videoId;
    playerView.videoAudio = undefined;
    playerView.validAudio = true;
    playerView.video480p = undefined;
    playerView.valid480p = true;
    playerView.video720p = undefined;
    playerView.valid720p = true;
    playerView.embededHtml = "<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/" + videoId + "?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>";

    let videoHtml = '';

    const checkSavedVideo = videoIsSaved(videoId);

    // Change the save button icon and text depending on if the user has saved the video or not.
    checkSavedVideo.then((results) => {
        if (results === false) {
            playerView.savedText = 'FAVORITE';
            playerView.savedIconType = 'far unsaved';
        } else {
            playerView.savedText = 'FAVORITED';
            playerView.savedIconType = 'fas saved';
        }
    });
    //"kpkXPy_jXmU"
    invidiousAPI('videos', videoId, {}, function (data) {

      console.log(data);

        // Figure out the width for the like/dislike bar.
        playerView.videoLikes = data.likeCount;
        playerView.videoDislikes = data.dislikeCount;
        let totalLikes = parseInt(playerView.videoLikes) + parseInt(playerView.videoDislikes);
        playerView.likePercentage = parseInt((playerView.videoLikes / totalLikes) * 100);

        /*invidiousAPI('videos', "9Ww-TQUeA3E", {}, function (data) {
          console.log(data);
        });*/

        playerView.videoTitle = data.title;
        playerView.channelName = data.author;
        playerView.channelId = data.authorId;
        //playerView.channelIcon = data['author']['avatar'];

        let videoUrls = data.formatStreams;

        // Add commas to the video view count.
        playerView.videoViews = data.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        playerView.videoThumbnail = data.videoThumbnails[0].url;

        // Format the date to a more readable format.
        let dateString = new Date(data.published * 1000);
        dateString.setDate(dateString.getDate() + 1);
        playerView.publishedDate = dateFormat(dateString, "mmm dS, yyyy");

        let description = data.description;
        // Adds clickable links to the description.
        playerView.description = autolinker.link(description);

        // Search through the returned object to get the 480p and 720p video URLs (If available)
        Object.keys(videoUrls).forEach((key) => {
            switch (videoUrls[key]['itag']) {
            case '18':
                playerView.video480p = decodeURIComponent(videoUrls[key]['url']);
                //console.log(video480p);
                break;
            case '22':
                playerView.video720p = decodeURIComponent(videoUrls[key]['url']);
                //console.log(video720p);
                break;
            case '36':
                playerView.videoAudio = decodeURIComponent(videoUrls[key]['url']);
                //console.log(video720p);
                break;
            }
        });

        if (typeof(playerView.videoAudio) === 'undefined') {
          playerView.validAudio = false;
        }

        let useEmbedPlayer = false;

        // Default to the embeded player if the URLs cannot be found.
        if (typeof (playerView.video720p) === 'undefined' && typeof (playerView.video480p) === 'undefined') {
            //useEmbedPlayer = true;
            playerView.currentQuality = 'EMBED';
            //playerView.playerSeen = false;
            //useEmbedPlayer = true;
            showToast('Unable to get video file.  Reverting to embeded player.');
        }
        else if (typeof (playerView.video720p) === 'undefined' && typeof (playerView.video480p) !== 'undefined') {
            // Default to the 480p video if the 720p URL cannot be found.
            console.log('Found');
            playerView.videoUrl = playerView.video480p;
            playerView.currentQuality = '480p';
        } else {
            // Default to the 720p video.
            playerView.videoUrl = playerView.video720p;
            playerView.currentQuality = '720p';
            //playerView.videoUrl = playerView.liveManifest;
        }

        if (!useEmbedPlayer) {
            data.captions.forEach((caption) => {
                let subtitleUrl = 'https://www.invidio.us/api/v1/captions/' + videoId  + '?label=' + caption.label;

                videoHtml = videoHtml + '<track kind="subtitles" src="' + subtitleUrl + '" srclang="' + caption.languageCode + '" label="' + caption.label + '">';
            });

            playerView.subtitleHtml = videoHtml;
        }

        const checkSubscription = isSubscribed(playerView.channelId);

        checkSubscription.then((results) => {
            if (results === false) {
                if (subscribeButton != null) {
                    playerView.subscribedText = 'SUBSCRIBE';
                }
            } else {
                if (subscribeButton != null) {
                    playerView.subscribedText = 'UNSUBSCRIBE';
                }
            }
        });

        playerView.recommendedVideoList = [];

        data.recommendedVideos.forEach((video) => {
            let data = {};

            let time = video.lengthSeconds;
            let hours = 0;

            if (time >= 3600) {
                hours = Math.floor(time / 3600);
                time = time - hours * 3600;
            }

            let minutes = Math.floor(time / 60);
            let seconds = time - minutes * 60;

            if (seconds < 10) {
                seconds = '0' + seconds;
            }

            if (hours > 0) {
                data.duration = hours + ":" + minutes + ":" + seconds;
            } else {
                data.duration = minutes + ":" + seconds;
            }

            data.id = video.videoId;
            data.title = video.title;
            data.channelName = video.author;
            data.thumbnail = video.videoThumbnails[4].url;
            //data.publishedDate = dateFormat(snippet.publishedAt, "mmm dS, yyyy");
            data.viewCount = video.viewCountText;

            playerView.recommendedVideoList = playerView.recommendedVideoList.concat(data);
        });

        loadingView.seen = false;

        if (subscriptionView.seen === false && aboutView.seen === false && headerView.seen === false && searchView.seen === false && settingsView.seen === false && popularView.seen === false && savedView.seen === false && historyView.seen === false && channelView.seen === false && channelVideosView.seen === false) {
            playerView.seen = true;
        } else {
            return;
        }

        if (rememberHistory === true){
          addToHistory(videoId);
        }

        window.setTimeout(checkVideoUrls, 5000, playerView.video480p, playerView.video720p, playerView.videoAudio);

    });
}

/**
 * Open up the mini player to watch the video outside of the main application.
 *
 * @param {string} videoThumbnail - The URL of the video thumbnail.  Used to prevent another API call.
 *
 * @return {Void}
 */
function openMiniPlayer() {
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
        height: 710
    });

    // Use the miniPlayer.html template.
    $.get('templates/miniPlayer.html', (template) => {
        mustache.parse(template);
        const rendered = mustache.render(template, {
            videoHtml: videoHtml,
            videoThumbnail: playerView.thumbnail,
            startTime: lastTime,
        });
        // Render the template to the new browser window.
        miniPlayer.loadURL("data:text/html;charset=utf-8," + encodeURI(rendered));
    });
}

function checkVideoSettings() {
  let player = document.getElementById('videoPlayer');

  if (autoplay) {
    console.log(player);
    player.play();
  }

  if (enableSubtitles) {
    player.textTracks[0].mode = 'showing';
  }

  if (playerView.firstLoad) {
    playerView.firstLoad = false;

    switch (defaultQuality) {
      case '480':
        playerView.videoUrl = playerView.video480p;
        playerView.currentQuality = '480p';
        break;
      case '720':
        playerView.videoUrl = playerView.video720p;
        playerView.currentQuality = '720p';
        break;
      default:
        playerView.videoUrl = playerView.video720p;
        playerView.currentQuality = '720p';
        break;
    }

    player.playbackRate = parseFloat(defaultPlaybackRate);
    $('#currentSpeed').html(defaultPlaybackRate);
  }

  player.volume = currentVolume;
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
function changeQuality(url, qualityText, isEmbed = false) {
    if (videoHtml == '') {
        showToast('Video quality type is not available.  Unable to change quality.')
        return;
    }

    videoHtml = videoHtml.replace(/\&quot\;/g, '"');

    ft.log('HTML Video: ', videoHtml);
    ft.log('(Is the video embeded?) isEmbed: ', isEmbed);

    // The YouTube API creates 2 more iFrames.  This is why a boolean value is sent
    // with the function.
    const embedPlayer = document.getElementsByTagName('IFRAME')[0];

    const html5Player = document.getElementsByClassName('videoPlayer');

    ft.log('Embeded Player Element: ', embedPlayer);
    ft.log('HTML5 Player Element: ', html5Player);

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

function updateVolume(){
  let player = document.getElementById('videoPlayer');
  currentVolume = player.volume
}
