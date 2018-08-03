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



/**
 * Perform a search using the YouTube API. The search query is grabbed from the #search element.
 *
 * @param {string} nextPageToken - Optional: The page token to be inlcuded in the search.
 *
 * @return {Void}
 */
function search(nextPageToken = '') {
    const query = document.getElementById('search').value;

    if (query === '') {
        return;
    }

  if (nextPageToken === '') {
    hideViews();
    headerView.seen = true;
    headerView.title = 'Search Results';
    searchView.videoList = [];
    searchView.seen = true;
  } else {
    console.log(nextPageToken);
    showToast('Fetching results.  Please wait...');
  }

    youtubeAPI('search', {
        q: query,
        part: 'id',
        pageToken: nextPageToken,
        maxResults: 25,
    }, function (data) {
        ft.log('Search Data: ', data);

        let channels = data.items.filter((item) => {
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
            displayChannels(channels);
        }

        let grabDuration = getDuration(videos);

    grabDuration.then((videoList) => {
      console.log(videoList);
      videoList.items.forEach((video) => {
        displayVideo(video, 'search');
      });
    });

    searchView.nextPageToken = data.nextPageToken;
  })
}

/**
 * Grab the duration of the videos
 *
 * @param {array} data - An array of videos to get the duration from
 *
 * @return {promise} - The list of videos with the duration included.
 */
function getDuration(data) {
    return new Promise((resolve, reject) => {
        let videoIdList = '';

        for (let i = 0; i < data.length; i++) {
            if (videoIdList === '') {
                if (typeof (data[i]['id']) === 'string') {
                    videoIdList = data[i]['id'];
                } else {
                    videoIdList = data[i]['id']['videoId'];
                }
            } else {
                if (typeof (data[i]['id']) === 'string') {
                    videoIdList = videoIdList + ', ' + data[i]['id'];
                } else {
                    videoIdList = videoIdList + ', ' + data[i]['id']['videoId'];
                }
            }
        }

        youtubeAPI('videos', {
            part: 'snippet, contentDetails',
            id: videoIdList
        }, (data) => {
            resolve(data);
        });
    });
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

  const videoSnippet = videoData.snippet;

  video.duration = parseVideoDuration(videoData.contentDetails.duration);

  // Grab the published date for the video and convert to a user readable state.
  const dateString = new Date(videoSnippet.publishedAt);
  video.publishedDate = dateFormat(dateString, "mmm dS, yyyy");

  const searchMenu = $('#videoListContainer').html();

  // Include a remove icon in the list if the application is displaying the history list or saved videos.
  video.deleteHtml = () => {
    switch (listType) {
      case 'saved':
        return `<li onclick="removeSavedVideo('${videoId}'); showSavedVideos();">Remove Saved Video</li>`;
      case 'history':
        return `<li onclick="removeFromHistory('${videoId}'); showHistory();">Remove From History</li>`;
    }
  };

  video.id = videoData.id;
  video.youtubeUrl = 'https://youtube.com/watch?v=' + video.id;
  video.invidiousUrl = 'https://invidio.us/watch?v=' + video.id;
  // Includes text if the video is live.
  video.liveText = (videoSnippet.liveBroadcastContent === 'live') ? 'LIVE NOW' : '';
  video.thumbnail = videoSnippet.thumbnails.medium.url;
  video.title = videoSnippet.title;
  video.channelName = videoSnippet.channelTitle;
  video.channelId = videoSnippet.channelId;
  video.description = videoSnippet.description;
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
}

function displayChannels(channels) {
    let channelIds;

    channels.forEach((channel) => {
        if (typeof (channelIds) === 'undefined') {
            channelIds = channel.id.channelId;
        } else {
            channelIds = channelIds + ',' + channel.id.channelId;
        }
    });

    ft.log('Channel IDs: ', channelIds);

    youtubeAPI('channels', {
        part: 'snippet,statistics',
        id: channelIds,
    }, function (data) {
        ft.log('Channel Data: ', data);
        let items = data['items'].reverse();

        ft.log('Channel Items: ', items);

    items.forEach((item) => {
      let channelData = {};

      channelData.channelId = item.id;
      channelData.thumbnail = item.snippet.thumbnails.medium.url;
      channelData.channelName = item.snippet.title;
      channelData.description = item.snippet.description;
      channelData.subscriberCount = item.statistics.subscriberCount;
      channelData.videoCount = item.statistics.videoCount;
      channelData.isVideo = false;

      console.log(searchView.videoList);
      console.log(channelData);

      searchView.videoList = searchView.videoList.concat(channelData);
    });
  });
}

function displayPlaylists(playlists) {
    let playlistIds;

    playlists.forEach((playlist) => {
        if (typeof (playlistIds) === 'undefined') {
            playlistIds = playlist.id.playlistId;
        } else {
            playlistIds = playlistIds + ',' + playlist.id.playlistId;
        }
    });

    ft.log('Playlist IDs: ', playlistIds);

    youtubeAPI('playlists', {
        part: 'snippet,contentDetails',
        id: playlistIds,
    }, function (data) {
        ft.log('Playlist Data: ', data);
        let items = data['items'].reverse();
        const playlistListTemplate = require('./templates/playlistList.html');

        ft.log('Playlist Items: ', items);

        items.forEach((item) => {
            let dateString = new Date(item.snippet.publishedAt);
            let publishedDate = dateFormat(dateString, "mmm dS, yyyy");

            mustache.parse(playlistListTemplate);
            let rendered = mustache.render(playlistListTemplate, {
                channelId: item.snippet.channelId,
                channelName: item.snippet.channelTitle,
                playlistThumbnail: item.snippet.thumbnails.medium.url,
                playlistTitle: item.snippet.title,
                playlistDescription: item.snippet.description,
                videoCount: item.contentDetails.itemCount,
                publishedDate: publishedDate,
            });

            $(rendered).insertBefore('#getNextPage');
        });
    });
}

/**
 * Changes the page token to the next page button during a video search.
 *
 * @param {string} nextPageToken - The page token to replace the button function.
 *
 * @return {Void}
 */
function addNextPage(nextPageToken) {
    let oldFetchButton = document.getElementById('getNextPage');

    // Creates the element if it doesn't exist.
    if (oldFetchButton === null) {
        let fetchButton = document.createElement('div');
        fetchButton.id = 'getNextPage';
        fetchButton.innerHTML = '<i class="fas fa-search"></i> Fetch more results...';

        $('#videoListContainer').append(fetchButton);
    }

    // Update the on click method of the button.
    $(document).off('click', '#getNextPage');
    $(document).on('click', '#getNextPage', (event) => {
        search(nextPageToken);
    });
}

/**
 * Grab the video recommendations for a video.  This does not get recommendations based on what you watch,
 * as that would defeat the main purpose of using FreeTube.  At any time you can check the video on HookTube
 * and compare the recommendations there.  They should be nearly identical.
 *
 * @param {string} videoId - The video ID of the video to get recommendations from.
 */
function showVideoRecommendations(videoId) {
  playerView.recommendedVideoList = [];

  youtubeAPI('search', {
    part: 'id',
    type: 'video',
    relatedToVideoId: videoId,
    maxResults: 15,
  }, function(data) {
    let grabDuration = getDuration(data.items);
    grabDuration.then((videoList) => {
      videoList.items.forEach((video) => {
        let data = {}
        const snippet = video.snippet;

        data.duration = parseVideoDuration(video.contentDetails.duration);
        data.id = video.id;
        data.title = snippet.title;
        data.channelName = snippet.channelTitle;
        data.thumbnail = snippet.thumbnails.medium.url;
        data.publishedDate = dateFormat(snippet.publishedAt, "mmm dS, yyyy");

        playerView.recommendedVideoList = playerView.recommendedVideoList.concat(data);
      });
    });
  });
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
        playVideo(match[2]);
    } else if (urlSplit[3] == 'channel') {
        ft.log('channel found');
        goToChannel(urlSplit[4]);
    } else if (urlSplit[3] == 'user') {
        ft.log('user found');
        // call api to get the ID and then call goToChannel(id)
        youtubeAPI('channels', {
            part: 'id',
            forUsername: urlSplit[4]
        }, (data) => {
            ft.log('Channel Data: ', data.items[0].id);
            let channelID = data.items[0].id;
            goToChannel(channelID);
        });
    } else {
        ft.log('Video not found');
        search();
    }


}

/**
 * Convert duration into a more readable format
 *
 * @param {string} durationString - The string containing the video duration.  Formated as 'PT12H34M56S'
 *
 * @return {string} - The formated string. Ex: 12:34:56
 */
function parseVideoDuration(durationString) {
    let match = durationString.match(/P.*T(\d+H)?(\d+M)?(\d+S)?/);
    let duration = '';

    match = match.slice(1).map(function (x) {
        if (x != null) {
            return x.replace(/\D/, '');
        }
    });

    let hours = (parseInt(match[0]) || 0);
    let minutes = (parseInt(match[1]) || 0);
    let seconds = (parseInt(match[2]) || 0);

    if (hours != 0) {
        duration = hours + ':';
    } else {
        duration = minutes + ':';
    }

    if (hours != 0 && minutes < 10) {
        duration = duration + '0' + minutes + ':';
    } else if (hours != 0 && minutes > 10) {
        duration = duration + minutes + ':';
    } else if (hours != 0 && minutes == 0) {
        duration = duration + '00:';
    }

    if (seconds == 0) {
        duration = duration + '00';
    } else if (seconds < 10) {
        duration = duration + '0' + seconds;
    } else {
        duration = duration + seconds;
    }

    return duration;
}

/**
 * Grab the most popular videos over the last couple of days and display them.
 *
 * @return {Void}
 */
function showMostPopular() {

    // Get the date of 2 days ago.
    var d = new Date();
    d.setDate(d.getDate() - 2);

  // Grab all videos published 2 days ago and after and order them by view count.
  // These are the videos that are considered as 'most popular' and is how similar
  // Applications grab these.  Videos in the 'Trending' tab on YouTube will be different.
  // And there is no way to grab those videos.
  youtubeAPI('search', {
    part: 'id',
    order: 'viewCount',
    type: 'video',
    publishedAfter: d.toISOString(),
    maxResults: 50,
  }, function(data) {
    //createVideoListContainer('Most Popular:');
    console.log(data);
    let grabDuration = getDuration(data.items);

    grabDuration.then((videoList) => {
      console.log(videoList);
      popularView.videoList = [];
      loadingView.seen = false;
      videoList.items.forEach((video) => {
        displayVideo(video, 'popular');
      });
    });
  });
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
 * Get the YouTube embeded player of a video as well as channel information..
 *
 * @param {string} videoId - The video ID of the video to get.
 *
 * @return {promise} - The HTML of the embeded player
 */
function getChannelAndPlayer(videoId) {
    ft.log('Video ID: ', videoId);
    return new Promise((resolve, reject) => {
        youtubeAPI('videos', {
            part: 'snippet,player',
            id: videoId,
        }, function (data) {
            let embedHtml = data.items[0].player.embedHtml;
            embedHtml = embedHtml.replace('src="', 'src="https:');
            embedHtml = embedHtml.replace('width="480px"', '');
            embedHtml = embedHtml.replace('height="270px"', '');
            embedHtml = embedHtml.replace(/\"/g, '&quot;');
            resolve([embedHtml, data.items[0].snippet.channelId]);
        });
    });
}

/**
 * Check to see if the video URLs are valid. Change the video quality if one is not.
 * The API will grab video URLs, but they will sometimes return a 404.  This
 * is why this check is needed.  The video URL will typically be resolved over time.
 *
 * @param {string} video480p - The URL to the 480p video.
 * @param {string} video720p - The URL to the 720p video.
 */
function checkVideoUrls(video480p, video720p) {
    const currentQuality = $('#currentQuality').html();
    let buttonEmbed = document.getElementById('qualityEmbed');

    let valid480 = false;

    if (typeof (video480p) !== 'undefined') {
        let get480pUrl = fetch(video480p);
        get480pUrl.then((status) => {
            switch (status.status) {
            case 404:
                showToast('Found valid URL for 480p, but returned a 404. Video type might be available in the future.');
                $(document).off('click', '#quality480p');
                $(document).on('click', '#quality480p', (event) => {
                    changeQuality('');
                });
                buttonEmbed.click();
                return;
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                $(document).off('click', '#quality480p');
                $(document).on('click', '#quality480p', (event) => {
                    changeQuality('');
                });
                return;
                break;
            default:
                ft.log('480p is valid');
                if (currentQuality === '720p' && typeof (video720p) === 'undefined') {
                    changeQuality(video480p);
                }
                break;
            }
        });
    }

    if (typeof (video720p) !== 'undefined') {
        let get720pUrl = fetch(video720p);
        get720pUrl.then((status) => {
            switch (status.status) {
            case 404:
                showToast('Found valid URL for 720p, but returned a 404. Video type might be available in the future.');
                $(document).off('click', '#quality720p');
                $(document).on('click', '#quality720p', (event) => {
                    changeQuality('');
                });
                if (typeof (valid480) !== 'undefined') {
                    changeQuality(video480p, '480p');
                }
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                $(document).off('click', '#quality720p');
                $(document).on('click', '#quality720p', (event) => {
                    changeQuality('');
                });
                return;
                break;
            default:
                ft.log('720p is valid');
                break;
            }
        });
    }
}
