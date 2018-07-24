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

    if (useTor) {
        tor.request('https://www.googleapis.com/youtube/v3/' + resource + '?' + $.param(params), function (err, res, body) {
            if (!err && res.statusCode == 200) {
                success(JSON.parse(body));
            } else {
                showToast('Unable to connect to the Tor network. Check the help page if you\'resss having trouble setting up your node.');
                ft.log('Tor Error: ', err);
                ft.log('Tor Error (Result): ', res);
                ft.log('Tor Error (body): ', body);
                stopLoadingAnimation();
            }
        });
    } else {
        $.getJSON(
            'https://www.googleapis.com/youtube/v3/' + resource,
            params,
            success
        ).fail((xhr, textStatus, error) => {
            showToast('There was an error calling the YouTube API.');
            ft.log('YT API Error: ', error);
            ft.log('YT API Error - XHR: ', xhr);
            ft.log('YT API Error - Text Status: ', textStatus);
            stopLoadingAnimation();
        });
    }


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

    let url = 'https://youtube.com/watch?v=' + videoId;
    let options = ['--all-subs', '--write-subs'];

    ytdl.getInfo(url, options, function (err, info) {
        if (err) {
            showToast(err.message);
            stopLoadingAnimation();
            ft.log('Error getting video download info: ', err.message);
            ft.log('Error getting video download info: ', info);
            return;
        }

        ft.log('Success');
        callback(info);
    });
}