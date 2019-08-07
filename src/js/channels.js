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
 * File for all functions related specifically for channels.
 */

/**
 * Display a channel page, showing latest uploads.
 *
 * @param {string} channelId - The channel ID to display.
 *
 * @return {Void}
 */
function goToChannel(channelId) {

    channelView.channelId = channelId;
    channelView.channelSearchValue = '';
    channelVideosView.page = 2;

    headerView.title = 'Latest Uploads';
    hideViews();
    loadingView.seen = true;

    channelView.aboutTabSeen = false;

    // Setting subButtonText here as Mustache templates are logic-less.
    isSubscribed(channelId).then((subscribed) => {
        channelView.subButtonText = (subscribed ? "UNSUBSCRIBE" : "SUBSCRIBE");
    });

    invidiousAPI('channels', channelId, {}, (data) => {
        ft.log(data);

        channelView.id = channelId;
        channelView.name = data.author;

        // Can't access url of undefined, check defined
        data.authorBanners.length ?
            channelView.banner = data.authorBanners[0].url :
            channelView.banner = undefined;

        data.authorThumbnails.length >= 4 ?
            channelView.icon = data.authorThumbnails[3].url :
            channelView.icon = undefined

        channelView.subCount = data.subCount.toLocaleString(); //toLocaleString adds commas as thousands separators
        channelView.description = autolinker.link(data.description); //autolinker makes URLs clickable

        channelVideosView.videoList = [];

        channelView.featuredChannels = data.relatedChannels;

        const views = [
            aboutView,
            headerView,
            historyView,
            popularView,
            savedView,
            searchView,
            settingsView,
            subscriptionView
        ]

        if (seenAll(views, false)) {
            channelVideosView.seen = true;
            channelView.seen = true;
        } else {
            return;
        }

        loadingView.seen = false;
        data.latestVideos.forEach((video) => {
            displayVideo(video, 'channel');
        });

        if (typeof (channelView.banner) === 'undefined') {
            window.setTimeout(() => {
                $('.channelViewBanner').get(0).height = 200;
            }, 50);
        }
    }, (errorData) => {
        showToast(errorData.responseJSON.error);
        loadingView.seen = false;
    });

    invidiousAPI('channels/playlists', channelId, {}, (data) => {
        ft.log(data);

        channelPlaylistsView.videoList = [];
        channelPlaylistsView.continuationString = data.continuation;

        data.playlists.forEach((playlist) => {
            displayPlaylist(playlist, 'channelPlaylist');
        });
    });
}

/**
 * Grab the next list of videos from a channel.
 *
 * @return {Void}
 */
function channelNextPage() {
    showToast('Fetching results, please wait…');

    let sortValue = document.getElementById('channelVideosSortValue').value;

    invidiousAPI('channels/videos', channelView.channelId, {
        'sort_by': sortValue,
        'page': channelVideosView.page
    }, (data) => {
        ft.log(data);
        data.forEach((video) => {
            displayVideo(video, 'channel');
        });
    });

    channelVideosView.page = channelVideosView.page + 1;
}

function channelPlaylistNextPage() {
    if (channelPlaylistsView.continuationString === null) {
        showToast('There are no more playlists for this channel.');
        return;
    }

    showToast('Fetching results, please wait…');

    let sortValue = document.getElementById('channelVideosSortValue').value;

    invidiousAPI('channels/playlists', channelView.channelId, {
        'sort_by': sortValue,
        'continuation': channelPlaylistsView.continuationString
    }, (data) => {
        ft.log(data);
        channelPlaylistsView.continuationString = data.continuation;
        data.playlists.forEach((playlist) => {
            displayPlaylist(playlist, 'channelPlaylist');
        });
    });
}

function channelSearchKeypress(e) {
    if (e.keyCode === 13) {
        channelView.search();
    }
}

function searchChannel() {
    if (channelView.channelSearchValue === '') {
        return;
    }

    showToast('Fetching results, please wait…');

    invidiousAPI('channels/search', channelView.channelId, {
        q: channelView.channelSearchValue,
        page: channelSearchView.page,
    }, function (data) {
        ft.log(data);

        data.forEach((video) => {
            switch (video.type) {
            case 'video':
                displayVideo(video, 'channelSearch');
                break;
            case 'playlist':
                if (video.videoCount > 0) {
                    displayPlaylist(video, 'channelSearch');
                }
                break;
            default:
            }
        });

        channelSearchView.page = channelSearchView.page + 1;
    });
}

/**
 * Check the status of all view objects 'seen' property.
 * @param {Array} views - An array of view objects, that should have a 'seen' property
 * @param {bool} expected - The expected match, confirm all seen props === expected.
 *  True by default.
 * @returns {bool} - True if all views.seen === expected
 * @example seenAll{[view1, view2], false} => bool
 * @example seenAll{[view1, view2]} => bool
 */
function seenAll(views, expected = true) {
    return views.every(({
        seen
    }) => seen === expected)
}
