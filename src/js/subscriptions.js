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
 * File for all functions related to subscriptions.
 */

let subscriptionTimer;
let forceTimer;
let checkSubscriptions = true;
let forceSubs = true;

/**
 * Add a channel to the user's subscription database.
 *
 * @param {string} channelId - The channel ID to add to the subscriptions database.
 *
 * @return {Void}
 */
function addSubscription(channelId, useToast = true) {
    ft.log('Channel ID: ', channelId);

    invidiousAPI('channels', channelId, {}, (data) => {
        const channelName = data.author;
        const thumbnail = data.authorThumbnails[3].url;

        const channel = {
            channelId: data.authorId,
            channelName: channelName,
            channelThumbnail: thumbnail,
        };

        // Refresh the list of subscriptions on the side navigation bar.
        subDb.insert(channel, (err, newDoc) => {
            if (useToast) {
                showToast('Added ' + channelName + ' to subscriptions.');
                displaySubs();
            }
        });
    });
}

/**
 * Remove a channel from the subscriptions database.
 *
 * @param {string} channelId - The channel ID to be removed.
 *
 * @return {Void}
 */
function removeSubscription(channelId) {
    subDb.remove({
        channelId: channelId
    }, {}, (err, numRemoved) => {
        // Refresh the list of subscriptions on the side navigation bar.
        displaySubs();
        showToast('Removed channel from subscriptions.');
    });
}

/**
 * Load the recent uploads of the user's subscriptions.
 *
 * @return {Void}
 */
function loadSubscriptions() {
    if (checkSubscriptions === false && subscriptionView.videoList.length > 0) {
        console.log('Will not load subscriptions. Timer still on.');
        loadingView.seen = false;
        return;
    } else {
        showToast('Refreshing Subscription List.  Please wait...');
        checkSubscriptions = false;
        progressView.seen = true;
    }

    let videoList = [];

    const subscriptions = returnSubscriptions();

    subscriptions.then((results) => {
        let channelId = '';
        let videoList = [];

        if (results.length > 0) {
            let counter = 0;

            for (let i = 0; i < results.length; i++) {
                channelId = results[i]['channelId'];

                invidiousAPI('channels/videos', channelId, {}, (data) => {
                    console.log(data);
                    videoList = videoList.concat(data);
                    counter = counter + 1;
                    progressView.progressWidth = (counter / results.length) * 100;

                    if (counter === results.length) {
                        addSubsToView(videoList);
                    }
                }, (errorData) => {
                    showToast('Unable to load channel: ' + results[i]['channelName']);
                    counter = counter + 1;
                    progressView.progressWidth = (counter / results.length) * 100;
                    if (counter === results.length) {
                        addSubsToView(videoList);
                    }
                });
            }
        } else {
            // User has no subscriptions. Display message.
            loadingView.seen = false;
            headerView.seen = false;
            noSubscriptions.seen = true;
        }
    });
}

function addSubsToView(videoList) {
    videoList = videoList.filter(a => {
        return !a.premium;
    });

    videoList.sort((a, b) => {
        return b.published - a.published;
    });

    subscriptionView.videoList = [];
    console.log(videoList);

    if (videoList.length > 100) {
        for (let i = 0; i < 100; i++) {
            displayVideo(videoList[i], 'subscriptions');
        }
    } else {
        videoList.forEach((video) => {
            displayVideo(video, 'subscriptions');
        });
    }

    loadingView.seen = false;
    progressView.seen = false;
    progressView.progressWidth = 0;

    subscriptionTimer = window.setTimeout(() => {
        checkSubscriptions = true;
    }, 7200000);

    console.log('Done');
}

function forceSubscriptions() {
    if (progressView.progressWidth > 0) {
        showToast('Please wait for subscriptions to finish loading before trying again.');
        return;
    } else if (forceSubs === false) {
        showToast('Too many attempts.  Please wait before loading subscriptions again.');
        return;
    } else {
        window.clearTimeout(subscriptionTimer);
        checkSubscriptions = true;
        loadSubscriptions();
        forceSubs = false;
    }
    forceTimer = window.setTimeout(() => {
        forceSubs = true;
    }, 300000);
}

/**
 * Get the list of subscriptions from the user's subscription database.
 *
 * @return {promise} The list of subscriptions.
 */
function returnSubscriptions() {
    return new Promise((resolve, reject) => {
        subDb.find({}, (err, subs) => {
            resolve(subs);
        });
    });
}

/**
 * Display the list of subscriptions on the side navigation bar.
 *
 * @return {Void}
 */
function displaySubs() {
    const subList = document.getElementById('subscriptions');

    subList.innerHTML = '';

    // Sort alphabetically
    subDb.find({}).sort({
        channelName: 1
    }).exec((err, subs) => {
        subs.forEach((channel) => {
            // Grab subscriptions.html to be used as a template.
            const subsTemplate = require('./templates/subscriptions.html')
            mustache.parse(subsTemplate);
            const rendered = mustache.render(subsTemplate, {
                channelIcon: channel['channelThumbnail'],
                channelName: channel['channelName'],
                channelId: channel['channelId'],
            });
            // Render template to page.
            const subscriptionsHtml = $('#subscriptions').html();
            $('#subscriptions').html(subscriptionsHtml + rendered);
        });
    });

    // Add onclick function
    $('#subscriptions .fa-times').onClick = removeSubscription;
}

/**
 * Adds / Removes a subscription based on if the channel is in the database or not.
 * @param {string} channelId - The channel ID to check
 *
 * @return {Void}
 */
function toggleSubscription(channelId) {
    event.stopPropagation();

    const checkIfSubscribed = isSubscribed(channelId);
    const subscribeButton = document.getElementById('subscribeButton');

    checkIfSubscribed.then((results) => {

        if (results === false) {
            if (subscribeButton != null) {
                subscribeButton.innerHTML = 'UNSUBSCRIBE';
            }
            addSubscription(channelId);
        } else {
            if (subscribeButton != null) {
                subscribeButton.innerHTML = 'SUBSCRIBE';
            }
            removeSubscription(channelId);
        }
    });
}

/**
 * Check if the user is subscribed to a channel or not.
 *
 * @param {string} channelId - The channel ID to check
 *
 * @return {promise} - A boolean value if the channel is currently subscribed or not.
 */
function isSubscribed(channelId) {
    return new Promise((resolve, reject) => {
        subDb.find({
            channelId: channelId
        }, (err, docs) => {
            if (jQuery.isEmptyObject(docs)) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}
