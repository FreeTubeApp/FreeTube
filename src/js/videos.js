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
* File for functions related to videos.
* TODO: Split some of these functions into their own file.
*/

/**
* Perform a search using the YouTube API. The search query is grabbed from the #search element.
*
* @param {string} nextPageToken - Optional: The page token to be inlcuded in the search.
*
* @return {Void}
*/
function search(nextPageToken = '') {
  const query = document.getElementById('search').value;

  if (query === '') {
    showToast('Search Field empty.  Please input a search term.');
    return;
  }

  if (nextPageToken === '') {
    clearMainContainer();
    toggleLoading();
  } else {
    console.log(nextPageToken);
    showToast('Fetching results.  Please wait...');
  }

  // Start API request
  let request = gapi.client.youtube.search.list({
    q: query,
    part: 'id, snippet',
    type: 'video',
    pageToken: nextPageToken,
    maxResults: 25,
  });

  // Execute API Request
  request.execute((response) => {
    console.log(response);
    if (nextPageToken === '') {
      createVideoListContainer('Search Results:');
      toggleLoading();
    }
    response['items'].forEach(displayVideos);
    addNextPage(response['result']['nextPageToken']);
  });
}

/**
* Display a video on the page.  Function is typically contained in a loop.
*
* @param {string} video - The video ID of the video to be displayed.
* @param {string} listType - Optional: Specifies the list type of the video
*                            Used for displaying the remove icon for history and saved videos.
*
* @return {Void}
*/
function displayVideos(video, listType = null) {
  // Grab the search template for the video.
  $.get('templates/videoList.html', (template) => {

    const videoSnippet = video['snippet']

    // Grab the published date for the video and convert to a user readable state.
    const dateString = new Date(videoSnippet['publishedAt']);
    const publishedDate = dateFormat(dateString, "mmm dS, yyyy");
    let deleteHtml = '';
    let liveText = '';
    let videoId = video['id']['videoId'];

    const searchMenu = $('#videoListContainer').html();

    // Include a remove icon in the list if the application is displaying the history list or saved videos.
    if (listType === 'saved') {
      videoId = video['id'];
      deleteHtml = '<i onclick="removeSavedVideo(\'' + videoId + '\'); showSavedVideos();" class="videoDelete fas fa-times"></i>';
    } else if (listType === 'history') {
      videoId = video['id'];
      deleteHtml = '<i onclick="removeFromHistory(\'' + videoId + '\'); showHistory()" class="videoDelete fas fa-times"></i>';
    }

    // Includes text if the video is live.
    if (videoSnippet['liveBroadcastContent'] === 'live') {
      liveText = 'LIVE NOW';
    }

    // Render / Manipulate the template.  Replace variables with data from the video.
    mustache.parse(template);
    const rendered = mustache.render(template, {
      videoThumbnail: videoSnippet['thumbnails']['medium']['url'],
      videoTitle: videoSnippet['title'],
      channelName: videoSnippet['channelTitle'],
      videoDescription: videoSnippet['description'],
      publishedDate: publishedDate,
      liveText: liveText,
      videoId: videoId,
      channelId: videoSnippet['channelId'],
      deleteHtml: deleteHtml,
    });
    // Apply the render to the page
    let nextButton = document.getElementById('getNextPage');
    if (nextButton === null) {
      $('#videoListContainer').append(rendered);
    } else {
      $(rendered).insertBefore('#getNextPage');
    }
  });
}

/**
* Changes the page token to the next page button during a video search.
*
* @param {string} nextPageToken - The page token to replace the button function.
*
* @return {Void}
*/
function addNextPage(nextPageToken) {
  let oldFetchButton = document.getElementById('getNextPage');

  // Creates the element if it doesn't exist.
  if (oldFetchButton === null) {
    let fetchButton = document.createElement('div');
    fetchButton.id = 'getNextPage';
    fetchButton.innerHTML = '<i class="fas fa-search"></i> Fetch more results...';

    $('#videoListContainer').append(fetchButton);
  }

  // Update the on click method of the button.
  $(document).off('click', '#getNextPage');
  $(document).on('click', '#getNextPage', (event) => {
    search(nextPageToken);
  });
}

/**
* Display the video player and play a video
*
* @param {string} videoId - The video ID of the video to be played.
*
* @return {Void}
*/
function playVideo(videoId) {
  clearMainContainer();
  toggleLoading();

  let subscribeText = '';
  let savedText = '';
  let savedIconClass = '';
  let savedIconColor = '';
  let video480p;
  let video720p;
  let defaultUrl;
  let defaultQuality;
  let videoHtml;
  let videoThumbnail;
  let videoType = 'video';
  let embedPlayer;
  let validUrl;

  // Grab the embeded player. Used as fallback if the video URL cannot be found.
  try {
    let getEmbedFunction = getEmbedPlayer(videoId);

    getEmbedFunction.then((url) => {
      embedPlayer = url;
    });
  } catch (ex) {
    showToast('Video not found. ID may be invalid.');
    toggleLoading();
    return;
  }

  /*
  * FreeTube calls the HookTube API so that it can get the direct video URL instead of the embeded player.
  * If anyone knows how to grab these files without relying on their API it would be very welcome.
  * It helps that HookTube returns mostly the same information as a YouTube API call so performance
  * shouldn't be hindered by this.
  */
  const url = 'https://hooktube.com/api?mode=video&id=' + videoId;
  $.getJSON(url, (response) => {
    console.log(response);

    const videoSummary = response['json_1'];
    const videoSnippet = response['json_2']['items'][0]['snippet'];
    const videoStatistics = response['json_2']['items'][0]['statistics'];

    // Sometimes the max resolution URL isn't found.  Grab the default one as a fallback.
    try {
      videoThumbnail = videoSnippet['thumbnails']['maxres']['url'];
    } catch (e) {
      videoThumbnail = videoSnippet['thumbnails']['default']['url'];
    }

    // Search through the returned object to get the 480p and 720p video URLs (If available)
    Object.keys(videoSummary['link']).forEach((key) => {
      console.log(key);
      switch (videoSummary['link'][key][2]) {
        case 'medium':
          video480p = videoSummary['link'][key][0];
          break;
        case 'hd720':
          video720p = videoSummary['link'][key][0];
          break;
      }
    });

    // Default to the embeded player if the URLs cannot be found.
    if (typeof(video720p) === 'undefined' && typeof(video480p) === 'undefined') {
      defaultQuality = 'EMBED';
      videoHtml = embedPlayer.replace(/\&quot\;/g, '"');
      showToast('Unable to get video file.  Reverting to embeded player.');
    } else if (typeof(video720p) === 'undefined' && typeof(video480p) !== 'undefined') {
      // Default to the 480p video if the 720p URL cannot be found.
      videoHtml = '<video class="videoPlayer" onmousemove="hideMouseTimeout()" onmouseleave="removeMouseTimeout()" controls="" src="' + video480p + '" poster="' + videoThumbnail + '" autoplay></video>';
      defaultQuality = '480p';
    } else {
      // Default to the 720p video.
      videoHtml = '<video class="videoPlayer" onmousemove="hideMouseTimeout()" onmouseleave="removeMouseTimeout()" controls="" src="' + video720p + '" poster="' + videoThumbnail + '" autoplay></video>';
      defaultQuality = '720p';
      // Force the embeded player if needed.
      //videoHtml = embedPlayer;
    }

    // Add commas to the video view count.
    const videoViews = videoSummary['view_count'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Format the date to a more readable format.
    const dateString = videoSnippet['publishedAt'];
    const publishedDate = dateFormat(dateString, "mmm dS, yyyy");
    const channelId = videoSnippet['channelId'];
    let description = videoSnippet['description'];

    const checkSubscription = isSubscribed(channelId);

    // Change the subscribe button text depending on if the user has subscribed to the channel or not.
    checkSubscription.then((results) => {
      if (results === false) {
        subscribeText = 'SUBSCRIBE';
      } else {
        subscribeText = 'UNSUBSCRIBE';
      }
    });

    const checkSavedVideo = videoIsSaved(videoId);

    // Change the save button icon and text depending on if the user has saved the video or not.
    checkSavedVideo.then((results) => {
      if (results === false) {
        savedText = 'SAVE';
        savedIconClass = 'far unsaved';
      } else {
        savedText = 'SAVED';
        savedIconClass = 'fas saved';
      }
    });

    // Figure out the width for the like/dislike bar.
    const videoLikes = parseInt(videoStatistics['likeCount']);
    const videoDislikes = parseInt(videoStatistics['dislikeCount']);
    const totalLikes = videoLikes + videoDislikes;
    const likePercentage = parseInt((videoLikes / totalLikes) * 100);

    // Adds clickable links to the description.
    description = autolinker.link(description);

    // API Request
    let request = gapi.client.youtube.channels.list({
      'id': channelId,
      'part': 'snippet,contentDetails,statistics'
    });

    // Execute request
    request.execute((response) => {
      console.log(response);
      const channelThumbnail = response['items'][0]['snippet']['thumbnails']['high']['url'];

      $.get('templates/player.html', (template) => {
        mustache.parse(template);
        const rendered = mustache.render(template, {
          videoHtml: videoHtml,
          videoQuality: defaultQuality,
          videoTitle: videoSummary['title'],
          videoViews: videoViews,
          videoThumbnail: videoThumbnail,
          channelName: videoSummary['author'],
          videoLikes: videoLikes,
          videoDislikes: videoDislikes,
          likePercentage: likePercentage,
          videoId: videoId,
          channelId: channelId,
          channelIcon: channelThumbnail,
          publishedDate: publishedDate,
          description: description,
          isSubscribed: subscribeText,
          savedText: savedText,
          savedIconClass: savedIconClass,
          savedIconColor: savedIconColor,
          video480p: video480p,
          video720p: video720p,
          embedPlayer: embedPlayer,
        });
        $('#main').html(rendered);
        toggleLoading();
        showVideoRecommendations(videoId);
        console.log('done');
      });
    });
    // Sometimes a video URL is found, but the video will not play.  I believe the issue is
    // that the video has yet to render for that quality, as the video will be available at a later time.
    // This will check the URLs and switch video sources if there is an error.
    checkVideoUrls(video480p, video720p);
    // Add the video to the user's history
    addToHistory(videoId);
  });
}

/**
* Grab the video recommendations for a video.  This does not get recommendations based on what you watch,
* as that would defeat the main purpose of using FreeTube.  At any time you can check the video on HookTube
* and compare the recommendations there.  They should be nearly identical.
*
* @param {string} videoId - The video ID of the video to get recommendations from.
*/
function showVideoRecommendations(videoId) {
  let request = gapi.client.youtube.search.list({
    part: 'snippet',
    type: 'video',
    relatedToVideoId: videoId,
    maxResults: 15,
  });

  request.execute((response) => {
    const recommendations = response['items'];
    recommendations.forEach((data) => {
      const snippet = data['snippet'];
      const videoId = data['id']['videoId'];
      const videoTitle = snippet['title'];
      const channelName = snippet['channelTitle'];
      const videoThumbnail = snippet['thumbnails']['medium']['url'];
      const dateString = snippet['publishedAt'];
      const publishedDate = dateFormat(dateString, "mmm dS, yyyy");

      $.get('templates/recommendations.html', (template) => {
        mustache.parse(template);
        const rendered = mustache.render(template, {
          videoId: videoId,
          videoTitle: videoTitle,
          channelName: channelName,
          videoThumbnail: videoThumbnail,
          publishedDate: publishedDate,
        });
        const recommendationHtml = $('#recommendations').html();
        $('#recommendations').html(recommendationHtml + rendered);
      });
    });
  });
}

/**
* Open up the mini player to watch the video outside of the main application.
*
* @param {string} videoThumbnail - The URL of the video thumbnail.  Used to prevent another API call.
*
* @return {Void}
*/
function openMiniPlayer(videoThumbnail) {
  let lastTime;
  let videoHtml;

  // Grabs whatever the HTML is for the current video player.  Done this way to grab
  // the HTML5 player (with varying qualities) as well as the YouTube embeded player.
  if ($('.videoPlayer').length > 0) {
    $('.videoPlayer').get(0).pause();
    lastTime = $('.videoPlayer').get(0).currentTime;
    videoHtml = $('.videoPlayer').get(0).outerHTML;
  } else {
    videoHtml = $('iframe').get(0).outerHTML;
  }

  // Create a new browser window.
  const BrowserWindow = electron.remote.BrowserWindow;

  let miniPlayer = new BrowserWindow({
    width: 1200,
    height: 700
  });

  // Use the miniPlayer.html template.
  $.get('templates/miniPlayer.html', (template) => {
    mustache.parse(template);
    const rendered = mustache.render(template, {
      videoHtml: videoHtml,
      videoThumbnail: videoThumbnail,
      startTime: lastTime,
    });
    // Render the template to the new browser window.
    miniPlayer.loadURL("data:text/html;charset=utf-8," + encodeURI(rendered));
  });
}

/**
* Check if a link is a valid YouTube/HookTube link and play that video. Gets input
* from the #jumpToInput element.
*
* @return {Void}
*/
function parseVideoLink() {
  let input = document.getElementById('jumpToInput').value;

  if (input === '') {
    return;
  }

  // The regex to get the video id from a YouTube link.  Thanks StackOverflow.
  let rx = /^.*(?:(?:(you|hook)tu\.?be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;

  let match = input.match(rx);

  console.log(match);

  // Play video if a match is found.
  try {
    playVideo(match[2]);
  } catch (err) {
    showToast('Video Not Found');
  }
}

/**
* Grab the most popular videos over the last couple of days and display them.
*
* @return {Void}
*/
function showMostPopular() {
  clearMainContainer();
  toggleLoading();

  // Get the date of 2 days ago.
  var d = new Date();
  d.setDate(d.getDate() - 2);
  console.log(d.toString());

  // Grab all videos published 2 days ago and after and order them by view count.
  // These are the videos that are considered as 'most popular' and is how similar
  // Applications grab these.  Videos in the 'Trending' tab on YouTube will be different.
  // And there is no way to grab those videos.
  let request = gapi.client.youtube.search.list({
    part: 'snippet',
    order: 'viewCount',
    type: 'video',
    publishedAfter: d.toISOString(),
    maxResults: 50,
  });

  request.execute((response) => {
    console.log(response);
    createVideoListContainer('Most Popular:');
    toggleLoading();
    response['items'].forEach(displayVideos);
  });
}

/**
* Create a link of the video to HookTube or YouTube and copy it to the user's clipboard.
*
* @param {string} website - The website to watch the video on.
* @param {string} videoId - The video ID of the video to add to the URL
*
* @return {Void}
*/
function copyLink(website, videoId) {
  // Create the URL and copy to the clipboard.
  const url = 'https://' + website + '.com/watch?v=' + videoId;
  clipboard.writeText(url);
  showToast('URL has been copied to the clipboard');
}

/**
* Get the YouTube embeded player of a video.
*
* @param {string} videoId - The video ID of the video to get.
*
* @return {promise} - The HTML of the embeded player
*/
function getEmbedPlayer(videoId) {
  console.log(videoId);
  return new Promise((resolve, reject) => {
    let request = gapi.client.youtube.videos.list({
      part: 'player',
      id: videoId,
    });

    request.execute((response) => {
      console.log(response);
      let embedHtml = response['items'][0]['player']['embedHtml'];
      embedHtml = embedHtml.replace('src="', 'src="https:');
      embedHtml = embedHtml.replace('width="480px"', '');
      embedHtml = embedHtml.replace('height="270px"', '');
      embedHtml = embedHtml.replace(/\"/g, '&quot;');
      resolve(embedHtml);
    });
  });

}

/**
* Change the quality of the current video.
*
* @param {string} videoHtml - The HTML of the video player to be set.
* @param {string} qualityType - The Quality Type of the video. Ex: 720p, 480p
* @param {boolean} isEmbed - Optional: Value on if the videoHtml is the embeded player.
*
* @return {Void}
*/
function changeQuality(videoHtml, qualityType, isEmbed = false) {
  if (videoHtml == '') {
    showToast('Video quality type is not available.  Unable to change quality.')
    return;
  }

  videoHtml = videoHtml.replace(/\&quot\;/g, '"');

  console.log(videoHtml);
  console.log(isEmbed);

  // The YouTube API creates 2 more iFrames.  This is why a boolean value is sent
  // with the function.
  const embedPlayer = document.getElementsByTagName('IFRAME')[0];

  const html5Player = document.getElementsByClassName('videoPlayer');

  console.log(embedPlayer);
  console.log(html5Player);

  if (isEmbed && html5Player.length == 0) {
    // The embeded player is already playing.  Return.
    showToast('You are already using the embeded player.')
    return;
  } else if (isEmbed) {
    // Switch from HTML 5 player to embeded Player
    html5Player[0].remove();
    const mainHtml = $('#main').html();
    $('#main').html(videoHtml + mainHtml);
    $('#currentQuality').html(qualityType);
  } else if (html5Player.length == 0) {
    // Switch from embeded player to HTML 5 player
    embedPlayer.remove();
    let videoPlayer = document.createElement('video');
    videoPlayer.className = 'videoPlayer';
    videoPlayer.src = videoHtml;
    videoPlayer.controls = true;
    videoPlayer.autoplay = true;
    $('#main').prepend(videoPlayer);
    $('#currentQuality').html(qualityType);
  } else {
    // Switch src on HTML 5 player
    const currentPlayBackTime = $('.videoPlayer').get(0).currentTime;
    html5Player[0].src = videoHtml;
    html5Player[0].load();
    $('.videoPlayer').get(0).currentTime = currentPlayBackTime;
    $('#currentQuality').html(qualityType);
  }
}

/**
* Check to see if the video URLs are valid. Change the video quality if one is not.
* The API will grab video URLs, but they will sometimes return a 404.  This
* is why this check is needed.  The video URL will typically be resolved over time.
*
* @param {string} video480p - The URL to the 480p video.
* @param {string} video720p - The URL to the 720p video.
*/
function checkVideoUrls(video480p, video720p) {
  const currentQuality = $('#currentQuality').html();
  let buttonEmbed = document.getElementById('qualityEmbed');

  let valid480 = false;

  if (typeof(video480p) !== 'undefined'){
    let get480pUrl = fetch(video480p);
    get480pUrl.then((status) => {
      switch (status.status) {
        case 404:
          showToast('Found valid URL for 480p, but returned a 404. Video type might be available in the future.');
          $(document).off('click', '#quality480p');
          $(document).on('click', '#quality480p', (event) => {
            changeQuality('');
          });
          buttonEmbed.click();
          return;
          break;
        case 403:
          showToast('This video is unavailable in your country.');
          $(document).off('click', '#quality480p');
          $(document).on('click', '#quality480p', (event) => {
            changeQuality('');
          });
          return;
          break;
        default:
          console.log('480p is valid');
          if (currentQuality === '720p' && typeof(video720p) === 'undefined'){
            changeQuality(video480p);
          }
          break;
      }
    });
  }

  if (typeof(video720p) !== 'undefined'){
    let get720pUrl = fetch(video720p);
    get720pUrl.then((status) => {
      switch (status.status) {
        case 404:
          showToast('Found valid URL for 720p, but returned a 404. Video type might be available in the future.');
          $(document).off('click', '#quality720p');
          $(document).on('click', '#quality720p', (event) => {
            changeQuality('');
          });
          if (typeof(valid480) !== 'undefined'){
            changeQuality(video480p, '480p');
          }
          break;
        case 403:
          showToast('This video is unavailable in your country.');
          $(document).off('click', '#quality720p');
          $(document).on('click', '#quality720p', (event) => {
            changeQuality('');
          });
          return;
          break;
        default:
          console.log('720p is valid');
          if (currentQuality === '720p'){
            return;
          }
          break;
      }
    });
  }
}
