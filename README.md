# Design Tweaks

The same [FreeTube](https://github.com/FreeTubeApp/FreeTube) you know & love, but with **edgy design tweaks** that won't necesarily become part of the official version because functionally some things will suck. Keep in mind that **I don't have a lot of time to fix things quickly** and that it's not completely stable.

<img src="https://user-images.githubusercontent.com/86549690/124601437-7e346b00-de70-11eb-951b-bda66cbc1271.png" width="100%">

<table border="0" width="100%" border-color="red">
<tr><td width="50%"><img src="https://user-images.githubusercontent.com/86549690/124822451-92fc2600-df78-11eb-9ecd-601853e090fa.jpg" width="100%"></td>
<td><img src="https://user-images.githubusercontent.com/86549690/124601555-a45a0b00-de70-11eb-8e36-e82f287797dd.png" width="100%"><img src="https://user-images.githubusercontent.com/86549690/124330699-a6814880-db96-11eb-9bbe-4699d5c50216.png" width="100%"></td></tr>
</table>

## Features (tell me if you want more things)

- [x] New logo that changes the color dynamically
- [x] Rounded corners
- [x] Blur on some elements
- [x] No text on the left sidebar
- [x] Partial Mobile support (the sidebar is broken now tho)
- [x] Hybrid between black and dark mode
- [x] Light mode support
- [x] Redesigned video player
- [ ] Channel page (my current implementation is pretty bad because there's no specific css selector for the banner)
- [ ] Refined small details

## Known Bugs (let me know about yours)

* Left side items look weird on hover
* Not good for accesibility, since this version is focusing on design
* The channel panel only displays the banner properly sometimes which also creates errors in the console
* Dark & black mode and also Primary & Secondary colors are the same now, so it can confuse some people

## Installation

A. [Get the latest release here](https://github.com/dragosnfy/FreeTube/actions) (for appimage make sure that ```allow executing file as program``` is checked when you right click on it)

B. Build it on your own with ```npm install```, ```npm run build``` or ```npm run dev``` (which means you need to install nodejs & npm)

## Wanna contribute?

* You can support the [original FreeTube project here](https://github.com/FreeTubeApp/FreeTube), [donate](https://liberapay.com/FreeTube) or join the [Matrix Community](https://matrix.to/#/+freetube:matrix.org)
* To help this repo specifically, feel free to add your own suggestions, issues or ask things, I'm open, but I don't promise I will include everything, because I don't wanna deviate too much from the original project in terms of functionality. However if it's related to design & it respects ui/ux rules, then we can go wild as long as it looks good! Oh and try adding screenshots when you suggest things!
