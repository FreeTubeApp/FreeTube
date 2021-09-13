<p align="center">
 <img src="https://docs.freetubeapp.io/images/logoColor.png" width=500 align="center">
</p>

FreeTube is an open source desktop YouTube player built with privacy in mind.
Use YouTube without advertisements and prevent Google from tracking you with their cookies and JavaScript.
Available for Windows, Mac & Linux thanks to Electron.

Please note that FreeTube is currently in Beta. While it should work well for
most users, there are still bugs and missing features that need to be
addressed.

[Download FreeTube](https://github.com/FreeTubeApp/FreeTube/releases)

### Browser Extension

FreeTube is supported by the [Privacy Redirect](https://github.com/SimonBrazell/privacy-redirect) extension, which will allow you to open YouTube links into FreeTube. You must enable the option within the advanced settings for it to work.

Download Privacy Redirect for [Firefox](https://addons.mozilla.org/en-US/firefox/addon/privacy-redirect/) or [Google Chrome](https://chrome.google.com/webstore/detail/privacy-redirect/pmcmeagblkinmogikoikkdjiligflglb).

If you have issues with the extension working with FreeTube, please create an issue in this repository instead of the extension repository.

## How does it work?
FreeTube uses a built in extractor to grab and serve data / videos.  The [Invidious API](https://github.com/iv-org/invidious) can also optionally be used.  FreeTube does not use any official APIs to obtain data.  While YouTube can still see your video requests, it can no
longer track you using cookies or JavaScript. Your subscriptions and history are stored locally on your computer and never sent out.  Using a VPN or Tor is highly recommended
to hide your IP while using FreeTube.

Go to [FreeTube's Documentation](https://docs.freetubeapp.io/) if you'd like to know more about how to operate FreeTube and its features.

## Screenshots
<img src="https://i.imgur.com/zFgZUUV.png" width=300> <img src="https://i.imgur.com/9evYHgN.png" width=300> <img src="https://i.imgur.com/yT2UzPa.png" width=300> <img src="https://i.imgur.com/47zIEt4.png" width=300> <img src="https://i.imgur.com/hFB2fKC.png" width=300>

## Features
* Watch videos without ads
* Use YouTube without Google tracking you using cookies and JavaScript
* Two extractor APIs to choose from (Built in or Invidious)
* Subscribe to channels without an account
* Local subscriptions, history, and saved videos
* Organize your subscriptions into "Profiles" to create a more focused feed
* Export & import subscriptions
* Open videos from your browser directly into FreeTube (with extension)
* Mini Player
* Full Theme support

## Download Links

### Official Downloads

[GitHub Releases](https://github.com/FreeTubeApp/FreeTube/releases)

[FreeTube Website](https://freetubeapp.io/#download)

Flatpak on Flathub: [Download](https://flathub.org/apps/details/io.freetubeapp.FreeTube) [Source](https://github.com/flathub/io.freetubeapp.FreeTube)

### Unofficial Downloads

These builds are maintained by the community.  While they should be safe, download at your own risk.  There may be issues with using these versus the official builds.  Any issues specific with these builds should be sent to their respective maintainer.

Arch User Repository (AUR): [Download](https://aur.archlinux.org/packages/freetube-bin/)

Chocolatey: [Download](https://chocolatey.org/packages/freetube/)

Windows Portable: [Download](https://github.com/rddim/FreeTubePortable/releases) [Source](https://github.com/rddim/FreeTubePortable)

### Automated Builds (Nightly / Weekly)

Builds are automatically created from changes to our development branch via [GitHub Actions](https://github.com/FreeTubeApp/FreeTube/actions?query=workflow%3ABuild).

The first build with a green check mark is the latest build.  You will need to have a GitHub account to download these builds.

## Contributing
If you have an idea or if you found a bug, please submit a GitHub issue so that
we can track it.  Please search the existing issues before submitting to
prevent duplicates.

If you like to get your hands dirty and want to contribute, we would love to
have your help.  Send a pull request and someone will review your code. Please
follow the [Contribution
Guidelines](https://github.com/FreeTubeApp/FreeTube/blob/development/CONTRIBUTING.md)
before sending your pull request.

Thank you very much to the [People and Projects](https://docs.freetubeapp.io/credits/) that make FreeTube possible!

## Localization
<a href="https://hosted.weblate.org/engage/free-tube/">
<img src="https://hosted.weblate.org/widgets/free-tube/-/translations/287x66-grey.png" alt="Translation status" />
</a>

We are actively looking for translations!  We use Weblate to make it easy for translators to get involved.  Click on the badge above to learn how to get involved.

## Contact

If you ever have any questions, feel free to make an issue here on GitHub.  Alternatively, you can email me at FreeTubeApp@protonmail.com or you can join our [Matrix Community](https://matrix.to/#/+freetube:matrix.org).  Don't forget to check out the [rules](https://docs.freetubeapp.io/community/matrix/) before joining.

You can also stay up to date by reading the [FreeTube Blog](https://write.as/freetube/).  [View the welcome blog](https://write.as/freetube/welcome-to-freetube-blogs).

## Donate

[FreeTube on Liberapay](https://liberapay.com/FreeTube)

Bitcoin Address: 1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS

Monero Address: 48WyAPdjwc6VokeXACxSZCFeKEXBiYPV6GjfvBsfg4CrUJ95LLCQSfpM9pvNKy5GE5H4hNaw99P8RZyzmaU9kb1pD7kzhCB

If you enjoy using FreeTube, you're welcome to leave a donation using the following methods.  While your donations are much appreciated, only donate if you really want to.  Donations are used for keeping the website up and running and eventual code signing costs.

## License
[![GNU AGPLv3 Image](https://www.gnu.org/graphics/agplv3-155x51.png)](https://www.gnu.org/licenses/agpl-3.0.html)  

FreeTube is Free Software: You can use, study share and improve it at your
will. Specifically you can redistribute and/or modify it under the terms of the
[GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.html) as
published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.  
