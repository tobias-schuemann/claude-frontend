// claude-frontend - Visual element inspector for Claude Code
// 
// This is the Node.js entry point.
// Browser environments will use browser.js instead.
//
// Usage in your project:
// 
// Option 1: Auto-inject (recommended)
//   import 'claude-frontend';
// 
// Option 2: Manual control
//   import { ClaudeFrontendWidget } from 'claude-frontend';
//   const widget = new ClaudeFrontendWidget();

// Node.js environment - export everything
const ClaudeFrontendWidget = require('./lib/widget');
const ClaudeCodeServer = require('./lib/server');

// Named exports
module.exports.ClaudeFrontendWidget = ClaudeFrontendWidget;
module.exports.ClaudeCodeServer = ClaudeCodeServer;

// Default export
module.exports.default = ClaudeFrontendWidget;

// CommonJS default
module.exports = ClaudeFrontendWidget;