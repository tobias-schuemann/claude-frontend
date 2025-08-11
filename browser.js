// Browser-only entry point for claude-frontend
// This avoids importing Node.js modules in the browser

const ClaudeFrontendWidget = require('./lib/widget');

// Auto-initialize in browser environment (development only)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const isDev = 
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.includes('.local');

  if (isDev && !window.claudeFrontend) {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.claudeFrontend = new ClaudeFrontendWidget();
        console.log('[Claude Frontend] Widget initialized');
      });
    } else {
      window.claudeFrontend = new ClaudeFrontendWidget();
      console.log('[Claude Frontend] Widget initialized');
    }
  }
}

// Export for manual control
module.exports = ClaudeFrontendWidget;
module.exports.ClaudeFrontendWidget = ClaudeFrontendWidget;
module.exports.default = ClaudeFrontendWidget;