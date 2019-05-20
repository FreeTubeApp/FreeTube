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

function checkForNewUpdate() {
  const requestUrl = 'https://api.github.com/repos/freetubeapp/freetube/releases';

  let success = function(data) {
    let currentVersion = require('electron').remote.app.getVersion();
    let versionNumber = data[0].tag_name.replace('v', '');
    versionNumber = versionNumber.replace('-beta', '');

    let blogRegexPattern = /\(.*\)/;

    let blogUrl = blogRegexPattern.exec(data[0].body);
    blogUrl = blogUrl[0].replace(/\(|\)/g, '');

    if (versionNumber > currentVersion) {
      confirmFunction(data[0].name + ` is now available! Would you like to download the update? <a href="${blogUrl}">Changelog</a>`, openReleasePage);
    }
  };

  if (useTor) {
    proxyRequest(() => {
      $.getJSON(
        requestUrl,
        success
      ).fail((xhr, textStatus, error) => {
        fail(xhr);
        ft.log(xhr);
        ft.log(textStatus);
        ft.log(requestUrl);
      });
    })

  } else {
    $.getJSON(
      requestUrl,
      success
    ).fail((xhr, textStatus, error) => {
      fail(xhr);
      ft.log(xhr);
      ft.log(textStatus);
      ft.log(requestUrl);
    });
  }
}

const openReleasePage = function () {
    shell.openExternal('https://github.com/FreeTubeApp/FreeTube/releases');
}
