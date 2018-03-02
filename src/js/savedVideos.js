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
* File used for functions related to saving videos
*/

/**
* Adds a video to the user's saved video database.
*
* @param {string} videoId - The video ID of the video that will be saved.
*
* @return {Void}
*/
function addSavedVideo(videoId){
  let data = {
    videoId: videoId,
    timeSaved: new Date().getTime(),
  };

  savedVidsDb.insert(data, (err, newDoc) => {
    showToast('Video has been saved!');
  });
}

/**
* Removes a video from the user's saved video database.
*
* @param {string} {videoId} - The video ID of the video that will be removed.
*
* @return {Void}
*/
function removeSavedVideo(videoId){
  savedVidsDb.remove({
    videoId: videoId
  }, {}, (err, numRemoved) => {
    showToast('Video has been removed from saved list.');
  });
}

/**
* Toggles the save video button styling and saved / remove a video based on the current status.
*
* @param {string} videoId - The video ID to toggle between.
*
* @return {Void}
*/
function toggleSavedVideo(videoId) {
  event.stopPropagation();

  const checkIfSaved = videoIsSaved(videoId);
  const saveIcon = document.getElementById('saveIcon');
  const savedText = document.getElementById('savedText');

  checkIfSaved.then((results) => {
    if (results === false) {
      savedText.innerHTML = 'SAVED';
      saveIcon.classList.remove('far');
      saveIcon.classList.remove('unsaved');
      saveIcon.classList.add('fas');
      saveIcon.classList.add('saved');
      addSavedVideo(videoId);
    } else {
      savedText.innerHTML = 'SAVE';
      saveIcon.classList.remove('fas');
      saveIcon.classList.remove('saved');
      saveIcon.classList.add('far');
      saveIcon.classList.add('unsaved');
      removeSavedVideo(videoId);
    }
  });
}

/**
* Checks if a video was saved in the user's saved video database
*
* @param {string} videoId - The video ID to check
*
* @return {promise} - A boolean value if the video was found or not.
*/
function videoIsSaved(videoId) {
  return new Promise((resolve, reject) => {
    savedVidsDb.find({videoId: videoId}, (err, docs) => {
      if (jQuery.isEmptyObject(docs)) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
* Displays a list of the user's saved videos.
*
* @return {Void}
*/
function showSavedVideos(){
  clearMainContainer();
  toggleLoading();
  console.log('checking saved videos');

  let videoList = '';

  // Check the database for the list of videos.
  savedVidsDb.find({}).sort({
    timeSaved: -1
  }).exec((err, docs) => {
    // The YouTube API requires a max of 50 videos to be shown.  Don't show more than 50.
    // TODO: Allow the app to show more than 50 saved videos.
    if(docs.length > 49){
      for (let i = 0; i < 49; i++) {
        videoList = videoList + ',' + docs[i]['videoId'];
      }
    }
    else{
      docs.forEach((video) => {
        videoList = videoList + ',' + video['videoId'];
      });
    }

    // Call the YouTube API
    let request = gapi.client.youtube.videos.list({
      part: 'snippet',
      id: videoList,
      maxResults: 50,
    });

    // Execute the API request
    request.execute((response) => {
      // Render the videos to the screen
      createVideoListContainer('Saved Videos:');
      response['items'].forEach((video) => {
        displayVideos(video, 'history');
      });
      toggleLoading();
    });
  });
}
