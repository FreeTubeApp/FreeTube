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
* File for main layout manipulation and general variable configuration.
* There are some functions from other files that will probably need to be moved to here.
*/

// Add general variables.  Please put all require statements here.
const Datastore = require('nedb'); // Database logic
window.$ = window.jQuery = require('jquery');
const mustache = require('mustache'); // Templating
const dateFormat = require('dateformat'); // Formating Dates

// Used for finding links within text and making them clickable.  Used mostly for video descriptions.
const autolinker = require('autolinker');
const electron = require('electron');

// Used for getting the user's subscriptions.  Can probably remove this when that function
// is rewritten.
const asyncLoop = require('node-async-loop');
const shell = electron.shell; // Used to open external links into the user's native browser.
const localDataStorage = electron.remote.app.getPath('userData'); // Grabs the userdata directory based on the user's OS
const clipboard = electron.clipboard;
const getOpml = require('opml-to-json'); // Gets the file type for imported files.
const fs = require('fs'); // Used to read files. Specifically in the settings page.
let currentTheme = '';
let apiKey;
let dialog = require('electron').remote.dialog; // Used for opening file browser to export / import subscriptions.
let toastTimeout; // Timeout for toast notifications.
let mouseTimeout; // Timeout for hiding the mouse cursor on video playback

// Subscriptions database file
const subDb = new Datastore({
  filename: localDataStorage + '/subscriptions.db',
  autoload: true
});

// History database file
const historyDb = new Datastore({
  filename: localDataStorage + '/videohistory.db',
  autoload: true
});

// Saved videos database file
const savedVidsDb = new Datastore({
  filename: localDataStorage + '/savedvideos.db',
  autoload: true
});

// Settings database file.
const settingsDb = new Datastore({
  filename: localDataStorage + 'settings.db',
  autoload: true
});

// Grabs the default settings from the settings database file.  Makes defaults if
// none are found.
checkDefaultSettings();

// Ppen links externally by default
$(document).on('click', 'a[href^="http"]', (event) =>{
  let el = event.currentTarget;
  event.preventDefault();
  shell.openExternal(el.href);
});

// Open links externally on middle click.
$(document).on('auxclick', 'a[href^="http"]', (event) =>{
  let el = event.currentTarget;
  event.preventDefault();
  shell.openExternal(el.href);
});


$(document).ready(() => {
  const searchBar = document.getElementById('search');
  const jumpToInput = document.getElementById('jumpToInput');

  // Displays the list of subscriptions in the side bar.
  displaySubs();

  // Allow user to use the 'enter' key to search for a video.
  searchBar.onkeypress = (e) => {
    if (e.keyCode === 13) {
      search();
    }
  };

  // Allow user to use the 'enter' key to open a video link.
  jumpToInput.onkeypress = (e) => {
    if (e.keyCode === 13) {
      parseVideoLink();
    }
  };

  // Display subscriptions upon the app opening up.  May allow user to specify.
  // Home page in the future.
  loadSubscriptions();
});

/**
* Start the YouTube API.
*
* @return {Void}
*/
function start() {
  // Initializes the client with the API key and the Translate API.
  gapi.client.init({
    'apiKey': apiKey,
  })

  gapi.client.load('youtube', 'v3', () => {
    let isLoad = true;
  });
}


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
* Clears out the #main container to allow other information to be shown.
*
* @return {Void}
*/
function clearMainContainer() {
  const container = document.getElementById('main');
  container.innerHTML = '';
  hideConfirmFunction();
}

/**
* Show the loading animation before / after a function runs.  Also disables / enables input
*
* @return {Void}
*/
function toggleLoading() {
  const loading = document.getElementById('loading');
  const sideNavDisabled = document.getElementById('sideNavDisabled');
  const searchBar = document.getElementById('search');
  const goToVideoInput = document.getElementById('jumpToInput');

  if (loading.style.display === 'none' || loading.style.display === '') {
    loading.style.display = 'inherit';
    sideNavDisabled.style.display = 'inherit';
    searchBar.disabled = true;
    goToVideoInput.disabled = true;
  } else {
    loading.style.display = 'none';
    sideNavDisabled.style.display = 'none';
    searchBar.disabled = false;
    goToVideoInput.disabled = false;
  }
}

/**
* Creates a div container in #main meant to be a container for video lists.
*
* @param {string} headerLabel - The header of the container.  Not used for showing video recommendations.
*
* @return {Void}
*/
function createVideoListContainer(headerLabel = '') {
  const videoListContainer = document.createElement("div");
  videoListContainer.id = 'videoListContainer';
  let headerSpacer;
  if (headerLabel != '') {
    const headerElement = document.createElement("h2");
    headerElement.innerHTML = headerLabel;
    headerElement.style.marginLeft = '15px';
    headerElement.appendChild(document.createElement("hr"));
    videoListContainer.appendChild(headerElement);
  }
  document.getElementById("main").appendChild(videoListContainer);
}

/**
* Displays the about page to #main
*
* @return {Void}
*/
function showAbout(){
  // Remove current information and display loading animation
  clearMainContainer();
  toggleLoading();

  // Grab about.html to be used as a template
  $.get('templates/about.html', (template) => {
    mustache.parse(template);
    const rendered = mustache.render(template, {
      versionNumber: require('electron').remote.app.getVersion(),
    });
    // Render to #main and remove loading animation
    $('#main').html(rendered);
    toggleLoading();
  });
}

/**
* Display a toast message in the bottom right corner of the page.  Toast will
* automatically disappear after 5 seconds.
*
* @param {string} message - The message to be displayed in the toast.
*
* @return {Void}
*/
function showToast(message){
  let toast = document.getElementById('toast');
  let toastMessage = document.getElementById('toastMessage');

  // If a toast message is already being displayed, this will remove the previous timer that was set.
  clearTimeout(toastTimeout);

  toastMessage.innerHTML = message;
  toast.style.visibility = 'visible';
  toast.style.opacity = 0.9;

  // Set the timer for the toast to be removed.
  toastTimeout = window.setTimeout(hideToast, 5000); // 5 seconds
}

/**
* Hide the toast notification from the page.
*
* @return {Void}
*/
function hideToast(){
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
function confirmFunction(message, performFunction, parameters){
  let confirmContainer = document.getElementById('confirmFunction');
  let confirmMessage = document.getElementById('confirmMessage');

  confirmMessage.innerHTML = message;
  confirmContainer.style.visibility = 'visible';

  $(document).on('click', '#confirmYes', (event) => {
    performFunction(parameters);
    hideConfirmFunction();
  });
}

/**
* Hides the confirmation box.  Happens when the user clicks on 'no'.
*
* @return {Void}
*/
function hideConfirmFunction(){
  let confirmContainer = document.getElementById('confirmFunction');
  confirmContainer.style.visibility = 'hidden';
}

/**
* Hide the mouse cursor after ~3 seconds.  Used to hide the video when the user
* hovers the mouse over the video player.
*
* @return {Void}
*/
function hideMouseTimeout(){
  $('.videoPlayer')[0].style.cursor = 'default';
  clearTimeout(mouseTimeout);
  mouseTimeout = window.setTimeout(function(){
    $('.videoPlayer')[0].style.cursor = 'none';
  }, 3150);
}

/**
* Remove the timeout for the mouse cursor as a fallback.
*
* @return {Void}
*/
function removeMouseTimeout(){
  $('.videoPlayer')[0].style.cursor = 'default';
  clearTimeout(mouseTimeout);
}
