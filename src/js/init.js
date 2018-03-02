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
* File used to initializing the application
*/
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
let win;

/**
 * initialize the electron application
 * 1. create the browser window
 * 2. load the index.html
 */
let init = function() {
  const Menu = require('electron').Menu;
  win = new BrowserWindow({width: 1200, height: 800});

  win.loadURL(url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  if (process.env = 'development') {
    //win.webContents.openDevTools();
  }

  win.on('closed', () => {
    win = null;
  });

  const template = [
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

/**
 * quit the application
 */
let allWindowsClosed = function() {
  app.quit();
};

/**
 * on mac, when dock icon is clicked,
 * create a new window and launch the editor
 */
let active = function() {
  if (win === null) {
    init();
  }
};

/**
 * bind events, ready (initialize),
 * window-all-closed (what happens when the windows closed),
 * activate
 */
app.on('ready', init);
app.on('window-all-closed', allWindowsClosed);
app.on('activate', active);
