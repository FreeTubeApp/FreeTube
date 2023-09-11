<p align="center">
 <img alt="" src="https://docs.freetubeapp.io/images/logoColor.png" width=500 align="center">
</p>

FreeTube is an open source desktop YouTube player built with privacy in mind.
Use YouTube without advertisements and prevent Google from tracking you with their cookies and JavaScript.
Available for Windows, Mac & Linux thanks to Electron.

<p align="center"><a href="https://github.com/FreeTubeApp/FreeTube/releases">Download FreeTube</a></p>
<p align="center">
  <a href="https://github.com/FreeTubeApp/FreeTube/actions/workflows/build.yml">
    <img alt='Build status' src="https://github.com/FreeTubeApp/FreeTube/actions/workflows/build.yml/badge.svg?branch=development" />
  </a>
  <a href="https://hosted.weblate.org/engage/free-tube/">
    <img src="https://hosted.weblate.org/widgets/free-tube/-/svg-badge.svg" alt="Translation status" />
  </a>
</p>

<hr>
<p align="center"><a href="#screenshots">Screenshots</a> &bull; <a href="#how-does-it-work">How does it work?</a> &bull; <a href="#features">Features</a> &bull; <a href="#download-links">Download Links</a> &bull; <a href="#contributing">Contributing</a> &bull; <a href="#localization">Localization</a> &bull; <a href="#contact">Contact</a> &bull; <a href="#donate">Donate</a> &bull; <a href="#license">License</a></p>
<p align="center"><a href="https://freetubeapp.io/">Website</a> &bull; <a href="https://blog.freetubeapp.io/">Blog</a> &bull; <a href="https://docs.freetubeapp.io/">Documentation</a> &bull; <a href="https://docs.freetubeapp.io/faq/">FAQ</a> &bull; <a href="https://github.com/FreeTubeApp/FreeTube/discussions">Discussions</a></p>
<hr>

<b>Please note that FreeTube is currently in Beta. While it should work well for most users, there are still bugs and missing features that need to be addressed. If you have an idea or if you found a bug, please submit a [GitHub issue](https://github.com/FreeTubeApp/FreeTube/issues/new/choose) so that
we can track it.  Please search [the existing issues](https://github.com/FreeTubeApp/FreeTube/issues) before submitting to
prevent duplicates!</b>

## Screenshots
<img src="https://i.imgur.com/zFgZUUV.png" width=300> <img src="https://i.imgur.com/9evYHgN.png" width=300> <img src="https://i.imgur.com/yT2UzPa.png" width=300> <img src="https://i.imgur.com/47zIEt4.png" width=300> <img src="https://i.imgur.com/hFB2fKC.png" width=300>

## How does it work?
FreeTube uses a built in extractor to grab and serve data / videos. The [Invidious API](https://github.com/iv-org/invidious) can also optionally be used. FreeTube does not use any official APIs to obtain data. While YouTube can still see your video requests, it can no
longer track you using cookies or JavaScript. Your subscriptions and history are stored locally on your computer and never sent out. Using a VPN or Tor is highly recommended
to hide your IP while using FreeTube.

## Features
* Watch videos without ads
* Use YouTube without Google tracking you using cookies and JavaScript
* Two extractor APIs to choose from (Built in or Invidious)
* Subscribe to channels without an account
* Connect to an externally setup proxy such as Tor
* View and search your local subscriptions, history, and saved videos
* Organize your subscriptions into "Profiles" to create a more focused feed
* Export & import subscriptions
* Youtube Trending
* Youtube Chapters
* Most popular videos page based on the set Invidious instance
* SponsorBlock 
* Open videos from your browser directly into FreeTube (with extension)
* Watch videos using an external player
* Full Theme support
* Make a screenshot of a video
* Multiple windows
* Mini Player (Picture-in-Picture)
* Keyboard shortcuts
* Option to show only family friendly content
* Show/hide functionality or elements within the app using the distraction free settings
* View channel community posts
* View most age restricted videos

### Browser Extension
FreeTube is supported by the [Privacy Redirect](https://github.com/SimonBrazell/privacy-redirect) and [LibRedirect](https://github.com/libredirect/libredirect) extensions, which will allow you to open YouTube links into FreeTube. You must enable the option within the advanced settings of the extension for it to work.

* Download Privacy Redirect for [Firefox](https://addons.mozilla.org/en-US/firefox/addon/privacy-redirect/) or [Google Chrome](https://chrome.google.com/webstore/detail/privacy-redirect/pmcmeagblkinmogikoikkdjiligflglb).

* Download LibRedirect for [Firefox](https://addons.mozilla.org/firefox/addon/libredirect/) or [Google Chrome](https://libredirect.github.io/download_chromium.html).

If you have issues with the extension working with FreeTube, please create an issue in this repository instead of the extension repository. This extension does not work on Linux portable builds!

## Download Links
### Official Downloads
* [GitHub Releases](https://github.com/FreeTubeApp/FreeTube/releases)

* [FreeTube Website](https://freetubeapp.io/#download)

* Flatpak on Flathub: [Download](https://flathub.org/apps/details/io.freetubeapp.FreeTube) and [Source Code](https://github.com/flathub/io.freetubeapp.FreeTube)

#### Automated Builds (Nightly / Weekly)
Builds are automatically created from changes to our development branch via [GitHub Actions](https://github.com/FreeTubeApp/FreeTube/actions?query=workflow%3ABuild).

The first build with a green check mark is the latest build.  You will need to have a GitHub account to download these builds.

### Unofficial Downloads
These builds are maintained by the community. While they should be safe, download at your own risk. There may be issues with using these versus the official builds. Any issues specific with these builds should be sent to their respective maintainer. <b>Make sure u always try an [official download](https://github.com/freetubeapp/freetube/#official-downloads) before reporting your issue to us!</b>

* Arch User Repository (AUR): [Download](https://aur.archlinux.org/packages/freetube-bin/)

* Chocolatey: [Download](https://chocolatey.org/packages/freetube/)

* FreeTubeCordova (FreeTube port for Android and PWA): [Download](https://github.com/MarmadileManteater/FreeTubeCordova/releases) and [Source Code](https://github.com/MarmadileManteater/FreeTubeCordova)

* makedeb Package Repository (MPR): [Download](https://mpr.makedeb.org/packages/freetube-bin)

* Nix Packages: [Download](https://search.nixos.org/packages?query=freetube)

* PortableApps (Windows Only): [Download](https://github.com/rddim/FreeTubePortable/releases) and [Source Code](https://github.com/rddim/FreeTubePortable)

* Scoop (Windows Only): [Usage](https://github.com/ScoopInstaller/Scoop)

* Snap: [Download](https://snapcraft.io/freetube) and [Source Code](https://git.launchpad.net/freetube)

* Windows Package Manager (winget): [Usage](https://docs.microsoft.com/en-us/windows/package-manager/winget/)

## Contributing
If you like to get your hands dirty and want to contribute, we would love to
have your help.  Send a pull request and someone will review your code. Please
follow the [Contribution
Guidelines](https://github.com/FreeTubeApp/FreeTube/blob/development/CONTRIBUTING.md)
before sending your pull request.

Thank you very much to the [People and Projects](https://docs.freetubeapp.io/credits/) that make FreeTube possible!

## Localization
<a href="https://hosted.weblate.org/engage/free-tube/">
<img src="https://hosted.weblate.org/widgets/free-tube/-/287x66-grey.png" alt="Translation status" />
</a>

We are actively looking for translations!  We use [Weblate](https://hosted.weblate.org/engage/free-tube/) to make it easy for translators to get involved.  Click on the badge above to learn how to get involved.

For the Linux Flatpak, the desktop entry comment string can be translated at our [Flatpak repository](https://github.com/flathub/io.freetubeapp.FreeTube/blob/master/io.freetubeapp.FreeTube.desktop).

## Contact
If you ever have any questions, feel free to ask it on our [Discussions](https://github.com/FreeTubeApp/FreeTube/discussions) page.  Alternatively, you can email us at FreeTubeApp@protonmail.com or you can join our [Matrix Community](https://matrix.to/#/+freetube:matrix.org).  Don't forget to check out the [rules](https://docs.freetubeapp.io/community/matrix/) before joining.

## Donate
If you enjoy using FreeTube, you're welcome to leave a donation using the following methods.  

* [FreeTube on Liberapay](https://liberapay.com/FreeTube)

* Bitcoin Address: `1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS`

* Monero Address: `48WyAPdjwc6VokeXACxSZCFeKEXBiYPV6GjfvBsfg4CrUJ95LLCQSfpM9pvNKy5GE5H4hNaw99P8RZyzmaU9kb1pD7kzhCB`

While your donations are much appreciated, only donate if you really want to.  Donations are used for keeping the website up and running and eventual code signing costs. If you are using the Invidious API then we recommend that you donate to the instance that you use. You can also donate to the [Invidious team](https://invidious.io/donate/) or the [Local API developer](https://github.com/sponsors/LuanRT).

## License
[![GNU AGPLv3 Image](https://www.gnu.org/graphics/agplv3-155x51.png)](https://www.gnu.org/licenses/agpl-3.0.html)  

FreeTube is Free Software: You can use, study share and improve it at your
will. Specifically you can redistribute and/or modify it under the terms of the
[GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.html) as
published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.  
