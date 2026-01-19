# Contributing to WP Manager

First off, thank you for considering contributing to WP Manager! It's people like you that make WP Manager such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible.
- **Provide specific examples to demonstrate the steps**.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem.
- **Include your environment details**: OS version, Node.js version, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Provide specific examples to demonstrate the steps** or point out the part of WP Manager where the suggestion is related to.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Explain why this enhancement would be useful** to most WP Manager users.

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the coding style used throughout the project
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline

## Development Setup

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Git

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wp-manager.git
   cd wp-manager
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/my-new-feature
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Code Style

We use Prettier for code formatting. Before committing, run:

```bash
npm run format
```

To check formatting without making changes:

```bash
npm run format:check
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This leads to more readable messages that are easy to follow when looking through the project history.

#### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries

#### Examples

```
feat(sites): add client information management

- Add ClientInfo interface to store client details
- Update AddSiteModal with client fields
- Display client info on SiteCard
- Add EditSiteModal for updating client info

Closes #123
```

```
fix(plugins): resolve update button not working

The update button was disabled because the API endpoint
was not correctly formatted. Fixed by adding the correct
URL path.

Fixes #456
```

### Testing

Before submitting a pull request, make sure:

1. Your code follows the project's coding style
2. All existing tests pass
3. You've added tests for new functionality
4. TypeScript compiles without errors:
   ```bash
   npm run typecheck
   ```

### Documentation

- Update the README.md if you change functionality
- Add JSDoc comments to new functions and components
- Update the CHANGELOG.md for significant changes

## Project Structure

```
wp-manager/
├── .github/           # GitHub Actions and templates
├── build/             # App icons and build assets
├── electron/          # Electron main process code
│   ├── main.ts       # Main process entry
│   └── preload.ts    # Preload script (IPC)
├── src/               # React renderer process
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page components
│   ├── store/        # Zustand state stores
│   ├── styles/       # Global CSS styles
│   └── types/        # TypeScript type definitions
├── scripts/           # Build and utility scripts
└── package.json
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉

