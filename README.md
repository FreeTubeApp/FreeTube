<p align="center">
 <img src="https://freetubeapp.github.io/images/logoColor.png" width=500 align="center">
</p>

FreeTube is an open source desktop YouTube player built with privacy in mind.
Use YouTube without advertisments and prevent Google tracking from you with their cookies and JavaScript.
Available for Windows, Mac & Linux thanks to Electron.

Please note that FreeTube is currently in Beta. While it should work well for
most users, there are still bugs and missing features that need to be
addressed.

[Download FreeTube](https://github.com/FreeTubeApp/FreeTube/releases)

### Browser Extension

Download our browser extension so that you can click on videos in your browser and have them automatically open up in FreeTube.

[Download for Firefox](https://addons.mozilla.org/en-US/firefox/addon/freetube-redirect/)

[Instructrions for Google Chrome](https://github.com/FreeTubeApp/FreeTube/wiki/Browser-Extension)

## How does it work?
FreeTube uses the proprietary [YouTube HTTP
API](https://developers.google.com/youtube/v3/getting-started) with a set of
hard coded API keys.  Videos are resolved using
[youtube-dl](https://rg3.github.io/youtube-dl/)
 and played using the stock HTML5 video
player.  While YouTube can still see your API and video requests it can no
longer track you using cookies or JavaScript. Your subscriptions, history, and
saved videos are stored locally on your computer and never sent out.  Using a VPN or Tor is recommended
to hide your IP while using FreeTube.

## Screenshots
<img src="https://freetubeapp.github.io/images/FreeTube1.png" width=200> <img src="https://freetubeapp.github.io/images/FreeTube2.png" width=200> <img src="https://freetubeapp.github.io/images/FreeTube3.png" width=200> <img src="https://freetubeapp.github.io/images/FreeTube5.png" width=200>

## Features
* Watch videos without ads
* Use YouTube without Google tracking you using cookies and JavaScript
* Make API calls through the Tor network
* Subscribe to channels without an account
* Local subscriptions, history, and saved videos
* Export & import subscriptions
* Open videos from your browser directly into FreeTube (with extension)
* Mini Player
* Light / dark theme

## Contributing
If you have an idea or if you found a bug, please submit a GitHub issue so that
we can track it.  Please search the existing issues before submitting to
prevent duplicates.

If you like to get your hands dirty and want to contribute, we would love to
have your help.  Send a pull request and someone will review your code. Please
follow the [Contribution
Guidelines](https://github.com/FreeTubeApp/FreeTube/blob/master/CONTRIBUTING.md)
before sending your pull request.

Thank you very much to the [People and Projects](https://github.com/FreeTubeApp/FreeTube/wiki/Credits) that make FreeTube possible!

## License
[![GNU GPLv3 Image](https://www.gnu.org/graphics/gplv3-127x51.png)](http://www.gnu.org/licenses/gpl-3.0.en.html)  

FreeTube is Free Software: You can use, study share and improve it at your
will. Specifically you can redistribute and/or modify it under the terms of the
[GNU General Public License](https://www.gnu.org/licenses/gpl.html) as
published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.  
