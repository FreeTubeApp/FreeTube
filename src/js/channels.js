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

  headerView.title = 'Latest Uploads';
  hideViews();
  loadingView.seen = true;

  // Setting subButtonText here as Mustache templates are logic-less.
  isSubscribed(channelId).then((subscribed) => {
    channelView.subButtonText = (subscribed ? "UNSUBSCRIBE" : "SUBSCRIBE");
  });

  // Grab general channel information
  youtubeAPI('channels', {
    part: 'snippet,brandingSettings,statistics',
    id: channelId,
  }, (data) => {
    const channelData = data.items[0];

    channelView.id = channelId;
    channelView.name = channelData.brandingSettings.channel.title;
    channelView.banner = channelData.brandingSettings.image.bannerImageUrl;
    channelView.icon = channelData.snippet.thumbnails.high.url;
    channelView.subCount = channelData.statistics.subscriberCount.toLocaleString(); //toLocaleString adds commas as thousands separators
    channelView.description = autolinker.link(channelData.brandingSettings.channel.description); //autolinker makes URLs clickable


    // Grab the channel's latest uploads. API forces a max of 50.
    youtubeAPI('search', {
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      maxResults: 50,
      order: 'date',
    }, function (data) {
      // Display recent uploads to #main
      let grabDuration = getDuration(data.items);

      grabDuration.then((videoList) => {
        channelView.seen = true;
        channelVideosView.videoList = [];
        channelVideosView.seen = true;
        loadingView.seen = false;
        videoList.items.forEach((video) => {
          displayVideo(video, 'channel');
        });
      });
    });
  });
}
