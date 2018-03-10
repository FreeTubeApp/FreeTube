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
  console.log(resource, params, success)
  $.getJSON(
    'https://www.googleapis.com/youtube/v3/' + resource,
    params,
    success
  ).fail((xhr, textStatus, error) => {
    showToast('There was an error calling the YouTube API.');
    console.log(error);
    stopLoadingAnimation();
  });
}
