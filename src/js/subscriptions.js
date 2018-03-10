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
* File for all functions related to subscriptions.
*/

/**
* Add a channel to the user's subscription database.
*
* @param {string} channelId - The channel ID to add to the subscriptions database.
*
* @return {Void}
*/
function addSubscription(channelId, useToast = true) {
  console.log(channelId);
  // Request YouTube API
  youtubeAPI('channels', {
    part: 'snippet',
    id: channelId,
  }, function (data){
    const channelInfo = data['items'][0]['snippet'];
    const channelName = channelInfo['title'];
    const thumbnail = channelInfo['thumbnails']['high']['url'];

    const channel = {
      channelId: channelId,
      channelName: channelName,
      channelThumbnail: thumbnail,
    };

    // Refresh the list of subscriptions on the side navigation bar.
    subDb.insert(channel, (err, newDoc) => {
      if (useToast){
        showToast('Added ' + channelName + ' to subscriptions.');
        displaySubs();
      }
    });
  });
}

/**
* Remove a channel from the subscriptions database.
*
* @param {string} channelId - The channel ID to be removed.
*
* @return {Void}
*/
function removeSubscription(channelId) {
  subDb.remove({
    channelId: channelId
  }, {}, (err, numRemoved) => {
    // Refresh the list of subscriptions on the side navigation bar.
    displaySubs();
    showToast('Removed channel from subscriptions.');
  });
}

/**
* Load the recent uploads of the user's subscriptions.
*
* @return {Void}
*/
function loadSubscriptions() {
  clearMainContainer();
  const loading = document.getElementById('loading');

  startLoadingAnimation()

  let videoList = [];

  const subscriptions = returnSubscriptions();

  // Welcome to callback hell, we hope you enjoy your stay.
  subscriptions.then((results) => {

    // Yes, This function is the thing that needs to most improvment
    if (results.length > 0) {
      showToast('Getting Subscriptions.  This may take a while...');

      /*
      * If this loop gets rewritten, we can remove the asyncLoop dependency from the project.
      *
      * I wasn't able to figure out a way to loop through the list of channels and grab the recent uploads
      * while then sorting them afterwards, this was my best solution at the time.  I'm sure someone more
      * experienced in Node can help out with this.
      */
      asyncLoop(results, (sub, next) => {
        const channelId = sub['channelId'];

        /*
        * Grab the channels 15 most recent uploads.  Typically this should be enough.
        * This number can be changed if we feel necessary.
        */
        youtubeAPI('search', {
          part: 'snippet', // Try getting content details for video duration in the near future.
          channelId: channelId,
          type: 'video',
          maxResults: 15,
          order: 'date',
        }, function (data){
          videoList = videoList.concat(data['items']);
          // Iterate through the next object in the loop.
          next();
        });
      }, (err) => {
        // Sort the videos by date
        videoList.sort((a, b) => {
          const date1 = Date.parse(a.snippet.publishedAt);
          const date2 = Date.parse(b.snippet.publishedAt);

          return date2.valueOf() - date1.valueOf();
        });

        // Render the videos to the application.
        createVideoListContainer('Latest Subscriptions:');

        // The YouTube website limits the subscriptions to 100 before grabbing more so we only show 100
        // to keep the app running at a good speed.
        if(videoList.length < 100){
          videoList.forEach((video) => {
            console.log('Getting all videos');
            displayVideos(video);
          });
        }
        else{
          console.log('Getting top 100 videos');
          for(let i = 0; i < 100; i++){
            displayVideos(videoList[i]);
          }
        }
        stopLoadingAnimation()
      });
    } else {
      // User has no subscriptions. Display message.
      const container = document.getElementById('main');
      stopLoadingAnimation()

      container.innerHTML = `<h2 class="message">Your Subscription list is currently empty.  Start adding subscriptions
                             to see them here.<br /><br /><i class="far fa-frown" style="font-size: 200px"></i></h2>`;
    }
  });
}

/**
* Get the list of subscriptions from the user's subscription database.
*
* @return {promise} The list of subscriptions.
*/
function returnSubscriptions() {
  return new Promise((resolve, reject) => {
    subDb.find({}, (err, subs) => {
      resolve(subs);
    });
  });
}

/**
* Display the list of subscriptions on the side navigation bar.
*
* @return {Void}
*/
function displaySubs() {
  const subList = document.getElementById('subscriptions');

  subList.innerHTML = '';

  // Sort alphabetically
  subDb.find({}).sort({
    channelName: 1
  }).exec((err, subs) => {
    subs.forEach((channel) => {
      // Grab subscriptions.html to be used as a template.
      const subsTemplate = require('./templates/subscriptions.html')
      mustache.parse(subsTemplate);
      const rendered = mustache.render(subsTemplate, {
        channelIcon: channel['channelThumbnail'],
        channelName: channel['channelName'],
        channelId: channel['channelId'],
      });
      // Render template to page.
      const subscriptionsHtml = $('#subscriptions').html();
      $('#subscriptions').html(subscriptionsHtml + rendered);
    });
  });

  // Add onclick function
  $('#subscriptions .fa-times').onClick = removeSubscription;
}

/**
* Adds / Removes a subscription based on if the channel is in the database or not.
* @param {string} channelId - The channel ID to check
*
* @return {Void}
*/
function toggleSubscription(channelId) {
  event.stopPropagation();

  const checkIfSubscribed = isSubscribed(channelId);
  const subscribeButton = document.getElementById('subscribeButton');

  checkIfSubscribed.then((results) => {

    if (results === false) {
      if(subscribeButton != null){
        subscribeButton.innerHTML = 'UNSUBSCRIBE';
      }
      addSubscription(channelId);
    } else {
      if(subscribeButton != null){
        subscribeButton.innerHTML = 'SUBSCRIBE';
      }
      removeSubscription(channelId);
    }
  });
}

/**
* Check if the user is subscribed to a channel or not.
*
* @param {string} channelId - The channel ID to check
*
* @return {promise} - A boolean value if the channel is currently subscribed or not.
*/
function isSubscribed(channelId) {
  return new Promise((resolve, reject) => {
    subDb.find({channelId: channelId}, (err, docs) => {
      if (jQuery.isEmptyObject(docs)) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
