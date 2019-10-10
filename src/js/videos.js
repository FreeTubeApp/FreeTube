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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Perform a search using the YouTube API. The search query is grabbed from the #search element.
 *
 * @param {string} page - Optional: The page token to be inlcuded in the search.
 *
 * @return {Void}
 */
function search(page = 1) {
    const query = document.getElementById('search').value;
    const searchSortby = document.querySelector('input[name="searchSortBy"]:checked').value;
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const searchDate = document.querySelector('input[name="searchDate"]:checked').value;
    const searchDuration = document.querySelector('input[name="searchDuration"]:checked').value;

    searchFilter.seen = false;

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
        ft.log(page);
        showToast('Fetching results.  Please wait…');
    }

    invidiousAPI('search', '', {
        q: query,
        page: page,
        sort_by: searchSortby,
        date: searchDate,
        duration: searchDuration,
        type: searchType,
    }, function (data) {
        ft.log(data);

        data.forEach((video) => {
            switch (video.type) {
            case 'video':
                displayVideo(video, 'search');
                break;
            case 'channel':
                displayChannel(video);
                break;
            case 'playlist':
                if (video.videoCount > 0) {
                    displayPlaylist(video, 'search');
                }
                break;
            default:
            }
        });

        searchView.page = searchView.page + 1;
        loadingView.seen = false;
    });
}

function getSearchSuggestion() {
    const query = document.getElementById('search').value;

    invidiousAPI('search/suggestions', '', {
        q: query,
    }, function (data) {
        searchSuggestionsView.suggestionList = data.suggestions;
    });
}

function hideSearchSuggestion() {
    if (typeof ($('.searchSuggestions').get(0)) !== 'undefined' && !$('.searchSuggestions').is(':hover')) {
        searchSuggestionsView.seen = false;
    }
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
    if (videoData.paid) {
        return;
    }

    let video = {};
    video.id = videoData.videoId;

    if (videoData.type == 'playlist') {
        video.isPlaylist = true;
    }

    historyDb.findOne({
        videoId: video.id
    }, (err, docs) => {
        if (jQuery.isEmptyObject(docs)) {
            video.progressPercentage = 0;
        } else {
            video.watched = true;
            video.progressPercentage = (docs.watchProgress / videoData.lengthSeconds) * 100;
        }

        video.views = videoData.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        let time = videoData.lengthSeconds;

        if (videoData.liveNow === true || time < 0) {
            video.liveText = 'LIVE NOW';
            video.duration = '';
            video.publishedDate = '';
            video.viewText = 'watching';
        } else {
            let now = Date.now();
            video.liveText = '';

            if (video.views <= 1) {
                video.viewText = 'view';
            } else {
                video.viewText = 'views';
            }

            let published = new Date(videoData.published * 1000);
            let hours = 0;

            if (now < published.getTime()) {
                video.publishedDate = 'Premieres on ' + published.toLocaleString();
            } else {
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

                video.publishedDate = videoData.publishedText;
            }
        }

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
        video.youtubeNocookieUrl = 'https://www.youtube-nocookie.com/embed/' + video.id;
        video.invidiousUrl = invidiousInstance + '/watch?v=' + video.id;
        if (typeof (videoData.videoThumbnails) === 'string') {
            video.thumbnail = videoData.videoThumbnails;
        } else {
            video.thumbnail = videoData.videoThumbnails[4].url;
        }
        video.title = videoData.title;
        video.channelName = videoData.author;
        video.channelId = videoData.authorId;
        video.description = videoData.description;
        video.isVideo = true;
        video.premium = videoData.premium;

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
            savedView.videoList.splice(videoData.position, 0, video);
            video.removeFromSave = false;
            break;
        case 'history':
            historyView.videoList.splice(videoData.position, 0, video);
            video.removeFromSave = false;
            break;
        case 'channel':
            channelVideosView.videoList = channelVideosView.videoList.concat(video);
            video.removeFromSave = false;
            break;
        case 'channelSearch':
            channelSearchView.videoList = channelSearchView.videoList.concat(video);
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
    channelData.subscriberCount = channel.subCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    channelData.videoCount = channel.videoCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    channelData.isVideo = false;

    searchView.videoList = searchView.videoList.concat(channelData);
}

function displayPlaylist(playlist, listType) {
    let playListData = {};
    playListData.videoCount = playlist.videoCount;

    if (playlist.videoCount === 0) {
        return;
    }

    playListData.isPlaylist = true;
    playListData.isVideo = false;
    playListData.thumbnail = playlist.videos[0].videoThumbnails[4].url;
    playListData.channelName = playlist.author;
    playListData.channelId = playlist.authorId;
    playListData.id = playlist.playlistId;
    playListData.title = playlist.title;


    if (playlist.videoCount.length > 2) {
        playListData.description = playlist.videos[0].title + "\r\n" + playlist.videos[1].title;
    } else {
        playListData.description = playlist.videos[0].title;
    }

    if (playListData.channelName == 'YouTube' && playListData.title.includes('Mix')) {
        // Hide Mix playlists.
        return;
    }

    switch (listType) {
    case 'channelPlaylist':
        channelPlaylistsView.videoList = channelPlaylistsView.videoList.concat(playListData);
        break;
    case 'channelSearch':
        channelSearchView.videoList = channelSearchView.videoList.concat(playListData);
        break;
    default:
        searchView.videoList = searchView.videoList.concat(playListData);
    }
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
        input = url.replace(/freetube\:\/\//, '');
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
        document.getElementById('search').value = decodeURIComponent(input);
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
        ft.log('Will not load popular. Timer still on.');
        loadingView.seen = false;
        return;
    } else {
        checkPopular = false;
    }

    invidiousAPI('popular', '', {}, function (data) {
        ft.log(data);
        popularView.videoList = [];

        data.forEach((video) => {
            loadingView.seen = false;
            ft.log(video);
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
        ft.log('Will not load trending. Timer still on.');
        loadingView.seen = false;
        return;
    } else {
        checkTrending = false;
    }

    invidiousAPI('trending', '', {
        region: settingsView.region
    }, function (data) {
        ft.log(data);
        popularView.videoList = [];

        data.forEach((video) => {
            loadingView.seen = false;
            ft.log(video);
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
};

/**
 * Check to see if the video URLs are valid. Change the video quality if one is not.
 * The API will grab video URLs, but they will sometimes return a 404.  This
 * is why this check is needed.  The video URL will typically be resolved over time.
 *
 * @param {string} video360p - The URL to the 360p video.
 * @param {string} video720p - The URL to the 720p video.
 */
function checkVideoUrls(video360p, video720p, videoAudio) {
    const currentQuality = $('#currentQuality').html();
    let buttonEmbed = document.getElementById('qualityEmbed');

    let valid360 = false;

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
    } else {
        playerView.validAudio = false;
    }

    if (typeof (video360p) !== 'undefined') {
        let get360pUrl = fetch(video360p);
        get360pUrl.then((status) => {
            switch (status.status) {
            case 404:
                showToast('Found valid URL for 360p, but returned a 404. Video type might be available in the future.');
                playerView.valid360p = false;
                buttonEmbed.click();
                return;
                break;
            case 403:
                showToast('This video is unavailable in your country.');
                playerView.valid360p = false;
                return;
                break;
            default:
                ft.log('360p is valid');
                if (currentQuality === '720p' && typeof (video720p) === 'undefined') {
                    playerView.currentQuality = '360p';
                }
                break;
            }
        });
    } else {
        playerView.valid360p = false;
    }

    if (typeof (video720p) !== 'undefined') {
        let get720pUrl = fetch(video720p);
        get720pUrl.then((status) => {
            switch (status.status) {
            case 404:
                showToast('Found valid URL for 720p, but returned a 404. Video type might be available in the future.');
                playerView.valid720p = false;
                if (typeof (valid360) !== 'undefined') {
                    playerView.currentQuality = '360p';
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
    } else {
        playerView.valid720p = false;
    }
}
