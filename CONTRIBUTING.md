# Code Contribution Guidelines
Thank you for your interest in contributing to FreeTube! To ensure a smooth development process and maintain high-quality standards, please follow the guidelines below when contributing features, bug fixes, or documentation updates.

## Before You Start Coding
To promote collaboration and avoid duplicate efforts, please follow these steps before beginning your work:

Working on an Existing Issue:
If you're addressing an issue that's already been reported, leave a comment on the issue stating your intention to work on it. This helps us coordinate tasks and avoid duplication.

Working on a New Feature:
If your contribution is not tied to an existing issue, please create a new issue first. This allows the community to discuss the feature before any code is written.

Major Feature Contributions:
For large features, be prepared to support and maintain your code in the future (e.g., fixing bugs or resolving merge conflicts).
Optionally, you can join our Matrix channel for real-time communication and updates about ongoing work.

## Before Submitting a Pull Request
When your code is ready for review, make sure it meets the following requirements:

## License Agreement:
By submitting a pull request (PR), you agree that your code will be published under the GNU Affero General Public License.

## Link to Issues:
Reference any related issue(s) in your pull request to provide context and background.

Open Source Compliance:
Do not include any non-free software or proprietary modules.

Target the Right Branch:
Ensure your PR is set to merge into the development branch of FreeTube.

Stay Up-to-Date:
Sync your feature/bugfix branch with the latest development branch before submitting.

## Code Style & Standards:

Follow the style and structure used throughout the existing codebase.

Write ES6-compliant JavaScript (e.g., use let and const instead of var, use arrow functions like (response) => {} instead of anonymous function expressions).

Add meaningful comments where appropriate. Use the JavaScript Documentation and Comment Standards.

Maintain a clean and modular Vue.js structure. Use the Vue.js Guide as a reference, and follow patterns already used in the project.

## Functionality & Testing:

Test your code thoroughly before submitting.

Ensure your feature works with both the Local API and the Invidious API.

Core functionality (e.g., watching videos, loading subscriptions) should remain stable.

Linting:
Your code must pass lint checks. Use:

*bash
*Copy code
*npm run lint       # Check for issues
*npm run lint-fix   # Auto-fix where possible
*Minimize Dependencies:
*Only add Node modules if absolutely necessary. Use a new module if:

It’s essential for your feature to work (e.g., nedb for databases).

It avoids reinventing the wheel (e.g., autolinker for link parsing).

Stay Involved:
Please remain engaged with the community and help maintain your contributions over time. FreeTube is developed by a small group of volunteers, and your continued support helps the project grow sustainably.

## Setting Up Your Development Environment
To get started with your development environment, check out our Getting Started Guide on the wiki.

If you have any questions or want to get more involved, feel free to reach out on our Matrix channel. Thanks again for helping make FreeTube better!
