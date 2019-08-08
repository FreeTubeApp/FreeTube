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

const mainHeaderTemplate = require('./templates/mainHeader.html');
const aboutTemplate = require('./templates/about.html');
const settingsTemplate = require('./templates/settings.html');
const videoListTemplate = require('./templates/videoTemplate.html');
const playerTemplate = require('./templates/player.html');
const channelTemplate = require('./templates/channelView.html');
const progressViewTemplate = require('./templates/progressView.html');
const playlistViewTemplate = require('./templates/playlistView.html');
const currentProfileViewTemplate = require('./templates/currentProfileView.html');
const profileSelectViewTemplate = require('./templates/profileSelectView.html');
const subscriptionManagerViewTemplate = require('./templates/subscriptionManagerView.html');
const editProfileViewTemplate = require('./templates/editProfileView.html');
const searchSuggestionsViewTemplate = require('./templates/searchSuggestionsView.html');

/*
 * Progress view
 *
 * Shows progress bar on bottom of application.
 *
 * seen: Toggles visibility of view
 * progressWidth: sets width of the progress bar
 */
let progressView = new Vue({
    el: '#progressView',
    data: {
        seen: true,
        progressWidth: 0
    },
    template: progressViewTemplate
});

let loadingView = new Vue({
    el: '#loading',
    data: {
        seen: false
    }
});

let searchFilter = new Vue({
    el: '#searchFilter',
    data: {
        seen: false
    }
});

let noSubscriptions = new Vue({
    el: '#noSubscriptions',
    data: {
        seen: false
    }
});

let sideNavBar = new Vue({
    el: '#sideNav',
    data: {
        distractionFreeMode: false
    },
    methods: {
        subscriptions: (event) => {
            hideViews();
            if (subscriptionView.videoList.length === 0) {
                loadingView.seen = true;
            }
            headerView.seen = true;
            headerView.title = 'Latest Subscriptions';
            subscriptionView.seen = true;
            loadSubscriptions();
        },
        popular: (event) => {
            hideViews();
            if (loadingView.seen !== false) {
                loadingView.seen = false;
            }
            if (popularView.videoList.length === 0) {
                loadingView.seen = true;
            }
            headerView.seen = true;
            headerView.title = 'Most Popular';
            popularView.seen = true;
            showMostPopular();
        },
        trending: (event) => {
            hideViews();
            if (loadingView.seen !== false) {
                loadingView.seen = false;
            }
            if (trendingView.videoList.length === 0) {
                loadingView.seen = true;
            }
            headerView.seen = true;
            headerView.title = 'Trending';
            trendingView.seen = true;
            showTrending();
        },
        saved: (event) => {
            hideViews();
            if (loadingView.seen !== false) {
                loadingView.seen = false;
            } else {
                loadingView.seen = true;
            }
            headerView.seen = true;
            headerView.title = 'Favorited Videos';
            savedView.seen = true;
            showSavedVideos();
        },
        history: (event) => {
            hideViews();
            if (loadingView.seen !== false) {
                loadingView.seen = false;
            } else {
                loadingView.seen = true;
            }
            headerView.seen = true;
            headerView.title = 'Video History';
            historyView.seen = true;
            showHistory();
        },
        settings: (event) => {
            hideViews();
            if (loadingView.seen !== false) {
                loadingView.seen = false;
            }
            settingsView.seen = true;
            updateSettingsView();
        },
        about: (event) => {
            hideViews();
            if (loadingView.seen !== false) {
                loadingView.seen = false;
            }
            aboutView.seen = true;
        }
    }
});

let headerView = new Vue({
    el: '#mainHeaderView',
    data: {
        seen: true,
        title: 'Latest Subscriptions'
    },
    template: mainHeaderTemplate
});

let searchSuggestionsView = new Vue({
    el: '#searchSuggestionsView',
    data: {
        seen: false,
        suggestionList: [],
    },
    methods: {
        newSearchTerm: (text) => {
            loadingView.seen = true;
            document.getElementById('search').value = text;
            getSearchSuggestion();
            search();
            searchSuggestionsView.seen = false;
        },
    },
    template: searchSuggestionsViewTemplate
});

let subscriptionView = new Vue({
    el: '#subscriptionView',
    data: {
        seen: true,
        isSearch: false,
        videoList: [],
        fullVideoList: [],
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            ft.log(videoId);
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let popularView = new Vue({
    el: '#popularView',
    data: {
        seen: false,
        isSearch: false,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let trendingView = new Vue({
    el: '#trendingView',
    data: {
        seen: false,
        isSearch: false,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let savedView = new Vue({
    el: '#savedView',
    data: {
        seen: false,
        isSearch: false,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            toggleSavedVideo(videoId);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let historyView = new Vue({
    el: '#historyView',
    data: {
        seen: false,
        isSearch: false,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let playlistView = new Vue({
    el: '#playlistView',
    data: {
        seen: false,
        playlistId: '',
        channelName: '',
        channelId: '',
        thumbnail: '',
        title: '',
        videoCount: '',
        viewCount: '',
        description: '',
        lastUpdated: '',
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId, playlistView.playlistId);

            backButtonView.lastView = playlistView
        },
        channel: (channelId) => {
            goToChannel(channelId);

            backButtonView.lastView = playlistView
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        openYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            shell.openExternal(url);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        openInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            shell.openExternal(url);
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        }
    },
    template: playlistViewTemplate
});

let aboutView = new Vue({
    el: '#aboutView',
    data: {
        seen: false,
        rssFeed: [],
        versionNumber: electron.remote.app.getVersion()
    },
    template: aboutTemplate
});

let settingsView = new Vue({
    el: '#settingsView',
    data: {
        seen: false,
        useTheme: false,
        useTor: false,
        apiKey: '',
        history: true,
        autoplay: true,
        autoplayPlaylists: true,
        playNextVideo: false,
        subtitles: false,
        updates: true,
        localScrape: true,
        region: 'US',
        proxyAddress: false,
        invidiousInstance: 'https://invidio.us',
        checkProxyResult: false,
        proxyTestLoading: false,
        hideWatchedSubs: false,
        debugMode: false,
        distractionFreeMode: false,
        defaultVolume: 1,
        defaultVideoSpeed: 1,
        subWatched: false,
        videoView: 'grid',
        defaultProfile: 'Default',
        proxyVideos: false,
    },
    methods: {
        checkProxy() {
            this.checkProxyResult = false;
            this.proxyTestLoading = true;
            electron.ipcRenderer.send("setProxy", this.proxyAddress);

            proxyRequest(() => {
                $.ajax({
                        url: "https://ipinfo.io/json",
                        dataType: 'json',
                    }).done(response => {
                        ft.log(response);
                        this.checkProxyResult = response;
                    })
                    .fail((xhr, textStatus, error) => {
                        ft.log(xhr);
                        ft.log(textStatus);
                        showToast('Proxy test failed');
                    }).always(() => {
                        this.proxyTestLoading = false;
                        if (!useTor) {
                            electron.ipcRenderer.send("setProxy", {});
                        }
                    });
            })
        },
        setDistractionFreeMode(setting) {
            settingsView.distractionFreeMode = setting;
            sideNavBar.distractionFreeMode = setting;
            channelView.distractionFreeMode = setting;
            playerView.distractionFreeMode = setting;
        },
    },
    computed: {
        proxyTestButtonText() {
            return this.proxyTestLoading ? "LOADING..." : "TEST PROXY"
        },
        volumeHtml() {
            return Math.round(this.defaultVolume * 100);
        }
    },
    template: settingsTemplate
});

let searchView = new Vue({
    el: '#searchView',
    data: {
        seen: false,
        isSearch: true,
        page: 1,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);

            backButtonView.lastView = searchView
        },
        channel: (channelId) => {
            goToChannel(channelId);

            backButtonView.lastView = searchView
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        nextPage: () => {
            ft.log(searchView.page);
            search(searchView.page);
        },
        playlist: (playlistId) => {
            showPlaylist(playlistId);

            backButtonView.lastView = searchView
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let channelView = new Vue({
    el: '#channelView',
    data: {
        seen: false,
        aboutTabSeen: false,
        id: '',
        name: '',
        icon: '',
        banner: '',
        subCount: '',
        subButtonText: '',
        description: '',
        channelSearchValue: '',
        distractionFreeMode: false,
        featuredChannels: [],
    },
    methods: {
        videoTab: () => {
            channelVideosView.seen = true;
            channelView.aboutTabSeen = false;
            channelPlaylistsView.seen = false;
            channelSearchView.seen = false;
        },
        playlistTab: () => {
            channelPlaylistsView.seen = true;
            channelVideosView.seen = false;
            channelView.aboutTabSeen = false;
            channelSearchView.seen = false;
        },
        aboutTab: () => {
            channelView.aboutTabSeen = true;
            channelVideosView.seen = false;
            channelPlaylistsView.seen = false;
            channelSearchView.seen = false;
        },
        subscription: (channelId) => {
            let channelData = {
                channelId: channelView.id,
                channelName: channelView.name,
                channelThumbnail: channelView.icon
            };
            toggleSubscription(channelData);
        },
        sort: () => {
            if (channelVideosView.seen) {
                channelVideosView.page = 1;
                channelVideosView.videoList = [];
                channelNextPage();
            } else {
                // Playlist View is active
                channelPlaylistsView.continuationString = '';
                channelPlaylistsView.videoList = [];
                channelPlaylistNextPage();
            }
        },
        search: () => {
            channelSearchView.page = 1;
            channelSearchView.videoList = [];
            channelView.aboutTabSeen = false;
            channelVideosView.seen = false;
            channelPlaylistsView.seen = false;
            channelSearchView.seen = true;
            searchChannel();
        },
        goToChannel: (channelId) => {
            goToChannel(channelId);
        },
    },
    computed: {
        sortOptions: () => {
            if (channelVideosView.seen) {
                return [{
                        value: 'newest',
                        label: 'Newest'
                    },
                    {
                        value: 'oldest',
                        label: 'Oldest'
                    },
                    {
                        value: 'popular',
                        label: 'Most Popular'
                    },
                ];
            } else {
                return [{
                        value: 'newest',
                        label: 'Newest'
                    },
                    {
                        value: 'oldest',
                        label: 'Oldest'
                    },
                    {
                        value: 'last',
                        label: 'Last Video Added'
                    },
                ];
            }
        },
    },
    template: channelTemplate
});

let channelVideosView = new Vue({
    el: '#channelVideosView',
    data: {
        seen: false,
        isSearch: true,
        page: 2,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        nextPage: () => {
            channelNextPage();
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let channelPlaylistsView = new Vue({
    el: '#channelPlaylistsView',
    data: {
        seen: false,
        isSearch: true,
        page: 2,
        continuationString: '',
        videoList: []
    },
    methods: {
        playlist: (playlistId) => {
            showPlaylist(playlistId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        nextPage: () => {
            channelPlaylistNextPage();
        },
    },
    template: videoListTemplate
});

let channelSearchView = new Vue({
    el: '#channelSearchView',
    data: {
        seen: false,
        channelId: '',
        isSearch: true,
        page: 2,
        videoList: []
    },
    methods: {
        play: (videoId) => {
            loadingView.seen = true;
            playVideo(videoId);
        },
        channel: (channelId) => {
            goToChannel(channelId);
        },
        playlist: (playlistId) => {
            showPlaylist(playlistId);
        },
        toggleSave: (videoId) => {
            addSavedVideo(videoId);
        },
        nextPage: () => {
            showToast('Fetching results.  Please wait…');
            searchChannel();
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        history: (videoId) => {
            removeFromHistory(videoId);
        },
        miniPlayer: (videoId) => {
            clickMiniPlayer(videoId);
        }
    },
    template: videoListTemplate
});

let playerView = new Vue({
    el: '#playerView',
    data: {
        seen: false,
        playlistSeen: false,
        legacySeen: false,
        firstLoad: true,
        currentTime: undefined,
        publishedDate: '',
        videoUrl: '',
        videoId: '',
        channelId: '',
        channelIcon: '',
        channelName: '',
        subscribedText: '',
        subscriptionCount: '',
        savedText: '',
        savedIconType: 'far',
        description: '',
        videoThumbnail: '',
        subtitleHtml: '',
        currentQuality: '',
        videoAudio: '',
        validAudio: false,
        video360p: '',
        valid360p: false,
        video720p: '',
        valid720p: false,
        videoDash: '',
        validDash: true,
        videoLive: '',
        validLive: false,
        embededHtml: '',
        currentSpeed: 1,
        lengthSeconds: 0,
        videoTitle: '',
        videoViews: '',
        likePercentage: 0,
        videoLikes: 0,
        videoDislikes: 0,
        playerSeen: true,
        playlistTitle: '',
        playlistChannelName: '',
        playlistIndex: 1,
        playlistTotal: 1,
        playlistLoop: false,
        playlistShuffle: false,
        playlistShowList: true,
        recommendedVideoList: [],
        playlistVideoList: [],
        distractionFreeMode: false
    },
    methods: {
        channel: (channelId) => {
            goToChannel(channelId);
        },
        subscription: () => {
            let channelData = {
                channelId: playerView.channelId,
                channelName: playerView.channelName,
                channelThumbnail: playerView.channelIcon
            };
            toggleSubscription(channelData);
        },
        quality: (url, qualityText) => {
            ft.log(url);
            ft.log(qualityText);
            if (playerView.legacySeen === true) {
                // Update time to new url
                const currentPlayBackTime = $('.videoPlayer').get(0).currentTime;
                ft.log(currentPlayBackTime);
                playerView.videoUrl = url;
                playerView.currentQuality = qualityText;
                setTimeout(() => {
                    $('.videoPlayer').get(0).currentTime = currentPlayBackTime;
                    $('.videoPlayer').get(0).play();
                }, 100);
            }
        },
        embededPlayer: () => {
            playerView.playerSeen = false;
            playerView.legacySeen = false;
            playerView.currentTime = undefined;
            checkedVideoSettings = false;
        },
        legacyFormats: () => {
            if (typeof (player) !== 'undefined') {
                playerView.currentTime = player.currentTime;
            }

            checkedVideoSettings = false;

            playerView.playerSeen = false;
            playerView.legacySeen = true;
        },
        dashFormats: () => {
            if (typeof ($('#legacyPlayer').get(0)) !== 'undefined') {
                playerView.currentTime = $('#legacyPlayer').get(0).currentTime;
            }
            checkedVideoSettings = false;

            playerView.legacySeen = false;
            playerView.playerSeen = true;
        },
        copyYouTube: (videoId) => {
            const url = 'https://youtube.com/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        openYouTube: (videoId) => {
            shell.openExternal('https://youtube.com/watch?v=' + videoId);
        },
        copyInvidious: (videoId) => {
            const url = invidiousInstance + '/watch?v=' + videoId;
            clipboard.writeText(url);
            showToast('URL has been copied to the clipboard');
        },
        openInvidious: (videoId) => {
            shell.openExternal(invidiousInstance + '/watch?v=' + videoId);
        },
        save: (videoId) => {
            toggleSavedVideo(videoId);
        },
        play: (videoId, playlistId = '') => {
            loadingView.seen = true;
            playVideo(videoId, playlistId);
        },
        loop: () => {
            let legacyPlayer = $('.videoPlayer').get(0);

            if (legacyPlayer.loop === false) {
                legacyPlayer.loop = true;
                showToast('Video loop has been turned on.');
            } else {
                legacyPlayer.loop = false;
                showToast('Video loop has been turned off.')
            }
        },
        playlist: (playlistId) => {
            showPlaylist(playlistId);
        },
        playlistLoopToggle: () => {
            if (playerView.playlistLoop !== false) {
                showToast('Playlist will no longer loop');
                playerView.playlistLoop = false;
            } else {
                showToast('Playlist will now loop');
                playerView.playlistLoop = true;
            }
        },
        playlistShuffleToggle: () => {
            if (playerView.playlistShuffle !== false) {
                showToast('Playlist will no longer shuffle');
                playerView.playlistShuffle = false;
            } else {
                showToast('Playlist will now shuffle');
                playerView.playlistShuffle = true;
            }
        },
    },
    computed: {
        thumbnailInterval: function () {
            if (this.lengthSeconds < 120) {
                return 1;
            } else if (this.lengthSeconds < 300) {
                return 2;
            } else if (this.lengthSeconds < 900) {
                return 5;
            } else {
                return 10;
            }
        },
        storyBoardUrl: function () {
            return invidiousInstance + '/api/v1/storyboards/' + this.videoId + '?height=90';
        }
    },
    template: playerTemplate
});

let backButtonView = new Vue({
    el: '#backButton',
    data: {
        lastView: false
    },
    methods: {
        back: function () {
            // variable here because this.lastView gets reset in hideViews()
            const isSearch = this.lastView.$options.el === "#searchView";
            const isSubManager = this.lastView.$options.el === "#subscriptionManagerView";

            hideViews();
            loadingView.seen = false;

            // Check if lastView was search
            if (isSearch) {
                // Change back to searchView
                headerView.seen = true;
                headerView.title = 'Search Results';
                searchView.seen = true;

                // reset this.lastView
                this.lastView = false;
            } else if (isSubManager) {
                subscriptionManagerView.seen = true;
                this.lastView = false;
            } else {
                // if not search then this.lastView has to be playlistView

                // Change back to playlistView
                playlistView.seen = true;

                // Check if searchView has videos if it does set this.lastView as searchView
                this.lastView = searchView.videoList.length > 0 ? searchView : false;
            }
        }
    },
    computed: {
        canShowBackButton: function () {
            // this.lastView can be either searchView, subscriptionManagerView, or playlistView
            return !!this.lastView && !this.lastView.seen;
        }
    },
});

let profileSelectView = new Vue({
    el: '#profileSelectView',
    data: {
        seen: false,
        activeProfile: [],
        activeProfileInitial: '',
        activeProfileInitialColor: '#000000',
        profileList: [],
        profileLock: false,
    },
    methods: {
        showSubscriptionManager: function () {
            hideViews();
            subscriptionManagerView.seen = true;
        },
        setActiveProfile: function (index) {
            if (profileSelectView.profileLock !== false) {
                window.setTimeout(() => {
                    profileSelectView.setActiveProfile(index);
                }, 1000);
                return;
            }

            profileSelectView.profileLock = true;

            this.activeProfile = this.profileList[index];
            this.activeProfileInitial = this.profileInitials[index];
            this.activeProfileInitialColor = this.profileTextColor[index];
            this.seen = false;
            displaySubs();
            addSubsToView(subscriptionView.fullVideoList);

            if (playerView.seen !== false || channelView.seen !== false) {
                let checkSubscription;
                if (playerView.seen !== false) {
                    checkSubscription = isSubscribed(playerView.channelId);
                } else {
                    checkSubscription = isSubscribed(channelView.channelId);
                }

                checkSubscription.then((results) => {
                    if (results === false) {
                        channelView.subButtonText = 'SUBSCRIBE';
                        playerView.subscribedText = 'SUBSCRIBE';
                    } else {
                        channelView.subButtonText = 'UNSUBSCRIBE';
                        playerView.subscribedText = 'UNSUBSCRIBE';
                    }
                });
            }
        }
    },
    computed: {
        profileInitials: function () {
            let initials = [];
            if (this.profileList.length > 0) {
                this.profileList.forEach((profile) => {
                    initials.push(profile.name.charAt(0));
                });
            }
            return initials;
        },
        profileTextColor: function () {
            let colors = [];
            if (this.profileList.length > 0) {
                this.profileList.forEach((profile) => {
                    let cutHex = (profile.color.charAt(0) == "#") ? profile.color.substring(1, 7) : h;
                    let colorValueR = parseInt(cutHex.substring(0, 2), 16);
                    let colorValueG = parseInt(cutHex.substring(2, 4), 16);
                    let colorValueB = parseInt(cutHex.substring(4, 6), 16);

                    let luminance = (0.299 * colorValueR + 0.587 * colorValueG + 0.114 * colorValueB) / 255;

                    if (luminance > 0.5) {
                        colors.push('#000000');
                    } else {
                        colors.push('#FFFFFF');
                    }
                });
            }
            return colors;
        }
    },
    template: profileSelectViewTemplate
});

let currentProfileView = new Vue({
    el: '#currentProfileView',
    data: {},
    computed: {
        activeProfile: function () {
            return profileSelectView.activeProfile;
        },
        activeProfileInitial: function () {
            return profileSelectView.activeProfileInitial;
        },
        activeProfileInitialColor: function () {
            return profileSelectView.activeProfileInitialColor;
        }
    },
    template: currentProfileViewTemplate
});

let subscriptionManagerView = new Vue({
    el: '#subscriptionManagerView',
    data: {
        seen: false,
    },
    methods: {
        editProfile: function (isNewProfile, index) {
            hideViews();
            editProfileView.isNewProfile = isNewProfile;
            if (isNewProfile) {
                editProfileView.profileName = '';
                editProfileView.profileColor = '';
                editProfileView.newProfileName = 'Profile ' + (this.profileList.length + 1);
                let colorPaletteKeys = Object.keys(editProfileView.colorPalette);
                let randomColor = colorPalette[colorPaletteKeys[colorPaletteKeys.length * Math.random() << 0]];
                editProfileView.newProfileColorText = randomColor;
                editProfileView.subscriptionList = [];
            } else {
                editProfileView.profileName = this.profileList[index].name;
                editProfileView.profileColor = this.profileList[index].color;
                editProfileView.newProfileName = this.profileList[index].name;
                editProfileView.newProfileColorText = this.profileList[index].color;
                if (this.profileList[index].name === 'All Channels') {
                    // Sort alphabetically
                    subDb.find({}).sort({
                        channelName: 1
                    }).exec((err, subs) => {
                        let list = [];
                        subs.forEach((sub) => {
                            sub.checked = false;
                            list.push(sub);
                        });
                        editProfileView.subscriptionList = list;
                    });
                } else {
                    // Sort alphabetically
                    subDb.find({
                        profile: {
                            $elemMatch: {
                                value: this.profileList[index].name
                            }
                        }
                    }).sort({
                        channelName: 1
                    }).exec((err, subs) => {
                        let list = [];
                        subs.forEach((sub) => {
                            sub.checked = false;
                            list.push(sub);
                        });
                        editProfileView.subscriptionList = list;
                    });
                }
            }
            editProfileView.seen = true;
            loadingView.seen = false;
            backButtonView.lastView = subscriptionManagerView;
        }
    },
    computed: {
        profileList: function () {
            return profileSelectView.profileList;
        },
        profileInitials: function () {
            return profileSelectView.profileInitials;
        },
        profileTextColor: function () {
            return profileSelectView.profileTextColor;
        }
    },
    template: subscriptionManagerViewTemplate
});

let editProfileView = new Vue({
    el: '#editProfileView',
    data: {
        seen: false,
        isNewProfile: false,
        subscriptionList: [],
        profileName: '',
        profileColor: '',
        newProfileName: '',
        newProfileColorText: '',
        selectedProfile: '',
        colorPalette: {
            red: '#d50000',
            pink: '#C51162',
            purple: '#AA00FF',
            deepPurple: '#6200EA',
            indigo: '#304FFE',
            blue: '#2962FF',
            lightBlue: '#0091EA',
            cyan: '#00B8D4',
            teal: '#00BFA5',
            green: '#00C853',
            lightGreen: '#64DD17',
            lime: '#AEEA00',
            yellow: '#FFD600',
            amber: '#FFAB00',
            orange: '#FF6D00',
            deepOrange: '#DD2C00',
        },
    },
    methods: {
        changeProfileColor: function (value) {
            this.newProfileColorText = value;
        },
        selectAll: function () {
            this.subscriptionList.forEach(channel => {
                channel.checked = true;
            });
        },
        selectNone: function () {
            this.subscriptionList.forEach((channel) => {
                channel.checked = false;
            });
        },
        defaultProfile: function () {
            if (editProfileView.profileName === settingsView.defaultProfile) {
                showToast('This profile is already set as your default.');
                return;
            }

            settingsDb.update({
                _id: 'defaultProfile'
            }, {
                value: editProfileView.profileName
            }, {}, function (err, numUpdated) {
                showToast(editProfileView.profileName + ' is now your default profile.');
                settingsView.defaultProfile = editProfileView.profileName;
            });
        },
        deleteProfile: function () {
            if (this.profileName === settingsView.defaultProfile) {
                showToast('You cannot delete your default profile.');
                return;
            }

            let confirmString = 'Are you sure you want to delete this profile?  Any subscriptions will also be deleted.';

            confirmFunction(confirmString, () => {
                settingsDb.find({
                    _id: 'profileList'
                }, (err, docs) => {
                    let profiles = docs[0].value;
                    let nameIndex = profiles.findIndex(x => x.name === this.profileName);

                    profiles.splice(nameIndex, 1);

                    settingsDb.update({
                        _id: 'profileList'
                    }, {
                        value: profiles
                    }, {}, function (err, numUpdated) {});

                    subDb.update({
                        profile: {
                            $elemMatch: {
                                value: editProfileView.profileName
                            }
                        },
                    }, {
                        $pull: {
                            profile: {
                                value: editProfileView.profileName
                            }
                        }
                    }, {
                        multi: true
                    }, (err, numRemoved) => {
                        if (err) {
                            ft.log(err);
                        }

                        let subMap = subscriptionView.fullVideoList.map(x => x.profile.map(x => x.value).indexOf(editProfileView.profileName) !== -1);

                        for (let i = 0; i < subMap.length; i++) {
                            if (subMap[i]) {
                                let subProfileIndex = subscriptionView.fullVideoList[i].profile.findIndex(x => x.value === editProfileView.profileName);
                                subscriptionView.fullVideoList[i].profile.splice(subProfileIndex, 1);
                            }
                        }

                        let profileIndex = profileSelectView.profileList.findIndex(x => x.name === editProfileView.profileName);
                        profileSelectView.profileList.splice(profileIndex, 1);

                        if (profileSelectView.activeProfile.name === this.profileName) {
                            profileSelectView.setActiveProfile(0);
                        }

                        hideViews();
                        subscriptionManagerView.seen = true;
                        showToast('Profile has been successfully deleted');
                    });
                });
            });
        },
        updateProfile: function (updateView = true) {
            if (this.newProfileName === '') {
                showToast('Profile name cannot be blank.');
                return;
            }

            let patt = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
            if (patt.test(this.newProfileColor)) {
                if (this.isNewProfile) {
                    let newNameIndex = this.profileList.findIndex(x => x.name === this.newProfileName);
                    if (newNameIndex !== -1 && this.profileName !== this.newProfileName) {
                        showToast('Profile name already exists.  Please choose a different profile name.');
                        return;
                    }
                    // Create new profile
                    settingsDb.find({
                        _id: 'profileList'
                    }, (err, docs) => {
                        let profiles = docs[0].value;
                        let newNameIndex = profiles.findIndex(x => x.name === this.newProfileName);
                        if (newNameIndex !== -1 && this.profileName !== this.newProfileName) {
                            showToast('Profile name already exists.  Please choose a different profile name.');
                            return;
                        } else {
                            let newProfile = {
                                name: this.newProfileName,
                                color: this.newProfileColor
                            };

                            profiles.push(newProfile);

                            settingsDb.update({
                                _id: 'profileList'
                            }, {
                                value: profiles
                            }, {}, function (err, numUpdated) {
                                profileSelectView.profileList.push(newProfile);
                                if (updateView) {
                                    hideViews();
                                    subscriptionManagerView.seen = true;
                                    showToast('The ' + newProfile.name + ' profile has been added!');
                                }
                            });
                        }
                    });
                } else {
                    // Update existing profile
                    settingsDb.find({
                        _id: 'profileList'
                    }, (err, docs) => {
                        let profiles = docs[0].value;
                        let newNameIndex = profiles.findIndex(x => x.name === this.newProfileName);
                        if (newNameIndex !== -1 && this.profileName !== this.newProfileName) {
                            showToast('Profile name already exists.  Please choose a different profile name.');
                            return;
                        } else {
                            let oldNameIndex = profiles.findIndex(x => x.name === this.profileName);
                            profiles[oldNameIndex].name = this.newProfileName;
                            profiles[oldNameIndex].color = this.newProfileColor;
                            settingsDb.update({
                                _id: 'profileList'
                            }, {
                                value: profiles
                            }, {}, function (err, numUpdated) {
                                if (editProfileView.profileName === settingsView.defaultProfile) {
                                    settingsDb.update({
                                        _id: 'defaultProfile',
                                    }, {
                                        $set: {
                                            value: editProfileView.newProfileName
                                        }
                                    }, (err, numRemoved) => {
                                        ft.log(numRemoved);
                                    });
                                }

                                subDb.update({
                                    profile: {
                                        $elemMatch: {
                                            value: editProfileView.profileName
                                        }
                                    },
                                }, {
                                    $push: {
                                        profile: {
                                            value: editProfileView.newProfileName
                                        }
                                    }
                                }, {
                                    multi: true
                                }, (err, numRemoved) => {
                                    if (err) {
                                        ft.log(err);
                                    }

                                    let profileIndex = profileSelectView.profileList.findIndex(x => x.name === editProfileView.profileName);

                                    profileSelectView.profileList[profileIndex].name = editProfileView.newProfileName;
                                    profileSelectView.profileList[profileIndex].color = editProfileView.newProfileColor;
                                    profileSelectView.setActiveProfile(profileIndex);

                                    let subMap = subscriptionView.fullVideoList.map(x => x.profile.map(x => x.value).indexOf(editProfileView.profileName) !== -1);

                                    for (let i = 0; i < subMap.length; i++) {
                                        if (subMap[i]) {
                                            let subProfileIndex = subscriptionView.fullVideoList[i].profile.findIndex(x => x.value === editProfileView.profileName);
                                            subscriptionView.fullVideoList[i].profile.splice(subProfileIndex, 1);
                                            subscriptionView.fullVideoList[i].profile.push(editProfileView.newProfileName);
                                        }
                                    }

                                    if (editProfileView.profileName !== editProfileView.newProfileName) {
                                        subDb.update({
                                            profile: {
                                                $elemMatch: {
                                                    value: editProfileView.profileName
                                                }
                                            },
                                        }, {
                                            $pull: {
                                                profile: {
                                                    value: editProfileView.profileName
                                                }
                                            }
                                        }, {
                                            multi: true
                                        }, (err, numRemoved) => {
                                            if (err) {
                                                ft.log(err);
                                            }
                                        });
                                    }

                                    editProfileView.profileName = editProfileView.newProfileName;
                                    editProfileView.profileColor = editProfileView.newProfileColor;
                                    window.setTimeout(() => {
                                        // Refresh the list of subscriptions on the side navigation bar and subscriptions view.
                                        displaySubs();
                                        addSubsToView(subscriptionView.fullVideoList);
                                        showToast('Profile has been successfully updated!');
                                    }, 100);
                                });
                            });
                        }
                    });
                }
            } else {
                showToast('The current HEX value is not valid, please fix and try again.');
            }
        },
        move: function () {
            if (this.amountSelected === 0) {
                showToast('A channel must be selected before it can be moved.');
                return;
            }
            if (this.selectedProfile === '') {
                showToast('A profile must be selected first before channels can be moved.');
                return;
            }
            if (this.selectedProfile === this.profileName) {
                showToast('Select a profile other than the one being edited.');
                return;
            }
            if (this.selectedProfile === 'All Channels') {
                showToast('There is no need to move channels to "All Channels".');
                return;
            }
            let confirmString = 'Would you like to move the selected channel(s) to the ' + this.selectedProfile + ' profile?';
            confirmFunction(confirmString, () => {
                let amountRemoved = 0;
                this.subscriptionList.forEach(channel => {
                    if (channel.checked) {
                        subDb.update({
                            channelId: channel.channelId,
                        }, {
                            $push: {
                                profile: {
                                    value: this.selectedProfile
                                }
                            }
                        }, (err, numRemoved) => {
                            if (err) {
                                ft.log(err);
                            }
                        });

                        channel.profile = this.selectedProfile;
                        amountRemoved++;

                        subDb.update({
                            channelId: channel.channelId,
                        }, {
                            $pull: {
                                profile: {
                                    value: this.profileName
                                }
                            }
                        }, (err, numRemoved) => {
                            if (err) {
                                ft.log(err);
                            }
                            let subMap = subscriptionView.fullVideoList.map(x => x.author === channel.channelName && x.profile.map(x => x.value).indexOf(this.profileName) !== -1);

                            for (let i = 0; i < subMap.length; i++) {
                                if (subMap[i] !== false) {
                                    subscriptionView.fullVideoList[i].profile.push({
                                        value: this.selectedProfile
                                    });
                                    let profileIndex = subscriptionView.fullVideoList[i].profile.findIndex(x => x.value === this.profileName);

                                    subscriptionView.fullVideoList[i].profile.splice(profileIndex, 1);
                                }
                            }

                            let index = this.subscriptionList.findIndex(x => x.channelName === channel.channelName);

                            this.subscriptionList.splice(index, 1);
                        });
                    }
                });
                window.setTimeout(() => {
                    // Refresh the list of subscriptions on the side navigation bar and subscriptions view.
                    displaySubs();
                    addSubsToView(subscriptionView.fullVideoList);
                    showToast('Moved ' + amountRemoved + ' channel(s) to the ' + this.selectedProfile + ' profile.');
                }, 500);
            });
        },
        copy: function () {
            if (this.amountSelected === 0) {
                showToast('A channel must be selected before it can be moved.');
                return;
            }
            if (this.selectedProfile === '') {
                showToast('A profile must be selected first before channels can be moved.');
                return;
            }
            if (this.selectedProfile === this.profileName) {
                showToast('Select a profile other than the one being edited.');
                return;
            }
            if (this.selectedProfile === 'All Channels') {
                showToast('There is no need to copy channels to "All Channels".');
                return;
            }
            let confirmString = 'Would you like to copy the selected channel(s) to the ' + this.selectedProfile + ' profile?';
            confirmFunction(confirmString, () => {
                let amountCopied = 0;
                this.subscriptionList.forEach(channel => {
                    if (channel.checked) {
                        subDb.find({
                            channelId: channel.channelId,
                            profile: {
                                $elemMatch: {
                                    value: this.selectedProfile
                                }
                            }
                        }, {}, (err, subs) => {
                            if (subs.length === 0) {
                                channel.profile.push(this.selectedProfile);
                                subDb.update({
                                    channelId: channel.channelId,
                                }, {
                                    $push: {
                                        profile: {
                                            value: this.selectedProfile
                                        }
                                    }
                                }, (err, numAdded) => {
                                    if (err) {
                                        ft.log(err);
                                    }
                                    let subMap = subscriptionView.fullVideoList.map(x => x.author === channel.channelName);

                                    for (let i = 0; i < subMap.length; i++) {
                                        if (subMap[i] !== false) {
                                            subscriptionView.fullVideoList[i].profile.push({
                                                value: this.selectedProfile
                                            });
                                        }
                                    }
                                    amountCopied++;
                                });
                            }
                        });
                    }
                });
                window.setTimeout(() => {
                    // Refresh the list of subscriptions on the side navigation bar and subscriptions view.
                    displaySubs();
                    addSubsToView(subscriptionView.fullVideoList);
                    showToast('Copied ' + amountCopied + ' channel(s) to the ' + this.selectedProfile + ' profile.');
                }, 500);
            });
        },
        deleteChannel: function () {
            let confirmString = 'Are you sure you want to delete the selected channel(s) from this profile?';
            let amountDeleted = 0;

            if (this.amountSelected === 0) {
                showToast('A channel must be selected before it can be deleted.');
                return;
            }

            confirmFunction(confirmString, () => {
                this.subscriptionList.forEach((channel, index) => {
                    ft.log(channel);
                    if (channel.checked) {
                        removeSubscription(channel.channelId, editProfileView.profileName, false);


                        let subViewListMap = subscriptionView.fullVideoList.map(x => x.author === channel.channelName);

                        for (let i = 0; i < subViewListMap.length; i++) {
                            if (subViewListMap[i]) {
                                let subProfileIndex = subscriptionView.fullVideoList[i].profile.findIndex(x => x.value === editProfileView.profileName);
                                subscriptionView.fullVideoList[i].profile.splice(subProfileIndex, 1);
                            }
                        }

                        amountDeleted++;
                    }

                });
                window.setTimeout(() => {
                    // Refresh the list of subscriptions on the side navigation bar and subscriptions view.
                    displaySubs();
                    addSubsToView(subscriptionView.fullVideoList);
                    showToast(amountDeleted + ' channel(s) have been deleted from this profile.');
                    this.subscriptionList = this.subscriptionList.filter(a => {
                        return !a.checked;
                    });
                }, 500);
            });
        },
    },
    computed: {
        newProfileColor: function () {
            if (this.newProfileColorText[0] === '#') {
                return this.newProfileColorText;
            } else {
                return '#' + this.newProfileColorText;
            }
        },
        isDefaultProfile: function () {
            return settingsView.defaultProfile === this.profileName;
        },
        profileList: function () {
            return profileSelectView.profileList;
        },
        amountSelected: function () {
            let amount = 0;
            this.subscriptionList.forEach((item) => {
                if (item.checked) {
                    amount++;
                }
            });
            return amount;
        }
    },
    template: editProfileViewTemplate
});

function hideViews() {
    if (playerView.seen !== false && (playerView.playerSeen || playerView.legacySeen)) {
        let lengthSeconds = 0;
        let duration = 0;

        if (playerView.legacySeen === false) {
            lengthSeconds = player.currentTime;
            duration = player.duration;
        } else {
            lengthSeconds = $('.videoPlayer').get(0).currentTime;
            duration = $('.videoPlayer').get(0).duration;
        }

        updateWatchProgress(playerView.videoId, lengthSeconds);

        let videoIndex = subscriptionView.videoList.findIndex(x => x.id === playerView.videoId);

        if (videoIndex !== -1) {
            subscriptionView.videoList[videoIndex].watched = true;
            subscriptionView.videoList[videoIndex].progressPercentage = (lengthSeconds / duration) * 100;
        }
    }

    subscriptionView.seen = false;
    noSubscriptions.seen = false;
    aboutView.seen = false;
    headerView.seen = false;
    searchView.seen = false;
    searchSuggestionsView.seen = false;
    settingsView.seen = false;
    popularView.seen = false;
    trendingView.seen = false;
    savedView.seen = false;
    historyView.seen = false;
    playlistView.seen = false;
    playerView.seen = false;
    channelView.seen = false;
    channelVideosView.seen = false;
    channelPlaylistsView.seen = false;
    channelSearchView.seen = false;
    profileSelectView.seen = false;
    subscriptionManagerView.seen = false;
    editProfileView.seen = false;
    backButtonView.lastView = false;
}
