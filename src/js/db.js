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

const electron = require('electron');
const Datastore = require('nedb'); // database logic
const localDataStorage = electron.remote.app.getPath('userData'); // Grabs the userdata directory based on the user's OS

const subDb = new Datastore({
  filename: localDataStorage + '/subscriptions.db',
  autoload: true
});

const historyDb = new Datastore({
  filename: localDataStorage + '/videohistory.db',
  autoload: true
});

const savedVidsDb = new Datastore({
  filename: localDataStorage + '/savedvideos.db',
  autoload: true
});

const settingsDb = new Datastore({
  filename: localDataStorage + '/settings.db',
  autoload: true
});
