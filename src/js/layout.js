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
    along with FreeTube.  If nsot, see <http://www.gnu.org/licenses/>.
*/



/*
 * File for main layout manipulation and general variable configuration.
 * There are some functions from other files that will probably need to be moved to here.
 */

// Add general variables.  Please put all require statements here.
window.$ = window.jQuery = require('jquery');
const mustache = require('mustache'); // templating
const dateFormat = require('dateformat'); // formatting dates

// Used for finding links within text and making them clickable.  Used mostly for video descriptions.
const autolinker = require('autolinker');
const protocol = electron.remote.protocol;

// Used for getting the user's subscriptions.  Can probably remove this when that function
// is rewritten.
const ytdl = require('ytdl-core');
const shell = electron.shell; // Used to open external links into the user's native browser.
const clipboard = electron.clipboard;
const getOpml = require('opml-to-json'); // Gets the file type for imported files.
const fs = require('fs'); // Used to read files. Specifically in the settings page.
const url = require('url');
const path = require('path');

let dialog = electron.remote.dialog; // Used for opening file browser to export / import subscriptions.
let toastTimeout; // Timeout for toast notifications.
let mouseTimeout; // Timeout for hiding the mouse cursor on video playback

require.extensions['.html'] = function(module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

// Grabs the default settings from the settings database file.  Makes defaults if
// none are found.

electron.ipcRenderer.on('ping', function(event, message) {
    ft.log(message);
    let url = message[message.length - 1];
    if (url) {
        url = url.replace('freetube://', '');
        parseSearchText(url);
    }
    ft.log(message);
});

// Listens for proxy to be set in main process
electron.ipcRenderer.on('proxyAvailable', function(event, message) {
    proxyAvailable = true;
});

$(document).ready(() => {
    const searchBar = document.getElementById('search');
    const jumpToInput = document.getElementById('jumpToInput');

    // Displays the list of subscriptions in the side bar.
    displaySubs();

    // Allow user to use the 'enter' key to search for a video.
    searchBar.onkeypress = (e) => {
        if (e.keyCode === 13) {
            parseSearchText();
        }
    };

    settingsDb.find({
        $or: [{
            _id: 'startScreen'
        }, {
            _id: 'invidious'
        }]
    }, (err, docs) => {
        invidiousInstance = docs[0].value;
        loadingView.seen = true;

        if (docs[1].value !== false) {
            switch (docs[1].value) {
                case 'subscriptions':
                    sideNavBar.subscriptions();
                    break;
                case 'trending':
                    sideNavBar.trending();
                    break;
                case 'popular':
                    sideNavBar.popular();
                    break;
                case 'favorites':
                    sideNavBar.saved();
                    break;
                case 'history':
                    sideNavBar.history();
                    break;
            }
        }
    });

    $.get('https://write.as/freetube/feed/', function(data) {
        aboutView.rssFeed = [];
        $(data).find("item").each(function() {
            let el = $(this);
            let rssData = {
                title: el.find("title").text(),
                link: el.find("link").text(),
                pubDate: new Date(el.find("pubDate").text()).toDateString(),
            };

            aboutView.rssFeed.push(rssData);
        });
    });
});

/**
 * Toggle the ability to view the side navigation bar.
 *
 * @return {Void}
 */
function toggleSideNavigation() {
    const sideNav = document.getElementById('sideNav');
    const mainContainer = document.getElementById('main');

    if (sideNav.style.display === 'none') {
        sideNav.style.display = 'inline';
        mainContainer.style.marginLeft = '250px';
    } else {
        sideNav.style.display = 'none';
        mainContainer.style.marginLeft = '0px';
    }
}

/**
 * Display a toast message in the bottom right corner of the page.
 * The toast automatically disappears after a timeout.
 *
 * @param {string} message - The toast message.
 *
 * @return {Void}
 */
function showToast(message) {
    let toast = document.getElementById('toast');
    let toastMessage = document.getElementById('toastMessage');

    // If a toast message is already being displayed, this will remove the previous timer that was set.
    clearTimeout(toastTimeout);

    toastMessage.innerHTML = message;
    toast.style.visibility = 'visible';
    toast.style.opacity = 0.9;

    // Set the timer for the toast to be removed.
    toastTimeout = window.setTimeout(hideToast, 5000);
}

/**
 * Hide the toast notification from the page.
 *
 * @return {Void}
 */
function hideToast() {
    let toast = document.getElementById('toast');
    toast.style.opacity = 0;
    toast.style.visibility = 'hidden';
}

/**
 * Displays a confirmation box before performing an action.  The action will be performed
 * if the user clicks 'yes'.
 *
 * @param {string} message - The message to be displayed in the confirmation box
 * @param {function} performFunction - The function to be performed upon confirmation
 * @param {*} parameters - The parameters that will be sent to performFunction
 *
 * @return {Void}
 */
function confirmFunction(message, performFunction, parameters = '') {
    let confirmContainer = document.getElementById('confirmFunction');
    let confirmMessage = document.getElementById('confirmMessage');

    confirmMessage.innerHTML = message;
    confirmContainer.style.visibility = 'visible';

    $(document).on('click', '#confirmYes', (event) => {
        if (parameters != '') {
            performFunction(parameters);
        } else {
            performFunction();
        }
        hideConfirmFunction();
    });
}

/**
 * Hides the confirmation box.  Happens when the user clicks on 'no'.
 *
 * @return {Void}
 */
function hideConfirmFunction() {
    let confirmContainer = document.getElementById('confirmFunction');
    confirmContainer.style.visibility = 'hidden';
}

/**
 * Hide the mouse cursor after ~3 seconds.  Used to hide the video when the user
 * hovers the mouse over the video player.
 *
 * @return {Void}
 */
function hideMouseTimeout() {
    $('.videoPlayer')[0].style.cursor = 'default';
    clearTimeout(mouseTimeout);
    mouseTimeout = window.setTimeout(function() {
        $('.videoPlayer')[0].style.cursor = 'none';
    }, 2800);
}

/**
 * Remove the timeout for the mouse cursor as a fallback.
 *
 * @return {Void}
 */
function removeMouseTimeout() {
    $('.videoPlayer')[0].style.cursor = 'default';
    clearTimeout(mouseTimeout);
}

function showVideoOptions(element) {
    if (element.nextElementSibling.style.display == 'none' || element.nextElementSibling.style.display == '') {
        element.nextElementSibling.style.display = 'inline-block'
    } else {
        element.nextElementSibling.style.display = 'none'
    }
}

/**
 * Wrapper around AJAX calls to wait for proxy to become available
 * @return {Void}
 */
function proxyRequest(callback) {
    let proxyCheckingInterval;
    let counter = 0;

    // Wait for proxy to become available
    proxyCheckingInterval = setInterval(function() {
        if (proxyAvailable) {
            clearInterval(proxyCheckingInterval)

            callback();

        } else {
            if (counter > 10) {
                clearInterval(proxyCheckingInterval);
                showToast('Unable to connect to the Tor network. Check the help page if you\'re having trouble setting up your node.');
            }
            counter++;
        }
    }, 100);
}
