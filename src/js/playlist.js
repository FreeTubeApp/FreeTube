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

function showPlaylist(playlistId) {
    hideViews();
    loadingView.seen = true;

    playlistView.videoList = [];

    invidiousAPI('playlists', playlistId, {}, (data) => {
        ft.log(data);

        playlistView.playlistId = playlistId;
        playlistView.channelName = data.author;
        playlistView.channelId = data.authorId;
        playlistView.channelThumbnail = data.authorThumbnails[3].url;
        playlistView.title = data.title;
        playlistView.videoCount = data.videoCount;
        playlistView.viewCount = data.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        playlistView.thumbnail = data.videos[Math.floor((Math.random() * data.videos.length) + 1)].videoThumbnails[0].url;
        playlistView.description = data.descriptionHtml;
        let dateString = new Date(data.updated * 1000);
        dateString.setDate(dateString.getDate() + 1);
        playlistView.lastUpdated = dateFormat(dateString, "mmm dS, yyyy");

        let amountOfPages = Math.ceil(data.videoCount / 100);

        ft.log(amountOfPages);

        for (let i = 1; i <= amountOfPages; i++) {
            invidiousAPI('playlists', playlistId, {
                page: i
            }, (data) => {
                ft.log(data);
                data.videos.forEach((video) => {
                    let videoData = {};

                    let time = video.lengthSeconds;
                    let hours = 0;

                    if (time >= 3600) {
                        hours = Math.floor(time / 3600);
                        time = time - hours * 3600;
                    }

                    let minutes = Math.floor(time / 60);
                    let seconds = time - minutes * 60;

                    if (seconds < 10) {
                        seconds = '0' + seconds;
                    }

                    if (minutes < 10 && hours > 0) {
                        minutes = '0' + minutes;
                    }

                    if (hours > 0) {
                        videoData.duration = hours + ":" + minutes + ":" + seconds;
                    } else {
                        videoData.duration = minutes + ":" + seconds;
                    }

                    videoData.id = video.videoId;
                    videoData.title = video.title;
                    videoData.channelName = video.author;
                    videoData.channelId = video.authorId;
                    videoData.thumbnail = video.videoThumbnails[4].url;

                    playlistView.videoList[video.index] = videoData;
                });
                if (playlistView.seen !== false) {
                    playlistView.seen = false;
                    playlistView.seen = true;
                }
            });

            loadingView.seen = false;
            playlistView.seen = true;
        }
    });
}

function togglePlaylist() {
    if (playerView.playlistShowList !== false) {
        playerView.playlistShowList = false;
    } else {
        playerView.playlistShowList = true;
    }
}
