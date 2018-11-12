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
function addSavedVideo(videoId) {
    let checkIfSaved = videoIsSaved(videoId);

    checkIfSaved.then((saved) => {
        if (saved === false) {
            let data = {
                videoId: videoId,
                timeSaved: new Date().getTime(),
            };

            savedVidsDb.insert(data, (err, newDoc) => {
                showToast('The video has been favorited!');
            });
        } else {
            showToast('The video has already been favorited!')
        }
    });
}

/**
 * Removes a video from the user's saved video database.
 *
 * @param {string} videoId - The video ID of the video that will be removed.
 *
 * @return {Void}
 */
function removeSavedVideo(videoId, string) {
    savedVidsDb.remove({
        videoId: videoId
    }, {}, (err, numRemoved) => {
        showToast('Video has been removed from the favorites list.');
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

    checkIfSaved.then((results) => {
        if (results === false) {
            playerView.savedText = 'FAVORITED';
            playerView.savedIconType = 'fas saved';
            addSavedVideo(videoId);
        } else {
            playerView.savedText = 'FAVORITE';
            playerView.savedIconType = 'far unsaved';
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
        savedVidsDb.find({
            videoId: videoId
        }, (err, docs) => {
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
function showSavedVideos() {
    console.log('checking saved videos');

    savedView.videoList = [];

    // Check the database for the list of videos.
    savedVidsDb.find({}).sort({
        timeSaved: -1
    }).exec((err, docs) => {
      if (docs.length < 100) {
        for (let i = 0; i < docs.length; i++) {
          invidiousAPI('videos', docs[i].videoId, {}, (data) => {
              data.position = i;
              displayVideo(data, 'saved');
          });
        }
      }
      else{
        for (let i = 0; i < 100; i++) {
          invidiousAPI('videos', docs[i].videoId, {}, (data) => {
              data.position = i;
              displayVideo(data, 'saved');
          });
        }
      }

        loadingView.seen = false;
    });
}
