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

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following the code style
3. Commit using conventional commits
4. Push to your fork
5. Open a pull request with a clear description

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