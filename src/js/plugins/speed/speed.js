'use strict';

/**
 * Speed button
 *
 * This feature creates a button to speed media in different levels.
 */

// Translations (English required)
mejs.i18n.en['mejs.speed-rate'] = 'Speed Rate';

// Feature configuration
Object.assign(mejs.MepDefaults, {
	/**
	 * The speeds media can be accelerated
	 *
	 * Supports an array of float values or objects with format
	 * [{name: 'Slow', value: '0.75'}, {name: 'Normal', value: '1.00'}, ...]
	 * @type {{String[]|Object[]}}
	 */
	speeds: ['2.00', '1.50', '1.25', '1.00', '0.75'],
	/**
	 * @type {String}
	 */
	defaultSpeed: '1.00',
	/**
	 * @type {String}
	 */
	speedChar: 'x',
	/**
	 * @type {?String}
	 */
	speedText: null
});

Object.assign(MediaElementPlayer.prototype, {

	/**
	 * Feature constructor.
	 *
	 * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
	 * @param {MediaElementPlayer} player
	 * @param {HTMLElement} controls
	 * @param {HTMLElement} layers
	 * @param {HTMLElement} media
	 */
	buildspeed (player, controls, layers, media)  {
		const
			t = this,
			isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName)
		;

		if (!isNative) {
			return;
		}

		const
			speeds = [],
			speedTitle = mejs.Utils.isString(t.options.speedText) ? t.options.speedText : mejs.i18n.t('mejs.speed-rate'),
			getSpeedNameFromValue = (value) => {
				for (let i = 0, total = speeds.length; i < total; i++) {
					if (speeds[i].value === value) {
						return speeds[i].name;
					}
				}
			}
		;

		let
			playbackSpeed,
			defaultInArray = false
		;

		for (let i = 0, total = t.options.speeds.length; i < total; i++) {
			const s = t.options.speeds[i];

			if (typeof s === 'string') {
				speeds.push({
					name: `${s}${t.options.speedChar}`,
					value: s
				});

				if (s === t.options.defaultSpeed) {
					defaultInArray = true;
				}
			}
			else {
				speeds.push(s);
				if (s.value === t.options.defaultSpeed) {
					defaultInArray = true;
				}
			}
		}

		if (!defaultInArray) {
			speeds.push({
				name: t.options.defaultSpeed + t.options.speedChar,
				value: t.options.defaultSpeed
			});
		}

		speeds.sort((a, b) => {
			return parseFloat(b.value) - parseFloat(a.value);
		});

		t.cleanspeed(player);

		player.speedButton = document.createElement('div');
		player.speedButton.className = `${t.options.classPrefix}button ${t.options.classPrefix}speed-button`;
		player.speedButton.innerHTML = `<button type="button" aria-controls="${t.id}" title="${speedTitle}" ` +
			`aria-label="${speedTitle}" tabindex="0">${getSpeedNameFromValue(t.options.defaultSpeed)}</button>` +
			`<div class="${t.options.classPrefix}speed-selector ${t.options.classPrefix}offscreen">` +
				`<ul class="${t.options.classPrefix}speed-selector-list"></ul>` +
			`</div>`;

		t.addControlElement(player.speedButton, 'speed');

		for (let i = 0, total = speeds.length; i < total; i++) {

			const inputId = `${t.id}-speed-${speeds[i].value}`;

			player.speedButton.querySelector('ul').innerHTML += `<li class="${t.options.classPrefix}speed-selector-list-item">` +
				`<input class="${t.options.classPrefix}speed-selector-input" type="radio" name="${t.id}_speed"` +
					`disabled="disabled" value="${speeds[i].value}" id="${inputId}"  ` +
					`${(speeds[i].value === t.options.defaultSpeed ? ' checked="checked"' : '')}/>` +
				`<label for="${inputId}" class="${t.options.classPrefix}speed-selector-label` +
					`${(speeds[i].value === t.options.defaultSpeed ? ` ${t.options.classPrefix}speed-selected` : '')}">` +
					`${speeds[i].name}</label>` +
				`</li>`;
		}

		playbackSpeed = t.options.defaultSpeed;

		player.speedSelector = player.speedButton.querySelector(`.${t.options.classPrefix}speed-selector`);

		const
			inEvents = ['mouseenter', 'focusin'],
			outEvents = ['mouseleave', 'focusout'],
			// Enable inputs after they have been appended to controls to avoid tab and up/down arrow focus issues
			radios = player.speedButton.querySelectorAll('input[type="radio"]'),
			labels = player.speedButton.querySelectorAll(`.${t.options.classPrefix}speed-selector-label`)
		;

		// hover or keyboard focus
		for (let i = 0, total = inEvents.length; i < total; i++) {
			player.speedButton.addEventListener(inEvents[i], () => {
				mejs.Utils.removeClass(player.speedSelector, `${t.options.classPrefix}offscreen`);
				player.speedSelector.style.height = player.speedSelector.querySelector('ul').offsetHeight;
				player.speedSelector.style.top = `${(-1 * parseFloat(player.speedSelector.offsetHeight))}px`;
			});
		}

		for (let i = 0, total = outEvents.length; i < total; i++) {
			player.speedSelector.addEventListener(outEvents[i], function () {
				mejs.Utils.addClass(this, `${t.options.classPrefix}offscreen`);
			});
		}

		for (let i = 0, total = radios.length; i < total; i++) {
			const radio = radios[i];
			radio.disabled = false;
			radio.addEventListener('click', function() {
				const
					self = this,
					newSpeed = self.value
				;

				playbackSpeed = newSpeed;
				media.playbackRate = parseFloat(newSpeed);
				player.speedButton.querySelector('button').innerHTML = (getSpeedNameFromValue(newSpeed));
				const selected = player.speedButton.querySelectorAll(`.${t.options.classPrefix}speed-selected`);
				for (let i = 0, total = selected.length; i < total; i++) {
					mejs.Utils.removeClass(selected[i], `${t.options.classPrefix}speed-selected`);
				}

				self.checked = true;
				const siblings = mejs.Utils.siblings(self, (el) => mejs.Utils.hasClass(el, `${t.options.classPrefix}speed-selector-label`));
				for (let j = 0, total = siblings.length; j < total; j++) {
					mejs.Utils.addClass(siblings[j], `${t.options.classPrefix}speed-selected`);
				}
			});
		}

		for (let i = 0, total = labels.length; i < total; i++) {
			labels[i].addEventListener('click',  function () {
				const
					radio = mejs.Utils.siblings(this, (el) => el.tagName === 'INPUT')[0],
					event = mejs.Utils.createEvent('click', radio)
				;
				radio.dispatchEvent(event);
			});
		}

		//Allow up/down arrow to change the selected radio without changing the volume.
		player.speedSelector.addEventListener('keydown', (e) => {
			e.stopPropagation();
		});

		media.addEventListener('loadedmetadata', () => {
			if (playbackSpeed) {
				media.playbackRate = parseFloat(playbackSpeed);
			}
		});
	},
	/**
	 * Feature destructor.
	 *
	 * Always has to be prefixed with `clean` and the name that was used in MepDefaults.features list
	 * @param {MediaElementPlayer} player
	 */
	cleanspeed (player)  {
		if (player) {
			if (player.speedButton) {
				player.speedButton.parentNode.removeChild(player.speedButton);
			}
			if (player.speedSelector) {
				player.speedSelector.parentNode.removeChild(player.speedSelector);
			}
		}
	}
});