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
function addToHistory(data){
  historyDb.findOne({ videoId: data.videoId }, function (err, doc) {
    if(doc === null) {
      historyDb.insert(data, (err, newDoc) => {});
    } else {
      historyDb.update(
        { videoId: data.videoId },
        {
          videoId: data.videoId,
          author: data.author,
          authorId: data.authorId,
          published: data.published,
          publishedText: data.publishedText,
          description: data.description,
          viewCount: data.viewCount,
          title: data.title,
          description: data.description,
          lengthSeconds: data.lengthSeconds,
          videoThumbnails: data.videoThumbnails,
          type: 'video',
          timeWatched: data.timeWatched,
        }, {}, (err, newDoc) => {});
    }
  });
}

/**
* Remove a video from the history database file
*
* @param {string} videoId - The video ID of the video to be removed.
*
* @return {Void}
*/
function removeFromHistory(videoId, toast = true){
  const data = {videoId: videoId};
  historyDb.remove(data, {}, (err, numRemoved) => {
    if (toast) {
      if (!err) {
        showToast('Video removed from history');
      }
    }
  });
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
    docs.forEach((video, index) => {
        if (video.authorId === undefined) {
          // History data is from old version of FreeTube, update data for future calls.
          invidiousAPI('videos', video.videoId, {}, (data) => {
              let publishedText = new Date(data.published * 1000);
              publishedText = dateFormat(publishedText, "mmm dS, yyyy");
              let videoData = {
                videoId: video.videoId,
                published: data.published,
                publishedText: publishedText,
                description: data.description,
                viewCount: data.viewCount,
                title: data.title,
                lengthSeconds: data.lengthSeconds,
                videoThumbnails: data.videoThumbnails[4].url,
                author: data.author,
                authorId: data.authorId,
                liveNow: false,
                paid: false,
                type: 'video',
                timeWatched: video.timeWatched,
              };
              addToHistory(videoData);
              videoData.position = index;
              displayVideo(videoData, 'history');
          }, () => {
            removeFromHistory(video.videoId, false);
          });
        }
        else{
          video.position = index;
          displayVideo(video, 'history');
        }
    });

    loadingView.seen = false;
  });
}
