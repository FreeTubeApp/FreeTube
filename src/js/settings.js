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

/**
 * Display the settings screen to the user.
 *
 * @return {Void}
 */
function updateSettingsView() {
  /*
   * Check the settings database for the user's current settings.  This is so the
   * settings page has the correct toggles related when it is rendered.
   */
  settingsDb.find({}, (err, docs) => {
    docs.forEach((setting) => {
      switch (setting['_id']) {
        case 'theme':
          if (currentTheme == '') {
            currentTheme = setting['value'];
          }
      }
    });

    // Check / uncheck the switch depending on the user's settings.
    if (currentTheme === 'light') {
      settingsView.useTheme = false;
    } else {
      settingsView.useTheme = true;
    }

    if (useTor) {
      settingsView.useTor = true;
    } else {
      settingsView.useTor = false;
    }

    if (rememberHistory) {
      settingsView.history = true;
    } else {
      settingsView.history = false;
    }

    if (autoplay) {
      settingsView.autoplay = true;
    } else {
      settingsView.autoplay = false;
    }

    if (enableSubtitles) {
      settingsView.subtitles = true;
    } else {
      settingsView.subtitles = false;
    }

    if (checkForUpdates) {
      settingsView.updates = true;
    } else {
      settingsView.updates = false;
    }

    document.getElementById('qualitySelect').value = defaultQuality;
    document.getElementById('rateSelect').value = defaultPlaybackRate;
  });
}

/**
 * Check the user's default settings.  Set the the default settings if none are found.
 *
 * @return {Void}
 */
function checkDefaultSettings() {

  let newSetting;

  let settingDefaults = {
    'theme': 'light',
    'useTor': false,
    'history': true,
    'autoplay': true,
    'subtitles': false,
    'updates': true,
    'quality': '720',
    'rate': '1',
  };

  console.log(settingDefaults);

  for (let key in settingDefaults){
    settingsDb.find({_id: key}, (err, docs) => {
      if (jQuery.isEmptyObject(docs)) {
        newSetting = {
          _id: key,
          value: settingDefaults[key]
        };

        settingsDb.insert(newSetting);

        if (key == 'theme'){
          setTheme('light');
        }
      }
      else{
        switch (docs[0]['_id']) {
          case 'theme':
            setTheme(docs[0]['value']);
            break;
          case 'useTor':
            useTor = docs[0]['value'];
            break;
          case 'history':
            rememberHistory = docs[0]['value'];
            break;
          case 'autoplay':
            autoplay = docs[0]['value'];
            break;
          case 'subtitles':
            enableSubtitles = docs[0]['value'];
            break;
          case 'updates':
            checkForUpdates = docs[0]['value'];

            if (checkForUpdates) {
              updateChecker(options, function (error, update) { // callback function
                  if (error) throw error;
                  if (update) { // print some update info if an update is available
                      confirmFunction(update.name + ' is now available! Would you like to download the update?', openReleasePage);
                  }
              });
            }
            break;
          case 'quality':
            defaultQuality = docs[0]['value'];
            break;
          case 'rate':
            defaultPlaybackRate = docs[0]['value'];
            break;
          default:
            break;
        }
      }
    });
  }
}

/**
 * Updates the settings based on what the user has changed.
 *
 * @return {Void}
 */
function updateSettings() {
  let themeSwitch = document.getElementById('themeSwitch').checked;
  let torSwitch = document.getElementById('torSwitch').checked;
  let historySwitch = document.getElementById('historySwitch').checked;
  let autoplaySwitch = document.getElementById('autoplaySwitch').checked;
  let subtitlesSwitch = document.getElementById('subtitlesSwitch').checked;
  let updatesSwitch = document.getElementById('updatesSwitch').checked;
  let qualitySelect = document.getElementById('qualitySelect').value;
  let rateSelect = document.getElementById('rateSelect').value;
  let theme = 'light';

  settingsView.useTor = torSwitch;
  settingsView.history = historySwitch;
  settingsView.autoplay = autoplaySwitch;
  settingsView.subtitles = subtitlesSwitch;
  settingsView.updates = updatesSwitch;
  rememberHistory = historySwitch;
  defaultQuality = qualitySelect;
  defaultPlaybackRate = rateSelect;

  if (themeSwitch === true) {
    theme = 'dark';
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

  // Update tor usage.
  settingsDb.update({
    _id: 'useTor'
  }, {
    value: torSwitch
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    useTor = torSwitch;
  });

  // Update history
  settingsDb.update({
    _id: 'history'
  }, {
    value: historySwitch
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    rememberHistory = historySwitch;
  });

  // Update autoplay.
  settingsDb.update({
    _id: 'autoplay'
  }, {
    value: autoplaySwitch
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    autoplay = autoplaySwitch;
  });

  // Update subtitles.
  settingsDb.update({
    _id: 'subtitles'
  }, {
    value: subtitlesSwitch
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    enableSubtitles = subtitlesSwitch;
  });

  // Update checkForUpdates.
  settingsDb.update({
    _id: 'updates'
  }, {
    value: updatesSwitch
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    checkForUpdates = updatesSwitch;
  });

  // Update default quality.
  settingsDb.update({
    _id: 'quality'
  }, {
    value: qualitySelect
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    defaultQuality = qualitySelect;
  });

  // Update default playback rate.
  settingsDb.update({
    _id: 'rate'
  }, {
    value: rateSelect
  }, {}, function(err, numReplaced) {
    console.log(err);
    console.log(numReplaced);
    defaultPlaybackRate = rateSelect;
  });

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
      cssFile = './style/lightTheme.css';
      document.getElementById('menuText').src = 'icons/textBlack.png';
      document.getElementById('menuIcon').src = 'icons/iconBlack.png';
      document.getElementById('menuButton').style.color = 'black';
      document.getElementById('reloadButton').style.color = 'black';
      break;
    case 'dark':
      cssFile = './style/darkTheme.css';
      document.getElementById('menuText').src = 'icons/textColor.png';
      document.getElementById('menuIcon').src = 'icons/iconColor.png';
      document.getElementById('menuButton').style.color = 'white';
      document.getElementById('reloadButton').style.color = 'white';
      break;
    default:
      // Default to the light theme
      cssFile = './style/lightTheme.css';
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
  if(!json[0]['folder'].includes('YouTube')){
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

  const date = new Date();
  let dateMonth = date.getMonth() + 1;

  if (dateMonth < 10){
    dateMonth = '0' + dateMonth;
  }

  let dateDay = date.getDate();

  if (dateDay < 10){
    dateDay = '0' + dateDay;
  }

  const dateYear = date.getFullYear();
  const dateString = 'freetube-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay;

  // Open user file browser. User gives location of file to be created.
  dialog.showSaveDialog({
    defaultPath: dateString,
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

checkDefaultSettings();
