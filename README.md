# claude-frontend

Visual element inspector for Claude Code. Select elements on your webpage and send them to Claude for instant code modifications.

![npm version](https://img.shields.io/npm/v/claude-frontend.svg)
![license](https://img.shields.io/npm/l/claude-frontend.svg)

## Features

- 🎯 **Visual Element Selection** - Click any element on your page to select it
- 🤖 **AI-Powered Code Modifications** - Claude understands context and makes intelligent changes
- ⚡ **Hot Reload Friendly** - Works seamlessly with all modern dev servers
- 🎨 **Smart Component Detection** - Automatically finds React/Vue/Svelte components
- 🔒 **Development Only** - Automatically disabled in production builds
- ⌨️ **Keyboard Shortcuts** - Alt+C to toggle widget
- 💾 **Persistent Settings** - Remembers your preferences across sessions

## Quick Start

### 1. Install

```bash
npm install --save-dev claude-frontend
```

### 2. Add to your app

```javascript
// In your app's entry point (main.js, index.js, etc.)
import 'claude-frontend';
```

### 3. Start the server

```bash
npx claude-frontend
```

### 4. Use it!

1. Open your app in the browser
2. Click the widget button (bottom-right corner) or press Alt+C
3. Click on elements to select them (they'll highlight in red)
4. Type what you want to change (e.g., "make this button blue")
5. Press Enter - Claude will modify your code!

## Framework Setup

### Next.js (App Router)

Create `app/components/claude-dev.jsx`:

```javascript
'use client';

import { useEffect } from 'react';

export function ClaudeDevTools() {
  useEffect(() => {
    import('claude-frontend');
  }, []);
  
  return null;
}
```

Add to `app/layout.js`:

```javascript
import { ClaudeDevTools } from './components/claude-dev';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ClaudeDevTools />
      </body>
    </html>
  );
}
```

### Next.js (Pages Router)

In `pages/_app.js`:

```javascript
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    import('claude-frontend');
  }, []);

  return <Component {...pageProps} />;
}
```

### Vite

```javascript
// main.js
if (import.meta.env.DEV) {
  import('claude-frontend');
}
```

### Create React App

```javascript
// src/index.js
import 'claude-frontend';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### Vue 3

```javascript
// main.js
import { createApp } from 'vue';
import 'claude-frontend';
import App from './App.vue';

createApp(App).mount('#app');
```

## Configuration

### Widget Options

For manual initialization with custom options:

```javascript
import { ClaudeFrontendWidget } from 'claude-frontend';

const widget = new ClaudeFrontendWidget({
  serverPort: 3002,        // Default: 3002
  position: 'bottom-right' // Options: 'bottom-right', 'bottom-left'
});
```

### Settings Panel

Click the settings icon (⚙️) in the widget to configure:

- **Bypass Permissions** - Skip Claude's permission prompts (`--dangerously-skip-permissions`)
- **Continue Chat** - Reuse the same Claude chat session (`-c`)
- **Subagent** - Request specific Claude subagents (e.g., `code-reviewer`)

Settings are saved in localStorage and persist across sessions.

## Advanced Usage

### Conditional Loading

```javascript
// Only load in development
if (process.env.NODE_ENV === 'development') {
  import('claude-frontend');
}
```

### Server-Only Usage

Run the server in any project directory:

```bash
cd /path/to/your/project
npx claude-frontend
```

### Using Subagents

Enter a subagent name in settings to request specialized assistance:
- `fontend-dev` - For code review
- `general-purpose` - For complex tasks
- Custom subagents you've configured

Example: With "code-reviewer" in settings, your request becomes:
"Use the code-reviewer subagent to [your request]"

## How It Works

1. **Widget** runs in your browser for element selection
2. **Local Server** bridges browser and Claude CLI (port 3002)
3. **Claude CLI** receives the context and modifies your code

```
Browser Widget → Local Server → Claude CLI → Your Code
```

## Requirements

- Node.js 14+
- Claude CLI (`npm install -g @anthropic/claude-cli`)
- Active Claude subscription
- Development environment (localhost)

## Troubleshooting

### Widget not appearing?

- Ensure you're on localhost, 127.0.0.1, or a local development URL
- Check that the server is running: `npx claude-frontend`
- Look for errors in the browser console
- Verify the import is in your app's entry point

### Server won't start?

```bash
# Check if port 3002 is in use
lsof -i :3002

# Kill the process if needed
kill -9 <PID>

# Or use a different port (requires manual widget config)
```

### Claude not making changes?

1. Verify Claude CLI is installed:
   ```bash
   claude --version
   ```

2. Check you have an active session:
   ```bash
   claude auth status
   ```

3. Try with bypass permissions in settings

### Element selection issues?

- Some elements may be non-interactive (try their parents)
- Framework dev tools might interfere (disable temporarily)
- Check that JavaScript is enabled

## API Reference

### ClaudeFrontendWidget

```typescript
class ClaudeFrontendWidget {
  constructor(options?: {
    serverPort?: number;      // Default: 3002
    position?: string;        // Default: 'bottom-right'
  });
  
  toggle(): void;             // Toggle widget visibility
  open(): void;               // Open widget
  close(): void;              // Close widget
  clearHighlights(): void;    // Clear all selected elements
}
```

### Global Instance

```javascript
// Access the auto-initialized instance
window.claudeFrontend
```

## Security

- **Local Only** - All communication stays on your machine
- **Development Only** - Automatically disabled in production
- **No External Services** - Direct connection to Claude CLI only
- **No Data Collection** - Your code never leaves your machine

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

- **Issues**: [GitHub Issues](https://github.com/tobias-schuemann/claude-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tobias-schuemann/claude-frontend/discussions)

---

Made with ❤️ for developers who love Claude Code