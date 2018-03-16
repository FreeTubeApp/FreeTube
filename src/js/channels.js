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

/*function getChannelThumbnail(channelId, callback) {
  let url = '';

  youtubeAPI('channels', {
    'id': channelId,
    'part': 'snippet',
  }, function (data){
    callback(data.items[0].snippet.thumbnails.high.url);
  });
}*/

/**
* Display a channel page, showing latest uploads.
*
* @param {string} channelId - The channel ID to display.
*
* @return {Void}
*/
function goToChannel(channelId) {
  event.stopPropagation();
  clearMainContainer();
  startLoadingAnimation();

  let subButtonText;
  // Setting subButtonText here as Mustache templates are logic-less.
  isSubscribed(channelId).then((subscribed) => {
    subButtonText = (subscribed ? "UNSUBSCRIBE" : "SUBSCRIBE");
  });

  // Grab general channel information
  youtubeAPI('channels', {
    part: 'snippet,brandingSettings,statistics',
    id: channelId,
  }, function (data){
    const channelData = data.items[0];

    const channelViewTemplate = require('./templates/channelView.html');
    mustache.parse(channelViewTemplate);
    const rendered = mustache.render(channelViewTemplate, {
      channelId: channelId,
      channelName:   channelData.brandingSettings.channel.title,
      channelBanner: channelData.brandingSettings.image.bannerImageUrl,
      channelImage:  channelData.snippet.thumbnails.high.url,
      subCount: channelData.statistics.subscriberCount.toLocaleString(), //toLocaleString adds commas as thousands separators
      channelDescription: autolinker.link(channelData.brandingSettings.channel.description), //autolinker makes URLs clickable
      subButtonText: subButtonText,
    });
    $('#main').html(rendered);
    stopLoadingAnimation();

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
        videoList.items.forEach((video) => {
          displayVideo(video);
        });
      });
    });
  });
}
