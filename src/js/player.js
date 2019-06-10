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

let checkedVideoSettings = false;

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
    checkedVideoSettings = false;
    playerView.firstLoad = true;
    playerView.videoId = videoId;
    playerView.videoAudio = undefined;
    playerView.validAudio = true;
    playerView.video360p = undefined;
    playerView.valid360p = true;
    playerView.video720p = undefined;
    playerView.valid720p = true;
    playerView.videoUrl = '';
    playerView.currentTime = undefined;
    playerView.subtitleHtml = '';
    playerView.videoLive = undefined;
    playerView.validLive = false;
    playerView.validDash = true;
    playerView.videoDash = invidiousInstance + '/api/manifest/dash/' + videoId + '.mpd?unique_res=1';
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
            ft.log(data);

            let videoUrls = data.formats;

            if (data.player_response.videoDetails.isLiveContent !== false) {
                playerView.validDash = false;
                playerView.valid360p = false;
                playerView.valid720p = false;
                playerView.validAudio = false;

                playerView.playerSeen = true;
                playerView.legacySeen = false;

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
            } else {
                playerView.validLive = false;

                // Search through the returned object to get the 360p and 720p video URLs (If available)
                Object.keys(videoUrls).forEach((key) => {
                    switch (videoUrls[key]['itag']) {
                        case '18':
                            playerView.video360p = decodeURIComponent(videoUrls[key]['url']);
                            // ft.log(playerView.video360p);
                            break;
                        case '22':
                            playerView.video720p = decodeURIComponent(videoUrls[key]['url']);
                            // ft.log(playerView.video720p);
                            break;
                    }
                });

                if (videoUrls.length > 3) {
                    // Last adaptive format will be the best quality audio stream
                    playerView.videoAudio = decodeURIComponent(videoUrls[videoUrls.length - 1]['url']);
                } else {
                    playerView.playerSeen = false;
                    playerView.legacySeen = true;
                }

                if (typeof(playerView.videoAudio) === 'undefined') {
                    ft.log(playerView.videoAudio);
                    playerView.validAudio = false;
                }

                let useEmbedPlayer = false;

                // Default to the embeded player if the URLs cannot be found.
                if (typeof(playerView.video720p) === 'undefined' && typeof(playerView.video360p) === 'undefined') {
                    //useEmbedPlayer = true;
                    playerView.currentQuality = 'EMBED';
                    playerView.playerSeen = false;
                    playerView.valid720p = false;
                    playerView.valid360p = false;
                    playerView.video720p = '';
                    //useEmbedPlayer = true;
                    showToast('Unable to get video file.  Reverting to embeded player.');
                } else if (typeof(playerView.video720p) === 'undefined' && typeof(playerView.video360p) !== 'undefined') {
                    // Default to the 360p video if the 720p URL cannot be found.
                    ft.log('Found');
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
    } else {
        youtubedlFinished = true;
        ft.log("Grabbing videos through Invidious");
    }

    invidiousAPI('videos', videoId, {}, (data) => {

        ft.log(data);

        // Figure out the width for the like/dislike bar.
        playerView.videoLikes = data.likeCount;
        playerView.videoDislikes = data.dislikeCount;
        let totalLikes = parseInt(playerView.videoLikes) + parseInt(playerView.videoDislikes);
        playerView.likePercentage = parseInt((playerView.videoLikes / totalLikes) * 100);
        playerView.videoTitle = data.title;
        playerView.channelName = data.author;
        playerView.channelId = data.authorId;
        playerView.channelIcon = data.authorThumbnails[2].url;
        playerView.lengthSeconds = data.lengthSeconds;

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

        if (typeof(data.captions) !== 'undefined') {
            data.captions.forEach((caption) => {
                let subtitleUrl = invidiousInstance + caption.url;

                videoHtml = videoHtml + '<track kind="subtitles" src="' + subtitleUrl + '" srclang="' + caption.languageCode + '" label="' + caption.label + '">';
            });

            playerView.subtitleHtml = videoHtml;
        }

        if (!getVideosLocally) {
            let videoUrls = data.formatStreams;
            let formatUrls = data.adaptiveFormats;

            // Search through the returned object to get the 360p and 720p video URLs (If available)
            Object.keys(videoUrls).forEach((key) => {
                switch (videoUrls[key]['itag']) {
                    case '18':
                        playerView.video360p = decodeURIComponent(videoUrls[key]['url']);
                        // ft.log(playerView.video360p);
                        break;
                    case '22':
                        playerView.video720p = decodeURIComponent(videoUrls[key]['url']);
                        // ft.log(playerView.video720p);
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

            if ((parseInt(defaultQuality) >= 720 || defaultQuality === '4k') && playerView.video720p !== '') {
                playerView.videoUrl = playerView.video720p;
                playerView.currentQuality = '720p';
            } else {
                playerView.videoUrl = playerView.video360p;
                playerView.currentQuality = '360p';
            }

            if (formatUrls.length > 0) {
                // Last adaptive format will be best the quality audio stream (migrate fully to adaptive formats later)
                playerView.videoAudio = decodeURIComponent(formatUrls[formatUrls.length - 1]['url']);
            } else {
                playerView.playerSeen = false;
                playerView.legacySeen = true;
            }

            if (typeof(playerView.videoAudio) === 'undefined') {
                ft.log(playerView.videoAudio);
                playerView.videoAudio = '';
                playerView.validAudio = false;
            }
        }

        if (data.liveNow !== false) {
            playerView.validLive = true;
            playerView.videoLive = data.hlsUrl;
            playerView.validDash = false;
            playerView.playerSeen = true;
            playerView.legacySeen = false;
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
            historyDb.findOne({
                videoId: playerView.videoId
            }, function(err, doc) {
                let watchProgress = 0;

                if (doc !== null) {
                    watchProgress = doc.watchProgress;
                }

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
                    watchProgress: watchProgress,
                };

                ft.log(historyData);
                addToHistory(historyData);
            });
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
    let videoPlayer;
    // Grabs whatever the HTML is for the current video player.  Done this way to grab
    // the HTML5 player (with varying qualities) as well as the YouTube embeded player.
    if (typeof(player) !== 'undefined') {
        videoPlayer = player;
    } else {
        videoPlayer = $('.videoPlayer').get(0);
    }

    videoPlayer.pause();
    lastTime = videoPlayer.currentTime;

    // Create a new browser window.
    const BrowserWindow = electron.remote.BrowserWindow;

    let miniPlayer = new BrowserWindow({
        width: 1200,
        height: 710,
        show: false,
        title: 'FreeTube Mini-Player: ' + playerView.videoTitle,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true,
        }
    });

    const template = [{
        label: 'Player',
        submenu: [{
            label: 'Dash Player',
            click() {
                miniPlayer.webContents.send('dashPlayer', '');
            },
        }, {
            label: 'Legacy Player',
            click() {
                miniPlayer.webContents.send('legacyPlayer', '');
            },
        }, {
            label: 'YouTube Player',
            click() {
                miniPlayer.webContents.send('youtubePlayer', '');
            },
        }, ],
    }, {
        label: 'Quality',
        submenu: [{
            label: '360p',
            click() {
                miniPlayer.webContents.send('play360p', '');
            }
        }, {
            label: '720p',
            click() {
                miniPlayer.webContents.send('play720p', '');
            }
        }, {
            label: 'Audio',
            click() {
                miniPlayer.webContents.send('playAudio', '');
            }
        }]
    }, {
        label: 'Playback',
        submenu: [{
            label: '0.25x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 0.25);
            }
        }, {
            label: '0.5x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 0.5);
            }
        }, {
            label: '0.75x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 0.75);
            }
        }, {
            label: '1x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 1);
            }
        }, {
            label: '1.25x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 1.25);
            }
        }, {
            label: '1.5x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 1.5);
            }
        }, {
            label: '1.75x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 1.75);
            }
        }, {
            label: '2x',
            click() {
                miniPlayer.webContents.send('videoSpeed', 2);
            }
        }, ]
    }, {
        label: 'Loop',
        submenu: [{
            label: 'Toggle Loop',
            click() {
                miniPlayer.webContents.send('videoLoop', '');
            }
        }]
    }, {
        label: 'View',
        submenu: [{
            role: 'toggledevtools'
        }, {
            type: 'separator'
        }, {
            role: 'resetzoom'
        }, {
            role: 'zoomin'
        }, {
            role: 'zoomout'
        }, {
            type: 'separator'
        }, {
            role: 'togglefullscreen'
        }]
    }, {
        role: 'window',
        submenu: [{
            role: 'minimize'
        }, {
            role: 'close'
        }]
    }];

    const menu = electron.remote.Menu.buildFromTemplate(template);

    miniPlayer.setMenu(menu);

    miniPlayer.loadURL(url.format({
        pathname: path.join(__dirname, '/templates/miniPlayer.html'),
        protocol: 'file:',
        slashes: true,
    }));

    miniPlayer.once('ready-to-show', () => {
        miniPlayer.show();

        let videoPlayer

        if (playerView.playerSeen) {
            videoPlayer = player;
        } else {
            videoPlayer = $('.videoPlayer').get(0);
        }

        let playerData = {
            videoId: playerView.videoId,
            videoUrl: playerView.videoUrl,
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
            defaultPlaybackRate: defaultPlaybackRate,
            quality: defaultQuality,
            volume: videoPlayer.volume,
            currentTime: videoPlayer.currentTime,
            playerSeen: playerView.playerSeen,
            legacySeen: playerView.legacySeen,
            autoplay: autoplay,
            enableSubtitles: enableSubtitles,
            thumbnailInterval: playerView.thumbnailInterval,
        };
        miniPlayer.webContents.send('ping', playerData);
    });

    return;
}

/**
 * Opens the video directly in pop up player
 *
 * @param {string} videoId - The ID of the video.
 *
 * @return {Void}
 */
function clickMiniPlayer(videoId) {

    showToast("Opening in mini player, Please wait.");

    let playVideo = function(videoData) {
        if (videoData.checked720p === false || videoData.checked360p === false || videoData.checkedAudio === false || videoData.checkedDash === false || videoData.checkedLive === false) {
            return;
        }

        if (videoData.valid720p && (parseInt(defaultQuality) >= 720 || defaultQuality === '4k')) {
            videoData.videoUrl = videoData.video720p;
        } else {
            videoData.videoUrl = videoData.video360p;
        }

        // Create a new browser window.
        const BrowserWindow = electron.remote.BrowserWindow;

        let miniPlayer = new BrowserWindow({
            width: 1200,
            height: 680,
            show: false,
            title: 'FreeTube Mini-Player: ' + videoData.videoTitle,
            autoHideMenuBar: true,
            webPreferences: {
              nodeIntegration: true,
            }
        });

        const template = [{
            label: 'Player',
            submenu: [{
                label: 'Dash Player',
                click() {
                    miniPlayer.webContents.send('dashPlayer', '');
                },
            }, {
                label: 'Legacy Player',
                click() {
                    miniPlayer.webContents.send('legacyPlayer', '');
                },
            }, {
                label: 'YouTube Player',
                click() {
                    miniPlayer.webContents.send('youtubePlayer', '');
                },
            }, ],
        }, {
            label: 'Quality',
            submenu: [{
                label: '360p',
                click() {
                    miniPlayer.webContents.send('play360p', '');
                }
            }, {
                label: '720p',
                click() {
                    miniPlayer.webContents.send('play720p', '');
                }
            }, {
                label: 'Audio',
                click() {
                    miniPlayer.webContents.send('playAudio', '');
                }
            }]
        }, {
            label: 'Playback',
            submenu: [{
                label: '0.25x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 0.25);
                }
            }, {
                label: '0.5x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 0.5);
                }
            }, {
                label: '0.75x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 0.75);
                }
            }, {
                label: '1x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 1);
                }
            }, {
                label: '1.25x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 1.25);
                }
            }, {
                label: '1.5x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 1.5);
                }
            }, {
                label: '1.75x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 1.75);
                }
            }, {
                label: '2x',
                click() {
                    miniPlayer.webContents.send('videoSpeed', 2);
                }
            }, ]
        }, {
            label: 'Loop',
            submenu: [{
                label: 'Toggle Loop',
                click() {
                    miniPlayer.webContents.send('videoLoop', '');
                }
            }]
        }, {
            label: 'View',
            submenu: [{
                role: 'toggledevtools'
            }, {
                type: 'separator'
            }, {
                role: 'resetzoom'
            }, {
                role: 'zoomin'
            }, {
                role: 'zoomout'
            }, {
                type: 'separator'
            }, {
                role: 'togglefullscreen'
            }]
        }, {
            role: 'window',
            submenu: [{
                role: 'minimize'
            }, {
                role: 'close'
            }]
        }];

        const menu = electron.remote.Menu.buildFromTemplate(template);

        miniPlayer.setMenu(menu);

        miniPlayer.loadURL(url.format({
            pathname: path.join(__dirname, '/templates/miniPlayer.html'),
            protocol: 'file:',
            slashes: true,
        }));

        miniPlayer.once('ready-to-show', () => {
            miniPlayer.show();
            miniPlayer.webContents.send('ping', videoData);
            showToast('Video has been opened in a new window.');
            // TODO: Add video to history once fully loaded.
        });

        if (rememberHistory === true) {
            let historyData = {
                videoId: videoData.videoId,
                author: videoData.channelName,
                authorId: videoData.channelId,
                published: videoData.published,
                publishedText: videoData.publishedText,
                description: videoData.description,
                viewCount: videoData.viewCount,
                title: videoData.videoTitle,
                lengthSeconds: videoData.lengthSeconds,
                videoThumbnails: videoData.videoThumbnail,
                liveNow: false,
                paid: false,
                type: 'video',
                timeWatched: new Date().getTime(),
                watchProgress: videoData.currentTime,
            };
            ft.log(historyData);
            addToHistory(historyData);
        }
    };

    let validateData = function(data) {
        let newData = data;
        newData.checked720p = false;
        newData.checked360p = false;
        newData.checkedAudio = false;
        newData.checkedDash = false;
        newData.checkedLive = false;

        if (newData.validLive) {
            newData.valid720p = false;
            newData.valid360p = false;
            newData.validAudio = false;
            newData.validDash = false;
            newData.checked720p = true;
            newData.checked360p = true;
            newData.checkedAudio = true;
            newData.checkedDash = true;
            newData.checkedLive = true;
            playVideo(newData);
            return;
        } else {
            newData.checkedLive = true;
            newData.validLive = false;
        }

        validateUrl(newData.video720p, (results) => {
            newData.valid720p = results;
            newData.checked720p = true;
            playVideo(newData);
        });

        validateUrl(newData.video360p, (results) => {
            newData.valid360p = results;
            newData.checked360p = true;
            playVideo(newData);
        });

        validateUrl(newData.videoAudio, (results) => {
            newData.validAudio = results;
            newData.checkedAudio = true;
            playVideo(newData);
        });

        validateUrl(newData.videoDash, (results) => {
            newData.validDash = results;
            newData.checkedDash = true;
            playVideo(newData);
        });
    };

    let videoData = {};

    videoData.videoId = videoId;
    videoData.videoDash = invidiousInstance + '/api/manifest/dash/' + videoId + '.mpd?unique_res=1';
    videoData.autoplay = autoplay;
    videoData.enableSubtitles = enableSubtitles;
    videoData.quality = defaultQuality;
    videoData.defaultPlaybackRate = defaultPlaybackRate;
    videoData.volume = currentVolume;

    historyDb.findOne({
        videoId: videoData.videoId
    }, function(err, doc) {
        if (doc !== null) {
            videoData.currentTime = doc.watchProgress;
        }
        else {
          videoData.currentTime = 0;
        }
    });

    if (defaultPlayer === 'dash') {
        videoData.playerSeen = true;
        videoData.legacySeen = false;
    } else {
        videoData.playerSeen = false;
        videoData.legacySeen = true;
    }

    let youtubeDlFinished = false;
    let invidiousFinished = false;

    if (getVideosLocally) {
        youtubedlGetInfo(videoId, (data) => {
            let videoUrls = data.formats;

            Object.keys(videoUrls).forEach((key) => {
                switch (videoUrls[key]['itag']) {
                    case '18':
                        videoData.video360p = videoUrls[key]['url'];
                        break;
                    case '22':
                        videoData.video720p = videoUrls[key]['url'];
                        break;
                }
            });

            videoData.videoAudio = decodeURIComponent(videoUrls[videoUrls.length - 1]['url']);

            youtubeDlFinished = true;

            if (youtubeDlFinished && invidiousFinished) {
                validateData(videoData);
            }
        });
    } else {
        youtubeDlFinished = true;
    }

    invidiousAPI('videos', videoId, {}, (data) => {
        console.log(data);
        let videoUrls = data.formatStreams;
        let formatUrls = data.adaptiveFormats;

        Object.keys(videoUrls).forEach((key) => {
            switch (videoUrls[key]['itag']) {
                case '18':
                    videoData.video360p = videoUrls[key]['url'];
                    break;
                case '22':
                    videoData.video720p = videoUrls[key]['url'];
                    break;
            }
        });

        videoData.videoAudio = decodeURIComponent(formatUrls[formatUrls.length - 1]['url']);

        if (data.liveNow !== false) {
            videoData.validLive = true;
            videoData.videoLive = data.hlsUrl;
            videoData.validDash = false;
            videoData.playerSeen = true;
            videoData.legacySeen = false;
        }

        let videoHtml = '';

        if (typeof(data.captions) !== 'undefined') {
            data.captions.forEach((caption) => {
                let subtitleUrl = invidiousInstance + caption.url;

                videoHtml = videoHtml + '<track kind="subtitles" src="' + subtitleUrl + '" srclang="' + caption.languageCode + '" label="' + caption.label + '">';
            });

            videoData.subtitleHtml = videoHtml;
        }

        let lengthSeconds = data.lengthSeconds;

        if (lengthSeconds < 120) {
            videoData.thumbnailInterval = 1;
        } else if (lengthSeconds < 300) {
            videoData.thumbnailInterval = 2;
        } else if (lengthSeconds < 900) {
            videoData.thumbnailInterval = 5;
        } else {
            videoData.thumbnailInterval = 10;
        }

        videoData.videoTitle = data.title;
        videoData.videoThumbnail = data.videoThumbnails[0].url;
        videoData.channelName = data.author;
        videoData.channelId = data.authorId;
        videoData.lengthSeconds = data.lengthSeconds;
        videoData.published = data.published;
        videoData.publishedText = data.publishedText;
        videoData.description = data.description;
        videoData.viewCount = data.viewCount;

        invidiousFinished = true;

        if (youtubeDlFinished && invidiousFinished) {
            validateData(videoData);
        }
    });
}

function checkDashSettings() {
    // Mediaelement.js for some reason calls onLoadStart() multiple times
    // This check is here to force checkVideoSettings to only run once.
    if (checkedVideoSettings) {
        return;
    }

    checkedVideoSettings = true;
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

        if (playerView.validLive) {
            quality = 'Live';
        }

        let player = new MediaElementPlayer('player', {
            features: ['playpause', 'current', 'progress', 'duration', 'volume', 'stop', 'speed', 'quality', 'loop', 'tracks', 'fullscreen', 'timerailthumbnails'],
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
            timeRailThumbnailsSeconds: playerView.thumbnailInterval,

            success: function(mediaElement, originalNode, instance) {
                ft.log(mediaElement, originalNode, instance);

                if (autoplay) {
                    instance.play();
                };

                window.setTimeout(() => {
                    if (enableSubtitles && typeof($('.mejs__captions-button').get(0)) !== 'undefined') {
                        let captionOptions = $('.mejs__captions-selector-input').get();
                        if (captionOptions.length > 1) {
                            captionOptions[1].click();
                        }
                    };
                }, 2000);

                let initializeSettings = function() {
                    let qualityOptions = $('.mejs__qualities-selector-input').get();

                    if (qualityOptions.length < 2) {
                        // Other plugin hasn't finished making the qualities.  Let's try again in a moment.

                        window.setTimeout(initializeSettings, 500);
                        return;
                    }

                    historyDb.findOne({
                        videoId: playerView.videoId
                    }, function(err, doc) {
                        if (doc !== null) {
                            if (typeof(playerView.currentTime) !== 'undefined') {
                                instance.currentTime = playerView.currentTime;
                                playerView.currentTime = undefined;
                            } else if (doc.watchProgress < instance.duration - 5 && playerView.validLive === false) {
                                instance.currentTime = doc.watchProgress;
                            }
                        }
                    });

                    let selectedOption = false;
                    qualityOptions.reverse().forEach((option, index) => {
                        if (option.value === defaultQuality || option.value === defaultQuality + 'p') {
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
                checkedVideoSettings = false;
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
    } else if (playerView.validLive !== false) {
        checkedDash = true;
        declarePlayer();
    } else {
        playerView.legacyFormats();
    }

    return;
}

function checkLegacySettings() {
    let player = $('.videoPlayer').get(0);

    let checked720p = false;
    let checked360p = false;
    let checkedAudio = false;

    let declarePlayer = function() {
        if (!checked720p || !checked360p || !checkedAudio) {
            return;
        }

        if (typeof(playerView.currentTime) !== 'undefined') {
            player.currentTime = playerView.currentTime;
        }

        if (autoplay) {
            player.play();
        }

        window.setTimeout(() => {
            historyDb.findOne({
                videoId: playerView.videoId
            }, function(err, doc) {
                if (doc !== null) {
                    if (doc.watchProgress < player.duration - 5 && typeof(playerView.currentTime) === 'undefined') {
                        player.currentTime = doc.watchProgress;
                    }

                    playerView.currentTime = undefined;
                }
            });
        }, 400);

        if (enableSubtitles) {
            player.textTracks[0].mode = 'showing';
        }

        changeVideoSpeed(defaultPlaybackRate);
    };

    if (playerView.valid360p !== false) {
        validateUrl(playerView.video360p, (valid) => {
            playerView.valid360p = valid;
            checked360p = true;
            declarePlayer();
        });
    } else {
        checked360p = true;
        declarePlayer();
    }

    if (playerView.valid720p !== false) {
        validateUrl(playerView.video720p, (valid) => {
            playerView.valid720p = valid;
            checked720p = true;
            declarePlayer();
        });
    } else {
        checked720p = true;
        declarePlayer();
    }

    if (playerView.validAudio !== false) {
        validateUrl(playerView.videoAudio, (valid) => {
            playerView.validAudio = valid;
            checkedAudio = true;
            declarePlayer();
        });
    } else {
        checkedAudio = true;
        declarePlayer();
    }

    return;
}

function playNextVideo() {
    let videoPlayer

    if (playerView.legacySeen) {
        videoPlayer = $('.videoPlayer').get(0);
    } else {
        videoPlayer = $('#player').get(0);
    }

    if (videoPlayer.loop !== false || playerView.playlistSeen === false) {
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
    } else {
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
    } else {
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
    } else {
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
    } else {
        player.currentTime = player.duration * percentage;
    }
}

function changeDuration(seconds) {
    if (playerView.legacySeen) {
        $('#legacyPlayer').get(0).currentTime = seconds;
    } else {
        player.currentTime = seconds;
    }
}

function updateVolume() {
    if (playerView.legacySeen) {
        currentVolume = $('#legacyPlayer').get(0).volume
    } else {
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

window.onbeforeunload = (e) => {
    electron.ipcRenderer.send("setBounds", '');

    if (playerView.seen === false) {
        return;
    }

    let lengthSeconds = 0;

    if (playerView.legacySeen === false) {
        lengthSeconds = player.currentTime;
    } else {
        lengthSeconds = $('.videoPlayer').get(0).currentTime;
    }

    updateWatchProgress(playerView.videoId, lengthSeconds);
};
