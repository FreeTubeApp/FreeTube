# Code Contributions

## Before starting to code
 Please follow these guidelines before starting to code you feature or bugfix.
 * If you want to implement a bugfix or feature request from an existing issue, please comment on that issue that you will work on it. This helps us to coordinate what needs to be done and what not.
 * If you want to implement a feature request without an existing issue, please create an issue, so we know what you are working on and discuss the feature.
 * For major feature implementations make sure you are able to maintain your code in the future in regard to bugs and possible code conflicts in future updates. Optionally you could join the [Matrix](https://matrix.to/#/#freetube:matrix.org) channel, so you will hear instantly if something needs to be worked on.  

## Before your Pull Request
Please follow these guidelines before sending your pull request and making contributions.
* When you submit a pull request, you agree that your code is published under the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.html)
* Please link the issue you are referring to.
* Do not include non-free software or modules with your code.
* Make sure your pull request is set up to merge your branch to FreeTube's development branch.
* Make sure your branch is up to date with the development branch before submitting your pull request.
* Stick to a similar style of code already in the project.  Please look at current code to get an idea on how to do this.
* Follow [ES6](https://rse.github.io/es6-features/) standards in your code. Ex: Use `let` and `const` instead of `var`. Do not use `function(response){//code}` for callbacks, use `(response) => {//code}`.
* Comment your code when necessary.  Follow the [JavaScript Documentation and Comments Standard](https://www.drupal.org/docs/develop/standards/javascript/javascript-api-documentation-and-comment-standards) for functions.
* Please follow proper Vue structure when creating new code / components.  Use existing code as well as the [Vue.js Guide](https://vuejs.org/v2/guide/) for reference.
* Please test your code.  Make sure new features work as well as existing core features such as watching videos or loading subscriptions.  New features need to work with both the Local API as well as the Invidious API
* Please make sure your code does not violate any standards set by our linter.  It's up to you to make fixes whenever necessary.  You can run `npm run lint` to check locally and `npm run lint-fix` to automatically fix smaller issues.
* Please limit the amount of Node Modules that you introduce into the project.  Only include them when **absolutely necessary** for your code to work (Ex: Using nedb for databases) or if a module provides similar functionality to what you are trying to achieve (Ex: Using autolinker to create links to outside URLs instead of writing the functionality myself).
* Please try to stay involved with the community and maintain your code.  We are only a handful of developers working on FreeTube in our spare time.  We do not have time to work on everything, and it would be nice if you can maintain your code when necessary.

# Setting up Your Environment

Check out the [wiki](https://docs.freetubeapp.io/development/getting-started/) page to learn how to set up your environment and get started.
