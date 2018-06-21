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
const videoListTemplate = require('./templates/videoTemplate.html');
const nextPageTemplate = require('./templates/searchNextPage.html');

let sideNavBar = new Vue({
  el: '#sideNav',
  methods: {
    about: (event) => {
      hideViews();
      aboutView.seen = true;
    },
    subscriptions: (event) => {
      hideViews();
      headerView.seen = true;
      headerView.title = 'Latest Subscriptions';
      subscriptionView.seen = true;
      loadSubscriptions();
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
      playVideo(videoId);
    },
    channel: (channelId) => {
      goToChannel(channelId)
    }
  },
  template: videoListTemplate
});

let searchView = new Vue({
  el: '#searchView',
  data: {
    seen: false,
    isSearch: true,
    nextPageToken: '',
    videoList: []
  },
  methods: {
    play: (videoId) => {
      playVideo(videoId);
    },
    channel: (channelId) => {
      goToChannel(channelId)
    },
    nextPage: (nextPageToken) => {
      console.log(searchView.nextPageToken);
      search(searchView.nextPageToken);
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

function hideViews(){
  subscriptionView.seen = false;
  aboutView.seen = false;
  headerView.seen = false;
  searchView.seen = false;
}
