'use strict';

/**
 * Title Text
 *
 * This feature adds text to the top left of the player.  Typically this text is used for the video title.
 */

// Feature configuration
Object.assign(mejs.MepDefaults, {
	/**
	 * @type {?String}
	 */
	title: null
});

Object.assign(MediaElementPlayer.prototype, {
	/**
	 * Feature constructor.
	 *
	 * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
	 * @param {MediaElementPlayer} player
	 */
	buildtitle (player)  {
		const
			t = this,
			titleDiv = document.createElement('div')
		;

		titleDiv.className = 'mejs__title';
		titleDiv.innerHTML = '<span>' + t.options.title + '</span>';

		t.container.children[0].appendChild(titleDiv);

		//t.container.children[0].children[1].appendChild(titleDiv);

		console.log(t);
		console.log(t.container);
	}
});
