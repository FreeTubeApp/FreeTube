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

import Vue from './js/vue.js';

const mainHeaderTemplate = require('./templates/mainHeader.html');
const aboutTemplate = require('./templates/about.html');
const settingsTemplate = require('./templates/settings.html');
const videoListTemplate = require('./templates/videoTemplate.html');
const playerTemplate = require('./templates/player.html');
const channelTemplate = require('./templates/channelView.html');
const progressViewTemplate = require('./templates/progressView.html');

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

let noSubscriptions = new Vue({
  el: '#noSubscriptions',
  data: {
    seen: false
  }
});

let sideNavBar = new Vue({
  el: '#sideNav',
  methods: {
    subscriptions: (event) => {
      hideViews();
      if(subscriptionView.videoList.length === 0){
        loadingView.seen = true;
      }
      headerView.seen = true;
      headerView.title = 'Latest Subscriptions';
      subscriptionView.seen = true;
      loadSubscriptions();
    },
    popular: (event) => {
      hideViews();
      if (loadingView.seen !== false){
        loadingView.seen = false;
      }
      if(popularView.videoList.length === 0){
        loadingView.seen = true;
      }
      headerView.seen = true;
      headerView.title = 'Most Popular';
      popularView.seen = true;
      showMostPopular();
    },
    trending: (event) => {
      hideViews();
      if (loadingView.seen !== false){
        loadingView.seen = false;
      }
      if(trendingView.videoList.length === 0){
        loadingView.seen = true;
      }
      headerView.seen = true;
      headerView.title = 'Trending';
      trendingView.seen = true;
      showTrending();
    },
    saved: (event) => {
      hideViews();
      if (loadingView.seen !== false){
        loadingView.seen = false;
      }
      if(savedView.videoList.length === 0){
        loadingView.seen = true;
      }
      headerView.seen = true;
      headerView.title = 'Favorited Videos';
      savedView.seen = true;
      showSavedVideos();
    },
    history: (event) => {
      hideViews();
      if (loadingView.seen !== false){
        loadingView.seen = false;
      }
      if(historyView.videoList.length === 0){
        loadingView.seen = true;
      }
      headerView.seen = true;
      headerView.title = 'Video History';
      historyView.seen = true;
      showHistory();
    },
    settings: (event) => {
      hideViews();
      if (loadingView.seen !== false){
        loadingView.seen = false;
      }
      settingsView.seen = true;
      updateSettingsView();
    },
    about: (event) => {
      hideViews();
      if (loadingView.seen !== false){
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

let subscriptionView = new Vue({
  el: '#subscriptionView',
  data: {
    seen: true,
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
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
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
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
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
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
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
      addSavedVideo(videoId);
    },
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
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
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
    }
  },
  template: videoListTemplate
});

let aboutView = new Vue({
  el: '#aboutView',
  data: {
    seen: false,
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
    subtitles: false,
    updates: true,
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
    },
    channel: (channelId) => {
      goToChannel(channelId);
    },
    toggleSave: (videoId) => {
      addSavedVideo(videoId);
    },
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
    },
    nextPage: () => {
      console.log(searchView.page);
      search(searchView.page);
    }
  },
  template: videoListTemplate
});

let channelView = new Vue({
  el: '#channelView',
  data: {
    seen: false,
    id: '',
    name: '',
    icon: '',
    baner: '',
    subCount: '',
    subButtonText: '',
    description: ''
  },
  methods: {
    subscription: (channelId) => {
      toggleSubscription(channelId);
    },
  },
  template: channelTemplate
});

let channelVideosView = new Vue({
  el: '#channelVideosView',
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
    toggleSave: (videoId) => {
      addSavedVideo(videoId);
    },
    nextPage: () => {
      channelNextPage();
    },
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
    },
  },
  template: videoListTemplate
});

let playerView = new Vue({
  el: '#playerView',
  data: {
    seen: false,
    publishedDate: '',
    videoUrl: '',
    videoId: '',
    channelId: '',
    channelIcon: '',
    channelName: '',
    subscribedText: '',
    savedText: '',
    savedIconType: 'far',
    description: '',
    videoThumbnail: '',
    subtitleHtml: '',
    currentQuality: '',
    video480p: '',
    video720p: '',
    embededHtml: '',
    currentSpeed: 1,
    videoTitle: '',
    videoViews: '',
    likePercentage: 0,
    videoLikes: 0,
    videoDislikes: 0,
    playerSeen: true,
    recommendedVideoList: []
  },
  methods: {
    channel: (channelId) => {
      goToChannel(channelId);
    },
    subscription: (videoId) => {
      toggleSubscription(videoId);
    },
    quality: (url, qualityText) => {
      console.log(url);
      console.log(qualityText);
      if(playerView.playerSeen === true){
        // Update time to new url
        const currentPlayBackTime = $('.videoPlayer').get(0).currentTime;
        console.log(currentPlayBackTime);
        playerView.videoUrl = url;
        playerView.currentQuality = qualityText;
        setTimeout(() => {$('.videoPlayer').get(0).currentTime = currentPlayBackTime;}, 100);
      }
      else{
        playerView.playerSeen = true;
        playerView.videoUrl = url;
        playerView.currentQuality = qualityText;
      }
    },
    embededPlayer: () => {
      playerView.playerSeen = false;
      playerView.currentQuality = 'EMBED';
    },
    copy: (site, videoId) => {
      const url = 'https://' + site + '/watch?v=' + videoId;
      clipboard.writeText(url);
      showToast('URL has been copied to the clipboard');
    },
    save: (videoId) => {
      toggleSavedVideo(videoId);
    },
    play: (videoId) => {
      loadingView.seen = true;
      playVideo(videoId);
    },
    loop: () => {
      let player = document.getElementById('videoPlayer');

      if (player.loop === false) {
        player.loop = true;
        showToast('Video loop has been turned on.');
      }
      else{
        player.loop = false;
        showToast('Video loop has been turned off.')
      }
    }
  },
  template: playerTemplate
});

function hideViews(){
  subscriptionView.seen = false;
  noSubscriptions.seen = false;
  aboutView.seen = false;
  headerView.seen = false;
  searchView.seen = false;
  settingsView.seen = false;
  popularView.seen = false;
  trendingView.seen = false;
  savedView.seen = false;
  historyView.seen = false;
  playerView.seen = false;
  channelView.seen = false;
  channelVideosView.seen = false;
}
