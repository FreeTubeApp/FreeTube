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
 * A file for functions used for settings.
 */

// To any third party devs that fork the project, please be ethical and change the API keys.
const apiKeyBank = ['AIzaSyDjszXMCw44W_k-pdNoOxUHFyKGtU_ejwE', 'AIzaSyA0CkT2lS1q9HHaFYGNGM4Ycjl1kmRy22s', 'AIzaSyAiKgR75e3XAznCcb1cj4NUJ5rR_y3uB8E', 'AIzaSyDPy5jq2l1Bgv3-MbpGdZd3W3ik1BMZeDc', 'AIzaSyBeQ-Jd0lyMmul-K1QMZ2S4GSlnGFdCd3M'];


/**
 * Display the settings screen to the user.
 *
 * @return {Void}
 */
function showSettings() {
  clearMainContainer();
  startLoadingAnimation();

  let isChecked = '';
  let key = '';

  /*
   * Check the settings database for the user's current settings.  This is so the
   * settings page has the correct toggles related when it is rendered.
   */
  settingsDb.find({}, (err, docs) => {
    docs.forEach((setting) => {
      switch (setting['_id']) {
        case 'apiKey':
          if (apiKeyBank.indexOf(setting['value']) < -1) {
            key = setting['value'];
          }
          break;
        case 'theme':
          if (currentTheme == '') {
            currentTheme = setting['value'];
          }
      }
    });

    // Grab the settings.html template to prepare for rendering
    $.get('templates/settings.html', (template) => {
      mustache.parse(template);
      const rendered = mustache.render(template, {
        isChecked: isChecked,
        key: key,
      });
      // Render template to application
      $('#main').html(rendered);
      stopLoadingAnimation();

      // Check / uncheck the switch depending on the user's settings.
      if (currentTheme === 'light') {
        document.getElementById('themeSwitch').checked = false;
      } else {
        document.getElementById('themeSwitch').checked = true;
      }
    });
  });
}

/**
 * Check the user's default settings.  Set the the default settings if none are found.
 *
 * @return {Void}
 */
function checkDefaultSettings() {
  // Grab a random API Key.
  apiKey = apiKeyBank[Math.floor(Math.random() * apiKeyBank.length)];

  // Check settings database
  settingsDb.find({}, (err, docs) => {
    if (jQuery.isEmptyObject(docs)) {

      // Set User Defaults
      let themeDefault = {
        _id: 'theme',
        value: 'light',
      };

      let apiDefault = {
        _id: 'apiKey',
        value: apiKey,
      };

      // Set default theme
      setTheme('light');

      // Inset default settings into the settings database.
      settingsDb.insert(themeDefault);
      settingsDb.insert(apiDefault);
    } else {
      // Use user current defaults
      docs.forEach((setting) => {
        switch (setting['_id']) {
          case 'theme':
            setTheme(setting['value']);
            break;
          case 'apiKey':
            if (apiKeyBank.indexOf(setting['value']) < -1) {
              apiKey = setting['value'];
            }
            break;
          default:
            break;
        }
      });
    }

    console.log("Using API key: " + apiKey);
    // Loads the JavaScript client library and invokes `start` afterwards.
  });
}

/**
 * Updates the settings based on what the user has changed.
 *
 * @return {Void}
 */
function updateSettings() {
  var themeSwitch = document.getElementById('themeSwitch').checked;
  var key = document.getElementById('api-key').value;

  if (themeSwitch == true) {
    var theme = 'dark';
  } else {
    var theme = 'light';
  }

  // Update default theme
  settingsDb.update({
    _id: 'theme'
  }, {
    value: theme
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
  });

  if (key != '') {
    settingsDb.update({
      _id: 'apiKey'
    }, {
      value: key
    }, {});
  } else {
    // To any third party devs that fork the project, please be ethical and change the API key.
    settingsDb.update({
      _id: 'apiKey'
    }, {
      value: 'AIzaSyDjszXMCw44W_k-pdNoOxUHFyKGtU_ejwE'
    }, {});
  }

  showToast('Settings have been saved.');
}

/**
 * Toggle back and forth with the current theme
 *
 * @param {boolean} themeValue - The value of the switch based on if it was turned on or not.
 *
 * @return {Void}
 */
function toggleTheme(themeValue) {
  if (themeValue.checked === true) {
    setTheme('dark');
    currentTheme = 'dark';
  } else {
    setTheme('light');
    currentTheme = 'light';
  }
}

/**
 * Set the theme of the application
 *
 * @param {string} option - The theme to be changed to.
 *
 * @return {Void}
 */
function setTheme(option) {
  let cssFile;
  const currentTheme = document.getElementsByTagName("link").item(1);

  // Create a link element
  const newTheme = document.createElement("link");
  newTheme.setAttribute("rel", "stylesheet");
  newTheme.setAttribute("type", "text/css");

  // Grab the css file to be used.
  switch (option) {
    case 'light':
      cssFile = 'style/lightTheme.css';
      break;
    case 'dark':
      cssFile = 'style/darkTheme.css';
      break;
    default:
      // Default to the light theme
      cssFile = 'style/lightTheme.css';
      break;
  }
  newTheme.setAttribute("href", cssFile);

  // Replace the current theme with the new theme
  document.getElementsByTagName("head").item(0).replaceChild(newTheme, currentTheme);
}

/**
* Import Subscriptions from an OPML file.
*
* @param {string} subFile - The file location of the OPML file.
*
* @return {Void}
*/
function importOpmlSubs(json){
  if(json[0]['folder'] !== 'YouTube Subscriptions'){
    showToast('Invalid OPML File.  Import is unsuccessful.');
    return;
  }

  json.forEach((channel) => {
    let channelId = channel['xmlurl'].replace('https://www.youtube.com/feeds/videos.xml?channel_id=', '');

    addSubscription(channelId, false);
  });
  window.setTimeout(displaySubs, 1000);
  showToast('Subscriptions have been imported!');
  return;
}

/**
* Import a subscriptions file that the user provides.
*
* @return {Void}
*/
function importSubscriptions(){
  const appDatabaseFile = localDataStorage + '/subscriptions.db';

  // Open user's file browser.  Only show .db files.
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {name: 'Database File', extensions: ['*']},
    ]
  }, function(fileLocation){
    if(typeof(fileLocation) === 'undefined'){
      console.log('Import Aborted');
      return;
    }
    console.log(fileLocation);
    let i = fileLocation[0].lastIndexOf('.');
    let fileType = (i < 0) ? '' : fileLocation[0].substr(i);
    console.log(fileType);

    /*if (fileType !== '.db'){
      showToast('Incorrect filetype.  Import was unsuccessful.');
      return;
    }*/

    fs.readFile(fileLocation[0], function(readErr, data){
      if(readErr){
        showToast('Unable to read file.  File may be corrupt or have invalid permissions.');
        throw readErr;
      }

      if (data.includes("<opml")){
        getOpml(data, function (error, json){
          if (!error){
            clearFile('subscriptions', false);
            importOpmlSubs(json['children'][0]['children']);
          }
        });
        return;
      }
      else if (fileType !== '.db'){
        showToast('Incorrect file type.  Import unsuccessful.');
        return;
      }

      clearFile('subscriptions', false);

      fs.writeFile(appDatabaseFile, data, function(writeErr){
        if(writeErr){
          showToast('Unable to create file.  Please check your permissions and try again.');
          throw writeErr;
        }
        showToast('Susbcriptions have been successfully imported. Please restart FreeTube for the changes to take effect.');
      });
    })
  });
}

/**
 * Export the susbcriptions database to a file.
 *
 * @return {Void}
 */
function exportSubscriptions() {
  const appDatabaseFile = localDataStorage + '/subscriptions.db';

  // Open user file browser. User gives location of file to be created.
  dialog.showSaveDialog({
    filters: [{
      name: 'Database File',
      extensions: ['db']
    }, ]
  }, function(fileLocation) {
    console.log(fileLocation);
    if (typeof(fileLocation) === 'undefined') {
      console.log('Export Aborted');
      return;
    }
    fs.readFile(appDatabaseFile, function(readErr, data) {
      if (readErr) {
        throw readErr;
      }
      fs.writeFile(fileLocation, data, function(writeErr) {
        if (writeErr) {
          throw writeErr;
        }
        showToast('Susbcriptions have been successfully exported');
      });
    })
  });
}

/**
* Clear out the data in a file.
*
* @param {string} type - The type of file to be cleared.
*/
function clearFile(type, showMessage = true){
  console.log(type);
  let dataBaseFile;

  switch (type) {
    case 'subscriptions':
      dataBaseFile = localDataStorage + '/subscriptions.db';
      break;
    case 'history':
      dataBaseFile = localDataStorage + '/videohistory.db';
      break;
    case 'saved':
      dataBaseFile = localDataStorage + '/savedvideos.db';
      break;
    default:
      showToast('Unknown file: ' + type)
      return
  }

  // Replace data with an empty string.
  fs.writeFile(dataBaseFile, '', function(err) {
    if (err) {
      throw err;
    }

    if (showMessage){
      showToast('File has been cleared. Restart FreeTube to see the changes');
    }
  })
}
