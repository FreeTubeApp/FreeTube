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
* File used for functions related to video history.
*/

/**
* Add a video to the history database file
*
* @param {string} videoId - The video ID of the video to be saved.
*
* @return {Void}
*/
function addToHistory(videoId){
  const data = {
    videoId: videoId,
    timeWatched: new Date().getTime(),
  };
  historyDb.insert(data, (err, newDoc) => {});
}

/**
* Remove a video from the history database file
*
* @param {string} videoId - The video ID of the video to be removed.
*
* @return {Void}
*/
function removeFromHistory(videoId){
  const data = {videoId: videoId};
  historyDb.remove(data, {}, (err, numRemoved) => {});
}

/**
* Show the videos within the history database.
*
* @return {Void}
*/
function showHistory(){
  console.log('checking history');

  historyView.videoList = [];

  historyDb.find({}).sort({
    timeWatched: -1
  }).exec((err, docs) => {
    let position = 0;
    docs.forEach((video) => {
        invidiousAPI('videos', video.videoId, {}, (data) => {
            data.position = position;
            displayVideo(data, 'history');
            position++;
        });
    });

    loadingView.seen = false;
  });
}
