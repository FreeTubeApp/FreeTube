'use strict';

/**
 * Loop button
 *
 * This feature creates a loop button in the control bar to toggle its behavior. It will restart media once finished
 * if activated
 */

// Translations (English required)
mejs.i18n.en['mejs.loop'] =  'Toggle Loop';

// Feature configuration
Object.assign(mejs.MepDefaults, {
	/**
	 * @type {?String}
	 */
	loopText: null
});

Object.assign(MediaElementPlayer.prototype, {
	/**
	 * Feature constructor.
	 *
	 * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
	 * @param {MediaElementPlayer} player
	 */
	buildloop (player)  {
		const
			t = this,
			loopTitle = mejs.Utils.isString(t.options.loopText) ? t.options.loopText : mejs.i18n.t('mejs.loop'),
			loop = document.createElement('div')
		;

		loop.className = `${t.options.classPrefix}button ${t.options.classPrefix}loop-button ${((player.options.loop) ? `${t.options.classPrefix}loop-on` : `${t.options.classPrefix}loop-off`)}`;
		loop.innerHTML = `<button type="button" aria-controls="${t.id}" title="${loopTitle}" aria-label="${loopTitle}" tabindex="0"></button>`;

		t.addControlElement(loop, 'loop');

		// add a click toggle event
		loop.addEventListener('click', () => {
			player.options.loop = !player.options.loop;
			if (player.options.loop) {
				mejs.Utils.removeClass(loop, `${t.options.classPrefix}loop-off`);
				mejs.Utils.addClass(loop, `${t.options.classPrefix}loop-on`);
			} else {
				mejs.Utils.removeClass(loop, `${t.options.classPrefix}loop-on`);
				mejs.Utils.addClass(loop, `${t.options.classPrefix}loop-off`);
			}
		});
	}
});


