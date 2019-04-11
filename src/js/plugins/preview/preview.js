'use strict';

/**
 * Preview feature
 *
 * This feature allows to create a preview effect on videos (playing on hover and with possibility of mute/fade-in/fade-out audio)
 */


// Feature configuration
Object.assign(mejs.MepDefaults, {
	/**
	 * Media starts playing when users mouse hovers on it, and resets when leaving player area
	 * @type {Boolean}
	 */
	previewMode: false,
	/**
	 * When playing on preview mode, turn on/off audio completely
	 * @type {Boolean}
	 */
	muteOnPreviewMode: true,
	/**
	 * If fade in set in, time when it starts fading in
	 * @type {Number}
	 */
	fadeInAudioStart: 0,
	/**
	 * When playing media, time interval to fade in audio (must be greater than zero)
	 * @type {Number}
	 */
	fadeInAudioInterval: 0,
	/**
	 * If fade out set in, time when it starts fading out
	 * @type {Number}
	 */
	fadeOutAudioStart: 0,
	/**
	 * When playing media, time interval to fade out audio (must be greater than zero)
	 * @type {Number}
	 */
	fadeOutAudioInterval: 0,
	/**
	 * Percentage in decimals in which media will fade in/out (i.e., 0.02 = 2%)
	 * @type {Number}
	 */
	fadePercent: 0.02,
	/**
	 * Whether reset or not the media
	 * @type {Boolean}
	 */
	pauseOnlyOnPreview: false,
	/**
	 * Delay in milliseconds to start previewing media
	 * @type {Number}
	 */
	delayPreview: 0
});

Object.assign(MediaElementPlayer.prototype, {

	/**
	 * Feature constructor.
	 *
	 * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
	 * @param {MediaElementPlayer} player
	 */
	buildpreview (player) {
		let
			initFadeIn = false,
			initFadeOut = false,
			timeout,
			mouseOver = false
		;

		const
			t = this,
			fadeInCallback = () => {
				if (t.options.fadeInAudioInterval) {

					if (Math.floor(t.media.currentTime) < t.options.fadeIntAudioStart) {
						t.media.setVolume(0);
						t.media.setMuted(true);
					}

					if (Math.floor(t.media.currentTime) === t.options.fadeInAudioStart) {

						initFadeIn = true;

						let
							volume = 0,
							audioInterval = t.options.fadeInAudioInterval,
							interval = setInterval(() => {

								// Increase volume by step as long as it is below 1
								if (volume < 1) {
									volume += t.options.fadePercent;
									if (volume > 1) {
										volume = 1;
									}

									// limit to 2 decimal places
									t.media.setVolume(volume.toFixed(2));

								} else {
									// Stop firing interval when 1 is reached
									clearInterval(interval);
									interval = null;
									t.media.setMuted(false);
									setTimeout(() => {
										initFadeIn = false;
									}, 300);
								}

							}, audioInterval)
						;
					}
				}
			},
			fadeOutCallback = () => {
				if (t.options.fadeOutAudioInterval) {

					if (Math.floor(t.media.currentTime) < t.options.fadeOutAudioStart) {
						t.media.setVolume(1);
						t.media.setMuted(false);
					}

					if (Math.floor(t.media.currentTime) === t.options.fadeOutAudioStart) {

						initFadeOut = true;

						let
							volume = 1,
							audioInterval = t.options.fadeOutAudioInterval,
							interval = setInterval(() => {

								// Increase volume by step as long as it is above 0

								if (volume > 0) {
									volume -= t.options.fadePercent;
									if (volume < 0) {
										volume = 0;
									}

									// limit to 2 decimal places
									t.media.setVolume(volume.toFixed(2));

								} else {
									// Stop firing interval when 0 is reached
									clearInterval(interval);
									interval = null;
									t.media.setMuted(false);
									setTimeout(() => {
										initFadeOut = false;
									}, 300);
								}
							}, audioInterval)
						;
					}
				}
			}
		;

		if (t.options.muteOnPreviewMode || t.options.fadeInAudioInterval) {
			t.media.setVolume(0);
			t.media.setMuted(true);
		} else if (t.options.fadeOutAudioInterval) {
			t.media.setVolume(1);
			t.media.setMuted(false);
		}

		// fade-in/out should be available for both video/audio
		t.media.addEventListener('timeupdate', () => {

			if (initFadeIn) {
				t.media.removeEventListener('timeupdate', fadeInCallback);
				return;
			}

			if (initFadeOut) {
				t.media.removeEventListener('timeupdate', fadeOutCallback);
				return;
			}

			fadeInCallback();
			fadeOutCallback();
		});

		// preview is only for video
		if (!player.isVideo) {
			return;
		}

		// show/hide controls
		document.body.addEventListener('mouseover', (e) => {

			if (e.target === t.container || e.target.closest(`.${t.options.classPrefix}container`)) {
				mouseOver = true;
				t.container.querySelector(`.${t.options.classPrefix}overlay-loading`).parentNode.style.display = 'flex';
				t.container.querySelector(`.${t.options.classPrefix}overlay-play`).style.display = 'none';
				if (t.media.paused) {
					timeout = setTimeout(() => {
						if (mouseOver) {
							t.media.play();
						} else {
							clearTimeout(timeout);
							timeout = null;
						}
						t.container.querySelector(`.${t.options.classPrefix}overlay-loading`).parentNode.style.display = 'none';

					}, t.options.delayPreview);
				} else {
					t.container.querySelector(`.${t.options.classPrefix}overlay-loading`).parentNode.style.display = 'none';
				}
			} else {
				mouseOver = false;
				clearTimeout(timeout);
				timeout = null;
				if (!t.media.paused) {
					t.media.pause();
				}
				t.container.querySelector(`.${t.options.classPrefix}overlay-loading`).parentNode.style.display = 'none';
			}

		});
		document.body.addEventListener('mouseout', (e) => {
			if (!(e.target === t.container) && !(e.target.closest(`.${t.options.classPrefix}container`))) {
				mouseOver = false;
				t.container.querySelector(`.${t.options.classPrefix}overlay-loading`).parentNode.style.display = 'none';
				if (!t.media.paused) {
					t.media.pause();

					if (!t.options.pauseOnlyOnPreview) {
						t.media.setCurrentTime(0);
					}
				}

				clearTimeout(timeout);
				timeout = null;
			}
		});

		window.addEventListener('scroll', () => {
			mouseOver = false;
			t.container.querySelector(`.${t.options.classPrefix}overlay-loading`).parentNode.style.display = 'none';
			if (!t.media.paused) {
				t.media.pause();
			}
		});
	}
});