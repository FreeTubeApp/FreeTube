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

let ft = {};

/**
 *
 * Use this function instead of console.log.
 * This function logs the date, time and presents the information in a readable format
 *
 * @param {*} data
 *
 * @returns {Void}
 */
ft.log = function (...data) {
    if (typeof (settingsView) !== 'undefined' && !settingsView.debugMode) {
        return;
    }
    let currentTime = new Date();
    let time = currentTime.getDate() + "/" +
        (currentTime.getMonth() + 1) + "/" +
        currentTime.getFullYear() + "@" +
        currentTime.getHours() + ":" +
        currentTime.getMinutes() + ":" +
        currentTime.getSeconds();

    console.log('[' + time + '] ' + '[FREETUBE]', data);
}
