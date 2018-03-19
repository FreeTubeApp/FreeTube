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
  let url = 'https://stormy-inlet-41826.herokuapp.com/api/info?url=https://www.youtube.com/watch?v=' + videoId + 'flatten=True&writesubtitles=True&geo_bypass=True';
  $.getJSON(url, (response) => {
    callback(response.info);
  });


  /*let url = 'https://youtube.com/watch?v=' + videoId;
  let options = ['--all-subs'];

  youtubedl.getInfo(url, options, function(err, info) {
    if (err){
      showToast('There was an issue calling youtube-dl.');
      stopLoadingAnimation();
      console.log(err);
      return;
    }

    console.log('Success');
    callback(info);
  });*/
}
