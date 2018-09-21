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
const {
    app,
    BrowserWindow,
    dialog,
    protocol
} = require('electron');
const path = require('path');
const url = require('url');

let win;

protocol.registerStandardSchemes(['freetube']);

app.setAsDefaultProtocolClient('freetube');

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()

        win.webContents.send('ping', commandLine)
    }
});

if (require('electron-squirrel-startup') || isSecondInstance) app.quit();

/**
 * Initialize the Electron application
 * 1. create the browser window
 * 2. load the index.html
 */
let init = function () {
    const Menu = require('electron').Menu;

    win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    if (process.env = 'development') {
        //win.webContents.openDevTools();ff
    }

    win.on('closed', () => {
        win = null;
    });

    const template = [{
            label: 'File',
            submenu: [{
                    label: 'Open New Window',
                    click() {
                        init()
                    }
                },
                {
                    role: 'quit'
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [{
                    role: 'cut'
                },
                {
                    role: 'copy',
                    accelerator: "CmdOrCtrl+C",
                    selector: "copy:"
                },
                {
                    role: 'paste',
                    accelerator: "CmdOrCtrl+V",
                    selector: "paste:"
                },
                {
                    role: 'pasteandmatchstyle'
                },
                {
                    role: 'delete'
                },
                {
                    role: 'selectall'
                }
            ]
        },
        {
            label: 'View',
            submenu: [{
                    role: 'reload'
                },
                {
                    role: 'forcereload'
                },
                {
                    role: 'toggledevtools'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'resetzoom'
                },
                {
                    role: 'zoomin'
                },
                {
                    role: 'zoomout'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'togglefullscreen'
                }
            ]
        },
        {
            role: 'window',
            submenu: [{
                    role: 'minimize'
                },
                {
                    role: 'close'
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

/**
 * Quit the application
 */
let allWindowsClosed = function () {
    win.webContents.session.clearStorageData([], (data) => {});
    win.webContents.session.clearCache((data) => {});
    app.quit();
};

/**
 * On Mac, when dock icon is clicked,
 * create a new window and launch the editor
 */
let active = function () {
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
