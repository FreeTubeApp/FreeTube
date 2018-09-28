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

let popularTimer;
let checkPopular = true;
let trendingTimer;
let checkTrending = true;

/**
 * Perform a search using the YouTube API. The search query is grabbed from the #search element.
 *
 * @param {string} page - Optional: The page token to be inlcuded in the search.
 *
 * @return {Void}
 */
function search(page = 1) {
    const query = document.getElementById('search').value;

    if (query === '') {
        return;
    }

    if (page === 1) {
        hideViews();
        headerView.seen = true;
        headerView.title = 'Search Results';
        searchView.videoList = [];
        searchView.seen = true;
    } else {
        console.log(page);
        showToast('Fetching results.  Please wait...');
    }

    invidiousAPI('search', '', {
        q: query,
        page: page,
        type: 'all',
    }, function (data) {
        console.log(data);

        /*let channels = data.items.filter((item) => {
            if (item.id.kind === 'youtube#channel') {
                return true;
            }
        });

        let playlists = data.items.filter((item) => {
            if (item.id.kind === 'youtube#playlist') {
                return true;
            }
        });

        let videos = data.items.filter((item) => {
            if (item.id.kind === 'youtube#video') {
                return true;
            }
        });

        ft.log('Channels: ', channels);
        ft.log('Typeof object above (channels) ^^', typeof (channels));
        ft.log('Playlists', playlists);

        if (playlists.length > 0) {
            //displayPlaylists(playlists);
        }

        if (channels.length > 0) {
            //displayChannels(channels);
        }

        let grabDuration = getDuration(data);

    grabDuration.then((videoList) => {
      console.log(videoList);
      videoList.items.forEach((video) => {
        displayVideo(video, 'search');
      });
    });*/

        data.forEach((video) => {
          switch (video.type) {
            case 'video':
              displayVideo(video, 'search');
              break;
            case 'channel':
              displayChannel(video);
              break;
            case 'playlist':
              displayPlaylist(video);
              break;
            default:
          }
        });

        //searchView.nextPageToken = data.nextPageToken;
        searchView.page = searchView.page + 1;
        loadingView.seen = false;
    })
}

/**
 * Display a video on the page.  Function is typically contained in a loop.
 *
 * @param {video} video - The video ID of the video to be displayed.
 * @param {string} listType - Optional: Specifies the list type of the video
 *                            Used for displaying the remove icon for history and saved videos.
 *
 * @return {Void}
 */
function displayVideo(videoData, listType = '') {
    let video = {};
    video.id = videoData.videoId;

    if (videoData.type == 'playlist') {
      video.isPlaylist = true;
    }

    historyDb.find({
        videoId: video.id
    }, (err, docs) => {
        if (jQuery.isEmptyObject(docs)) {
            // Do nothing
        } else {
            video.watched = true;
        }

        video.views = videoData.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        if (videoData.liveNow === true){
          video.liveText = (videoData.liveNow === true) ? 'LIVE NOW' : '';
          video.duration = '';
          video.publishedDate = '';
          video.viewText = 'watching';
        }
        else{
          video.liveText = '';

          if (video.views <= 1) {
            video.viewText = 'view';
          }
          else{
            video.viewText = 'views';
          }

          let time = videoData.lengthSeconds;
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

          if (minutes < 10 && hours > 0) {
            minutes = '0' + minutes;
          }

          if (hours > 0) {
              video.duration = hours + ":" + minutes + ":" + seconds;
          } else {
              video.duration = minutes + ":" + seconds;
          }

          // Grab the published date for the video and convert to a user readable state.
          //const dateString = new Date(videoSnippet.publishedAt);
          //video.publishedDate = dateFormat(dateString, "mmm dS, yyyy");
          video.publishedDate = videoData.publishedText;
        }

        //const searchMenu = $('#videoListContainer').html();

        // Include a remove icon in the list if the application is displaying the history list or saved videos.
        video.deleteHtml = () => {
            switch (listType) {
            case 'saved':
                return `<li onclick="removeSavedVideo('${video.id}'); showSavedVideos();">Remove Saved Video</li>`;
            case 'history':
                return `<li onclick="removeFromHistory('${video.id}'); showHistory();">Remove From History</li>`;
            }
        };

        video.youtubeUrl = 'https://youtube.com/watch?v=' + video.id;
        video.invidiousUrl = 'https://invidio.us/watch?v=' + video.id;
        video.thumbnail = videoData.videoThumbnails[4].url;
        video.title = videoData.title;
        video.channelName = videoData.author;
        video.channelId = videoData.authorId;
        video.description = videoData.description;
        video.isVideo = true;

        switch (listType) {
        case 'subscriptions':
            subscriptionView.videoList = subscriptionView.videoList.concat(video);
            video.removeFromSave = true;
            break;
        case 'search':
            searchView.videoList = searchView.videoList.concat(video);
            video.removeFromSave = false;
            break;
        case 'popular':
            popularView.videoList = popularView.videoList.concat(video);
            video.removeFromSave = false;
            break;
        case 'trending':
            trendingView.videoList = trendingView.videoList.concat(video);
            video.removeFromSave = false
            break;
        case 'saved':
            savedView.videoList = savedView.videoList.concat(video);
            video.removeFromSave = false;
            break;
        case 'history':
            historyView.videoList = historyView.videoList.concat(video);
            video.removeFromSave = false;
            break;
        case 'channel':
            channelVideosView.videoList = channelVideosView.videoList.concat(video);
            video.removeFromSave = false;
            break;
        }
    });
}

function displayChannel(channel) {
    let channelData = {};

    channelData.channelId = channel.authorId;
    channelData.thumbnail = channel.authorThumbnails[4].url;
    channelData.channelName = channel.author;
    channelData.description = channel.description;
    channelData.subscriberCount = channel.subCount;
    channelData.videoCount = channel.videoCount;
    channelData.isVideo = false;

    searchView.videoList = searchView.videoList.concat(channelData);
}

function displayPlaylist(playlist) {
    let playListData = {};

    playListData.isPlaylist = true;
    playListData.isVideo = false;
    playListData.thumbnail = playlist.videos[0].videoThumbnails[4].url;
    playListData.channelName = playlist.author;
    playListData.channelId = playlist.authorId;
    playListData.id = playlist.playlistId;
    playListData.description = playlist.videos[0].title + "\r\n" + playlist.videos[1].title;
    playListData.title = playlist.title;
    playListData.videoCount = playlist.videoCount;

    searchView.videoList = searchView.videoList.concat(playListData);
}

/**
 * Check if a link is a valid YouTube/HookTube link and play that video. Gets input
 * from the #jumpToInput element.
 *
 * @return {Void}
 */
function parseSearchText(url = '') {
    let input;

    if (url === '') {
        input = document.getElementById('search').value;
    } else {
        input = url;
    }

    if (input === '') {
        return;
    }

    // The regex to get the video id from a YouTube link.  Thanks StackOverflow.
    let rx = /^.*(?:(?:(you|hook)tu\.?be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;

    let match = input.match(rx);

    ft.log('Video ID: ', match);
    let urlSplit = input.split('/');
    if (match) {
        ft.log('Video found');
        loadingView.seen = true;
        playVideo(match[2]);
    } else if (urlSplit[3] == 'channel') {
        ft.log('channel found');
        loadingView.seen = true;
        goToChannel(urlSplit[4]);
    } else if (urlSplit[3] == 'user') {
        ft.log('user found');

        loadingView.seen = true;
        goToChannel(urlSplit[4]);
    } else {
        ft.log('Video not found');
        loadingView.seen = true;
        search();
    }


}

/**
 * Grab the most popular videos over the last couple of days and display them.
 *
 * @return {Void}
 */
function showMostPopular() {
  if (checkPopular === false && popularView.videoList.length > 0) {
      console.log('Will not load popular. Timer still on.');
      loadingView.seen = false;
      return;
  } else {
      checkPopular = false;
  }

    invidiousAPI('top', '', {}, function (data) {
        console.log(data);
        popularView.videoList = [];

        data.forEach((video) => {
            loadingView.seen = false;
            console.log(video);
            displayVideo(video, 'popular');
        });
    });

    popularTimer = window.setTimeout(() => {
        checkPopular = true;
    }, 60000);
}

/**
 * Grab trending videos over the last couple of days and display them.
 *
 * @return {Void}
 */
function showTrending() {
    if (checkTrending === false && trendingView.videoList.length > 0) {
        console.log('Will not load trending. Timer still on.');
        loadingView.seen = false;
        return;
    } else {
        checkTrending = false;
    }

    invidiousAPI('trending', '', {}, function (data) {
        console.log(data);
        popularView.videoList = [];

        data.forEach((video) => {
            loadingView.seen = false;
            console.log(video);
            displayVideo(video, 'trending');
        });
    });

    trendingTimer = window.setTimeout(() => {
        checkTrending = true;
    }, 60000);
}

/**
 * Create a link of the video to Invidious or YouTube and copy it to the user's clipboard.
 *
 * @param {string} website - The website to watch the video on.
 * @param {string} videoId - The video ID of the video to add to the URL
 *
 * @return {Void}
 */
function copyLink(website, videoId) {
    // Create the URL and copy to the clipboard.
    if (website == "youtube") {
        const url = 'https://' + website + '.com/watch?v=' + videoId;
        clipboard.writeText(url);
        showToast('URL has been copied to the clipboard');
    }

    if (website == "invidious") {
        website = "invidio";
        const url = "https://" + website + ".us/watch?v=" + videoId;
        clipboard.writeText(url);
        showToast('URL has been copied to the clipboard');
    }


}

/**
 * Check to see if the video URLs are valid. Change the video quality if one is not.
 * The API will grab video URLs, but they will sometimes return a 404.  This
 * is why this check is needed.  The video URL will typically be resolved over time.
 *
 * @param {string} video480p - The URL to the 480p video.
 * @param {string} video720p - The URL to the 720p video.
 */
function checkVideoUrls(video480p, video720p, videoAudio) {
    const currentQuality = $('#currentQuality').html();
    let buttonEmbed = document.getElementById('qualityEmbed');

    let valid480 = false;

    if (typeof (videoAudio) !== 'undefined') {
        let getAudioUrl = fetch(videoAudio);
        getAudioUrl.then((status) => {
            switch (status.status) {
            case 404:
                playerView.validAudio = false;
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                playerView.validAudio = false;
                return;
                break;
            default:
                ft.log('Audio is valid');
                break;
            }
        });
    }
    else{
      playerView.validAudio = false;
    }

    if (typeof (video480p) !== 'undefined') {
        let get480pUrl = fetch(video480p);
        get480pUrl.then((status) => {
            switch (status.status) {
            case 404:
                showToast('Found valid URL for 480p, but returned a 404. Video type might be available in the future.');
                playerView.valid480p = false;
                buttonEmbed.click();
                return;
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                playerView.valid480p = false;
                return;
                break;
            default:
                ft.log('480p is valid');
                if (currentQuality === '720p' && typeof (video720p) === 'undefined') {
                  playerView.currentQuality = '480p';
                }
                break;
            }
        });
    }
    else{
      playerView.valid480p = false;
    }

    if (typeof (video720p) !== 'undefined') {
        let get720pUrl = fetch(video720p);
        get720pUrl.then((status) => {
            switch (status.status) {
            case 404:
                showToast('Found valid URL for 720p, but returned a 404. Video type might be available in the future.');
                playerView.valid720p = false;
                if (typeof (valid480) !== 'undefined') {
                  playerView.currentQuality = '480p';
                }
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                playerView.valid720p = false;
                return;
                break;
            default:
                ft.log('720p is valid');
                break;
            }
        });
    }
    else{
      playerView.valid720p = false;
    }
}
