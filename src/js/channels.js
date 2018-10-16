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
  channelView.page = 2;

  headerView.title = 'Latest Uploads';
  hideViews();
  loadingView.seen = true;

  // Setting subButtonText here as Mustache templates are logic-less.
  isSubscribed(channelId).then((subscribed) => {
    channelView.subButtonText = (subscribed ? "UNSUBSCRIBE" : "SUBSCRIBE");
  });

  invidiousAPI('channels', channelId, {}, (data) => {
    console.log(data);

    channelView.id = channelId;
    channelView.name = data.author;
    channelView.banner = data.authorBanners[0].url;
    channelView.icon = data.authorThumbnails[3].url
    channelView.subCount = data.subCount.toLocaleString(); //toLocaleString adds commas as thousands separators
    channelView.description = autolinker.link(data.description); //autolinker makes URLs clickable

    channelVideosView.videoList = [];

    if (subscriptionView.seen === false && aboutView.seen === false && headerView.seen === false && searchView.seen === false && settingsView.seen === false && popularView.seen === false && savedView.seen === false && historyView.seen === false) {
      channelVideosView.seen = true;
      channelView.seen = true;
    }
    else{
      return;
    }

    loadingView.seen = false;
    data.latestVideos.forEach((video) => {
      displayVideo(video, 'channel');
    });
  });
}

function channelNextPage() {
  showToast('Fetching results, please wait...');

  invidiousAPI('channels/videos', channelView.channelId, {'page': channelView.page}, (data) => {
    console.log(data);
    data.forEach((video) => {
      displayVideo(video, 'channel');
    });
  });

  channelView.page = channelView.page + 1;
}
