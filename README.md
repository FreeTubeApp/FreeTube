# FreeTube
FreeTube is an Open Source Desktop YouTube player built with privacy in mind.  Watch your favorite YouTube videos ad free as well as prevent Google from tracking what you watch.  Available for Windows / Mac / Linux

## Screenshots
<img src="https://freetubeapp.github.io/images/FreeTube1.png" width=200 >
<img src="https://freetubeapp.github.io/images/FreeTube2.png" width=200 >
<img src="https://freetubeapp.github.io/images/FreeTube3.png" width=200 >
<img src="https://freetubeapp.github.io/images/FreeTube4.png" width=200 >
<img src="https://freetubeapp.github.io/images/FreeTube5.png" width=200 >

# How Does It Work?
FreeTube uses the YouTube API to search for videos.  It then uses the HookTube API to grab the raw video files and play them in a basic HTML5 video player, preventing YouTube from tracking that video.  Subscriptions, history, and saved videos are stored locally on the user's computer and is never sent out to Google or anyone else.  You own your data.

## Features
* Watch videos free of ads
* Prevent Google from tracking what you watch
* Subscribe to channels without an account
* Store subscriptions, history, and saved videos locally
* Import / Backup subscriptions
* Mini Player
* Light / Dark Theme

# FreeTube is Currently in Beta
While I believe that FreeTube should work well for most users, there will probably be some bugs or features missing.  Because of this, FreeTube is currently in beta and will be considered "stable" when these have been addressed.

# I'd like to help!
If you have an idea or if you found a bug, please create an issue so that we can track it.  Please check the current issues and make sure that someone else hasn't mentioned it already before submitting an issue.

If you like to get your hands dirty and want to contribute, we would love to have your help.  Send a pull request and someone will review your code. Proper contribution guidelines will be included soon, but in the meantime here's how to get start:

After you pull down the code:

Install Dependencies:
```
npm install
```

Run the application:
```
npm start
```

Make / Package application:

Windows (Requires Wine on Linux):
```
npm run make:win32
```

Mac:
```
npm run make:darwin
```

Linux (Requires deb and rpm):
```
npm run make:linux
```

The bundled application will then be located in the "/out" folder in your project directory.

# License
[![GNU GPLv3 Image](https://www.gnu.org/graphics/gplv3-127x51.png)](http://www.gnu.org/licenses/gpl-3.0.en.html)  

FreeTube is Free Software: You can use, study share and improve it at your
will. Specifically you can redistribute and/or modify it under the terms of the
[GNU General Public License](https://www.gnu.org/licenses/gpl.html) as
published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.  
