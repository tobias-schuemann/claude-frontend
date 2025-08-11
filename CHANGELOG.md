# Changelog

## [0.0.1] - 2024-01-11

### Initial Release (Beta)

#### Features
- 🎯 Visual element selection with click-to-select interface
- 🤖 Direct integration with Claude Code CLI
- ⚡ Auto-injection in development environments
- 🎨 Smart React/Vue/Svelte component detection
- ⌨️ Keyboard shortcuts (Alt+C)
- 💾 Persistent settings in localStorage
- 🔧 Configurable options (bypass permissions, continue chat, subagents)

#### Framework Support
- Next.js (App Router & Pages Router)
- Create React App
- Vite
- Vue 3
- Svelte
- Any webpack/bundler-based project

#### Developer Experience
- Single-line setup: `import 'claude-frontend'`
- TypeScript definitions included
- Browser/Node conditional exports
- Automatic development environment detection

#### Security
- Local-only communication
- Development-only by default
- No external service dependencies
- No data collection or telemetry