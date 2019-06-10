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
    protocol,
    ipcMain
} = require('electron');
const path = require('path');
const url = require('url');

const Datastore = require('nedb'); // database logic
const localDataStorage = app.getPath('userData'); // Grabs the userdata directory based on the user's OS

const settingsDb = new Datastore({
    filename: localDataStorage + '/settings.db',
    autoload: true
});

require('electron-context-menu')({
    prepend: (params, browserWindow) => []
});

let win;

app.setAsDefaultProtocolClient('freetube');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.commandLine.appendSwitch('disable-web-security');

app.commandLine.appendSwitch('enable-modern-media-controls', 'disabled');

const gotTheLock = app.requestSingleInstanceLock()

if (require('electron-squirrel-startup') || !gotTheLock) app.quit();

/**
 * Initialize the Electron application
 * 1. create the browser window
 * 2. load the index.html
 */
let init = function () {
    const Menu = require('electron').Menu;

    let winX, winY, winWidth, winHeight = null;
    //let winWidth = 1200;
    //let winHeight = 800;

    win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true,
        }
    });

    settingsDb.findOne({
        _id: 'bounds'
    }, function (err, doc) {
        if (doc !== null) {
            if (doc.value !== false) {
                win.setBounds(doc.value);
            }
        }
    });

    settingsDb.findOne({
        _id: 'useTor'
    }, (err, doc) => {
        if (doc !== null && doc.value !== false) {
            settingsDb.findOne({
                _id: 'proxy'
            }, (err, doc) => {
                if (doc !== null) {
                  win.webContents.session.setProxy({
                      proxyRules: doc.value
                  }, function () {
                      win.loadURL(url.format({
                          pathname: path.join(__dirname, '../index.html'),
                          protocol: 'file:',
                          slashes: true,
                      }));
                  });
                }
                else {
                  win.loadURL(url.format({
                      pathname: path.join(__dirname, '../index.html'),
                      protocol: 'file:',
                      slashes: true,
                  }));
                }
            });
        } else {
            win.loadURL(url.format({
                pathname: path.join(__dirname, '../index.html'),
                protocol: 'file:',
                slashes: true,
            }));
        }
    });

    if (process.env = 'development') {
        //win.webContents.openDevTools();
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
                    role: 'forcereload',
                    accelerator: "CmdOrCtrl+Shift+R",
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

    /**
     * Sets proxy when setProxy event is sent from renderer
     *
     * example data "SOCKS5://127.0.0.1:9050"
     */
    ipcMain.on("setProxy", (_e, data) => {
        win.webContents.session.setProxy({
            proxyRules: data
        }, function () {
            win.webContents.send("proxyAvailable");
        });
    });


    ipcMain.on("setBounds", (_e, data) => {
        let bounds = win.getBounds();

        settingsDb.findOne({
            _id: 'bounds'
        }, function (err, doc) {
            if (doc !== null) {
                settingsDb.update({
                    _id: 'bounds'
                }, {
                    $set: {
                        value: bounds
                    }
                }, {}, (err, newDoc) => {});
            } else {
                settingsDb.insert({
                    _id: 'bounds',
                    value: bounds,
                });
            }
        });
    });
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

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()

        win.webContents.send('ping', commandLine)
    }
  })

  // Create myWindow, load the rest of the app, etc...
  app.on('ready', init);
}

/**
 * bind events, ready (initialize),
 * window-all-closed (what happens when the windows closed),
 * activate
 */
app.on('window-all-closed', allWindowsClosed);
app.on('activate', active);
