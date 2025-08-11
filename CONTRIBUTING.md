# Contributing to claude-frontend

Thank you for your interest in contributing to claude-frontend! 

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Test locally with `npm link`
5. Submit a pull request

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and releases.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature (triggers minor release)
- **fix**: Bug fix (triggers patch release)
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependency changes
- **ci**: CI/CD configuration changes
- **chore**: Other changes that don't affect source code

### Examples

```bash
# Feature
git commit -m "feat: add support for Vue 3 components"

# Bug fix
git commit -m "fix: resolve element selection in Shadow DOM"

# Breaking change (triggers major release)
git commit -m "feat!: change default port from 3002 to 3003"

# With scope
git commit -m "fix(widget): correct React component name detection"

# With body
git commit -m "feat: add dark mode support

This adds a new dark mode option in settings that changes
the widget appearance to match dark-themed applications."
```

## How to Contribute

### For External Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claude-frontend.git
   cd claude-frontend
   npm install
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
4. **Make your changes** following the code style
5. **Test locally**:
   ```bash
   npm test
   npm link  # Test in a real project
   ```
6. **Commit using conventional commits** (see below)
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```
8. **Open a Pull Request** from your fork to the main repository
9. **Wait for review** - All PRs require approval from maintainers
10. **Address feedback** if requested
11. Once approved, maintainers will merge your PR

### For Maintainers

Maintainers with write access should still use PRs for all changes:
1. Create a branch directly in the main repo
2. Open a PR for review
3. Another maintainer should review when possible

## Testing

Before submitting:

1. Test the widget in a real project
2. Verify all framework examples work
3. Check that the server starts correctly
4. Ensure TypeScript definitions are accurate

## Code Style

- Use 2 spaces for indentation
- Include JSDoc comments for public APIs
- Keep functions small and focused
- Avoid adding unnecessary dependencies

## Release Process

Releases are automated using GitHub Actions and semantic-release:

1. **Automatic**: Merging to main triggers automatic versioning and npm publish
2. **Manual**: Use the "Manual Release" workflow for specific version bumps

## Questions?

Feel free to open an issue for discussion!