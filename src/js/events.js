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
* File for events within application.  Work needs to be done throughout the application
* to use this style more.  Please use this style going forward if possible.
*/

  /**
   * Event when user clicks comment box,
   * and wants to show/display comments for the user.
   */
  let showComments = function(event) {
    let comments = $('#comments');

    if (comments.css('display') === 'none') {
      comments.attr('loaded', 'true');

      let commentsTemplate = $.get('templates/comments.html');

      commentsTemplate.done((template) => {
        let request = gapi.client.youtube.commentThreads.list({
          'videoId': $('#comments').attr('data-video-id'),
          'part': 'snippet,replies',
          'maxResults': 100,
        });

        request.execute((data) => {
          let comments = [];
          let items = data.items;

          items.forEach((object) => {
            let snippet = object['snippet']['topLevelComment']['snippet'];
            let dateString = new Date(snippet.publishedAt);
            let publishedDate = dateFormat(dateString, "mmm dS, yyyy");

            snippet.publishedAt = publishedDate;

            comments.push(snippet);
          })
          const html = mustache.render(template, {
            comments: comments,
          });
          $('#comments').html(html);
        });
      });

      comments.show();
    } else {
      comments.hide();
    }
  };

  /**
  * Play / Pause the video player upon click.
  */
  let playPauseVideo = function(event) {
    let el = event.currentTarget;
    el.paused ? el.play() : el.pause();
  }

  /**
   * ---------------------------
   * Bind click events
   * --------------------------
   */
  $(document).on('click', '#showComments', showComments);

  $(document).on('click', '.videoPlayer', playPauseVideo);

  $(document).on('click', '#confirmNo', hideConfirmFunction);
