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
* View a channel page, displaying recent uplaods.
*
* @param {string} channelId - The channel ID to go to.
*
* @return {Void}
*/
function goToChannel(channelId) {
  event.stopPropagation();
  clearMainContainer();
  startLoadingAnimation();


  // Check if the user is subscribed to the channel.  Display different text based on the information
  let subscribeText = '';
  const checkSubscription = isSubscribed(channelId);

  checkSubscription.then((results) => {
    if(results === false){
      subscribeText = 'SUBSCRIBE';
    }
    else{
      subscribeText = 'UNSUBSCRIBE';
    }
  });

  // Call YouTube API to grab channel information
  youtubeAPI('channels', {
    part: 'snippet, brandingSettings, statistics',
    id: channelId,
  }, function (data){
    // Set variables of extracted information
    const brandingSettings = data['items'][0]['brandingSettings'];
    const statistics = data['items'][0]['statistics'];
    const snippet = data['items'][0]['snippet'];
    const channelName = brandingSettings['channel']['title'];
    const channelBanner = brandingSettings['image']['bannerImageUrl'];
    const channelImage = snippet['thumbnails']['high']['url'];

    // Channels normally have links in their channel description. This makes them clickable.
    const channelDescription = autolinker.link(brandingSettings['channel']['description']);

    // Add commas to sub count to make them more readable.
    let subCount = statistics['subscriberCount'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Grab the channelView.html template and fill it in with the above variables.
    $.get('templates/channelView.html', (template) => {
      mustache.parse(template);
      const rendered = mustache.render(template, {
        channelName: channelName,
        channelImage: channelImage,
        channelBanner: channelBanner,
        channelId: channelId,
        subCount: subCount,
        channelDescription: channelDescription,
        isSubscribed: subscribeText,
      });
      // Render the template on to #main
      $('#main').html(rendered);
      stopLoadingAnimation();
    });

    // Grab the channel's latest upload.  API forces a max of 50.
	youtubeAPI('search', {
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      maxResults: 50,
      order: 'date',
    }, function (data) {
      // Display recent uploads to #main
      data['items'].forEach((video) => {
        displayVideos(video);
      });
    });
  });
}
