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

 let checkedSettings = false;

/**
 * Display the video player and play a video
 *
 * @param {string} videoId - The video ID of the video to be played.
 *
 * @return {Void}
 */
function playVideo(videoId, playlistId = '') {
    hideViews();

    let youtubedlFinished = false;
    let invidiousFinished = false;
    checkedSettings = false;
    playerView.firstLoad = true;
    playerView.videoId = videoId;
    playerView.videoAudio = undefined;
    playerView.validAudio = true;
    playerView.video360p = undefined;
    playerView.valid360p = true;
    playerView.video720p = undefined;
    playerView.valid720p = true;
    playerView.videoUrl = '';
    playerView.subtitleHtml = '';
    playerView.videoLive = undefined;
    playerView.validLive = false;
    playerView.validDash = true;
    playerView.videoDash = invidiousInstance + '/api/manifest/dash/' + videoId + '.mpd';
    playerView.embededHtml = "<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/" + videoId + "?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>";

    let videoHtml = '';
    let player;

    switch (defaultPlayer) {
      case 'dash':
        playerView.playerSeen = true;
        playerView.legacySeen = false;
        break;
      case 'legacy':
        playerView.playerSeen = false;
        playerView.legacySeen = true;
        break;
      case 'embed':
        playerView.playerSeen = false;
        playerView.legacySeen = false;
        break;
      default:

    }

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

    if (getVideosLocally) {
      youtubedlGetInfo(videoId, (data) => {
          console.log(data);

          let videoUrls = data.formats;

          if (data.player_response.videoDetails.isLiveContent !== false) {
            playerView.validDash = false;
            playerView.valid360p = false;
            playerView.valid720p = false;
            playerView.validAudio = false;

            playerView.validLive = true;

            youtubedlFinished = true;

            if (youtubedlFinished && invidiousFinished) {
                loadingView.seen = false;

                if (subscriptionView.seen === false && aboutView.seen === false && headerView.seen === false && searchView.seen === false && settingsView.seen === false && popularView.seen === false && savedView.seen === false && historyView.seen === false && channelView.seen === false && channelVideosView.seen === false) {
                    playerView.seen = true;
                } else {
                    return;
                }
            }
          }
          else {
            playerView.validLive = false;

            // Search through the returned object to get the 360p and 720p video URLs (If available)
            Object.keys(videoUrls).forEach((key) => {
                switch (videoUrls[key]['itag']) {
                case '18':
                    playerView.video360p = decodeURIComponent(videoUrls[key]['url']);
                    // console.log(playerView.video360p);
                    break;
                case '22':
                    playerView.video720p = decodeURIComponent(videoUrls[key]['url']);
                    // console.log(playerView.video720p);
                    break;
                }
            });

            if (videoUrls.length > 3) {
              // Last adaptive format will be the best quality audio stream
              playerView.videoAudio = decodeURIComponent(videoUrls[videoUrls.length - 1]['url']);
            }
            else {
              playerView.playerSeen = false;
              playerView.legacySeen = true;
            }

            if (typeof (playerView.videoAudio) === 'undefined') {
                console.log(playerView.videoAudio);
                playerView.validAudio = false;
            }

            let useEmbedPlayer = false;

            // Default to the embeded player if the URLs cannot be found.
            if (typeof (playerView.video720p) === 'undefined' && typeof (playerView.video360p) === 'undefined') {
                //useEmbedPlayer = true;
                playerView.currentQuality = 'EMBED';
                playerView.playerSeen = false;
                playerView.valid720p = false;
                playerView.valid360p = false;
                playerView.video720p = '';
                //useEmbedPlayer = true;
                showToast('Unable to get video file.  Reverting to embeded player.');
            } else if (typeof (playerView.video720p) === 'undefined' && typeof (playerView.video360p) !== 'undefined') {
                // Default to the 360p video if the 720p URL cannot be found.
                console.log('Found');
                playerView.videoUrl = playerView.video360p;
                playerView.currentQuality = '360p';
                playerView.valid720p = false;
                playerView.video720p = '';
            } else {
                // Default to the 720p video.
                playerView.videoUrl = playerView.video720p;
                playerView.currentQuality = '720p';
                //playerView.videoUrl = playerView.liveManifest;
            }

            if (!useEmbedPlayer &&
                typeof (data.player_response.captions) !== 'undefined' &&
                typeof (data.player_response.captions.playerCaptionsTracklistRenderer) !== 'undefined' &&
                typeof (data.player_response.captions.playerCaptionsTracklistRenderer.captionTracks) !== 'undefined') {
                data.player_response.captions.playerCaptionsTracklistRenderer.captionTracks.forEach((caption) => {
                    let subtitleUrl = invidiousInstance + '/api/v1/captions/' + videoId + '?label=' + caption.name.simpleText;

                    videoHtml = videoHtml + '<track kind="subtitles" src="' + subtitleUrl + '" srclang="' + caption.languageCode + '" label="' + caption.name.simpleText + '">';
                });

                playerView.subtitleHtml = videoHtml;
            }
          }
          youtubedlFinished = true;

          if (youtubedlFinished && invidiousFinished) {
              loadingView.seen = false;

              if (subscriptionView.seen === false && aboutView.seen === false && headerView.seen === false && searchView.seen === false && settingsView.seen === false && popularView.seen === false && savedView.seen === false && historyView.seen === false && channelView.seen === false && channelVideosView.seen === false) {
                  playerView.seen = true;
              } else {
                  return;
              }
          }
      });
    }
    else {
      youtubedlFinished = true;
      console.log("Grabbing videos through Invidious");
    }

    invidiousAPI('videos', videoId, {}, (data) => {

        console.log(data);

        // Figure out the width for the like/dislike bar.
        playerView.videoLikes = data.likeCount;
        playerView.videoDislikes = data.dislikeCount;
        let totalLikes = parseInt(playerView.videoLikes) + parseInt(playerView.videoDislikes);
        playerView.likePercentage = parseInt((playerView.videoLikes / totalLikes) * 100);
        playerView.videoTitle = data.title;
        playerView.channelName = data.author;
        playerView.channelId = data.authorId;
        playerView.channelIcon = data.authorThumbnails[2].url;

        if (playerView.channelIcon.includes('https:') === false) {
          playerView.channelIcon = 'https:' + playerView.channelIcon;
        }

        // Add commas to the video view count.
        playerView.videoViews = data.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        playerView.videoThumbnail = data.videoThumbnails[0].url;

        // Format the date to a more readable format.
        let dateString = new Date(data.published * 1000);
        dateString.setDate(dateString.getDate() + 1);
        playerView.publishedDate = dateFormat(dateString, "mmm dS, yyyy");

        playerView.description = parseDescription(data.descriptionHtml);

        const checkSubscription = isSubscribed(playerView.channelId);

        checkSubscription.then((results) => {
            if (results === false) {
                playerView.subscribedText = 'SUBSCRIBE';
            } else {
                playerView.subscribedText = 'UNSUBSCRIBE';
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
            data.viewCount = video.viewCountText;

            playerView.recommendedVideoList = playerView.recommendedVideoList.concat(data);
        });

        if (!getVideosLocally) {
          let videoUrls = data.formatStreams;
          let formatUrls = data.adaptiveFormats;

          // Search through the returned object to get the 360p and 720p video URLs (If available)
          Object.keys(videoUrls).forEach((key) => {
              switch (videoUrls[key]['itag']) {
              case '18':
                  playerView.video360p = decodeURIComponent(videoUrls[key]['url']);
                  // console.log(playerView.video360p);
                  break;
              case '22':
                  playerView.video720p = decodeURIComponent(videoUrls[key]['url']);
                  // console.log(playerView.video720p);
                  break;
              }
          });

          if (typeof(playerView.video360p) === 'undefined') {
            playerView.video360p = '';
            playerView.valid360p = false;
          }

          if (typeof(playerView.video720p) === 'undefined') {
            playerView.video720p = '';
            playerView.valid720p = false;
          }

          if (defaultQuality >= '720' && playerView.video720p !== '') {
            playerView.videoUrl = playerView.video720p;
            playerView.currentQuality = '720p';
          }
          else {
            playerView.videoUrl = playerView.video360p;
            playerView.currentQuality = '360p';
          }

          if (formatUrls.length > 0) {
            // Last adaptive format will be best the quality audio stream (migrate fully to adaptive formats later)
            playerView.videoAudio = decodeURIComponent(formatUrls[formatUrls.length - 1]['url']);
          }
          else {
            playerView.playerSeen = false;
            playerView.legacySeen = true;
          }

          if (typeof (playerView.videoAudio) === 'undefined') {
              console.log(playerView.videoAudio);
              playerView.videoAudio = '';
              playerView.validAudio = false;
          }

          let useEmbedPlayer = false;

          if (!useEmbedPlayer &&
              typeof (data.captions) !== 'undefined') {
              data.captions.forEach((caption) => {
                  let subtitleUrl = invidiousInstance + caption.url;

                  videoHtml = videoHtml + '<track kind="subtitles" src="' + subtitleUrl + '" srclang="' + caption.languageCode + '" label="' + caption.label + '">';
              });

              playerView.subtitleHtml = videoHtml;
          }
        }

        if (data.liveNow !== false) {
          playerView.validLive = true;
          playerView.videoLive = data.hlsUrl;
          playerView.validDash = false;
        }

        if (playlistId != '') {
            playerView.playlistSeen = true;
            playerView.playlistShowList = true;
            playerView.playlistId = playlistId;
            playerView.playlistVideoList = [];

            invidiousAPI('playlists', playlistId, {}, (data) => {
                playerView.playlistTitle = data.title;
                playerView.playlistChannelName = data.author;
                playerView.playlistChannelId = data.authorId;
                playerView.playlistTotal = data.videoCount;

                let amountOfPages = Math.ceil(data.videoCount / 100);

                for (let i = 1; i <= amountOfPages; i++) {
                    invidiousAPI('playlists', playlistId, {
                        page: i
                    }, (data) => {
                        data.videos.forEach((video) => {
                            let data = {};

                            if (video.videoId == videoId) {
                                playerView.playlistIndex = video.index + 1;
                            }

                            data.title = video.title;
                            data.videoId = video.videoId;
                            data.channelName = video.author;
                            data.index = video.index + 1;
                            data.thumbnail = video.videoThumbnails[4].url;

                            playerView.playlistVideoList[video.index] = data;
                        });
                    });
                }
            });
        } else {
            playerView.playlistSeen = false;
            playerView.playlistShowList = false;
            playerView.playlistId = '';
        }

        invidiousFinished = true;

        if (youtubedlFinished && invidiousFinished) {
            loadingView.seen = false;

            if (subscriptionView.seen === false && aboutView.seen === false && headerView.seen === false && searchView.seen === false && settingsView.seen === false && popularView.seen === false && savedView.seen === false && historyView.seen === false && channelView.seen === false && channelVideosView.seen === false) {
                playerView.seen = true;
            } else {
                return;
            }
        }

        if (rememberHistory === true) {
            let historyData = {
                videoId: videoId,
                published: data.published,
                publishedText: playerView.publishedDate,
                description: data.description,
                viewCount: data.viewCount,
                title: playerView.videoTitle,
                lengthSeconds: data.lengthSeconds,
                videoThumbnails: playerView.videoThumbnail,
                author: playerView.channelName,
                authorId: playerView.channelId,
                liveNow: false,
                paid: false,
                type: 'video',
                timeWatched: new Date().getTime(),
            };

            console.log(historyData);
            addToHistory(historyData);
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
function openMiniPlayer() {

    let lastTime;
    let videoHtml;
    // Grabs whatever the HTML is for the current video player.  Done this way to grab
    // the HTML5 player (with varying qualities) as well as the YouTube embeded player.
    if (typeof(player) !== 'undefined') {
        player.pause();
        lastTime = player.currentTime;
        //videoHtml = $('.videoPlayer').get(0).outerHTML;
    } else {
        //videoHtml = $('iframe').get(0).outerHTML;
    }

    // Create a new browser window.
    const BrowserWindow = electron.remote.BrowserWindow;

    let miniPlayer = new BrowserWindow({
        width: 1200,
        height: 710,
        show: false,
        title: 'FreeTube Mini-Player: ' + playerView.videoTitle,
        autoHideMenuBar: true
    });

    miniPlayer.loadURL(url.format({
        pathname: path.join(__dirname, '/templates/miniPlayer.html'),
        protocol: 'file:',
        slashes: true,
    }));

    miniPlayer.once('ready-to-show', () => {
      miniPlayer.show();

      let playerData = {
        video360p: playerView.video360p,
        valid360p: playerView.valid360p,
        video720p: playerView.video720p,
        valid720p: playerView.valid720p,
        videoAudio: playerView.videoAudio,
        validAudio: playerView.validAudio,
        videoDash: playerView.videoDash,
        validDash: playerView.validDash,
        videoLive: playerView.videoLive,
        validLive: playerView.validLive,
        subtitleHtml: playerView.subtitleHtml,
        videoThumbnail: playerView.videoThumbnail,
        defaultPlaybackRate: player.options.defaultSpeed,
        quality: player.options.defaultQuality,
        volume: player.volume,
        currentTime: player.currentTime,
      };
      miniPlayer.webContents.send('ping', playerData);
    })

    return;

    // Use the miniPlayer.html template.
    /*$.get('templates/miniPlayer.html', (template) => {
        mustache.parse(template);
        const rendered = mustache.render(template, {
            videoUrl: playerView.videoUrl,
            videoThumbnail: playerView.videoThumbnail,
            startTime: lastTime,
        });
        // Render the template to the new browser window.
        miniPlayer.loadURL("data:text/html;charset=utf-8," + encodeURI(rendered));
    });*/
}

/**
 * Opens the video directly in pop up player
 *
 * @param {string} videoId - The ID of the video.
 *
 * @return {Void}
 */
function clickMiniPlayer(videoId) {

    let video360p, video720p, historyData;

    showToast("Opening in mini player, Please wait.");

    let playVideo = function (videoUrl, videoThumbnail) {
        // Create a new browser window.
        const BrowserWindow = electron.remote.BrowserWindow;

        let miniPlayer = new BrowserWindow({
            width: 1200,
            height: 710,
            autoHideMenuBar: true
        });

        // Use the miniPlayer.html template.
        $.get('templates/miniPlayer.html', (template) => {
            mustache.parse(template);
            const rendered = mustache.render(template, {
                videoUrl: videoUrl,
                videoThumbnail: videoThumbnail,
                startTime: 0,
            });
            // Render the template to the new browser window.
            miniPlayer.loadURL("data:text/html;charset=utf-8," + encodeURI(rendered));

            if (rememberHistory) {
                addToHistory(historyData);
            }
        });
    };

    youtubedlGetInfo(videoId, (data) => {

        let videoUrls = data.formats;
        let videoThumbnail = data.player_response.videoDetails.thumbnail.thumbnails[data.player_response.videoDetails.thumbnail.thumbnails.length - 1].url;1553990400000

        let dateString = new Date(data.published);
        dateString.setDate(dateString.getDate() + 1);
        let publishedDate = dateFormat(dateString, "mmm dS, yyyy");

        historyData = {
            videoId: videoId,
            published: data.published / 1000,
            publishedText: publishedDate,
            description: data.description,
            viewCount: data.player_response.videoDetails.viewCount,
            title: data.title,
            lengthSeconds: data.player_response.videoDetails.lengthSeconds,
            videoThumbnails: videoThumbnail,
            author: data.author.name,
            authorId: data.author.id,
            liveNow: false,
            paid: false,
            type: 'video',
            timeWatched: new Date().getTime(),
        };

        // Search through the returned object to get the 360p and 720p video URLs (If available)
        Object.keys(videoUrls).forEach((key) => {
            switch (videoUrls[key]['itag']) {
            case '18':
                video360p = videoUrls[key]['url'];
                break;
            case '22':
                video720p = videoUrls[key]['url'];
                break;
            }
        });

        if (defaultQuality === "720") {
            validateUrl(video720p, (results) => {
                if (results) {
                    playVideo(decodeURIComponent(video720p), videoThumbnail);
                } else {
                    validateUrl(video360p, (results) => {
                        if (results) {
                            playVideo(decodeURIComponent(video360p), videoThumbnail);
                        } else {
                            showToast("Unable to open video into mini player.");
                        }
                    });
                }
            });
        } else if (defaultQuality === "360") {
            validateUrl(video360p, (results) => {
                if (results) {
                    playVideo(decodeURIComponent(video360p), videoThumbnail);
                } else {
                    validateUrl(video720p, (results) => {
                        if (results) {
                            playVideo(decodeURIComponent(video720p), videoThumbnail);
                        } else {
                            showToast("Unable to open video into mini player.");
                        }
                    });
                }
            });
        }
    });
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
    let quality = defaultQuality;

    let declarePlayer = function() {
      if (!checkedDash) {
        return;
      }

      switch (quality) {
        case '720':
          if (!playerView.valid720p) {
            quality = '360p';
          }
          else {
            quality = '720p';
          }
          break;
        case '480':
          quality = '360p';
          break;
        case '360':
          if (!playerView.valid360p) {
            quality = 'Auto';
          }
          else {
            quality = '360p';
          }
          break;
        default:
          break;
      }

      if (playerView.validLive) {
        quality = 'Live';
      }

        let player = new MediaElementPlayer('player', {
          features: ['playpause', 'current', 'loop', 'tracks', 'progress', 'duration', 'volume', 'stop', 'speed', 'quality', 'fullscreen'],
          speeds: ['2', '1.75', '1.5', '1.25', '1', '0.75', '0.5', '0.25'],
          renderers: ['native_dash', 'native_hls', 'html5'],
          defaultSpeed: defaultPlaybackRate,
          autoGenerate: true,
          autoDash: true,
          autoHLS: false,
          qualityText: 'Quality',
          defaultQuality: quality,
          stretching: 'responsive',
          startVolume: currentVolume,

          success: function(mediaElement, originalNode, instance) {
            console.log(mediaElement,originalNode,instance);

            window.setTimeout(() => {
              if (typeof(playerView.currentTime) !== 'undefined') {
                instance.currentTime = playerView.currentTime;
                playerView.currentTime = undefined;
              }

              if (autoplay) {
                  instance.play();
              }

              if (enableSubtitles) {
                  instance.options.startLanguage = 'en';
              }
            }, 200);
          },

          error: function(error, originalNode, instance) {
            showToast('There was an error with playing DASH formats.  Reverting to the legacy formats.');
            playerView.currentTime = instance.currentTime;
            playerView.legacyFormats();
          }
        });
    };

    if (playerView.validDash !== false) {
      validateUrl(playerView.videoDash, (valid) => {
        playerView.validDash = valid;
        checkedDash = true;
        declarePlayer();
      });
    }
    else {
      playerView.legacyFormats();
    }

    return;
}

function checkLegacySettings() {
  let player = document.getElementById('legacyPlayer');

  console.log('checking Settings');

  // Mediaelement.js for some reason calls onLoadStart() multiple times
  // This check is here to force checkVideoSettings to only run once.
  if (checkedSettings) {
    console.log('Returning');
    return;
  }

  checkedSettings = true;
  let checked720p = false;
  let checked360p = false;
  let checkedAudio = false;
  let quality = defaultQuality;

  let declarePlayer = function() {
    if (!checked720p || !checked360p || !checkedAudio) {
      return;
    }

    switch (quality) {
      case '720':
        if (!playerView.valid720p) {
          quality = '360p';
        }
        else {
          quality = '720p';
        }
        break;
      case '480':
        quality = '360p';
        break;
      case '360':
        if (!playerView.valid360p) {
          quality = 'Auto';
        }
        else {
          quality = '360p';
        }
        break;
      default:
        break;
    }

    if (playerView.validLive) {
      quality = 'Live';
    }

    if (typeof(playerView.currentTime) !== 'undefined') {
      player.currentTime = playerView.currentTime;
      playerView.currentTime = undefined;
    }

    if (autoplay) {
        player.play();
    }
  };

  if (playerView.valid360p !== false) {
    validateUrl(playerView.video360p, (valid) => {
      playerView.valid360p = valid;
      checked360p = true;
      declarePlayer();
    });
  }
  else {
    checked360p = true;
    declarePlayer();
  }

  if (playerView.valid720p !== false) {
    validateUrl(playerView.video720p, (valid) => {
      playerView.valid720p = valid;
      checked720p = true;
      declarePlayer();
    });
  }
  else {
    checked720p = true;
    declarePlayer();
  }

  if (playerView.validAudio !== false) {
    validateUrl(playerView.videoAudio, (valid) => {
      playerView.validAudio = valid;
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

function playNextVideo() {
    let player = document.getElementById('videoPlayer');

    if (player.loop !== false || playerView.playlistSeen === false) {
        return;
    }

    if (playerView.playlistShuffle === true) {
        let randomVideo = Math.floor(Math.random() * playerView.playlistTotal);

        loadingView.seen = true;
        playVideo(playerView.playlistVideoList[randomVideo].videoId, playerView.playlistId);
        return;
    }

    if (playerView.playlistLoop === true && playerView.playlistIndex == playerView.playlistTotal) {
        loadingView.seen = true;
        playVideo(playerView.playlistVideoList[0].videoId, playerView.playlistId);
        return;
    }

    if (playerView.playlistIndex != playerView.playlistTotal) {
        loadingView.seen = true;
        playVideo(playerView.playlistVideoList[playerView.playlistIndex].videoId, playerView.playlistId);
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
  if (playerView.legacySeen) {
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

/**
 * Change the volume of the video player
 *
 * @param {double} amount - The volume to increase or descrease the volume by. Will be any double between 0 and 1.
 *
 * @return {Void}
 */
function changeVolume(amount) {
    let videoPlayer;

    if (playerView.legacySeen) {
      videoPlayer = $('.videoPlayer').get(0);
    }
    else {
      videoPlayer = $('#player').get(0);
    }

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
    if (playerView.legacySeen) {
      $('#legacyPlayer').get(0).currentTime = $('#legacyPlayer').get(0).currentTime + seconds;
    }
    else {
      player.currentTime = player.currentTime + seconds;
    }
}

/**
 * Change the duration of a video by a percentage of the duration.
 *
 * @param {double} percentage - The percentage to hop to of the video.  Will be any double between 0 and 1.
 *
 * @return {Void}
 */
function changeDurationByPercentage(percentage) {
    if (playerView.legacySeen) {
      $('#legacyPlayer').get(0).currentTime = $('#legacyPlayer').get(0).duration * percentage;
    }
    else {
      player.currentTime = player.duration * percentage;
    }
}

function changeDuration(seconds) {
  if (playerView.legacySeen) {
    $('#legacyPlayer').get(0).currentTime = seconds;
  }
  else {
    player.currentTime = seconds;
  }
}

function updateVolume() {
  if (playerView.legacySeen) {
    currentVolume = $('#legacyPlayer').get(0).volume
  }
  else {
    currentVolume = player.volume
  }
}

function parseDescription(descriptionText) {
    descriptionText = descriptionText.replace(/target\=\"\_blank\"/g, '');
    descriptionText = descriptionText.replace(/\/redirect.+?(?=q\=)/g, '');
    descriptionText = descriptionText.replace(/q\=/g, '');
    descriptionText = descriptionText.replace(/rel\=\"nofollow\snoopener\"/g, '');
    descriptionText = descriptionText.replace(/class\=.+?(?=\")./g, '');
    descriptionText = descriptionText.replace(/id\=.+?(?=\")./g, '');
    descriptionText = descriptionText.replace(/data\-target\-new\-window\=.+?(?=\")./g, '');
    descriptionText = descriptionText.replace(/data\-url\=.+?(?=\")./g, '');
    descriptionText = descriptionText.replace(/data\-sessionlink\=.+?(?=\")./g, '');
    descriptionText = descriptionText.replace(/\&amp\;/g, '&');
    descriptionText = descriptionText.replace(/\%3A/g, ':');
    descriptionText = descriptionText.replace(/\%2F/g, '/');
    descriptionText = descriptionText.replace(/\&v.+?(?=\")/g, '');
    descriptionText = descriptionText.replace(/\&redirect\-token.+?(?=\")/g, '');
    descriptionText = descriptionText.replace(/\&redir\_token.+?(?=\")/g, '');
    descriptionText = descriptionText.replace(/href\=\"http(s)?\:\/\/youtube\.com/g, 'href="freetube://https://youtube.com');
    descriptionText = descriptionText.replace(/href\=\"\/watch/g, 'href="freetube://https://youtube.com');
    descriptionText = descriptionText.replace(/href\=\"\/results\?search\_query\=/g, 'href="freetube://');
    descriptionText = descriptionText.replace(/yt\.www\.watch\.player\.seekTo/g, 'changeDuration');

    return descriptionText;
}
