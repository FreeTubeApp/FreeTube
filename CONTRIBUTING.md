# API Keys

When you are testing and working on FreeTube, PLEASE use your own API Key.  The keys included in the project are in use by the userbase and testing can cause these keys to max out.  Please do not risk degrading the experience for other users and use your own key if at all possible.  Thank you for your cooperation.

# Code Contributions

Please follow these guidlines before sending your pull request and making contributions.

* When you submit a pull request, you agree that your code is published under the [GNU General Public License](https://www.gnu.org/licenses/gpl.html)
* Do not include non-free software or modules with your code.
* Make sure your pull request is setup to merge your branch to FreeTube's development branch.
* Make sure your branch is up to date with the development branch before submitting your pull request.
* Stick to a similar style of code already in the project.  Please look at current code to get an idea on how to do this.
* Follow [ES6](http://es6-features.org/) standards in your code. Ex: Use `let` and `const` instead of `var`. Do not use `function(response){//code}` for callbacks, use `(response) => {//code}`.
* Comment your code when necessary.  Follow the [JavaScript Documentation and Comments Standard](https://www.drupal.org/docs/develop/standards/javascript/javascript-api-documentation-and-comment-standards) for functions.
* Please test your code.  Make sure new features work as well as core features such as watching videos or loading subscriptions.
* Please limit the amount of Node Modules that you introduce into the project.  Only include them when absolutely necessary for your code to work (Ex: Using nedb for databases) or if a module provides similar functionality to what you are trying to achieve (Ex: Using autolinker to create links to outside URLs instead of writing the functionality myself).
* Please try to stay involved with the community and maintain your code.  I am only one person and I work on FreeTube only in my spare time.  I do not have time to work on everything and it would be nice if you can maintain your code when necessary.

# Setting up Your Environment

Here's how to get your environment setup.  You will need Git and NPM installed on your system.

Clone down the repositoy:
```
git clone https://github.com/FreeTubeApp/FreeTube.git
```

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

Linux (Requires deb and rpm to be installed):
```
npm run make:linux
```

I will update this document when necessary.  Anyone who has questions or suggestions on this document are welcome to create an issue or pull request.
