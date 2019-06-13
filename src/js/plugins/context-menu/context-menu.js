'use strict';

// Translations (English required)
mejs.i18n.en['mejs.fullscreen-off'] = 'Turn off Fullscreen';
mejs.i18n.en['mejs.fullscreen-on'] = 'Go Fullscreen';
mejs.i18n.en['mejs.download-video'] = 'Download Video';

/*
 * ContextMenu
 *
 */
Object.assign(mejs.MepDefaults, {
	contextMenuItems: [{
		// demo of a fullscreen option
			render (player) {

				// check for fullscreen plugin
				if (player.enterFullScreen === undefined) {
					return null;
				}

				if (player.isFullScreen) {
					return mejs.i18n.t('mejs.fullscreen-off');
				} else {
					return mejs.i18n.t('mejs.fullscreen-on');
				}
			},
			click (player) {
				if (player.isFullScreen) {
					player.exitFullScreen();
				} else {
					player.enterFullScreen();
				}
			}
		},
		// demo of a mute/unmute button
		{
			render (player) {
				if (player.media.muted) {
					return mejs.i18n.t('mejs.unmute');
				} else {
					return mejs.i18n.t('mejs.mute');
				}
			},
			click (player) {
				if (player.media.muted) {
					player.setMuted(false);
				} else {
					player.setMuted(true);
				}
			}
		},
		// separator
		{
			isSeparator: true
		},
		// demo of simple download video
		{
			render () {
				return mejs.i18n.t('mejs.download-video');
			},
			click (player) {
				window.location.href = player.media.currentSrc;
			}
		}]
	}
);


Object.assign(MediaElementPlayer.prototype, {

	isContextMenuEnabled: true,

	contextMenuTimeout: null,

	buildcontextmenu (player) {

		if (!player.isVideo) {
			return;
		}

		// create context menu
		if (!document.querySelector(`.${player.options.classPrefix}contextmenu`)) {
			player.contextMenu = document.createElement('div');
			player.contextMenu.className = `${player.options.classPrefix}contextmenu`;
			player.contextMenu.style.display = 'none';

			document.body.appendChild(player.contextMenu);
		}

		// create events for showing context menu
		player.container.addEventListener('contextmenu', (e) => {
			if (player.isContextMenuEnabled && (e.keyCode === 3 || e.which === 3)) {
				player.renderContextMenu(e);
				e.preventDefault();
				e.stopPropagation();
			}
		});
		player.container.addEventListener('click', () => {
			player.contextMenu.style.display = 'none';
		});
		player.contextMenu.addEventListener('mouseleave', () => {
			player.startContextMenuTimer();

		});
	},

	cleancontextmenu (player) {
		player.contextMenu.remove();
	},

	enableContextMenu () {
		this.isContextMenuEnabled = true;
	},
	disableContextMenu () {
		this.isContextMenuEnabled = false;
	},

	startContextMenuTimer () {
		const t = this;

		t.killContextMenuTimer();

		t.contextMenuTimer = setTimeout(() => {
			t.hideContextMenu();
			t.killContextMenuTimer();
		}, 750);
	},
	killContextMenuTimer () {
		let timer = this.contextMenuTimer;

		if (timer !== null && timer !== undefined) {
			clearTimeout(timer);
			timer = null;
		}
	},

	hideContextMenu () {
		this.contextMenu.style.display = 'none';
	},

	renderContextMenu (event) {

		// alway re-render the items so that things like "turn fullscreen on" and "turn fullscreen off" are always written correctly
		let
			t = this,
			html = '',
			items = t.options.contextMenuItems
		;

		for (let i = 0, total = items.length; i < total; i++) {

			const item = items[i];

			if (item.isSeparator) {
				html += `<div class="${t.options.classPrefix}contextmenu-separator"></div>`;
			} else {

				const rendered = item.render(t);

				// render can return null if the item doesn't need to be used at the moment
				if (rendered !== null && rendered !== undefined) {
					html += `<div class="${t.options.classPrefix}contextmenu-item" data-itemindex="${i}" id="element-${(Math.random() * 1000000)}">${rendered}</div>`;
				}
			}
		}


		// position and show the context menu
		t.contextMenu.innerHTML = html;
		
		const
			width = t.contextMenu.offsetWidth,
			height = t.contextMenu.offsetHeight,
			x = event.pageX,
			y = event.pageY,
			doc = document.documentElement,
			scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0),
			scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0),
			left = (x + width > window.innerWidth + scrollLeft) ? x - width : x,
			top = (y + height > window.innerHeight + scrollTop) ? y - height : y
		;

		t.contextMenu.style.display = '';
		t.contextMenu.style.left = `${left}px`;
		t.contextMenu.style.top = `${top}px`;

		// bind events
		const contextItems = t.contextMenu.querySelectorAll(`.${t.options.classPrefix}contextmenu-item`);
		for (let i = 0, total = contextItems.length; i < total; i++) {

			// which one is this?
			const
				menuItem = contextItems[i],
				itemIndex = parseInt(menuItem.getAttribute('data-itemindex'), 10),
				item = t.options.contextMenuItems[itemIndex]
			;

			// bind extra functionality?
			if (typeof item.show !== 'undefined') {
				item.show(menuItem, t);
			}

			// bind click action
			menuItem.addEventListener('click', () => {
				// perform click action
				if (typeof item.click !== 'undefined') {
					item.click(t);
				}

				// close
				t.contextMenu.style.display = 'none';
			});
		}

		// stop the controls from hiding
		setTimeout(() => {
			t.killControlsTimer();
		}, 100);

	}
});