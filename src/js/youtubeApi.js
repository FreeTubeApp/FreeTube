var request = require("request");
function youtubeAPI (path, qs, callback) {
    qs.key = apiKey;
    request({'url': "https://www.googleapis.com/youtube/v3/"+path, 'qs': qs, 'json': true, 'forever': true},
	function (error, response, body){
		console.log([error, response, body]);
		if (error){
			dialog.showErrorBox('YouTube API HTTP error', JSON.stringify(error))
			stopLoadingAnimation()
		} else if (response.statusCode != 200){
			dialog.showErrorBox('YouTube API error', JSON.stringify(body))
			stopLoadingAnimation()
		} else {
			callback(body);
		}
	});
}
