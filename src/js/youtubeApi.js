/**
 * List a YouTube HTTP API resource.
 *
 * @param {string} resource - The path of the resource.
 * @param {object} params - The API parameters.
 * @param {function} success - The function to be called on success.
 *
 * @return {Void}
 */
function youtubeAPI(resource, params, success) {
  params.key = apiKey;
  $.getJSON(
    'https://www.googleapis.com/youtube/v3/' + resource,
    params,
    success
  ).fail((xhr, textStatus, error) => {
    showToast('There was an error calling the YouTube API.');
    console.log(error);
    console.log(xhr);
    console.log(textStatus);
    stopLoadingAnimation();
  });
}

/**
* Use youtube-dl to resolve a video.
*
* @param {string} videoId - The video Id to get info from.
* @param {function} callback - The function called on success with the info.
*
* @return {Void}
*/
function youtubedlGetInfo(videoId, callback) {
  /*let url = 'https://stormy-inlet-41826.herokuapp.com/api/info?url=https://www.youtube.com/watch?v=' + videoId + 'flatten=True&writesubtitles=True&geo_bypass=true';
  $.getJSON(url, (response) => {
    callback(response.info);
  });
  //https://stormy-inlet-41826.herokuapp.com/api/info?url=https://youtube.com/watch?v=fc6ODCqepb8flatten=True&writesubtitles=True&geo_bypass=True&write_auto_sub=true&sub_lang=zh-TW
  //https://www.youtube.com/watch?v=8YoUxe5ncPo
  //https://youtube.com/watch?v=fc6ODCqepb8*/
  
  let url = 'https://youtube.com/watch?v=' + videoId;
  let options = ['--all-subs', '--write-subs'];

  /*var dashjs = require('dashjs');
  var url = "http://dash.edgesuite.net/envivio/EnvivioDash3/manifest.mpd";
  var player = dashjs.MediaPlayer().create();
  player.initialize(document.querySelector("#videoPlayer"), url, true);*/

  ytdl.getInfo(url, options, function(err, info) {
    if (err){
      showToast('There was an issue calling youtube-dl.');
      stopLoadingAnimation();
      console.log(err);
      return;
    }

    console.log('Success');
    callback(info);
  });
}
