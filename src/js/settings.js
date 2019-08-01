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

// User Defaults
let currentTheme = '';
let useTor = false;
let rememberHistory = true;
let autoplay = true;
let enableSubtitles = false;
let checkForUpdates = true;
let currentVolume = 1;
let defaultVolume = 1;
let defaultPlayer = 'dash';
let defaultQuality = 720;
let defaultPlaybackRate = '1';
let defaultRegion = 'US';
// Proxy address variable
let defaultProxy = false;
let getVideosLocally = true;
let hideWatchedSubs = false;
// This variable is to make sure that proxy was set before making any API calls
let proxyAvailable = false;
let invidiousInstance = 'https://invidio.us';
let checkedSettings = false; // Used to prevent data leak when using self-hosted Invidious Instance
let debugMode = false;
let defaultPage = 'subscriptions';
const colorPalette = {
    red: '#d50000',
    pink: '#C51162',
    purple: '#AA00FF',
    deepPurple: '#6200EA',
    indigo: '#304FFE',
    blue: '#2962FF',
    lightBlue: '#0091EA',
    cyan: '#00B8D4',
    teal: '#00BFA5',
    green: '#00C853',
    lightGreen: '#64DD17',
    lime: '#AEEA00',
    yellow: '#FFD600',
    amber: '#FFAB00',
    orange: '#FF6D00',
    deepOrange: '#DD2C00',
};

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

        if (getVideosLocally) {
            settingsView.localSwitch = true;
        } else {
            settingsView.localSwitch = false;
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

        if (hideWatchedSubs) {
            settingsView.hideWatchedSubs = true;
        } else {
            settingsView.hideWatchedSubs = false;
        }

        document.getElementById('pageSelect').value = defaultPage;
        document.getElementById('playerSelect').value = defaultPlayer;
        document.getElementById('qualitySelect').value = defaultQuality;
        document.getElementById('regionSelect').value = settingsView.region;
        document.getElementById('videoViewSelect').value = settingsView.videoView;
        settingsView.defaultVolume = defaultVolume;
        settingsView.defaultVideoSpeed = defaultPlaybackRate;

        if (defaultProxy) {
            settingsView.proxyAddress = defaultProxy;
        } else {
            settingsView.proxyAddress = "SOCKS5://127.0.0.1:9050";
        }
    });
}

/**
 * Check the user's default settings.  Set the the default settings if none are found.
 *
 * @return {Void}
 */
function checkDefaultSettings() {

    let newSetting;

    let colorPaletteKeys = Object.keys(colorPalette);
    let randomColor = colorPalette[colorPaletteKeys[colorPaletteKeys.length * Math.random() << 0]];

    let settingDefaults = {
        'theme': 'light',
        'useTor': false,
        'history': true,
        'autoplay': true,
        'autoplayPlaylists': true,
        'playNextVideo': false,
        'subtitles': false,
        'updates': true,
        'localScrape': true,
        'player': 'dash',
        'quality': '720',
        'volume': 1,
        'rate': '1',
        'invidious': 'https://invidio.us',
        'proxy': "SOCKS5://127.0.0.1:9050", // This is default value for tor client
        'region': 'US',
        'debugMode': false,
        'startScreen': 'subscriptions',
        'distractionFreeMode': false,
        'hideWatchedSubs': false,
        'videoView': 'grid',
        'profileList': [
          {
            name: 'All Channels',
            color: randomColor
          },
        ],
        'defaultProfile': 'All Channels',
    };

    ft.log(settingDefaults);

    for (let key in settingDefaults) {
        settingsDb.find({
            _id: key
        }, (err, docs) => {
            if (jQuery.isEmptyObject(docs)) {
                newSetting = {
                    _id: key,
                    value: settingDefaults[key]
                };

                settingsDb.insert(newSetting);

                if (key == 'theme') {
                    setTheme('light');
                }

                if (key == 'videoView') {
                    enableGridView();
                }

                if (key == 'profileList') {
                    profileSelectView.profileList = settingDefaults.profileList;
                    profileSelectView.setActiveProfile(0);

                    subDb.find({}, (err, docs) => {
                        if (!jQuery.isEmptyObject(docs)) {
                            docs.forEach((doc) => {
                                subDb.update({
                                    channelId: doc.channelId
                                }, {
                                    $set: {
                                        profile: [{
                                            value: 'All Channels'
                                        }]
                                    }
                                }, {}, (err, newDoc) => {
                                    profileSelectView.setActiveProfile(0);
                                });
                            });
                        }
                    });
                }
            } else {
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
                case 'autoplayPlaylists':
                    settingsView.autoplayPlaylists = docs[0]['value'];
                    break;
                case 'playNextVideo':
                    settingsView.playNextVideo = docs[0]['value'];
                    break;
                case 'subtitles':
                    enableSubtitles = docs[0]['value'];
                    break;
                case 'updates':
                    checkForUpdates = docs[0]['value'];

                    if (checkForUpdates) {
                        checkForNewUpdate();
                    }
                    break;
                case 'player':
                    defaultPlayer = docs[0]['value'];
                    break;
                case 'quality':
                    defaultQuality = docs[0]['value'];
                    break;
                case 'volume':
                    defaultVolume = docs[0]['value'];
                    currentVolume = docs[0]['value'];
                    break;
                case 'rate':
                    defaultPlaybackRate = docs[0]['value'];
                    break;
                case 'proxy':
                    defaultProxy = docs[0]['value'];

                    if (useTor && defaultProxy) {
                        electron.ipcRenderer.send("setProxy", defaultProxy);
                    }
                    break;
                case 'invidious':
                    invidiousInstance = docs[0]['value'].replace(/\/$/, '');
                    settingsView.invidiousInstance = invidiousInstance;
                    break;
                case 'region':
                    defaultRegion = docs[0]['value'];
                    settingsView.region = docs[0]['value'];
                    break;
                case 'localScrape':
                    getVideosLocally = docs[0]['value'];
                    settingsView.localScrape = docs[0]['value'];
                    break;
                case 'debugMode':
                    debugMode = docs[0]['value'];
                    settingsView.debugMode = docs[0]['value'];
                    break;
                case 'startScreen':
                    defaultPage = docs[0]['value'];
                    break;
                case 'distractionFreeMode':
                    settingsView.setDistractionFreeMode(docs[0]['value']);
                    break;
                case 'hideWatchedSubs':
                    hideWatchedSubs = docs[0]['value'];
                    settingsView.hideWatchedSubs = docs[0]['value'];
                    break;
                case 'videoView':
                    settingsView.videoView = docs[0]['value'];
                    if (settingsView.videoView == 'grid') {
                        enableGridView();
                    } else {
                        enableListView();
                    }
                    break;
                case 'profileList':
                    profileSelectView.profileList = docs[0]['value'];
                    break;
                case 'defaultProfile':
                    let profileIndex = profileSelectView.profileList.findIndex(x => x.name === docs[0]['value']);
                    settingsView.defaultProfile = docs[0]['value'];

                    if (profileIndex === -1) {
                        profileSelectView.setActiveProfile(0);
                    } else {
                        profileSelectView.setActiveProfile(profileIndex);
                    }
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
    let autoplayPlaylistsSwitch = document.getElementById('autoplayPlaylistsSwitch').checked;
    let playNextVideoSwitch = document.getElementById('playNextVideoSwitch').checked;
    let subtitlesSwitch = document.getElementById('subtitlesSwitch').checked;
    let updatesSwitch = document.getElementById('updatesSwitch').checked;
    let localSwitch = document.getElementById('localSwitch').checked;
    let pageSelect = document.getElementById('pageSelect').value;
    let playerSelect = document.getElementById('playerSelect').value;
    let qualitySelect = document.getElementById('qualitySelect').value;
    let volumeSelect = document.getElementById('volumeSelect').value;
    let rateSelect = document.getElementById('rateSelect').value;
    let regionSelect = document.getElementById('regionSelect').value;
    let proxyAddress = document.getElementById('proxyAddress').value;
    let invidious = document.getElementById('invidiousInstance').value.replace(/\/$/, '');
    let videoViewType = document.getElementById('videoViewSelect').value;
    let debugMode = document.getElementById('debugSwitch').checked;
    let distractionFreeMode = document.getElementById('distractionFreeModeSwitch').checked;
    let hideSubs = document.getElementById('hideWatchedSubsSwitch').checked;
    let theme = 'light';

    settingsView.useTor = torSwitch;
    settingsView.history = historySwitch;
    settingsView.autoplay = autoplaySwitch;
    settingsView.autoplayPlaylists = autoplayPlaylistsSwitch;
    settingsView.playNextVideo = playNextVideoSwitch;
    settingsView.subtitles = subtitlesSwitch;
    settingsView.updates = updatesSwitch;
    settingsView.proxyAddress = proxyAddress;
    settingsView.localScrape = localSwitch;
    settingsView.debugMode = debugMode;
    rememberHistory = historySwitch;
    defaultQuality = qualitySelect;
    defaultPlaybackRate = rateSelect;
    settingsView.setDistractionFreeMode(distractionFreeMode);
    settingsView.hideWatchedSubs = hideSubs;
    settingsView.videoView = videoViewType;

    //  Remove last list of videos for trending to load new region setting.
    checkTrending = true;
    trendingView.videoList = [];

    if (themeSwitch === true) {
        theme = 'dark';
    }

    // Update default theme
    settingsDb.update({
        _id: 'theme'
    }, {
        value: theme
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
    });

    // Update tor usage.
    settingsDb.update({
        _id: 'useTor'
    }, {
        value: torSwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        useTor = torSwitch;
    });

    // Update proxy address
    settingsDb.update({
        _id: 'proxy'
    }, {
        value: proxyAddress
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        defaultProxy = proxyAddress;
    });

    // Update Invidious Instance
    settingsDb.update({
        _id: 'invidious'
    }, {
        value: invidious
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        settingsView.invidiousInstance = invidious;
        invidiousInstance = invidious;
    });

    // Update history
    settingsDb.update({
        _id: 'history'
    }, {
        value: historySwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        rememberHistory = historySwitch;
    });

    // Update autoplay.
    settingsDb.update({
        _id: 'autoplay'
    }, {
        value: autoplaySwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        autoplay = autoplaySwitch;
    });

    // Update autoplay.
    settingsDb.update({
        _id: 'autoplayPlaylists'
    }, {
        value: autoplayPlaylistsSwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        settingsView.autoplayPlaylists = autoplayPlaylistsSwitch;
    });

    // Update autoplay.
    settingsDb.update({
        _id: 'playNextVideo'
    }, {
        value: playNextVideoSwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        settingsView.playNextVideo = playNextVideoSwitch;
    });

    // Update getting videos locally
    settingsDb.update({
        _id: 'localScrape'
    }, {
        value: localSwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        getVideosLocally = localSwitch;
    });

    // Update subtitles.
    settingsDb.update({
        _id: 'subtitles'
    }, {
        value: subtitlesSwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        enableSubtitles = subtitlesSwitch;
    });

    // Update checkForUpdates.
    settingsDb.update({
        _id: 'updates'
    }, {
        value: updatesSwitch
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        checkForUpdates = updatesSwitch;
    });

    // Update default player.
    settingsDb.update({
        _id: 'player'
    }, {
        value: playerSelect
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        defaultPlayer = playerSelect;
    });

    // Update default quality.
    settingsDb.update({
        _id: 'quality'
    }, {
        value: qualitySelect
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        defaultQuality = qualitySelect;
    });

    // Update default volume.
    settingsDb.update({
        _id: 'volume'
    }, {
        value: volumeSelect
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        defaultVolume = volumeSelect;
        currentVolume = volumeSelect;
    });

    // Update default playback rate.
    settingsDb.update({
        _id: 'rate'
    }, {
        value: rateSelect
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        defaultPlaybackRate = rateSelect;
    });

    // Update default region.
    settingsDb.update({
        _id: 'region'
    }, {
        value: regionSelect
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        settingsView.region = regionSelect;
    });

    // Update debug mode.
    settingsDb.update({
        _id: 'debugMode'
    }, {
        value: debugMode
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        settingsView.debugMode = debugMode;
    });

    // Update start screen.
    settingsDb.update({
        _id: 'startScreen'
    }, {
        value: pageSelect
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
    });

    // Update distraction free mode.
    settingsDb.update({
        _id: 'distractionFreeMode'
    }, {
        value: distractionFreeMode
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
    });

    // Update distraction free mode.
    settingsDb.update({
        _id: 'hideWatchedSubs'
    }, {
        value: hideSubs
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        hideWatchedSubs = hideSubs;
        addSubsToView(subscriptionView.fullVideoList);
    });

    // Update distraction free mode.
    settingsDb.update({
        _id: 'videoView'
    }, {
        value: videoViewType
    }, {}, function (err, numReplaced) {
        ft.log(err);
        ft.log(numReplaced);
        if (settingsView.videoView == 'grid') {
            enableGridView();
        } else {
            enableListView();
        }
    });


    // set proxy in electron based on new values
    if (torSwitch) {
        electron.ipcRenderer.send("setProxy", proxyAddress);
    } else {
        electron.ipcRenderer.send("setProxy", {});
    }

    showToast('Settings have been saved.');
    hideSettingsConfirm();
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
        settingsView.useTheme = true;
    } else {
        setTheme('light');
        currentTheme = 'light';
        settingsView.useTheme = false;
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
        document.getElementById('menuText').src = 'icons/textBlackSmall.png';
        document.getElementById('menuIcon').src = 'icons/iconBlackSmall.png';
        document.getElementById('menuButton').style.color = 'black';
        document.getElementById('reloadButton').style.color = 'black';
        break;
    case 'dark':
        cssFile = './style/darkTheme.css';
        document.getElementById('menuText').src = 'icons/textColorSmall.png';
        document.getElementById('menuIcon').src = 'icons/iconColorSmall.png';
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

function enableGridView() {
    let cssFile;
    const currentView = document.getElementsByTagName("link").item(2);

    // Create a link element
    const newView = document.createElement("link");
    newView.setAttribute("rel", "stylesheet");
    newView.setAttribute("type", "text/css");
    newView.setAttribute("href", './style/videoGrid.css');

    // Replace the current theme with the new theme
    document.getElementsByTagName("head").item(0).replaceChild(newView, currentView);
}

function enableListView() {
    let cssFile;
    const currentView = document.getElementsByTagName("link").item(2);

    // Create a link element
    const newView = document.createElement("link");
    newView.setAttribute("rel", "stylesheet");
    newView.setAttribute("type", "text/css");
    newView.setAttribute("href", './style/videoList.css');

    // Replace the current theme with the new theme
    document.getElementsByTagName("head").item(0).replaceChild(newView, currentView);
}

/**
 * Import Subscriptions from an OPML file.
 *
 * @param {string} subFile - The file location of the OPML file.
 *
 * @return {Void}
 */
function importOpmlSubs(json) {
    if (!json[0]['folder'].includes('YouTube')) {
        showToast('Invalid OPML File.  Import is unsuccessful.');
        return;
    }

    showToast('Importing subscriptions, please wait.');

    progressView.seen = true;
    progressView.width = 0;

    let counter = 0;
    json.forEach((channel, index) => {
        let channelId = channel['xmlurl'].replace('https://www.youtube.com/feeds/videos.xml?channel_id=', '');

        invidiousAPI('channels', channelId, {}, (data) => {
            let subscription = {
                channelId: data.authorId,
                channelName: data.author,
                channelThumbnail: data.authorThumbnails[2].url
            };

            addSubscription(subscription, false);
            counter++;
            progressView.progressWidth = (counter / json.length) * 100;

            if ((counter + 1) == json.length) {
                showToast('Subscriptions have been imported!');
                progressView.seen = false;
                progressView.seen = 0;
                return;
            }
        });
    });
}

/**
 * Import a subscriptions file that the user provides.
 *
 * @return {Void}
 */
function importSubscriptions() {
    const appDatabaseFile = localDataStorage + '/subscriptions.db';

    // Open user's file browser.  Only show .db files.
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
            name: 'Database File',
            extensions: ['*']
        }, ]
    }, function (fileLocation) {
        if (typeof (fileLocation) === 'undefined') {
            ft.log('Import Aborted');
            return;
        }
        ft.log(fileLocation);
        let i = fileLocation[0].lastIndexOf('.');
        let fileType = (i < 0) ? '' : fileLocation[0].substr(i);
        ft.log(fileType);

        fs.readFile(fileLocation[0], function (readErr, data) {
            if (readErr) {
                showToast('Unable to read file.  File may be corrupt or have invalid permissions.');
                throw readErr;
            }

            if (data.includes("<opml")) {
                getOpml(data, function (error, json) {
                    if (!error) {
                        clearFile('subscriptions', false);
                        importOpmlSubs(json['children'][0]['children']);
                    }
                });
                return;
            } else if ((fileType === '.json') && (data.includes("app_version"))) {
                importNewpipeSubscriptions(data);
                return;
            } else if ((fileType !== '.db') && (fileType !== '.json')) {
                showToast('Incorrect file type.  Import unsuccessful.');
                return;
            }

            subDb.remove({}, {
                multi: true
            }, function (err, numRemoved) {});
            let textDecode = new TextDecoder("utf-8").decode(data);
            textDecode = textDecode.split("\n");
            textDecode.pop();
            console.log(textDecode);

            textDecode.forEach((data) => {
                let parsedData = JSON.parse(data);

                let newSubscription = {
                    channelId: parsedData.channelId,
                    channelName: parsedData.channelName,
                    channelThumbnail: parsedData.channelThumbnail,
                }

                if (typeof (parsedData.profile) !== 'undefined') {
                    let profileList = [];
                    parsedData.profile.forEach((profile) => {
                        if (profileList.indexOf(profile.value) !== -1) {
                            console.log('found duplicate');
                            return;
                        }

                        profileList.push(profile.value);

                        // Sometimes adding the same channel to the database too fast
                        // will duplicate the channel in the wrong profile.  The wait
                        // time to add to the database is randomized to prevent this.
                        let randomNumber = Math.floor((Math.random() * 10000) + 1);
                        window.setTimeout(() => {
                            let existingProfileIndex = profileSelectView.profileList.findIndex(x => x.name === profile);
                            if (existingProfileIndex === -1) {
                                // User doesn't have this profile, let's create it.

                                let colorPaletteKeys = Object.keys(colorPalette);
                                let randomColor = colorPalette[colorPaletteKeys[colorPaletteKeys.length * Math.random() << 0]];
                                editProfileView.isNewProfile = true;
                                editProfileView.newProfileColorText = randomColor;
                                editProfileView.newProfileName = profile.value;
                                editProfileView.updateProfile(false);
                            }
                            addSubscription(newSubscription, true, profile.value);
                            displaySubs();
                        }, randomNumber);
                    });
                } else {
                    let randomNumber = Math.floor((Math.random() * 1000) + 1);
                    window.setTimeout(() => {
                        addSubscription(newSubscription)
                    }, randomNumber);
                }
            });

            window.setTimeout(() => {
                displaySubs()
            }, 8000);
        })
    });
}
/**
 * Import NewPipe Channel Subscriptions
 * @return {Void}
 */
function importNewpipeSubscriptions(data) {

    progressView.seen = true;
    progressView.width = 0;
    showToast('Importing Newpipe Subscriptions, Please Wait.');

    let newpipe, n, link, newpipesub, counter;

    newpipe = JSON.parse(data);
    counter = 0;

    for (n in newpipe.subscriptions) {

        link = newpipe.subscriptions[n].url.split("/");

        invidiousAPI('channels', link[4], {}, (data) => {
            newpipesub = {
                channelId: data.authorId,
                channelName: data.author,
                channelThumbnail: data.authorThumbnails[2].url
            };
            addSubscription(newpipesub, false);
            counter++;
            progressView.progressWidth = (counter / newpipe.subscriptions.length) * 100;

            if ((counter + 1) == newpipe.subscriptions.length) {
                showToast('Subscriptions have been imported!');
                progressView.seen = false;
                progressView.seen = 0;
                return;
            }
        });
    }
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

    if (dateMonth < 10) {
        dateMonth = '0' + dateMonth;
    }

    let dateDay = date.getDate();

    if (dateDay < 10) {
        dateDay = '0' + dateDay;
    }

    const dateYear = date.getFullYear();
    const dateString = 'freetube-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay + '.db';

    switch (document.querySelector('#exportSelect').value) {

    case "NewPipe":
        exportNewpipeSubscriptions(dateYear, dateMonth, dateDay);
        break;
    case "OPML":
        exportOpmlSubscriptions(dateYear, dateMonth, dateDay);
        break;
    default:
        // Open user file browser. User gives location of file to be created.
        dialog.showSaveDialog({
            defaultPath: dateString,
            filters: [{
                name: 'Database File',
                extensions: ['db']
            }, ]
        }, function (fileLocation) {
            ft.log(fileLocation);
            if (typeof (fileLocation) === 'undefined') {
                ft.log('Export Aborted');
                return;
            }
            fs.readFile(appDatabaseFile, function (readErr, data) {
                if (readErr) {
                    throw readErr;
                }
                fs.writeFile(fileLocation, data, function (writeErr) {
                    if (writeErr) {
                        throw writeErr;
                    }
                    showToast('Susbcriptions have been successfully exported');
                });
            })
        });
    }
}
/**
 * Export the subscriptions database compatable with NewPipe.
 *
 * @return {Void}
 */
function exportNewpipeSubscriptions(dateYear, dateMonth, dateDay) {

    const dateString = 'newpipe-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay;

    dialog.showSaveDialog({
        defaultPath: dateString,
        filters: [{
            name: 'JSON',
            extensions: ['json']
        }, ]
    }, function (fileLocation) {
        ft.log(fileLocation);
        if (typeof (fileLocation) === 'undefined') {
            ft.log('Export Aborted');
            return;
        }
        returnSubscriptions().then((result) => {
            let newpipe = {
                app_version: "0.16.1",
                app_version_int: 730,
                subscriptions: []
            }
            for (let i = 0; i < result.length; i++) {

                let subs = {
                    service_id: 0,
                    url: `https://youtube.com/channel/${result[i].channelId}`,
                    name: result[i].channelName,
                };

                newpipe.subscriptions.push(subs);
            }

            fs.writeFile(fileLocation, JSON.stringify(newpipe), function (writeErr) {
                if (writeErr) {
                    throw writeErr;
                } else {
                    showToast('Susbcriptions have been successfully exported');
                    return;
                }
            });
        });
    });
}
/**
 * Export subscriptions database as OPML.
 *
 * @return {Void}
 */
function exportOpmlSubscriptions(dateYear, dateMonth, dateDay) {

    const dateString = 'freetube-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay;

    dialog.showSaveDialog({
        defaultPath: dateString,
        filters: [{
            name: 'OPML',
            extensions: ['opml']
        }, ]
    }, function (fileLocation) {
        ft.log(fileLocation);
        if (typeof (fileLocation) === 'undefined') {
            ft.log('Export Aborted');
            return;
        }
        returnSubscriptions().then((result) => {

            let opml = `<opml version="1.1"><body><outline text="YouTube Subscriptions" title="YouTube Subscriptions">`;

            for (let i = 0; i < result.length; i++) {

                let subs = `<outline text="${result[i].channelName}" title="${result[i].channelName}" type="rss" xmlUrl="https://www.youtube.com/feeds/videos.xml?channel_id=${result[i].channelId}"/>`;

                if (i === result.length - 1) {

                    subs += `</outline></body></opml>`;
                }
                opml += subs;
            }

            fs.writeFile(fileLocation, opml, function (writeErr) {
                if (writeErr) {
                    throw writeErr;
                }
                if (i === result.length - 1) {
                    showToast('Susbcriptions have been successfully exported');
                    return;
                }
            });
        });
    });
}
/**
 * Clear out the data in a file.
 *
 * @param {string} type - The type of file to be cleared.
 */
function clearFile(type, showMessage = true) {
    ft.log(type);
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
    fs.writeFile(dataBaseFile, '', function (err) {
        if (err) {
            throw err;
        }

        if (showMessage) {
            showToast('File has been cleared. Restart FreeTube to see the changes');
        }
    })
}

function showSettingsConfirm() {
    $('#confirmSettings').get(0).style.opacity = 0.9;
}

function hideSettingsConfirm() {
    $('#confirmSettings').get(0).style.opacity = 0;
}

checkDefaultSettings();
