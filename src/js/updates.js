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

// import {freeTubeLog} from './events.js';

/*
 * A file for checking / managing updates
 */

const updateChecker = require('github-version-checker');

 const options = {
   token: 'PUTUSERTOKENHERE', // personal access token.  Github will not allow commiting the access token, which is why this is blank.
   repo: 'freetube', // repository name
   owner: 'freetubeapp', // repository owner
   currentVersion: require('electron').remote.app.getVersion(), // your app's current version
   fetchTags: false // whether to fetch releases or tags
 };

const openReleasePage = function () {
    shell.openExternal('https://github.com/FreeTubeApp/FreeTube/releases');
}

/*function checkForUpdates() {
  updateChecker(options, function(error, update) { // callback function
    if (error){
      showToast('There was a problem with checking for updates');
      freeTubeLog(error);
    }
    if (update) { // print some update info if an update is available
      confirmFunction(update.name + ' is now available! Would you like to download the update?', openReleasePage);
    }
    else{
      showToast('No update is currently available.');
    }
  });
}*/

updateChecker(options, function (error, update) { // callback function
    if (error) throw error;
    if (update) { // print some update info if an update is available
        confirmFunction(update.name + ' is now available! Would you like to download the update?', openReleasePage);
    }
});